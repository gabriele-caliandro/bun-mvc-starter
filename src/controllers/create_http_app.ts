import { users_routes } from "@/api/v1/users/route";
import { create_base_http_server } from "@/network/http/create_base_http_server";
import type { ServiceRegistry } from "./ServiceRegistry";

export const create_http_app = (service_registry: ServiceRegistry) =>
  create_base_http_server()
    // === Users ===
    .use(users_routes(service_registry));

export type HttpApp = ReturnType<typeof create_http_app>;
