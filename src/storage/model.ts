import {
  GetFromStorageParams,
  SetToStorageParams,
  SyncWithStorageParams,
} from './model.types';

export interface StorageModel {
  get<TValue>(config: GetFromStorageParams<TValue>): TValue | null;

  set<TValue>(config: SetToStorageParams<TValue>): void;

  syncProperty<
    TContext extends Record<string, any>,
    TProperty extends keyof TContext,
  >(
    context: TContext,
    property: TProperty,
    params?: SyncWithStorageParams<TContext[TProperty]>,
  ): VoidFunction;

  /**
   * Reset model
   * Do not clean storages
   */
  destroy(): void;
}
