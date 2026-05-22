import { get_user_by_id } from "@/api/v1/users/[id]/get";
import { get_users } from "@/api/v1/users/get";
import type { ServiceRegistry } from "@/controllers/ServiceRegistry";
import Elysia from "elysia";

export const users_routes = (service_registry: ServiceRegistry) =>
  new Elysia().use(get_users(service_registry)).use(get_user_by_id(service_registry));
