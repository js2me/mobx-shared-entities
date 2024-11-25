import { IDisposer } from 'disposer-util';

export interface TickerConfig {
  /**
   * ms
   */
  ticksPer: number;

  /**
   * @deprecated please use {abortSignal} instead
   */
  disposer?: IDisposer;
  abortSignal?: AbortSignal;
}
