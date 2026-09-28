import type { Queue } from "@/utils/queues/Queue";

/**
 * NOTE: single-consumer only. Concurrent `take()` calls overwrite `wake`,
 * leaving earlier waiters stuck forever.
 */
export class BlockingQueue<T = unknown> {
  private wake: (() => void) | null = null;

  constructor(private queue: Queue<T>) {}

  put(e: T) {
    this.queue.enqueue(e);
    this.wake?.();
  }

  async take(): Promise<T> {
    while (true) {
      const el = this.queue.dequeue();
      if (el !== undefined) return el;

      const feedback_promise = new Promise<void>((resolve) => {
        this.wake = resolve;
      });

      await feedback_promise;
      this.wake = null;
    }
  }
}
