import { getFplValidatorApiConfig } from "@/lib/api/config";
import { ApiClientError } from "@/lib/api/errors";
import { postJson, requestJson } from "@/lib/api/http";
import { buildBearerAuthorization } from "@/lib/api/profile/client";
import type { FplApiResult } from "@/lib/api/fpl-validator/client";
import { getAuthSession } from "@/lib/auth/session";
import type {
  FplExplainRequest,
  FplExplainResponse,
  FplStatsResponse,
  FplValidateRequest,
  FplValidateResponse,
  FplValidatorClientErrorCode,
} from "@/types/fpl-validator";

/**
 * Builds optional Authorization headers from the browser session.
 * @returns {Record<string, string>} Headers (may be empty for guest validate/explain).
 */
const buildSessionHeaders = (): Record<string, string> => {
  const session = getAuthSession();
  const headers: Record<string, string> = {};

  if (session?.accessToken) {
    headers.Authorization = buildBearerAuthorization(session.accessToken, session.tokenType);
  }

  return headers;
};

/**
 * Maps a thrown browser/BFF error into an FPL result.
 * @param {unknown} error - Thrown error.
 * @param {string} fallback - Fallback message.
 * @returns {FplApiResult<never>} Failure result.
 */
const mapBrowserError = (error: unknown, fallback: string): FplApiResult<never> => {
  if (error instanceof ApiClientError) {
    console.debug("[fpl-validator] browser error", {
      code: error.code,
      apiCode: error.apiCode,
      status: error.status,
      traceId: error.traceId,
      message: error.message,
    });

    let code: FplValidatorClientErrorCode = "server";

    if (error.status === 401 || error.apiCode === "UNAUTHORIZED" || error.apiCode === "auth_required") {
      code = "authRequired";
    } else if (error.status === 403 || error.apiCode === "FORBIDDEN") {
      code = "forbidden";
    } else if (
      error.status === 404 ||
      error.apiCode === "RESOURCE_NOT_FOUND" ||
      error.apiCode === "FPL_RULE_NOT_FOUND"
    ) {
      code = "notFound";
    } else if (error.apiCode === "FPL_PARSE_ERROR") {
      code = "parseError";
    } else if (error.code === "network" || error.code === "timeout" || error.code === "invalid") {
      code = error.code;
    } else if (error.status === 400 || error.status === 422) {
      code = "invalid";
    }

    return {
      ok: false,
      code,
      message: error.message || fallback,
      apiCode: error.apiCode,
      traceId: error.traceId,
      details: error.details,
      status: error.status,
    };
  }

  console.debug("[fpl-validator] unexpected browser error", error);
  return { ok: false, code: "server", message: fallback };
};

/**
 * Browser → BFF validate. Auth optional (guest allowed).
 * @param {FplValidateRequest} request - Validate payload.
 * @returns {Promise<FplApiResult<FplValidateResponse>>} Mapped result or failure.
 */
export const fetchFplValidate = async (
  request: FplValidateRequest,
): Promise<FplApiResult<FplValidateResponse>> => {
  const { validateClientEndpoint } = getFplValidatorApiConfig();
  const headers = buildSessionHeaders();

  console.debug("[fpl-validator] browser → BFF validate", {
    endpoint: validateClientEndpoint,
    hasAuth: Boolean(headers.Authorization),
    mode: request.mode ?? "strict",
  });

  try {
    const value = await postJson<FplValidateResponse>(validateClientEndpoint, request, {
      headers,
    });
    return { ok: true, value };
  } catch (error) {
    return mapBrowserError(error, "Unable to validate FPL.");
  }
};

/**
 * Browser → BFF explain. Auth optional.
 * @param {FplExplainRequest} request - Explain payload.
 * @returns {Promise<FplApiResult<FplExplainResponse>>} Explain result or failure.
 */
export const fetchFplExplain = async (
  request: FplExplainRequest,
): Promise<FplApiResult<FplExplainResponse>> => {
  const { explainClientEndpoint } = getFplValidatorApiConfig();
  const headers = buildSessionHeaders();

  try {
    const value = await postJson<FplExplainResponse>(explainClientEndpoint, request, { headers });
    return { ok: true, value };
  } catch (error) {
    return mapBrowserError(error, "Unable to load rule explanation.");
  }
};

/**
 * Browser → BFF history detail. Auth required (401 UX if missing).
 * @param {string} requestId - Validate UUID.
 * @returns {Promise<FplApiResult<FplValidateResponse>>} History result or failure.
 */
export const fetchFplHistory = async (
  requestId: string,
): Promise<FplApiResult<FplValidateResponse>> => {
  const { historyClientEndpoint } = getFplValidatorApiConfig();
  const headers = buildSessionHeaders();

  if (!headers.Authorization) {
    return {
      ok: false,
      code: "authRequired",
      message: "History requires an authenticated user.",
      apiCode: "UNAUTHORIZED",
    };
  }

  const url = `${historyClientEndpoint.replace(/\/$/, "")}/${encodeURIComponent(requestId)}`;

  try {
    const value = await requestJson<FplValidateResponse>(url, {
      method: "GET",
      headers,
    });
    return { ok: true, value };
  } catch (error) {
    return mapBrowserError(error, "Unable to load FPL history.");
  }
};

/**
 * Browser → BFF stats. Auth required.
 * @returns {Promise<FplApiResult<FplStatsResponse>>} Stats result or failure.
 */
export const fetchFplStats = async (): Promise<FplApiResult<FplStatsResponse>> => {
  const { statsClientEndpoint } = getFplValidatorApiConfig();
  const headers = buildSessionHeaders();

  if (!headers.Authorization) {
    return {
      ok: false,
      code: "authRequired",
      message: "Stats require an authenticated user.",
      apiCode: "UNAUTHORIZED",
    };
  }

  try {
    const value = await requestJson<FplStatsResponse>(statsClientEndpoint, {
      method: "GET",
      headers,
    });
    return { ok: true, value };
  } catch (error) {
    return mapBrowserError(error, "Unable to load FPL stats.");
  }
};
