"use client";

import { forwardRef } from "react";
import type React from "react";
import styles from "./textarea.module.css";

export type TextareaProps = {
  id?: string;
  name?: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  /**
   * Accessible label when no external label is associated.
   */
  ariaLabel?: string;
  /**
   * Extra element ids for aria-describedby.
   */
  describedBy?: string;
  /**
   * Visible rows (CSS also enforces a comfortable min-height).
   */
  rows?: number;
  /**
   * Native HTML maxlength attribute.
   */
  maxLength?: number;
  /**
   * Spellcheck preference (ICAO FPL is usually off).
   */
  spellCheck?: boolean;
  /**
   * Error message (inline + aria-invalid).
   */
  error?: string;
  className?: string;
};

/**
 * Multiline text control matching the Input design tokens.
 * Used for ICAO FPL paste in the account FPL Validator.
 * @param {TextareaProps} props - Component props.
 * @param {React.ForwardedRef<HTMLTextAreaElement>} ref - Native textarea ref.
 * @returns {React.ReactElement} Textarea component.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      id,
      name,
      value,
      onChange,
      placeholder,
      disabled = false,
      required = false,
      ariaLabel,
      describedBy,
      rows = 12,
      maxLength,
      spellCheck = false,
      error,
      className,
    },
    ref,
  ) => {
    const hasError = Boolean(error);
    const errorId = hasError ? `${id ?? name ?? "textarea"}-error` : undefined;
    const describedByValue = [describedBy, errorId].filter(Boolean).join(" ") || undefined;

    return (
      <div className={[styles.wrap, className ?? ""].join(" ")}>
        <textarea
          ref={ref}
          id={id}
          name={name}
          className={[styles.textarea, hasError ? styles["textarea--error"] : ""].join(" ")}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          rows={rows}
          maxLength={maxLength}
          spellCheck={spellCheck}
          aria-label={ariaLabel}
          aria-invalid={hasError || undefined}
          aria-describedby={describedByValue}
        />
        {hasError ? (
          <p id={errorId} className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
