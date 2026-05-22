import Elysia from "elysia";
import z from "zod";

const ExampleSchema = z.object({
  example: z.string(),
});
type ExampleSchema = z.infer<typeof ExampleSchema>;

/**
 * Plugin that registers all core API models for OpenAPI documentation.
 * This makes models appear in Swagger UI under "Schemas" section and allows
 * routes to reference them by name (e.g., "Example", "LocationState").
 *
 * All schemas are now using Zod for validation and documentation.
 */
export const with_models = () =>
  new Elysia({ name: "api-models" }).model({
    Example: ExampleSchema,
  });
