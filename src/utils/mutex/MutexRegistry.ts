import { Mutex } from "@/utils/mutex/Mutex";

export const MUTEXES = {
  EXAMPLE: "example",
} as const;
type MutexType = keyof typeof MUTEXES;

/**
 * Registry for mutexes
 */
export class MutexRegistry {
  private static mutexes = new Map<MutexType, Mutex>();

  static get(name: MutexType): Mutex {
    if (!this.mutexes.has(name)) {
      this.mutexes.set(name, new Mutex());
    }
    return this.mutexes.get(name)!;
  }
}
