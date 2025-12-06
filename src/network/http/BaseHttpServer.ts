import { logger_middleware } from "@/network/http/middlewares/logger.middleware";
<<<<<<< Updated upstream
import { get_error_message } from "@/utils/get-error-message";
import { logger } from "@/utils/logger/LoggerManager";
=======
import { version } from "@/version";
>>>>>>> Stashed changes
import cors from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";
import z from "zod";

export const http_api_prefix = "loginautomation/interface/agilox/api" as const;
type ApiPrefix = typeof http_api_prefix;
export const create_base_http_server = () =>
  new Elysia<ApiPrefix>({
    prefix: http_api_prefix,
  })
    .use(cors())
    .use(logger_middleware)
    .use(
      openapi({
        documentation: {
          info: {
            title: "Login Automation - Agilox Interface API",
            description: "API for managing agilox through a more standardized, typesafe, REST-like method through Login Automation conventions",
            version: version,
          },
        },
        mapJsonSchema: {
          zod: z.toJSONSchema,
        },
        path: "docs",
      })
    )
    .post("/health", () => ({ status: "ok" }), {
      detail: {
        summary: "Health check",
        description: "Returns a health check response",
      },
    });
