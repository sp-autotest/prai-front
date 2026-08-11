import Link from "next/link";
import { Container } from "@/components/layout/container/container";
import { Button } from "@/components/ui/button/button";
import { Card } from "@/components/ui/card/card";
import styles from "./stub-page.module.css";

export type StubPageProps = {
  locale: string;
  title: string;
  description: string;
  badgeLabel: string;
  ctaLabel: string;
};

/**
 * Shared stub page template for unfinished product areas.
 * @param {StubPageProps} props - Localized stub content.
 * @returns {React.ReactElement} Stub page layout.
 */
export const StubPage = ({
  locale,
  title,
  description,
  badgeLabel,
  ctaLabel,
}: StubPageProps) => {
  return (
    <div className={styles.page}>
      <Container narrow>
        <Card elevated padding="lg" className={styles.page__card}>
          <p className={styles.page__badge}>{badgeLabel}</p>
          <h1 className={styles.page__title}>{title}</h1>
          <p className={styles.page__description}>{description}</p>
          <Link href={`/${locale}`} prefetch className={styles.page__cta}>
            <Button type="button" variant="primary" size="lg">
              {ctaLabel}
            </Button>
          </Link>
        </Card>
      </Container>
    </div>
  );
};
