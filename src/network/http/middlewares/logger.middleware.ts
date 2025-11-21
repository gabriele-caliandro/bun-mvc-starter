import { get_error_message } from "@/utils/get-error-message";
import { logger as logger_factory } from "@/utils/logger/logger";
import Elysia from "elysia";

const logger = logger_factory.child({ serivce: "http" });
export const logger_middleware = new Elysia({ name: "logger-middleware" })
  .derive(
    {
      as: "global",
    },
    () => {
      return {
        start_time: new Date(),
      };
    }
  )
  .onBeforeHandle(
    {
      as: "global",
    },
    ({ request, path, query, body }) => {
      const details: Record<string, unknown> = {};
      if (body !== undefined) {
        details.body = body;
      }

      const formatted_params = query
        ? Object.keys(query)
            .map((key) => `${key}=${query[key]}`)
            .join("&")
        : "";

      logger.info(details, `--> ${request.method} ${path}?${formatted_params} `);
    }
  )
  .onAfterResponse(
    {
      as: "global",
    },
    ({ request, path, set, start_time }) => {
      const duration = start_time ? Date.now() - start_time.getTime() : undefined;

      if (typeof set.status === "number" && set.status > 400) {
        logger.error(`<-- ${request.method} ${path} ${set.status} ${duration ? `${duration}ms` : ""}`);
      } else {
        logger.info(`<-- ${request.method} ${path} ${set.status} ${duration ? `${duration}ms` : ""}`);
      }
    }
  )
  .onError(
    {
      as: "global",
    },
    ({ path, error, code, request, start_time, set }) => {
      const duration = start_time ? Date.now() - start_time.getTime() : undefined;
      if (code === "NOT_FOUND") return "Not Found";

      if (code === "VALIDATION") {
        logger.error(
          {
            type: error.type,
            message_value: error.messageValue,
            error: error.valueError,
          },
          `<-- ${request.method} ${path} ${set.status} ${duration}ms`
        );
      } else {
        logger.error(`${path} Unexpected error: ${get_error_message(error)}`);
      }
    }
  );
