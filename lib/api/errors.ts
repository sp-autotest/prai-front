import type { TravelRiskClientErrorCode } from "@/types/travel-risk";

/**
 * Typed failure from the Travel Risk API client.
 * Carries a stable code for UI i18n mapping and an optional detail message.
 */
export class ApiClientError extends Error {
  readonly code: TravelRiskClientErrorCode;
  readonly status?: number;
  /**
   * Backend machine code from `{ error: { code } }` when present
   * (e.g. `EMAIL_ALREADY_EXISTS`, `FPL_PARSE_ERROR`).
   */
  readonly apiCode?: string;
  /**
   * Optional field-level details from the backend error payload.
   */
  readonly details?: unknown;
  /**
   * Backend `trace_id` from the error envelope when present.
   */
  readonly traceId?: string;

  /**
   * Creates an API client error.
   * @param {TravelRiskClientErrorCode} code - Stable error code for the UI.
   * @param {string} message - Human-readable detail (not always shown as-is).
   * @param {number} [status] - Optional HTTP status from the upstream response.
   * @param {{ apiCode?: string; details?: unknown; traceId?: string }} [meta] - Optional upstream error meta.
   */
  constructor(
    code: TravelRiskClientErrorCode,
    message: string,
    status?: number,
    meta?: { apiCode?: string; details?: unknown; traceId?: string },
  ) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
    this.apiCode = meta?.apiCode;
    this.details = meta?.details;
    this.traceId = meta?.traceId;
  }
}

/**
 * Maps an HTTP status to a client error code.
 * @param {number} status - HTTP status code.
 * @returns {TravelRiskClientErrorCode} Client error code.
 */
export const mapHttpStatusToClientError = (status: number): TravelRiskClientErrorCode => {
  if (status === 400 || status === 422) {
    return "invalid";
  }

  if (status === 408 || status === 504) {
    return "timeout";
  }

  return "server";
};
