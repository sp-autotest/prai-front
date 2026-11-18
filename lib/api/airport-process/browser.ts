import { getAirportProcessApiConfig } from "@/lib/api/config";
import { ApiClientError } from "@/lib/api/errors";
import { requestJson } from "@/lib/api/http";
import { buildBearerAuthorization } from "@/lib/api/profile/client";
import {
  buildConnectionRequestBody,
  normalizeAirportProcessIata,
  type AirportProcessApiResult,
  type ConnectionQueryInput,
} from "@/lib/api/airport-process/client";
import { getAuthSession } from "@/lib/auth/session";
import type { AirportProcessExtractList, ConnectionResponse } from "@/types/airport-process";

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

/**
 * Browser-facing connection lookup against the BFF.
 * Sends only iata, optional ticket_mode, and has_baggage=false for cabin bags.
 * @param {ConnectionQueryInput} input - Hub code and the two UI switches.
 * @returns {Promise<AirportProcessApiResult<ConnectionResponse>>} Envelope or failure.
 * @example
 * const result = await fetchConnection({ iata: "FCO", ticketMode: "both", cabinOnly: false });
 */
export const fetchConnection = async (
  input: ConnectionQueryInput,
): Promise<AirportProcessApiResult<ConnectionResponse>> => {
  const body = buildConnectionRequestBody(input);

  if (!body) {
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

  const { connectionClientEndpoint } = getAirportProcessApiConfig();
  const authorization = buildBearerAuthorization(session.accessToken, session.tokenType);

  console.debug("[airport-process] browser → connection BFF", {
    iata: body.iata,
    ticketMode: body.ticket_mode ?? "both",
    cabinOnly: body.has_baggage === false,
  });

  try {
    const value = await requestJson<ConnectionResponse>(connectionClientEndpoint, {
      method: "POST",
      body,
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

      if (error.status === 404 || error.apiCode === "RESOURCE_NOT_FOUND") {
        return { ok: false, code: "notFound", message: error.message };
      }

      if (error.code === "network" || error.code === "timeout" || error.code === "invalid") {
        return { ok: false, code: error.code, message: error.message };
      }

      return { ok: false, code: "server", message: error.message };
    }

    console.debug("[airport-process] unexpected connection error", error);
    return { ok: false, code: "server", message: "Unexpected client error." };
  }
};
