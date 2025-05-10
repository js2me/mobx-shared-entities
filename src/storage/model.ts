import { LinkedAbortController } from 'linked-abort-controller';
import { autorun, makeObservable, runInAction } from 'mobx';

import {
  type StorageModelConfig,
  type GetFromStorageParams,
  type SetToStorageParams,
  type SyncWithStorageParams,
} from './model.types.js';

export class StorageModel {
  protected abortController: AbortController;
  protected abortSignal: AbortSignal;

  constructor(protected config?: StorageModelConfig) {
    this.abortController = new LinkedAbortController(config?.abortSignal);
    this.abortSignal = this.abortController.signal;

    makeObservable(this);
  }

  protected getStorage(
    params: Pick<GetFromStorageParams<any> | SetToStorageParams<any>, 'type'>,
  ): Storage {
    const type = params.type ?? this.config?.type;

    if (type === 'session') {
      return globalThis.sessionStorage;
    }

    return globalThis.localStorage;
  }

  protected createKey(
    params: GetFromStorageParams<any> | SetToStorageParams<any>,
  ): string {
    if (this.config?.createKey) {
      return this.config.createKey(params);
    }

    const prefix = params.prefix ?? this.config?.prefix ?? '';
    const namespace = params.namespace ?? this.config?.namespace;
    const key = params.key;

    return `${prefix ? `${prefix}/` : ''}${namespace ? `${namespace}/` : ''}${key}`;
  }

  get<TValue>(config: GetFromStorageParams<TValue>): TValue | null {
    const key = this.createKey(config);
    const storage = this.getStorage(config);

    const rawValue = storage.getItem(key);

    let value: TValue | null = null;

    if (typeof rawValue === 'string') {
      try {
        const parsed = JSON.parse(rawValue);
        value = parsed;
      } catch {
        value = null;
      }
    } else {
      value = rawValue as TValue;
    }

    return value ?? config.fallback ?? null;
  }

  protected formatValue(value: any): string {
    return JSON.stringify(value);
  }

  set<TValue>(config: SetToStorageParams<TValue>): void {
    const key = this.createKey(config);
    const storage = this.getStorage(config);
    storage.setItem(
      key,
      config.format
        ? config.format(config.value)
        : this.formatValue(config.value),
    );
  }

  syncProperty<
    TContext extends Record<string, any>,
    TProperty extends keyof TContext,
  >(
    context: TContext,
    property: TProperty,
    params?: SyncWithStorageParams<TContext[TProperty]>,
  ): VoidFunction {
    const storageKey = params?.key ?? (property as string);

    const fallback =
      params && 'fallback' in params ? params.fallback : context[property];

    runInAction(() => {
      context[property] =
        this.get<TContext[TProperty]>({
          ...params,
          key: storageKey,
          fallback,
        }) ?? context[property];
    });

    const disposer = autorun(
      () => {
        const newValue = context[property];
        this.set({
          ...params,
          key: storageKey,
          value: newValue,
        });
      },
      {
        signal: this.abortSignal,
      },
    );

    this.abortSignal.addEventListener('abort', disposer);

    return () => {
      this.abortSignal.removeEventListener('abort', disposer);
      disposer();
    };
  }

  /**
   * Reset model
   * Do not clean storages
   */
  destroy() {
    this.abortController.abort();
  }
}

/*#__PURE__*/
export const createStorageModel = (config?: StorageModelConfig) =>
  new StorageModel(config);
