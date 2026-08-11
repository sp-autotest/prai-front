import { NextResponse } from "next/server";
import {
  fetchProfileFromBackend,
  patchProfileOnBackend,
} from "@/lib/api/profile/client";
import type { ProfileUpdateRequest } from "@/types/auth";

export const dynamic = "force-dynamic";

/**
 * Reads the Authorization header from an incoming BFF request.
 * @param {Request} request - Incoming request.
 * @returns {string | null} Authorization value or null when missing.
 */
const getAuthorization = (request: Request): string | null => {
  const value = request.headers.get("authorization");
  return value?.trim() ? value.trim() : null;
};

/**
 * GET /api/profile — proxies to ``GET /api/v1/profile/``.
 * @param {Request} request - Incoming request with Bearer token.
 * @returns {Promise<Response>} UserPublic JSON or error.
 */
export const GET = async (request: Request): Promise<Response> => {
  const authorization = getAuthorization(request);

  if (!authorization) {
    return NextResponse.json(
      { error: "unauthorized", message: "Authorization header is required." },
      { status: 401 },
    );
  }

  const result = await fetchProfileFromBackend(authorization);

  if (!result.ok) {
    const status = result.code === "unauthorized" ? 401 : result.code === "timeout" ? 504 : 502;
    return NextResponse.json(
      { error: result.code, message: result.message ?? "Failed to load profile." },
      { status },
    );
  }

  return NextResponse.json(result.value, {
    headers: { "Cache-Control": "no-store" },
  });
};

/**
 * PATCH /api/profile — proxies to ``PATCH /api/v1/profile/``.
 * @param {Request} request - Incoming request with Bearer token and JSON body.
 * @returns {Promise<Response>} ProfileUpdated JSON or error.
 */
export const PATCH = async (request: Request): Promise<Response> => {
  const authorization = getAuthorization(request);

  if (!authorization) {
    return NextResponse.json(
      { error: "unauthorized", message: "Authorization header is required." },
      { status: 401 },
    );
  }

  let body: ProfileUpdateRequest;

  try {
    body = (await request.json()) as ProfileUpdateRequest;
  } catch {
    return NextResponse.json(
      { error: "invalid", message: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const payload: ProfileUpdateRequest = {};

  if (typeof body.email === "string" && body.email.trim()) {
    payload.email = body.email.trim();
  }

  if (typeof body.nickname === "string" && body.nickname.trim()) {
    payload.nickname = body.nickname.trim();
  }

  if (typeof body.password === "string" && body.password.length > 0) {
    payload.password = body.password;
  }

  if (Object.keys(payload).length === 0) {
    return NextResponse.json(
      { error: "invalid", message: "Provide at least one of email, nickname, password." },
      { status: 400 },
    );
  }

  const result = await patchProfileOnBackend(authorization, payload);

  if (!result.ok) {
    const status =
      result.code === "unauthorized"
        ? 401
        : result.code === "invalid"
          ? 400
          : result.code === "timeout"
            ? 504
            : 502;

    return NextResponse.json(
      { error: result.code, message: result.message ?? "Failed to update profile." },
      { status },
    );
  }

  return NextResponse.json(result.value, {
    headers: { "Cache-Control": "no-store" },
  });
};
