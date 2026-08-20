import type {
  FlightAnalyzeAirline,
  FlightAnalyzeAnalysis,
  FlightAnalyzeMissedConnection,
  FlightAnalyzeParsed,
  FlightAnalyzeResponse,
  ParsedFlightQuery,
  RiskLevel,
  TravelRiskAirline,
  TravelRiskRequest,
  TravelRiskResponse,
  TurbulenceLevel,
} from "@/types/travel-risk";

const RISK_LEVELS: readonly RiskLevel[] = ["low", "medium", "high"];
const TURBULENCE_LEVELS: readonly TurbulenceLevel[] = ["light", "moderate", "severe"];

const RISK_ALIASES: Record<string, RiskLevel> = {
  low: "low",
  medium: "medium",
  moderate: "medium",
  high: "high",
};

const TURBULENCE_ALIASES: Record<string, TurbulenceLevel> = {
  light: "light",
  low: "light",
  moderate: "moderate",
  medium: "moderate",
  severe: "severe",
  high: "severe",
};

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
 * Normalizes a risk level string to the UI union, with alias map (`moderate` → `medium`).
 * @param {unknown} value - Raw risk level.
 * @param {RiskLevel} fallback - Default when unknown.
 * @returns {RiskLevel} Normalized risk level.
 */
const toRiskLevel = (value: unknown, fallback: RiskLevel = "low"): RiskLevel => {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (RISK_ALIASES[normalized]) {
    return RISK_ALIASES[normalized];
  }

  return (RISK_LEVELS as readonly string[]).includes(normalized)
    ? (normalized as RiskLevel)
    : fallback;
};

/**
 * Normalizes turbulence to the UI union (`low`→`light`, `high`→`severe`).
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
  if (TURBULENCE_ALIASES[normalized]) {
    return TURBULENCE_ALIASES[normalized];
  }

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
 * Maps backend `parsed.airline` into the UI airline block.
 * @param {FlightAnalyzeAirline | null | undefined} airline - Backend airline node.
 * @returns {TravelRiskAirline | null} UI airline or null when absent.
 */
const mapAirline = (airline: FlightAnalyzeAirline | null | undefined): TravelRiskAirline | null => {
  if (!airline || typeof airline !== "object") {
    return null;
  }

  const iataCode = airline.iata_code?.trim() || null;
  const icaoCode = airline.icao_code?.trim() || null;
  const name = airline.name?.trim() || null;

  if (!iataCode && !icaoCode && !name && airline.known !== false) {
    return null;
  }

  return {
    iataCode,
    icaoCode,
    name,
    known: airline.known !== false,
  };
};

/**
 * Collects parse warnings plus optional analysis note.
 * @param {FlightAnalyzeParsed} parsed - Backend parsed payload.
 * @param {FlightAnalyzeAnalysis | null} analysis - Analysis or null.
 * @returns {string[]} Unique non-empty warnings.
 */
const collectWarnings = (
  parsed: FlightAnalyzeParsed,
  analysis: FlightAnalyzeAnalysis | null,
): string[] => {
  const items: string[] = [];

  if (Array.isArray(parsed.warnings)) {
    parsed.warnings.forEach((warning) => {
      if (typeof warning === "string" && warning.trim()) {
        items.push(warning.trim());
      }
    });
  }

  if (analysis?.note && typeof analysis.note === "string" && analysis.note.trim()) {
    items.push(analysis.note.trim());
  }

  return Array.from(new Set(items));
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
 * Honors ``scoring_available=false`` / ``analysis=null`` without fake metrics.
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
  const parsed = response.parsed ?? {};
  const analysis = response.analysis;

  const places = Array.isArray(parsed.places)
    ? parsed.places
        .map((place) => place?.label?.trim() || place?.iata_code?.trim() || "")
        .filter(Boolean)
    : [];

  const query: ParsedFlightQuery = {
    flightNumber: (parsed.flight_number || request.flightNumber || "").toString().toUpperCase(),
    route: places.length >= 2 ? places : request.route ?? [],
    dateLabel: (parsed.travel_date || request.dateLabel || "").toString(),
    raw: response.query || request.raw || buildFlightAnalyzeQuery(request),
  };

  if (response.scoring_available === false || analysis === null || typeof analysis !== "object") {
    const mapped: TravelRiskResponse = {
      scoringAvailable: false,
      scoringUnavailableReason: response.scoring_unavailable_reason ?? null,
      score: null,
      delayOver15MinPercent: null,
      delayOver1HourPercent: null,
      cancellationPercent: null,
      connectionRisk: null,
      turbulence: null,
      recommendedConnectionMinutes: null,
      query,
      airline: mapAirline(parsed.airline),
      warnings: collectWarnings(parsed, null),
      isStub: Boolean(response.is_stub),
    };

    console.debug("[travel-risk] mapped analyze → UI (scoring unavailable)", {
      queryId: response.query_id,
      reason: mapped.scoringUnavailableReason,
      airlineKnown: mapped.airline?.known ?? null,
    });

    return mapped;
  }

  const connectionRisk = resolveConnectionRisk(analysis.missed_connection);
  const explicitScore = toNumber(
    analysis.score ?? analysis.travel_risk_score ?? analysis.risk_score,
    Number.NaN,
  );

  const mapped: TravelRiskResponse = {
    scoringAvailable: true,
    scoringUnavailableReason: null,
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
    airline: mapAirline(parsed.airline),
    warnings: collectWarnings(parsed, analysis),
    isStub: Boolean(response.is_stub),
  };

  console.debug("[travel-risk] mapped analyze → UI", {
    queryId: response.query_id,
    isStub: response.is_stub,
    scoreSource: Number.isFinite(explicitScore) ? "api" : "derived",
    connectionRisk: mapped.connectionRisk,
    turbulence: mapped.turbulence,
  });

  return mapped;
};
