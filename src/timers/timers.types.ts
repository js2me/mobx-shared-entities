export interface TimerConfig {
  id: string;
  timeout: number;
  type: 'debounce' | 'throttle';
  leading?: boolean;
  trailing?: boolean;
}

export type TimerConfigRaw = TimerConfig['timeout'] | Partial<TimerConfig>;
