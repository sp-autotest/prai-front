import { NextResponse } from "next/server";
import { loginWithCredentials } from "@/lib/api/auth/login";
import type { LoginRequest } from "@/types/auth";

/**
 * Always resolve login against the backend at request time.
 */
export const dynamic = "force-dynamic";

/**
 * POST /api/auth/login — BFF proxy to ``POST /api/v1/auth/login/``.
 * Request/response bodies match the backend OpenAPI LoginRequest / LoginResponse.
 * @param {Request} request - Incoming JSON body with email + password.
 * @returns {Promise<Response>} LoginResponse JSON or an error payload.
 */
export const POST = async (request: Request): Promise<Response> => {
  let body: Partial<LoginRequest>;

  try {
    body = (await request.json()) as Partial<LoginRequest>;
  } catch {
    return NextResponse.json(
      { error: "invalid_json", message: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const result = await loginWithCredentials({
    email: typeof body.email === "string" ? body.email : "",
    password: typeof body.password === "string" ? body.password : "",
  });

  if (!result.ok) {
    const status =
      result.code === "invalid"
        ? 400
        : result.code === "credentials"
          ? 401
          : result.code === "timeout"
            ? 504
            : result.code === "network"
              ? 502
              : 502;

    return NextResponse.json(
      {
        error: result.code,
        message: result.message ?? "Login failed.",
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
