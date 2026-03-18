import type { Mutex, MutexOptions } from "@/utils/mutex/Mutex";
import { result_async_from_promise } from "@/utils/neverthrow/result-async-from-promise";
import { err, ok, type ResultAsync } from "neverthrow";

type WithMutexOptions = {
  retries?: number;
} & MutexOptions;

/**
 * Executes a function with a mutex.
 *
 * Usage:
 *
 * const mutex = MutexRegistry.get(MUTEXES.EXAMPLE);
 * const res = await with_mutex(mutex, "owner", async () => {
 *   // do the thing
 * }, { retries: 3 });
 */
export function with_mutex<T>(
  mutex: Mutex,
  owner: string,
  fn: () => Promise<T>,
  opts: WithMutexOptions = {
    retries: 1,
  }
): ResultAsync<T, Error> {
  return result_async_from_promise(async () => {
    for (let i = 0; i < (opts.retries ?? 1); i++) {
      const lock_res = await mutex.lock(owner);
      if (lock_res.isErr()) {
        continue;
      } else {
        return fn()
          .then((res) => ok(res))
          .finally(() => {
            mutex.unlock(owner);
          });
      }
    }
    return err(new Error("Max retries exceeded"));
  });
}
