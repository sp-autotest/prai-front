/** Risk level for qualitative metrics (connection risk). */
export type RiskLevel = "low" | "medium" | "high";

/** Turbulence qualitative value (UI). Backend may send `low`/`high` aliases. */
export type TurbulenceLevel = "light" | "moderate" | "severe";

/**
 * Normalized flight query extracted from a free-form input string.
 * Used by the parser and as the `query` echo on successful responses.
 */
export type ParsedFlightQuery = {
  flightNumber: string;
  route: string[];
  dateLabel: string;
  raw: string;
};

/**
 * Travel Risk API request body used by the frontend BFF / UI.
 * Prefer `raw`: backend ``POST /api/v1/flights/analyze/`` parses free text.
 */
export type TravelRiskRequest = {
  flightNumber?: string;
  route?: string[];
  dateLabel?: string;
  raw?: string;
};

/** Airline block from backend `parsed.airline`. */
export type TravelRiskAirline = {
  iataCode: string | null;
  icaoCode: string | null;
  name: string | null;
  known: boolean;
};

/** Per-factor status from backend ``analysis.factor_status`` (A–D). */
export type TravelRiskFactorStatus = "ok" | "degraded" | "unavailable";

/** Itinerary factor statuses after mapping backend A–D keys. */
export type TravelRiskFactorStatuses = {
  delayHistory: TravelRiskFactorStatus | null;
  climate: TravelRiskFactorStatus | null;
  load: TravelRiskFactorStatus | null;
  rotation: TravelRiskFactorStatus | null;
};

/**
 * UI data quality hint for banners and metric styling.
 * - `accurate` — known places and at least one factor is not fully unavailable.
 * - `default_estimate` — unknown places in reference; metrics may be fallbacks.
 * - `insufficient_data` — no unknown places but all A–D factors unavailable.
 */
export type TravelRiskDataQuality = "accurate" | "default_estimate" | "insufficient_data";

/**
 * UI hub that contributed the root max ``recommended_min_connection_minutes``.
 */
export type TravelRiskConnectionHub = {
  airportIata: string | null;
  airportLabel: string;
};

/**
 * UI missed-connection row after mapping ``analysis.missed_connection``.
 */
export type TravelRiskMissedConnection = {
  airportIata: string | null;
  airportLabel: string;
  riskLevel: RiskLevel;
  recommendedConnectionMinutes: number | null;
};

/**
 * Successful Travel Risk payload for the UI after mapping from the backend.
 * Metrics are `null` only when ``analysis=null`` (e.g. unknown airline).
 */
export type TravelRiskResponse = {
  scoringAvailable: boolean;
  scoringUnavailableReason: string | null;
  score: number | null;
  delayOver15MinPercent: number | null;
  delayOver1HourPercent: number | null;
  cancellationPercent: number | null;
  connectionRisk: RiskLevel | null;
  turbulence: TurbulenceLevel | null;
  recommendedConnectionMinutes: number | null;
  /** Per-hub connection rows; empty when non-stop, stub, or ``analysis=null``. */
  missedConnections: TravelRiskMissedConnection[];
  /**
   * Hubs that produced the root max recommended minutes (ties: every max hub).
   * Empty when the backend omitted ``recommended_min_connection_hubs``.
   */
  recommendedConnectionHubs: TravelRiskConnectionHub[];
  query: ParsedFlightQuery;
  airline: TravelRiskAirline | null;
  warnings: string[];
  isStub: boolean;
  /** Labels of parsed places missing from the airport reference. */
  unknownPlaces: string[];
  dataQuality: TravelRiskDataQuality;
  factorStatuses: TravelRiskFactorStatuses | null;
  /** True when metrics are shown as default/fallback due to unknown places. */
  metricsAreDefaultEstimate: boolean;
  /**
   * ISO date (`YYYY-MM-DD`) from ``parsed.warnings`` token ``PAST_TRAVEL_DATE: …``.
   * Null when the travel date is today/future or absent.
   */
  pastTravelDate: string | null;
};

/** UI-facing assessment type (alias of the successful API response). */
export type TravelRiskAssessment = TravelRiskResponse;

