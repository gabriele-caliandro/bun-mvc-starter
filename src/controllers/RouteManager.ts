import name from "@/api/v1/name/[id]/route";
import type { ServiceRegistry } from "@/controllers/Controller";
import type { Model } from "@/models/Model";
import type { BaseHttpServer } from "@/network/http/BaseHttpServer";
import { LoggerManager } from "@/utils/logger/LoggerManager";

const logger = LoggerManager.get_logger({ service: "route-manager" });
export class RouteManager {
  static setupRoutes(http: BaseHttpServer, model: Model, serviceRegistry: ServiceRegistry) {
    logger.info("Setting up routes for http server");

    // Health check endpoint
    http.app.get("/health", () => ({ status: "ok" }));

    // Group model-related endpoints under /api
    http.app.group(http.prefix, (app) => app.use(name(model, serviceRegistry)));
  }
}
