/**
 * Sample ICAO FPL fixtures for manual / E2E checks against the Django validator.
 * Format: hyphen-delimited Item 7…18 (as expected by the backend parser).
 */

/** A — relatively valid (high score / few errors). */
export const SAMPLE_ICAO_FPL_A = `FPL-AFL123-IS-B738/M-SDE3FGHIJ1RWXY/LB1-UUEE0800-N0450F350 DCT-ULLI0200-PBN/B1 DOF/260811`;

/** B — broken departure aerodrome (`F13_AIRPORT_EXISTS` / similar). */
export const SAMPLE_ICAO_FPL_B = `FPL-AFL123-IS-B738/M-SDE3FGHIJ1RWXY/LB1-ZZZZ0800-N0450F350 DCT-ULLI0200-DOF/260811`;

/** C — R without PBN (`F10_R_REQUIRES_PBN` / `F18_PBN_REQUIRED`). */
export const SAMPLE_ICAO_FPL_C = `FPL-AFL123-IS-B738/M-SDE3FGHIJ1RWXY/LB1-UUEE0800-N0450F350 DCT-ULLI0200-DOF/260811`;

/** D — garbage (expect HTTP 400 `FPL_PARSE_ERROR`). */
export const SAMPLE_ICAO_FPL_D = `hello world not an fpl`;

/** Default “Example FPL” button content (fixture A). */
export const SAMPLE_ICAO_FPL = SAMPLE_ICAO_FPL_A;
