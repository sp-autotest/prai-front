import { NextResponse } from "next/server";
import { fetchFplHistoryOnBackend } from "@/lib/api/fpl-validator/client";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ requestId: string }>;
};

/**
 * GET /api/fpl/history/[requestId] — auth required.
 * @param {Request} request - Incoming request.
 * @param {RouteContext} context - Dynamic route params.
 * @returns {Promise<Response>} History detail JSON or error envelope.
 */
export const GET = async (request: Request, context: RouteContext): Promise<Response> => {
  const { requestId } = await context.params;
  const authorization = request.headers.get("authorization")?.trim() || undefined;

  if (!authorization) {
    return NextResponse.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "History requires an authenticated user.",
          details: {},
          trace_id: null,
        },
      },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  console.debug("[bff/fpl/history]", { requestId, hasAuth: true });

  const result = await fetchFplHistoryOnBackend(requestId, { authorization });

  if (!result.ok) {
    const status =
      result.status ??
      (result.code === "authRequired"
        ? 401
        : result.code === "forbidden"
          ? 403
          : result.code === "notFound"
            ? 404
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
