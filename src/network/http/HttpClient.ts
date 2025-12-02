import ky, { type KyInstance, type KyResponse } from "ky";
import { logger as base_logger } from "@/utils/logger/logger";
import type { Logger } from "pino";

type HttpClientOptions = {
  base_url: string;
  service_name: string;
  default_headers?: HeadersInit;
  timeout_ms?: number;
  retry_limit?: number;
};

// TODO: Migrate the rest of the code to use this class
export class HttpClient {
  public readonly ky: KyInstance;
  private logger: Logger;

  constructor(options: HttpClientOptions) {
    this.logger = base_logger.child({ service: options.service_name });

    this.ky = ky.create({
      prefixUrl: options.base_url,
      timeout: options.timeout_ms ?? 30_000,
      retry: {
        limit: options.retry_limit ?? 2,
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
