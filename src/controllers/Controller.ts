import { create_http_app } from "@/controllers/create_http_app";
import type { ServiceRegistry } from "@/controllers/ServiceRegistry";
import { http_api_docs_prefix, http_api_prefix } from "@/network/http/create_base_http_server";
import { base_logger, LoggerManager } from "@/utils/logger/logger";

export class Controller {
  public readonly app: ReturnType<typeof create_http_app>;
  private readonly logger = LoggerManager.get_base_logger().child({ name: "controller" });
  private readonly port: number;
  private readonly service_registry: ServiceRegistry;

  constructor(port: number, service_registry: ServiceRegistry) {
    this.port = port;
    this.service_registry = service_registry;
    this.app = create_http_app(service_registry);
  }

  /**
   * Initializes the controller.
   * Use this to setup all the connections, initial state, handler etc.
   */
  async init() {
    this.logger.info("Initializing controller...");
  }

  async run() {
    this.logger.info("Starting controller...");

    this.app.listen({ port: this.port }, (s) => {
      this.logger.info(`Server started. Check documentation in ${s.url}${http_api_prefix}/${http_api_docs_prefix}`);
    });
  }
}
