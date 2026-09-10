import type {
  ParsedFlightQuery,
  TravelRiskConnectionHub,
  TravelRiskMissedConnection,
  TravelRiskRequest,
  TravelRiskResponse,
} from "@/types/travel-risk";

/**
 * Normalizes a Travel Risk request into a `ParsedFlightQuery` echo payload.
 * Prefers `raw` (backend parser is the source of truth). Structured fields are optional.
 * @param {TravelRiskRequest} request - Incoming API request.
 * @returns {ParsedFlightQuery} Normalized query.
 * @throws {Error} If neither `raw` nor `flightNumber` is present.
 */
export const normalizeTravelRiskRequest = (request: TravelRiskRequest): ParsedFlightQuery => {
  const flightNumber = request.flightNumber?.trim().toUpperCase() ?? "";
  const route = (request.route ?? [])
    .filter((stop): stop is string => typeof stop === "string")
    .map((stop) => stop.trim())
    .filter(Boolean);
  const dateLabel = request.dateLabel?.trim() ?? "";
  const raw =
    request.raw?.trim() ||
    [flightNumber, route.join(" → "), dateLabel].filter(Boolean).join(", ");

  if (!raw) {
    throw new Error("Invalid Travel Risk request: raw query or flightNumber is required.");
  }

  return {
    flightNumber,
    route,
    dateLabel,
    raw,
  };
};

/**
 * Mock Travel Risk adapter for local development without a backend.
 * Opt-in via `TRAVEL_RISK_USE_MOCK=true` (Phase 12 defaults to the real analyze API).
 * @param {TravelRiskRequest} request - Assessment request.
 * @returns {Promise<TravelRiskResponse>} Mock assessment payload.
 * @example
 * const result = await assessTravelRiskMock({
 *   flightNumber: "SK1587",
 *   route: ["Moscow", "Istanbul", "Amsterdam"],
 * });
 */
export const assessTravelRiskMock = async (
  request: TravelRiskRequest,
): Promise<TravelRiskResponse> => {
  const query = normalizeTravelRiskRequest(request);

  await new Promise((resolve) => {
    setTimeout(resolve, 650);
  });

  const hubLabels = query.route.length > 2 ? query.route.slice(1, -1) : [];
  const missedConnections: TravelRiskMissedConnection[] = hubLabels.map((label, index) => {
    const isLastHub = index === hubLabels.length - 1;
    const isMultiHub = hubLabels.length > 1;

    return {
      airportIata: null,
      airportLabel: label,
      riskLevel: isMultiHub ? (isLastHub ? "medium" : "low") : "high",
      recommendedConnectionMinutes: isMultiHub && isLastHub ? 105 : 75,
    };
  });
  const recommendedConnectionHubs: TravelRiskConnectionHub[] =
    hubLabels.length === 0
      ? []
      : [
          {
            airportIata: null,
            airportLabel: hubLabels[hubLabels.length - 1],
          },
        ];
  const recommendedConnectionMinutes =
    hubLabels.length === 0 ? 0 : hubLabels.length > 1 ? 105 : 75;
  const connectionRisk =
    hubLabels.length === 0 ? "low" : hubLabels.length > 1 ? "medium" : "high";

  return {
    scoringAvailable: true,
    scoringUnavailableReason: null,
    score: hubLabels.length > 0 ? 72 : 41,
    delayOver15MinPercent: 38,
    delayOver1HourPercent: 12,
    cancellationPercent: 1.4,
    connectionRisk,
    turbulence: "moderate",
    recommendedConnectionMinutes,
    missedConnections,
    recommendedConnectionHubs,
    query,
    airline: null,
    warnings: [],
    isStub: true,
    unknownPlaces: [],
    dataQuality: "accurate",
    factorStatuses: null,
    metricsAreDefaultEstimate: false,
    pastTravelDate: null,
  };
};
