import type { EnhancedLogger } from "@/utils/logger/EnhancedLogger";
import { formats } from "@/utils/logger/formats";
import { access, mkdir } from "node:fs/promises";
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import type { AbstractConfigSetLevels } from "winston/lib/winston/config";

const logLevels = {
  fatal: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  trace: 5,
} as const satisfies AbstractConfigSetLevels;
export type LogLevel = keyof typeof logLevels;

/**
 * Creates a singleton logger instance with multiple transports.
 * The logger is configured with the following transports:
 * - DailyRotateFile: logs are written to a file in the logs directory, named after the current date
 * - Console: logs are written to the console with colors
 *
 * Usage example:
 * const logger = await LoggerManager.createLogger();
 * logger.info("Hello, world!");
 *
 * // Output:
 * // [2023-03-01 12:34:56.789] [INFO] [logaut-interface-pacobot] Hello, world!
 */
export class LoggerManager {
  private static instance: LoggerManager | null = null;
  private static logsDir: string = "logs";
  private static readonly DEFAULT_SERVICE = "logaut-interface-pacobot";

  /**
   * Ensures the log directory exists and is writable.
   */
  private static async ensureLogDir(): Promise<void> {
    try {
      await access(this.logsDir);
    } catch {
      await mkdir(this.logsDir, { recursive: true });
    }
  }

  /**
   * Setups the logger with daily rotation and multiple transports.
   * In detail, the logger is configured with the following transports:
   * - DailyRotateFile: logs are written to a file in the logs directory, named after the current date
   * - DailyRotateFile: pretty logs are written to a file in the logs directory, named after the current date with _pretty suffix
   * - Console: logs are written to the console with colors
   */
  static async createLogger(props?: { lvl?: LogLevel; service?: string }): Promise<EnhancedLogger> {
    await LoggerManager.ensureLogDir();

    // Pretty formatted logs
    const prettyFileRotateTransport = new DailyRotateFile({
      dirname: LoggerManager.logsDir,
      filename: "%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      format: formats.prettyFile,
    });

    // Console transport with colors
    const consoleTransport = new winston.transports.Console({
      format: formats.console,
    });

    const logger = winston.createLogger({
      levels: logLevels,
      level: props?.lvl ?? "info",
      defaultMeta: { service: props?.service ?? LoggerManager.DEFAULT_SERVICE },
      transports: [prettyFileRotateTransport, consoleTransport],
    });

    const l = logger.child({
      service: LoggerManager.DEFAULT_SERVICE,
    }) as EnhancedLogger;

    l.breakLine = () => {
      logger.info("", { noTimestamp: true, noService: true, noLvl: true });
    };
    l.spacer = (char, lvl = "info", length = 120) => {
      logger.log(lvl, char.repeat(length), {
        noTimestamp: true,
        noService: true,
        noLvl: true,
      });
    };

    return l;
  }
}
