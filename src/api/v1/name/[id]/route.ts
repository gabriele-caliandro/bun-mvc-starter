import { with_service_registry } from "@/api/plugins/with-service-registry";
import { UserSchema } from "@/interfaces/user-manager/dto/user.dto";
import type { Model } from "@/models/Model";
import { BaseHttpServer } from "@/network/http/BaseHttpServer";
import { TAGS } from "@/network/http/tags";
import type { ServiceRegistry } from "@/services/ServiceRegistry";
import Elysia, { t } from "elysia";

/**
 * This is an example of a route handler
 * @param model
 * @param serviceRegistry
 * @returns
 */
const name = (model: Model, serviceRegistry: ServiceRegistry) =>
  new Elysia()
    .use(BaseHttpServer.modelPlugin(model))
    .use(with_service_registry(serviceRegistry))
    .post(
      "/name/:id",
      async ({ params: { id }, service_registry, model, status }) => {
        // This is a mock implementation
        const name = model.names.at(Number.parseInt(id));

        const user = await service_registry.userManger.getUserById(id);

        if (!name) {
          return status(404, {
            error: "Robotic cell not found",
          });
        }

        return user;
      },
      {
        response: {
          200: UserSchema,
          404: t.Object({
            error: t.String(),
          }),
        },
        detail: {
          summary: "Get name by Id",
          tags: [TAGS.OPEN_API_TAG.name],
        },
      }
    );

export default name;
