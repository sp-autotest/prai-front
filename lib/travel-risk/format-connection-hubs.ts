/**
 * Joins hub display labels with a localized conjunction (no Oxford comma logic).
 * Used for the tightest-connection banner: "Istanbul and Bishkek".
 * @param {string[]} labels - Hub labels in backend order.
 * @param {string} conjunction - Localized " and " / " и " including surrounding spaces.
 * @param {string} [separator=", "] - Separator between items before the last.
 * @returns {string} Joined list, or an empty string when no labels remain.
 * @example
 * joinHubLabels(["Istanbul", "Bishkek"], " and ");
 * // Returns "Istanbul and Bishkek"
 */
export const joinHubLabels = (
  labels: string[],
  conjunction: string,
  separator = ", ",
): string => {
  const cleaned = labels.map((label) => label.trim()).filter(Boolean);

  if (cleaned.length === 0) {
    return "";
  }

  if (cleaned.length === 1) {
    return cleaned[0];
  }

  if (cleaned.length === 2) {
    return `${cleaned[0]}${conjunction}${cleaned[1]}`;
  }

  const head = cleaned.slice(0, -1).join(separator);
  return `${head}${conjunction}${cleaned[cleaned.length - 1]}`;
};
