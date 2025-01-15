import name from "@/api/v1/name/[id]";
import type { Model } from "@/models/Model";
import type { ServerHttp } from "@/network/http/ServerHttp";
import { LoggerManager } from "@/utils/logger/LoggerManager";

const logger = await LoggerManager.createLogger({ service: "route-manager" });
export class RouteManager {
  static setupRoutes(http: ServerHttp, model: Model) {
    logger.info("Setting up routes for http server");

    // Health check endpoint
    http.app.get("/health", () => ({ status: "ok" }));

    // Group model-related endpoints under /api
    http.app.group(http.prefix, (app) => app.use(name(model)));
  }
}
