/**
 * This class is used to schedule a callback to be executed at a given interval.
 * It is useful for tasks that need to be executed periodically
 */
export class IntervalScheduler {
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly callback: () => Promise<void>,
    private readonly interval_ms: number
  ) {}

  start(): void {
    if (this.is_running()) {
      return;
    }

    const execute_and_reschedule = async () => {
      await this.callback();
      this.timer = setTimeout(execute_and_reschedule, this.interval_ms);
    };

    this.timer = setTimeout(execute_and_reschedule, this.interval_ms);
    execute_and_reschedule();
  }

  stop(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  is_running(): boolean {
    return this.timer !== null;
  }
}
