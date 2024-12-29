import name from "@/api/v1/name/[id]";
import type { Model } from "@/models/Model";
import type { ServerHttp } from "@/network/http/ServerHttp";
import { LoggerManager } from "@/utils/logger/LoggerManager";

const logger = await LoggerManager.createLogger({ service: "controller" });
export class Controller {
  private model: Model;
  private http: ServerHttp;

  constructor(model: Model, http: ServerHttp) {
    this.model = model;
    this.http = http;
  }

  /**
   * Initializes the controller by connecting to the OPC UA servers.
   * Exception handling is left to the caller as this method is mandatory for the controller to run.
   */
  async init() {
    logger.info("Initializing controller...");

    this.setupHttpRoutes();
  }

  async run() {
    logger.info("Starting controller...");

    this.http.listen();
  }

  private setupHttpRoutes() {
    logger.info("Setupping routes for http server");

    // Group model-related endpoints under /api
    this.http.app.group(this.http.prefix, (app) => app.use(name(this.model)));
  }
}
