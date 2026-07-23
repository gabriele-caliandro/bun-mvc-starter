import { IntervalScheduler } from "@/utils/time/IntervalScheduler";
import type { Routine } from "@/utils/time/Routine";
import type { Result } from "neverthrow";

/**
 * Abstract base class for executing recurring tasks at regular intervals.
 *
 * `RoutineExecutor` provides a framework for implementing periodic background tasks
 * that need to run continuously throughout the application lifecycle. It manages
 * the scheduling, execution lifecycle, and state tracking of routine operations.
 *
 * @abstract
 * @implements {Routine}
 *
 * @example
 * // Basic implementation of a routine that checks system health
 * class HealthCheckRoutine extends RoutineExecutor {
 *   public readonly name = "HealthCheckRoutine";
 *
 *   constructor() {
 *     super(5000); // Execute every 5 seconds
 *   }
 *
 *   async execute(): Promise<Result<void, Error>> {
 *     try {
 *       // Perform health check logic
 *       const isHealthy = await this.checkSystemHealth();
 *
 *       if (!isHealthy) {
 *         console.warn("System health check failed");
 *       }
 *
 *       return ok(undefined);
 *     } catch (error) {
 *       return err(new Error(`Health check failed: ${error.message}`));
 *     }
 *   }
 *
 *   private async checkSystemHealth(): Promise<boolean> {
 *     // Implementation details...
 *     return true;
 *   }
 * }
 *
 * @example
 * // Advanced: Database cleanup routine
 * class DatabaseCleanupRoutine extends RoutineExecutor {
 *   public readonly name = "DatabaseCleanupRoutine";
 *
 *   constructor(private db: Database) {
 *     super(60000); // Run every minute
 *   }
 *
 *   async execute(): Promise<Result<void, Error>> {
 *     try {
 *       const deleted = await this.db.deleteExpiredRecords();
 *       console.log(`Cleaned up ${deleted} expired records`);
 *       return ok(undefined);
 *     } catch (error) {
 *       return err(new Error(`Cleanup failed: ${error.message}`));
 *     }
 *   }
 * }
 *
 * // Register and manage with RoutinesRegistry
 * const registry = RoutinesRegistry.getInstance();
 * const cleanup = new DatabaseCleanupRoutine(database);
 * registry.register(cleanup);
 * registry.start(cleanup.name);
 *
 * @remarks
 * - Subclasses must implement the `execute()` method with their specific logic
 * - Subclasses must define a unique `name` property for identification
 * - The execution interval can be set in the constructor and overridden at runtime
 * - Uses `IntervalScheduler` internally for reliable interval-based execution
 * - Execution errors are returned as `Result<void, Error>` for proper error handling
 *
 * @see {@link Routine} for the interface contract
 * @see {@link IntervalScheduler} for the underlying scheduling mechanism
 * @see {@link RoutinesRegistry} for managing multiple routines
 */
export abstract class RoutineExcecutor implements Routine {
  /**
   * Unique identifier for this routine.
   * Used for registration, logging, and lifecycle management.
   */
  public abstract readonly name: string;

  private scheduler: IntervalScheduler;

  /**
   * The interval in milliseconds between routine executions.
   * Can be modified at runtime using the `start()` method.
   */
  execution_interval_ms: number;

  /**
   * Creates a new routine executor with the specified execution interval.
   *
   * @param execution_interval_ms - The interval in milliseconds between executions
   *
   * @example
   * constructor() {
   *   super(30000); // Execute every 30 seconds
   * }
   */
  constructor(execution_interval_ms: number) {
    this.execution_interval_ms = execution_interval_ms;
    this.scheduler = new IntervalScheduler(async () => {
      await this.execute();
    });
  }

  /**
   * Executes the routine's main logic.
   *
   * This method is called automatically by the scheduler at the configured interval.
   * Subclasses must implement this method with their specific routine logic.
   *
   * @returns A Promise resolving to a Result indicating success or failure
   *
   * @abstract
   *
   * @example
   * async execute(): Promise<Result<void, Error>> {
   *   try {
   *     // Your routine logic here
   *     await this.performTask();
   *     return ok(undefined);
   *   } catch (error) {
   *     return err(new Error(`Task failed: ${error.message}`));
   *   }
   * }
   */
  abstract execute(): Promise<Result<void, Error>>;

  /**
   * Starts the routine execution with the specified or default interval.
   *
   * If the routine is already running, it will be restarted with the new interval.
   * If no interval is provided, uses the interval from the constructor.
   *
   * @param execution_interval_ms - Optional new interval in milliseconds
   *
   * @example
   * // Start with default interval
   * routine.start();
   *
   * @example
   * // Override interval at runtime
   * routine.start(10000); // Execute every 10 seconds
   */
  start(execution_interval_ms?: number): void {
    this.execution_interval_ms = execution_interval_ms ?? this.execution_interval_ms;
    this.scheduler.start(this.execution_interval_ms);
  }

  /**
   * Stops the routine execution.
   *
   * The routine will complete any ongoing execution before stopping.
   * Can be restarted later by calling `start()`.
   *
   * @example
   * routine.stop();
   * console.log(routine.is_running()); // false
   */
  stop(): void {
    this.scheduler.stop();
  }

  /**
   * Checks whether the routine is currently running.
   *
   * @returns `true` if the routine is actively scheduled, `false` otherwise
   *
   * @example
   * if (!routine.is_running()) {
   *   routine.start();
   * }
   */
  is_running(): boolean {
    return this.scheduler.is_running();
  }
}
