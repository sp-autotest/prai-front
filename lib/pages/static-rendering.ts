/**
 * Rendering policy for static / ISR App Router pages.
 * Legal pages stay fully static; marketing stubs and home shell use ISR.
 */

/** Pure SSG: never time-revalidate (legal pages). */
export const LEGAL_REVALIDATE = false as const;

/**
 * ISR window (seconds) for home shell and stub pages.
 * Content is mostly static copy; a 1h refresh is enough until CMS/backend lands.
 */
export const ISR_REVALIDATE_SECONDS = 3600 as const;
