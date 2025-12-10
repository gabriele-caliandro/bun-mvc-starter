import { AppError } from "@/errors/base/AppError";

export class DatabaseError extends AppError {
  readonly type = "DatabaseError";
  readonly httpStatusCode = 500;

  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "DatabaseError";
  }
}
