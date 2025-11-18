import { UserSchema } from "@/interfaces/user-manager/dto/user.dto";
import Elysia from "elysia";

/**
 * Plugin that registers all core API models for OpenAPI documentation.
 * This makes models appear in Swagger UI under "Schemas" section and allows
 * routes to reference them by name (e.g., "Item", "LocationState").
 *
 * All schemas are now using Zod for validation and documentation.
 */
export const with_models = () =>
  new Elysia({ name: "api-models" }).model({
    UserSchema: UserSchema,
  });
