import { computeTrainingScore } from "@/lib/fpl-validator/training";
import type {
  FplIssue,
  FplValidateResponse,
  FplValidationMode,
} from "@/types/fpl-validator";

/**
 * Finds a `[start, end)` range for the first occurrence of `needle` in `source`.
 * @param {string} source - Full FPL text.
 * @param {string} needle - Substring to locate.
 * @returns {{ start: number; end: number } | null} Range or null when missing.
 */
const findRange = (
  source: string,
  needle: string,
): { start: number; end: number } | null => {
  const start = source.indexOf(needle);

  if (start < 0) {
    return null;
  }

  return { start, end: start + needle.length };
};

/**
 * Builds a local demo `FplValidateResponse` (offline fallback only).
 * @param {string} rawFpl - Submitted FPL telegram text.
 * @param {FplValidationMode} [mode] - strict | learning.
 * @returns {FplValidateResponse} Demo validation payload.
 */
export const buildDemoFplValidateResponse = (
  rawFpl: string,
  mode: FplValidationMode = "strict",
): FplValidateResponse => {
  const trimmed = rawFpl.trim();
  const now = new Date().toISOString();

  if (trimmed.includes("VALIDDEMO") || trimmed.startsWith("FPL-AFL123-IS-B738") && trimmed.includes("PBN/B1")) {
    return {
      valid: true,
      score: 100,
      raw_fpl: rawFpl,
      normalized_fpl: trimmed,
      errors: [],
      warnings: [],
      infos: [],
      messages: [],
      parser_version: "demo-0.1",
      rules_version: "demo-2026.1",
      request_id: `demo-${Date.now()}`,
      created_at: now,
      mode,
    };
  }

  const zzzz = findRange(rawFpl, "ZZZZ");
  const dof = findRange(rawFpl, "DOF/");

  const errors: FplIssue[] = [
    {
      code: "F13_AIRPORT_EXISTS",
      message: "Departure aerodrome ICAO code must exist in the airport reference.",
      severity: "error",
      field: "13",
      value_text: "ZZZZ",
      start: zzzz?.start ?? null,
      end: zzzz?.end ?? null,
      suggestion: "Replace ZZZZ with a known ICAO aerodrome (e.g. UUEE).",
    },
  ];

  if (mode === "learning" || !trimmed.includes("PBN/")) {
    errors.push({
      code: "F10_R_REQUIRES_PBN",
      message: "Equipment code R requires a PBN/ other information entry.",
      severity: "error",
      field: "10",
      value_text: "R",
      start: null,
      end: null,
      suggestion: "Add PBN/… in Item 18 when R is present in Item 10a.",
    });
  }

  const warnings: FplIssue[] = [
    {
      code: "F18_DOF_FORMAT",
      message: "Date of flight (DOF) should be verified against the intended departure day.",
      severity: "warning",
      field: "18",
      value_text: "DOF/",
      start: dof?.start ?? null,
      end: dof?.end ?? null,
      suggestion: "Use DOF/ as YYMMDD.",
    },
  ];

  const score = computeTrainingScore(errors.length, warnings.length);
  const messages = [...errors, ...warnings];

  return {
    valid: false,
    score,
    raw_fpl: rawFpl,
    normalized_fpl: trimmed,
    errors,
    warnings,
    infos: [],
    messages,
    parser_version: "demo-0.1",
    rules_version: "demo-2026.1",
    request_id: `demo-${Date.now()}`,
    created_at: now,
    mode,
    inline_stats: {
      error_count: errors.length,
      warning_count: warnings.length,
      info_count: 0,
    },
  };
};
