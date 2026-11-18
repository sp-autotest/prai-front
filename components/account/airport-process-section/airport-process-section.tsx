"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button/button";
import { Card } from "@/components/ui/card/card";
import { Input } from "@/components/ui/input/input";
import { fetchConnection } from "@/lib/api";
import { getAuthSession } from "@/lib/auth/session";
import type {
  ConnectionItem,
  ConnectionLineItem,
  ConnectionQuality,
  ConnectionResponse,
  ConnectionTicketMode,
} from "@/types/airport-process";
import styles from "./airport-process-section.module.css";

type UiState = "idle" | "loading" | "success" | "error";
type TicketChoice = "both" | ConnectionTicketMode;
type BaggageChoice = "hold" | "cabin";

const PRESET_IATA = ["FCO", "ALA"] as const;

/**
 * Formats a backend minute for display. Null stays blank: not 0, not a dash, not 60.
 * @param {number | null | undefined} value - Minute from the connection item.
 * @param {(vars: { value: string }) => string} format - Localized "{value} min" formatter.
 * @returns {string} Label, or an empty string when the field is null.
 */
const formatMinutes = (
  value: number | null | undefined,
  format: (vars: { value: string }) => string,
): string => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "";
  }

  return format({ value: String(value) });
};

/**
 * True when this object is the cabin-bag path of a self-transfer answer.
 * @param {ConnectionItem} item - One connection item.
 * @returns {boolean} True when baggage_input is none.
 */
const isCabinPath = (item: ConnectionItem): boolean => {
  return item.ticket_mode === "self_transfer" && item.baggage_input === "none";
};

/**
 * Account section that shows two connection answers for one hub.
 * Renders POST /connection items as sent. Does not sum lines and does not call analyze.
 * @returns {React.ReactElement} Airport process section.
 */
