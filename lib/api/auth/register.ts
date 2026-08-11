import { getBackendApiBaseUrl } from "@/lib/api/config";
import { ApiClientError, mapHttpStatusToClientError } from "@/lib/api/errors";
import { postJson } from "@/lib/api/http";
import type {
  RegisterClientErrorCode,
  RegisterRequest,
  UserPublic,
} from "@/types/auth";

const EMAIL_MAX_LENGTH = 254;
const NICKNAME_MAX_LENGTH = 64;
const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_PATTERN = /^[A-Za-z0-9]+$/;

export type RegisterResult =
  | { ok: true; value: UserPublic }
  | { ok: false; code: RegisterClientErrorCode; message?: string };

/**
 * Validates password against the backend registration policy.
 * @param {string} password - Candidate password.
 * @returns {string | null} Error message when invalid, otherwise `null`.
 */
export const validateRegisterPassword = (password: string): string | null => {
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    return "Password must be at least 6 characters.";
  }

  if (!PASSWORD_PATTERN.test(password)) {
    return "Password may contain only Latin letters and digits.";
  }

  if (!/\d/.test(password)) {
    return "Password must contain at least one digit.";
  }

  return null;
};

/**
 * Validates a registration payload against OpenAPI + password policy.
 * @param {RegisterRequest} request - Candidate registration body.
 * @returns {string | null} Error message when invalid, otherwise `null`.
 */
export const validateRegisterRequest = (request: RegisterRequest): string | null => {
  const nickname = request.nickname?.trim() ?? "";
  const email = request.email?.trim() ?? "";
  const password = request.password ?? "";

  if (!nickname || nickname.length > NICKNAME_MAX_LENGTH) {
    return "Nickname must be between 1 and 64 characters.";
  }

  if (!email || email.length > EMAIL_MAX_LENGTH) {
    return "Email must be between 1 and 254 characters.";
  }

  return validateRegisterPassword(password);
};

/**
 * Maps an ApiClientError from register into a UI failure code.
 * @param {ApiClientError} error - Thrown HTTP client error.
 * @returns {RegisterClientErrorCode} Stable UI error code.
 */
const mapRegisterApiError = (error: ApiClientError): RegisterClientErrorCode => {
  const apiCode = (error.apiCode ?? "").toUpperCase();

  if (error.status === 409 || apiCode.includes("ALREADY_EXISTS")) {
    if (apiCode === "EMAIL_ALREADY_EXISTS") {
      return "emailTaken";
    }
    if (apiCode === "NICKNAME_ALREADY_EXISTS") {
      return "nicknameTaken";
    }
    return "invalid";
  }

  if (apiCode === "PASSWORD_POLICY_VIOLATION") {
    return "passwordPolicy";
  }

  if (error.code === "invalid" || error.status === 400 || error.status === 422) {
    return apiCode === "PASSWORD_POLICY_VIOLATION" ? "passwordPolicy" : "invalid";
  }

  return mapHttpStatusToClientError(error.status ?? 500) as RegisterClientErrorCode;
};

/**
 * Calls the backend ``POST /api/v1/auth/register/`` endpoint.
 * Intended for server-side / BFF use.
 * @param {RegisterRequest} request - Nickname + email + password.
 * @returns {Promise<RegisterResult>} Created `UserPublic` or a typed failure.
 * @example
 * const result = await registerWithCredentials({ nickname, email, password });
 */
export const registerWithCredentials = async (
  request: RegisterRequest,
): Promise<RegisterResult> => {
  const validationError = validateRegisterRequest(request);

  if (validationError) {
    const code: RegisterClientErrorCode =
      validationError.toLowerCase().includes("password") ? "passwordPolicy" : "invalid";
    return { ok: false, code, message: validationError };
  }

  const body: RegisterRequest = {
    nickname: request.nickname.trim(),
    email: request.email.trim(),
    password: request.password,
  };

  const url = `${getBackendApiBaseUrl()}/api/v1/auth/register/`;

  try {
    console.debug("[api/auth/register] calling backend", {
      url,
      email: body.email,
      nickname: body.nickname,
    });
    const value = await postJson<UserPublic>(url, body);
    return { ok: true, value };
  } catch (error) {
    if (error instanceof ApiClientError) {
      console.debug("[api/auth/register] client error", {
        status: error.status,
        apiCode: error.apiCode,
      });
      return {
        ok: false,
        code: mapRegisterApiError(error),
        message: error.message,
      };
    }

    console.debug("[api/auth/register] unexpected error", error);
    return { ok: false, code: "server" };
  }
};

/**
 * Browser registration via the Next.js BFF (`POST /api/auth/register`).
 * Body matches OpenAPI `RegisterRequest`; response matches `UserPublic`.
 * @param {RegisterRequest} request - Nickname + email + password.
 * @returns {Promise<RegisterResult>} Created user or typed failure.
 */
export const fetchRegister = async (request: RegisterRequest): Promise<RegisterResult> => {
  const validationError = validateRegisterRequest(request);

  if (validationError) {
    const code: RegisterClientErrorCode =
      validationError.toLowerCase().includes("password") ? "passwordPolicy" : "invalid";
    return { ok: false, code, message: validationError };
  }

  try {
    const value = await postJson<UserPublic>("/api/auth/register", {
      nickname: request.nickname.trim(),
      email: request.email.trim(),
      password: request.password,
    });
    return { ok: true, value };
  } catch (error) {
    if (error instanceof ApiClientError) {
      // BFF mirrors RegisterClientErrorCode in `error` for 4xx/5xx.
      const bffCode = error.apiCode as RegisterClientErrorCode | undefined;
      const known: RegisterClientErrorCode[] = [
        "invalid",
        "passwordPolicy",
        "emailTaken",
        "nicknameTaken",
        "network",
        "timeout",
        "server",
      ];

      if (bffCode && known.includes(bffCode)) {
        return { ok: false, code: bffCode, message: error.message };
      }

      return {
        ok: false,
        code: mapRegisterApiError(error),
        message: error.message,
      };
    }

    console.debug("[auth/register] unexpected client error", error);
    return { ok: false, code: "server" };
  }
};
