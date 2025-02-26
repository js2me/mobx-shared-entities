import { LinkedAbortController } from 'linked-abort-controller';
import { debounce, throttle } from 'lodash-es';
import { makeObservable, observable } from 'mobx';
import { generateStackBasedId } from 'yummies/id';

import { TimerConfig, TimerConfigRaw } from './timers.types';

export class Timers {
  private timedFnsMap: Map<
    string,
    ReturnType<typeof throttle | typeof debounce>
  >;

  private abortController: AbortController;

  constructor(config?: { abortSignal?: AbortSignal }) {
    this.abortController = new LinkedAbortController(config?.abortSignal);

    this.abortController.signal.addEventListener('abort', () => {
      this.timedFnsMap.forEach((schedulerFn) => {
        schedulerFn.cancel();
      });
      this.timedFnsMap.clear();
    });

    this.timedFnsMap = observable.map([], { deep: false });

    makeObservable(this);
  }

  /**
   * Это поле означает что все таймеры были либо завершены, либо удалены
   */
  get isEmpty() {
    return this.timedFnsMap.size === 0;
  }

  /**
   * Запускает таймер, который выполнится через {timeout}
   * в случае если этот метод будет вызван повторно, то предыдущий таймер будет перезапущен
   * с новой fn функцией
   */
  throttled = (
    fn: VoidFunction,
    scheduleConfigRaw?: Omit<TimerConfigRaw, 'type'>,
  ) => {
    const cfg = this.createTimerConfig({
      ...scheduleConfigRaw,
      type: 'throttle',
    });

    let timedFn = this.timedFnsMap.get(cfg.id);

    if (!timedFn) {
      timedFn = throttle(fn, cfg.timeout, cfg);
      this.timedFnsMap.set(cfg.id, timedFn);
    }

    timedFn();
  };

  /**
   * Запускает таймер, который выполнится через {timeout}
   * в случае если этот метод будет вызван повторно, то предыдущий таймер будет очищен и перезапущен снова
   * с новой fn функцией
   */
  debounced = (
    fn: VoidFunction,
    scheduleConfigRaw?: Omit<TimerConfigRaw, 'type'>,
  ) => {
    const cfg = this.createTimerConfig({
      ...scheduleConfigRaw,
      type: 'debounce',
    });

    let timedFn = this.timedFnsMap.get(cfg.id);

    if (timedFn) {
      timedFn.cancel();
      this.timedFnsMap.delete(cfg.id);
    }

    timedFn = debounce(fn, cfg.timeout, cfg);

    this.timedFnsMap.set(cfg.id, timedFn);

    timedFn();
  };

  private createTimerConfig(configRaw?: TimerConfigRaw): TimerConfig {
    const rawCfg =
      typeof configRaw === 'number' ? { timeout: configRaw } : configRaw;

    return {
      id: rawCfg?.id ?? generateStackBasedId(),
      timeout: rawCfg?.timeout ?? 0,
      type: rawCfg?.type ?? 'debounce',
    };
  }
}
