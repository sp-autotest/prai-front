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

/**
 * Heuristic substrings used when an issue has `field` but no offsets.
 * Kept small and ICAO-oriented for demo / fallback until the API is wired.
 */
const FIELD_NEEDLES: Record<string, string[]> = {
  item7: ["(FPL-", "(FPL"],
  item10: ["-SDE", "-SD", "/M-"],
  item13: ["-LFPG", "-EGLL", "-KJFK"],
  item15: ["DCT", "N0480", "N0450", "N0"],
  item16: ["-KJFK", "-EGLL", "-LFPG"],
  item18: ["DOF/", "RMK/", "EET/", "PBN/"],
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
 * Resolves a text range for an issue: prefers API offsets, else `field` heuristics.
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

  const fieldKey = (issue.field ?? "").trim().toLowerCase();
  const needles = FIELD_NEEDLES[fieldKey] ?? [];

  for (const needle of needles) {
    const start = source.indexOf(needle);
    if (start >= 0) {
      return { start, end: start + needle.length };
    }
  }

  return null;
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
 * Counts how many issues could not be mapped to a text range.
 * @param {string} source - FPL source.
 * @param {FplIssue[]} issues - Combined errors and warnings.
 * @returns {number} Unmapped issue count.
 */
export const countUnmappedIssues = (source: string, issues: FplIssue[]): number => {
  return issues.filter((issue) => resolveIssueRange(source, issue) === null).length;
};
