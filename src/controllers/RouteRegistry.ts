import name from "@/api/v1/name/[id]/route";
import type { ServiceRegistry } from "./ServiceRegistry";
import type { Model } from "@/models/Model";
import type { BaseHttpServer } from "@/network/http/BaseHttpServer";
import { logger as baseLogger } from "@/utils/logger/LoggerManager";

const logger = baseLogger.child({ service: "route-manager" });
export class RouteRegistry {
  static setupRoutes(http: BaseHttpServer, model: Model, serviceRegistry: ServiceRegistry) {
    logger.info("Setting up routes for http server");

    
    http.app.use(name(model, serviceRegistry));
  }
}
