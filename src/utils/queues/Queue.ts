interface IQueue<T> {
  enqueue(el: T): void;
  dequeue(): T | undefined;
  peek(): T | undefined;
  is_empty(): boolean;
  readonly size: number;
}

export class Queue<T = unknown> implements IQueue<T> {
  readonly items: T[];

  constructor(queue: T[] = []) {
    this.items = queue;
  }

  public enqueue(el: T) {
    this.items.push(el);
  }

  public remove(el: T) {
    const index = this.items.indexOf(el);
    if (index === -1) return;
    this.items.splice(index, 1);
  }

  public dequeue(): T | undefined {
    return this.items.shift();
  }

  peek(): T | undefined {
    return this.items[0];
  }

  is_empty(): boolean {
    return this.items.length === 0;
  }

  get size(): number {
    return this.items.length;
  }
}
