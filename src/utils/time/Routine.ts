
export interface Routine {
  name: string;
  start(interval_ms?: number): void;
  stop(): void;
  is_running(): boolean;
}
