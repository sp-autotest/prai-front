import { ApiClientError, mapHttpStatusToClientError } from "@/lib/api/errors";

export type RequestJsonOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /**
   * Abort after this many milliseconds. Defaults to 15000.
   */
  timeoutMs?: number;
  /**
   * Extra headers merged into the request.
   */
  headers?: Record<string, string>;
};

export type PostJsonOptions = Omit<RequestJsonOptions, "method" | "body">;

/**
 * Sends an HTTP request and parses a JSON response.
 * Shared low-level helper for Travel Risk, auth, and profile clients.
 * @template T
 * @param {string} url - Absolute or relative endpoint URL.
 * @param {RequestJsonOptions} [options] - Method, body, timeout, headers.
 * @returns {Promise<T>} Parsed JSON body.
 * @throws {ApiClientError} On network, timeout, HTTP, or JSON parse failures.
 */
export const requestJson = async <T>(
  url: string,
  options: RequestJsonOptions = {},
): Promise<T> => {
  const method = options.method ?? "GET";
  const timeoutMs = options.timeoutMs ?? 15_000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...options.headers,
  };

  const init: RequestInit = {
    method,
    headers,
    cache: "no-store",
    signal: controller.signal,
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(options.body);
  }

  let response: Response;

  try {
    response = await fetch(url, init);
  } catch (error) {
    if (
      (error instanceof DOMException && error.name === "AbortError") ||
      (error instanceof Error && error.name === "AbortError")
    ) {
      console.debug("[api] request timed out", url);
      throw new ApiClientError("timeout", "Request timed out.", 408);
    }

    console.debug("[api] network error", url, error);
    throw new ApiClientError("network", "Network request failed.");
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const code = mapHttpStatusToClientError(response.status);
    let message = `Request failed with status ${response.status}.`;
    let apiCode: string | undefined;
    let details: unknown;

    try {
      const errorBody = (await response.json()) as {
        error?:
          | string
          | {
              code?: string;
              message?: string;
              details?: unknown;
              trace_id?: string;
            };
        message?: string;
        trace_id?: string;
      };

      let traceId: string | undefined;

      if (typeof errorBody.error === "string") {
        apiCode = errorBody.error.trim() || undefined;
        message = errorBody.message?.trim() || message;
      } else if (errorBody.error && typeof errorBody.error === "object") {
        if (typeof errorBody.error.message === "string" && errorBody.error.message.trim()) {
          message = errorBody.error.message.trim();
        }
        if (typeof errorBody.error.code === "string" && errorBody.error.code.trim()) {
          apiCode = errorBody.error.code.trim();
        }
        details = errorBody.error.details;
        if (typeof errorBody.error.trace_id === "string" && errorBody.error.trace_id.trim()) {
          traceId = errorBody.error.trace_id.trim();
        }
      } else if (typeof errorBody.message === "string" && errorBody.message.trim()) {
        message = errorBody.message.trim();
      }

      if (!traceId && typeof errorBody.trace_id === "string" && errorBody.trace_id.trim()) {
        traceId = errorBody.trace_id.trim();
      }

      console.debug("[api] HTTP error", url, response.status, apiCode, traceId ?? null);
      throw new ApiClientError(code, message, response.status, { apiCode, details, traceId });
    } catch (parseError) {
      if (parseError instanceof ApiClientError) {
        throw parseError;
      }
      // Keep the generic status message when the error body is not JSON.
    }

    console.debug("[api] HTTP error (non-JSON body)", url, response.status);
    throw new ApiClientError(code, message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    console.debug("[api] invalid JSON response", url, error);
    throw new ApiClientError("server", "Response was not valid JSON.", response.status);
  }
};

/**
 * Sends a JSON POST and parses a JSON response.
 * @template T
 * @param {string} url - Absolute or relative endpoint URL.
 * @param {unknown} body - JSON-serializable request body.
 * @param {PostJsonOptions} [options] - Timeout and headers.
 * @returns {Promise<T>} Parsed JSON body.
 * @throws {ApiClientError} On network, timeout, HTTP, or JSON parse failures.
 * @example
 * const data = await postJson<TravelRiskResponse>("/api/travel-risk", request);
 */
export const postJson = async <T>(
  url: string,
  body: unknown,
  options: PostJsonOptions = {},
): Promise<T> => {
  return requestJson<T>(url, { ...options, method: "POST", body });
};
