import { NextResponse } from "next/server";
import { assessTravelRisk } from "@/lib/api";
import type { TravelRiskRequest } from "@/types/travel-risk";

/**
 * Always resolve Travel Risk on the server at request time.
 * Proxies to ``POST /api/v1/flights/analyze/`` (or mock when enabled).
 */
export const dynamic = "force-dynamic";

type TravelRiskRequestBody = {
  flightNumber?: unknown;
  route?: unknown;
  dateLabel?: unknown;
  raw?: unknown;
  query?: unknown;
};

/**
 * Validates a client-sent flight query payload for the Travel Risk endpoint.
 * Accepts structured fields and/or free-text `query` / `raw`.
 * @param {TravelRiskRequestBody} body - Parsed JSON body.
 * @returns {TravelRiskRequest | null} Normalized request or null when invalid.
 */
const parseRequestBody = (body: TravelRiskRequestBody): TravelRiskRequest | null => {
  const freeText =
    (typeof body.query === "string" && body.query.trim()) ||
    (typeof body.raw === "string" && body.raw.trim()) ||
    "";

  const flightNumber =
    typeof body.flightNumber === "string" ? body.flightNumber.trim().toUpperCase() : "";
  const route = Array.isArray(body.route)
    ? body.route
        .filter((stop): stop is string => typeof stop === "string")
        .map((stop) => stop.trim())
        .filter(Boolean)
    : [];
  const dateLabel = typeof body.dateLabel === "string" ? body.dateLabel.trim() : "";

  if (freeText) {
    return {
      flightNumber: flightNumber || undefined,
      route: route.length >= 2 ? route : undefined,
      dateLabel: dateLabel || undefined,
      raw: freeText,
    };
  }

  if (flightNumber && route.length >= 2) {
    return {
      flightNumber,
      route,
      dateLabel,
      raw: [flightNumber, route.join(" → "), dateLabel].filter(Boolean).join(", "),
    };
  }

  return null;
};

/**
 * POST /api/travel-risk — returns a mapped Travel Risk assessment for the UI.
 * @param {Request} request - Incoming request with JSON body.
 * @returns {Promise<Response>} TravelRiskResponse JSON or an error payload.
 */
export const POST = async (request: Request): Promise<Response> => {
  let body: TravelRiskRequestBody;

  try {
    body = (await request.json()) as TravelRiskRequestBody;
  } catch {
    return NextResponse.json(
      { error: "invalid_json", message: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const query = parseRequestBody(body);

  if (!query) {
    return NextResponse.json(
      {
        error: "invalid_query",
        message: "Expected flightNumber+route (≥2) and/or free-text query/raw.",
      },
      { status: 400 },
    );
  }

  const authorization = request.headers.get("authorization")?.trim() || undefined;

  if (!authorization) {
    console.debug("[bff/travel-risk] rejected: missing Authorization");
    return NextResponse.json(
      {
        error: "auth_required",
        message: "Travel Risk requires an authenticated user.",
      },
      { status: 401 },
    );
  }

  console.debug("[bff/travel-risk] assess", {
    hasRaw: Boolean(query.raw),
    hasAuth: true,
  });

  const result = await assessTravelRisk(query, { authorization });

  if (!result.ok) {
    const status =
      result.code === "invalid" ? 400 : result.code === "timeout" ? 504 : 502;

    return NextResponse.json(
      {
        error: result.code === "invalid" ? "invalid_query" : "assessment_failed",
        message: result.message,
      },
      { status },
    );
  }

  return NextResponse.json(result.value, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
};
