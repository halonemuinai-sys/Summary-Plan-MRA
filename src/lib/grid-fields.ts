/**
 * Grid cells read their figures from flat fields on each row:
 * `y2027` holds the amount of a year and `g2027` its year-on-year growth.
 */
export type YearField = `y${string}`;
export type GrowthField = `g${string}`;

export const yearField = (year: string): YearField => `y${year}`;
export const growthField = (year: string): GrowthField => `g${year}`;
