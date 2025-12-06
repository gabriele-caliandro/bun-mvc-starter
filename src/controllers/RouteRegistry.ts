<<<<<<< Updated upstream
import name from "@/api/v1/name/[id]/route";
import type { ServiceRegistry } from "./ServiceRegistry";
import type { Model } from "@/models/Model";
import type { BaseHttpServer } from "@/network/http/BaseHttpServer";
import { logger as baseLogger } from "@/utils/logger/LoggerManager";
=======
import type { ServiceRegistry } from "@/controllers/ServiceRegistry";
import { create_base_http_server } from "@/network/http/BaseHttpServer";
import { vehicles_routes } from "@/api/vehicles/route";
>>>>>>> Stashed changes

export const create_agilox_interface_app = (service_registry: ServiceRegistry) =>
  create_base_http_server().use(vehicles_routes(service_registry));

export type AgiloxInterfaceApp = ReturnType<typeof create_agilox_interface_app>;
