/**
 * The value axis of the charts on the Financial Highlights slide.
 *
 * Left to itself, the axis keeps its tick step round by stretching downwards: one year with a loss of
 * 13 pulled the floor to -500 against a tallest bar of 1,416, so a third of the chart was empty and
 * every bar was drawn a third shorter than it needed to be. Here the ticks stay round and the floor is
 * only as deep as the loss needs, so the bars use the height they have.
 */

/** Tick steps people read easily: 1, 2, 2.5, 5 and 10, at any scale */
const NICE = [1, 2, 2.5, 5, 10];

function scaled(rough: number, pick: (candidates: number[]) => number): number {
  if (!(rough > 0)) return 0;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  return pick(NICE.map((step) => step * magnitude));
}

/** The smallest round step at or above `rough` */
const stepAbove = (rough: number) => scaled(rough, (steps) => steps.find((step) => step >= rough) ?? steps[steps.length - 1]);

/** The largest round step at or below `rough` */
const stepBelow = (rough: number) => scaled(rough, (steps) => [...steps].reverse().find((step) => step <= rough) ?? steps[0]);

export interface ValueAxis {
  domain: [number, number];
  ticks: number[];
}

/**
 * Where the axis starts and ends, and the ticks along it.
 *
 * The top is a round step above the tallest bar, with a step of room left for the figure printed over
 * it. The floor is zero when nothing is negative; otherwise it is a shallow band, deep enough for the
 * losing bar and its figure without giving the whole chart away to empty space.
 */
export function valueAxis(values: number[], targetTicks = 3): ValueAxis {
  const figures = values.filter((value) => Number.isFinite(value));
  const max = Math.max(0, ...figures);
  const min = Math.min(0, ...figures);
  if (max === 0 && min === 0) return { domain: [0, 1], ticks: [0, 1] };

  const step = stepAbove(max / targetTicks) || 1;
  let top = Math.ceil(max / step) * step;
  // The figure sits above the bar, so the tallest one needs a little sky
  if (top - max < step * 0.15) top += step;

  const ticks: number[] = [];
  for (let tick = 0; tick <= top + step / 2; tick += step) ticks.push(Math.round(tick * 1000) / 1000);

  // Deep enough for the losing figure to sit clear of the axis line, and never more than a small band
  const band = Math.max(Math.abs(min) * 1.8, top * 0.07);
  const clears = (candidate: number) => -candidate <= min - top * 0.01;
  const shallow = stepBelow(band);
  const floor = min < 0 ? -(clears(shallow) ? shallow : stepAbove(band)) : 0;

  return { domain: [floor, top], ticks };
}
