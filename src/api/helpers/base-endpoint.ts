import { with_models } from "@/api/plugins/with-models";
import { with_service_registry } from "@/api/plugins/with-service-registry";
import type { ServiceRegistry } from "@/controllers/ServiceRegistry";
import bearer from "@elysia/bearer";
import Elysia from "elysia";

export const base_endpoint = (service_registry: ServiceRegistry) =>
  new Elysia().use(bearer()).use(with_models()).use(with_service_registry(service_registry));
