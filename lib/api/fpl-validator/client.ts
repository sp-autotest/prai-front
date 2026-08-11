import { getFplValidatorApiConfig } from "@/lib/api/config";
import { ApiClientError } from "@/lib/api/errors";
import { postJson, requestJson } from "@/lib/api/http";
import {
  mapHistoryApiToUi,
  mapStatsApiToUi,
  mapValidateApiToUi,
} from "@/lib/api/fpl-validator/map-validate";
import type {
  FplExplainRequest,
  FplExplainResponse,
  FplHistoryDetailResponse,
  FplStatsApiResponse,
  FplStatsResponse,
  FplValidateApiResponse,
  FplValidateRequest,
  FplValidateResponse,
  FplValidatorClientErrorCode,
} from "@/types/fpl-validator";

export type FplApiCallOptions = {
  /**
   * Optional `Authorization` header forwarded to the backend.
   */
  authorization?: string;
};

export type FplApiResult<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      code: FplValidatorClientErrorCode;
      message: string;
      apiCode?: string;
      traceId?: string;
      details?: unknown;
      status?: number;
    };

/**
 * Maps an ApiClientError into an FPL result failure.
 * @param {unknown} error - Thrown error.
 * @param {string} fallbackMessage - Generic message when none is available.
 * @returns {FplApiResult<never>} Failure result.
 */
const mapFplClientError = (error: unknown, fallbackMessage: string): FplApiResult<never> => {
  if (error instanceof ApiClientError) {
    console.debug("[api/fpl] client error", {
      code: error.code,
      apiCode: error.apiCode,
      status: error.status,
      traceId: error.traceId,
      message: error.message,
    });

    let code: FplValidatorClientErrorCode = "server";

    if (error.status === 401 || error.apiCode === "UNAUTHORIZED") {
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
      message: error.message || fallbackMessage,
      apiCode: error.apiCode,
      traceId: error.traceId,
      details: error.details,
      status: error.status,
    };
  }

  console.debug("[api/fpl] unexpected error", error);
  return { ok: false, code: "server", message: fallbackMessage };
};

/**
 * Builds optional Authorization headers for backend calls.
 * @param {FplApiCallOptions} options - Call options.
 * @returns {Record<string, string>} Headers object.
 */
const buildAuthHeaders = (options: FplApiCallOptions): Record<string, string> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
  };

  if (options.authorization) {
    headers.Authorization = options.authorization;
  }

  return headers;
};

/**
 * Validates an ICAO FPL telegram against the Django FPL API.
 * Guest-ok; Bearer is optional (needed so history/stats attach to the user).
 * @param {FplValidateRequest} request - Validate body (`fpl_text`, locale, mode).
 * @param {FplApiCallOptions} [options] - Optional auth forwarding.
 * @returns {Promise<FplApiResult<FplValidateResponse>>} Mapped UI result or failure.
 */
export const validateFplOnBackend = async (
  request: FplValidateRequest,
  options: FplApiCallOptions = {},
): Promise<FplApiResult<FplValidateResponse>> => {
  const fplText = request.fpl_text?.trim() ?? "";

  if (!fplText) {
    return {
      ok: false,
      code: "invalid",
      message: "fpl_text is required.",
      apiCode: "VALIDATION_ERROR",
    };
  }

  const { validateRemoteUrl } = getFplValidatorApiConfig();

  try {
    console.debug("[api/fpl] validate → backend", {
      url: validateRemoteUrl,
      mode: request.mode ?? "strict",
      locale: request.locale ?? "en",
      length: fplText.length,
      hasAuth: Boolean(options.authorization),
    });

    const api = await postJson<FplValidateApiResponse>(
      validateRemoteUrl,
      {
        fpl_text: request.fpl_text,
        locale: request.locale ?? "en",
        mode: request.mode ?? "strict",
      },
      { headers: buildAuthHeaders(options) },
    );

    const value = mapValidateApiToUi(api, request.fpl_text, {
      locale: request.locale ?? "en",
      mode: request.mode ?? "strict",
    });

    console.debug("[api/fpl] validate ok", {
      requestId: value.request_id,
      valid: value.valid,
      score: value.score,
      errors: value.errors.length,
      warnings: value.warnings.length,
    });

    return { ok: true, value };
  } catch (error) {
    return mapFplClientError(error, "Unable to validate FPL.");
  }
};

