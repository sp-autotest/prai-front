import { redirect } from "next/navigation";
import { DEFAULT_LOCALE } from "@/types";

/**
 * Root route redirect to the default locale.
 * @returns {never} Redirect result.
 */
export default function RootRedirect() {
  redirect(`/${DEFAULT_LOCALE}`);
}
