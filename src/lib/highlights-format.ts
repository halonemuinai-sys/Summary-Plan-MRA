// Keep the saved numeric precision in chart labels, KPI cards and tooltips.
const highlightFormat = new Intl.NumberFormat('en-US', { maximumSignificantDigits: 21 });

export function formatHighlightValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  const number = Number(value);
  return Number.isFinite(number) ? highlightFormat.format(number) : '';
}

// Four bars stand side by side for each year, so their labels have to be narrow enough not to run into
// one another. A whole billion is as fine as the slide needs to read; the tooltip carries the decimals.
const barLabelFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

export function formatHighlightBarLabel(value: unknown): string {
  if (value === null || value === undefined) return '';
  const number = Number(value);
  return Number.isFinite(number) ? barLabelFormat.format(number) : '';
}
