export class FifoQueue<T> {
  private queue: T[] = [];

  constructor() {}

  dequeue(): T | null {
    if (this.queue.length === 0) return null;
    const oldest_el = this.queue.splice(0, 1).at(0) ?? null;
    return oldest_el;
  }

  remove(el: T) {
    const index = this.queue.findIndex((queue_el) => queue_el === el);
    if (index !== -1) {
      this.queue.splice(index, 1);
    }
  }

  push(el: T) {
    this.queue.push(el);
  }
}
