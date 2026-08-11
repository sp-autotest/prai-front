"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge/badge";
import { Button } from "@/components/ui/button/button";
import {
  computeLocalFplStats,
  type FplLocalHistoryEntry,
} from "@/lib/fpl-validator/local-stats";
import type { FplStatsResponse, FplValidationMode } from "@/types/fpl-validator";
import type { Locale } from "@/types";
import styles from "./fpl-stats-panel.module.css";

const HISTORY_PAGE_SIZE = 5;

export type FplStatsFilter = "all" | FplValidationMode;

export type FplStatsPanelProps = {
  /**
   * Local recent-check history (newest first) — list API is not available.
   */
  history: FplLocalHistoryEntry[];
  /**
   * Mapped server stats from `GET /api/v1/fpl/stats/` when available.
   */
  remoteStats?: FplStatsResponse | null;
  /**
   * Auth/network error for remote stats (shown explicitly, not silent).
   */
  remoteError?: string;
};

/**
 * Formats an ISO timestamp for the active UI locale.
 * @param {string} iso - ISO-8601 timestamp.
 * @param {Locale} locale - Active site locale.
 * @returns {string} Localized date/time string.
 */
const formatCheckTime = (iso: string, locale: Locale): string => {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

/**
 * User statistics panel: remote learning stats + local recent history (F2/F5/F6).
 * @param {FplStatsPanelProps} props - History rows and optional remote stats.
 * @returns {React.ReactElement} Statistics panel UI.
 */
export const FplStatsPanel = ({
  history,
  remoteStats = null,
  remoteError = "",
}: FplStatsPanelProps) => {
  const t = useTranslations("fplValidatorPage");
  const locale = useLocale() as Locale;
  const [visibleCount, setVisibleCount] = useState(HISTORY_PAGE_SIZE);
  const [modeFilter, setModeFilter] = useState<FplStatsFilter>("all");

  const scopedHistory = useMemo(() => {
    if (modeFilter === "all") {
      return history;
    }

    return history.filter((item) => (item.mode ?? "strict") === modeFilter);
  }, [history, modeFilter]);

  const localStats = useMemo(() => computeLocalFplStats(scopedHistory), [scopedHistory]);
  const learningStats = useMemo(() => computeLocalFplStats(history, "learning"), [history]);

  const summary = remoteStats ?? localStats;
  const frequent = remoteStats?.frequent_errors?.length
    ? remoteStats.frequent_errors
    : localStats.frequent_errors;

  const visibleHistory = scopedHistory.slice(0, visibleCount);
  const hasMore = visibleCount < scopedHistory.length;

  /**
   * Reveals the next page of history rows.
   */
  const handleShowMore = () => {
    setVisibleCount((current) => current + HISTORY_PAGE_SIZE);
  };

  /**
   * Changes the history/summary mode filter and resets pagination.
   * @param {React.ChangeEvent<HTMLSelectElement>} event - Select change event.
   */
  const handleModeFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    const next: FplStatsFilter =
      value === "learning" || value === "strict" ? value : "all";
    setModeFilter(next);
    setVisibleCount(HISTORY_PAGE_SIZE);
  };

  if (history.length === 0 && !remoteStats) {
    return (
      <div className={styles.panel}>
        {remoteError ? <p className={styles.panel__demoNote}>{remoteError}</p> : null}
        <p className={styles.panel__empty}>{t("stats.empty")}</p>
      </div>
    );
  }

  return (
    <div className={styles.panel} role="region" aria-labelledby="fpl-stats-heading">
      {remoteStats ? (
        <p className={styles.panel__demoNote}>{t("stats.remoteNote")}</p>
      ) : (
        <p className={styles.panel__demoNote}>{remoteError || t("stats.localNote")}</p>
      )}

      <div className={styles.filter}>
        <label htmlFor="fpl-stats-mode-filter" className={styles.filter__label}>
          {t("stats.modeFilterLabel")}
        </label>
        <select
          id="fpl-stats-mode-filter"
          className={styles.filter__select}
          value={modeFilter}
          onChange={handleModeFilterChange}
          aria-label={t("stats.modeFilterLabel")}
        >
          <option value="all">{t("stats.modeAll")}</option>
          <option value="strict">{t("stats.modeProduction")}</option>
          <option value="learning">{t("stats.modeTraining")}</option>
        </select>
      </div>

      <ul className={styles.summary} aria-label={t("stats.summaryAria")}>
        <li className={styles.summary__item}>
          <p className={styles.summary__label}>{t("stats.totalChecks")}</p>
          <p className={styles.summary__value}>{summary.total_checks}</p>
        </li>
        <li className={styles.summary__item}>
          <p className={styles.summary__label}>{t("stats.averageScore")}</p>
          <p className={styles.summary__value}>
            {summary.average_score === null ? "—" : summary.average_score}
          </p>
        </li>
        <li className={styles.summary__item}>
          <p className={styles.summary__label}>{t("stats.trainingAverage")}</p>
          <p className={styles.summary__value}>
            {learningStats.average_score === null ? "—" : learningStats.average_score}
          </p>
        </li>
        {typeof summary.error_total === "number" ? (
          <li className={styles.summary__item}>
            <p className={styles.summary__label}>{t("stats.errorTotal")}</p>
            <p className={styles.summary__value}>{summary.error_total}</p>
          </li>
        ) : (
          <li className={styles.summary__item}>
            <p className={styles.summary__label}>{t("stats.validInvalid")}</p>
            <p className={styles.summary__value}>
              {t("stats.validInvalidValue", {
                valid: summary.valid_count,
                invalid: summary.invalid_count,
              })}
            </p>
          </li>
        )}
      </ul>

      <div className={styles.block}>
        <h3 className={styles.block__title}>{t("stats.historyTitle")}</h3>
        {scopedHistory.length === 0 ? (
          <p className={styles.block__empty}>{t("stats.filterEmpty")}</p>
        ) : (
          <>
            <ul className={styles.history} aria-label={t("stats.historyTitle")}>
              {visibleHistory.map((item) => (
                <li key={`${item.id}-${item.created_at}`} className={styles.history__item}>
                  <div className={styles.history__meta}>
                    <Badge variant={item.valid ? "low" : "high"}>
                      {item.valid ? t("results.statusValid") : t("results.statusInvalid")}
                    </Badge>
                    <Badge variant="accent">
                      {item.mode === "learning"
                        ? t("stats.modeBadgeTraining")
                        : t("stats.modeBadgeProduction")}
                    </Badge>
                    <p className={styles.history__score}>
                      {t("results.scoreLabel")} {item.score}
                    </p>
                    <p className={styles.history__time}>
                      <time dateTime={item.created_at}>
                        {formatCheckTime(item.created_at, locale)}
                      </time>
                    </p>
                  </div>
                  <p className={styles.history__preview}>{item.raw_fpl_preview}</p>
                  <p className={styles.history__preview}>{item.id}</p>
                </li>
              ))}
            </ul>

            {hasMore ? (
              <Button type="button" variant="secondary" size="md" onClick={handleShowMore}>
                {t("stats.showMore", { remaining: scopedHistory.length - visibleCount })}
              </Button>
            ) : null}
          </>
        )}
      </div>

      <div className={styles.block}>
        <h3 className={styles.block__title}>{t("stats.frequentTitle")}</h3>
        {frequent.length === 0 ? (
          <p className={styles.block__empty}>{t("stats.frequentEmpty")}</p>
        ) : (
          <ul className={styles.frequent} aria-label={t("stats.frequentTitle")}>
            {frequent.map((error) => (
              <li key={error.code} className={styles.frequent__item}>
                <p className={styles.frequent__code}>{error.code}</p>
                <p className={styles.frequent__count}>
                  {t("stats.frequentCount", { count: error.count })}
                </p>
                <p className={styles.frequent__message}>{error.message}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
