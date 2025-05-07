import { LinkedAbortController } from 'linked-abort-controller';
import {
  computed,
  createAtom,
  IAtom,
  makeObservable,
  observable,
  reaction,
  runInAction,
} from 'mobx';
import { resolveFnValue } from 'yummies/common';

import { TimeConfig } from './model.types.js';

export class Time<TValue = Date> {
  protected abortController: AbortController;
  protected atom: IAtom;
  protected updatePer: number;
  protected intervalId: number;

  constructor(protected config?: TimeConfig<TValue>) {
    this.atom = createAtom('');
    this.abortController = new LinkedAbortController(config?.abortSignal);
    this.updatePer = resolveFnValue(config?.updatePer ?? 1000);

    computed.struct(this, 'now');
    observable.ref(this, 'updatePer');
    makeObservable(this);

    if (typeof config?.updatePer === 'function') {
      reaction(
        config.updatePer,
        (updatePer) => {
          clearTimeout(this.intervalId);
          runInAction(() => {
            this.updatePer = updatePer;
          });
          this.intervalId = setInterval(
            () => this.atom.reportChanged(),
            updatePer,
          );
        },
        {
          signal: this.abortController.signal,
        },
      );
    }

    this.intervalId = setInterval(
      () => this.atom.reportChanged(),
      this.updatePer,
    );
  }

  get ms() {
    this.atom.reportObserved();
    return Date.now();
  }

  get date() {
    return new Date(this.ms);
  }

  get value() {
    if (this.config?.map) {
      return this.config.map(this.date);
    }

    return this.date as TValue;
  }

  destroy() {
    this.abortController.abort();
    clearInterval(this.intervalId);
  }
}
