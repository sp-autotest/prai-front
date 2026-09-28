"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button/button";
import { Card } from "@/components/ui/card/card";
import { Input } from "@/components/ui/input/input";
import { fetchAirportProcessExtract } from "@/lib/api";
import { getAuthSession } from "@/lib/auth/session";
import type {
  AirportProcessCompileLine,
  AirportProcessCompiled,
  AirportProcessExtractHub,
} from "@/types/airport-process";
import styles from "./airport-process-section.module.css";

type UiState = "idle" | "loading" | "success" | "empty" | "error";

/**
 * Formats a minute value from the backend ``compiled`` payload for display.
 * @param {number} value - Minutes from a compiled total or line item.
 * @param {(vars: { value: string }) => string} format - Localized minutes formatter.
 * @returns {string} Formatted label.
 */
const formatMinutes = (
  value: number,
  format: (vars: { value: string }) => string,
): string => {
  const rounded = Number.isInteger(value) ? String(value) : value.toFixed(1);
  return format({ value: rounded });
};

/**
 * Returns whether ``compiled`` has at least one usable total column.
 * @param {AirportProcessCompiled | null} compiled - Backend compiled block.
 * @returns {boolean} True when either total is a number.
 */
const hasCompiledTotals = (compiled: AirportProcessCompiled | null): boolean => {
  if (!compiled) {
    return false;
  }

  return (
    compiled.minutes_separate_no_border !== null ||
    compiled.minutes_separate_with_border !== null
  );
};

/**
 * Account section for self-transfer airport transit duration (IATA lookup, no catalog dropdown).
 * Renders backend ``compiled`` totals only — never sums ``extract`` card fields.
 * @returns {React.ReactElement} Airport process section.
 */
