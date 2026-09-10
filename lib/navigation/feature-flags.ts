/**
 * Product navigation feature flags.
 * Hidden sections keep their routes/pages; only chrome/prefetch is gated.
 */

/**
 * When false, Compensations is omitted from header/drawer and nav prefetch.
 * Routes under `/[locale]/compensations/*` stay available by direct URL.
 */
export const SHOW_COMPENSATIONS_NAV = false;
