import { IDisposer } from 'disposer-util';

export type TabManagerItem = { id: string | number | boolean };

export interface TabManagerConfig<T extends TabManagerItem> {
  tabs: T[] | (() => T[]);
  /**
   * @deprecated please use {abortSignal} instead
   */
  disposer?: IDisposer;
  abortSignal?: AbortSignal;
  fallbackTab: T['id'];
  getActiveTab?: () => T['id'] | null | undefined;
  onChangeActiveTab?: (activeTab: T['id']) => void;
}
