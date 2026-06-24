import type { Queue } from "@/utils/queues/Queue";

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

      // If in the meantime a new event
      if (!this.queue.is_empty()) {
        this.wake = null;
        continue;
      }

      await feedback_promise;
      this.wake = null;
    }
  }
}
