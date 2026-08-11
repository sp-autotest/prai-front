"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card/card";
import { TravelRiskSection } from "@/components/sections/travel-risk/travel-risk-section";
import styles from "./account-travel-risk.module.css";

/**
 * Account Travel Risk page content: heading + the main risk assessment scenario.
 * @returns {React.ReactElement} Travel Risk account panel.
 */
export const AccountTravelRiskPanel = () => {
  const t = useTranslations("accountPage");

  return (
    <div className={styles.wrap}>
      <Card elevated padding="lg" className={styles.intro}>
        <h1 className={styles.intro__title}>{t("travelRiskTitle")}</h1>
        <p className={styles.intro__subtitle}>{t("travelRiskSubtitle")}</p>
      </Card>

      <div className={styles.scenario}>
        <TravelRiskSection embedded tone="onLight" />
      </div>
    </div>
  );
};
