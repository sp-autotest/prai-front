import type { FplIssue } from "@/types/fpl-validator";

/** Visual tone for a highlighted FPL span. */
export type FplHighlightTone = "plain" | "error" | "warning";

/** One contiguous rendered segment of the source FPL. */
export type FplHighlightSegment = {
  text: string;
  tone: FplHighlightTone;
  /** Issue codes covering this span (for titles / a11y). */
  codes: string[];
  start: number;
  end: number;
};

/** Inclusive-exclusive character range. */
export type FplTextRange = {
  start: number;
  end: number;
};

/** Rule ids where the offending fragment is usually the leading FPL token. */
const PREFIX_RULE_IDS = new Set(["FPL_PREFIX_LOOKALIKE", "FPL_ASCII_IA5"]);

/**
 * Heuristic substrings when an issue has `field` but no API offsets.
 * Keys use backend-style field codes (`7`, `13`, `meta`) and legacy `item*` aliases.
 */
const FIELD_NEEDLES: Record<string, string[]> = {
  meta: [],
  item7: ["(FPL-", "(FPL", "FPL-"],
  "7": ["(FPL-", "(FPL", "FPL-"],
  item8: ["-IS", "-IFR", "-VFR", "-Y", "-Z"],
  "8": ["-IS", "-IFR", "-VFR", "-Y", "-Z"],
  item9: ["/N", "/M"],
  "9": ["/N", "/M"],
  item10: ["-SDE", "-SD", "/M-", "-S", "-N"],
  "10": ["-SDE", "-SD", "/M-", "-S", "-N"],
  "10a": ["-SDE", "-SD", "/M-", "-S", "-N"],
  "10b": ["-SDE", "-SD", "/M-", "-W", "-Y"],
  item13: ["-LFPG", "-EGLL", "-KJFK", "-UUEE"],
  "13": ["-LFPG", "-EGLL", "-KJFK", "-UUEE"],
  item15: ["DCT", "N0480", "N0450", "N0440", "N0"],
  "15": ["DCT", "N0480", "N0450", "N0440", "N0"],
  item16: ["-KJFK", "-EGLL", "-LFPG", "-URSS", "-URKK"],
  "16": ["-KJFK", "-EGLL", "-LFPG", "-URSS", "-URKK"],
  item18: ["DOF/", "RMK/", "EET/", "PBN/", "OPR/", "REG/"],
  "18": ["DOF/", "RMK/", "EET/", "PBN/", "OPR/", "REG/"],
};

/**
 * Returns whether an issue already has usable character offsets.
 * @param {FplIssue} issue - Validator issue.
 * @returns {boolean} True when start/end form a non-empty range.
 */
export const hasIssueOffsets = (issue: FplIssue): boolean => {
  return (
    typeof issue.start === "number" &&
    typeof issue.end === "number" &&
    Number.isFinite(issue.start) &&
    Number.isFinite(issue.end) &&
    issue.end > issue.start
  );
};

/**
 * Normalizes backend `field_code` for needle lookup (`10a` → `10`, keeps `meta`).
 * @param {string} field - Raw field code from the API.
 * @returns {string} Lookup key.
 */
const normalizeFieldKey = (field: string): string => {
  const raw = field.trim().toLowerCase();
  if (!raw || raw === "meta") {
    return "meta";
  }

  if (raw.startsWith("item")) {
    return raw;
  }

  const digits = raw.match(/^(\d+)/);
  if (digits) {
    return digits[1];
  }

  return raw;
};

/**
 * Finds the first occurrence of `needle` in `source` (case-sensitive, then insensitive).
 * @param {string} source - Full FPL text.
 * @param {string} needle - Substring to locate.
 * @returns {FplTextRange | null} Range or null.
 */
const findNeedleRange = (source: string, needle: string): FplTextRange | null => {
  const trimmed = needle.trim();
  if (trimmed.length < 1) {
    return null;
  }

  let start = source.indexOf(trimmed);
  if (start >= 0) {
    return { start, end: start + trimmed.length };
  }

  const lowerSource = source.toLowerCase();
  const lowerNeedle = trimmed.toLowerCase();
  start = lowerSource.indexOf(lowerNeedle);
  if (start >= 0) {
    return { start, end: start + trimmed.length };
  }

  return null;
};

/**
 * Resolves a range from API `value_text` (full value, first line, or leading token).
 * @param {string} source - Full FPL text.
 * @param {string | null | undefined} valueText - Offending fragment from the API.
 * @returns {FplTextRange | null} Range or null.
 */
const resolveValueTextRange = (
  source: string,
  valueText: string | null | undefined,
): FplTextRange | null => {
  const trimmed = (valueText ?? "").trim();
  if (trimmed.length < 2) {
    return null;
  }

  const full = findNeedleRange(source, trimmed);
  if (full) {
    return full;
  }

  const firstLine = trimmed.split(/\r?\n/)[0]?.trim() ?? "";
  if (firstLine.length >= 2) {
    const lineRange = findNeedleRange(source, firstLine);
    if (lineRange) {
      return lineRange;
    }
  }

  const prefixToken = trimmed.match(/^([^\s\n-]+)/)?.[1];
  if (prefixToken && prefixToken.length >= 2) {
    return findNeedleRange(source, prefixToken);
  }

  return null;
};

/**
 * Highlights the leading FPL prefix token (Latin `FPL`, near-miss `F?L`, or `(FPL` form).
 * @param {string} source - Full FPL text.
 * @returns {FplTextRange | null} Prefix token range or null.
 */
