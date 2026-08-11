import { NextResponse } from "next/server";
import { explainFplOnBackend } from "@/lib/api/fpl-validator/client";
import type { FplApiLocale, FplExplainRequest } from "@/types/fpl-validator";

export const dynamic = "force-dynamic";

type ExplainBody = {
  rule_id?: unknown;
  message_id?: unknown;
  locale?: unknown;
  context?: unknown;
};

/**
 * Maps an FPL backend failure into a BFF JSON response.
 * @param {{ code: string; message: string; apiCode?: string; traceId?: string; details?: unknown; status?: number }} failure - Typed failure.
 * @returns {NextResponse} Error response.
 */
const toErrorResponse = (failure: {
  code: string;
  message: string;
  apiCode?: string;
  traceId?: string;
  details?: unknown;
  status?: number;
}): NextResponse => {
  const status =
    failure.status ??
    (failure.code === "invalid"
      ? 400
      : failure.code === "authRequired"
        ? 401
        : failure.code === "forbidden"
          ? 403
          : failure.code === "notFound"
            ? 404
            : failure.code === "timeout"
              ? 504
              : 502);

  return NextResponse.json(
    {
      error: {
        code: failure.apiCode ?? failure.code,
        message: failure.message,
        details: failure.details ?? {},
        trace_id: failure.traceId ?? null,
      },
    },
    { status, headers: { "Cache-Control": "no-store" } },
  );
};

/**
 * POST /api/fpl/explain — proxies to Django explain (auth optional).
 * @param {Request} request - Incoming request with JSON body.
 * @returns {Promise<Response>} Explain JSON or error envelope.
 */
export const POST = async (request: Request): Promise<Response> => {
  let body: ExplainBody;

  try {
    body = (await request.json()) as ExplainBody;
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Request body must be valid JSON.",
          details: {},
          trace_id: null,
        },
      },
      { status: 400 },
    );
  }

  const locale =
    typeof body.locale === "string" &&
    ["en", "es", "ru", "kk", "uz"].includes(body.locale.trim().toLowerCase())
      ? (body.locale.trim().toLowerCase() as FplApiLocale)
      : undefined;

  const payload: FplExplainRequest = {
    locale,
  };

  if (typeof body.rule_id === "string" && body.rule_id.trim()) {
    payload.rule_id = body.rule_id.trim();
  }

  if (typeof body.message_id === "number" && Number.isFinite(body.message_id)) {
    payload.message_id = body.message_id;
  }

  if (body.context && typeof body.context === "object") {
    const ctx = body.context as Record<string, unknown>;
    payload.context = {
      field_code: typeof ctx.field_code === "string" ? ctx.field_code : undefined,
      value_text: typeof ctx.value_text === "string" ? ctx.value_text : undefined,
      field: typeof ctx.field === "string" ? ctx.field : undefined,
      value: typeof ctx.value === "string" ? ctx.value : undefined,
    };
  }

  if (!payload.rule_id && typeof payload.message_id !== "number") {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "rule_id or message_id is required.",
          details: {},
          trace_id: null,
        },
      },
      { status: 400 },
    );
  }

  const authorization = request.headers.get("authorization")?.trim() || undefined;
  const result = await explainFplOnBackend(payload, { authorization });

  if (!result.ok) {
    return toErrorResponse(result);
  }

  return NextResponse.json(result.value, {
    headers: { "Cache-Control": "no-store" },
  });
};
