/**
 * Auth types aligned with ``POST /api/v1/auth/login/`` and ``POST /api/v1/auth/register/``
 * (Passenger Rights AI API OpenAPI schemas).
 */

/** Public user slice returned inside a successful login payload. */
export type LoginUser = {
  id: number;
  email: string;
  nickname: string;
};

/**
 * Login request body for ``POST /api/v1/auth/login/``.
 * @see LoginRequest in API schema
 */
export type LoginRequest = {
  /** Account email (1..254). */
  email: string;
  /** Account password (minLength 1, write-only on the API). */
  password: string;
};

/**
 * Successful login response from ``POST /api/v1/auth/login/``.
 * @see LoginResponse in API schema
 */
export type LoginResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: LoginUser;
};

/** Client-side login failure codes for UI i18n. */
export type LoginClientErrorCode =
  | "invalid"
  | "credentials"
  | "network"
  | "timeout"
  | "server"
  | "unauthorized";

/**
 * Registration request body for ``POST /api/v1/auth/register/``.
 * @see RegisterRequest in API schema
 */
export type RegisterRequest = {
  /** Display nickname (1..64, unique case-insensitively). */
  nickname: string;
  /** Account email (1..254). */
  email: string;
  /**
   * Account password (write-only).
   * Backend policy: ≥6 chars, ≥1 digit, Latin letters and digits only.
   */
  password: string;
};

/** Client-side registration failure codes for UI i18n. */
export type RegisterClientErrorCode =
  | "invalid"
  | "passwordPolicy"
  | "emailTaken"
  | "nicknameTaken"
  | "network"
  | "timeout"
  | "server";

/**
 * Public user profile from ``GET /api/v1/profile/`` (`UserPublic`).
 */
export type UserPublic = {
  id: number;
  email: string;
  nickname: string;
  created_at: string;
};

/**
 * Partial profile update body for ``PATCH /api/v1/profile/``.
 * @see PatchedProfileUpdateRequest
 */
export type ProfileUpdateRequest = {
  email?: string;
  nickname?: string;
  password?: string;
};

/**
 * Profile payload after a successful PATCH (`ProfileUpdated`).
 */
export type ProfileUpdated = {
  id: number;
  email: string;
  nickname: string;
  updated_at: string;
};
