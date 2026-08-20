import { NextResponse } from "next/server";
import { searchEquipmentOnBackend } from "@/lib/api/directories/client";
import {
  readQueryParams,
  toDirectoryErrorResponse,
} from "@/lib/api/directories/bff-helpers";

export const dynamic = "force-dynamic";

/**
 * GET /api/directories/equipment — proxies equipment / aircraft-type search.
 * @param {Request} request - Incoming request with query params.
 * @returns {Promise<Response>} Search JSON or error envelope.
 */
export const GET = async (request: Request): Promise<Response> => {
  const url = new URL(request.url);
  const raw = readQueryParams(url, ["name", "iata", "icao", "faa", "limit"]);
  const limit = raw.limit ? Number.parseInt(raw.limit, 10) : undefined;

  const result = await searchEquipmentOnBackend({
    name: raw.name,
    iata: raw.iata,
    icao: raw.icao,
    faa: raw.faa,
    limit: Number.isFinite(limit) ? limit : undefined,
  });

  if (!result.ok) {
    return toDirectoryErrorResponse(result);
  }

  return NextResponse.json(result.value, {
    headers: { "Cache-Control": "no-store" },
  });
};
