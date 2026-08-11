/**
 * Frontend API layer for the Passenger Rights AI backend contract.
 * Travel Risk uses the real backend analyze API by default (mock is opt-in).
 */

export { getBackendApiBaseUrl, getFplValidatorApiConfig, getTravelRiskApiConfig } from "@/lib/api/config";
export type { FplValidatorApiConfig, TravelRiskApiConfig } from "@/lib/api/config";

export { ApiClientError, mapHttpStatusToClientError } from "@/lib/api/errors";
export { postJson, requestJson } from "@/lib/api/http";
export type { PostJsonOptions, RequestJsonOptions } from "@/lib/api/http";

export { fetchLogin, loginWithCredentials, validateLoginRequest } from "@/lib/api/auth/login";
export type { LoginResult } from "@/lib/api/auth/login";

export {
  fetchRegister,
  registerWithCredentials,
  validateRegisterPassword,
  validateRegisterRequest,
} from "@/lib/api/auth/register";
export type { RegisterResult } from "@/lib/api/auth/register";

export {
  buildBearerAuthorization,
  fetchProfile,
  fetchProfileFromBackend,
  patchProfileOnBackend,
  updateProfile,
} from "@/lib/api/profile/client";
export type { ProfileResult } from "@/lib/api/profile/client";

export {
  assessTravelRisk,
  assessTravelRiskMock,
  fetchTravelRisk,
  mapTravelRiskHttpStatus,
  normalizeTravelRiskRequest,
} from "@/lib/api/travel-risk";

export type { AssessTravelRiskResult, FetchTravelRiskResult } from "@/lib/api/travel-risk";
export type { AssessTravelRiskOptions } from "@/lib/api/travel-risk/client";

export {
  buildFlightAnalyzeQuery,
  mapFlightAnalyzeToTravelRisk,
} from "@/lib/api/travel-risk";

export {
  explainFplOnBackend,
  fetchFplExplain,
  fetchFplHistory,
  fetchFplHistoryOnBackend,
  fetchFplStats,
  fetchFplStatsOnBackend,
  fetchFplValidate,
  mapFplApiMessageToIssue,
  mapHistoryApiToUi,
  mapStatsApiToUi,
  mapUiLocaleToFplApi,
  mapValidateApiToUi,
  validateFplOnBackend,
} from "@/lib/api/fpl-validator";

export type { FplApiCallOptions, FplApiResult } from "@/lib/api/fpl-validator";
