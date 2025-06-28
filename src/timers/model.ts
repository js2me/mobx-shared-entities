import { LinkedAbortController } from 'linked-abort-controller';
import { debounce, throttle } from 'lodash-es';
import { action, makeObservable, observable } from 'mobx';
import { generateStackBasedId } from 'yummies/id';

import {
  TimedCallback,
  TimerConfig,
  TimerConfigRaw,
  TimersConfig,
} from './model.types.js';

export class Timers {
  private configsMap: Map<string, TimerConfig>;

  private abortController: AbortController;

  constructor(config?: TimersConfig) {
    this.abortController = new LinkedAbortController(config?.abortSignal);

    this.abortController.signal.addEventListener('abort', () => {
      this.configsMap.forEach((config) => {
        config.timedFn?.cancel();
      });
      this.configsMap.clear();
    });

    this.configsMap = observable.map([], { deep: false });

    makeObservable(this);
  }

  /**
   * Это поле означает что все таймеры были либо завершены, либо удалены
   */
  get isEmpty() {
    return this.configsMap.size === 0;
  }

  /**
   * Запускает таймер, который выполнится через {timeout}
   * в случае если этот метод будет вызван повторно, то предыдущий таймер будет перезапущен
   * с новой fn функцией
   */
  throttled = (fn: TimedCallback, scheduleConfigRaw?: TimerConfigRaw) => {
    const cfg = this.getTimerConfig(fn, 'throttle', scheduleConfigRaw);

    if (!this.configsMap.has(cfg.id)) {
      this.configsMap.set(cfg.id, cfg);
    }

    if (!cfg.timedFn) {
      cfg.timedFn = throttle(
        action(() => {
          let runAgainCalled = false;

          const result = this.configsMap.get(cfg.id)?.fn({
            runAgain: () => {
              runAgainCalled = true;
              return this.throttled(fn, { ...cfg, id: cfg.id });
            },
          });

          if (!runAgainCalled) {
            this.configsMap.delete(cfg.id);
          }

          return result;
        }),
        cfg.timeout,
        cfg,
      );
    }

    cfg.timedFn();
  };

  /**
   * Запускает таймер, который выполнится через {timeout}
   * в случае если этот метод будет вызван повторно, то предыдущий таймер будет очищен и перезапущен снова
   * с новой fn функцией
   */
  debounced = (fn: TimedCallback, scheduleConfigRaw?: TimerConfigRaw) => {
    const cfg = this.getTimerConfig(fn, 'debounce', scheduleConfigRaw);

    if (!this.configsMap.has(cfg.id)) {
      this.configsMap.set(cfg.id, cfg);
    }

    if (!cfg.timedFn) {
      cfg.timedFn = debounce(
        action(() => {
          let runAgainCalled = false;

          const result = this.configsMap.get(cfg.id)?.fn({
            runAgain: () => {
              runAgainCalled = true;
              return this.debounced(fn, { ...cfg, id: cfg.id });
            },
          });

          if (!runAgainCalled) {
            this.configsMap.delete(cfg.id);
          }

          return result;
        }),
        cfg.timeout,
        cfg,
      );
    }

    cfg.timedFn();
  };

  private getTimerConfig(
    fn: TimedCallback,
    type: TimerConfig['type'],
    configRaw?: TimerConfigRaw,
  ): TimerConfig {
    const rawCfg =
      typeof configRaw === 'number' ? { timeout: configRaw } : configRaw;

    const id = rawCfg?.id ?? type + generateStackBasedId();

    if (this.configsMap.has(id)) {
      const cfg = this.configsMap.get(id)!;
      cfg.fn = fn;
      cfg.timeout = rawCfg?.timeout ?? cfg.timeout ?? 0;
      cfg.leading = rawCfg?.leading ?? cfg.leading;
      cfg.trailing = rawCfg?.trailing ?? cfg.trailing;
      return cfg;
    }

    return {
      id,
      timeout: rawCfg?.timeout ?? 0,
      type,
      fn,
      timedFn: null,
    };
  }

  destroyTimer(id: string) {
    this.configsMap.get(id)?.timedFn?.cancel();
    this.configsMap.delete(id);
  }

  clean() {
    this.abortController.abort();
    this.configsMap.forEach((config) => {
      config.timedFn?.cancel();
    });
  }
}

export const createTimers = (config?: TimersConfig) => new Timers(config);
