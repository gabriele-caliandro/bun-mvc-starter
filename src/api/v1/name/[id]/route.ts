import { with_models } from "@/api/plugins/with-models";
import { with_service_registry } from "@/api/plugins/with-service-registry";
import { TAGS } from "@/network/http/tags";
import type { ServiceRegistry } from "@/services/ServiceRegistry";
import Elysia from "elysia";
import z from "zod";

/**
 * This is an example of a route handler
 * @param model
 * @param serviceRegistry
 * @returns
 */
const name = (serviceRegistry: ServiceRegistry) =>
  new Elysia()
    .use(with_models())
    .use(with_service_registry(serviceRegistry))
    .post(
      "/name/:id",
      async ({ params: { id }, service_registry, status }) => {
        const user = await service_registry.user_manager.getUserById(id);

        if (!name) {
          return status(404, {
            error: "Robotic cell not found",
          });
        }

        return user;
      },
      {
        response: {
          200: "UserSchema",
          404: z.object({
            error: z.string(),
          }),
        },
        detail: {
          summary: "Get name by Id",
          tags: [TAGS.OPEN_API_TAG.name],
        },
      }
    );

export default name;
