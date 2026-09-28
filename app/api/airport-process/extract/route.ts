import { NextResponse } from "next/server";
import {
  fetchAirportProcessExtractOnBackend,
  normalizeAirportProcessIata,
} from "@/lib/api/airport-process/client";

export const dynamic = "force-dynamic";

/**
 * GET /api/airport-process/extract — proxies self-transfer landside times.
 * Requires ``iata`` (three letters). Does not list the full registry.
 * @param {Request} request - Incoming request with Bearer auth and ``iata`` query.
 * @returns {Promise<Response>} ``AirportProcessExtractList`` JSON or an error envelope.
 */
export const GET = async (request: Request): Promise<Response> => {
  const authorization = request.headers.get("authorization")?.trim() || "";

  if (!authorization) {
    console.debug("[bff/airport-process] rejected: missing Authorization");
    return NextResponse.json(
      {
        error: "auth_required",
        message: "Airport process lookup requires an authenticated user.",
      },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const iata = normalizeAirportProcessIata(url.searchParams.get("iata") ?? "");

  if (!iata) {
    return NextResponse.json(
      {
        error: "invalid_query",
        message: "Query param iata (three letters) is required.",
      },
      { status: 400 },
    );
  }

  console.debug("[bff/airport-process] extract", { iata });

  const result = await fetchAirportProcessExtractOnBackend(iata, authorization);

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
