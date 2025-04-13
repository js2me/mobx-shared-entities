import { PartialKeys } from 'yummies/utils/types';

export interface TimerConfig {
  id: string;
  timeout: number;
  type: 'debounce' | 'throttle';
  leading?: boolean;
  trailing?: boolean;
}

export type TimerConfigRaw =
  | TimerConfig['timeout']
  | Partial<PartialKeys<TimerConfig, 'type'>>;

export type TimedFn = (params: { runAgain: VoidFunction }) => void;
