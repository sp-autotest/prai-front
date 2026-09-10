"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge/badge";
import { buildConnectionRouteStops } from "@/lib/travel-risk/build-connection-route";
import type {
  RiskLevel,
  TravelRiskConnectionHub,
  TravelRiskMissedConnection,
} from "@/types/travel-risk";
import styles from "./connection-route.module.css";

export type ConnectionRouteProps = {
  route: string[];
  hubs: TravelRiskMissedConnection[];
  tightestHubs: TravelRiskConnectionHub[];
};

/**
 * Maps a connection risk level to the shared Badge variant.
 * @param {RiskLevel} level - Hub risk level.
 * @returns {"low" | "medium" | "high"} Badge variant.
 */
const getRiskBadgeVariant = (level: RiskLevel): "low" | "medium" | "high" => {
  return level;
};

/**
 * Horizontal itinerary strip: origin → hubs (minutes + risk) → destination.
 * Tightest hubs (itinerary max MCT) get an accent ring. Endpoints have no MCT chip.
 * @param {ConnectionRouteProps} props - Route labels, missed-connection rows, max hubs.
 * @returns {React.ReactElement | null} Strip, or null when there are no hubs.
 */
export const ConnectionRoute = ({ route, hubs, tightestHubs }: ConnectionRouteProps) => {
  const t = useTranslations("travelRiskPage");
  const stops = buildConnectionRouteStops(route, hubs, tightestHubs);

  if (stops.length === 0) {
    return null;
  }

  return (
    <ol className={styles.route} aria-label={t("connectionRouteAria")}>
      {stops.map((stop, index) => {
        const key = `${stop.label}-${stop.hub?.airportIata ?? index}`;
        const stopClass = [
          styles.route__stop,
          stop.isEndpoint ? styles["route__stop--endpoint"] : "",
          stop.isTightest ? styles["route__stop--tightest"] : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <li key={key} className={stopClass}>
            {index > 0 ? (
              <span className={styles.route__connector} aria-hidden="true">
                →
              </span>
            ) : null}
            <div className={styles.route__card}>
              <p className={styles.route__label}>{stop.label}</p>
              {stop.hub?.recommendedConnectionMinutes !== null &&
              stop.hub?.recommendedConnectionMinutes !== undefined ? (
                <p className={styles.route__minutes}>
                  {t("minutes", { value: stop.hub.recommendedConnectionMinutes })}
                </p>
              ) : null}
              {stop.hub ? (
                <Badge variant={getRiskBadgeVariant(stop.hub.riskLevel)}>
                  {t(`levels.${stop.hub.riskLevel}`)}
                </Badge>
              ) : null}
              {stop.isTightest ? (
                <span className={styles.route__tightest}>{t("tightestStopHint")}</span>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
};
