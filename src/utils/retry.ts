import { sleep } from "@/utils/sleep";

export type RetryOptions = {
  retries: number;
  delay: number;
};

// TODO: impl this
export async function retry<T>(fn: () => T, opts: RetryOptions): Promise<T> {
  for (let i = 0; i < opts.retries; i++) {
    await fn();
    await sleep(opts.delay);
  }

  throw Error("not implemented");
}
