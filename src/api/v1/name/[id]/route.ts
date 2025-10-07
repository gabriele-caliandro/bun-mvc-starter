import type { ServiceRegistry } from "@/controllers/ServiceRegistry";
import type { Model } from "@/models/Model";
import { BaseHttpServer } from "@/network/http/BaseHttpServer";
import { TAGS } from "@/network/http/tags";
import { Box } from "@sinclair/typebox-adapter";
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
    .use(BaseHttpServer.registerPlugin(serviceRegistry))
    .post(
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
        body: Box(z.object({ name: z.string() })),
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
