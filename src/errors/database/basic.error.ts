import { AppError } from "@/errors/base/AppError";

export class BasicError extends AppError {
  readonly type = "BasicError";
  readonly httpStatusCode = 500;

  constructor(message: string) {
    super(message);
    this.name = "BasicError";
  }
}