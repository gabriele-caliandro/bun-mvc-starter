import { LoggerManager } from "@/utils/logger/LoggerManager";
import Elysia from "elysia";

const logger = await LoggerManager.createLogger({ service: "http-server" });
export const loggerMiddleware = new Elysia().onTransform(({ body, params, path, query, request: { method } }) => {
  const queryParams = Object.entries(query)
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  const details: Record<string, unknown> = {};
  if (method !== "GET" && body !== undefined) {
    details.body = body;
  }
  if (params) {
    details.params = params;
  }

  logger.info(`${method} ${path}${queryParams !== "" ? `?${queryParams}` : ""}`, Object.keys(details).length !== 0 ? { details } : undefined);
});
