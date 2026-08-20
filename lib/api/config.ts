/**
 * Resolves API configuration from environment variables.
 * Travel Risk uses the real backend by default (Phase 12); mock is opt-in.
 * FPL Validator URLs are configured in F0; BFF wiring lands in F2.
 */

export type TravelRiskApiConfig = {
  /**
   * When true, the in-process mock adapter is used instead of the backend.
   */
  useMock: boolean;
  /**
   * Absolute analyze URL override. Empty → `{API_BASE}/api/v1/flights/analyze/`.
   */
  remoteUrl: string;
  /**
   * Browser/BFF path the UI posts to (defaults to the Next.js route handler).
   */
  clientEndpoint: string;
};

export type FplValidatorApiConfig = {
  /**
   * Absolute validate URL override. Empty → `{API_BASE}/api/v1/fpl/validate/`.
   */
  validateRemoteUrl: string;
  /**
   * Absolute history base URL override. Empty → `{API_BASE}/api/v1/fpl/history/`.
   * Detail path: `{historyRemoteUrl}{request_id}/`.
   */
  historyRemoteUrl: string;
  /**
   * Absolute stats URL override. Empty → `{API_BASE}/api/v1/fpl/stats/`.
   */
  statsRemoteUrl: string;
  /**
   * Absolute explain URL override. Empty → `{API_BASE}/api/v1/fpl/explain/`.
   */
  explainRemoteUrl: string;
  /**
   * Browser/BFF path for validate.
   */
  validateClientEndpoint: string;
  /**
   * Browser/BFF path for history detail (`/api/fpl/history/{id}`).
   */
  historyClientEndpoint: string;
  /**
   * Browser/BFF path for stats.
   */
  statsClientEndpoint: string;
  /**
   * Browser/BFF path for explain.
   */
  explainClientEndpoint: string;
};

/**
 * Reads the absolute backend API origin (no trailing slash).
 * Used by BFF proxies for auth, profile, Travel Risk analyze, and FPL Validator.
 * @returns {string} Backend origin, e.g. `http://127.0.0.1:8888`.
 */
export const getBackendApiBaseUrl = (): string => {
  const fromEnv = (
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://127.0.0.1:8888"
  ).trim();

  return fromEnv.replace(/\/$/, "") || "http://127.0.0.1:8888";
};

/**
 * Reads Travel Risk env flags and endpoint URLs.
 * - `TRAVEL_RISK_USE_MOCK=true` forces the local mock adapter
 * - `TRAVEL_RISK_API_URL` overrides the analyze URL (optional)
 * - Browser still posts to `/api/travel-risk` by default
 * @returns {TravelRiskApiConfig} Normalized API configuration.
 */
export const getTravelRiskApiConfig = (): TravelRiskApiConfig => {
  const mockFlag =
    process.env.TRAVEL_RISK_USE_MOCK ?? process.env.NEXT_PUBLIC_TRAVEL_RISK_USE_MOCK ?? "false";
  const useMock = mockFlag.toLowerCase() === "true";

  const remoteUrl = (process.env.TRAVEL_RISK_API_URL ?? "").trim();
  const clientEndpoint = (
    process.env.NEXT_PUBLIC_TRAVEL_RISK_API_URL ?? "/api/travel-risk"
  ).trim();

  return {
    useMock,
    remoteUrl,
    clientEndpoint: clientEndpoint || "/api/travel-risk",
  };
};

/**
 * Reads FPL Validator endpoint URLs from env (Phase F0).
 * Defaults point at the documented backend paths under `{API_BASE}/api/v1/fpl/…`.
 * @returns {FplValidatorApiConfig} Normalized FPL API configuration.
 * @example
 * const { validateRemoteUrl } = getFplValidatorApiConfig();
 */
export const getFplValidatorApiConfig = (): FplValidatorApiConfig => {
  const base = getBackendApiBaseUrl();

  const validateRemoteUrl =
    (process.env.FPL_VALIDATOR_API_URL ?? "").trim() || `${base}/api/v1/fpl/validate/`;
  const historyRemoteUrl =
    (process.env.FPL_HISTORY_API_URL ?? "").trim() || `${base}/api/v1/fpl/history/`;
  const statsRemoteUrl =
    (process.env.FPL_STATS_API_URL ?? "").trim() || `${base}/api/v1/fpl/stats/`;
  const explainRemoteUrl =
    (process.env.FPL_EXPLAIN_API_URL ?? "").trim() || `${base}/api/v1/fpl/explain/`;

  const validateClientEndpoint = (
    process.env.NEXT_PUBLIC_FPL_VALIDATOR_API_URL ?? "/api/fpl/validate"
  ).trim();
  const historyClientEndpoint = (
    process.env.NEXT_PUBLIC_FPL_HISTORY_API_URL ?? "/api/fpl/history"
  ).trim();
  const statsClientEndpoint = (
    process.env.NEXT_PUBLIC_FPL_STATS_API_URL ?? "/api/fpl/stats"
  ).trim();
  const explainClientEndpoint = (
    process.env.NEXT_PUBLIC_FPL_EXPLAIN_API_URL ?? "/api/fpl/explain"
  ).trim();

  return {
    validateRemoteUrl,
    historyRemoteUrl: historyRemoteUrl.endsWith("/") ? historyRemoteUrl : `${historyRemoteUrl}/`,
    statsRemoteUrl,
    explainRemoteUrl,
    validateClientEndpoint: validateClientEndpoint || "/api/fpl/validate",
    historyClientEndpoint: historyClientEndpoint || "/api/fpl/history",
    statsClientEndpoint: statsClientEndpoint || "/api/fpl/stats",
    explainClientEndpoint: explainClientEndpoint || "/api/fpl/explain",
  };
};

