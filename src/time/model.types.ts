import { MaybeFn } from 'yummies/utils/types';

export interface TimeConfig<TValue = Date> {
  abortSignal?: AbortSignal;
  updatePer?: MaybeFn<number>;
  map?: (date: Date) => TValue;
}
