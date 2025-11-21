import { logger_middleware } from "@/network/http/middlewares/logger.middleware";
import { get_error_message } from "@/utils/get-error-message";
import { logger } from "@/utils/logger/logger";
import cors from "@elysiajs/cors";
import openapi from "@elysiajs/openapi";
import { Elysia } from "elysia";
import z from "zod";
export class BaseHttpServer {
  public _app: Elysia<"/prefix">;
  public readonly prefix: string;
  public readonly port: number;

  constructor(port: number, prefix: string) {
    this.port = port;
    this.prefix = prefix;
    this._app = new Elysia<"/prefix">({
      prefix: "/prefix",
    });
    this.setup();
  }

  private setup() {
    this._app
      .use(cors())
      .use(
        openapi({
          mapJsonSchema: {
            zod: z.toJSONSchema,
          },
          path: "docs",
        })
      )
      .use(logger_middleware)
      // Health check endpoint
      .get("/health", () => ({ status: "ok" }), {
        response: z.object({ status: z.string() }).meta({
          title: "Health check",
          description: "Health check endpoint",
        }),
      });
  }

  get app() {
    return this._app;
  }

  listen() {
    return this._app.listen(this.port, (server) => {
      logger.info(`Server http listening on ${server.hostname}:${server.port}...`);
      logger.info(`See http://localhost:${server.port}${this.prefix}/docs to explore the API`);
    });
  }
}
