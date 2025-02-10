export interface DatesComparatorConfig {
  getComparison?: (
    startDate: ResolvedCompareDateType,
    endDate: ResolvedCompareDateType,
  ) => DatesComparison;
  dates?: DatesToCompare;
}

export type CompareDateType = Date | 'now' | number;

export type ResolvedCompareDateType = Date;

export type DatesToCompare = [
  startDate: CompareDateType,
  endDate: CompareDateType,
];

export interface DatesComparison {
  hours: number;
  minutes: number;
  seconds: number;
}
