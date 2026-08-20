import { getDirectoriesApiConfig } from "@/lib/api/config";
import { ApiClientError } from "@/lib/api/errors";
import { requestJson } from "@/lib/api/http";
import type {
  AirlineSearchParams,
  AirlineSearchResponse,
  AirportSearchParams,
  AirportSearchResponse,
  EngineTypeSearchParams,
  EngineTypeSearchResponse,
  EquipmentCategorySearchParams,
  EquipmentCategorySearchResponse,
  CitySearchParams,
  CitySearchResponse,
  CountrySearchParams,
  CountrySearchResponse,
  DirectoryClientErrorCode,
  EquipmentSearchParams,
  EquipmentSearchResponse,
  FreightClassSearchParams,
  FreightClassSearchResponse,
} from "@/types/directories";

export type DirectoryApiResult<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      code: DirectoryClientErrorCode;
      message: string;
      apiCode?: string;
      traceId?: string;
      details?: unknown;
      status?: number;
    };

/**
 * Builds a query string from defined string/number params.
 * @param {Record<string, string | number | undefined>} params - Query map.
 * @returns {string} Query string including leading `?`, or empty.
 */
const toQuery = (params: Record<string, string | number | undefined>): string => {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") {
      return;
    }
    search.set(key, String(value));
  });

  const raw = search.toString();
  return raw ? `?${raw}` : "";
};

/**
 * Maps an ApiClientError into a directory result failure.
 * @param {unknown} error - Thrown error.
 * @param {string} fallback - Fallback message.
 * @returns {DirectoryApiResult<never>} Failure result.
 */
const mapDirectoryError = (error: unknown, fallback: string): DirectoryApiResult<never> => {
  if (error instanceof ApiClientError) {
    console.debug("[api/directories] client error", {
      code: error.code,
      apiCode: error.apiCode,
      status: error.status,
      traceId: error.traceId,
      message: error.message,
    });

    let code: DirectoryClientErrorCode = "server";
    if (error.status === 401) {
      code = "authRequired";
    } else if (error.status === 404) {
      code = "notFound";
    } else if (error.code === "network" || error.code === "timeout" || error.code === "invalid") {
      code = error.code;
    } else if (error.status === 400 || error.status === 422) {
      code = "invalid";
    }

    return {
      ok: false,
      code,
      message: error.message || fallback,
      apiCode: error.apiCode,
      traceId: error.traceId,
      details: error.details,
      status: error.status,
    };
  }

  console.debug("[api/directories] unexpected error", error);
  return { ok: false, code: "server", message: fallback };
};

/**
 * Searches airports via Django ``GET /api/v1/flights/airports/``.
 * @param {AirportSearchParams} params - name / iata / icao / limit.
 * @returns {Promise<DirectoryApiResult<AirportSearchResponse>>} Search payload or failure.
 */
export const searchAirportsOnBackend = async (
  params: AirportSearchParams,
): Promise<DirectoryApiResult<AirportSearchResponse>> => {
  const { airportsRemoteUrl } = getDirectoriesApiConfig();
  const url = `${airportsRemoteUrl}${toQuery(params)}`;

  try {
    console.debug("[api/directories] airports → backend", params);
    const value = await requestJson<AirportSearchResponse>(url, { method: "GET" });
    return { ok: true, value };
  } catch (error) {
    return mapDirectoryError(error, "Unable to search airports.");
  }
};

/**
 * Searches airlines via Django ``GET /api/v1/flights/airlines/``.
 * @param {AirlineSearchParams} params - name / iata / limit.
 * @returns {Promise<DirectoryApiResult<AirlineSearchResponse>>} Search payload or failure.
 */
export const searchAirlinesOnBackend = async (
  params: AirlineSearchParams,
): Promise<DirectoryApiResult<AirlineSearchResponse>> => {
  const { airlinesRemoteUrl } = getDirectoriesApiConfig();
  const url = `${airlinesRemoteUrl}${toQuery(params)}`;

  try {
    console.debug("[api/directories] airlines → backend", params);
    const value = await requestJson<AirlineSearchResponse>(url, { method: "GET" });
    return { ok: true, value };
  } catch (error) {
    return mapDirectoryError(error, "Unable to search airlines.");
  }
};

/**
 * Lists countries via Django ``GET /api/v1/flights/countries/``.
 * @param {CountrySearchParams} params - Optional filters (code / name / limit).
 * @returns {Promise<DirectoryApiResult<CountrySearchResponse>>} Search payload or failure.
 */
