
import { base_endpoint } from "@/api/helpers/base-endpoint";
import type { ServiceRegistry } from "@/controllers/ServiceRegistry";

export const protected_endpoint = (args: { permission: string[]; service_registry: ServiceRegistry }) => {
  return (
    base_endpoint(args.service_registry)
      // Authentication
      .onBeforeHandle(({ bearer, status, service_registry }) => {
        // validate JWT
      })
      // Authorization check
      .onBeforeHandle(async ({ bearer, headers, status, service_registry }) => {
        // get user permissions
        // validate permissions
      })
  );
};
