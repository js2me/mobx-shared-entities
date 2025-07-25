import { LinkedAbortController } from 'linked-abort-controller';
import { action, makeObservable, observable, reaction } from 'mobx';

import { TickerConfig } from './model.types.js';

export class Ticker {
  private abortController: AbortController;
  private intervalId: ReturnType<typeof setInterval> | null;

  ticks: number = 0;

  ticksPer: number;

  isRunning = false;

  constructor(config: TickerConfig) {
    this.abortController = new LinkedAbortController(config.abortSignal);

    this.ticksPer = config.ticksPer;
    this.intervalId = null;

    observable(this, 'ticks');
    observable(this, 'ticksPer');
    observable(this, 'isTicking');
    action.bound(this, 'tick');
    action.bound(this, 'start');
    action.bound(this, 'stop');
    action.bound(this, 'reset');

    makeObservable(this);

    reaction(() => this.ticksPer, this.start, {
      signal: this.abortController.signal,
    });
  }

  private tick() {
    this.ticks++;
  }

  start() {
    this.reset();
    this.isRunning = true;
    this.intervalId = setInterval(this.tick, this.ticksPer);
  }

  stop() {
    this.isRunning = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
    }
    this.intervalId = null;
  }

  reset() {
    this.stop();
    this.ticks = 0;
  }

  destroy() {
    this.reset();
    this.abortController.abort();
  }
}

export const createTicker = (config: TickerConfig) => new Ticker(config);
