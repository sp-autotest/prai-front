"use client";

import { useTranslations } from "next-intl";
import { FplHighlightView } from "@/components/account/fpl-highlight-view/fpl-highlight-view";
import { Badge } from "@/components/ui/badge/badge";
import { Button } from "@/components/ui/button/button";
import { resolveIssueRange } from "@/lib/fpl-validator/build-highlight-segments";
import type { FplTextRange } from "@/lib/fpl-validator/build-highlight-segments";
import {
  buildScoreBreakdown,
  shouldShowTrainingBreakdown,
} from "@/lib/fpl-validator/training";
import type {
  FplIssue,
  FplValidateResponse,
  FplValidationMode,
} from "@/types/fpl-validator";
import styles from "./fpl-results-panel.module.css";

export type FplResultsPanelProps = {
  /**
   * Latest validation payload, or `null` before the first check.
   */
  result: FplValidateResponse | null;
  /**
   * Mode used for the current result (drives learning UI).
   */
  mode?: FplValidationMode;
  /**
   * Called when the user activates an issue (focus + explain).
   */
  onIssueActivate?: (issue: FplIssue) => void;
  /**
   * Active highlight range synchronized with issue clicks.
   */
  activeRange?: FplTextRange | null;
  /**
   * Opens history detail for `result.request_id`.
   */
  onOpenHistory?: () => void;
  /**
   * True while history detail is loading.
   */
  historyLoading?: boolean;
};

/**
 * Results panel: VALID/INVALID, score, messages by severity, learning breakdown, highlight.
 * @param {FplResultsPanelProps} props - Result payload and callbacks.
 * @returns {React.ReactElement} Results panel UI.
 */
