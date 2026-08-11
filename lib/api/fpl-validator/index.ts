export {
  explainFplOnBackend,
  fetchFplHistoryOnBackend,
  fetchFplStatsOnBackend,
  validateFplOnBackend,
} from "@/lib/api/fpl-validator/client";
export type { FplApiCallOptions, FplApiResult } from "@/lib/api/fpl-validator/client";

export {
  fetchFplExplain,
  fetchFplHistory,
  fetchFplStats,
  fetchFplValidate,
} from "@/lib/api/fpl-validator/browser";

export {
  mapFplApiMessageToIssue,
  mapHistoryApiToUi,
  mapStatsApiToUi,
  mapUiLocaleToFplApi,
  mapValidateApiToUi,
  resolveFplMessageText,
} from "@/lib/api/fpl-validator/map-validate";
