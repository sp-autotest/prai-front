import Image from "next/image";
import { Container } from "@/components/layout/container/container";
import { HomeHeroCopy } from "@/components/sections/home-hero/home-hero";
import { TravelRiskSection } from "@/components/sections/travel-risk/travel-risk-section";
import styles from "./home-split.module.css";

export type HomeSplitProps = {
  brand: string;
  title: string;
  lead: string;
  imageAlt: string;
};

/**
 * First-viewport home composition: Travel Risk on the left, brand copy on the right,
 * shared full-bleed visual plane, equal column height from tablet+.
 * @param {HomeSplitProps} props - Localized hero copy and image alt.
 * @returns {React.ReactElement} Split home intro.
 */
export const HomeSplit = ({ brand, title, lead, imageAlt }: HomeSplitProps) => {
  return (
    <section className={styles.split} aria-label={brand}>
      <div className={styles.split__media}>
        <Image
          src="/images/airport-queue.webp"
          alt={imageAlt}
          fill
          priority
          quality={80}
          sizes="100vw"
          className={styles.split__image}
        />
        <div className={styles.split__veil} aria-hidden="true" />
      </div>

      <Container className={styles.split__grid}>
        <div className={styles.split__risk}>
          <TravelRiskSection embedded />
        </div>

        <div className={styles.split__copy}>
          <HomeHeroCopy brand={brand} title={title} lead={lead} />
        </div>
      </Container>
    </section>
  );
};
