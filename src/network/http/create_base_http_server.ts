import { logger_middleware } from "@/network/http/middlewares/logger.middleware";
import cors from "@elysiajs/cors";
import openapi from "@elysiajs/openapi";
import { version } from "bun";
import Elysia from "elysia";
import z from "zod";

export const http_api_prefix = "prefix" as const;
export const http_api_docs_prefix = "docs" as const;
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
            title: "App API Documentation",
            description: "App description",
            version: version,
          },
        },
        mapJsonSchema: {
          zod: z.toJSONSchema,
        },
        path: http_api_docs_prefix,
      })
    )
    .post("/health", () => ({ status: "ok" }), {
      detail: {
        summary: "Health check",
        description: "Returns a health check response",
      },
    });
