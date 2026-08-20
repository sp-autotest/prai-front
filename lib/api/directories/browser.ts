import { getDirectoriesApiConfig } from "@/lib/api/config";
import { ApiClientError } from "@/lib/api/errors";
import { requestJson } from "@/lib/api/http";
import type { DirectoryApiResult } from "@/lib/api/directories/client";
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

/**
 * Builds a query string from defined params.
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
 * Maps a browser/BFF error into a directory result.
 * @param {unknown} error - Thrown error.
 * @param {string} fallback - Fallback message.
 * @returns {DirectoryApiResult<never>} Failure result.
 */
const mapBrowserError = (error: unknown, fallback: string): DirectoryApiResult<never> => {
  if (error instanceof ApiClientError) {
    console.debug("[directories] browser error", {
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

  return { ok: false, code: "server", message: fallback };
};

/**
 * Browser → BFF airports search.
 * @param {AirportSearchParams} params - Search filters.
 * @returns {Promise<DirectoryApiResult<AirportSearchResponse>>} Result.
 */
export const fetchAirportSearch = async (
  params: AirportSearchParams,
): Promise<DirectoryApiResult<AirportSearchResponse>> => {
  const { airportsClientEndpoint } = getDirectoriesApiConfig();

  try {
    const value = await requestJson<AirportSearchResponse>(
      `${airportsClientEndpoint}${toQuery(params)}`,
      { method: "GET" },
    );
    return { ok: true, value };
  } catch (error) {
    return mapBrowserError(error, "Unable to search airports.");
  }
};

/**
 * Browser → BFF airlines search.
 * @param {AirlineSearchParams} params - Search filters.
 * @returns {Promise<DirectoryApiResult<AirlineSearchResponse>>} Result.
 */
export const fetchAirlineSearch = async (
  params: AirlineSearchParams,
): Promise<DirectoryApiResult<AirlineSearchResponse>> => {
  const { airlinesClientEndpoint } = getDirectoriesApiConfig();

  try {
    const value = await requestJson<AirlineSearchResponse>(
      `${airlinesClientEndpoint}${toQuery(params)}`,
      { method: "GET" },
    );
    return { ok: true, value };
  } catch (error) {
    return mapBrowserError(error, "Unable to search airlines.");
  }
};

/**
 * Browser → BFF country search.
 * @param {CountrySearchParams} params - Search filters (code / name / limit).
 * @returns {Promise<DirectoryApiResult<CountrySearchResponse>>} Result.
 */
export const fetchCountrySearch = async (
  params: CountrySearchParams,
): Promise<DirectoryApiResult<CountrySearchResponse>> => {
  const { countriesClientEndpoint } = getDirectoriesApiConfig();

  try {
    const value = await requestJson<CountrySearchResponse>(
      `${countriesClientEndpoint}${toQuery(params)}`,
      { method: "GET" },
    );
    return { ok: true, value };
  } catch (error) {
    return mapBrowserError(error, "Unable to search countries.");
  }
};

/**
 * Browser → BFF cities search.
 * @param {CitySearchParams} params - Search filters.
 * @returns {Promise<DirectoryApiResult<CitySearchResponse>>} Result.
 */
export const fetchCitySearch = async (
  params: CitySearchParams,
): Promise<DirectoryApiResult<CitySearchResponse>> => {
  const { citiesClientEndpoint } = getDirectoriesApiConfig();

  try {
    const value = await requestJson<CitySearchResponse>(
      `${citiesClientEndpoint}${toQuery(params)}`,
      { method: "GET" },
    );
    return { ok: true, value };
  } catch (error) {
    return mapBrowserError(error, "Unable to search cities.");
  }
};

/**
 * Browser → BFF freight classes search.
 * @param {FreightClassSearchParams} params - Search filters.
 * @returns {Promise<DirectoryApiResult<FreightClassSearchResponse>>} Result.
 */
export const fetchFreightClassSearch = async (
  params: FreightClassSearchParams,
): Promise<DirectoryApiResult<FreightClassSearchResponse>> => {
  const { freightClassesClientEndpoint } = getDirectoriesApiConfig();

  try {
    const value = await requestJson<FreightClassSearchResponse>(
      `${freightClassesClientEndpoint}${toQuery(params)}`,
      { method: "GET" },
    );
    return { ok: true, value };
  } catch (error) {
    return mapBrowserError(error, "Unable to search freight classes.");
  }
};

/**
 * Browser → BFF engine types search.
 * @param {EngineTypeSearchParams} params - Search filters (code / name / limit).
 * @returns {Promise<DirectoryApiResult<EngineTypeSearchResponse>>} Result.
 */
export const fetchEngineTypesSearch = async (
  params: EngineTypeSearchParams,
): Promise<DirectoryApiResult<EngineTypeSearchResponse>> => {
  const { engineTypesClientEndpoint } = getDirectoriesApiConfig();

  try {
    const value = await requestJson<EngineTypeSearchResponse>(
      `${engineTypesClientEndpoint}${toQuery(params)}`,
      { method: "GET" },
    );
    return { ok: true, value };
  } catch (error) {
    return mapBrowserError(error, "Unable to search engine types.");
  }
};

/**
 * Browser → BFF equipment categories search.
 * @param {EquipmentCategorySearchParams} params - Search filters (system / code / name / limit).
 * @returns {Promise<DirectoryApiResult<EquipmentCategorySearchResponse>>} Result.
 */
export const fetchEquipmentCategoriesSearch = async (
  params: EquipmentCategorySearchParams,
): Promise<DirectoryApiResult<EquipmentCategorySearchResponse>> => {
  const { equipmentCategoriesClientEndpoint } = getDirectoriesApiConfig();

  try {
    const value = await requestJson<EquipmentCategorySearchResponse>(
      `${equipmentCategoriesClientEndpoint}${toQuery(params)}`,
      { method: "GET" },
    );
    return { ok: true, value };
  } catch (error) {
    return mapBrowserError(error, "Unable to search equipment categories.");
  }
};

/**
 * Browser → BFF equipment search.
 * @param {EquipmentSearchParams} params - Search filters.
 * @returns {Promise<DirectoryApiResult<EquipmentSearchResponse>>} Result.
 */
export const fetchEquipmentSearch = async (
  params: EquipmentSearchParams,
): Promise<DirectoryApiResult<EquipmentSearchResponse>> => {
  const { equipmentClientEndpoint } = getDirectoriesApiConfig();

  try {
    const value = await requestJson<EquipmentSearchResponse>(
      `${equipmentClientEndpoint}${toQuery(params)}`,
      { method: "GET" },
    );
    return { ok: true, value };
  } catch (error) {
    return mapBrowserError(error, "Unable to search equipment.");
  }
};
