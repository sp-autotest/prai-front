"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge/badge";
import { Button } from "@/components/ui/button/button";
import { Card } from "@/components/ui/card/card";
import { Input } from "@/components/ui/input/input";
import { Container } from "@/components/layout/container/container";
import { fetchTravelRisk } from "@/lib/api";
import { getAuthSession } from "@/lib/auth/session";
import { parseFlightQuery } from "@/lib/travel-risk/parse-flight-query";
import type {
  RiskLevel,
  TravelRiskAssessment,
  TravelRiskUiState,
  TurbulenceLevel,
} from "@/types/travel-risk";
import styles from "./travel-risk-section.module.css";

/**
 * Maps qualitative risk level to badge variant.
 * @param {RiskLevel} level - Connection risk level.
 * @returns {"low" | "medium" | "high"} Badge variant.
 */
const getRiskBadgeVariant = (level: RiskLevel): "low" | "medium" | "high" => {
  return level;
};

/**
 * Home-page Travel Risk block: single-line search, parse, live score via dynamic API.
 * @param {{ embedded?: boolean; tone?: "onDark" | "onLight" }} props - Layout/tone options.
 * @returns {React.ReactElement} Travel Risk section.
 */
export const TravelRiskSection = ({
  embedded = false,
  tone = "onDark",
}: {
  embedded?: boolean;
  tone?: "onDark" | "onLight";
}) => {
  const t = useTranslations("travelRiskPage");
  const [query, setQuery] = useState("");
  const [uiState, setUiState] = useState<TravelRiskUiState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [assessment, setAssessment] = useState<TravelRiskAssessment | null>(null);

  /**
   * Resolves localized label for connection risk level.
   * @param {RiskLevel} level - Risk level.
   * @returns {string} Localized label.
   */
  const getConnectionLabel = (level: RiskLevel): string => {
    return t(`levels.${level}`);
  };

  /**
   * Resolves localized label for turbulence.
   * @param {TurbulenceLevel} level - Turbulence level.
   * @returns {string} Localized label.
   */
  const getTurbulenceLabel = (level: TurbulenceLevel): string => {
    return t(`turbulence.${level}`);
  };

  /**
   * Handles controlled input changes and clears previous errors.
   * @param {React.ChangeEvent<HTMLInputElement>} event - Input change event.
   */
  const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);

    if (uiState === "error" || uiState === "empty") {
      setUiState("idle");
      setErrorMessage("");
    }
  };

  /**
   * Parses input, loads assessment from the dynamic API, and updates UI state.
   * @param {React.FormEvent<HTMLFormElement>} event - Form submit event.
   */
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!getAuthSession()) {
      setAssessment(null);
      setUiState("error");
      setErrorMessage(t("errors.authRequired"));
      return;
    }

    const parsed = parseFlightQuery(query);

    if (!parsed.ok) {
      setAssessment(null);
      setUiState("empty");
      setErrorMessage(t("errors.empty"));
      return;
    }

    setUiState("loading");
    setErrorMessage("");
    setAssessment(null);

    try {
      const result = await fetchTravelRisk(parsed.value);

      if (!result.ok) {
        setUiState("error");
        setErrorMessage(t(`errors.${result.code}`));
        return;
      }

      setAssessment(result.value);
      setUiState("success");
    } catch {
      setUiState("error");
      setErrorMessage(t("errors.generic"));
    }
  };

  const content = (
    <>
      <div className={styles.section__heading}>
        <h2 id="travel-risk-title" className={styles.section__title}>
          {t("title")}
        </h2>
        <p className={styles.section__subtitle}>{t("subtitle")}</p>
      </div>

      <Card elevated padding="lg" className={styles.section__panel}>
        <form
          className={styles.form}
          onSubmit={handleSubmit}
          aria-busy={uiState === "loading"}
        >
          <label htmlFor="travel-risk-query" className={styles.form__label}>
            {t("inputLabel")}
          </label>

          <div className={styles.form__row}>
            <Input
              id="travel-risk-query"
              name="travelRiskQuery"
              value={query}
              onChange={handleQueryChange}
              placeholder={t("searchPlaceholder")}
              ariaLabel={t("inputLabel")}
              describedBy="travel-risk-hint"
              disabled={uiState === "loading"}
              error={
                uiState === "error" || uiState === "empty" ? errorMessage : undefined
              }
              className={styles.form__input}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={uiState === "loading"}
              className={styles.form__submit}
            >
              {uiState === "loading" ? t("checking") : t("checkRisk")}
            </Button>
          </div>

          <p id="travel-risk-hint" className={styles.form__hint}>
            {t("hint")}
          </p>
        </form>

        {uiState === "loading" && (
          <p className={styles.status} role="status" aria-live="polite">
            {t("loading")}
          </p>
        )}

        {uiState === "success" && assessment && (
          <div
            className={styles.result}
            role="region"
            aria-labelledby="travel-risk-results-title"
            aria-live="polite"
          >
            <div className={styles.result__summary}>
              <div className={styles.result__scoreBlock}>
                <p id="travel-risk-results-title" className={styles.result__scoreLabel}>
                  {t("scoreLabel")}
                </p>
                {assessment.scoringAvailable && assessment.score !== null ? (
                  <p
                    className={styles.result__scoreValue}
                    aria-label={t("scoreValueAria", { value: assessment.score })}
                  >
                    {assessment.score}
                  </p>
                ) : (
                  <p className={styles.result__unavailable} role="status">
                    {assessment.scoringUnavailableReason === "AIRLINE_NOT_IN_REFERENCE"
                      ? t("errors.scoringUnavailableAirline")
                      : t("errors.scoringUnavailable")}
                  </p>
                )}
              </div>

              <div className={styles.result__meta}>
                {assessment.query.flightNumber ? (
                  <p className={styles.result__flight}>{assessment.query.flightNumber}</p>
                ) : null}
                {assessment.airline ? (
                  <p className={styles.result__airline}>
                    {assessment.airline.known
                      ? t("airlineKnown", {
                          name: assessment.airline.name || assessment.airline.iataCode || "—",
                          code: assessment.airline.iataCode || "",
                        })
                      : t("airlineUnknown", {
                          code: assessment.airline.iataCode || "—",
                        })}
                  </p>
                ) : null}
                {assessment.query.route.length >= 2 ? (
                  <p className={styles.result__route}>{assessment.query.route.join(" → ")}</p>
                ) : null}
                {assessment.query.dateLabel ? (
                  <p className={styles.result__date}>{assessment.query.dateLabel}</p>
                ) : null}
              </div>
            </div>

            {assessment.scoringAvailable &&
            assessment.delayOver15MinPercent !== null &&
            assessment.connectionRisk &&
            assessment.turbulence &&
            assessment.recommendedConnectionMinutes !== null ? (
              <ul className={styles.result__grid} aria-label={t("metricsAriaLabel")}>
                <li>
                  <Card padding="md" className={styles.metric}>
                    <p className={styles.metric__label}>{t("metrics.delay15")}</p>
                    <p className={styles.metric__value}>
                      {t("percent", { value: assessment.delayOver15MinPercent })}
                    </p>
                  </Card>
                </li>
                <li>
                  <Card padding="md" className={styles.metric}>
                    <p className={styles.metric__label}>{t("metrics.delay60")}</p>
                    <p className={styles.metric__value}>
                      {t("percent", { value: assessment.delayOver1HourPercent ?? 0 })}
                    </p>
                  </Card>
                </li>
                <li>
                  <Card padding="md" className={styles.metric}>
                    <p className={styles.metric__label}>{t("metrics.cancellation")}</p>
                    <p className={styles.metric__value}>
                      {t("percent", { value: assessment.cancellationPercent ?? 0 })}
                    </p>
                  </Card>
                </li>
                <li>
                  <Card padding="md" className={styles.metric}>
                    <p className={styles.metric__label}>{t("metrics.connection")}</p>
                    <div className={styles.metric__badgeRow}>
                      <Badge variant={getRiskBadgeVariant(assessment.connectionRisk)}>
                        {getConnectionLabel(assessment.connectionRisk)}
                      </Badge>
                    </div>
                  </Card>
                </li>
                <li>
                  <Card padding="md" className={styles.metric}>
                    <p className={styles.metric__label}>{t("metrics.turbulence")}</p>
                    <p className={styles.metric__value}>
                      {getTurbulenceLabel(assessment.turbulence)}
                    </p>
                  </Card>
                </li>
                <li>
                  <Card padding="md" className={styles.metric}>
                    <p className={styles.metric__label}>{t("metrics.connectionTime")}</p>
                    <p className={styles.metric__value}>
                      {t("minutes", { value: assessment.recommendedConnectionMinutes })}
                    </p>
                  </Card>
                </li>
              </ul>
            ) : null}

            {assessment.warnings.length > 0 ? (
              <div className={styles.result__warnings}>
                <p className={styles.result__warningsTitle}>{t("warningsTitle")}</p>
                <ul className={styles.result__warningsList} aria-label={t("warningsTitle")}>
                  {assessment.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </Card>
    </>
  );

  if (embedded) {
    return (
      <section
        id="travel-risk"
        className={[
          styles.section,
          styles["section--embedded"],
          tone === "onLight" ? styles["section--onLight"] : "",
        ].join(" ")}
        aria-labelledby="travel-risk-title"
      >
        {content}
      </section>
    );
  }

  return (
    <section id="travel-risk" className={styles.section} aria-labelledby="travel-risk-title">
      <Container>{content}</Container>
    </section>
  );
};
