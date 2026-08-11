import { getBackendApiBaseUrl, getTravelRiskApiConfig } from "@/lib/api/config";
import { ApiClientError } from "@/lib/api/errors";
import { postJson } from "@/lib/api/http";
import {
  assessTravelRiskMock,
  normalizeTravelRiskRequest,
} from "@/lib/api/travel-risk/mock-adapter";
import {
  buildFlightAnalyzeQuery,
  mapFlightAnalyzeToTravelRisk,
} from "@/lib/api/travel-risk/map-flight-analyze";
import type {
  FlightAnalyzeResponse,
  TravelRiskRequest,
  TravelRiskResponse,
} from "@/types/travel-risk";

export type AssessTravelRiskOptions = {
  /**
   * Optional `Authorization` header forwarded to the backend analyze endpoint.
   */
  authorization?: string;
};

export type AssessTravelRiskResult =
  | { ok: true; value: TravelRiskResponse }
  | { ok: false; code: ApiClientError["code"]; message: string };

/**
 * Resolves the absolute Travel Risk analyze URL.
 * Uses `TRAVEL_RISK_API_URL` when set, otherwise `{API_BASE}/api/v1/flights/analyze/`.
 * @returns {string} Absolute analyze endpoint.
 */
const resolveAnalyzeUrl = (): string => {
  const config = getTravelRiskApiConfig();

  if (config.remoteUrl) {
    return config.remoteUrl;
  }

  return `${getBackendApiBaseUrl()}/api/v1/flights/analyze/`;
};

/**
 * Resolves a Travel Risk assessment via backend analyze API (default) or mock.
 * Maps ``FlightAnalyzeResponse`` into the UI Travel Risk contract.
 * @param {TravelRiskRequest} request - Flight query payload from the UI/BFF.
 * @param {AssessTravelRiskOptions} [options] - Optional auth forwarding.
 * @returns {Promise<AssessTravelRiskResult>} Assessment or typed failure.
 * @example
 * const result = await assessTravelRisk({
 *   flightNumber: "SK1587",
 *   route: ["Moscow", "Amsterdam"],
 *   raw: "SK1587, Moscow → Amsterdam, 12 September",
 * });
 */
export const assessTravelRisk = async (
  request: TravelRiskRequest,
  options: AssessTravelRiskOptions = {},
): Promise<AssessTravelRiskResult> => {
  const config = getTravelRiskApiConfig();

  try {
    const query = normalizeTravelRiskRequest(request);

    if (config.useMock) {
      console.debug("[api/travel-risk] mock adapter (TRAVEL_RISK_USE_MOCK=true)");
      const value = await assessTravelRiskMock(query);
      return { ok: true, value };
    }

    const analyzeUrl = resolveAnalyzeUrl();
    const freeText = buildFlightAnalyzeQuery(query);

    if (!freeText) {
      return {
        ok: false,
        code: "invalid",
        message: "Flight query text is required for analyze.",
      };
    }

    console.debug("[api/travel-risk] calling backend analyze", {
      url: analyzeUrl,
      queryPreview: freeText.slice(0, 80),
      hasAuth: Boolean(options.authorization),
    });

    const headers: Record<string, string> = {};
    if (options.authorization) {
      headers.Authorization = options.authorization;
    }

    const backendResponse = await postJson<FlightAnalyzeResponse>(
      analyzeUrl,
      { query: freeText },
      { headers },
    );

    if (!backendResponse?.analysis || typeof backendResponse.analysis !== "object") {
      console.debug("[api/travel-risk] partial/empty analysis", {
        queryId: backendResponse?.query_id,
        keys: backendResponse ? Object.keys(backendResponse) : [],
      });
    }

    const value = mapFlightAnalyzeToTravelRisk(backendResponse, query);
    return { ok: true, value };
  } catch (error) {
    if (error instanceof ApiClientError) {
      console.debug("[api/travel-risk] client error", {
        code: error.code,
        status: error.status,
        message: error.message,
      });
      return { ok: false, code: error.code, message: error.message };
    }

    if (error instanceof Error && error.message.startsWith("Invalid Travel Risk request")) {
      return { ok: false, code: "invalid", message: error.message };
    }

    console.debug("[api/travel-risk] unexpected error", error);
    return {
      ok: false,
      code: "server",
      message: "Unable to resolve Travel Risk assessment.",
    };
  }
};
