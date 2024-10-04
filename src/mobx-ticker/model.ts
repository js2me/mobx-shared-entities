import { Disposer, Disposable, IDisposer } from 'disposer-util';
import { action, makeObservable, observable, reaction } from 'mobx';

import { MobxTickerConfig } from './model.types';

export class MobxTicker implements Disposable {
  private disposer: IDisposer;
  private intervalId: number | null;

  ticks: number = 0;

  ticksPer: number;

  constructor(config: MobxTickerConfig) {
    this.disposer = config.disposer || new Disposer();
    this.ticksPer = config.ticksPer;
    this.intervalId = null;

    makeObservable<this, 'tick'>(this, {
      ticks: observable,
      ticksPer: observable,
      tick: action.bound,
      start: action.bound,
      stop: action.bound,
      reset: action.bound,
    });

    this.disposer.add(reaction(() => this.ticksPer, this.start));
  }

  private tick() {
    this.ticks++;
  }

  start() {
    this.reset();
    this.intervalId = setInterval(this.tick, this.ticksPer);
  }

  stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
    }
    this.intervalId = null;
  }

  reset() {
    this.stop();
    this.ticks = 0;
  }

  dispose() {
    this.reset();
    this.disposer.dispose();
  }
}
