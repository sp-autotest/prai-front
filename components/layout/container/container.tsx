import type React from "react";
import styles from "./container.module.css";

export type ContainerProps = {
  children: React.ReactNode;
  /**
   * Narrow content width for legal/stub pages.
   */
  narrow?: boolean;
  className?: string;
  as?: "div" | "section" | "article";
};

/**
 * Page content container with consistent horizontal padding and max-width.
 * @param {ContainerProps} props - Container props.
 * @returns {React.ReactElement} Container element.
 */
export const Container = ({
  children,
  narrow = false,
  className,
  as: Tag = "div",
}: ContainerProps) => {
  return (
    <Tag
      className={[
        styles.container,
        narrow ? styles["container--narrow"] : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </Tag>
  );
};
