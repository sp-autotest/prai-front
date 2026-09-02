import type {
  FlightAnalyzeAirline,
  FlightAnalyzeAnalysis,
  FlightAnalyzeMissedConnection,
  FlightAnalyzeParsed,
  FlightAnalyzeResponse,
  ParsedFlightQuery,
  RiskLevel,
  TravelRiskAirline,
  TravelRiskDataQuality,
  TravelRiskFactorStatus,
  TravelRiskFactorStatuses,
  TravelRiskRequest,
  TravelRiskResponse,
  TurbulenceLevel,
} from "@/types/travel-risk";

const RISK_LEVELS: readonly RiskLevel[] = ["low", "medium", "high"];
const TURBULENCE_LEVELS: readonly TurbulenceLevel[] = ["light", "moderate", "severe"];
const FACTOR_KEYS = ["A", "B", "C", "D"] as const;

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
 * Normalizes a backend factor status token.
 * @param {unknown} value - Raw status from ``analysis.factor_status``.
 * @returns {TravelRiskFactorStatus | null} Normalized status or null.
 */
const toFactorStatus = (value: unknown): TravelRiskFactorStatus | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "ok" || normalized === "degraded" || normalized === "unavailable") {
    return normalized;
  }

  return null;
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
 * Resolves place labels that are missing from the airport reference catalog.
 * @param {FlightAnalyzeParsed} parsed - Backend parsed payload.
 * @returns {string[]} Human-readable labels for unknown places.
 */
export const resolveUnknownPlaceLabels = (parsed: FlightAnalyzeParsed): string[] => {
  const places = Array.isArray(parsed.places) ? parsed.places : [];

  return places
    .filter((place) => !place?.iata_code && !place?.airport_id)
    .map((place) => place.label?.trim() || place.iata_code?.trim() || "—")
    .filter(Boolean);
};

/**
 * Maps backend ``analysis.factor_status`` A–D into UI-friendly keys.
 * @param {FlightAnalyzeAnalysis | null} analysis - Backend analysis object.
 * @returns {TravelRiskFactorStatuses | null} Mapped statuses or null when absent.
 */
export const mapFactorStatuses = (
  analysis: FlightAnalyzeAnalysis | null,
): TravelRiskFactorStatuses | null => {
  const raw = analysis?.factor_status;
  if (!raw || typeof raw !== "object") {
    return null;
  }

  return {
    delayHistory: toFactorStatus(raw.A),
    climate: toFactorStatus(raw.B),
    load: toFactorStatus(raw.C),
    rotation: toFactorStatus(raw.D),
  };
};

/**
 * Returns true when every A–D factor is ``unavailable``.
 * @param {FlightAnalyzeAnalysis | null} analysis - Backend analysis object.
 * @returns {boolean} Whether all itinerary factors are unavailable.
 */
export const areAllFactorsUnavailable = (analysis: FlightAnalyzeAnalysis | null): boolean => {
  const raw = analysis?.factor_status;
  if (!raw || typeof raw !== "object") {
    return false;
  }

  const statuses = FACTOR_KEYS.map((key) => toFactorStatus(raw[key]));
  if (statuses.some((status) => status === null)) {
    return false;
  }

  return statuses.every((status) => status === "unavailable");
};

/**
 * Resolves UI data quality from unknown places and factor statuses.
 * @param {string[]} unknownPlaces - Labels missing from reference.
 * @param {FlightAnalyzeAnalysis | null} analysis - Backend analysis object.
 * @returns {TravelRiskDataQuality} Data quality for banners and styling.
 */
export const resolveDataQuality = (
  unknownPlaces: string[],
  analysis: FlightAnalyzeAnalysis | null,
): TravelRiskDataQuality => {
  if (unknownPlaces.length > 0) {
    return "default_estimate";
  }

  if (areAllFactorsUnavailable(analysis)) {
    return "insufficient_data";
  }

  return "accurate";
};

/**
 * Collects parse warnings, scoring warnings, and optional analysis note.
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

  if (Array.isArray(analysis?.warnings)) {
    analysis.warnings.forEach((warning) => {
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
 * Builds route labels from parsed places for UI echo.
 * @param {FlightAnalyzeParsed} parsed - Backend parsed payload.
 * @param {TravelRiskRequest} request - Original frontend request fallback.
 * @returns {string[]} Route labels in order.
 */
const buildRouteLabels = (parsed: FlightAnalyzeParsed, request: TravelRiskRequest): string[] => {
  const places = Array.isArray(parsed.places)
    ? parsed.places
        .map((place) => place?.label?.trim() || place?.iata_code?.trim() || "")
        .filter(Boolean)
    : [];

  if (places.length >= 2) {
    return places;
  }

  return request.route ?? [];
};

