import { base_endpoint } from "@/api/helpers/base-endpoint";
import type { ServiceRegistry } from "@/controllers/ServiceRegistry";
import z from "zod";

export const get_user_by_id = (service_registry: ServiceRegistry) =>
  base_endpoint(service_registry).get(
    "/v1/users/:id",
    ({ params }) => {
      return "users" + params.id;
    },
    {
      params: z.object({
        id: z.string(),
      }),
    }
  );
