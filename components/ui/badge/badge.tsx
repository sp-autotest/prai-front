import type React from "react";
import styles from "./badge.module.css";

export type BadgeVariant = "accent" | "high" | "medium" | "low";

export type BadgeProps = {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

/**
 * Small inline label used across the UI (scores, categories, statuses).
 * @param {BadgeProps} props - Badge props.
 * @returns {React.ReactElement} Badge element.
 */
export const Badge = ({ children, variant = "accent", className }: BadgeProps) => {
  return (
    <span
      className={[
        styles.badge,
        styles[`badge--${variant}`],
        className ?? "",
      ].join(" ")}
    >
      {children}
    </span>
  );
};

