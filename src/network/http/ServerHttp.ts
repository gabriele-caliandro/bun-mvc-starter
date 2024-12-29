import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { LoggerManager } from "@/utils/logger/LoggerManager";

const logger = await LoggerManager.createLogger({ service: "http" });
export class ServerHttp {
  private _app: Elysia;
  public readonly prefix: string;
  public readonly port: number;

  constructor(port: number, prefix: string) {
    this.port = port;
    this.prefix = prefix;
    this._app = new Elysia();
    this.setup();
  }

  private setup() {
    this._app.use(swagger()).onError(({ error, code }) => {
      if (code === "NOT_FOUND") return "Not Found";

      console.error(error);
    });
  }

  get app() {
    return this._app;
  }

  listen() {
    return this._app.listen(this.port, (server) => {
      logger.info(`Server http listening on ${server.hostname}:${server.port}...`);
    });
  }

  /**
   * Inject the passed model into the Elysia app.
   * @param model
   */
  static modelPlugin<T>(model: T) {
    return new Elysia({ name: "model" }).decorate("model", model);
  }
}
