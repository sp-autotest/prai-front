import { getBackendApiBaseUrl } from "@/lib/api/config";
import { ApiClientError } from "@/lib/api/errors";
import { requestJson } from "@/lib/api/http";
import type {
  LoginClientErrorCode,
  ProfileUpdateRequest,
  ProfileUpdated,
  UserPublic,
} from "@/types/auth";

export type ProfileResult<T> =
  | { ok: true; value: T }
  | { ok: false; code: LoginClientErrorCode; message?: string };

/**
 * Maps an API client failure into a profile result code.
 * @param {unknown} error - Thrown error.
 * @returns {ProfileResult<never>} Failure result.
 */
const mapProfileError = (error: unknown): ProfileResult<never> => {
  if (error instanceof ApiClientError) {
    if (error.status === 401 || error.status === 403) {
      return { ok: false, code: "unauthorized", message: error.message };
    }

    return {
      ok: false,
      code:
        error.code === "network" ||
        error.code === "timeout" ||
        error.code === "invalid" ||
        error.code === "server"
          ? error.code
          : error.code === "authRequired"
            ? "unauthorized"
            : "server",
      message: error.message,
    };
  }

  console.debug("[api/profile] unexpected error", error);
  return { ok: false, code: "server" };
};

/**
 * Builds an Authorization header value for Bearer tokens.
 * @param {string} accessToken - Opaque access token from login.
 * @param {string} [tokenType] - Token type from login (defaults to Bearer).
 * @returns {string} Authorization header value.
 */
export const buildBearerAuthorization = (
  accessToken: string,
  tokenType = "Bearer",
): string => {
  const scheme = tokenType.trim() || "Bearer";
  return `${scheme} ${accessToken}`;
};

/**
 * Loads the authenticated profile from the backend ``GET /api/v1/profile/``.
 * @param {string} authorization - Full Authorization header value.
 * @returns {Promise<ProfileResult<UserPublic>>} Profile or typed failure.
 */
export const fetchProfileFromBackend = async (
  authorization: string,
): Promise<ProfileResult<UserPublic>> => {
  const url = `${getBackendApiBaseUrl()}/api/v1/profile/`;

  try {
    const value = await requestJson<UserPublic>(url, {
      method: "GET",
      headers: { Authorization: authorization },
    });
    return { ok: true, value };
  } catch (error) {
    return mapProfileError(error);
  }
};

/**
 * Patches the authenticated profile via ``PATCH /api/v1/profile/``.
 * @param {string} authorization - Full Authorization header value.
 * @param {ProfileUpdateRequest} body - Partial profile fields to update.
 * @returns {Promise<ProfileResult<ProfileUpdated>>} Updated profile or failure.
 */
export const patchProfileOnBackend = async (
  authorization: string,
  body: ProfileUpdateRequest,
): Promise<ProfileResult<ProfileUpdated>> => {
  const url = `${getBackendApiBaseUrl()}/api/v1/profile/`;

  try {
    const value = await requestJson<ProfileUpdated>(url, {
      method: "PATCH",
      headers: { Authorization: authorization },
      body,
    });
    return { ok: true, value };
  } catch (error) {
    return mapProfileError(error);
  }
};

/**
 * Browser helper: GET profile through the Next.js BFF.
 * @param {string} accessToken - Session access token.
 * @param {string} [tokenType] - Token type from login.
 * @returns {Promise<ProfileResult<UserPublic>>} Profile or typed failure.
 */
export const fetchProfile = async (
  accessToken: string,
  tokenType = "Bearer",
): Promise<ProfileResult<UserPublic>> => {
  try {
    const value = await requestJson<UserPublic>("/api/profile", {
      method: "GET",
      headers: {
        Authorization: buildBearerAuthorization(accessToken, tokenType),
      },
    });
    return { ok: true, value };
  } catch (error) {
    return mapProfileError(error);
  }
};

/**
 * Browser helper: PATCH profile through the Next.js BFF.
 * @param {string} accessToken - Session access token.
 * @param {ProfileUpdateRequest} body - Fields to update.
 * @param {string} [tokenType] - Token type from login.
 * @returns {Promise<ProfileResult<ProfileUpdated>>} Updated profile or failure.
 */
export const updateProfile = async (
  accessToken: string,
  body: ProfileUpdateRequest,
  tokenType = "Bearer",
): Promise<ProfileResult<ProfileUpdated>> => {
  try {
    const value = await requestJson<ProfileUpdated>("/api/profile", {
      method: "PATCH",
      headers: {
        Authorization: buildBearerAuthorization(accessToken, tokenType),
      },
      body,
    });
    return { ok: true, value };
  } catch (error) {
    return mapProfileError(error);
  }
};
