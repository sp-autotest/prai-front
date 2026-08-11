import { NextResponse } from "next/server";
import { registerWithCredentials } from "@/lib/api/auth/register";
import type { RegisterRequest } from "@/types/auth";

/**
 * Always resolve registration against the backend at request time.
 */
export const dynamic = "force-dynamic";

/**
 * POST /api/auth/register — BFF proxy to ``POST /api/v1/auth/register/``.
 * Request body matches OpenAPI `RegisterRequest`; success is `UserPublic` (201).
 * @param {Request} request - Incoming JSON body with nickname + email + password.
 * @returns {Promise<Response>} UserPublic JSON or an error payload.
 */
export const POST = async (request: Request): Promise<Response> => {
  let body: Partial<RegisterRequest>;

  try {
    body = (await request.json()) as Partial<RegisterRequest>;
  } catch {
    return NextResponse.json(
      { error: "invalid", message: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  console.debug("[bff/auth/register] register attempt", {
    hasNickname: typeof body.nickname === "string" && body.nickname.trim().length > 0,
    hasEmail: typeof body.email === "string" && body.email.trim().length > 0,
  });

  const result = await registerWithCredentials({
    nickname: typeof body.nickname === "string" ? body.nickname : "",
    email: typeof body.email === "string" ? body.email : "",
    password: typeof body.password === "string" ? body.password : "",
  });

  if (!result.ok) {
    const status =
      result.code === "invalid" || result.code === "passwordPolicy"
        ? 400
        : result.code === "emailTaken" || result.code === "nicknameTaken"
          ? 409
          : result.code === "timeout"
            ? 504
            : result.code === "network"
              ? 502
              : 502;

    return NextResponse.json(
      {
        error: result.code,
        message: result.message ?? "Registration failed.",
      },
      { status },
    );
  }

  return NextResponse.json(result.value, {
    status: 201,
    headers: {
      "Cache-Control": "no-store",
    },
  });
};
