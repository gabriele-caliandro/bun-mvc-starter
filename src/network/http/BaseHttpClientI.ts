export interface BaseHttpClientI {
  readonly baseURL: string;
  readonly defaultHeaders: HeadersInit;
  readonly serviceName: string;

  get<T>(path: string, params?: Record<string, string>): Promise<T | null>;
  post<T>(path: string, body: unknown): Promise<T | null>;
  put<T>(path: string, body: unknown): Promise<T | null>;
  delete<T>(path: string): Promise<T | null>;
  patch<T>(path: string, body: unknown): Promise<T | null>;
}
