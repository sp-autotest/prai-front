import type { FplIssue, FplValidateResponse, FplValidationMode } from "@/types/fpl-validator";

/** Fallback local penalty for demo scoring only (backend owns real scores). */
export const TRAINING_ERROR_PENALTY = 10;

/** Fallback local warning penalty for demo scoring only. */
export const TRAINING_WARNING_PENALTY = 4;

/** One line in the “what lowered the score” breakdown. */
export type FplScoreBreakdownItem = {
  code: string;
  kind: "error" | "warning" | "info";
  /** Approximate delta when known (demo); null when backend owns scoring. */
  delta: number | null;
  message: string;
};

/**
 * Computes a 0–100 score from issue counts using local demo penalties.
 * @param {number} errorCount - Number of errors.
 * @param {number} warningCount - Number of warnings.
 * @returns {number} Clamped score.
 */
export const computeTrainingScore = (errorCount: number, warningCount: number): number => {
  const raw =
    100 - errorCount * TRAINING_ERROR_PENALTY - warningCount * TRAINING_WARNING_PENALTY;
  return Math.max(0, Math.min(100, raw));
};

/**
 * Builds a score breakdown list (errors/warnings that affect the score).
 * Uses API suggestions when present; does not invent backend penalty math.
 * @param {FplValidateResponse} result - Validation payload.
 * @returns {FplScoreBreakdownItem[]} Ordered penalty lines (errors first).
 */
export const buildScoreBreakdown = (result: FplValidateResponse): FplScoreBreakdownItem[] => {
  const fromErrors: FplScoreBreakdownItem[] = result.errors.map((issue) => ({
    code: issue.code,
    kind: "error",
    delta: null,
    message: issue.suggestion?.trim() || issue.message,
  }));

  const fromWarnings: FplScoreBreakdownItem[] = result.warnings.map((issue) => ({
    code: issue.code,
    kind: "warning",
    delta: null,
    message: issue.suggestion?.trim() || issue.message,
  }));

  return [...fromErrors, ...fromWarnings];
};

/**
 * Known issue codes that have dedicated training hint translation keys.
 */
export const TRAINING_HINT_CODES = [
  "ITEM7_ACID_FORMAT",
  "ITEM10_EQUIPMENT_CHECK",
  "ITEM15_ROUTE_SYNTAX",
  "ITEM18_DOF_CHECK",
  "F13_AIRPORT_EXISTS",
  "F10_R_REQUIRES_PBN",
  "F18_PBN_REQUIRED",
  "F18_DOF_FORMAT",
] as const;

export type TrainingHintCode = (typeof TRAINING_HINT_CODES)[number];

/**
 * Returns whether a code has a dedicated training hint key.
 * @param {string} code - Issue code.
 * @returns {boolean} True when a specific hint exists.
 */
export const hasTrainingHintCode = (code: string): code is TrainingHintCode => {
  return (TRAINING_HINT_CODES as readonly string[]).includes(code);
};

/**
 * Builds a short ICAO explanation line for an issue (ref + message context).
 * @param {FplIssue} issue - Error or warning.
 * @returns {string | null} Explanation source string, or null when missing.
 */
export const getIssueIcaoRef = (issue: FplIssue): string | null => {
  const ref = issue.icao_ref?.trim();
  return ref ? ref : null;
};

/**
 * Returns whether the UI should show the learning score breakdown.
 * @param {FplValidationMode} mode - Active validation mode.
 * @returns {boolean} True in learning mode.
 */
export const shouldShowTrainingBreakdown = (mode: FplValidationMode): boolean => {
  return mode === "learning";
};
