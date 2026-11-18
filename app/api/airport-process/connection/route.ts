import { NextResponse } from "next/server";
import {
  buildConnectionRequestBody,
  fetchConnectionOnBackend,
} from "@/lib/api/airport-process/client";
import type { ConnectionTicketMode } from "@/types/airport-process";

export const dynamic = "force-dynamic";

type ConnectionRequestPayload = {
  iata?: unknown;
  ticket_mode?: unknown;
  has_baggage?: unknown;
};

/**
 * Keeps only a single ticket mode. Anything else means "both" (field omitted).
 * @param {unknown} value - Raw ticket_mode from the browser.
 * @returns {ConnectionTicketMode | "both"} Normalized mode.
 */
const readTicketMode = (value: unknown): ConnectionTicketMode | "both" => {
  if (value === "self_transfer" || value === "through") {
    return value;
  }

  return "both";
};

/**
 * POST /api/airport-process/connection — proxies hub connection minutes.
 * Forwards iata, optional ticket_mode, and has_baggage only when false.
 * @param {Request} request - Incoming request with Bearer auth and JSON body.
 * @returns {Promise<Response>} Connection envelope or an error payload.
 */
export const POST = async (request: Request): Promise<Response> => {
  const authorization = request.headers.get("authorization")?.trim() || "";

  if (!authorization) {
    console.debug("[bff/airport-process] connection rejected: missing Authorization");
    return NextResponse.json(
      {
        error: "auth_required",
        message: "Connection lookup requires an authenticated user.",
      },
      { status: 401 },
    );
  }

  let payload: ConnectionRequestPayload;

  try {
    payload = (await request.json()) as ConnectionRequestPayload;
  } catch {
    return NextResponse.json(
      { error: "invalid_query", message: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const body = buildConnectionRequestBody({
    iata: typeof payload.iata === "string" ? payload.iata : "",
    ticketMode: readTicketMode(payload.ticket_mode),
    cabinOnly: payload.has_baggage === false,
  });

  if (!body) {
    return NextResponse.json(
      {
        error: "invalid_query",
        message: "Body field iata (three letters) is required.",
      },
      { status: 400 },
    );
  }

  console.debug("[bff/airport-process] connection", {
    iata: body.iata,
    ticketMode: body.ticket_mode ?? "both",
    cabinOnly: body.has_baggage === false,
  });

  const result = await fetchConnectionOnBackend(body, authorization);

  if (!result.ok) {
    const status =
      result.code === "authRequired"
        ? 401
        : result.code === "notFound"
          ? 404
          : result.code === "invalid"
            ? 400
            : result.code === "timeout"
              ? 504
              : 502;

    return NextResponse.json(
      {
        error: result.code,
        message: result.message,
        ...(result.apiCode ? { apiCode: result.apiCode } : {}),
      },
      { status },
    );
  }

  return NextResponse.json(result.value, {
    headers: { "Cache-Control": "no-store" },
  });
};
