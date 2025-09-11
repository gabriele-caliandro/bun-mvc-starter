import { formats } from "@/utils/logger/formats";
import { type LogLevel, log_levels } from "@/utils/logger/log-levels";
import { access, mkdir } from "node:fs/promises";
import winston, { Logger } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

/**
 * Creates a singleton logger instance with multiple transports.
 * The logger is configured with the following transports:
 * - DailyRotateFile: logs are written to a file in the logs directory, named after the current date
 * - Console: logs are written to the console with colors
 *
 * Usage example:
 * const logger = LoggerManager.createLogger();
 * logger.info("Hello, world!");
 *
 * // Output:
 * // [2024-03-01 12:34:56.789] [INFO] [logaut-interface-pacobot] Hello, world!
 */
export class LoggerManager {
  private static logs_dir: string = "logs";
  private static loggers = new Map<string, Logger>();

  /**
   * Ensures the log directory exists and is writable.
   */
  static async ensure_log_directory(): Promise<void> {
    try {
      await access(this.logs_dir);
    } catch {
      await mkdir(this.logs_dir, { recursive: true });
    }
  }

  /**
   * Setups the logger with daily rotation and multiple transports.
   * In detail, the logger is configured with the following transports:
   * - DailyRotateFile: logs are written to a file in the logs directory, named after the current date
   * - DailyRotateFile: pretty logs are written to a file in the logs directory, named after the current date with _pretty suffix
   * - Console: logs are written to the console with colors
   */
  static get_logger(params?: { lvl?: LogLevel; service?: string }): winston.Logger {
    const service = params?.service ?? "";
    if (!this.loggers.has(service)) {
      const logger = LoggerManager.create_logger({ service });
      this.loggers.set(service, logger);
    }
    return this.loggers.get(service)!;
  }

  private static create_logger(params?: { lvl?: LogLevel; service?: string }) {
    // Pretty formatted logs
    const pretty_file_rotate_transport = new DailyRotateFile({
      dirname: LoggerManager.logs_dir,
      filename: "%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxSize: "21m",
      format: formats.prettyFile,
    });

    // Console transport with colors
    const console_transport = new winston.transports.Console({
      format: formats.console,
    });

    const logger = winston.createLogger({
      levels: log_levels,
      level: params?.lvl ?? "info",
      defaultMeta: { service: params?.service },
      transports: [pretty_file_rotate_transport, console_transport],
    });

    const l = logger.child({ service: params?.service });

    return l;
  }
}
