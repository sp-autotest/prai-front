/**
 * Types for ``GET /api/v1/flights/airport-process/extract/`` (self-transfer landside times).
 */

export type AirportProcessClientErrorCode =
  | "invalid"
  | "authRequired"
  | "notFound"
  | "network"
  | "timeout"
  | "server";

export type AirportProcessBagBreakdown = {
  national?: number | null;
  schengen?: number | null;
  extra_nb?: number | null;
  extra_wb?: number | null;
  common?: number | null;
};

export type AirportProcessSecurityBreakdown = {
  sensitive?: number | null;
  other?: number | null;
  common?: number | null;
};

export type AirportProcessTerminalLink = {
  from?: string;
  to?: string;
  mode?: string;
  ride_min?: number | null;
  headway_min?: number | null;
  self_transfer_landside?: boolean;
};

export type AirportProcessCitation = {
  source_url?: string;
  as_of?: string | null;
  quote?: string;
  source_kind?: string;
};

/**
 * Landside times for changing flights on two separate tickets (raw card).
 * UI must not sum these fields — use ``compiled`` instead.
 */
export type AirportProcessExtractCard = {
  id: number;
  as_of: string | null;
  source_kind: string;
  percentile: number;
  deplane_first: number | null;
  checkin_queue: number | null;
  first_bag: AirportProcessBagBreakdown | null;
  last_bag: AirportProcessBagBreakdown | null;
  security: AirportProcessSecurityBreakdown | null;
  terminal_links: AirportProcessTerminalLink[];
  checkin_close_min: number | null;
  gate_close_min: number | null;
  cutoff_airline: string;
  citations: Record<string, AirportProcessCitation>;
  update_datetime: string;
};

/**
 * One addend in a backend-compiled self-transfer total.
 */
export type AirportProcessCompileLine = {
  key: string;
  minutes: number;
  source_kind: string;
};

/**
 * Backend-compiled self-transfer minutes for one hub.
 * Do not recompute from ``extract`` on the client.
 */
export type AirportProcessCompiled = {
  minutes_separate_no_border: number | null;
  minutes_separate_with_border: number | null;
  skip_reason: string | null;
  no_border_items: AirportProcessCompileLine[];
  with_border_items: AirportProcessCompileLine[];
};

/**
 * One listed transfer airport plus its card and compiled totals (if any).
 */
export type AirportProcessExtractHub = {
  iata: string;
  enabled: boolean;
  kind: string;
  urls: string[];
  extract_status: string;
  last_ok_at: string | null;
  last_error: string;
  extract: AirportProcessExtractCard | null;
  compiled: AirportProcessCompiled | null;
};

/**
 * Envelope for ``GET .../airport-process/extract/``.
 */
export type AirportProcessExtractList = {
  count: number;
  items: AirportProcessExtractHub[];
};
