import { loggerMiddleware } from "@/network/http/middlewares/logger.middleware";
import { TAGS } from "@/network/http/tags";
import { getErrorMessage } from "@/utils/get-error-message";
import { LoggerManager } from "@/utils/logger/LoggerManager";
import { version } from "@/version";
import { swagger } from "@elysiajs/swagger";
import cors from "@elysiajs/cors";
import { Elysia } from "elysia";

const logger = LoggerManager.get_logger({ service: "http-server" });
export class BaseHttpServer {
  public _app: Elysia;
  public readonly prefix: string;
  public readonly port: number;

  constructor(port: number, prefix: string) {
    this.port = port;
    this.prefix = prefix;
    this._app = new Elysia();
    this.setup();
  }

  private setup() {
    this._app
      .use(cors())
      .use(
        swagger({
          documentation: {
            info: {
              title: "Documentation title example",
              description: "API for the documentation example",
              version: version,
            },
            tags: Object.values(TAGS),
          },
        })
      )
      .use(loggerMiddleware)
      .onError(({ error }) => {
        logger.error(`Unexpected error: ${getErrorMessage(error)}`);
      }) // Health check endpoint
      .get("/health", () => ({ status: "ok" }));
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

  /**
   * Inject the passed model into the Elysia app.
   * @param model
   */
  static modelPlugin<T>(model: T) {
    return new Elysia({ name: "model" }).decorate("model", model);
  }
  /**
   * Inject services registry into the Elysia app.
   * @param model
   */
  static registerPlugin<T>(serviceRegistry: T) {
    return new Elysia({ name: "service-registry" }).decorate("serviceRegistry", serviceRegistry);
  }
}
