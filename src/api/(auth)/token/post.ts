import { base_endpoint } from "@/api/helpers/base-endpoint";
import type { ServiceRegistry } from "@/controllers/ServiceRegistry";
import { TAGS } from "@/network/http/tags";
import z from "zod";

export const token = (service_registry: ServiceRegistry) =>
  base_endpoint(service_registry).post(
    "/token",
    async ({ body, status, service_registry }) => {
      if (body.grant_type === "password") {
        const res = await service_registry.auth_service.login(body.username, body.password);

        if (res.isErr()) {
          return status(400, { error: "invalid_grant", error_description: res.error.message });
        }

        return {
          token_type: "Bearer",
          access_token: res.value.access_token,
          refresh_token: res.value.refresh_token,
          expires_in: res.value.expires_in,
        };
      } else {
        const res = await service_registry.auth_service.refresh_token(body.refresh_token);

        if (res.isErr()) {
          return status(400, { error: "invalid_grant", error_description: res.error.message });
        }

        return {
          token_type: "Bearer",
          access_token: res.value.access_token,
          refresh_token: res.value.refresh_token,
          expires_in: res.value.expires_in,
        };
      }
    },
    {
      body: z.discriminatedUnion("grant_type", [
        z.object({
          grant_type: z.literal("password"),
          username: z.string(),
          password: z.string(),
        }),
        z.object({
          grant_type: z.literal("refresh_token"),
          refresh_token: z.string(),
        }),
      ]),
      response: {
        200: z.object({
          token_type: z.literal("Bearer"),
          access_token: z.string(),
          refresh_token: z.string(),
          expires_in: z.number(), // in seconds
        }),
        400: z.object({
          error: z.literal("invalid_grant"),
          error_description: z.string(),
        }),
      },

      detail: {
        summary: "Token",
        description: "Retrieves a token in a OIDC compliant way.",
        tags: [TAGS.AUTH.name],
      },
    }
  );
