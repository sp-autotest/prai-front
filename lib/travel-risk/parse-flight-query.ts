import type { ParsedFlightQuery } from "@/types/travel-risk";

const FLIGHT_NUMBER_PATTERN = /^[A-Z0-9]{2}\d{1,4}[A-Z]?$/i;
const ROUTE_SPLIT_PATTERN = /\s*(?:→|->|—|-)\s*/;

export type ParseFlightQueryResult =
  | { ok: true; value: ParsedFlightQuery }
  | { ok: false; code: "empty" | "invalid" };

/**
 * Parses a free-form flight query into flight number, route stops, and date label.
 * Accepts examples like: `SK1587, Moscow → Istanbul → Amsterdam, 12 September`.
 * @param {string} input - Raw user input.
 * @returns {ParseFlightQueryResult} Parsed query or a safe error code.
 */
export const parseFlightQuery = (input: string): ParseFlightQueryResult => {
  const raw = input.trim();

  if (!raw) {
    return { ok: false, code: "empty" };
  }

  const parts = raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 2) {
    return { ok: false, code: "invalid" };
  }

  const flightNumber = parts[0].toUpperCase();

  if (!FLIGHT_NUMBER_PATTERN.test(flightNumber)) {
    return { ok: false, code: "invalid" };
  }

  const routePart = parts.length >= 3 ? parts[1] : parts[1];
  const dateLabel = parts.length >= 3 ? parts.slice(2).join(", ").trim() : "";

  const route = routePart
    .split(ROUTE_SPLIT_PATTERN)
    .map((stop) => stop.trim())
    .filter(Boolean);

  if (route.length < 2) {
    return { ok: false, code: "invalid" };
  }

  return {
    ok: true,
    value: {
      flightNumber,
      route,
      dateLabel,
      raw,
    },
  };
};
