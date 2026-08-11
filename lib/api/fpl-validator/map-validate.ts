import type {
  FplApiLocale,
  FplApiMessage,
  FplHistoryDetailResponse,
  FplIssue,
  FplMessageSeverity,
  FplStatsApiResponse,
  FplStatsResponse,
  FplValidateApiResponse,
  FplValidateResponse,
  FplValidationMode,
} from "@/types/fpl-validator";

/**
 * Maps a site locale string onto an FPL API locale (fallback `en`).
 * @param {string} locale - Active UI locale.
 * @returns {FplApiLocale} Supported API locale.
 */
export const mapUiLocaleToFplApi = (locale: string): FplApiLocale => {
  const normalized = locale.trim().toLowerCase();

  if (
    normalized === "en" ||
    normalized === "es" ||
    normalized === "ru" ||
    normalized === "kk" ||
    normalized === "uz"
  ) {
    return normalized;
  }

  return "en";
};

/**
 * Picks the best message text from validate/history message variants.
 * @param {FplApiMessage} message - Backend message row.
 * @param {FplApiLocale} [locale] - Preferred locale for bilingual history rows.
 * @returns {string} Display text.
 */
export const resolveFplMessageText = (
  message: FplApiMessage,
  locale: FplApiLocale = "en",
): string => {
  if (typeof message.message === "string" && message.message.trim()) {
    return message.message.trim();
  }

  if (locale === "ru" && typeof message.message_ru === "string" && message.message_ru.trim()) {
    return message.message_ru.trim();
  }

  if (typeof message.message_en === "string" && message.message_en.trim()) {
    return message.message_en.trim();
  }

  if (typeof message.message_ru === "string" && message.message_ru.trim()) {
    return message.message_ru.trim();
  }

  return message.rule_id;
};

/**
 * Normalizes severity strings from the API.
 * @param {string | null | undefined} value - Raw severity.
 * @returns {FplMessageSeverity} Normalized severity.
 */
const normalizeSeverity = (value: string | null | undefined): FplMessageSeverity => {
  if (value === "warning" || value === "info") {
    return value;
  }

  return "error";
};

/**
 * Maps one backend message into a UI issue.
 * @param {FplApiMessage} message - Backend message.
 * @param {FplApiLocale} [locale] - Preferred text locale.
 * @returns {FplIssue} UI issue.
 */
export const mapFplApiMessageToIssue = (
  message: FplApiMessage,
  locale: FplApiLocale = "en",
): FplIssue => {
  return {
    code: message.rule_id,
    message: resolveFplMessageText(message, locale),
    severity: normalizeSeverity(message.severity),
    suggestion: message.suggestion ?? null,
    start: message.position_start ?? null,
    end: message.position_end ?? null,
    field: message.field_code ?? null,
    value_text: message.value_text ?? null,
    message_id: message.id ?? null,
  };
};

/**
 * Extracts normalized FPL text from the `parsed` blob when present.
 * @param {FplValidateApiResponse | FplHistoryDetailResponse} payload - API payload.
 * @param {string} fallback - Fallback raw text.
 * @returns {string} Normalized or raw FPL.
 */
const resolveNormalizedFpl = (
  payload: FplValidateApiResponse | FplHistoryDetailResponse,
  fallback: string,
): string => {
  const parsed = payload.parsed;
  if (!parsed || typeof parsed !== "object") {
    return fallback;
  }

  const meta = (parsed as { meta?: { normalized_fpl?: unknown } }).meta;
  if (meta && typeof meta.normalized_fpl === "string" && meta.normalized_fpl.trim()) {
    return meta.normalized_fpl.trim();
  }

  return fallback;
};

/**
 * Maps a validate API response into the UI results contract.
 * HTTP 200 with `valid: false` is a normal success path (rule violations).
 * @param {FplValidateApiResponse} api - Backend validate body.
 * @param {string} rawFpl - Submitted FPL text.
 * @param {{ locale?: FplApiLocale; mode?: FplValidationMode }} [options] - Mapping options.
 * @returns {FplValidateResponse} UI payload.
 * @example
 * const ui = mapValidateApiToUi(api, fplText, { locale: "ru", mode: "learning" });
 */
export const mapValidateApiToUi = (
  api: FplValidateApiResponse,
  rawFpl: string,
  options: { locale?: FplApiLocale; mode?: FplValidationMode } = {},
): FplValidateResponse => {
  const locale = options.locale ?? "en";
  const messages = (api.messages ?? []).map((item) => mapFplApiMessageToIssue(item, locale));

  return {
    valid: Boolean(api.valid),
    score: typeof api.score === "number" ? api.score : 0,
    raw_fpl: rawFpl,
    normalized_fpl: resolveNormalizedFpl(api, rawFpl.trim()),
    errors: messages.filter((item) => item.severity === "error"),
    warnings: messages.filter((item) => item.severity === "warning"),
    infos: messages.filter((item) => item.severity === "info"),
    messages,
    parser_version: api.parser_version ?? "",
    rules_version: api.rules_version ?? "",
    request_id: api.request_id ?? null,
    inline_stats: api.stats ?? null,
    mode: options.mode,
  };
};

/**
 * Maps a history detail response into the UI results contract.
 * @param {FplHistoryDetailResponse} api - History payload.
 * @param {string} [rawFpl] - Optional raw text when known from the editor.
 * @param {FplApiLocale} [locale] - Preferred message locale.
 * @returns {FplValidateResponse} UI payload.
 */
export const mapHistoryApiToUi = (
  api: FplHistoryDetailResponse,
  rawFpl = "",
  locale: FplApiLocale = "en",
): FplValidateResponse => {
  const normalized = resolveNormalizedFpl(api, rawFpl.trim());
  const sourceText = rawFpl.trim() || normalized;
  const messages = (api.messages ?? []).map((item) => mapFplApiMessageToIssue(item, locale));

  return {
    valid: Boolean(api.valid),
    score: typeof api.score === "number" ? api.score : 0,
    raw_fpl: sourceText,
    normalized_fpl: normalized,
    errors: messages.filter((item) => item.severity === "error"),
    warnings: messages.filter((item) => item.severity === "warning"),
    infos: messages.filter((item) => item.severity === "info"),
    messages,
    parser_version: api.parser_version ?? "",
    rules_version: api.rules_version ?? "",
    request_id: api.request_id ?? null,
    created_at: api.created_at ?? null,
  };
};

/**
 * Maps auth stats API into the UI stats panel shape.
 * @param {FplStatsApiResponse} api - Backend stats body.
 * @returns {FplStatsResponse} UI stats.
 */
export const mapStatsApiToUi = (api: FplStatsApiResponse): FplStatsResponse => {
  return {
    total_checks: api.request_count ?? 0,
    average_score:
      typeof api.avg_score === "number" ? Math.round(api.avg_score * 10) / 10 : null,
    valid_count: 0,
    invalid_count: 0,
    error_total: api.error_total ?? 0,
    warning_total: api.warning_total ?? 0,
    info_total: api.info_total ?? 0,
    frequent_errors: (api.top_rules ?? []).map((rule) => ({
      code: rule.rule_id,
      message: rule.rule_id,
      count: rule.count,
    })),
  };
};
