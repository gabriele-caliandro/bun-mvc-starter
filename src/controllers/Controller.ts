import { ApiRegistry } from "@/controllers/ApiRegistry";
import type { BaseHttpServer } from "@/network/http/BaseHttpServer";
import type { ServiceRegistry } from "@/services/ServiceRegistry";
import { LoggerManager } from "@/utils/logger/LoggerManager";

const logger = LoggerManager.get_logger({ service: "controller" });

export class Controller {
  constructor(
    private httpServer: BaseHttpServer,
    private serviceRegistry: ServiceRegistry
  ) {}

  /**
   * Initializes the controller.
   */
  async init() {
    logger.info("Initializing controller...");

    const setupDatabasePromise = this.initializeDatabase();
    const setupHttpServerPromise = this.initializeHttpServer();

    ApiRegistry.setupRoutes(this.httpServer, this.serviceRegistry);
    await Promise.all([setupDatabasePromise, setupHttpServerPromise]).catch((err) =>
      logger.error("Error while initializing controller: ", err)
    );
  }

  async run() {
    logger.info("Starting controller...");

    this.httpServer.listen();
  }

  private async initializeDatabase() {
    logger.info("Initializing database...");
    return this.serviceRegistry.db.init();
  }

  private async initializeHttpServer() {
    logger.info("Initializing server http...");

    // Registering all the routes:
    logger.info("Setup http routes...");
    ApiRegistry.setupRoutes(this.httpServer, this.serviceRegistry);
  }
}
