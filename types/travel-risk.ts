/** Risk level for qualitative metrics (connection risk). */
export type RiskLevel = "low" | "medium" | "high";

/** Turbulence qualitative value. */
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
 * `dateLabel` / `raw` are optional; `raw` is preferred when calling the backend analyze API.
 */
export type TravelRiskRequest = {
  flightNumber: string;
  route: string[];
  dateLabel?: string;
  raw?: string;
};

/**
 * Successful Travel Risk payload for the UI after mapping from the backend.
 */
export type TravelRiskResponse = {
  score: number;
  delayOver15MinPercent: number;
  delayOver1HourPercent: number;
  cancellationPercent: number;
  connectionRisk: RiskLevel;
  turbulence: TurbulenceLevel;
  recommendedConnectionMinutes: number;
  query: ParsedFlightQuery;
};

/** UI-facing assessment type (alias of the successful API response). */
export type TravelRiskAssessment = TravelRiskResponse;

/** Machine-readable error codes returned by the Travel Risk API / BFF. */
export type TravelRiskApiErrorCode =
  | "invalid_json"
  | "invalid_query"
  | "assessment_failed"
  | "upstream_error";

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
 * @see FlightAnalyzeRequestRequest
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

/** Connection risk item from backend `analysis.missed_connection`. */
export type FlightAnalyzeMissedConnection = {
  airport_iata?: string;
  airport_label?: string;
  risk_level?: string;
};

/**
 * Backend `analysis` object (fields may be partial / stub).
 * OpenAPI marks analysis as a free-form object; this documents known keys.
 */
export type FlightAnalyzeAnalysis = {
  score?: number;
  travel_risk_score?: number;
  risk_score?: number;
  delay_over_15_min_pct?: number;
  delay_over_1_hour_pct?: number;
  cancellation_pct?: number;
  missed_connection?: FlightAnalyzeMissedConnection[];
  turbulence_level?: string;
  recommended_min_connection_minutes?: number;
  [key: string]: unknown;
};

/**
 * Backend `parsed` object (fields may be partial).
 */
export type FlightAnalyzeParsed = {
  flight_number?: string;
  travel_date?: string;
  places?: FlightAnalyzePlace[];
  warnings?: string[];
  [key: string]: unknown;
};

/**
 * Backend response for ``POST /api/v1/flights/analyze/``.
 * @see FlightAnalyzeResponse
 */
export type FlightAnalyzeResponse = {
  query_id: number;
  query: string;
  parsed: FlightAnalyzeParsed;
  analysis: FlightAnalyzeAnalysis;
  is_stub: boolean;
  stub_id?: number | null;
  matched_sample_query?: string | null;
};
