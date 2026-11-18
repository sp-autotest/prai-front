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

export type ConnectionTicketMode = "self_transfer" | "through";

export type ConnectionQuality = "calibrated" | "proxy" | "incomplete";

/**
 * One addend inside a connection answer. ``quote`` is present only for staff.
 */
export type ConnectionLineItem = {
  key: string;
  minutes: number;
  source_kind: string;
  quote?: string;
};

/**
 * One hub answer from ``POST /api/v1/flights/connection/``.
 * Minutes are already compiled. The client must not sum them.
 */
export type ConnectionItem = {
  ticket_mode: ConnectionTicketMode;
  minutes: number | null;
  minutes_separate_no_border: number | null;
  minutes_separate_with_border: number | null;
  minutes_ref: "no_border" | "with_border" | null;
  quality: ConnectionQuality | null;
  skip_reason: string | null;
  baggage_input: string;
  last_bag_key: string | null;
  cutoff_airline: string;
  raised_to_mct: boolean;
  mct_floor: number | null;
  compiled_as_of: string | null;
  no_border_items: ConnectionLineItem[];
  with_border_items: ConnectionLineItem[];
};

/**
 * Envelope for ``POST /api/v1/flights/connection/``.
 */
export type ConnectionResponse = {
  iata: string;
  count: number;
  items: ConnectionItem[];
};

/**
 * Body forwarded to the connection endpoint.
 * ``ticket_mode`` is omitted when both answers are requested.
 * ``has_baggage`` is sent only as ``false`` (cabin bag).
 */
export type ConnectionRequestBody = {
  iata: string;
  ticket_mode?: ConnectionTicketMode;
  has_baggage?: false;
};
