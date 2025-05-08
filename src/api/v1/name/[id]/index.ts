import type { ServiceRegistry } from "@/controllers/Controller";
import type { Model } from "@/models/Model";
import { BaseHttpServer } from "@/network/http/BaseHttpServer";
import { TAGS } from "@/network/http/tags";
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
    .use(BaseHttpServer.registerPlugin(serviceRegistry))
    .get(
      "/name/:id",
      async ({ params: { id }, serviceRegistry, model, error }) => {
        // This is a mock implementation
        const name = model.names.at(Number.parseInt(id));

        const user = await serviceRegistry.userManger.getUserById(id);

        if (!name) {
          return error(404, {
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
      },
    );

export default name;