export const AirportProcessSection = () => {
  const t = useTranslations("airportProcessPage");
  const [iata, setIata] = useState("");
  const [uiState, setUiState] = useState<UiState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [hub, setHub] = useState<AirportProcessExtractHub | null>(null);

  /**
   * Handles IATA input changes and clears prior errors.
   * @param {React.ChangeEvent<HTMLInputElement>} event - Input change event.
   */
  const handleIataChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIata(event.target.value.toUpperCase());

    if (uiState === "error" || uiState === "empty") {
      setUiState("idle");
      setErrorMessage("");
    }
  };

  /**
   * Loads landside self-transfer times for the entered IATA via the BFF.
   * @param {React.FormEvent<HTMLFormElement>} event - Form submit event.
   */
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!getAuthSession()) {
      setHub(null);
      setUiState("error");
      setErrorMessage(t("errors.authRequired"));
      return;
    }

    setUiState("loading");
    setErrorMessage("");
    setHub(null);

    try {
      const result = await fetchAirportProcessExtract(iata);

      if (!result.ok) {
        setUiState("error");
        setErrorMessage(t(`errors.${result.code}`));
        return;
      }

      const first = result.value.items[0] ?? null;

      if (!first) {
        setUiState("empty");
        setErrorMessage(t("errors.notFound"));
        return;
      }

      setHub(first);

      if (!first.compiled) {
        setUiState("empty");
        setErrorMessage(t("emptyExtract"));
        return;
      }

      if (!hasCompiledTotals(first.compiled)) {
        setUiState("empty");
        setErrorMessage(resolveSkipReason(first.compiled.skip_reason));
        return;
      }

      setUiState("success");
    } catch {
      setUiState("error");
      setErrorMessage(t("errors.generic"));
    }
  };

  /**
   * Maps backend ``skip_reason`` to a localized empty-state message.
   * @param {string | null} reason - Skip reason from ``compiled``.
   * @returns {string} Localized explanation.
   */
  const resolveSkipReason = (reason: string | null): string => {
    if (reason === "no_cutoff") {
      return t("skipReasons.noCutoff");
    }

    if (reason === "no_last_bag") {
      return t("skipReasons.noLastBag");
    }

    return t("emptyCompiled");
  };

  /**
   * Resolves a localized label for a compiled line ``key``.
   * @param {string} key - Stable metric id from the backend.
   * @returns {string} Localized label or the raw key.
   */
  const resolveLineLabel = (key: string): string => {
    const known: Record<string, string> = {
      checkin_queue: t("lineKeys.checkinQueue"),
      immig_heuristic: t("lineKeys.immigHeuristic"),
      "deadline=checkin_close": t("lineKeys.deadlineCheckinClose"),
      "deadline=gate_close": t("lineKeys.deadlineGateClose"),
      "last_bag.national": t("lineKeys.lastBagNational"),
      "last_bag.schengen": t("lineKeys.lastBagSchengen"),
      "last_bag.extra_nb": t("lineKeys.lastBagExtraNb"),
      "last_bag.extra_wb": t("lineKeys.lastBagExtraWb"),
      "last_bag.common": t("lineKeys.lastBagCommon"),
      "security.other": t("lineKeys.securityOther"),
      "security.sensitive": t("lineKeys.securitySensitive"),
      "security.common": t("lineKeys.securityCommon"),
    };

    return known[key] ?? key;
  };

  /**
   * Renders backend-provided addends for one compiled column (display only).
   * @param {AirportProcessCompileLine[]} items - Lines from ``compiled``.
   * @param {(vars: { value: string }) => string} formatMinutesLabel - Minutes formatter.
   * @returns {React.ReactElement | null} Breakdown list or null when empty.
   */
  const renderLineItems = (
    items: AirportProcessCompileLine[],
    formatMinutesLabel: (vars: { value: string }) => string,
  ) => {
    if (items.length === 0) {
      return null;
    }

    return (
      <ul className={styles.breakdown}>
        {items.map((item) => (
          <li key={item.key} className={styles.breakdown__item}>
            <span className={styles.breakdown__label}>{resolveLineLabel(item.key)}</span>
            <span className={styles.breakdown__value}>
              {formatMinutes(item.minutes, formatMinutesLabel)}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  const formatMinutesLabel = (vars: { value: string }) => t("minutes", vars);
  const compiled = hub?.compiled ?? null;
  const asOf = hub?.extract?.as_of ?? null;

  return (
    <section
      className={styles.section}
      aria-labelledby="airport-process-title"
    >
      <div className={styles.section__heading}>
        <h2 id="airport-process-title" className={styles.section__title}>
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
          <label htmlFor="airport-process-iata" className={styles.form__label}>
            {t("inputLabel")}
          </label>

          <div className={styles.form__row}>
            <Input
              id="airport-process-iata"
              name="airportProcessIata"
              value={iata}
              onChange={handleIataChange}
              placeholder={t("inputPlaceholder")}
              ariaLabel={t("inputLabel")}
              describedBy="airport-process-hint"
              maxLength={3}
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
              {uiState === "loading" ? t("checking") : t("submit")}
            </Button>
          </div>

          <p id="airport-process-hint" className={styles.form__hint}>
            {t("hint")}
          </p>
        </form>

        {uiState === "loading" && (
          <p className={styles.status} role="status" aria-live="polite">
            {t("loading")}
          </p>
        )}

        {uiState === "success" && hub && compiled && (
          <div
            className={styles.result}
            role="region"
            aria-labelledby="airport-process-results-title"
            aria-live="polite"
          >
            <p id="airport-process-results-title" className={styles.result__title}>
              {t("resultTitle", { iata: hub.iata })}
            </p>

            {asOf ? (
              <p className={styles.result__meta}>{t("asOf", { date: asOf })}</p>
            ) : null}

            <ul className={styles.metrics} aria-label={t("metricsAria")}>
              {compiled.minutes_separate_no_border !== null ? (
                <li className={styles.metrics__block}>
                  <div className={styles.metrics__item}>
                    <span className={styles.metrics__label}>
                      {t("compiled.noBorder")}
                    </span>
                    <span className={styles.metrics__value}>
                      {formatMinutes(compiled.minutes_separate_no_border, formatMinutesLabel)}
                    </span>
                  </div>
                  {renderLineItems(compiled.no_border_items, formatMinutesLabel)}
                </li>
              ) : null}

              {compiled.minutes_separate_with_border !== null ? (
                <li className={styles.metrics__block}>
                  <div className={styles.metrics__item}>
                    <span className={styles.metrics__label}>
                      {t("compiled.withBorder")}
                    </span>
                    <span className={styles.metrics__value}>
                      {formatMinutes(compiled.minutes_separate_with_border, formatMinutesLabel)}
                    </span>
                  </div>
                  {renderLineItems(compiled.with_border_items, formatMinutesLabel)}
                </li>
              ) : null}
            </ul>
          </div>
        )}
      </Card>
    </section>
  );
};
