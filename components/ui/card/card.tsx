import type React from "react";
import styles from "./card.module.css";

export type CardPadding = "sm" | "md" | "lg";

export type CardProps = {
  children: React.ReactNode;
  padding?: CardPadding;
  elevated?: boolean;
  className?: string;
  /**
   * Optional semantic hint for consumers.
   */
  role?: string;
};

/**
 * Reusable container with optional elevation and padding.
 * Used as the primary surface component for Flighty-like sections.
 * @param {CardProps} props - Card props.
 * @returns {React.ReactElement} Card element.
 */
export const Card = ({
  children,
  padding = "md",
  elevated = false,
  className,
  role,
}: CardProps) => {
  return (
    <div
      role={role}
      className={[
        styles.card,
        styles[`card--${padding}`],
        elevated ? styles["card--elevated"] : "",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </div>
  );
};

