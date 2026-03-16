import Elysia from "elysia";
import { AppError } from "@/errors/base/AppError";
import { NotFoundError } from "@/errors/domain/NotFoundError";

/**
 * Centralized error handler middleware for all service errors.
 * Automatically maps ServiceError types to appropriate HTTP status codes.
 *
 * Supported error types:
 * - NotFoundError -> 404
 * - ConflictError -> 409
 * - ValidationError -> 400
 * - DatabaseError -> 500
 * - BasicError -> 500
 *
 * All errors extending AppError are handled automatically via httpStatusCode property.
 *
 * @example
 * // In routes, simply throw the error and let middleware handle it
 * const res = await service.get_material_by_code("ABC");
 * if (res.isErr()) {
 *   throw res.error; // Middleware maps error to correct status code
 * }
 */
export const error_handler_middleware = () => {
  return new Elysia().onError(
    {
      as: "global",
    },
    ({ error, set }) => {
      if (error instanceof AppError) {
        set.status = error.httpStatusCode;
        const details: Record<string, unknown> = { ...error };
        delete details.httpStatusCode;
        delete details.type;
        return {
          error: error.message,
          type: error.type,
          details,
        };
      }

      set.status = 500;
      return {
        error: "Internal server error",
        type: "UnexpectedError",
      };
    }
  );
};
