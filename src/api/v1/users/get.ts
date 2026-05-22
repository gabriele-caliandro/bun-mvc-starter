import { base_endpoint } from "@/api/helpers/base-endpoint";
import type { ServiceRegistry } from "@/controllers/ServiceRegistry";

export const get_users = (service_registry: ServiceRegistry) =>
  base_endpoint(service_registry).get("/v1/users", () => {
    return "users";
  });
