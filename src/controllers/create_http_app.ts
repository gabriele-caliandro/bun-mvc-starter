import { create_base_http_server } from "@/network/http/create_base_http_server";
import type { ServiceRegistry } from "./ServiceRegistry";
import { with_service_registry } from "@/api/plugins/with-service-registry";

export const create_http_app = (service_registry: ServiceRegistry) => create_base_http_server().use(with_service_registry(service_registry));

export type HttpApp = ReturnType<typeof create_http_app>;
