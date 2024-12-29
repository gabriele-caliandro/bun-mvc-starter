import type { Model } from "@/models/Model";
import { ServerHttp } from "@/network/http/ServerHttp";
import Elysia, { t } from "elysia";

const name = (model: Model) =>
  new Elysia().use(ServerHttp.modelPlugin(model)).get(
    "/name/:id",
    ({ params: { id }, model, error }) => {
      const name = model.names.at(Number.parseInt(id));

      if (!name) {
        return error(404, {
          error: "Robotic cell not found",
        });
      }

      return name;
    },
    {
      response: {
        200: t.String(),
        404: t.Object({
          error: t.String(),
        }),
      },
    },
  );

export default name;
