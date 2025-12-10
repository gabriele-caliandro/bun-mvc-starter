import { AppError } from "@/errors/base/AppError";

export class NotFoundError extends AppError {
	readonly type = "NotFoundError";
	readonly httpStatusCode = 404;

	constructor(
		public readonly resource: string,
		public readonly identifier: string | number,
	) {
		super(`${resource} with identifier '${identifier}' not found`);
		this.name = "NotFoundError";
	}
}
