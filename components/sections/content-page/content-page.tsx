import { Container } from "@/components/layout/container/container";
import styles from "./content-page.module.css";

export type ContentPageProps = {
  title: string;
  subtitle: string;
  paragraphs: string[];
};

/**
 * Static content page used for legal and informational copy.
 * @param {ContentPageProps} props - Localized content.
 * @returns {React.ReactElement} Content page layout.
 */
export const ContentPage = ({ title, subtitle, paragraphs }: ContentPageProps) => {
  return (
    <div className={styles.page}>
      <Container narrow>
        <header className={styles.page__header}>
          <h1 className={styles.page__title}>{title}</h1>
          <p className={styles.page__subtitle}>{subtitle}</p>
        </header>

        <div className={styles.page__content}>
          {paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 48)} className={styles.page__paragraph}>
              {paragraph}
            </p>
          ))}
        </div>
      </Container>
    </div>
  );
};