const resolveFplPrefixTokenRange = (source: string): FplTextRange | null => {
  const trimmed = source.trimStart();
  const offset = source.length - trimmed.length;

  const parenMatch = trimmed.match(/^\(([^)\n-]+)/);
  if (parenMatch) {
    const token = parenMatch[1];
    if (/^FPL$/i.test(token) || /^F.L$/i.test(token)) {
      return { start: offset + 1, end: offset + 1 + token.length };
    }
  }

  const tokenMatch = trimmed.match(/^([^\s\n-]+)/);
  if (!tokenMatch) {
    return null;
  }

  const token = tokenMatch[1];
  if (/^FPL$/i.test(token) || /^F.L$/i.test(token)) {
    return { start: offset, end: offset + token.length };
  }

  return null;
};

/**
 * Resolves field-based needle ranges for a normalized field key.
 * @param {string} source - Full FPL text.
 * @param {string} fieldKey - Normalized field key.
 * @returns {FplTextRange | null} Range or null.
 */
const resolveFieldNeedleRange = (source: string, fieldKey: string): FplTextRange | null => {
  if (fieldKey === "meta") {
    return resolveFplPrefixTokenRange(source);
  }

  const needles = FIELD_NEEDLES[fieldKey] ?? FIELD_NEEDLES[`item${fieldKey}`] ?? [];

  for (const needle of needles) {
    const range = findNeedleRange(source, needle);
    if (range) {
      return range;
    }
  }

  return null;
};

/**
 * Resolves a text range for an issue: API offsets → value_text → prefix/meta → field needles.
 * @param {string} source - Full FPL source text.
 * @param {FplIssue} issue - Error or warning item.
 * @returns {FplTextRange | null} Range or null when nothing can be resolved.
 */
export const resolveIssueRange = (source: string, issue: FplIssue): FplTextRange | null => {
  if (hasIssueOffsets(issue)) {
    const start = Math.max(0, Math.min(issue.start as number, source.length));
    const end = Math.max(start, Math.min(issue.end as number, source.length));
    return end > start ? { start, end } : null;
  }

  const valueRange = resolveValueTextRange(source, issue.value_text);
  if (valueRange) {
    return valueRange;
  }

  const fieldKey = normalizeFieldKey(issue.field ?? "");
  const isPrefixIssue = PREFIX_RULE_IDS.has(issue.code) || fieldKey === "meta";

  if (isPrefixIssue) {
    const prefixRange = resolveFplPrefixTokenRange(source);
    if (prefixRange) {
      return prefixRange;
    }
  }

  return resolveFieldNeedleRange(source, fieldKey);
};

type MarkedRange = FplTextRange & {
  tone: "error" | "warning";
  code: string;
};

/**
 * Merges overlapping / adjacent highlight marks into non-overlapping render segments.
 * Error tone wins over warning on overlap; codes are unioned for tooltips.
 * @param {string} source - Full FPL text.
 * @param {FplIssue[]} errors - Error issues.
 * @param {FplIssue[]} warnings - Warning issues.
 * @returns {FplHighlightSegment[]} Ordered segments covering the entire source.
 * @example
 * const segments = buildFplHighlightSegments(raw, result.errors, result.warnings);
 */
export const buildFplHighlightSegments = (
  source: string,
  errors: FplIssue[],
  warnings: FplIssue[],
): FplHighlightSegment[] => {
  if (!source) {
    return [];
  }

  const marks: MarkedRange[] = [];

  errors.forEach((issue) => {
    const range = resolveIssueRange(source, issue);
    if (!range) {
      return;
    }
    marks.push({ ...range, tone: "error", code: issue.code });
  });

  warnings.forEach((issue) => {
    const range = resolveIssueRange(source, issue);
    if (!range) {
      return;
    }
    marks.push({ ...range, tone: "warning", code: issue.code });
  });

  if (marks.length === 0) {
    return [{ text: source, tone: "plain", codes: [], start: 0, end: source.length }];
  }

  const breakpoints = new Set<number>([0, source.length]);
  marks.forEach((mark) => {
    breakpoints.add(mark.start);
    breakpoints.add(mark.end);
  });

  const points = Array.from(breakpoints).sort((a, b) => a - b);
  const segments: FplHighlightSegment[] = [];

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];

    if (end <= start) {
      continue;
    }

    const covering = marks.filter((mark) => mark.start < end && mark.end > start);
    const hasError = covering.some((mark) => mark.tone === "error");
    const hasWarning = covering.some((mark) => mark.tone === "warning");
    const tone: FplHighlightTone = hasError ? "error" : hasWarning ? "warning" : "plain";
    const codes = Array.from(new Set(covering.map((mark) => mark.code)));

    segments.push({
      text: source.slice(start, end),
      tone,
      codes,
      start,
      end,
    });
  }

  return segments;
};

/**
 * Returns true when at least one segment will be rendered with error/warning tone.
 * @param {FplHighlightSegment[]} segments - Built highlight segments.
 * @returns {boolean} Whether colored highlights exist.
 */
export const hasHighlightMarks = (segments: FplHighlightSegment[]): boolean => {
  return segments.some((segment) => segment.tone === "error" || segment.tone === "warning");
};

/**
 * Counts how many issues could not be mapped to a text range.
 * @param {string} source - FPL source.
 * @param {FplIssue[]} issues - Combined errors and warnings.
 * @returns {number} Unmapped issue count.
 */
export const countUnmappedIssues = (source: string, issues: FplIssue[]): number => {
  return issues.filter((issue) => resolveIssueRange(source, issue) === null).length;
};
