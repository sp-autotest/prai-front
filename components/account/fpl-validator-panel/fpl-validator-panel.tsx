"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { FplCheckForm } from "@/components/account/fpl-check-form/fpl-check-form";
import { FplExplainDrawer } from "@/components/account/fpl-explain-drawer/fpl-explain-drawer";
import { FplResultsPanel } from "@/components/account/fpl-results-panel/fpl-results-panel";
import { FplStatsPanel } from "@/components/account/fpl-stats-panel/fpl-stats-panel";
import { Card } from "@/components/ui/card/card";
import {
  fetchFplExplain,
  fetchFplHistory,
  fetchFplStats,
  mapUiLocaleToFplApi,
} from "@/lib/api/fpl-validator";
import {
  resolveIssueRange,
  type FplTextRange,
} from "@/lib/fpl-validator/build-highlight-segments";
import {
  appendLocalFplCheck,
  createEmptyLocalStats,
  loadLocalFplStats,
  saveLocalFplStats,
  type FplLocalHistoryEntry,
} from "@/lib/fpl-validator/local-stats";
import { getAuthSession } from "@/lib/auth/session";
import type {
  FplExplainResponse,
  FplIssue,
  FplStatsResponse,
  FplValidateResponse,
  FplValidationMode,
} from "@/types/fpl-validator";
import type { Locale } from "@/types";
import styles from "./fpl-validator-panel.module.css";

/**
 * Focuses and selects a character range inside a textarea.
 * @param {HTMLTextAreaElement} textarea - Target textarea element.
 * @param {number} start - Inclusive start index.
 * @param {number} end - Exclusive end index.
 * @returns {void}
 */
const focusFplRange = (textarea: HTMLTextAreaElement, start: number, end: number) => {
  const safeStart = Math.max(0, Math.min(start, textarea.value.length));
  const safeEnd = Math.max(safeStart, Math.min(end, textarea.value.length));

  textarea.focus();
  textarea.setSelectionRange(safeStart, safeEnd);

  const lineHeight = Number.parseFloat(window.getComputedStyle(textarea).lineHeight) || 22;
  const before = textarea.value.slice(0, safeStart);
  const lineIndex = before.split("\n").length - 1;
  textarea.scrollTop = Math.max(0, lineIndex * lineHeight - textarea.clientHeight / 3);
};

/**
 * Account FPL Validator page: validate via API, explain drawer, history, stats (F2+).
 * @returns {React.ReactElement} FPL Validator panel.
 */
