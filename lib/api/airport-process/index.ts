export {
  buildConnectionRequestBody,
  fetchAirportProcessExtractOnBackend,
  fetchConnectionOnBackend,
  normalizeAirportProcessIata,
} from "@/lib/api/airport-process/client";
export type { AirportProcessApiResult, ConnectionQueryInput } from "@/lib/api/airport-process/client";

export { fetchAirportProcessExtract, fetchConnection } from "@/lib/api/airport-process/browser";
