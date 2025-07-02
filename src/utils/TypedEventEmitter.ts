import EventEmitter from "events";

type EventMap = Record<string, unknown>;
/**
 * Example:
 * type EventMap = {
 *   "foo": string;
 *   "bar": BarPayload;
 * }
 * where "foo" and "bar" are the event names and string and BarPayload are the payloads
 */

type EventKey<T extends EventMap> = string & keyof T;
type EventReceiver<T> = (params: T) => void;

interface Emitter<T extends EventMap> {
  on<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void;
  off<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void;
  emit<K extends EventKey<T>>(eventName: K, params: T[K]): void;
}

export class MyEventEmitter<T extends EventMap> implements Emitter<T> {
  private emitter = new EventEmitter();

  on<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>) {
    this.emitter.on(eventName, fn);
  }

  off<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>) {
    this.emitter.off(eventName, fn);
  }

  emit<K extends EventKey<T>>(eventName: K, params: T[K]) {
    this.emitter.emit(eventName, params);
  }
}
