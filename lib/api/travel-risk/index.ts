export { assessTravelRisk } from "@/lib/api/travel-risk/client";
export type { AssessTravelRiskOptions, AssessTravelRiskResult } from "@/lib/api/travel-risk/client";

export {
  buildFlightAnalyzeQuery,
  mapFlightAnalyzeToTravelRisk,
} from "@/lib/api/travel-risk/map-flight-analyze";

export { assessTravelRiskMock, normalizeTravelRiskRequest } from "@/lib/api/travel-risk/mock-adapter";

export { fetchTravelRisk, mapTravelRiskHttpStatus } from "@/lib/api/travel-risk/browser";
export type { FetchTravelRiskResult } from "@/lib/api/travel-risk/browser";
