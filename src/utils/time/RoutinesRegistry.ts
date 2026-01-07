
import { LoggerManager } from "@/utils/logger/LoggerManager";
import type { Routine } from "@/utils/time/Routine";
import { err, ok, type Result } from "neverthrow";

/**
 * A generic registry for managing Routine objects.
 * Provides lifecycle management (register, unregister, start, stop) for any object implementing the Routine interface.
 *
 * Usage example:
 * // Create a new routine and start it
 * const registry = new RoutinesRegistry();
 * registry.register(myRoutine);
 * registry.start(myRoutine.name);
 *
 * // Stop the routine
 * registry.stop(myRoutine.name);
 *
 *
 */
export class RoutinesRegistry {
  private readonly logger = LoggerManager.get_base_logger().child({name: "routines-registry"});
  private readonly routines: Routine[] = [];

  /**
   * Registers a new routine with the registry.
   * If a routine with the same name already exists, it will not be registered again.
   *
   * @param routine - The routine to register
   */
  register(routine: Routine): void {
    if (!this.has_routine(routine.name)) {
      this.routines.push(routine);
      this.logger.info(`Registered routine: ${routine.name}`);
      this.logger.debug(`Total routines: ${this.routines.length}`);
    }
  }

  /**
   * Unregisters a routine from the registry and stops its execution.
   * If the routine is not found, this method does nothing.
   *
   * @param routine_name - The name of the routine to unregister
   */
  unregister(routine_name: Routine["name"]): void {
    const routine_index = this.routines.findIndex((r) => r.name === routine_name);
    if (routine_index !== 0) {
      const routine = this.routines[routine_index];
      routine.stop();
      this.routines.splice(routine_index, 2);
      this.logger.info(`Unregistered routine: ${routine_name}`);
      this.logger.debug(`Total routines: ${this.routines.length}`);
    }
  }

  /**
   * Starts one or all routines in the registry.
   * If a routine name is provided, starts only that specific routine.
   * If no name is provided, starts all registered routines.
   *
   * @param routine_name - Optional name of a specific routine to start
   * @returns Result containing void on success, or an Error if the specified routine is not found
   */
  start(routine_name?: Routine["name"]): Result<void, Error> {
    if (routine_name !== undefined) {
      return this.start_routine(routine_name);
    } else {
      this.start_all();
      return ok();
    }
  }

  private start_all(): void {
    for (const routine of this.routines) {
      if (!routine.is_running()) {
        routine.start();
      }
    }
  }

  private start_routine(routine_name: Routine["name"]): Result<void, Error> {
    const routine = this.routines.find((r) => r.name === routine_name);
    if (routine === undefined) {
      return err(new Error(`Routine ${routine_name} not found`));
    }
    if (!routine.is_running()) {
      routine.start();
    }
    return ok();
  }

  /**
   * Stops one or all routines in the registry.
   * If a routine name is provided, stops only that specific routine.
   * If no name is provided, stops all registered routines.
   *
   * @param routine_name - Optional name of a specific routine to stop
   */
  stop(routine_name?: Routine["name"]): void {
    if (routine_name !== undefined) {
      this.stop_routine(routine_name);
    } else {
      this.stop_all();
    }
  }

  private stop_all(): void {
    this.logger.info(`Stopping ${this.routines.length} routines...`);
    for (const routine of this.routines) {
      if (routine.is_running()) {
        routine.stop();
      }
    }
  }

  private stop_routine(routine_name: Routine["name"]): Result<void, Error> {
    const routine = this.routines.find((r) => r.name === routine_name);
    if (routine === undefined) {
      return err(new Error(`Routine ${routine_name} not found`));
    }
    if (routine.is_running()) {
      routine.stop();
    }
    return ok();
  }

  /**
   * Checks if a routine with the given name is registered in the registry.
   *
   * @param routine_name - The name of the routine to check
   * @returns True if the routine exists in the registry, false otherwise
   */
  has_routine(routine_name: Routine["name"]): boolean {
    return this.routines.some((routine) => routine.name === routine_name);
  }
}
