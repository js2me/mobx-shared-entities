import { IDisposer } from 'disposer-util';
import { Maybe, MaybeFn } from 'yummies/utils/types';

export type TabManagerItem = { id: string | number | boolean };

export interface TabManagerConfig<T extends TabManagerItem> {
  tabs: MaybeFn<Maybe<T[]>>;
  /**
   * @deprecated please use {abortSignal} instead
   */
  disposer?: IDisposer;
  abortSignal?: AbortSignal;
  fallbackTab: T['id'];
  getActiveTab?: () => T['id'] | null | undefined;
  onChangeActiveTab?: (activeTab: T['id']) => void;
}
