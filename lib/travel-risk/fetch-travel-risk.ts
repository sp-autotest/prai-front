/**
 * Compatibility re-export — prefer `@/lib/api` in new code.
 */
export { fetchTravelRisk } from "@/lib/api";
export type { FetchTravelRiskResult } from "@/lib/api";

/** @deprecated Use `TravelRiskClientErrorCode` from `@/types/travel-risk`. */
export type FetchTravelRiskErrorCode = "network" | "invalid" | "server" | "timeout";
