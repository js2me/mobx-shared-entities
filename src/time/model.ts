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
import { callFunction } from 'yummies/common';

import { TimeConfig } from './model.types.js';

export class Time<TValue = Date> {
  protected abortController: AbortController;
  protected atom: IAtom;
  protected updatePer: number;
  protected intervalId?: ReturnType<typeof setInterval>;

  constructor(protected config?: TimeConfig<TValue>) {
    this.abortController = new LinkedAbortController(config?.abortSignal);
    this.updatePer = callFunction(config?.updatePer ?? 1000);
    this.atom = createAtom(
      'timeAtom',
      () => this.startInterval(this.updatePer),
      () => this.stopInterval(),
    );

    computed.struct(this, 'value');
    observable.ref(this, 'updatePer');
    makeObservable(this);

    if (typeof config?.updatePer === 'function') {
      reaction(
        config.updatePer,
        (updatePer) => {
          runInAction(() => {
            this.updatePer = updatePer;
          });
          if (this.intervalId != null) {
            this.stopInterval();
            this.startInterval(updatePer);
          }
        },
        {
          signal: this.abortController.signal,
        },
      );
    }
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
    this.stopInterval();
  }

  protected stopInterval() {
    clearInterval(this.intervalId);
    this.intervalId = undefined;
  }

  protected startInterval(timeout: number) {
    runInAction(() => {
      this.updatePer = timeout;
    });
    this.intervalId = setInterval(() => this.atom.reportChanged(), timeout);
  }
}

/*#__PURE__*/
export const createTime = <TValue = Date>(config?: TimeConfig<TValue>) =>
  new Time(config);
