import { LinkedAbortController } from 'linked-abort-controller';
import { makeObservable, reaction } from 'mobx';

import { StorageModel } from './model';
import {
  StorageModelConfig,
  GetFromStorageParams,
  SetToStorageParams,
  SyncWithStorageParams,
} from './model.types';

export class StorageModelImpl implements StorageModel {
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

    const prefix = params.prefix ?? this.config?.prefix;
    const namespace = params.namespace ?? this.config?.namespace;
    const key = params.key;

    return `${prefix}${namespace ? `/${namespace}` : ''}/${key}`;
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

  set<TValue>(config: SetToStorageParams<TValue>): void {
    const key = this.createKey(config);
    const storage = this.getStorage(config);

    storage.setItem(key, JSON.stringify(config.value));
  }

  syncProperty<
    TContext extends Record<string, any>,
    TProperty extends keyof TContext,
  >(
    context: TContext,
    property: TProperty,
    params?: SyncWithStorageParams<TContext[TProperty]>,
  ): void {
    context[property] =
      this.get<TContext[TProperty]>({
        ...params,
        key: params?.key ?? (property as string),
      }) ?? context[property];

    reaction(
      () => context[property],
      (value) => {
        this.set({
          ...params,
          key: params?.key ?? (property as string),
          value,
        });
      },
      {
        signal: this.abortSignal,
      },
    );
  }

  clean() {
    this.abortController.abort();
  }
}