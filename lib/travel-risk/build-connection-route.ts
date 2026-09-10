import type {
  TravelRiskConnectionHub,
  TravelRiskMissedConnection,
} from "@/types/travel-risk";

/** One stop on the connection route strip (origin, hub, or destination). */
export type ConnectionRouteStop = {
  label: string;
  hub: TravelRiskMissedConnection | null;
  isTightest: boolean;
  isEndpoint: boolean;
};

/**
 * Returns true when a missed-connection hub is listed in the max-hubs set.
 * Matches IATA first, then case-insensitive label.
 * @param {TravelRiskMissedConnection} hub - Mapped hub row.
 * @param {TravelRiskConnectionHub[]} tightest - ``recommended_min_connection_hubs``.
 * @returns {boolean} Whether this hub produced the itinerary max minutes.
 */
const isTightestHub = (
  hub: TravelRiskMissedConnection,
  tightest: TravelRiskConnectionHub[],
): boolean => {
  const iata = hub.airportIata?.toUpperCase() ?? "";
  const label = hub.airportLabel.trim().toLowerCase();

  return tightest.some((item) => {
    const tightestIata = item.airportIata?.toUpperCase() ?? "";
    const tightestLabel = item.airportLabel.trim().toLowerCase();

    if (iata && tightestIata && iata === tightestIata) {
      return true;
    }

    return Boolean(label && tightestLabel && label === tightestLabel);
  });
};

/**
 * Builds ordered route-strip stops: endpoints from ``query.route``, hubs from ``missed_connection``.
 * Origin/destination never get MCT chips. Intermediate stops zip to hubs by IATA/label, then order.
 * @param {string[]} route - Echoed place labels (origin … dest).
 * @param {TravelRiskMissedConnection[]} hubs - Mapped ``missed_connection`` in itinerary order.
 * @param {TravelRiskConnectionHub[]} tightest - Hubs that produced the root max minutes.
 * @returns {ConnectionRouteStop[]} Stops for the strip, or `[]` when there are no hubs.
 * @example
 * buildConnectionRouteStops(
 *   ["Moscow", "Bishkek", "Istanbul", "Moscow"],
 *   [{ airportIata: "FRU", airportLabel: "Bishkek", riskLevel: "medium", recommendedConnectionMinutes: 75 }],
 *   [],
 * );
 */
export const buildConnectionRouteStops = (
  route: string[],
  hubs: TravelRiskMissedConnection[],
  tightest: TravelRiskConnectionHub[],
): ConnectionRouteStop[] => {
  if (hubs.length === 0) {
    return [];
  }

  if (route.length < 2) {
    return hubs.map((hub) => ({
      label: hub.airportLabel || hub.airportIata || "—",
      hub,
      isTightest: isTightestHub(hub, tightest),
      isEndpoint: false,
    }));
  }

  const unused = [...hubs];

  return route.map((label, index) => {
    const isEndpoint = index === 0 || index === route.length - 1;

    if (isEndpoint) {
      return { label, hub: null, isTightest: false, isEndpoint: true };
    }

    const labelLower = label.trim().toLowerCase();
    const labelUpper = label.trim().toUpperCase();
    const matchIndex = unused.findIndex((hub) => {
      const iata = hub.airportIata?.toUpperCase() ?? "";
      const hubLabel = hub.airportLabel.trim().toLowerCase();
      return (iata && iata === labelUpper) || Boolean(hubLabel && hubLabel === labelLower);
    });
    const hub =
      matchIndex >= 0 ? unused.splice(matchIndex, 1)[0] : (unused.shift() ?? null);

    return {
      label,
      hub: hub ?? null,
      isTightest: hub ? isTightestHub(hub, tightest) : false,
      isEndpoint: false,
    };
  });
};
