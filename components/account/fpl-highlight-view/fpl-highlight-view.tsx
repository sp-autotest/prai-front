"use client";

import { useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  buildFplHighlightSegments,
  countUnmappedIssues,
  hasHighlightMarks,
} from "@/lib/fpl-validator/build-highlight-segments";
import type { FplTextRange } from "@/lib/fpl-validator/build-highlight-segments";
import type { FplValidateResponse } from "@/types/fpl-validator";
import styles from "./fpl-highlight-view.module.css";

export type FplHighlightViewProps = {
  /**
   * Validation payload that owns the source FPL and issue lists.
   */
  result: FplValidateResponse;
  /**
   * Optional active range from an issue click (highlights that span).
   */
  activeRange?: FplTextRange | null;
};

/**
 * Renders the submitted FPL with error/warning highlight spans (Phase F4).
 * Highlight is supplementary — the issues list remains the primary a11y source.
 * @param {FplHighlightViewProps} props - Result payload and optional active range.
 * @returns {React.ReactElement} Highlighted FPL view.
 */
export const FplHighlightView = ({ result, activeRange = null }: FplHighlightViewProps) => {
  const t = useTranslations("fplValidatorPage");
  const preRef = useRef<HTMLPreElement | null>(null);
  const activeRef = useRef<HTMLSpanElement | null>(null);

  const source = result.raw_fpl;

  const segments = useMemo(
    () => buildFplHighlightSegments(source, result.errors, result.warnings),
    [source, result.errors, result.warnings],
  );

  const hasMarks = useMemo(() => hasHighlightMarks(segments), [segments]);

  const unmappedCount = useMemo(
    () => countUnmappedIssues(source, [...result.errors, ...result.warnings]),
    [source, result.errors, result.warnings],
  );

  useEffect(() => {
    if (!activeRange || !activeRef.current) {
      return;
    }

    activeRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeRange]);

  return (
    <div className={styles.view}>
      <div className={styles.view__header}>
        <h3 className={styles.view__title} id="fpl-highlight-title">
          {t("highlight.title")}
        </h3>
        {hasMarks ? (
          <ul className={styles.view__legend} aria-label={t("highlight.legendAria")}>
            <li className={styles.view__legendItem}>
              <span className={[styles.view__swatch, styles["view__swatch--error"]].join(" ")} aria-hidden="true" />
              {t("highlight.legendError")}
            </li>
            <li className={styles.view__legendItem}>
              <span
                className={[styles.view__swatch, styles["view__swatch--warning"]].join(" ")}
                aria-hidden="true"
              />
              {t("highlight.legendWarning")}
            </li>
          </ul>
        ) : null}
        <p className={styles.view__note}>{t("highlight.a11yNote")}</p>
        {unmappedCount > 0 ? (
          <p className={styles.view__note}>
            {t("highlight.unmappedNote", { count: unmappedCount })}
          </p>
        ) : null}
      </div>

      <pre
        ref={preRef}
        className={styles.view__pre}
        tabIndex={0}
        role="region"
        aria-labelledby="fpl-highlight-title"
        aria-describedby="fpl-highlight-desc"
      >
        {segments.map((segment) => {
          const isActive =
            Boolean(activeRange) &&
            activeRange !== null &&
            segment.start < activeRange.end &&
            segment.end > activeRange.start;

          if (segment.tone === "plain") {
            return <span key={`${segment.start}-${segment.end}`}>{segment.text}</span>;
          }

          const className = [
            segment.tone === "error" ? styles["seg--error"] : styles["seg--warning"],
            isActive ? styles["seg--active"] : "",
          ].join(" ");

          return (
            <mark
              key={`${segment.start}-${segment.end}-${segment.tone}`}
              ref={isActive ? activeRef : undefined}
              className={className}
              title={segment.codes.join(", ")}
            >
              {segment.text}
            </mark>
          );
        })}
      </pre>
      <p id="fpl-highlight-desc" className={styles.view__note}>
        {t("highlight.sourceLabel")}
      </p>
    </div>
  );
};
