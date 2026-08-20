/**
 * Directory search types for airports / airlines / cities / equipment (aircraft types).
 */

export type DirectorySearchKind =
  | "airports"
  | "airlines"
  | "countries"
  | "cities"
  | "equipment"
  | "freightClasses"
  | "engineTypes"
  | "equipmentCategories";

export type AirportSearchParams = {
  name?: string;
  iata?: string;
  icao?: string;
  limit?: number;
};

export type AirportSearchResult = {
  id: number;
  iata_code: string | null;
  icao_code: string | null;
  faa_code: string;
  name_en: string;
  city: string;
  country_code: string;
  latitude: string | number;
  longitude: string | number;
  timezone: string;
  elevation_ft: number | null;
  location_type: string;
  source: string;
  terminals: Array<{
    code: string;
    name: string;
  }>;
};

export type AirportSearchResponse = {
  count: number;
  results: AirportSearchResult[];
};

export type AirlineSearchParams = {
  name?: string;
  iata?: string;
  icao?: string;
  limit?: number;
};

export type AirlineSearchResult = {
  id: number;
  code: {
    iata: string;
    icao: string | null;
  };
  name: string;
  alternative_name: {
    iata: {
      legal: string | null;
      display: string | null;
    };
    icao: string | null;
  };
  iata_code_rank: number | null;
  iata_code_assignment_category: {
    code: string | null;
    description: string | null;
  } | null;
  iata_accounting_prefix: string | null;
  publishing_carrier: boolean | null;
  duplicate_carrier: boolean | null;
  alliances: string[] | null;
  icao_telephony_name: string | null;
  domicile: unknown;
};

export type AirlineSearchResponse = {
  count: number;
  results: AirlineSearchResult[];
};

export type CountrySearchParams = {
  code?: string;
  name?: string;
  limit?: number;
};

export type CountryCode = {
  iso: string | null;
  dot: string | null;
};

export type CountrySearchResult = {
  id: number;
  name: string;
  code: CountryCode;
};

export type CountrySearchResponse = {
  count: number;
  results: CountrySearchResult[];
};

export type CitySearchParams = {
  country_code?: string;
  code?: string;
  name?: string;
  limit?: number;
};

export type CitySearchResult = {
  id: number;
  name: string;
  code: string | null;
  country_code: string;
};

export type CitySearchResponse = {
  count: number;
  results: CitySearchResult[];
};

export type EquipmentSearchParams = {
  name?: string;
  iata?: string;
  icao?: string;
  faa?: string;
  limit?: number;
};

export type EquipmentManufacturer = {
  name: string | null;
  full_names: string[] | null;
};

export type EquipmentIcaoModel = {
  name: string | null;
  number: string | null;
};

export type EquipmentIcaoSpec = {
  manufacturer?: EquipmentManufacturer | null;
  model?: EquipmentIcaoModel | null;
};

export type EquipmentFaaSpec = {
  category?: string | null;
  manufacturer?: EquipmentManufacturer | null;
  model?: string | null;
};

export type EquipmentIataSpec = {
  manufacturer?: EquipmentManufacturer | null;
  model?: string | null;
};

export type EquipmentSpecification = {
  iata?: EquipmentIataSpec | null;
  icao?: EquipmentIcaoSpec[] | null;
  faa?: EquipmentFaaSpec[] | null;
};

export type EquipmentCode = {
  iata: string;
  icao: string | null;
  faa: string | null;
};

export type EquipmentEngine = {
  type: string | null;
  count: number | null;
};

export type EquipmentClass = {
  icao: string | null;
  faa: string | null;
};

export type EquipmentCategoryIata = {
  code: string;
  description: string | null;
};

export type EquipmentCategoryIcao = {
  code: string;
};

export type EquipmentCategory = {
  iata?: EquipmentCategoryIata | null;
  icao?: EquipmentCategoryIcao | null;
};

export type EquipmentFreightClass = {
  code: string;
  name: string;
};

export type EquipmentServiceType = {
  code: string;
  name: string;
};

export type EquipmentSearchResult = {
  id: number;
  code: EquipmentCode;
  iata_group: string | null;
  name_en: string;
  specification: EquipmentSpecification | null;
  engine: EquipmentEngine | null;
  body_code: string | null;
  class: EquipmentClass | null;
  category: EquipmentCategory | null;
  freight_classes: EquipmentFreightClass[];
  service_types: EquipmentServiceType[];
  wake_category: string | null;
};

export type EquipmentSearchResponse = {
  count: number;
  results: EquipmentSearchResult[];
};

export type FreightClassSearchParams = {
  code?: string;
  name?: string;
  limit?: number;
};

export type FreightClassSearchResult = {
  id: number;
  code: string;
  name: string;
};

export type FreightClassSearchResponse = {
  count: number;
  results: FreightClassSearchResult[];
};

export type EngineTypeSearchParams = {
  code?: string;
  name?: string;
  limit?: number;
};

export type EngineTypeSearchResult = {
  id: number;
  code: string;
  name: string;
};

export type EngineTypeSearchResponse = {
  count: number;
  results: EngineTypeSearchResult[];
};

export type EquipmentCategorySearchParams = {
  system?: "iata" | "icao" | string;
  code?: string;
  name?: string;
  limit?: number;
};

export type EquipmentCategorySearchResult = {
  id: number;
  system: string;
  code: string;
  name: string | null;
};

export type EquipmentCategorySearchResponse = {
  count: number;
  results: EquipmentCategorySearchResult[];
};

export type DirectoryClientErrorCode =
  | "invalid"
  | "network"
  | "timeout"
  | "server"
  | "authRequired"
  | "notFound";
