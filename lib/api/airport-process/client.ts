import { getAirportProcessApiConfig } from "@/lib/api/config";
import { ApiClientError } from "@/lib/api/errors";
import { requestJson } from "@/lib/api/http";
import type {
  AirportProcessClientErrorCode,
  AirportProcessExtractList,
} from "@/types/airport-process";

export type AirportProcessApiResult<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      code: AirportProcessClientErrorCode;
      message: string;
      apiCode?: string;
      status?: number;
    };

/**
 * Normalizes a hub IATA code for the airport-process extract query.
 * @param {string} raw - User-entered airport code.
 * @returns {string | null} Three-letter uppercase IATA, or null when invalid.
 */
export const normalizeAirportProcessIata = (raw: string): string | null => {
  const trimmed = raw.trim().toUpperCase();

  if (!/^[A-Z]{3}$/.test(trimmed)) {
    return null;
  }

  return trimmed;
};

/**
 * Maps an ApiClientError into an airport-process failure result.
 * @param {unknown} error - Thrown error.
 * @param {string} fallback - Fallback message.
 * @returns {AirportProcessApiResult<never>} Failure result.
 */
const mapAirportProcessError = (
  error: unknown,
  fallback: string,
): AirportProcessApiResult<never> => {
  if (error instanceof ApiClientError) {
    console.debug("[api/airport-process] client error", {
      code: error.code,
      apiCode: error.apiCode,
      status: error.status,
      message: error.message,
    });

    let code: AirportProcessClientErrorCode = "server";

    if (error.status === 401 || error.status === 403) {
      code = "authRequired";
    } else if (error.status === 404) {
      code = "notFound";
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
      status: error.status,
    };
  }

  console.debug("[api/airport-process] unexpected error", error);
  return { ok: false, code: "server", message: fallback };
};

/**
 * Loads self-transfer landside times via Django
 * ``GET /api/v1/flights/airport-process/extract/?iata=``.
 * Requires Bearer auth. Always passes ``iata`` (no full-catalog dump).
 * @param {string} iata - Three-letter hub IATA.
 * @param {string} authorization - Bearer Authorization header value.
 * @returns {Promise<AirportProcessApiResult<AirportProcessExtractList>>} Envelope or failure.
 */
export const fetchAirportProcessExtractOnBackend = async (
  iata: string,
  authorization: string,
): Promise<AirportProcessApiResult<AirportProcessExtractList>> => {
  const code = normalizeAirportProcessIata(iata);

  if (!code) {
    return {
      ok: false,
      code: "invalid",
      message: "Expected a three-letter IATA airport code.",
    };
  }

  const { remoteUrl } = getAirportProcessApiConfig();
  const url = `${remoteUrl}?iata=${encodeURIComponent(code)}`;

  console.debug("[api/airport-process] GET extract", { iata: code });

  try {
    const value = await requestJson<AirportProcessExtractList>(url, {
      method: "GET",
      headers: { Authorization: authorization },
    });
    return { ok: true, value };
  } catch (error) {
    return mapAirportProcessError(error, "Failed to load airport process times.");
  }
};
