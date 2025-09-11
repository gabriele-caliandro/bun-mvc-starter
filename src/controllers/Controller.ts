import { RouteManager } from "@/controllers/RouteManager";
import type { DatabaseManager } from "@/database/DatabaseManager";
import type { UserManagerI } from "@/interfaces/user-manager/UserManagerI";
import type { Model } from "@/models/Model";
import type { BaseHttpServer } from "@/network/http/BaseHttpServer";
import type { BaseMqttClientI } from "@/network/mqtt/BaseMqttClientI";
import { LoggerManager } from "@/utils/logger/LoggerManager";

const logger = LoggerManager.get_logger({ service: "controller" });
export type ServiceRegistry = {
  db: DatabaseManager;
  userManger: UserManagerI;
  mqtt: BaseMqttClientI;
};
export class Controller {
  constructor(
    private model: Model,
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
    const setupModelPromise = this.initializeModel();

    RouteManager.setupRoutes(this.httpServer, this.model, this.serviceRegistry);
    await Promise.all([setupDatabasePromise, setupHttpServerPromise, setupModelPromise]).catch((err) =>
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
    RouteManager.setupRoutes(this.httpServer, this.model, this.serviceRegistry);
  }

  private async initializeModel() {
    logger.info("Initializing model...");

    // Create areas if they don't exist
    const res = await this.serviceRegistry.db.drizzle.execute("SELECT 1 as test");
    this.model.names.push(res.toString());
  }
}