export const searchCountriesOnBackend = async (
  params: CountrySearchParams,
): Promise<DirectoryApiResult<CountrySearchResponse>> => {
  const { countriesRemoteUrl } = getDirectoriesApiConfig();
  const url = `${countriesRemoteUrl}${toQuery(params)}`;

  try {
    console.debug("[api/directories] countries → backend", params);
    const value = await requestJson<CountrySearchResponse>(url, { method: "GET" });
    return { ok: true, value };
  } catch (error) {
    return mapDirectoryError(error, "Unable to search countries.");
  }
};

/**
 * Searches cities via Django ``GET /api/v1/flights/cities/``.
 * @param {CitySearchParams} params - country_code / code / name / limit.
 * @returns {Promise<DirectoryApiResult<CitySearchResponse>>} Search payload or failure.
 */
export const searchCitiesOnBackend = async (
  params: CitySearchParams,
): Promise<DirectoryApiResult<CitySearchResponse>> => {
  const { citiesRemoteUrl } = getDirectoriesApiConfig();
  const url = `${citiesRemoteUrl}${toQuery(params)}`;

  try {
    console.debug("[api/directories] cities → backend", params);
    const value = await requestJson<CitySearchResponse>(url, { method: "GET" });
    return { ok: true, value };
  } catch (error) {
    return mapDirectoryError(error, "Unable to search cities.");
  }
};

/**
 * Lists freight classes via Django ``GET /api/v1/flights/freight-classes/``.
 * @param {FreightClassSearchParams} params - code / name / limit.
 * @returns {Promise<DirectoryApiResult<FreightClassSearchResponse>>} Search payload or failure.
 */
export const searchFreightClassesOnBackend = async (
  params: FreightClassSearchParams,
): Promise<DirectoryApiResult<FreightClassSearchResponse>> => {
  const { freightClassesRemoteUrl } = getDirectoriesApiConfig();
  const url = `${freightClassesRemoteUrl}${toQuery(params)}`;

  try {
    console.debug("[api/directories] freight-classes → backend", params);
    const value = await requestJson<FreightClassSearchResponse>(url, { method: "GET" });
    return { ok: true, value };
  } catch (error) {
    return mapDirectoryError(error, "Unable to search freight classes.");
  }
};

/**
 * Lists engine types via Django ``GET /api/v1/flights/engine-types/``.
 * @param {EngineTypeSearchParams} params - Optional filters (code / name / limit).
 * @returns {Promise<DirectoryApiResult<EngineTypeSearchResponse>>} Search payload or failure.
 */
export const searchEngineTypesOnBackend = async (
  params: EngineTypeSearchParams,
): Promise<DirectoryApiResult<EngineTypeSearchResponse>> => {
  const { engineTypesRemoteUrl } = getDirectoriesApiConfig();
  const url = `${engineTypesRemoteUrl}${toQuery(params)}`;

  try {
    console.debug("[api/directories] engine-types → backend", params);
    const value = await requestJson<EngineTypeSearchResponse>(url, { method: "GET" });
    return { ok: true, value };
  } catch (error) {
    return mapDirectoryError(error, "Unable to search engine types.");
  }
};

/**
 * Lists equipment categories via Django ``GET /api/v1/flights/equipment-categories/``.
 * @param {EquipmentCategorySearchParams} params - Optional filters (system / code / name / limit).
 * @returns {Promise<DirectoryApiResult<EquipmentCategorySearchResponse>>} Search payload or failure.
 */
export const searchEquipmentCategoriesOnBackend = async (
  params: EquipmentCategorySearchParams,
): Promise<DirectoryApiResult<EquipmentCategorySearchResponse>> => {
  const { equipmentCategoriesRemoteUrl } = getDirectoriesApiConfig();
  const url = `${equipmentCategoriesRemoteUrl}${toQuery(params)}`;

  try {
    console.debug("[api/directories] equipment-categories → backend", params);
    const value = await requestJson<EquipmentCategorySearchResponse>(url, { method: "GET" });
    return { ok: true, value };
  } catch (error) {
    return mapDirectoryError(error, "Unable to search equipment categories.");
  }
};

/**
 * Searches equipment (aircraft types) via Django ``GET /api/v1/flights/equipment/``.
 * @param {EquipmentSearchParams} params - name / iata / icao / faa / limit.
 * @returns {Promise<DirectoryApiResult<EquipmentSearchResponse>>} Search payload or failure.
 */
export const searchEquipmentOnBackend = async (
  params: EquipmentSearchParams,
): Promise<DirectoryApiResult<EquipmentSearchResponse>> => {
  const { equipmentRemoteUrl } = getDirectoriesApiConfig();
  const url = `${equipmentRemoteUrl}${toQuery(params)}`;

  try {
    console.debug("[api/directories] equipment → backend", params);
    const value = await requestJson<EquipmentSearchResponse>(url, { method: "GET" });
    return { ok: true, value };
  } catch (error) {
    return mapDirectoryError(error, "Unable to search equipment.");
  }
};
