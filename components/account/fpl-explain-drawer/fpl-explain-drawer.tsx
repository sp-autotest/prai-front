"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button/button";
import type { FplExplainResponse } from "@/types/fpl-validator";
import styles from "./fpl-explain-drawer.module.css";

export type FplExplainDrawerProps = {
  /**
   * Explain payload, or `null` when closed / idle.
   */
  explanation: FplExplainResponse | null;
  /**
   * True while explain request is in flight.
   */
  isLoading?: boolean;
  /**
   * Error message to show inside the drawer.
   */
  error?: string;
  /**
   * Close handler.
   */
  onClose: () => void;
};

/**
 * Side panel for ICAO rule explain (title, explanation, icao_reference).
 * @param {FplExplainDrawerProps} props - Explain state and close callback.
 * @returns {React.ReactElement | null} Drawer UI, or null when inactive.
 */
export const FplExplainDrawer = ({
  explanation,
  isLoading = false,
  error = "",
  onClose,
}: FplExplainDrawerProps) => {
  const t = useTranslations("fplValidatorPage");

  if (!explanation && !isLoading && !error) {
    return null;
  }

  /**
   * Closes the drawer via the close control.
   */
  const handleClose = () => {
    onClose();
  };

  /**
   * Closes on Escape from the dialog region.
   * @param {React.KeyboardEvent<HTMLElement>} event - Keyboard event.
   */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <aside
      className={styles.drawer}
      role="dialog"
      aria-modal="false"
      aria-labelledby="fpl-explain-title"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.drawer__header}>
        <h3 id="fpl-explain-title" className={styles.drawer__title}>
          {explanation?.title || t("explain.title")}
        </h3>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleClose}
          ariaLabel={t("explain.closeAria")}
        >
          {t("explain.close")}
        </Button>
      </div>

      {isLoading ? (
        <p className={styles.drawer__status} role="status">
          {t("explain.loading")}
        </p>
      ) : null}

      {error ? (
        <p className={styles.drawer__error} role="alert">
          {error}
        </p>
      ) : null}

      {explanation ? (
        <div className={styles.drawer__body}>
          <p className={styles.drawer__rule}>{explanation.rule_id}</p>
          <p className={styles.drawer__text}>{explanation.explanation}</p>
          {explanation.icao_reference ? (
            <p className={styles.drawer__icao}>
              <span className={styles.drawer__icaoLabel}>{t("explain.icaoLabel")}: </span>
              {explanation.icao_reference}
            </p>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
};
