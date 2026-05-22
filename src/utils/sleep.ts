export function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted === true) {
      return reject(signal.reason);
    }

    const timeout = setTimeout(() => {
      signal?.removeEventListener("abort", on_abort);
      resolve();
    }, ms);

    const on_abort = () => {
      clearTimeout(timeout);
      reject(signal!.reason);
    };

    signal?.addEventListener("abort", on_abort, { once: true });
  });
}
