import { IDisposer } from 'disposer-util';

export interface MobxTickerConfig {
  /**
   * ms
   */
  ticksPer: number;

  disposer?: IDisposer;
}
