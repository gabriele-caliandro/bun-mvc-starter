import type { BaseHttpClientI } from "@/network/http/BaseHttpClientI";
import type { LogLevel } from "@/utils/logger/log-levels";
import { LoggerManager } from "@/utils/logger/LoggerManager";
import type winston from "winston";

/**
 * A generic HTTP client for making RESTful API calls with logging.
 */
export class BaseHttpClient implements BaseHttpClientI {
  public readonly baseURL: string;
  public readonly defaultHeaders: HeadersInit;
  public readonly serviceName: string;

  protected logger: winston.Logger | null = null;

  constructor(baseURL: string, serviceName: string, defaultHeaders: HeadersInit = {}, opts?: { lvl?: LogLevel }) {
    this.baseURL = baseURL;
    this.serviceName = serviceName;
    this.defaultHeaders = {
      "Content-Type": "application/json",
      ...defaultHeaders,
    };
    this.initLogger(opts?.lvl);
  }

  private async initLogger(lvl: LogLevel = "info") {
    this.logger = LoggerManager.get_logger({ service: this.serviceName, lvl });
  }

  /**
   * Internal method to handle requests and response processing.
   * @throws {Error} If the request fails
   */
  protected async request<T>(method: string, path: string, body?: unknown, params?: Record<string, string>): Promise<T> {
    try {
      // Build URL with query parameters if provided
      const url = new URL(`${this.baseURL}${path}`);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.append(key, value);
        });
      }

      // Prepare request options
      const options: RequestInit = {
        method,
        headers: this.defaultHeaders,
      };

      // Add body for non-GET requests if provided
      if (body && method !== "GET") {
        options.body = JSON.stringify(body);
      }

      // Log the outgoing request
      this.logger?.debug(`Making ${method} request to '${url.toString()}'`, {
        method,
        url: url.toString(),
        headers: this.defaultHeaders,
        bodySize: body ? JSON.stringify(body).length : 0,
        body: body,
      });

      const startTime = Date.now();
      const response = await fetch(url.toString(), options);
      const duration = Date.now() - startTime;

      // Handle error responses
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP error! Status: ${response.status} - ${response.statusText}`;
        let errorDetails = {};

        try {
          // Try to parse error as JSON if possible
          const errorJson = JSON.parse(errorText);
          errorMessage += `. Details: ${JSON.stringify(errorJson)}`;
          errorDetails = errorJson;
        } catch {
          // If not JSON, include raw text if available
          if (errorText) {
            errorMessage += `. Response: ${errorText}`;
            errorDetails = { rawError: errorText };
          }
        }

        // Log error with details
        this.logger?.error(`Request failed: ${errorMessage}`, {
          method,
          url: url.toString(),
          status: response.status,
          duration: `${duration}ms`,
          contentType: response.headers.get("Content-Type"),
          errorDetails,
        });

        throw new Error(errorMessage);
      }

      // Process successful response based on content type
      const contentType = response.headers.get("Content-Type");

      // Return parsed JSON for JSON responses
      if (contentType?.includes("application/json")) {
        const data = (await response.json()) as T;
        // Log successful JSON response (with limited data info for privacy/size)
        this.logger?.debug(`Successfully processed JSON response`, {
          method,
          url: url.toString(),
          responseType: "json",
          dataSize: JSON.stringify(data).length,
          status: response.status,
          body: data,
        });
        return data;
      }

      // Handle text responses
      if (contentType?.includes("text/")) {
        const text = await response.text();
        this.logger?.debug(`Successfully processed text response`, {
          method,
          url: url.toString(),
          responseType: "text",
          dataSize: text.length,
          status: response.status,
          body: text,
        });
        return text as unknown as T;
      }

      // Return empty object for other content types
      this.logger?.debug(`Successfully processed response with content type: ${contentType}`, {
        method,
        url: url.toString(),
        responseType: contentType || "unknown",
      });
      return {} as T;
    } catch (error) {
      // Log unexpected errors (network issues, etc.)
      if (!(error instanceof Error) || !error.message.includes("HTTP error")) {
        this.logger?.error(`Unexpected error during ${method} request to ${this.baseURL}${path}`, {
          error: error instanceof Error ? error.message : String(error),
          method,
          path,
        });
      }

      // Enhance error with additional context if it's not already a custom error
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Request failed: ${String(error)}`);
    }
  }

  /**
   * Sends a GET request.
   * @throws {Error} If the request fails
   */
  public get<T>(path: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>("GET", path, undefined, params);
  }

  /**
   * Sends a POST request.
   * @throws {Error} If the request fails
   */
  public post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  /**
   * Sends a PUT request.
   * @throws {Error} If the request fails
   */
  public put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>("PUT", path, body);
  }

  /**
   * Sends a DELETE request.
   * @throws {Error} If the request fails
   */
  public delete<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("DELETE", path, body);
  }

  /**
   * Sends a PATCH request.
   * @throws {Error} If the request fails
   */
  public patch<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>("PATCH", path, body);
  }
}
