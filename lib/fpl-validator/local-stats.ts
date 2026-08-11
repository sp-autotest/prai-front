import type {
  FplFrequentError,
  FplHistoryItem,
  FplStatsResponse,
  FplValidateResponse,
  FplValidationMode,
} from "@/types/fpl-validator";

const STORAGE_KEY = "prai.fpl.local-stats";
const PREVIEW_MAX = 96;

/** Local history row with error fingerprints for frequent-error aggregation. */
export type FplLocalHistoryEntry = FplHistoryItem & {
  errorEntries: Array<{ code: string; message: string }>;
  /** Mode used for the check. */
  mode: FplValidationMode;
};

/** In-memory / sessionStorage shape for recent checks (list API is not available). */
export type FplLocalStatsState = {
  history: FplLocalHistoryEntry[];
};

/**
 * Truncates FPL text to a single-line preview for the history list.
 * @param {string} rawFpl - Full telegram text.
 * @param {number} [maxLength] - Max preview length.
 * @returns {string} Compact preview.
 */
export const buildFplPreview = (rawFpl: string, maxLength = PREVIEW_MAX): string => {
  const compact = rawFpl.replace(/\s+/g, " ").trim();

  if (compact.length <= maxLength) {
    return compact;
  }

  return `${compact.slice(0, maxLength - 1)}…`;
};

/**
 * Returns an empty local stats state.
 * @returns {FplLocalStatsState} Empty state.
 */
export const createEmptyLocalStats = (): FplLocalStatsState => {
  return { history: [] };
};

/**
 * Normalizes legacy mode aliases (`production`/`training`) to API modes.
 * @param {unknown} mode - Stored mode.
 * @returns {FplValidationMode} Normalized mode.
 */
const normalizeMode = (mode: unknown): FplValidationMode => {
  if (mode === "learning" || mode === "training") {
    return "learning";
  }

  return "strict";
};

/**
 * Reads local FPL stats from `sessionStorage` (browser only).
 * @returns {FplLocalStatsState} Persisted or empty state.
 */
export const loadLocalFplStats = (): FplLocalStatsState => {
  if (typeof window === "undefined") {
    return createEmptyLocalStats();
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return createEmptyLocalStats();
    }

    const parsed = JSON.parse(raw) as FplLocalStatsState;

    if (!parsed || !Array.isArray(parsed.history)) {
      return createEmptyLocalStats();
    }

    return {
      history: parsed.history.map((item) => ({
        ...item,
        id: String(item.id),
        mode: normalizeMode(item.mode),
        errorEntries: Array.isArray(item.errorEntries) ? item.errorEntries : [],
      })),
    };
  } catch {
    return createEmptyLocalStats();
  }
};

/**
 * Persists local FPL stats to `sessionStorage`.
 * @param {FplLocalStatsState} state - Stats state to store.
 * @returns {void}
 * @sideeffect Writes `sessionStorage`.
 */
export const saveLocalFplStats = (state: FplLocalStatsState): void => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.debug("[fpl-validator] failed to persist local stats", error);
  }
};

/**
 * Appends a validation result to the local history (newest first).
 * @param {FplLocalStatsState} state - Current local stats.
 * @param {FplValidateResponse} result - Latest validation payload.
 * @param {FplValidationMode} [mode] - Mode used for the check (default strict).
 * @returns {FplLocalStatsState} Updated state.
 */
export const appendLocalFplCheck = (
  state: FplLocalStatsState,
  result: FplValidateResponse,
  mode: FplValidationMode = "strict",
): FplLocalStatsState => {
  const entry: FplLocalHistoryEntry = {
    id: result.request_id ?? `local-${Date.now()}`,
    valid: result.valid,
    score: result.score,
    raw_fpl_preview: buildFplPreview(result.raw_fpl),
    created_at: result.created_at ?? new Date().toISOString(),
    parser_version: result.parser_version,
    rules_version: result.rules_version,
    mode,
    errorEntries: result.errors.map((issue) => ({
      code: issue.code,
      message: issue.message,
    })),
  };

  const history = [entry, ...state.history].slice(0, 100);

  return { history };
};

/**
 * Aggregates stats from local history. When `modeFilter` is set, only that mode is included.
 * @param {FplLocalHistoryEntry[]} history - Local check history.
 * @param {FplValidationMode} [modeFilter] - Optional mode filter.
 * @returns {FplStatsResponse} Stats payload for the UI panel.
 */
export const computeLocalFplStats = (
  history: FplLocalHistoryEntry[],
  modeFilter?: FplValidationMode,
): FplStatsResponse => {
  const scoped = modeFilter
    ? history.filter((item) => normalizeMode(item.mode) === modeFilter)
    : history;

  if (scoped.length === 0) {
    return {
      total_checks: 0,
      average_score: null,
      valid_count: 0,
      invalid_count: 0,
      frequent_errors: [],
    };
  }

  const scoreSum = scoped.reduce((sum, item) => sum + item.score, 0);
  const valid_count = scoped.filter((item) => item.valid).length;
  const invalid_count = scoped.length - valid_count;

  const frequency = new Map<string, FplFrequentError>();

  scoped.forEach((item) => {
    item.errorEntries.forEach((error) => {
      const existing = frequency.get(error.code);

      if (existing) {
        existing.count += 1;
        return;
      }

      frequency.set(error.code, {
        code: error.code,
        message: error.message,
        count: 1,
      });
    });
  });

  const frequent_errors = Array.from(frequency.values())
    .sort((a, b) => b.count - a.count || a.code.localeCompare(b.code))
    .slice(0, 8);

  return {
    total_checks: scoped.length,
    average_score: Math.round((scoreSum / scoped.length) * 10) / 10,
    valid_count,
    invalid_count,
    frequent_errors,
  };
};
