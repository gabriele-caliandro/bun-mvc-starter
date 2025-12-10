export abstract class AppError extends Error {
  abstract readonly type: string;
  abstract readonly httpStatusCode: number;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
