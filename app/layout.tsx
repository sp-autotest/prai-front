import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Passenger Rights AI",
  description:
    "Assess delay, cancellation, and connection risks before you travel — a credit rating for your flight.",
};

type RootLayoutProps = {
  children: React.ReactNode;
};

/**
 * Root application layout. Wraps all pages with global HTML shell.
 * @param {RootLayoutProps} props - Layout props.
 * @returns {React.ReactElement} Root HTML document structure.
 */
const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">{children}</div>
      </body>
    </html>
  );
};

export default RootLayout;
