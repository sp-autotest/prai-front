import { getBackendApiBaseUrl } from "@/lib/api/config";
import { ApiClientError, mapHttpStatusToClientError } from "@/lib/api/errors";
import { postJson } from "@/lib/api/http";
import type {
  LoginClientErrorCode,
  LoginRequest,
  LoginResponse,
} from "@/types/auth";

const EMAIL_MAX_LENGTH = 254;

export type LoginResult =
  | { ok: true; value: LoginResponse }
  | { ok: false; code: LoginClientErrorCode; message?: string };

/**
 * Validates a login payload against the OpenAPI `LoginRequest` constraints.
 * @param {LoginRequest} request - Candidate credentials.
 * @returns {string | null} Error message when invalid, otherwise `null`.
 */
export const validateLoginRequest = (request: LoginRequest): string | null => {
  const email = request.email?.trim() ?? "";
  const password = request.password ?? "";

  if (!email || email.length > EMAIL_MAX_LENGTH) {
    return "Email must be between 1 and 254 characters.";
  }

  if (!password || password.length < 1) {
    return "Password is required.";
  }

  return null;
};

/**
 * Calls the backend ``POST /api/v1/auth/login/`` endpoint.
 * Intended for server-side / BFF use (avoids browser CORS to the API origin).
 * @param {LoginRequest} request - Email + password body.
 * @returns {Promise<LoginResult>} Token payload or a typed failure.
 * @example
 * const result = await loginWithCredentials({ email, password });
 */
export const loginWithCredentials = async (request: LoginRequest): Promise<LoginResult> => {
  const validationError = validateLoginRequest(request);

  if (validationError) {
    return { ok: false, code: "invalid", message: validationError };
  }

  const body: LoginRequest = {
    email: request.email.trim(),
    password: request.password,
  };

  const url = `${getBackendApiBaseUrl()}/api/v1/auth/login/`;

  try {
    const value = await postJson<LoginResponse>(url, body);
    return { ok: true, value };
  } catch (error) {
    if (error instanceof ApiClientError) {
      if (error.status === 401 || error.status === 403) {
        return { ok: false, code: "credentials", message: error.message };
      }

      return {
        ok: false,
        code:
          error.code === "network" ||
          error.code === "timeout" ||
          error.code === "invalid" ||
          error.code === "server"
            ? error.code
            : "server",
        message: error.message,
      };
    }

    console.debug("[api/auth/login] unexpected error", error);
    return { ok: false, code: "server" };
  }
};

/**
 * Browser login via the Next.js BFF (`POST /api/auth/login`).
 * Body matches OpenAPI `LoginRequest`; response matches `LoginResponse`.
 * @param {LoginRequest} request - Email + password.
 * @returns {Promise<LoginResult>} Token payload or typed failure.
 */
export const fetchLogin = async (request: LoginRequest): Promise<LoginResult> => {
  const validationError = validateLoginRequest(request);

  if (validationError) {
    return { ok: false, code: "invalid", message: validationError };
  }

  try {
    const value = await postJson<LoginResponse>("/api/auth/login", {
      email: request.email.trim(),
      password: request.password,
    });
    return { ok: true, value };
  } catch (error) {
    if (error instanceof ApiClientError) {
      if (error.status === 401 || error.status === 403) {
        return { ok: false, code: "credentials", message: error.message };
      }

      const mapped =
        error.code === "invalid"
          ? "invalid"
          : error.code === "network" || error.code === "timeout" || error.code === "server"
            ? error.code
            : mapHttpStatusToClientError(error.status ?? 500);

      return {
        ok: false,
        code:
          mapped === "network" ||
          mapped === "timeout" ||
          mapped === "invalid" ||
          mapped === "server"
            ? mapped
            : "server",
        message: error.message,
      };
    }

    console.debug("[auth/login] unexpected client error", error);
    return { ok: false, code: "server" };
  }
};
