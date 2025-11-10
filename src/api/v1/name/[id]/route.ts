import { with_service_registry } from "@/api/plugins/with-service-registry";
import type { ServiceRegistry } from "@/controllers/ServiceRegistry";
import type { Model } from "@/models/Model";
import { BaseHttpServer } from "@/network/http/BaseHttpServer";
import { TAGS } from "@/network/http/tags";
import Elysia, { t } from "elysia";
import { z } from "zod";

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

        return {
          user,
          name,
        };
      },
      {
        response: {
          200: t.Object({
            user: t.Object({
              id: t.String(),
              name: t.String(),
              email: t.String(),
            }),
            name: t.String(),
          }),
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
