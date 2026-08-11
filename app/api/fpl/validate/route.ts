import { NextResponse } from "next/server";
import { validateFplOnBackend } from "@/lib/api/fpl-validator/client";
import type { FplApiLocale, FplValidationMode } from "@/types/fpl-validator";

export const dynamic = "force-dynamic";

type ValidateBody = {
  fpl_text?: unknown;
  locale?: unknown;
  mode?: unknown;
};

/**
 * Normalizes an optional locale string to an FPL API locale.
 * @param {unknown} value - Raw locale.
 * @returns {FplApiLocale | undefined} Locale or undefined when omitted/invalid.
 */
const parseLocale = (value: unknown): FplApiLocale | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const locale = value.trim().toLowerCase();
  if (
    locale === "en" ||
    locale === "es" ||
    locale === "ru" ||
    locale === "kk" ||
    locale === "uz"
  ) {
    return locale;
  }

  return undefined;
};

/**
 * Normalizes mode to `strict` | `learning`.
 * @param {unknown} value - Raw mode.
 * @returns {FplValidationMode | undefined} Mode or undefined.
 */
const parseMode = (value: unknown): FplValidationMode | undefined => {
  if (value === "learning" || value === "strict") {
    return value;
  }

  // Legacy UI aliases from F6.
  if (value === "training") {
    return "learning";
  }
  if (value === "production") {
    return "strict";
  }

  return undefined;
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
    (failure.code === "invalid" || failure.code === "parseError"
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
 * POST /api/fpl/validate — proxies to Django validate (auth optional).
 * @param {Request} request - Incoming request with JSON body.
 * @returns {Promise<Response>} Mapped validate JSON or error envelope.
 */
export const POST = async (request: Request): Promise<Response> => {
  let body: ValidateBody;

  try {
    body = (await request.json()) as ValidateBody;
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

  if (typeof body.fpl_text !== "string") {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "fpl_text is required.",
          details: { fpl_text: ["This field is required."] },
          trace_id: null,
        },
      },
      { status: 400 },
    );
  }

  const authorization = request.headers.get("authorization")?.trim() || undefined;
  const locale = parseLocale(body.locale);
  const mode = parseMode(body.mode);

  console.debug("[bff/fpl/validate]", {
    hasAuth: Boolean(authorization),
    length: body.fpl_text.length,
    locale: locale ?? "en",
    mode: mode ?? "strict",
  });

  const result = await validateFplOnBackend(
    {
      fpl_text: body.fpl_text,
      locale,
      mode,
    },
    { authorization },
  );

  if (!result.ok) {
    return toErrorResponse(result);
  }

  return NextResponse.json(result.value, {
    headers: { "Cache-Control": "no-store" },
  });
};
