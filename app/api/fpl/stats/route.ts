import { NextResponse } from "next/server";
import { fetchFplStatsOnBackend } from "@/lib/api/fpl-validator/client";

export const dynamic = "force-dynamic";

/**
 * GET /api/fpl/stats — auth required.
 * @param {Request} request - Incoming request.
 * @returns {Promise<Response>} Stats JSON or error envelope.
 */
export const GET = async (request: Request): Promise<Response> => {
  const authorization = request.headers.get("authorization")?.trim() || undefined;

  if (!authorization) {
    return NextResponse.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "Stats require an authenticated user.",
          details: {},
          trace_id: null,
        },
      },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  console.debug("[bff/fpl/stats]", { hasAuth: true });

  const result = await fetchFplStatsOnBackend({ authorization });

  if (!result.ok) {
    const status =
      result.status ??
      (result.code === "authRequired"
        ? 401
        : result.code === "forbidden"
          ? 403
          : result.code === "timeout"
            ? 504
            : 502);

    return NextResponse.json(
      {
        error: {
          code: result.apiCode ?? result.code,
          message: result.message,
          details: result.details ?? {},
          trace_id: result.traceId ?? null,
        },
      },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(result.value, {
    headers: { "Cache-Control": "no-store" },
  });
};
