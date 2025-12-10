import { AppError } from "@/errors/base/AppError";

export class ConflictError extends AppError {
  readonly type = "ConflictError";
  readonly httpStatusCode = 409;

  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}
