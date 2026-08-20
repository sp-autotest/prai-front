import { NextResponse } from "next/server";
import type { DirectoryApiResult } from "@/lib/api/directories/client";

export const dynamic = "force-dynamic";

/**
 * Maps a directory API failure into a BFF JSON envelope response.
 * @param {Extract<DirectoryApiResult<never>, { ok: false }>} failure - Typed failure.
 * @returns {NextResponse} Error response.
 */
export const toDirectoryErrorResponse = (
  failure: Extract<DirectoryApiResult<never>, { ok: false }>,
): NextResponse => {
  const status =
    failure.status ??
    (failure.code === "invalid"
      ? 400
      : failure.code === "authRequired"
        ? 401
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
 * Reads optional trimmed query string params from a request URL.
 * @param {URL} url - Request URL.
 * @param {string[]} keys - Allowed query keys.
 * @returns {Record<string, string>} Present non-empty params.
 */
export const readQueryParams = (url: URL, keys: string[]): Record<string, string> => {
  const out: Record<string, string> = {};

  keys.forEach((key) => {
    const value = url.searchParams.get(key)?.trim();
    if (value) {
      out[key] = value;
    }
  });

  return out;
};
