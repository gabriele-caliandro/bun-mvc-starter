import { FifoQueue } from "@/utils/queues/FifoQueue";
import { err, ok, type Result } from "neverthrow";

export class MutexTimoutError extends Error {
  constructor({ actor }: { actor: string }) {
    super(`Timeout exceeded for ${actor}`);
    this.name = "MUTEX_TIMEOUT_ERROR";
  }
}

export type MutexOptions = {
  timeout?: number | false;
};

/**
 * Usage:
 *
 * ```typescript
 * const mutex = MutexRegistry.get(MUTEXES.EXAMPLE);
 * const owner = "owner";
 * const lock_res = await mutex.lock(owner);
 *
 * if (lock_res.isOk()) {
 *   // do the thing
 *   mutex.unlock(owner);
 * } else {
 *   // e.g. reject or retry
 * }
 * ```
 */
export class Mutex {
  private DEFAULT_TIMEOUT = 5_000;

  private owner: string | null = null;
  private waiters = new FifoQueue<() => void>();

  constructor() {}

  /**
   * Locks the mutex.
   * If the mutex is already locked, it waits for the mutex to be unlocked.
   *
   * Options:
   * @param opts.timeout - timeout in milliseconds or false to disable timeout. Default is 5 seconds.
   */
  async lock(owner: string, opts?: MutexOptions): Promise<Result<void, MutexTimoutError>> {
    const res = await this.wait(owner, opts);
    if (res.isErr()) {
      return err(res.error);
    }
    this.owner = owner;
    return ok();
  }

  is_locked(): boolean {
    return this.owner != null;
  }

  unlock(owner: string) {
    if (this.owner !== owner) return;
    this.owner = null;
    const oltest_waiter = this.waiters.dequeue();
    if (oltest_waiter != null) {
      oltest_waiter();
    }
  }

  private async wait(owner: string, opts?: MutexOptions) {
    if (!this.is_locked()) return ok();

    const promise = new Promise<Result<void, MutexTimoutError>>((res) => {
      const awake = () => res(ok());
      this.waiters.push(awake);

      if (opts?.timeout !== false) {
        setTimeout(() => {
          this.waiters.remove(awake);
          res(err(new MutexTimoutError({ actor: owner })));
        }, opts?.timeout ?? this.DEFAULT_TIMEOUT);
      }
    });
    return promise;
  }
}
