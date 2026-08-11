import { getLocaleStaticParams, renderStubPage } from "@/lib/pages/render-stub-page";

export const generateStaticParams = getLocaleStaticParams;
/** ISR: stub page (see static-rendering.ts). */
export const revalidate = 3600;

type PageProps = {
  params: Promise<{ locale: string }>;
};

/**
 * Compensations → Ticket refunds stub page.
 * @param {PageProps} props - Route props.
 * @returns {Promise<React.ReactElement>} Stub page.
 */
const CompensationsRefundsPage = async ({ params }: PageProps) => {
  const { locale } = await params;
  return renderStubPage(locale, "refunds");
};

export default CompensationsRefundsPage;