export type DirectoriesApiConfig = {
  airportsRemoteUrl: string;
  airlinesRemoteUrl: string;
  countriesRemoteUrl: string;
  citiesRemoteUrl: string;
  equipmentRemoteUrl: string;
  freightClassesRemoteUrl: string;
  engineTypesRemoteUrl: string;
  equipmentCategoriesRemoteUrl: string;
  airportsClientEndpoint: string;
  airlinesClientEndpoint: string;
  countriesClientEndpoint: string;
  citiesClientEndpoint: string;
  equipmentClientEndpoint: string;
  freightClassesClientEndpoint: string;
  engineTypesClientEndpoint: string;
  equipmentCategoriesClientEndpoint: string;
};

/**
 * Reads directory search endpoint URLs (airports / airlines / cities / equipment / freight-classes).
 * @returns {DirectoriesApiConfig} Normalized directory API configuration.
 */
export const getDirectoriesApiConfig = (): DirectoriesApiConfig => {
  const base = getBackendApiBaseUrl();

  return {
    airportsRemoteUrl:
      (process.env.DIRECTORIES_AIRPORTS_API_URL ?? "").trim() ||
      `${base}/api/v1/flights/airports/`,
    airlinesRemoteUrl:
      (process.env.DIRECTORIES_AIRLINES_API_URL ?? "").trim() ||
      `${base}/api/v1/flights/airlines/`,
    countriesRemoteUrl:
      (process.env.DIRECTORIES_COUNTRIES_API_URL ?? "").trim() ||
      `${base}/api/v1/flights/countries/`,
    citiesRemoteUrl:
      (process.env.DIRECTORIES_CITIES_API_URL ?? "").trim() ||
      `${base}/api/v1/flights/cities/`,
    equipmentRemoteUrl:
      (process.env.DIRECTORIES_EQUIPMENT_API_URL ?? "").trim() ||
      `${base}/api/v1/flights/equipment/`,
    freightClassesRemoteUrl:
      (process.env.DIRECTORIES_FREIGHT_CLASSES_API_URL ?? "").trim() ||
      `${base}/api/v1/flights/freight-classes/`,
    engineTypesRemoteUrl:
      (process.env.DIRECTORIES_ENGINE_TYPES_API_URL ?? "").trim() ||
      `${base}/api/v1/flights/engine-types/`,
    equipmentCategoriesRemoteUrl:
      (process.env.DIRECTORIES_EQUIPMENT_CATEGORIES_API_URL ?? "").trim() ||
      `${base}/api/v1/flights/equipment-categories/`,
    airportsClientEndpoint: (
      process.env.NEXT_PUBLIC_DIRECTORIES_AIRPORTS_API_URL ?? "/api/directories/airports"
    ).trim() || "/api/directories/airports",
    airlinesClientEndpoint: (
      process.env.NEXT_PUBLIC_DIRECTORIES_AIRLINES_API_URL ?? "/api/directories/airlines"
    ).trim() || "/api/directories/airlines",
    countriesClientEndpoint: (
      process.env.NEXT_PUBLIC_DIRECTORIES_COUNTRIES_API_URL ?? "/api/directories/countries"
    ).trim() || "/api/directories/countries",
    citiesClientEndpoint: (
      process.env.NEXT_PUBLIC_DIRECTORIES_CITIES_API_URL ?? "/api/directories/cities"
    ).trim() || "/api/directories/cities",
    equipmentClientEndpoint: (
      process.env.NEXT_PUBLIC_DIRECTORIES_EQUIPMENT_API_URL ?? "/api/directories/equipment"
    ).trim() || "/api/directories/equipment",
    freightClassesClientEndpoint: (
      process.env.NEXT_PUBLIC_DIRECTORIES_FREIGHT_CLASSES_API_URL ??
        "/api/directories/freight-classes"
    ).trim() || "/api/directories/freight-classes",
    engineTypesClientEndpoint: (
      process.env.NEXT_PUBLIC_DIRECTORIES_ENGINE_TYPES_API_URL ??
        "/api/directories/engine-types"
    ).trim() || "/api/directories/engine-types",
    equipmentCategoriesClientEndpoint: (
      process.env.NEXT_PUBLIC_DIRECTORIES_EQUIPMENT_CATEGORIES_API_URL ??
        "/api/directories/equipment-categories"
    ).trim() || "/api/directories/equipment-categories",
  };
};
