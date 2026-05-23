import { AppError } from "@/errors/base/AppError";

export class UnauthorizedError extends AppError {
  readonly type = "UnauthorizedError";
  readonly httpStatusCode = 401;

  constructor(
    message: string,
    public readonly fields?: Record<string, string>
  ) {
    super(message);
    this.name = "UnauthorizedError";
  }
}
