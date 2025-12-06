import { _rootdir } from "@/root-dir";
import { AsyncLocalStorage } from "async_hooks";
import path from "path";
import pino, { type Logger } from "pino";

const is_production = process.env.NODE_ENV === "prod" || process.env.NODE_ENV === "production";

const transaction_ctx = new AsyncLocalStorage<{
  transaction_id: number;
}>();

process.on("exit", (code) => {
  if (code === 0) {
    base_logger.info("Exiting with code 0");
  } else {
    base_logger.fatal(`Exiting with code ${code}`);
  }
});

process.on("uncaughtException", (err) => {
  // log the exception
  base_logger.fatal(err, "uncaught exception detected");

  // If a graceful shutdown is not achieved after 1 second,
  // shut down the process completely
  setTimeout(() => {
    process.abort(); // exit immediately and generate a core dump file
  }, 1000).unref();
  process.exit(1);
});
process.on("SIGTERM", async () => {
  base_logger.flush(); // Force buffer flush
  process.exit(0);
});
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
                size: "5K",
                mkdir: true,
              },
            }
          : {
              target: "pino-pretty",
              options: {
                destination: path.join(_rootdir, "logs", "application_name.pretty.log"),
                mkdir: true,
                colorize: false,
              },
            },
        {
          target: "pino-pretty",
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
        redact: ["*.password", "*.apikey", "machine_apikey"],
        name: "pino-logger",
        timestamp: pino.stdTimeFunctions.isoTime,
      },
      file_transport
    );
  }
}

// Export a convenience logger instance for files that need it
export const base_logger = LoggerManager.get_base_logger();
