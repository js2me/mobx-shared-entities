import { FnValue } from 'yummies/common';

export interface TimeConfig<TValue = Date> {
  abortSignal?: AbortSignal;
  updatePer?: FnValue<number>;
  map?: (date: Date) => TValue;
}