/**
 * Maps analysis metrics into the shared Travel Risk response fields.
 * @param {FlightAnalyzeAnalysis} analysis - Backend analysis object.
 * @returns {Pick<TravelRiskResponse, "score" | "delayOver15MinPercent" | "delayOver1HourPercent" | "cancellationPercent" | "connectionRisk" | "turbulence" | "recommendedConnectionMinutes">} Mapped metrics.
 */
const mapAnalysisMetrics = (
  analysis: FlightAnalyzeAnalysis,
): Pick<
  TravelRiskResponse,
  | "score"
  | "delayOver15MinPercent"
  | "delayOver1HourPercent"
  | "cancellationPercent"
  | "connectionRisk"
  | "turbulence"
  | "recommendedConnectionMinutes"
> => {
  const connectionRisk = resolveConnectionRisk(analysis.missed_connection);
  const explicitScore = toNumber(
    analysis.score ?? analysis.travel_risk_score ?? analysis.risk_score,
    Number.NaN,
  );

  return {
    score: Number.isFinite(explicitScore) ? explicitScore : deriveScore(analysis, connectionRisk),
    delayOver15MinPercent: toNumber(analysis.delay_over_15_min_pct, 0),
    delayOver1HourPercent: toNumber(analysis.delay_over_1_hour_pct, 0),
    cancellationPercent: toNumber(analysis.cancellation_pct, 0),
    connectionRisk,
    turbulence: toTurbulence(analysis.turbulence_level, "moderate"),
    recommendedConnectionMinutes: Math.round(
      toNumber(analysis.recommended_min_connection_minutes, 45),
    ),
  };
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
 * Unknown places keep metrics visible with default-estimate styling.
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
  const unknownPlaces = resolveUnknownPlaceLabels(parsed);
  const factorStatuses = mapFactorStatuses(analysis);
  const dataQuality = resolveDataQuality(unknownPlaces, analysis);
  const metricsAreDefaultEstimate = unknownPlaces.length > 0;

  const query: ParsedFlightQuery = {
    flightNumber: (parsed.flight_number || request.flightNumber || "").toString().toUpperCase(),
    route: buildRouteLabels(parsed, request),
    dateLabel: (parsed.travel_date || request.dateLabel || "").toString(),
    raw: response.query || request.raw || buildFlightAnalyzeQuery(request),
  };

  const baseFields = {
    query,
    airline: mapAirline(parsed.airline),
    warnings: collectWarnings(parsed, analysis),
    isStub: Boolean(response.is_stub),
    unknownPlaces,
    dataQuality,
    factorStatuses,
    metricsAreDefaultEstimate,
  };

  const hasAnalysis = analysis !== null && typeof analysis === "object";

  if (!hasAnalysis) {
    const mapped: TravelRiskResponse = {
      ...baseFields,
      scoringAvailable: false,
      scoringUnavailableReason: response.scoring_unavailable_reason ?? null,
      score: null,
      delayOver15MinPercent: null,
      delayOver1HourPercent: null,
      cancellationPercent: null,
      connectionRisk: null,
      turbulence: null,
      recommendedConnectionMinutes: null,
    };

    console.debug("[travel-risk] mapped analyze → UI (no analysis)", {
      queryId: response.query_id,
      reason: mapped.scoringUnavailableReason,
      unknownPlaces: mapped.unknownPlaces,
      airlineKnown: mapped.airline?.known ?? null,
    });

    return mapped;
  }

  const metrics = mapAnalysisMetrics(analysis);
  const scoringAvailable = dataQuality === "accurate";

  const mapped: TravelRiskResponse = {
    ...baseFields,
    scoringAvailable,
    scoringUnavailableReason: scoringAvailable ? null : response.scoring_unavailable_reason ?? null,
    ...metrics,
  };

  console.debug("[travel-risk] mapped analyze → UI", {
    queryId: response.query_id,
    isStub: response.is_stub,
    dataQuality: mapped.dataQuality,
    unknownPlaces: mapped.unknownPlaces,
    metricsAreDefaultEstimate: mapped.metricsAreDefaultEstimate,
    connectionRisk: mapped.connectionRisk,
    turbulence: mapped.turbulence,
  });

  return mapped;
};

/**
 * Returns whether the assessment has enough metric fields to render the grid.
 * @param {TravelRiskResponse} assessment - Mapped assessment.
 * @returns {boolean} True when core metrics are present.
 */
export const hasTravelRiskMetrics = (assessment: TravelRiskResponse): boolean => {
  return (
    assessment.delayOver15MinPercent !== null &&
    assessment.connectionRisk !== null &&
    assessment.turbulence !== null &&
    assessment.recommendedConnectionMinutes !== null
  );
};