export const FplValidatorPanel = () => {
  const t = useTranslations("fplValidatorPage");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [fplText, setFplText] = useState("");
  const [mode, setMode] = useState<FplValidationMode>("strict");
  const [result, setResult] = useState<FplValidateResponse | null>(null);
  const [resultMode, setResultMode] = useState<FplValidationMode>("strict");
  const [activeRange, setActiveRange] = useState<FplTextRange | null>(null);
  const [history, setHistory] = useState<FplLocalHistoryEntry[]>([]);
  const [statsHydrated, setStatsHydrated] = useState(false);
  const [remoteStats, setRemoteStats] = useState<FplStatsResponse | null>(null);
  const [statsError, setStatsError] = useState("");
  const [explain, setExplain] = useState<FplExplainResponse | null>(null);
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainError, setExplainError] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  /**
   * Loads server stats when a session exists; surfaces 401 instead of silent fail.
   */
  const refreshRemoteStats = async () => {
    if (!getAuthSession()) {
      setRemoteStats(null);
      setStatsError(t("errors.authRequired"));
      return;
    }

    const statsResult = await fetchFplStats();

    if (!statsResult.ok) {
      setRemoteStats(null);
      if (statsResult.code === "authRequired") {
        setStatsError(t("errors.authRequired"));
        return;
      }
      setStatsError(statsResult.message || t("errors.server"));
      console.debug("[fpl-validator] stats failed", {
        code: statsResult.code,
        apiCode: statsResult.apiCode,
        traceId: statsResult.traceId,
      });
      return;
    }

    setStatsError("");
    setRemoteStats(statsResult.value);
  };

  useEffect(() => {
    const loaded = loadLocalFplStats();
    setHistory(loaded.history);
    setStatsHydrated(true);
    void refreshRemoteStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only hydrate
  }, []);

  /**
   * Stores validation payload, updates local history, refreshes remote stats.
   * @param {FplValidateResponse} next - Validation response.
   * @param {FplValidationMode} checkMode - Mode used for this check.
   */
  const handleResult = (next: FplValidateResponse, checkMode: FplValidationMode) => {
    setResult(next);
    setResultMode(checkMode);
    setActiveRange(null);
    setExplain(null);
    setExplainError("");

    setHistory((current) => {
      const updated = appendLocalFplCheck({ history: current }, next, checkMode);
      saveLocalFplStats(updated);
      console.debug("[fpl-validator] local history updated", {
        mode: checkMode,
        total: updated.history.length,
        requestId: next.request_id,
        score: next.score,
      });
      return updated.history;
    });

    void refreshRemoteStats();
  };

  /**
   * Clears the results panel (history/stats are kept).
   */
  const handleClearResult = () => {
    setResult(null);
    setActiveRange(null);
    setExplain(null);
    setExplainError("");
  };

  /**
   * Focuses the FPL fragment and opens explain for the activated issue.
   * @param {FplIssue} issue - Activated error or warning.
   */
  const handleIssueActivate = async (issue: FplIssue) => {
    if (result) {
      const range = resolveIssueRange(result.raw_fpl, issue);
      if (range) {
        setActiveRange(range);
        const textarea = textareaRef.current;
        if (textarea) {
          focusFplRange(textarea, range.start, range.end);
        }
      }
    }

    setExplainLoading(true);
    setExplainError("");
    setExplain(null);

    const explainResult = await fetchFplExplain({
      rule_id: issue.code,
      message_id: typeof issue.message_id === "number" ? issue.message_id : undefined,
      locale: mapUiLocaleToFplApi(locale),
      context: {
        field_code: issue.field ?? undefined,
        value_text: issue.value_text ?? undefined,
        field: issue.field ?? undefined,
        value: issue.value_text ?? undefined,
      },
    });

    setExplainLoading(false);

    if (!explainResult.ok) {
      setExplainError(explainResult.message || t("errors.server"));
      console.debug("[fpl-validator] explain failed", {
        code: explainResult.code,
        apiCode: explainResult.apiCode,
        traceId: explainResult.traceId,
      });
      return;
    }

    setExplain(explainResult.value);
  };

  /**
   * Loads history detail for the current `request_id` (auth required).
   */
  const handleOpenHistory = async () => {
    const requestId = result?.request_id;

    if (!requestId) {
      return;
    }

    if (!getAuthSession()) {
      router.replace(`/${locale}/login`);
      return;
    }

    setHistoryLoading(true);
    const historyResult = await fetchFplHistory(requestId);
    setHistoryLoading(false);

    if (!historyResult.ok) {
      if (historyResult.code === "authRequired") {
        router.replace(`/${locale}/login`);
        return;
      }

      setExplainError(historyResult.message || t("errors.forbidden"));
      console.debug("[fpl-validator] history failed", {
        code: historyResult.code,
        apiCode: historyResult.apiCode,
        traceId: historyResult.traceId,
      });
      return;
    }

    setResult(historyResult.value);
    setActiveRange(null);
  };

  /**
   * Closes the explain drawer.
   */
  const handleCloseExplain = () => {
    setExplain(null);
    setExplainError("");
    setExplainLoading(false);
  };

  return (
    <div className={styles.wrap}>
      <Card elevated padding="lg" className={styles.intro}>
        <h1 className={styles.intro__title}>{t("title")}</h1>
        <p className={styles.intro__subtitle}>{t("subtitle")}</p>
      </Card>

      <div className={styles.sections}>
        <Card padding="lg" className={styles.section} aria-labelledby="fpl-check-heading">
          <h2 id="fpl-check-heading" className={styles.section__title}>
            {t("sections.checkTitle")}
          </h2>
          <FplCheckForm
            ref={textareaRef}
            value={fplText}
            onChange={setFplText}
            mode={mode}
            onModeChange={setMode}
            onResult={handleResult}
            onClearResult={handleClearResult}
          />
        </Card>

        <Card padding="lg" className={styles.section} aria-labelledby="fpl-results-heading">
          <h2 id="fpl-results-heading" className={styles.section__title}>
            {t("sections.resultsTitle")}
          </h2>
          <FplResultsPanel
            result={result}
            mode={resultMode}
            onIssueActivate={handleIssueActivate}
            activeRange={activeRange}
            onOpenHistory={handleOpenHistory}
            historyLoading={historyLoading}
          />
          <FplExplainDrawer
            explanation={explain}
            isLoading={explainLoading}
            error={explainError}
            onClose={handleCloseExplain}
          />
        </Card>

        <Card padding="lg" className={styles.section} aria-labelledby="fpl-stats-heading">
          <h2 id="fpl-stats-heading" className={styles.section__title}>
            {t("sections.statsTitle")}
          </h2>
          <FplStatsPanel
            history={statsHydrated ? history : createEmptyLocalStats().history}
            remoteStats={remoteStats}
            remoteError={statsError}
          />
        </Card>
      </div>
    </div>
  );
};
