import NextLink from "next/link";
import type React from "react";
import styles from "./link.module.css";

export type LinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  /**
   * Optional aria-label override for assistive technologies.
   */
  ariaLabel?: string;
  /**
   * Enables Next.js prefetch. Defaults to `true` in Next.js; exposed for explicit control.
   */
  prefetch?: boolean;
  /**
   * If set, renders the link as external.
   */
  target?: "_blank" | "_self" | "_parent" | "_top";
};

/**
 * Styled link wrapper for consistent hover and focus behavior.
 * @param {LinkProps} props - Link props.
 * @returns {React.ReactElement} Link element.
 */
export const Link = ({ href, children, className, ariaLabel, prefetch, target }: LinkProps) => {
  const isExternal = typeof target === "string" && target !== "_self";
  const computedRel = isExternal ? "noreferrer noopener" : undefined;

  return (
    <NextLink
      href={href}
      prefetch={prefetch}
      className={[styles.link, className ?? ""].join(" ")}
      aria-label={ariaLabel}
      target={target}
      rel={computedRel}
    >
      {children}
    </NextLink>
  );
};

