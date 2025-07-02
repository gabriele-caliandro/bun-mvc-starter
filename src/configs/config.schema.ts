import z from "zod";

const HttpConfigSchema = z.object({
  port: z.number().nullish(),
  prefix: z.string().nullish(),
});

const HttpClientSchema = z.object({
  url: z.string(),
});
const DatabaseConfigSchema = z.object({
  host: z.string(),
  port: z.number(),
  database: z.string(),
  username: z.string(),
  password: z.string(),
});
const MqttConfigSchema = z.object({
  url: z.string(),
});

// Main Config Schema
const ConfigSchema = z.object({
  version: z.string(),
  mqtt: MqttConfigSchema,
  http: HttpConfigSchema,
  database: DatabaseConfigSchema,
  userManager: HttpClientSchema,
});
export default ConfigSchema;

// Type inference
export type Config = z.infer<typeof ConfigSchema>;
