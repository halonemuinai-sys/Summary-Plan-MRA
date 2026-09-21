import { MarginsTrajectoryPoint, PnlTrajectoryPoint, RevenueTrajectoryPoint } from './types';

const round1 = (value: number) => Math.round(value * 10) / 10;

/**
 * Margins are not figures anyone types in: each one is a line of the P&L over that year's revenue.
 * Both the studio and the slide read them from here, so the two can never disagree.
 *
 *   Gross Profit Margin = Gross Profit / Revenue
 *   EBITDA Margin       = EBITDA       / Revenue
 *   Operating Margin    = EBIT         / Revenue
 *   Net Margin          = Net Profit   / Revenue
 *
 * A year with no revenue has no mix to report, so its margins read zero rather than dividing by it.
 */
export function deriveMargins(
  revenueTrajectory: RevenueTrajectoryPoint[],
  pnlTrajectory: PnlTrajectoryPoint[]
): MarginsTrajectoryPoint[] {
  const revenueByYear = new Map(revenueTrajectory.map((point) => [point.year, point.value]));

  return pnlTrajectory.map((point) => {
    const revenue = revenueByYear.get(point.year) ?? 0;
    const share = (value: number) => (revenue > 0 ? round1((value / revenue) * 100) : 0);

    return {
      year: point.year,
      gpm: share(point.gp),
      ebitdam: share(point.ebitda),
      ebitm: share(point.ebit),
      eatm: share(point.eat),
    };
  });
}
