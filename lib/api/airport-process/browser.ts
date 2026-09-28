import { getAirportProcessApiConfig } from "@/lib/api/config";
import { ApiClientError } from "@/lib/api/errors";
import { requestJson } from "@/lib/api/http";
import { buildBearerAuthorization } from "@/lib/api/profile/client";
import {
  normalizeAirportProcessIata,
  type AirportProcessApiResult,
} from "@/lib/api/airport-process/client";
import { getAuthSession } from "@/lib/auth/session";
import type { AirportProcessExtractList } from "@/types/airport-process";

/**
 * Browser-facing airport-process extract fetch against the BFF.
 * Forwards Bearer auth from the local session; requires a three-letter IATA.
 * @param {string} iata - Hub IATA entered by the user.
 * @returns {Promise<AirportProcessApiResult<AirportProcessExtractList>>} Envelope or failure.
 * @example
 * const result = await fetchAirportProcessExtract("FCO");
 */
export const fetchAirportProcessExtract = async (
  iata: string,
): Promise<AirportProcessApiResult<AirportProcessExtractList>> => {
  const code = normalizeAirportProcessIata(iata);

  if (!code) {
    return {
      ok: false,
      code: "invalid",
      message: "Expected a three-letter IATA airport code.",
    };
  }

  const session = getAuthSession();

  if (!session?.accessToken) {
    return {
      ok: false,
      code: "authRequired",
      message: "Authentication is required.",
    };
  }

  const { clientEndpoint } = getAirportProcessApiConfig();
  const url = `${clientEndpoint}?iata=${encodeURIComponent(code)}`;
  const authorization = buildBearerAuthorization(session.accessToken, session.tokenType);

  console.debug("[airport-process] browser → BFF", { iata: code, endpoint: clientEndpoint });

  try {
    const value = await requestJson<AirportProcessExtractList>(url, {
      method: "GET",
      headers: { Authorization: authorization },
    });
    return { ok: true, value };
  } catch (error) {
    if (error instanceof ApiClientError) {
      if (
        error.status === 401 ||
        error.status === 403 ||
        error.apiCode === "auth_required" ||
        error.apiCode === "unauthorized"
      ) {
        return { ok: false, code: "authRequired", message: error.message };
      }

      if (error.status === 404) {
        return { ok: false, code: "notFound", message: error.message };
      }

      if (error.code === "network" || error.code === "timeout" || error.code === "invalid") {
        return { ok: false, code: error.code, message: error.message };
      }

      return { ok: false, code: "server", message: error.message };
    }

    console.debug("[airport-process] unexpected client error", error);
    return { ok: false, code: "server", message: "Unexpected client error." };
  }
};
