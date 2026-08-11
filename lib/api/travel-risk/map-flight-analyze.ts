import type {
  FlightAnalyzeAnalysis,
  FlightAnalyzeMissedConnection,
  FlightAnalyzeResponse,
  ParsedFlightQuery,
  RiskLevel,
  TravelRiskRequest,
  TravelRiskResponse,
  TurbulenceLevel,
} from "@/types/travel-risk";

const RISK_LEVELS: readonly RiskLevel[] = ["low", "medium", "high"];
const TURBULENCE_LEVELS: readonly TurbulenceLevel[] = ["light", "moderate", "severe"];

/**
 * Coerces an unknown value to a finite number, or returns the fallback.
 * @param {unknown} value - Raw API value.
 * @param {number} fallback - Value used when coercion fails.
 * @returns {number} Finite number.
 */
const toNumber = (value: unknown, fallback: number): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
};

/**
 * Normalizes a risk level string to the UI union, with fallback.
 * @param {unknown} value - Raw risk level.
 * @param {RiskLevel} fallback - Default when unknown.
 * @returns {RiskLevel} Normalized risk level.
 */
const toRiskLevel = (value: unknown, fallback: RiskLevel = "low"): RiskLevel => {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  return (RISK_LEVELS as readonly string[]).includes(normalized)
    ? (normalized as RiskLevel)
    : fallback;
};

/**
 * Normalizes turbulence to the UI union, with fallback.
 * @param {unknown} value - Raw turbulence level.
 * @param {TurbulenceLevel} fallback - Default when unknown.
 * @returns {TurbulenceLevel} Normalized turbulence.
 */
const toTurbulence = (
  value: unknown,
  fallback: TurbulenceLevel = "moderate",
): TurbulenceLevel => {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  return (TURBULENCE_LEVELS as readonly string[]).includes(normalized)
    ? (normalized as TurbulenceLevel)
    : fallback;
};

/**
 * Picks the highest connection risk from the missed_connection array.
 * @param {FlightAnalyzeMissedConnection[] | undefined} items - Backend connection risks.
 * @returns {RiskLevel} Worst risk level, or `low` when empty/missing.
 */
const resolveConnectionRisk = (
  items: FlightAnalyzeMissedConnection[] | undefined,
): RiskLevel => {
  if (!Array.isArray(items) || items.length === 0) {
    return "low";
  }

  const rank: Record<RiskLevel, number> = { low: 1, medium: 2, high: 3 };
  let worst: RiskLevel = "low";

  items.forEach((item) => {
    const level = toRiskLevel(item?.risk_level, "low");
    if (rank[level] > rank[worst]) {
      worst = level;
    }
  });

  return worst;
};

/**
 * Derives a 0–100 Travel Risk score when the backend omits an explicit score.
 * Weighted from delay, cancellation, and connection risk (Phase 12 fallback).
 * @param {FlightAnalyzeAnalysis} analysis - Backend analysis object.
 * @param {RiskLevel} connectionRisk - Resolved connection risk.
 * @returns {number} Derived score clamped to 0..100.
 */
const deriveScore = (analysis: FlightAnalyzeAnalysis, connectionRisk: RiskLevel): number => {
  const delay15 = toNumber(analysis.delay_over_15_min_pct, 0);
  const delay60 = toNumber(analysis.delay_over_1_hour_pct, 0);
  const cancellation = toNumber(analysis.cancellation_pct, 0);
  const connectionPenalty = connectionRisk === "high" ? 25 : connectionRisk === "medium" ? 12 : 0;

  const raw = delay15 * 0.7 + delay60 * 1.2 + cancellation * 4 + connectionPenalty;
  return Math.max(0, Math.min(100, Math.round(raw)));
};

/**
 * Builds a free-text analyze query for the backend from a structured request.
 * Prefers the original user `raw` string when present.
 * @param {TravelRiskRequest} request - Structured frontend request.
 * @returns {string} Free-text query for ``POST /api/v1/flights/analyze/``.
 */
export const buildFlightAnalyzeQuery = (request: TravelRiskRequest): string => {
  if (request.raw?.trim()) {
    return request.raw.trim();
  }

  const parts = [
    request.flightNumber?.trim(),
    Array.isArray(request.route) ? request.route.filter(Boolean).join(" → ") : "",
    request.dateLabel?.trim() ?? "",
  ].filter(Boolean);

  return parts.join(", ");
};

/**
 * Maps backend FlightAnalyzeResponse → UI TravelRiskResponse.
 * Applies fallbacks for missing/partial analysis fields.
 * @param {FlightAnalyzeResponse} response - Backend analyze payload.
 * @param {TravelRiskRequest} request - Original frontend request (for query echo fallback).
 * @returns {TravelRiskResponse} UI-ready assessment.
 * @example
 * const ui = mapFlightAnalyzeToTravelRisk(apiResponse, request);
 */
export const mapFlightAnalyzeToTravelRisk = (
  response: FlightAnalyzeResponse,
  request: TravelRiskRequest,
): TravelRiskResponse => {
  const analysis = response.analysis ?? {};
  const parsed = response.parsed ?? {};
  const connectionRisk = resolveConnectionRisk(analysis.missed_connection);

  const explicitScore = toNumber(
    analysis.score ?? analysis.travel_risk_score ?? analysis.risk_score,
    Number.NaN,
  );

  const places = Array.isArray(parsed.places)
    ? parsed.places
        .map((place) => place?.label?.trim())
        .filter((label): label is string => Boolean(label))
    : [];

  const query: ParsedFlightQuery = {
    flightNumber: (parsed.flight_number || request.flightNumber || "").toString().toUpperCase(),
    route: places.length >= 2 ? places : request.route,
    dateLabel: (parsed.travel_date || request.dateLabel || "").toString(),
    raw: response.query || request.raw || buildFlightAnalyzeQuery(request),
  };

  const mapped: TravelRiskResponse = {
    score: Number.isFinite(explicitScore) ? explicitScore : deriveScore(analysis, connectionRisk),
    delayOver15MinPercent: toNumber(analysis.delay_over_15_min_pct, 0),
    delayOver1HourPercent: toNumber(analysis.delay_over_1_hour_pct, 0),
    cancellationPercent: toNumber(analysis.cancellation_pct, 0),
    connectionRisk,
    turbulence: toTurbulence(analysis.turbulence_level, "moderate"),
    recommendedConnectionMinutes: Math.round(
      toNumber(analysis.recommended_min_connection_minutes, 45),
    ),
    query,
  };

  console.debug("[travel-risk] mapped analyze → UI", {
    queryId: response.query_id,
    isStub: response.is_stub,
    scoreSource: Number.isFinite(explicitScore) ? "api" : "derived",
    connectionRisk: mapped.connectionRisk,
  });

  return mapped;
};
