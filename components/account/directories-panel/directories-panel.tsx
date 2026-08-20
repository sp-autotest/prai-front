"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button/button";
import { Card } from "@/components/ui/card/card";
import { Input } from "@/components/ui/input/input";
import {
  fetchAirlineSearch,
  fetchAirportSearch,
  fetchCountrySearch,
  fetchCitySearch,
  fetchEngineTypesSearch,
  fetchEquipmentCategoriesSearch,
  fetchEquipmentSearch,
  fetchFreightClassSearch,
} from "@/lib/api/directories";
import type {
  AirlineSearchResult,
  AirportSearchResult,
  CitySearchResult,
  CountrySearchResult,
  EngineTypeSearchResult,
  EquipmentCategorySearchResult,
  EquipmentSearchResult,
  FreightClassSearchResult,
} from "@/types/directories";
import styles from "./directories-panel.module.css";

type DirectoryTab =
  | "airports"
  | "airlines"
  | "countries"
  | "cities"
  | "freightClasses"
  | "engineTypes"
  | "equipmentCategories"
  | "equipment";

/**
 * Account directories panel: airports, airlines, and equipment search.
 * @returns {React.ReactElement} Directories UI.
 */
export const DirectoriesPanel = () => {
  const t = useTranslations("directoriesPage");
  const [tab, setTab] = useState<DirectoryTab>("airports");

  const [airportName, setAirportName] = useState("");
  const [airportIata, setAirportIata] = useState("");
  const [airportIcao, setAirportIcao] = useState("");
  const [airportLimit, setAirportLimit] = useState("50");
  const [airportRows, setAirportRows] = useState<AirportSearchResult[]>([]);
  const [airportCount, setAirportCount] = useState<number | null>(null);

  const [airlineName, setAirlineName] = useState("");
  const [airlineIata, setAirlineIata] = useState("");
  const [airlineIcao, setAirlineIcao] = useState("");
  const [airlineLimit, setAirlineLimit] = useState("50");
  const [airlineRows, setAirlineRows] = useState<AirlineSearchResult[]>([]);
  const [airlineCount, setAirlineCount] = useState<number | null>(null);

  const [countryCode, setCountryCode] = useState("");
  const [countryName, setCountryName] = useState("");
  const [countryLimit, setCountryLimit] = useState("50");
  const [countryRows, setCountryRows] = useState<CountrySearchResult[]>([]);
  const [countryCount, setCountryCount] = useState<number | null>(null);

  const [cityCountryCode, setCityCountryCode] = useState("");
  const [cityCode, setCityCode] = useState("");
  const [cityName, setCityName] = useState("");
  const [cityLimit, setCityLimit] = useState("50");
  const [cityRows, setCityRows] = useState<CitySearchResult[]>([]);
  const [cityCount, setCityCount] = useState<number | null>(null);

  const [freightClassCode, setFreightClassCode] = useState("");
  const [freightClassName, setFreightClassName] = useState("");
  const [freightClassLimit, setFreightClassLimit] = useState("50");
  const [freightClassRows, setFreightClassRows] = useState<FreightClassSearchResult[]>([]);
  const [freightClassCount, setFreightClassCount] = useState<number | null>(null);

  const [engineTypeCode, setEngineTypeCode] = useState("");
  const [engineTypeName, setEngineTypeName] = useState("");
  const [engineTypeLimit, setEngineTypeLimit] = useState("50");
  const [engineTypeRows, setEngineTypeRows] = useState<EngineTypeSearchResult[]>([]);
  const [engineTypeCount, setEngineTypeCount] = useState<number | null>(null);

  const [equipmentCategorySystem, setEquipmentCategorySystem] = useState("");
  const [equipmentCategoryCode, setEquipmentCategoryCode] = useState("");
  const [equipmentCategoryName, setEquipmentCategoryName] = useState("");
  const [equipmentCategoryLimit, setEquipmentCategoryLimit] = useState("50");
  const [equipmentCategoryRows, setEquipmentCategoryRows] = useState<EquipmentCategorySearchResult[]>(
    [],
  );
  const [equipmentCategoryCount, setEquipmentCategoryCount] = useState<number | null>(null);

  const [equipmentName, setEquipmentName] = useState("");
  const [equipmentIata, setEquipmentIata] = useState("");
  const [equipmentIcao, setEquipmentIcao] = useState("");
  const [equipmentFaa, setEquipmentFaa] = useState("");
  const [equipmentLimit, setEquipmentLimit] = useState("50");
  const [equipmentRows, setEquipmentRows] = useState<EquipmentSearchResult[]>([]);
  const [equipmentCount, setEquipmentCount] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /**
   * Switches the active directory tab and clears transient errors.
   * @param {DirectoryTab} next - Target tab.
   */
  const handleTabChange = (next: DirectoryTab) => {
    setTab(next);
    setError("");
  };

  /**
   * Submits airport search against the BFF.
   * @param {React.FormEvent<HTMLFormElement>} event - Form submit event.
   */
  const handleAirportSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const parsedLimit = Number.parseInt(airportLimit, 10);
    const limit = Number.isFinite(parsedLimit) ? parsedLimit : 50;

    const result = await fetchAirportSearch({
      name: airportName.trim() || undefined,
      iata: airportIata.trim() || undefined,
      icao: airportIcao.trim() || undefined,
      limit,
    });

    setLoading(false);

    if (!result.ok) {
      setAirportRows([]);
      setAirportCount(null);
      setError(result.message || t("errors.generic"));
      console.debug("[directories] airports failed", {
        code: result.code,
        apiCode: result.apiCode,
        traceId: result.traceId,
      });
      return;
    }

    setAirportRows(result.value.results);
    setAirportCount(result.value.count);
  };

  /**
   * Submits airline search against the BFF.
   * @param {React.FormEvent<HTMLFormElement>} event - Form submit event.
   */
  const handleAirlineSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const parsedLimit = Number.parseInt(airlineLimit, 10);
    const limit = Number.isFinite(parsedLimit) ? parsedLimit : 50;

    const result = await fetchAirlineSearch({
      name: airlineName.trim() || undefined,
      iata: airlineIata.trim() || undefined,
      icao: airlineIcao.trim() || undefined,
      limit,
    });

    setLoading(false);

    if (!result.ok) {
      setAirlineRows([]);
      setAirlineCount(null);
      setError(result.message || t("errors.generic"));
      console.debug("[directories] airlines failed", {
        code: result.code,
        apiCode: result.apiCode,
        traceId: result.traceId,
      });
      return;
    }

    setAirlineRows(result.value.results);
    setAirlineCount(result.value.count);
  };

  /**
   * Submits country search against the BFF.
   * @param {React.FormEvent<HTMLFormElement>} event - Form submit event.
   */
  const handleCountrySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const parsedLimit = Number.parseInt(countryLimit, 10);
    const limit = Number.isFinite(parsedLimit) ? parsedLimit : 50;

    const result = await fetchCountrySearch({
      code: countryCode.trim() || undefined,
      name: countryName.trim() || undefined,
      limit,
    });

    setLoading(false);

    if (!result.ok) {
      setCountryRows([]);
      setCountryCount(null);
      setError(result.message || t("errors.generic"));
      console.debug("[directories] countries failed", {
        code: result.code,
        apiCode: result.apiCode,
        traceId: result.traceId,
      });
      return;
    }

    setCountryRows(result.value.results);
    setCountryCount(result.value.count);
  };

  /**
   * Submits city search against the BFF.
   * @param {React.FormEvent<HTMLFormElement>} event - Form submit event.
   */
  const handleCitySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const parsedLimit = Number.parseInt(cityLimit, 10);
    const limit = Number.isFinite(parsedLimit) ? parsedLimit : 50;

    const result = await fetchCitySearch({
      country_code: cityCountryCode.trim() || undefined,
      code: cityCode.trim() || undefined,
      name: cityName.trim() || undefined,
      limit,
    });

    setLoading(false);

    if (!result.ok) {
      setCityRows([]);
      setCityCount(null);
      setError(result.message || t("errors.generic"));
      console.debug("[directories] cities failed", {
        code: result.code,
        apiCode: result.apiCode,
        traceId: result.traceId,
      });
      return;
    }

    setCityRows(result.value.results);
    setCityCount(result.value.count);
  };

  /**
   * Submits freight class search against the BFF.
   * @param {React.FormEvent<HTMLFormElement>} event - Form submit event.
   */
  const handleFreightClassSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const parsedLimit = Number.parseInt(freightClassLimit, 10);
    const limit = Number.isFinite(parsedLimit) ? parsedLimit : 50;

    const result = await fetchFreightClassSearch({
      code: freightClassCode.trim() || undefined,
      name: freightClassName.trim() || undefined,
      limit,
    });

    setLoading(false);

    if (!result.ok) {
      setFreightClassRows([]);
      setFreightClassCount(null);
      setError(result.message || t("errors.generic"));
      console.debug("[directories] freight-classes failed", {
        code: result.code,
        apiCode: result.apiCode,
        traceId: result.traceId,
      });
      return;
    }

    setFreightClassRows(result.value.results);
    setFreightClassCount(result.value.count);
  };

  /**
   * Submits engine type search against the BFF.
   * @param {React.FormEvent<HTMLFormElement>} event - Form submit event.
   */
  const handleEngineTypeSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const parsedLimit = Number.parseInt(engineTypeLimit, 10);
    const limit = Number.isFinite(parsedLimit) ? parsedLimit : 50;

    const result = await fetchEngineTypesSearch({
      code: engineTypeCode.trim() || undefined,
      name: engineTypeName.trim() || undefined,
      limit,
    });

    setLoading(false);

    if (!result.ok) {
      setEngineTypeRows([]);
      setEngineTypeCount(null);
      setError(result.message || t("errors.generic"));
      console.debug("[directories] engine-types failed", {
        code: result.code,
        apiCode: result.apiCode,
        traceId: result.traceId,
      });
      return;
    }

    setEngineTypeRows(result.value.results);
    setEngineTypeCount(result.value.count);
  };

  /**
   * Submits equipment category search against the BFF.
   * @param {React.FormEvent<HTMLFormElement>} event - Form submit event.
   */
  const handleEquipmentCategorySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const parsedLimit = Number.parseInt(equipmentCategoryLimit, 10);
    const limit = Number.isFinite(parsedLimit) ? parsedLimit : 50;
    const systemRaw = equipmentCategorySystem.trim().toLowerCase();
    const system =
      systemRaw === "iata" || systemRaw === "icao" ? systemRaw : systemRaw || undefined;

    const result = await fetchEquipmentCategoriesSearch({
      system,
      code: equipmentCategoryCode.trim() || undefined,
      name: equipmentCategoryName.trim() || undefined,
      limit,
    });

    setLoading(false);

    if (!result.ok) {
      setEquipmentCategoryRows([]);
      setEquipmentCategoryCount(null);
      setError(result.message || t("errors.generic"));
      console.debug("[directories] equipment-categories failed", {
        code: result.code,
        apiCode: result.apiCode,
        traceId: result.traceId,
      });
      return;
    }

    setEquipmentCategoryRows(result.value.results);
    setEquipmentCategoryCount(result.value.count);
  };

  /**
   * Submits equipment search against the BFF.
   * @param {React.FormEvent<HTMLFormElement>} event - Form submit event.
   */
  const handleEquipmentSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const parsedLimit = Number.parseInt(equipmentLimit, 10);
    const limit = Number.isFinite(parsedLimit) ? parsedLimit : 50;

    const result = await fetchEquipmentSearch({
      name: equipmentName.trim() || undefined,
      iata: equipmentIata.trim() || undefined,
      icao: equipmentIcao.trim() || undefined,
      faa: equipmentFaa.trim() || undefined,
      limit,
    });

    setLoading(false);

    if (!result.ok) {
      setEquipmentRows([]);
      setEquipmentCount(null);
      setError(result.message || t("errors.generic"));
      console.debug("[directories] equipment failed", {
        code: result.code,
        apiCode: result.apiCode,
        traceId: result.traceId,
      });
      return;
    }

    setEquipmentRows(result.value.results);
    setEquipmentCount(result.value.count);
  };

  return (
    <div className={styles.wrap}>
      <Card elevated padding="lg" className={styles.intro}>
        <h1 className={styles.intro__title}>{t("title")}</h1>
        <p className={styles.intro__subtitle}>{t("subtitle")}</p>
      </Card>

      <div className={styles.tabs} role="tablist" aria-label={t("tabsAria")}>
        {(
          [
            ["airports", t("tabs.airports")],
            ["airlines", t("tabs.airlines")],
            ["countries", t("tabs.countries")],
            ["cities", t("tabs.cities")],
            ["freightClasses", t("tabs.freightClasses")],
            ["engineTypes", t("tabs.engineTypes")],
            ["equipmentCategories", t("tabs.equipmentCategories")],
            ["equipment", t("tabs.equipment")],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={[styles.tabs__btn, tab === id ? styles["tabs__btn--active"] : ""].join(
              " ",
            )}
            onClick={() => handleTabChange(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      {tab === "airports" ? (
        <Card padding="lg" className={styles.section} aria-labelledby="dir-airports-title">
          <h2 id="dir-airports-title" className={styles.section__title}>
            {t("airports.title")}
          </h2>
          <p className={styles.section__hint}>{t("airports.hint")}</p>
          <form className={styles.form} onSubmit={handleAirportSubmit} noValidate>
            <div className={styles.field}>
              <label htmlFor="dir-airport-name" className={styles.field__label}>
                {t("fields.name")}
              </label>
              <Input
                id="dir-airport-name"
                name="name"
                value={airportName}
                onChange={(event) => setAirportName(event.target.value)}
                placeholder={t("airports.namePlaceholder")}
                ariaLabel={t("fields.name")}
                disabled={loading}
              />
            </div>
            <div className={styles.form__row}>
              <div className={styles.field}>
                <label htmlFor="dir-airport-iata" className={styles.field__label}>
                  {t("fields.iata")}
                </label>
                <Input
                  id="dir-airport-iata"
                  name="iata"
                  value={airportIata}
                  onChange={(event) => setAirportIata(event.target.value)}
                  placeholder="SVO"
                  ariaLabel={t("fields.iata")}
                  disabled={loading}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="dir-airport-icao" className={styles.field__label}>
                  {t("fields.icao")}
                </label>
                <Input
                  id="dir-airport-icao"
                  name="icao"
                  value={airportIcao}
                  onChange={(event) => setAirportIcao(event.target.value)}
                  placeholder="UUEE"
                  ariaLabel={t("fields.icao")}
                  disabled={loading}
                />
              </div>
            </div>
            <div className={styles.field}>
              <label htmlFor="dir-airport-limit" className={styles.field__label}>
                {t("airlines.limitLabel")}
              </label>
              <Input
                id="dir-airport-limit"
                name="limit"
                type="number"
                value={airportLimit}
                onChange={(event) => setAirportLimit(event.target.value)}
                placeholder={t("airlines.limitPlaceholder")}
                ariaLabel={t("airlines.limitLabel")}
                disabled={loading}
              />
            </div>
            <Button type="submit" variant="primary" size="lg" disabled={loading}>
              {loading ? t("searching") : t("search")}
            </Button>
          </form>
          {airportCount !== null ? (
            <p className={styles.meta}>{t("resultsCount", { count: airportCount })}</p>
          ) : null}
          {airportRows.length > 0 ? (
            <ul className={styles.list} aria-label={t("airports.title")}>
              {airportRows.map((row) => (
                <li key={row.id} className={styles.list__item}>
                  <p className={styles.list__title}>
                    {[row.iata_code, row.icao_code].filter(Boolean).join(" / ") || "—"} —{" "}
                    {row.name_en}
                  </p>
                  <p className={styles.list__meta}>
                    {row.city}, {row.country_code}
                    {row.timezone ? ` · ${row.timezone}` : ""}
                  </p>
                  <details className={styles.details} aria-label={t("airlines.detailsAriaLabel")}>
                    <summary className={styles.details__summary}>
                      {t("airlines.detailsSummary")}
                    </summary>
                    <pre className={styles.pre}>{JSON.stringify(row, null, 2)}</pre>
                  </details>
                </li>
              ))}
            </ul>
          ) : null}
          {airportCount === 0 ? <p className={styles.empty}>{t("empty")}</p> : null}
        </Card>
      ) : null}

      {tab === "airlines" ? (
        <Card padding="lg" className={styles.section} aria-labelledby="dir-airlines-title">
          <h2 id="dir-airlines-title" className={styles.section__title}>
            {t("airlines.title")}
          </h2>
          <p className={styles.section__hint}>{t("airlines.hint")}</p>
          <form className={styles.form} onSubmit={handleAirlineSubmit} noValidate>
            <div className={styles.field}>
              <label htmlFor="dir-airline-name" className={styles.field__label}>
                {t("fields.name")}
              </label>
              <Input
                id="dir-airline-name"
                name="name"
                value={airlineName}
                onChange={(event) => setAirlineName(event.target.value)}
                placeholder={t("airlines.namePlaceholder")}
                ariaLabel={t("fields.name")}
                disabled={loading}
              />
            </div>
            <div className={styles.form__row}>
              <div className={styles.field}>
                <label htmlFor="dir-airline-iata" className={styles.field__label}>
                  {t("fields.iata")}
                </label>
                <Input
                  id="dir-airline-iata"
                  name="iata"
                  value={airlineIata}
                  onChange={(event) => setAirlineIata(event.target.value)}
                  placeholder="SU"
                  ariaLabel={t("fields.iata")}
                  disabled={loading}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="dir-airline-icao" className={styles.field__label}>
                  {t("fields.icao")}
                </label>
                <Input
                  id="dir-airline-icao"
                  name="icao"
                  value={airlineIcao}
                  onChange={(event) => setAirlineIcao(event.target.value)}
                  placeholder="AFL"
                  ariaLabel={t("fields.icao")}
                  disabled={loading}
                />
              </div>
            </div>
            <div className={styles.field}>
              <label htmlFor="dir-airline-limit" className={styles.field__label}>
                {t("airlines.limitLabel")}
              </label>
              <Input
                id="dir-airline-limit"
                name="limit"
                type="number"
                value={airlineLimit}
                onChange={(event) => setAirlineLimit(event.target.value)}
                placeholder={t("airlines.limitPlaceholder")}
                ariaLabel={t("airlines.limitLabel")}
                disabled={loading}
              />
            </div>
            <Button type="submit" variant="primary" size="lg" disabled={loading}>
              {loading ? t("searching") : t("search")}
            </Button>
          </form>
          {airlineCount !== null ? (
            <p className={styles.meta}>{t("resultsCount", { count: airlineCount })}</p>
          ) : null}
          {airlineRows.length > 0 ? (
            <ul className={styles.list} aria-label={t("airlines.title")}>
              {airlineRows.map((row) => (
                <li key={row.id} className={styles.list__item}>
                  <p className={styles.list__title}>
                    {[row.code?.iata, row.code?.icao].filter(Boolean).join(" / ") || "—"} —{" "}
                    {row.name}
                  </p>
                  <details className={styles.details} aria-label={t("airlines.detailsAriaLabel")}>
                    <summary className={styles.details__summary}>
                      {t("airlines.detailsSummary")}
                    </summary>
                    <pre className={styles.pre}>{JSON.stringify(row, null, 2)}</pre>
                  </details>
                </li>
              ))}
            </ul>
          ) : null}
          {airlineCount === 0 ? <p className={styles.empty}>{t("empty")}</p> : null}
        </Card>
      ) : null}

      {tab === "countries" ? (
        <Card padding="lg" className={styles.section} aria-labelledby="dir-countries-title">
          <h2 id="dir-countries-title" className={styles.section__title}>
            {t("countries.title")}
          </h2>
          <p className={styles.section__hint}>{t("countries.hint")}</p>
          <form className={styles.form} onSubmit={handleCountrySubmit} noValidate>
            <div className={styles.field}>
              <label htmlFor="dir-country-name" className={styles.field__label}>
                {t("fields.name")}
              </label>
              <Input
                id="dir-country-name"
                name="name"
                value={countryName}
                onChange={(event) => setCountryName(event.target.value)}
                placeholder={t("countries.namePlaceholder")}
                ariaLabel={t("fields.name")}
                disabled={loading}
              />
            </div>
            <div className={styles.form__row}>
              <div className={styles.field}>
                <label htmlFor="dir-country-code" className={styles.field__label}>
                  {t("countries.codeLabel")}
                </label>
                <Input
                  id="dir-country-code"
                  name="code"
                  value={countryCode}
                  onChange={(event) => setCountryCode(event.target.value)}
                  placeholder={t("countries.codePlaceholder")}
                  ariaLabel={t("countries.codeLabel")}
                  disabled={loading}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="dir-country-limit" className={styles.field__label}>
                  {t("airlines.limitLabel")}
                </label>
                <Input
                  id="dir-country-limit"
                  name="limit"
                  type="number"
                  value={countryLimit}
                  onChange={(event) => setCountryLimit(event.target.value)}
                  placeholder={t("airlines.limitPlaceholder")}
                  ariaLabel={t("airlines.limitLabel")}
                  disabled={loading}
                />
              </div>
            </div>
            <Button type="submit" variant="primary" size="lg" disabled={loading}>
              {loading ? t("searching") : t("search")}
            </Button>
          </form>
          {countryCount !== null ? (
            <p className={styles.meta}>{t("resultsCount", { count: countryCount })}</p>
          ) : null}
          {countryRows.length > 0 ? (
            <ul className={styles.list} aria-label={t("countries.title")}>
              {countryRows.map((row) => (
                <li key={row.id} className={styles.list__item}>
                  <p className={styles.list__title}>
                    {row.code.iso ?? row.code.dot ?? "—"} — {row.name}
                  </p>
                  <details className={styles.details} aria-label={t("airlines.detailsAriaLabel")}>
                    <summary className={styles.details__summary}>
                      {t("airlines.detailsSummary")}
                    </summary>
                    <pre className={styles.pre}>{JSON.stringify(row, null, 2)}</pre>
                  </details>
                </li>
              ))}
            </ul>
          ) : null}
          {countryCount === 0 ? <p className={styles.empty}>{t("empty")}</p> : null}
        </Card>
      ) : null}

      {tab === "cities" ? (
        <Card padding="lg" className={styles.section} aria-labelledby="dir-cities-title">
          <h2 id="dir-cities-title" className={styles.section__title}>
            {t("cities.title")}
          </h2>
          <p className={styles.section__hint}>{t("cities.hint")}</p>
          <form className={styles.form} onSubmit={handleCitySubmit} noValidate>
            <div className={styles.field}>
              <label htmlFor="dir-city-name" className={styles.field__label}>
                {t("fields.name")}
              </label>
              <Input
                id="dir-city-name"
                name="name"
                value={cityName}
                onChange={(event) => setCityName(event.target.value)}
                placeholder={t("cities.namePlaceholder")}
                ariaLabel={t("fields.name")}
                disabled={loading}
              />
            </div>
            <div className={styles.form__row}>
              <div className={styles.field}>
                <label htmlFor="dir-city-country" className={styles.field__label}>
                  {t("cities.countryCodeLabel")}
                </label>
                <Input
                  id="dir-city-country"
                  name="country_code"
                  value={cityCountryCode}
                  onChange={(event) => setCityCountryCode(event.target.value)}
                  placeholder="RU"
                  ariaLabel={t("cities.countryCodeLabel")}
                  disabled={loading}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="dir-city-code" className={styles.field__label}>
                  {t("cities.codeLabel")}
                </label>
                <Input
                  id="dir-city-code"
                  name="code"
                  value={cityCode}
                  onChange={(event) => setCityCode(event.target.value)}
                  placeholder="MOW"
                  ariaLabel={t("cities.codeLabel")}
                  disabled={loading}
                />
              </div>
            </div>
            <div className={styles.field}>
              <label htmlFor="dir-city-limit" className={styles.field__label}>
                {t("airlines.limitLabel")}
              </label>
              <Input
                id="dir-city-limit"
                name="limit"
                type="number"
                value={cityLimit}
                onChange={(event) => setCityLimit(event.target.value)}
                placeholder={t("airlines.limitPlaceholder")}
                ariaLabel={t("airlines.limitLabel")}
                disabled={loading}
              />
            </div>
            <Button type="submit" variant="primary" size="lg" disabled={loading}>
              {loading ? t("searching") : t("search")}
            </Button>
          </form>
          {cityCount !== null ? (
            <p className={styles.meta}>{t("resultsCount", { count: cityCount })}</p>
          ) : null}
          {cityRows.length > 0 ? (
            <ul className={styles.list} aria-label={t("cities.title")}>
              {cityRows.map((row) => (
                <li key={row.id} className={styles.list__item}>
                  <p className={styles.list__title}>
                    {row.name}
                    {row.code ? ` (${row.code})` : ""}
                  </p>
                  <p className={styles.list__meta}>{row.country_code}</p>
                  <details className={styles.details} aria-label={t("airlines.detailsAriaLabel")}>
                    <summary className={styles.details__summary}>
                      {t("airlines.detailsSummary")}
                    </summary>
                    <pre className={styles.pre}>{JSON.stringify(row, null, 2)}</pre>
                  </details>
                </li>
              ))}
            </ul>
          ) : null}
          {cityCount === 0 ? <p className={styles.empty}>{t("empty")}</p> : null}
        </Card>
      ) : null}

      {tab === "freightClasses" ? (
        <Card padding="lg" className={styles.section} aria-labelledby="dir-freight-classes-title">
          <h2 id="dir-freight-classes-title" className={styles.section__title}>
            {t("freightClasses.title")}
          </h2>
          <p className={styles.section__hint}>{t("freightClasses.hint")}</p>
          <form className={styles.form} onSubmit={handleFreightClassSubmit} noValidate>
            <div className={styles.field}>
              <label htmlFor="dir-freight-class-name" className={styles.field__label}>
                {t("fields.name")}
              </label>
              <Input
                id="dir-freight-class-name"
                name="name"
                value={freightClassName}
                onChange={(event) => setFreightClassName(event.target.value)}
                placeholder={t("freightClasses.namePlaceholder")}
                ariaLabel={t("fields.name")}
                disabled={loading}
              />
            </div>
            <div className={styles.form__row}>
              <div className={styles.field}>
                <label htmlFor="dir-freight-class-code" className={styles.field__label}>
                  {t("freightClasses.codeLabel")}
                </label>
                <Input
                  id="dir-freight-class-code"
                  name="code"
                  value={freightClassCode}
                  onChange={(event) => setFreightClassCode(event.target.value)}
                  placeholder="LL"
                  ariaLabel={t("freightClasses.codeLabel")}
                  disabled={loading}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="dir-freight-class-limit" className={styles.field__label}>
                  {t("airlines.limitLabel")}
                </label>
                <Input
                  id="dir-freight-class-limit"
                  name="limit"
                  type="number"
                  value={freightClassLimit}
                  onChange={(event) => setFreightClassLimit(event.target.value)}
                  placeholder={t("airlines.limitPlaceholder")}
                  ariaLabel={t("airlines.limitLabel")}
                  disabled={loading}
                />
              </div>
            </div>
            <Button type="submit" variant="primary" size="lg" disabled={loading}>
              {loading ? t("searching") : t("search")}
            </Button>
          </form>
          {freightClassCount !== null ? (
            <p className={styles.meta}>{t("resultsCount", { count: freightClassCount })}</p>
          ) : null}
          {freightClassRows.length > 0 ? (
            <ul className={styles.list} aria-label={t("freightClasses.title")}>
              {freightClassRows.map((row) => (
                <li key={row.id} className={styles.list__item}>
                  <p className={styles.list__title}>
                    {row.code} — {row.name}
                  </p>
                  <details className={styles.details} aria-label={t("airlines.detailsAriaLabel")}>
                    <summary className={styles.details__summary}>
                      {t("airlines.detailsSummary")}
                    </summary>
                    <pre className={styles.pre}>{JSON.stringify(row, null, 2)}</pre>
                  </details>
                </li>
              ))}
            </ul>
          ) : null}
          {freightClassCount === 0 ? <p className={styles.empty}>{t("empty")}</p> : null}
        </Card>
      ) : null}

      {tab === "engineTypes" ? (
        <Card padding="lg" className={styles.section} aria-labelledby="dir-engine-types-title">
          <h2 id="dir-engine-types-title" className={styles.section__title}>
            {t("engineTypes.title")}
          </h2>
          <p className={styles.section__hint}>{t("engineTypes.hint")}</p>
          <form className={styles.form} onSubmit={handleEngineTypeSubmit} noValidate>
            <div className={styles.field}>
              <label htmlFor="dir-engine-type-name" className={styles.field__label}>
                {t("fields.name")}
              </label>
              <Input
                id="dir-engine-type-name"
                name="name"
                value={engineTypeName}
                onChange={(event) => setEngineTypeName(event.target.value)}
                placeholder={t("engineTypes.namePlaceholder")}
                ariaLabel={t("fields.name")}
                disabled={loading}
              />
            </div>
            <div className={styles.form__row}>
              <div className={styles.field}>
                <label htmlFor="dir-engine-type-code" className={styles.field__label}>
                  {t("engineTypes.codeLabel")}
                </label>
                <Input
                  id="dir-engine-type-code"
                  name="code"
                  value={engineTypeCode}
                  onChange={(event) => setEngineTypeCode(event.target.value)}
                  placeholder={t("engineTypes.codePlaceholder")}
                  ariaLabel={t("engineTypes.codeLabel")}
                  disabled={loading}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="dir-engine-type-limit" className={styles.field__label}>
                  {t("airlines.limitLabel")}
                </label>
                <Input
                  id="dir-engine-type-limit"
                  name="limit"
                  type="number"
                  value={engineTypeLimit}
                  onChange={(event) => setEngineTypeLimit(event.target.value)}
                  placeholder={t("airlines.limitPlaceholder")}
                  ariaLabel={t("airlines.limitLabel")}
                  disabled={loading}
                />
              </div>
            </div>
            <Button type="submit" variant="primary" size="lg" disabled={loading}>
              {loading ? t("searching") : t("search")}
            </Button>
          </form>
          {engineTypeCount !== null ? (
            <p className={styles.meta}>{t("resultsCount", { count: engineTypeCount })}</p>
          ) : null}
          {engineTypeRows.length > 0 ? (
            <ul className={styles.list} aria-label={t("engineTypes.title")}>
              {engineTypeRows.map((row) => (
                <li key={row.id} className={styles.list__item}>
                  <p className={styles.list__title}>
                    {row.code} — {row.name}
                  </p>
                  <details className={styles.details} aria-label={t("airlines.detailsAriaLabel")}>
                    <summary className={styles.details__summary}>
                      {t("airlines.detailsSummary")}
                    </summary>
                    <pre className={styles.pre}>{JSON.stringify(row, null, 2)}</pre>
                  </details>
                </li>
              ))}
            </ul>
          ) : null}
          {engineTypeCount === 0 ? <p className={styles.empty}>{t("empty")}</p> : null}
        </Card>
      ) : null}

      {tab === "equipmentCategories" ? (
        <Card
          padding="lg"
          className={styles.section}
          aria-labelledby="dir-equipment-categories-title"
        >
          <h2 id="dir-equipment-categories-title" className={styles.section__title}>
            {t("equipmentCategories.title")}
          </h2>
          <p className={styles.section__hint}>{t("equipmentCategories.hint")}</p>
          <form className={styles.form} onSubmit={handleEquipmentCategorySubmit} noValidate>
            <div className={styles.field}>
              <label htmlFor="dir-equipment-category-name" className={styles.field__label}>
                {t("fields.name")}
              </label>
              <Input
                id="dir-equipment-category-name"
                name="name"
                value={equipmentCategoryName}
                onChange={(event) => setEquipmentCategoryName(event.target.value)}
                placeholder={t("equipmentCategories.namePlaceholder")}
                ariaLabel={t("fields.name")}
                disabled={loading}
              />
            </div>
            <div className={styles.form__row}>
              <div className={styles.field}>
                <label htmlFor="dir-equipment-category-system" className={styles.field__label}>
                  {t("equipmentCategories.systemLabel")}
                </label>
                <Input
                  id="dir-equipment-category-system"
                  name="system"
                  value={equipmentCategorySystem}
                  onChange={(event) => setEquipmentCategorySystem(event.target.value)}
                  placeholder={t("equipmentCategories.systemPlaceholder")}
                  ariaLabel={t("equipmentCategories.systemLabel")}
                  disabled={loading}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="dir-equipment-category-code" className={styles.field__label}>
                  {t("equipmentCategories.codeLabel")}
                </label>
                <Input
                  id="dir-equipment-category-code"
                  name="code"
                  value={equipmentCategoryCode}
                  onChange={(event) => setEquipmentCategoryCode(event.target.value)}
                  placeholder={t("equipmentCategories.codePlaceholder")}
                  ariaLabel={t("equipmentCategories.codeLabel")}
                  disabled={loading}
                />
              </div>
            </div>
            <div className={styles.field}>
              <label htmlFor="dir-equipment-category-limit" className={styles.field__label}>
                {t("airlines.limitLabel")}
              </label>
              <Input
                id="dir-equipment-category-limit"
                name="limit"
                type="number"
                value={equipmentCategoryLimit}
                onChange={(event) => setEquipmentCategoryLimit(event.target.value)}
                placeholder={t("airlines.limitPlaceholder")}
                ariaLabel={t("airlines.limitLabel")}
                disabled={loading}
              />
            </div>
            <Button type="submit" variant="primary" size="lg" disabled={loading}>
              {loading ? t("searching") : t("search")}
            </Button>
          </form>
          {equipmentCategoryCount !== null ? (
            <p className={styles.meta}>{t("resultsCount", { count: equipmentCategoryCount })}</p>
          ) : null}
          {equipmentCategoryRows.length > 0 ? (
            <ul className={styles.list} aria-label={t("equipmentCategories.title")}>
              {equipmentCategoryRows.map((row) => (
                <li key={row.id} className={styles.list__item}>
                  <p className={styles.list__title}>
                    {row.system} {row.code} — {row.name ?? "—"}
                  </p>
                  <details className={styles.details} aria-label={t("airlines.detailsAriaLabel")}>
                    <summary className={styles.details__summary}>
                      {t("airlines.detailsSummary")}
                    </summary>
                    <pre className={styles.pre}>{JSON.stringify(row, null, 2)}</pre>
                  </details>
                </li>
              ))}
            </ul>
          ) : null}
          {equipmentCategoryCount === 0 ? <p className={styles.empty}>{t("empty")}</p> : null}
        </Card>
      ) : null}

      {tab === "equipment" ? (
        <Card padding="lg" className={styles.section} aria-labelledby="dir-equipment-title">
          <h2 id="dir-equipment-title" className={styles.section__title}>
            {t("equipment.title")}
          </h2>
          <p className={styles.section__hint}>{t("equipment.hint")}</p>
          <form className={styles.form} onSubmit={handleEquipmentSubmit} noValidate>
            <div className={styles.field}>
              <label htmlFor="dir-equipment-name" className={styles.field__label}>
                {t("fields.name")}
              </label>
              <Input
                id="dir-equipment-name"
                name="name"
                value={equipmentName}
                onChange={(event) => setEquipmentName(event.target.value)}
                placeholder={t("equipment.namePlaceholder")}
                ariaLabel={t("fields.name")}
                disabled={loading}
              />
            </div>
            <div className={styles.form__row}>
              <div className={styles.field}>
                <label htmlFor="dir-equipment-iata" className={styles.field__label}>
                  {t("fields.iata")}
                </label>
                <Input
                  id="dir-equipment-iata"
                  name="iata"
                  value={equipmentIata}
                  onChange={(event) => setEquipmentIata(event.target.value)}
                  placeholder="738"
                  ariaLabel={t("fields.iata")}
                  disabled={loading}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="dir-equipment-icao" className={styles.field__label}>
                  {t("fields.icao")}
                </label>
                <Input
                  id="dir-equipment-icao"
                  name="icao"
                  value={equipmentIcao}
                  onChange={(event) => setEquipmentIcao(event.target.value)}
                  placeholder="B738"
                  ariaLabel={t("fields.icao")}
                  disabled={loading}
                />
              </div>
            </div>
            <div className={styles.form__row}>
              <div className={styles.field}>
                <label htmlFor="dir-equipment-faa" className={styles.field__label}>
                  {t("fields.faa")}
                </label>
                <Input
                  id="dir-equipment-faa"
                  name="faa"
                  value={equipmentFaa}
                  onChange={(event) => setEquipmentFaa(event.target.value)}
                  placeholder="B738"
                  ariaLabel={t("fields.faa")}
                  disabled={loading}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="dir-equipment-limit" className={styles.field__label}>
                  {t("airlines.limitLabel")}
                </label>
                <Input
                  id="dir-equipment-limit"
                  name="limit"
                  type="number"
                  value={equipmentLimit}
                  onChange={(event) => setEquipmentLimit(event.target.value)}
                  placeholder={t("airlines.limitPlaceholder")}
                  ariaLabel={t("airlines.limitLabel")}
                  disabled={loading}
                />
              </div>
            </div>
            <Button type="submit" variant="primary" size="lg" disabled={loading}>
              {loading ? t("searching") : t("search")}
            </Button>
          </form>
          {equipmentCount !== null ? (
            <p className={styles.meta}>{t("resultsCount", { count: equipmentCount })}</p>
          ) : null}
          {equipmentRows.length > 0 ? (
            <ul className={styles.list} aria-label={t("equipment.title")}>
              {equipmentRows.map((row) => (
                <li key={row.id} className={styles.list__item}>
                  <p className={styles.list__title}>
                    {[row.code?.iata, row.code?.icao, row.code?.faa].filter(Boolean).join(" / ") ||
                      "—"}{" "}
                    — {row.name_en}
                  </p>
                  <p className={styles.list__meta}>
                    {t("equipment.wake", { value: row.wake_category || "—" })}
                  </p>
                  <details className={styles.details} aria-label={t("airlines.detailsAriaLabel")}>
                    <summary className={styles.details__summary}>
                      {t("airlines.detailsSummary")}
                    </summary>
                    <pre className={styles.pre}>{JSON.stringify(row, null, 2)}</pre>
                  </details>
                </li>
              ))}
            </ul>
          ) : null}
          {equipmentCount === 0 ? <p className={styles.empty}>{t("empty")}</p> : null}
        </Card>
      ) : null}
    </div>
  );
};
