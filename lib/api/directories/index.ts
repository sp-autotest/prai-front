export {
  searchAirlinesOnBackend,
  searchAirportsOnBackend,
  searchCountriesOnBackend,
  searchCitiesOnBackend,
  searchEngineTypesOnBackend,
  searchEquipmentCategoriesOnBackend,
  searchEquipmentOnBackend,
  searchFreightClassesOnBackend,
} from "@/lib/api/directories/client";
export type { DirectoryApiResult } from "@/lib/api/directories/client";

export {
  fetchAirlineSearch,
  fetchAirportSearch,
  fetchCountrySearch,
  fetchCitySearch,
  fetchEngineTypesSearch,
  fetchEquipmentCategoriesSearch,
  fetchEquipmentSearch,
  fetchFreightClassSearch,
} from "@/lib/api/directories/browser";