export const AirportProcessSection = () => {
  const t = useTranslations("airportProcessPage");
  const [iata, setIata] = useState("");
  const [ticketMode, setTicketMode] = useState<TicketChoice>("both");
  const [baggage, setBaggage] = useState<BaggageChoice>("hold");
  const [uiState, setUiState] = useState<UiState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<ConnectionResponse | null>(null);

  /**
   * Resolves a human label for a line key. Unknown keys stay as sent.
   * @param {string} key - Stable metric id.
   * @returns {string} Localized label.
   */
  const resolveLineLabel = (key: string): string => {
    const known: Record<string, string> = {
      checkin_queue: t("lineKeys.checkinQueue"),
      immig_heuristic: t("lineKeys.immigHeuristic"),
      "deadline=checkin_close": t("lineKeys.deadlineCheckinClose"),
      "deadline=gate_close": t("lineKeys.deadlineGateClose"),
      "last_bag.national": t("lineKeys.lastBagNational"),
      "last_bag.schengen": t("lineKeys.lastBagSchengen"),
      "last_bag.extra_nb": t("lineKeys.lastBagExtraNb"),
      "last_bag.extra_wb": t("lineKeys.lastBagExtraWb"),
      "last_bag.common": t("lineKeys.lastBagCommon"),
      "security.other": t("lineKeys.securityOther"),
      "security.sensitive": t("lineKeys.securitySensitive"),
      "security.common": t("lineKeys.securityCommon"),
    };

    return known[key] ?? key;
  };

  /**
   * Resolves the charter/threshold/unknown mark. Cabin and through stay unmarked.
   * @param {ConnectionItem} item - Connection item.
   * @returns {string | null} Badge text, or null when the mark must not be shown.
   */
  const resolveQualityLabel = (item: ConnectionItem): string | null => {
    if (item.ticket_mode !== "self_transfer" || isCabinPath(item)) {
      return null;
    }

    const labels: Record<ConnectionQuality, string> = {
      calibrated: t("quality.calibrated"),
      proxy: t("quality.proxy"),
      incomplete: t("quality.incomplete"),
    };

    return item.quality ? labels[item.quality] : null;
  };

  /**
   * Loads connection answers for the given IATA using the current switches.
   * Incomplete cache is a successful empty answer, not a form error.
   * @param {string} rawIata - Hub code to send.
   */
  const loadConnection = async (rawIata: string) => {
    if (!getAuthSession()) {
      setResult(null);
      setUiState("error");
      setErrorMessage(t("errors.authRequired"));
      return;
    }

    setUiState("loading");
    setErrorMessage("");
    setResult(null);

    try {
      const response = await fetchConnection({
        iata: rawIata,
        ticketMode,
        cabinOnly: baggage === "cabin",
      });

      if (!response.ok) {
        setUiState("error");
        setErrorMessage(t(`errors.${response.code}`));
        return;
      }

      setResult(response.value);
      setUiState("success");
    } catch {
      setUiState("error");
      setErrorMessage(t("errors.generic"));
    }
  };

  /**
   * Uppercases IATA input and clears a previous form error.
   * @param {React.ChangeEvent<HTMLInputElement>} event - Input change event.
   */
  const handleIataChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIata(event.target.value.toUpperCase());

    if (uiState === "error") {
      setUiState("idle");
      setErrorMessage("");
    }
  };

  /**
   * Submits the typed IATA.
   * @param {React.FormEvent<HTMLFormElement>} event - Form submit event.
   */
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void loadConnection(iata);
  };

  /**
   * Fills a preset hub and sends the request immediately.
   * @param {string} code - FCO or ALA.
   */
  const handlePresetClick = (code: string) => {
    setIata(code);
    void loadConnection(code);
  };

  const formatMinutesLabel = (vars: { value: string }) => t("minutes", vars);

  /**
   * Renders backend addends. Does not sum them.
   * @param {ConnectionLineItem[]} lines - Lines from one column.
   * @returns {React.ReactElement | null} List, or null when the backend sent none.
   */
  const renderLines = (lines: ConnectionLineItem[]) => {
    if (lines.length === 0) {
      return null;
    }

    return (
      <ul className={styles.breakdown}>
        {lines.map((line) => (
          <li key={line.key} className={styles.breakdown__item}>
            <span className={styles.breakdown__label}>{resolveLineLabel(line.key)}</span>
            <span className={styles.breakdown__value}>
              {formatMinutes(line.minutes, formatMinutesLabel)}
            </span>
            {line.source_kind === "heuristic" ? (
              <span className={styles.breakdown__note}>{t("heuristic")}</span>
            ) : null}
            {line.quote ? <span className={styles.breakdown__quote}>{line.quote}</span> : null}
          </li>
        ))}
      </ul>
    );
  };

  /**
   * Renders one self-transfer card: suitcase columns, or the cabin-bag path.
   * @param {ConnectionItem} item - self_transfer object.
   * @param {string} hubCode - Hub IATA from the envelope.
   * @returns {React.ReactElement} Card.
   */
  const renderSelfTransfer = (item: ConnectionItem, hubCode: string) => {
    const cabin = isCabinPath(item);
    const qualityLabel = resolveQualityLabel(item);
    const cabinMinutes = formatMinutes(item.minutes, formatMinutesLabel);
    const cabinUnknown = cabin && item.minutes === null;
    const suitcaseUnknown =
      !cabin &&
      item.quality === "incomplete" &&
      item.minutes_separate_no_border === null &&
      item.minutes_separate_with_border === null;
    const noBorderItems = item.no_border_items ?? [];
    const withBorderItems = item.with_border_items ?? [];
    const cabinLines = withBorderItems.length > 0 ? withBorderItems : noBorderItems;

    return (
      <article className={styles.answer} aria-label={hubCode}>
        <header className={styles.answer__header}>
          <h3 className={styles.answer__title}>
            {cabin ? t("cards.cabinTitle") : t("cards.selfTitle")}
          </h3>
          {qualityLabel ? <span className={styles.mark}>{qualityLabel}</span> : null}
        </header>

        {cabin && item.minutes !== null ? (
          <>
            <p className={styles.pathMinutes}>{cabinMinutes}</p>
            <p className={styles.answer__note}>{t("cabinCaption")}</p>
            {renderLines(cabinLines)}
          </>
        ) : null}

        {cabinUnknown ? (
          <div className={styles.unknown}>
            <p className={styles.unknown__title}>{t("unknown")}</p>
            <p className={styles.unknown__note}>{t("emptyField")}</p>
          </div>
        ) : null}

        {!cabin ? (
          <>
            {suitcaseUnknown ? (
              <div className={styles.unknown}>
                <p className={styles.unknown__title}>{t("unknown")}</p>
                <p className={styles.unknown__note}>{t("emptyField")}</p>
              </div>
            ) : null}
            <div className={styles.columns}>
              <div className={styles.column}>
                <p className={styles.column__label}>{t("columns.noBorder")}</p>
                <p className={styles.column__value}>
                  {formatMinutes(item.minutes_separate_no_border, formatMinutesLabel)}
                </p>
                {item.minutes_separate_no_border !== null ? renderLines(noBorderItems) : null}
              </div>
              <div className={styles.column}>
                <p className={styles.column__label}>{t("columns.withBorder")}</p>
                <p className={styles.column__value}>
                  {formatMinutes(item.minutes_separate_with_border, formatMinutesLabel)}
                </p>
                {item.minutes_separate_with_border !== null ? renderLines(withBorderItems) : null}
              </div>
            </div>
          </>
        ) : null}

        <ul className={styles.meta}>
          {item.last_bag_key ? (
            <li>{t("meta.lastBagKey", { key: resolveLineLabel(`last_bag.${item.last_bag_key}`) })}</li>
          ) : null}
          {item.cutoff_airline ? (
            <li>{t("meta.cutoffAirline", { code: item.cutoff_airline })}</li>
          ) : null}
          {item.raised_to_mct ? <li>{t("meta.raisedToMct")}</li> : null}
          {item.mct_floor !== null ? (
            <li>{t("meta.mctFloor", { value: formatMinutes(item.mct_floor, formatMinutesLabel) })}</li>
          ) : null}
          {item.compiled_as_of ? (
            <li>{t("meta.compiledAsOf", { date: item.compiled_as_of })}</li>
          ) : null}
        </ul>
      </article>
    );
  };

  /**
   * Renders the through card. Its minute is not copied from self-transfer.
   * @param {ConnectionItem} item - through object.
   * @returns {React.ReactElement} Card.
   */
  const renderThrough = (item: ConnectionItem) => {
    const minutes = formatMinutes(item.minutes, formatMinutesLabel);

    return (
      <article className={styles.answer}>
        <header className={styles.answer__header}>
          <h3 className={styles.answer__title}>{t("cards.throughTitle")}</h3>
        </header>
        {item.minutes !== null ? (
          <p className={styles.pathMinutes}>{minutes}</p>
        ) : (
          <p className={styles.answer__note}>{t("throughEmpty")}</p>
        )}
      </article>
    );
  };

  return (
    <section className={styles.section} aria-labelledby="airport-process-title">
      <div className={styles.section__heading}>
        <h2 id="airport-process-title" className={styles.section__title}>
          {t("title")}
        </h2>
        <p className={styles.section__subtitle}>{t("subtitle")}</p>
      </div>

      <Card elevated padding="lg" className={styles.section__panel}>
        <form className={styles.form} onSubmit={handleSubmit} aria-busy={uiState === "loading"}>
          <label htmlFor="airport-process-iata" className={styles.form__label}>
            {t("inputLabel")}
          </label>

          <div className={styles.form__row}>
            <Input
              id="airport-process-iata"
              name="airportProcessIata"
              value={iata}
              onChange={handleIataChange}
              placeholder={t("inputPlaceholder")}
              ariaLabel={t("inputLabel")}
              describedBy="airport-process-hint"
              maxLength={3}
              disabled={uiState === "loading"}
              error={uiState === "error" ? errorMessage : undefined}
              className={styles.form__input}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={uiState === "loading"}
              className={styles.form__submit}
            >
              {uiState === "loading" ? t("checking") : t("submit")}
            </Button>
          </div>

          <div className={styles.presets} role="group" aria-label={t("presetsLabel")}>
            {PRESET_IATA.map((code) => (
              <Button
                key={code}
                type="button"
                variant="secondary"
                size="sm"
                disabled={uiState === "loading"}
                ariaLabel={t("presetAria", { code })}
                onClick={() => handlePresetClick(code)}
              >
                {code}
              </Button>
            ))}
          </div>

          <fieldset className={styles.switch} disabled={uiState === "loading"}>
            <legend className={styles.switch__legend}>{t("ticketMode.label")}</legend>
            <div className={styles.switch__options} role="radiogroup">
              {(
                [
                  ["both", t("ticketMode.both")],
                  ["self_transfer", t("ticketMode.selfTransfer")],
                  ["through", t("ticketMode.through")],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={
                    ticketMode === value
                      ? `${styles.switch__option} ${styles["switch__option--active"]}`
                      : styles.switch__option
                  }
                  aria-pressed={ticketMode === value}
                  onClick={() => setTicketMode(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className={styles.switch} disabled={uiState === "loading"}>
            <legend className={styles.switch__legend}>{t("baggage.label")}</legend>
            <div className={styles.switch__options} role="radiogroup">
              {(
                [
                  ["hold", t("baggage.hold")],
                  ["cabin", t("baggage.cabin")],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={
                    baggage === value
                      ? `${styles.switch__option} ${styles["switch__option--active"]}`
                      : styles.switch__option
                  }
                  aria-pressed={baggage === value}
                  onClick={() => setBaggage(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          <p id="airport-process-hint" className={styles.form__hint}>
            {t("hint")}
          </p>
        </form>

        {uiState === "loading" ? (
          <p className={styles.status} role="status" aria-live="polite">
            {t("loading")}
          </p>
        ) : null}

        {uiState === "success" && result ? (
          <div
            className={styles.answers}
            role="region"
            aria-label={t("answersAria", { iata: result.iata })}
            aria-live="polite"
          >
            {result.items.map((item, index) => (
              <div key={`${item.ticket_mode}-${index}`}>
                {item.ticket_mode === "through"
                  ? renderThrough(item)
                  : renderSelfTransfer(item, result.iata)}
              </div>
            ))}
          </div>
        ) : null}
      </Card>
    </section>
  );
};
