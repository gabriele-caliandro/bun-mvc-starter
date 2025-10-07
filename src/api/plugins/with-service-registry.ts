import type { ServiceRegistry } from "@/controllers/ServiceRegistry";
import Elysia from "elysia";

export const with_service_registry = (service_registry: ServiceRegistry) => {
  return new Elysia({ name: "service-registry" }).decorate("service_registry", service_registry);
};
