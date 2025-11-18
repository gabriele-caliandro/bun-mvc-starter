import { get_error_message } from "@/utils/get-error-message";
import { LoggerManager } from "@/utils/logger/LoggerManager";
import cors from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";
import z from "zod";

const logger = LoggerManager.get_logger({ service: "http-server" });
export class BaseHttpServer {
  public readonly PREFIX = "/prefix";
  public readonly app: Elysia<"/prefix">;
  public readonly port: number;

  constructor(port: number) {
    this.port = port;
    this.app = new Elysia({
      prefix: this.PREFIX,
    });
    this.setup();
  }

  private setup() {
    this.app
      .use(cors())
      .use(
        openapi({
          mapJsonSchema: {
            zod: z.toJSONSchema,
          },
          path: "/docs",
        })
      )
      .onTransform(({ body, params, path, query, request: { method } }) => {
        const queryParams = Object.entries(query)
          .map(([key, value]) => `${key}=${value}`)
          .join("&");

        const details: Record<string, unknown> = {};
        if (method !== "GET" && body !== undefined) {
          details.body = body;
        }
        if (params) {
          details.params = params;
        }

        logger.info(
          `${method} ${path}${queryParams !== "" ? `?${queryParams}` : ""}`,
          Object.keys(details).length !== 0 ? { details } : undefined
        );
      })
      .onError(({ error }) => {
        logger.error(`Unexpected error: ${get_error_message(error)}`);
      }) // Health check endpoint
      .get("/health", () => ({ status: "ok" }));
  }

  listen() {
    return this.app.listen(this.port, (server) => {
      logger.info(`Server http listening on ${server.hostname}:${server.port}...`);
      logger.info(`See http://localhost:${server.port}${this.PREFIX}/docs to explore the API`);
    });
  }
}
