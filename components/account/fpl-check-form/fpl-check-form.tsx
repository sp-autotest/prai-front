"use client";

import { forwardRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button/button";
import { Textarea } from "@/components/ui/textarea/textarea";
import { fetchFplValidate, mapUiLocaleToFplApi } from "@/lib/api/fpl-validator";
import { SAMPLE_ICAO_FPL } from "@/lib/fpl-validator/sample-fpl";
import type {
  FplValidateResponse,
  FplValidationMode,
  FplValidatorUiState,
} from "@/types/fpl-validator";
import type { Locale } from "@/types";
import styles from "./fpl-check-form.module.css";

export type FplCheckFormProps = {
  /**
   * Controlled FPL text value.
   */
  value: string;
  /**
   * Change handler for the controlled textarea.
   */
  onChange: (value: string) => void;
  /**
   * Active validation mode (`strict` vs `learning`).
   */
  mode: FplValidationMode;
  /**
   * Mode change handler.
   */
  onModeChange: (mode: FplValidationMode) => void;
  /**
   * Called after a successful validation run (including `valid: false`).
   */
  onResult: (result: FplValidateResponse, mode: FplValidationMode) => void;
  /**
   * Clears the parent results panel when the form is reset / emptied.
   */
  onClearResult?: () => void;
};

/**
 * “Check telegram” form wired to BFF validate (`strict` / `learning`).
 * @param {FplCheckFormProps} props - Controlled value, mode, and result callbacks.
 * @param {React.ForwardedRef<HTMLTextAreaElement>} ref - Textarea ref for issue focus.
 * @returns {React.ReactElement} FPL check form.
 */
export const FplCheckForm = forwardRef<HTMLTextAreaElement, FplCheckFormProps>(
  ({ value, onChange, mode, onModeChange, onResult, onClearResult }, ref) => {
    const t = useTranslations("fplValidatorPage");
    const locale = useLocale() as Locale;
    const [uiState, setUiState] = useState<FplValidatorUiState>("idle");
    const [fieldError, setFieldError] = useState("");

    const charCount = value.length;
    const isLoading = uiState === "loading";

    /**
     * Updates FPL text and clears empty/error feedback while typing.
     * @param {React.ChangeEvent<HTMLTextAreaElement>} event - Textarea change event.
     */
    const handleFplChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(event.target.value);

      if (uiState === "empty" || uiState === "error" || uiState === "success") {
        setUiState("idle");
        setFieldError("");
      }
    };

    /**
     * Switches validation mode via the radio group.
     * @param {React.ChangeEvent<HTMLInputElement>} event - Radio change event.
     */
    const handleModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextMode = event.target.value === "learning" ? "learning" : "strict";
      onModeChange(nextMode);
    };

    /**
     * Inserts fixture A into the textarea.
     */
    const handleInsertExample = () => {
      onChange(SAMPLE_ICAO_FPL);
      setUiState("idle");
      setFieldError("");
      onClearResult?.();
    };

    /**
     * Submits FPL to BFF → Django validate. `valid:false` is a success path.
     * @param {React.FormEvent<HTMLFormElement>} event - Form submit event.
     */
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!value.trim()) {
        setUiState("empty");
        setFieldError(t("errors.empty"));
        onClearResult?.();
        return;
      }

      setUiState("loading");
      setFieldError("");

      const result = await fetchFplValidate({
        fpl_text: value,
        locale: mapUiLocaleToFplApi(locale),
        mode,
      });

      if (!result.ok) {
        setUiState("error");
        const message =
          result.code === "parseError"
            ? t("errors.parseError")
            : result.message?.trim() || t(`errors.${result.code}` as "errors.server");
        setFieldError(message);
        onClearResult?.();
        console.debug("[fpl-validator] validate failed", {
          code: result.code,
          apiCode: result.apiCode,
          traceId: result.traceId,
        });
        return;
      }

      onResult(result.value, mode);
      setUiState("success");
      console.debug("[fpl-validator] validate ok", {
        mode,
        requestId: result.value.request_id,
        valid: result.value.valid,
        score: result.value.score,
        errors: result.value.errors.length,
        warnings: result.value.warnings.length,
      });
    };

    return (
      <form
        className={styles.form}
        onSubmit={handleSubmit}
        noValidate
        aria-busy={isLoading}
      >
        <fieldset className={styles.form__mode} disabled={isLoading}>
          <legend className={styles.form__modeLegend}>{t("training.modeLabel")}</legend>
          <div className={styles.form__modeOptions} role="radiogroup" aria-label={t("training.modeLabel")}>
            <label
              className={[
                styles.form__modeOption,
                mode === "strict" ? styles["form__modeOption--active"] : "",
              ].join(" ")}
            >
              <input
                type="radio"
                name="fpl-validation-mode"
                value="strict"
                checked={mode === "strict"}
                onChange={handleModeChange}
              />
              {t("training.modeProduction")}
            </label>
            <label
              className={[
                styles.form__modeOption,
                mode === "learning" ? styles["form__modeOption--active"] : "",
              ].join(" ")}
            >
              <input
                type="radio"
                name="fpl-validation-mode"
                value="learning"
                checked={mode === "learning"}
                onChange={handleModeChange}
              />
              {t("training.modeTraining")}
            </label>
          </div>
          <p className={styles.form__modeHint}>
            {mode === "learning" ? t("training.modeTrainingHint") : t("training.modeProductionHint")}
          </p>
        </fieldset>

        <label htmlFor="fpl-validator-input" className={styles.form__label}>
          {t("check.inputLabel")}
        </label>

        <Textarea
          ref={ref}
          id="fpl-validator-input"
          name="rawFpl"
          value={value}
          onChange={handleFplChange}
          placeholder={t("check.placeholder")}
          ariaLabel={t("check.inputLabel")}
          describedBy="fpl-validator-hint fpl-validator-counter"
          rows={14}
          disabled={isLoading}
          error={uiState === "empty" || uiState === "error" ? fieldError : undefined}
        />

        <div className={styles.form__meta}>
          <p id="fpl-validator-hint" className={styles.form__hint}>
            {t("check.hint")}
          </p>
          <p
            id="fpl-validator-counter"
            className={styles.form__counter}
            aria-live="polite"
          >
            {t("check.charCount", { count: charCount })}
          </p>
        </div>

        <div className={styles.form__actions}>
          <Button type="submit" variant="primary" size="lg" disabled={isLoading}>
            {isLoading ? t("check.checking") : t("check.submit")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            disabled={isLoading}
            onClick={handleInsertExample}
            ariaLabel={t("check.exampleAria")}
          >
            {t("check.example")}
          </Button>
        </div>

        {isLoading ? (
          <p className={styles.form__status} role="status" aria-live="polite">
            {t("check.loading")}
          </p>
        ) : null}
      </form>
    );
  },
);

FplCheckForm.displayName = "FplCheckForm";
