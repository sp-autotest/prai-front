import type { ParsedFlightQuery } from "@/types/travel-risk";

const FLIGHT_NUMBER_PATTERN = /\b([A-Z0-9]{2}\d{1,4}[A-Z]?)\b/i;
const ROUTE_SPLIT_PATTERN = /\s*(?:→|->|—|-)\s*/;
const LEADING_FLIGHT_WORD = /^(?:рейс|flight)\s+/i;

export type ParseFlightQueryResult =
  | { ok: true; value: ParsedFlightQuery }
  | { ok: false; code: "empty" | "invalid" };

/**
 * Tries the historical comma-separated shape: `SK1587, Moscow → AMS, 12 September`.
 * @param {string} raw - Trimmed user input.
 * @returns {ParsedFlightQuery | null} Structured query or null when the shape does not match.
 */
const parseCommaSeparatedQuery = (raw: string): ParsedFlightQuery | null => {
  const parts = raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 2) {
    return null;
  }

  const flightToken = parts[0].replace(LEADING_FLIGHT_WORD, "").trim();
  const flightMatch = flightToken.match(/^([A-Z0-9]{2}\d{1,4}[A-Z]?)$/i);

  if (!flightMatch) {
    return null;
  }

  const routePart = parts[1];
  const dateLabel = parts.length >= 3 ? parts.slice(2).join(", ").trim() : "";
  const route = routePart
    .split(ROUTE_SPLIT_PATTERN)
    .map((stop) => stop.trim())
    .filter(Boolean);

  if (route.length < 2) {
    return null;
  }

  return {
    flightNumber: flightMatch[1].toUpperCase(),
    route,
    dateLabel,
    raw,
  };
};

/**
 * Best-effort extraction when the backend parser should own the query.
 * @param {string} raw - Trimmed user input.
 * @returns {ParsedFlightQuery} Query with `raw` always set; other fields may be empty.
 */
const parseLooseQuery = (raw: string): ParsedFlightQuery => {
  const stripped = raw.replace(LEADING_FLIGHT_WORD, "").trim();
  const flightMatch = stripped.match(FLIGHT_NUMBER_PATTERN);
  const arrowRoute = stripped
    .split(ROUTE_SPLIT_PATTERN)
    .map((stop) => stop.trim())
    .filter(Boolean);

  return {
    flightNumber: flightMatch ? flightMatch[1].toUpperCase() : "",
    route: arrowRoute.length >= 2 ? arrowRoute.slice(0, 8) : [],
    dateLabel: "",
    raw,
  };
};

/**
 * Parses a free-form flight query for the Travel Risk UI.
 * Strict comma form is preferred; otherwise the raw string is forwarded to
 * ``POST /api/v1/flights/analyze/`` (backend parser is the source of truth).
 * @param {string} input - Raw user input.
 * @returns {ParseFlightQueryResult} Parsed query or a safe error code.
 */
export const parseFlightQuery = (input: string): ParseFlightQueryResult => {
  const raw = input.trim();

  if (!raw) {
    return { ok: false, code: "empty" };
  }

  const strict = parseCommaSeparatedQuery(raw);
  if (strict) {
    return { ok: true, value: strict };
  }

  return { ok: true, value: parseLooseQuery(raw) };
};
