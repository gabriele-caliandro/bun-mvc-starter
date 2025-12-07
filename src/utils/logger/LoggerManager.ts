import { _rootdir } from "@/root-dir";
import { AsyncLocalStorage } from "async_hooks";
import path from "path";
import pino, { type Logger } from "pino";

const is_production = process.env.NODE_ENV === "prod" || process.env.NODE_ENV === "production";

export const transaction_ctx = new AsyncLocalStorage<{
  transaction_id: number;
}>();

export class LoggerManager {
  private static logger: Logger;

  static get_base_logger(): Logger {
    if (LoggerManager.logger === undefined) {
      LoggerManager.logger = this.create_logger();
    }
    return LoggerManager.logger;
  }

  private static create_logger(): Logger {
    const file_transport = pino.transport({
      targets: [
        is_production
          ? {
              target: "pino-roll",
              options: {
                file: path.join(_rootdir, "logs", "application_name.log"),
                dateFormat: "yyyy-MM-dd",
                limit: {
                  count: 60,
                },
                frequency: "daily",
                size: "1M",
                mkdir: true,
                level: "trace",
              },
            }
          : {
              target: "pino-pretty",
              options: {
                destination: path.join(_rootdir, "logs", "application_name.pretty.log"),
                mkdir: true,
                colorize: false,
              },
              level: "trace",
            },
        {
          target: "pino-pretty",
          level: "trace",
        },
      ],
    });
    return pino(
      {
        mixin: () => {
          return {
            transaction_id: transaction_ctx.getStore()?.transaction_id,
          };
        },
        level: process.env.LOG_LEVEL || "info",
        redact: ["*.password"],
        name: "pino-logger",
        timestamp: pino.stdTimeFunctions.isoTime,
      },
      file_transport
    );
  }
}
