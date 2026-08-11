/**
 * ICAO FPL Validator domain types — aligned with Django REST contract
 * (`POST /api/v1/fpl/validate/`, explain, history, stats).
 */

/** Backend validation mode (`strict` = production scoring, `learning` = softer penalties). */
export type FplValidationMode = "strict" | "learning";

/** Supported message locales on the FPL API. */
export type FplApiLocale = "en" | "es" | "ru" | "kk" | "uz";

/** Message severity from validate/history. */
export type FplMessageSeverity = "error" | "warning" | "info";

/**
 * Request body for FPL validation.
 * @see POST /api/v1/fpl/validate/
 */
export type FplValidateRequest = {
  /** Raw ICAO FPL telegram text (`fpl_text` on the wire). */
  fpl_text: string;
  /** Optional UI locale; defaults to `en` on the backend. */
  locale?: FplApiLocale;
  /** Optional mode; defaults to `strict`. */
  mode?: FplValidationMode;
};

/**
 * Single message from validate / history payload (backend shape).
 */
export type FplApiMessage = {
  rule_id: string;
  field_code?: string | null;
  severity: FplMessageSeverity;
  message_type?: string | null;
  value_text?: string | null;
  /** Localized message (validate). */
  message?: string | null;
  message_ru?: string | null;
  message_en?: string | null;
  suggestion?: string | null;
  position_start?: number | null;
  position_end?: number | null;
  /** Present on history messages. */
  id?: number | null;
};

/** Per-check stats chip payload from validate. */
export type FplValidateInlineStats = {
  error_count: number;
  warning_count: number;
  info_count: number;
  by_field?: Record<string, number>;
};

/**
 * Backend validate success body (HTTP 200 even when `valid: false`).
 * @see POST /api/v1/fpl/validate/
 */
export type FplValidateApiResponse = {
  request_id: string;
  valid: boolean;
  score: number;
  parser_version: string;
  rules_version: string;
  parsed?: Record<string, unknown> | null;
  messages: FplApiMessage[];
  stats?: FplValidateInlineStats | null;
};

/**
 * UI-normalized issue used by results / highlight panels.
 * Offsets are 0-based indices into the submitted FPL text when present.
 */
export type FplIssue = {
  /** Stable rule id, e.g. `F13_AIRPORT_EXISTS`. */
  code: string;
  /** Human-readable explanation. */
  message: string;
  severity: FplMessageSeverity;
  /** Fix suggestion from the API when present. */
  suggestion?: string | null;
  /** ICAO reference (usually from explain). */
  icao_ref?: string | null;
  /** Inclusive start offset. */
  start?: number | null;
  /** Exclusive end offset. */
  end?: number | null;
  /** Logical FPL field code (e.g. `"13"`). */
  field?: string | null;
  /** Offending value fragment. */
  value_text?: string | null;
  /** History message id for explain-by-id. */
  message_id?: number | null;
};

/**
 * UI validation payload after mapping the API response.
 */
export type FplValidateResponse = {
  valid: boolean;
  /** Score 0..100. */
  score: number;
  raw_fpl: string;
  normalized_fpl: string;
  errors: FplIssue[];
  warnings: FplIssue[];
  infos: FplIssue[];
  /** Flat list preserving API order. */
  messages: FplIssue[];
  parser_version: string;
  rules_version: string;
  /** UUID from validate — required for history lookup. */
  request_id: string | null;
  created_at?: string | null;
  inline_stats?: FplValidateInlineStats | null;
  mode?: FplValidationMode;
};

/**
 * Explain request body.
 * @see POST /api/v1/fpl/explain/
 */
export type FplExplainRequest = {
  rule_id?: string;
  message_id?: number;
  locale?: FplApiLocale;
  context?: {
    field_code?: string;
    value_text?: string;
    field?: string;
    value?: string;
  };
};

/**
 * Explain response body.
 * @see POST /api/v1/fpl/explain/
 */
export type FplExplainResponse = {
  rule_id: string;
  title: string;
  explanation: string;
  icao_reference: string;
  severity: FplMessageSeverity;
};

/**
 * History detail by request_id (auth required).
 * @see GET /api/v1/fpl/history/{request_id}/
 */
export type FplHistoryDetailResponse = {
  request_id: string;
  created_at: string;
  valid: boolean;
  score: number;
  parser_version?: string;
  rules_version?: string;
  parsed?: Record<string, unknown> | null;
  messages: FplApiMessage[];
};

/** Local / list row for recent checks (client-side until a list API exists). */
export type FplHistoryItem = {
  id: string;
  valid: boolean;
  score: number;
  raw_fpl_preview: string;
  created_at: string;
  parser_version?: string;
  rules_version?: string;
  mode?: FplValidationMode;
};

/** Frequent error aggregate for the stats panel. */
export type FplFrequentError = {
  code: string;
  message: string;
  count: number;
};

/**
 * Auth stats payload.
 * @see GET /api/v1/fpl/stats/
 */
export type FplStatsApiResponse = {
  request_count: number;
  avg_score: number;
  error_total: number;
  warning_total: number;
  info_total: number;
  top_rules: Array<{ rule_id: string; count: number }>;
};

/**
 * UI stats shape (mapped from API or local session aggregates).
 */
export type FplStatsResponse = {
  total_checks: number;
  average_score: number | null;
  valid_count: number;
  invalid_count: number;
  error_total?: number;
  warning_total?: number;
  info_total?: number;
  frequent_errors: FplFrequentError[];
};

/** Backend error envelope. */
export type FplApiErrorEnvelope = {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[] | unknown> | null;
    trace_id?: string;
  };
};

/** UI state machine for the validate form. */
export type FplValidatorUiState = "idle" | "loading" | "success" | "empty" | "error";

/** Client-side failure codes mapped to i18n. */
export type FplValidatorClientErrorCode =
  | "invalid"
  | "network"
  | "timeout"
  | "server"
  | "unauthorized"
  | "authRequired"
  | "forbidden"
  | "notFound"
  | "parseError";