/** Machine-readable error codes returned by the Travel Risk API / BFF. */
export type TravelRiskApiErrorCode =
  | "invalid_json"
  | "invalid_query"
  | "assessment_failed"
  | "upstream_error"
  | "auth_required";

/** Error JSON body from the Travel Risk API. */
export type TravelRiskApiErrorBody = {
  error: TravelRiskApiErrorCode | string;
  message: string;
};

/** Client-side failure codes mapped to i18n messages. */
export type TravelRiskClientErrorCode =
  | "network"
  | "invalid"
  | "server"
  | "timeout"
  | "authRequired";

/** UI state machine for the Travel Risk search block. */
export type TravelRiskUiState = "idle" | "loading" | "success" | "empty" | "error";

/**
 * Backend request for ``POST /api/v1/flights/analyze/``.
 * @see FlightAnalyzeRequestSerializer
 */
export type FlightAnalyzeRequest = {
  query: string;
};

/** Place node inside the backend `parsed` payload. */
export type FlightAnalyzePlace = {
  label?: string;
  iata_code?: string | null;
  airport_id?: number | null;
  ambiguous?: boolean;
  candidates?: string[];
};

/** Airline node inside backend `parsed.airline`. */
export type FlightAnalyzeAirline = {
  iata_code?: string | null;
  icao_code?: string | null;
  name?: string | null;
  known?: boolean;
};

/** Connection risk item from backend `analysis.missed_connection`. */
export type FlightAnalyzeMissedConnection = {
  airport_iata?: string;
  airport_label?: string;
  risk_level?: string;
  /** Per-hub MCT+buffer; omitted on stub / older payloads. */
  recommended_min_connection_minutes?: number | null;
};

/**
 * Hub that produced the itinerary-level max recommended connection time.
 * Backend ``analysis.recommended_min_connection_hubs`` (ties include every max hub).
 */
export type FlightAnalyzeConnectionHub = {
  airport_iata?: string;
  airport_label?: string;
};

/**
 * Backend `analysis` object (fields may be partial / stub).
 * OpenAPI marks analysis as a free-form object; this documents known keys.
 */
/** Backend ``analysis.factor_status`` itinerary block (A–D). */
export type FlightAnalyzeFactorStatus = {
  A?: string;
  B?: string;
  C?: string;
  D?: string;
};

export type FlightAnalyzeAnalysis = {
  score?: number;
  travel_risk_score?: number;
  risk_score?: number;
  delay_over_15_min_pct?: number;
  delay_over_1_hour_pct?: number;
  cancellation_pct?: number;
  missed_connection?: FlightAnalyzeMissedConnection[];
  /** Hubs whose per-hub recommended minutes equal the itinerary max. */
  recommended_min_connection_hubs?: FlightAnalyzeConnectionHub[];
  turbulence_level?: string;
  recommended_min_connection_minutes?: number;
  factor_status?: FlightAnalyzeFactorStatus;
  warnings?: string[];
  note?: string;
  [key: string]: unknown;
};

/**
 * Backend `parsed` object (fields may be partial).
 */
export type FlightAnalyzeParsed = {
  flight_number?: string | null;
  travel_date?: string | null;
  places?: FlightAnalyzePlace[];
  warnings?: string[];
  airline?: FlightAnalyzeAirline | null;
  [key: string]: unknown;
};

/** Machine reason when scoring is skipped (HTTP 200, ``analysis=null``). */
export type FlightAnalyzeScoringUnavailableReason = "AIRLINE_NOT_IN_REFERENCE" | string;

/**
 * Backend response for ``POST /api/v1/flights/analyze/``.
 * @see FlightAnalyzeResponse
 */
export type FlightAnalyzeResponse = {
  query_id: number;
  query: string;
  parsed: FlightAnalyzeParsed;
  scoring_available?: boolean;
  scoring_unavailable_reason?: FlightAnalyzeScoringUnavailableReason | null;
  analysis: FlightAnalyzeAnalysis | null;
  is_stub: boolean;
  stub_id?: number | null;
  matched_sample_query?: string | null;
};
