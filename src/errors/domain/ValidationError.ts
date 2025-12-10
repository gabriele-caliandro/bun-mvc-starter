import { AppError } from "@/errors/base/AppError";

export class ValidationError extends AppError {
	readonly type = "ValidationError";
	readonly httpStatusCode = 400;

	constructor(
		message: string,
		public readonly fields?: Record<string, string>,
	) {
		super(message);
		this.name = "ValidationError";
	}
}
