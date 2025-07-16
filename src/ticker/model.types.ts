export interface TickerConfig {
  /**
   * ms
   */
  ticksPer: number;

  abortSignal?: AbortSignal;
}
