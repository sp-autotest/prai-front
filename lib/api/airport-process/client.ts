import { getAirportProcessApiConfig } from "@/lib/api/config";
import { ApiClientError } from "@/lib/api/errors";
import { requestJson } from "@/lib/api/http";
import type {
  AirportProcessClientErrorCode,
  AirportProcessExtractList,
  ConnectionRequestBody,
  ConnectionResponse,
  ConnectionTicketMode,
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

export type ConnectionQueryInput = {
  iata: string;
  /**
   * ``both`` omits ``ticket_mode`` so the backend returns self_transfer then through.
   */
  ticketMode: "both" | ConnectionTicketMode;
  /**
   * When true, the body includes ``has_baggage: false``. A checked bag omits the field.
   */
  cabinOnly: boolean;
};

/**
 * Builds the connection POST body. Drops passport, layover, and minute fields.
 * @param {ConnectionQueryInput} input - UI choices.
 * @returns {ConnectionRequestBody | null} Body, or null when IATA is not three letters.
 */
export const buildConnectionRequestBody = (
  input: ConnectionQueryInput,
): ConnectionRequestBody | null => {
  const iata = normalizeAirportProcessIata(input.iata);

  if (!iata) {
    return null;
  }

  const body: ConnectionRequestBody = { iata };

  if (input.ticketMode === "self_transfer" || input.ticketMode === "through") {
    body.ticket_mode = input.ticketMode;
  }

  if (input.cabinOnly) {
    body.has_baggage = false;
  }

  return body;
};

/**
 * Loads connection answers via Django ``POST /api/v1/flights/connection/``.
 * @param {ConnectionRequestBody} body - Already narrowed body (iata, optional mode, optional cabin flag).
 * @param {string} authorization - Bearer Authorization header value.
 * @returns {Promise<AirportProcessApiResult<ConnectionResponse>>} Envelope or failure.
 */
export const fetchConnectionOnBackend = async (
  body: ConnectionRequestBody,
  authorization: string,
): Promise<AirportProcessApiResult<ConnectionResponse>> => {
  const normalized = buildConnectionRequestBody({
    iata: body.iata,
    ticketMode: body.ticket_mode ?? "both",
    cabinOnly: body.has_baggage === false,
  });

  if (!normalized) {
    return {
      ok: false,
      code: "invalid",
      message: "Expected a three-letter IATA airport code.",
    };
  }

  const { connectionRemoteUrl } = getAirportProcessApiConfig();

  console.debug("[api/airport-process] POST connection", {
    iata: normalized.iata,
    ticketMode: normalized.ticket_mode ?? "both",
    cabinOnly: normalized.has_baggage === false,
  });

  try {
    const value = await requestJson<ConnectionResponse>(connectionRemoteUrl, {
      method: "POST",
      body: normalized,
      headers: { Authorization: authorization },
    });
    return { ok: true, value };
  } catch (error) {
    return mapAirportProcessError(error, "Failed to load connection minutes.");
  }
};
