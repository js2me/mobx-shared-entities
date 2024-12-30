export type StorageType = 'local' | 'session';

export interface StorageModelConfig {
  abortSignal?: AbortSignal;
  prefix?: string;
  namespace?: string;
  type?: StorageType;
  createKey?: (
    params: GetFromStorageParams<any> | SetToStorageParams<any>,
  ) => string;
}

export interface GetFromStorageParams<TValue = any> {
  prefix?: string;
  key: string;
  namespace?: string;
  fallback?: TValue;
  type?: StorageType;
}

export interface SetToStorageParams<TValue = any>
  extends Omit<GetFromStorageParams<TValue>, 'fallback'> {
  value: TValue;
  format?: (value: TValue) => string;
}

export interface SyncWithStorageParams<TValue = any>
  extends Omit<GetFromStorageParams<TValue>, 'key'> {
  key?: GetFromStorageParams<TValue>['key'];
}
