import styles from "./home-hero.module.css";

export type HomeHeroCopyProps = {
  brand: string;
  title: string;
  lead: string;
};

/**
 * Brand positioning copy for the home split layout (right column).
 * @param {HomeHeroCopyProps} props - Localized hero copy.
 * @returns {React.ReactElement} Brand / title / lead block.
 */
export const HomeHeroCopy = ({ brand, title, lead }: HomeHeroCopyProps) => {
  return (
    <div className={styles.copy} aria-labelledby="home-hero-title">
      <p className={styles.copy__brand}>{brand}</p>
      <h1 id="home-hero-title" className={styles.copy__title}>
        {title}
      </h1>
      <p className={styles.copy__lead}>{lead}</p>
    </div>
  );
};
