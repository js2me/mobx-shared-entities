import { IDisposer } from 'disposer-util';

export interface TickerConfig {
  /**
   * ms
   */
  ticksPer: number;

  disposer?: IDisposer;
}
