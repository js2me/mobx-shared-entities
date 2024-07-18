import { action, observable, reaction } from 'mobx';
import { Disposer, Disposable } from 'mobx-disposer-util';

import { MobxTickerConfig } from './model.types';

export class MobxTicker implements Disposable {
  private disposer = new Disposer();
  private intervalId: number | null;

  @observable
  accessor ticks: number = 0;

  @observable
  accessor ticksPer: number;

  constructor(config: MobxTickerConfig) {
    this.ticksPer = config.ticksPer;
    this.intervalId = null;

    this.disposer.add(reaction(() => this.ticksPer, this.start));
  }

  @action.bound
  private tick() {
    this.ticks++;
  }

  @action.bound
  start() {
    this.reset();
    this.intervalId = setInterval(this.tick, this.ticksPer);
  }

  @action.bound
  stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
    }
    this.intervalId = null;
  }

  @action.bound
  reset() {
    this.stop();
    this.ticks = 0;
  }

  dispose() {
    this.reset();
    this.disposer.dispose();
  }
}
