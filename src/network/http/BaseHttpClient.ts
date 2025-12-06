
import { LoggerManager } from "@/utils/logger/logger";
import ky, { type KyInstance } from "ky";
import type { Logger } from "pino";

type HttpClientOptions = {
  base_url: string;
  service_name: string;
  default_headers?: HeadersInit;
  timeout_ms?: number;
  retry_limit?: number;
};

export class KyHttpClient {
  public readonly ky: KyInstance;
  private logger: Logger;

  constructor(options: HttpClientOptions) {
    this.logger = LoggerManager.get_base_logger().child({ name: options.service_name });

    this.ky = ky.create({
      prefixUrl: options.base_url,
      timeout: options.timeout_ms ?? 30_000,
      retry: {
        limit: options.retry_limit ?? 0,
        statusCodes: [408, 429, 500, 502, 503, 504],
      },
      headers: {
        "Content-Type": "application/json",
        ...options.default_headers,
      },
      hooks: {
        beforeRequest: [
          (request) => {
            this.logger.debug(
              {
                method: request.method,
                url: request.url,
              },
              `Making ${request.method} request`
            );
          },
        ],
        afterResponse: [
          (_request, _options, response) => {
            this.logger.debug(
              {
                status: response.status,
                url: response.url,
              },
              `Response received`
            );
          },
        ],
      },
    });
  }
}
