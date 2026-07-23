/**
 * Runs an async callback repeatedly with a fixed *delay* between executions:
 * the next run is scheduled only after the previous one has settled, so two
 * executions can never overlap even if the callback takes longer than the interval.
 */
export class IntervalScheduler {
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(private readonly callback: () => Promise<void>) {}

  /**
   * Starts the loop. The first execution happens immediately.
   * Does nothing if the scheduler is already running.
   */
  start(interval_ms: number): void {
    if (this.running) {
      return;
    }
    this.running = true;

    const execute_and_reschedule = async () => {
      await this.callback();
      // `stop()` may have been called while the callback was in flight:
      // in that case the loop must not resurrect itself.
      if (!this.running) {
        return;
      }
      this.timer = setTimeout(execute_and_reschedule, interval_ms);
    };

    void execute_and_reschedule();
  }

  /**
   * Stops the loop. An execution already in flight runs to completion,
   * but no further execution is scheduled.
   */
  stop(): void {
    this.running = false;
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  is_running(): boolean {
    return this.running;
  }
}
