import { getTravelRiskApiConfig } from "@/lib/api/config";
import { ApiClientError, mapHttpStatusToClientError } from "@/lib/api/errors";
import { postJson } from "@/lib/api/http";
import { buildBearerAuthorization } from "@/lib/api/profile/client";
import { getAuthSession } from "@/lib/auth/session";
import type {
  ParsedFlightQuery,
  TravelRiskClientErrorCode,
  TravelRiskResponse,
} from "@/types/travel-risk";

export type FetchTravelRiskResult =
  | { ok: true; value: TravelRiskResponse }
  | { ok: false; code: TravelRiskClientErrorCode; message?: string };

/**
 * Browser-facing Travel Risk fetch against the BFF (or public API URL from env).
 * Forwards Bearer auth when a session exists (backend analyze accepts optional auth).
 * @param {ParsedFlightQuery} query - Normalized flight query from the search input.
 * @returns {Promise<FetchTravelRiskResult>} Assessment or a typed failure code.
 * @example
 * const result = await fetchTravelRisk(parsed.value);
 * if (!result.ok) return setError(result.code);
 */
export const fetchTravelRisk = async (
  query: ParsedFlightQuery,
): Promise<FetchTravelRiskResult> => {
  const { clientEndpoint } = getTravelRiskApiConfig();
  const session = getAuthSession();
  const headers: Record<string, string> = {};

  if (session?.accessToken) {
    headers.Authorization = buildBearerAuthorization(session.accessToken, session.tokenType);
  }

  console.debug("[travel-risk] browser → BFF", {
    endpoint: clientEndpoint,
    hasAuth: Boolean(headers.Authorization),
  });

  try {
    const value = await postJson<TravelRiskResponse>(clientEndpoint, query, { headers });
    return { ok: true, value };
  } catch (error) {
    if (error instanceof ApiClientError) {
      if (
        error.status === 401 ||
        error.apiCode === "auth_required" ||
        error.apiCode === "authRequired"
      ) {
        return { ok: false, code: "authRequired", message: error.message };
      }

      return { ok: false, code: error.code, message: error.message };
    }

    console.debug("[travel-risk] unexpected client error", error);
    return { ok: false, code: "server" };
  }
};

/**
 * Maps a raw HTTP status from the BFF into a UI error code.
 * @param {number} status - HTTP status.
 * @returns {TravelRiskClientErrorCode} UI error code.
 */
export const mapTravelRiskHttpStatus = (status: number): TravelRiskClientErrorCode => {
  if (status === 401 || status === 403) {
    return "authRequired";
  }

  return mapHttpStatusToClientError(status);
};
