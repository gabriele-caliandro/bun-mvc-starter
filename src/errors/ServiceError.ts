import { BasicError } from "@/errors/database/basic.error";
import { ConflictError } from "@/errors/domain/ConflictError";
import { DatabaseError } from "@/errors/domain/DatabaseError";
import { NotFoundError } from "@/errors/domain/NotFoundError";
import { ValidationError } from "@/errors/domain/ValidationError";

/**
 * Union type representing all possible service layer errors.
 * Services should return Result<T, ServiceError> instead of specific error unions.
 * Callers can use instanceof to check for specific error types they care about.
 *
 * @example
 * const result = await service.get_material_by_code("ABC");
 * if (result.isErr()) {
 *   if (result.error instanceof NotFoundError) {
 *     // Handle not found case
 *   } else if (result.error instanceof DatabaseError) {
 *     // Handle database error
 *   }
 * }
 */
export type ServiceError = NotFoundError | DatabaseError | ConflictError | ValidationError | BasicError;
