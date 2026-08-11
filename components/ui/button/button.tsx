"use client";

import type React from "react";
import styles from "./button.module.css";

export type ButtonVariant = "primary" | "secondary" | "accent" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = {
  /**
   * Visible button content.
   */
  children: React.ReactNode;
  /**
   * Visual variant.
   * @default "primary"
   */
  variant?: ButtonVariant;
  /**
   * Sizing variant.
   * @default "md"
   */
  size?: ButtonSize;
  /**
   * HTML button type attribute.
   * @default "button"
   */
  type?: "button" | "submit" | "reset";
  /**
   * Disabled state.
   */
  disabled?: boolean;
  /**
   * Optional accessible label override.
   */
  ariaLabel?: string;
  /**
   * Additional className for styling composition.
   */
  className?: string;
  /**
   * Click handler.
   */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

/**
 * Reusable button primitive with Flighty-like minimal styling.
 * Used across the product to keep typography, spacing, focus, hover and disabled states consistent.
 * @param {ButtonProps} props - Component props.
 * @returns {React.ReactElement} Button element.
 */
export const Button = ({
  children,
  variant = "primary",
  size = "md",
  type = "button",
  disabled = false,
  ariaLabel,
  className,
  onClick,
}: ButtonProps) => {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) {
      event.preventDefault();
      return;
    }

    onClick?.(event);
  };

  return (
    <button
      type={type}
      className={[
        styles.button,
        styles[`button--${variant}`],
        styles[`button--${size}`],
        disabled ? styles["button--disabled"] : "",
        className ?? "",
      ].join(" ")}
      disabled={disabled}
      aria-label={ariaLabel}
      onClick={handleClick}
    >
      {children}
    </button>
  );
};