/**
 * Fetches an ICAO rule explanation (guest-ok).
 * @param {FplExplainRequest} request - Explain body (`rule_id` or `message_id`).
 * @param {FplApiCallOptions} [options] - Optional auth forwarding.
 * @returns {Promise<FplApiResult<FplExplainResponse>>} Explain payload or failure.
 */
export const explainFplOnBackend = async (
  request: FplExplainRequest,
  options: FplApiCallOptions = {},
): Promise<FplApiResult<FplExplainResponse>> => {
  if (!request.rule_id && typeof request.message_id !== "number") {
    return {
      ok: false,
      code: "invalid",
      message: "rule_id or message_id is required.",
      apiCode: "VALIDATION_ERROR",
    };
  }

  const { explainRemoteUrl } = getFplValidatorApiConfig();

  try {
    console.debug("[api/fpl] explain → backend", {
      url: explainRemoteUrl,
      ruleId: request.rule_id,
      messageId: request.message_id,
      locale: request.locale ?? "en",
    });

    const value = await postJson<FplExplainResponse>(explainRemoteUrl, request, {
      headers: buildAuthHeaders(options),
    });

    return { ok: true, value };
  } catch (error) {
    return mapFplClientError(error, "Unable to load rule explanation.");
  }
};

/**
 * Loads a persisted validation by `request_id` (auth required).
 * @param {string} requestId - UUID from validate.
 * @param {FplApiCallOptions} options - Must include Authorization.
 * @param {string} [rawFpl] - Optional editor text for highlight context.
 * @returns {Promise<FplApiResult<FplValidateResponse>>} History detail or failure.
 */
export const fetchFplHistoryOnBackend = async (
  requestId: string,
  options: FplApiCallOptions,
  rawFpl = "",
): Promise<FplApiResult<FplValidateResponse>> => {
  const id = requestId.trim();

  if (!id) {
    return { ok: false, code: "invalid", message: "request_id is required." };
  }

  if (!options.authorization) {
    return {
      ok: false,
      code: "authRequired",
      message: "History requires an authenticated user.",
      apiCode: "UNAUTHORIZED",
    };
  }

  const { historyRemoteUrl } = getFplValidatorApiConfig();
  const url = `${historyRemoteUrl}${encodeURIComponent(id)}/`;

  try {
    console.debug("[api/fpl] history → backend", { url, hasAuth: true });

    const api = await requestJson<FplHistoryDetailResponse>(url, {
      method: "GET",
      headers: buildAuthHeaders(options),
    });

    return { ok: true, value: mapHistoryApiToUi(api, rawFpl) };
  } catch (error) {
    return mapFplClientError(error, "Unable to load FPL history.");
  }
};

/**
 * Loads user FPL learning stats (auth required).
 * @param {FplApiCallOptions} options - Must include Authorization.
 * @returns {Promise<FplApiResult<FplStatsResponse>>} Stats or failure.
 */
export const fetchFplStatsOnBackend = async (
  options: FplApiCallOptions,
): Promise<FplApiResult<FplStatsResponse>> => {
  if (!options.authorization) {
    return {
      ok: false,
      code: "authRequired",
      message: "Stats require an authenticated user.",
      apiCode: "UNAUTHORIZED",
    };
  }

  const { statsRemoteUrl } = getFplValidatorApiConfig();

  try {
    console.debug("[api/fpl] stats → backend", { url: statsRemoteUrl });

    const api = await requestJson<FplStatsApiResponse>(statsRemoteUrl, {
      method: "GET",
      headers: buildAuthHeaders(options),
    });

    return { ok: true, value: mapStatsApiToUi(api) };
  } catch (error) {
    return mapFplClientError(error, "Unable to load FPL stats.");
  }
};