export const FplResultsPanel = ({
  result,
  mode = "strict",
  onIssueActivate,
  activeRange = null,
  onOpenHistory,
  historyLoading = false,
}: FplResultsPanelProps) => {
  const t = useTranslations("fplValidatorPage");
  const showLearning = shouldShowTrainingBreakdown(mode);

  if (!result) {
    return <p className={styles.panel__idle}>{t("results.idle")}</p>;
  }

  const breakdown = showLearning ? buildScoreBreakdown(result) : [];

  /**
   * Resolves a localized fix hint for a typical issue code.
   * @param {string} code - Issue code.
   * @returns {string} Hint text.
   */
  const getFixHint = (code: string): string => {
    if (code === "F13_AIRPORT_EXISTS") {
      return t("training.hints.F13_AIRPORT_EXISTS");
    }
    if (code === "F10_R_REQUIRES_PBN") {
      return t("training.hints.F10_R_REQUIRES_PBN");
    }
    if (code === "F18_PBN_REQUIRED") {
      return t("training.hints.F18_PBN_REQUIRED");
    }
    if (code === "F18_DOF_FORMAT") {
      return t("training.hints.F18_DOF_FORMAT");
    }
    if (code === "ITEM7_ACID_FORMAT") {
      return t("training.hints.ITEM7_ACID_FORMAT");
    }
    if (code === "ITEM10_EQUIPMENT_CHECK") {
      return t("training.hints.ITEM10_EQUIPMENT_CHECK");
    }
    if (code === "ITEM15_ROUTE_SYNTAX") {
      return t("training.hints.ITEM15_ROUTE_SYNTAX");
    }
    if (code === "ITEM18_DOF_CHECK") {
      return t("training.hints.ITEM18_DOF_CHECK");
    }
    return t("training.hintFallback");
  };

  /**
   * Handles keyboard activation for actionable issue buttons.
   * @param {React.KeyboardEvent<HTMLButtonElement>} event - Keyboard event.
   * @param {FplIssue} issue - Target issue.
   */
  const handleIssueKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    issue: FplIssue,
  ) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    onIssueActivate?.(issue);
  };

  /**
   * Renders extras: suggestion, ICAO (if already known), learning hint, explain CTA.
   * @param {FplIssue} issue - Error / warning / info.
   * @returns {React.ReactElement} Extra lines.
   */
  const renderIssueExtras = (issue: FplIssue) => {
    const icaoRef = issue.icao_ref?.trim();
    const suggestion = issue.suggestion?.trim();
    const fixHint = showLearning ? getFixHint(issue.code) : null;

    return (
      <>
        {suggestion ? (
          <p className={styles.issue__fix}>
            <span className={styles.issue__fixLabel}>{t("training.fixHintTitle")}: </span>
            {suggestion}
          </p>
        ) : null}
        {icaoRef ? (
          <p className={styles.issue__icao}>
            <span className={styles.issue__icaoLabel}>{t("training.icaoExplainTitle")}: </span>
            {icaoRef}
          </p>
        ) : null}
        {!suggestion && fixHint ? (
          <p className={styles.issue__fix}>
            <span className={styles.issue__fixLabel}>{t("training.fixHintTitle")}: </span>
            {fixHint}
          </p>
        ) : null}
        <p className={styles.issue__hint}>{t("results.explainHint")}</p>
      </>
    );
  };

  /**
   * Renders a severity-grouped message list.
   * @param {FplIssue[]} items - Issues to render.
   * @param {"error" | "warning" | "info"} tone - Visual tone.
   * @param {string} emptyLabel - Localized empty copy.
   * @param {string} listLabel - Aria label.
   * @returns {React.ReactElement} List or empty paragraph.
   */
  const renderIssueList = (
    items: FplIssue[],
    tone: "error" | "warning" | "info",
    emptyLabel: string,
    listLabel: string,
  ) => {
    if (items.length === 0) {
      return <p className={styles.listBlock__empty}>{emptyLabel}</p>;
    }

    return (
      <ul className={styles.list} aria-label={listLabel}>
        {items.map((issue, index) => {
          const range = resolveIssueRange(result.raw_fpl, issue);
          const key = `${issue.code}-${issue.start ?? issue.field ?? "x"}-${index}`;
          const className = [
            styles.issue,
            styles["issue--actionable"],
            tone === "error"
              ? styles["issue--error"]
              : tone === "warning"
                ? styles["issue--warning"]
                : styles["issue--info"],
          ].join(" ");

          return (
            <li key={key}>
              <button
                type="button"
                className={className}
                onClick={() => onIssueActivate?.(issue)}
                onKeyDown={(event) => handleIssueKeyDown(event, issue)}
                aria-label={t("results.focusIssueAria", { code: issue.code })}
              >
                <span className={styles.issue__code}>{issue.code}</span>
                <p className={styles.issue__message}>{issue.message}</p>
                {renderIssueExtras(issue)}
                {range ? <p className={styles.issue__hint}>{t("results.focusHint")}</p> : null}
              </button>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div
      className={styles.panel}
      role="region"
      aria-labelledby="fpl-results-heading"
      aria-live="polite"
    >
      <div className={styles.panel__header}>
        <Badge variant={result.valid ? "low" : "high"}>
          {result.valid ? t("results.statusValid") : t("results.statusInvalid")}
        </Badge>
        {showLearning ? (
          <Badge variant="accent">{t("training.modeTraining")}</Badge>
        ) : null}
        <p className={styles.panel__score}>
          {t("results.scoreLabel")}{" "}
          <span className={styles.panel__scoreValue}>{result.score}</span>
        </p>
      </div>

      {result.inline_stats ? (
        <ul className={styles.chips} aria-label={t("results.statsChipsAria")}>
          <li>{t("results.chipErrors", { count: result.inline_stats.error_count })}</li>
          <li>{t("results.chipWarnings", { count: result.inline_stats.warning_count })}</li>
          <li>{t("results.chipInfos", { count: result.inline_stats.info_count })}</li>
        </ul>
      ) : null}

      {result.request_id ? (
        <div className={styles.panel__historyRow}>
          <p className={styles.panel__requestId}>
            {t("results.requestId", { id: result.request_id })}
          </p>
          {onOpenHistory ? (
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onOpenHistory}
              disabled={historyLoading}
            >
              {historyLoading ? t("results.historyLoading") : t("results.openHistory")}
            </Button>
          ) : null}
        </div>
      ) : null}

      <p className={styles.panel__versions}>
        {t("results.versions", {
          parser: result.parser_version || "—",
          rules: result.rules_version || "—",
        })}
      </p>

      {showLearning ? (
        <div className={styles.breakdown} aria-label={t("training.breakdownTitle")}>
          <h3 className={styles.breakdown__title}>{t("training.breakdownTitle")}</h3>
          {breakdown.length === 0 ? (
            <p className={styles.breakdown__empty}>{t("training.breakdownEmpty")}</p>
          ) : (
            <ul className={styles.breakdown__list}>
              {breakdown.map((item, index) => (
                <li
                  key={`${item.code}-${item.kind}-${index}`}
                  className={[
                    styles.breakdown__item,
                    item.kind === "error"
                      ? styles["breakdown__item--error"]
                      : styles["breakdown__item--warning"],
                  ].join(" ")}
                >
                  <span className={styles.breakdown__code}>{item.code}</span>
                  {item.delta !== null ? (
                    <span className={styles.breakdown__delta}>
                      {t("training.breakdownDelta", { delta: item.delta })}
                    </span>
                  ) : null}
                  <p className={styles.breakdown__message}>{item.message}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      <div className={styles.listBlock}>
        <h3 className={styles.listBlock__title}>{t("results.errorsTitle")}</h3>
        {renderIssueList(
          result.errors,
          "error",
          t("results.errorsEmpty"),
          t("results.errorsTitle"),
        )}
      </div>

      <div className={styles.listBlock}>
        <h3 className={styles.listBlock__title}>{t("results.warningsTitle")}</h3>
        {renderIssueList(
          result.warnings,
          "warning",
          t("results.warningsEmpty"),
          t("results.warningsTitle"),
        )}
      </div>

      <div className={styles.listBlock}>
        <h3 className={styles.listBlock__title}>{t("results.infosTitle")}</h3>
        {renderIssueList(
          result.infos,
          "info",
          t("results.infosEmpty"),
          t("results.infosTitle"),
        )}
      </div>

      <FplHighlightView result={result} activeRange={activeRange} />
    </div>
  );
};
