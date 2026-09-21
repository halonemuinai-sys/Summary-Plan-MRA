// Keep the saved numeric precision in chart labels, KPI cards and tooltips.
const highlightFormat = new Intl.NumberFormat('en-US', { maximumSignificantDigits: 21 });

export function formatHighlightValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  const number = Number(value);
  return Number.isFinite(number) ? highlightFormat.format(number) : '';
}
