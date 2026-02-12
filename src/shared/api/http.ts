import { env } from "@/shared/config/env";

type Primitive = string | number | boolean | null;
type JsonValue = Primitive | JsonValue[] | { [key: string]: JsonValue };

type RequestOptions = Omit<RequestInit, "body" | "method"> & {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: JsonValue | FormData;
};

export class HttpError extends Error {
  readonly status: number;
  readonly data: unknown;

  constructor(status: number, data: unknown, message?: string) {
    super(message ?? `HTTP ${status}`);
    this.status = status;
    this.data = data;
  }
}

const buildUrl = (path: string): string => {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${env.apiBaseUrl}${path}`;
};

const hasJsonBody = (body: RequestOptions["body"]): body is JsonValue =>
  typeof body !== "undefined" && !(body instanceof FormData);

export const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const { body, headers, method = "GET", ...rest } = options;

  const requestHeaders = new Headers(headers);
  if (hasJsonBody(body) && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const response = await fetch(buildUrl(path), {
    ...rest,
    method,
    headers: requestHeaders,
    credentials: "include",
    body: typeof body === "undefined" ? undefined : hasJsonBody(body) ? JSON.stringify(body) : body,
  });

  const responseType = response.headers.get("content-type") ?? "";
  const isJson = responseType.includes("application/json");
  const payload = isJson ? await response.json().catch(() => null) : await response.text();

  if (!response.ok) {
    throw new HttpError(response.status, payload, `Request failed: ${method} ${path}`);
  }

  return payload as T;
};
