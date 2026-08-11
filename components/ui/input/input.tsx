"use client";

import type React from "react";
import styles from "./input.module.css";

export type InputProps = {
  id?: string;
  name?: string;
  type?: "text" | "email" | "password" | "search" | "tel" | "url" | "number";
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: string;
  /**
   * Accessible label for inputs without an external <label>.
   */
  ariaLabel?: string;
  /**
   * Extra element ids for aria-describedby (hints, helper text).
   */
  describedBy?: string;
  /**
   * Native HTML maxlength attribute.
   */
  maxLength?: number;
  /**
   * Error message (renders inline text and sets aria-invalid).
   */
  error?: string;
  className?: string;
};

/**
 * Text input primitive with focus/disabled and inline error rendering.
 * Used as the base for Travel Risk search inputs.
 * @param {InputProps} props - Component props.
 * @returns {React.ReactElement} Input component.
 */
export const Input = ({
  id,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  autoComplete,
  ariaLabel,
  describedBy,
  maxLength,
  error,
  className,
}: InputProps) => {
  const hasError = Boolean(error);
  const errorId = hasError ? `${id ?? name ?? "input"}-error` : undefined;
  const describedByValue = [describedBy, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={[styles.wrap, className ?? ""].join(" ")}>
      <input
        id={id}
        name={name}
        type={type}
        className={[styles.input, hasError ? styles["input--error"] : ""].join(" ")}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        maxLength={maxLength}
        aria-label={ariaLabel}
        aria-invalid={hasError || undefined}
        aria-describedby={describedByValue}
        autoComplete={autoComplete}
      />
      {hasError && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

