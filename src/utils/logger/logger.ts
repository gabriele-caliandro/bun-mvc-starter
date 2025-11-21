import { _rootdir } from "@/_rootdir";
import { AsyncLocalStorage } from "async_hooks";
import path from "path";
import pino from "pino";

const is_production = process.env.NODE_ENV === "prod" || process.env.NODE_ENV === "production";

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

const ctx = new AsyncLocalStorage<{
  req_id: number;
}>();

export const logger = pino(
  {
    redact: ["*.password"],
    name: "pino-logger",
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  file_transport
);
