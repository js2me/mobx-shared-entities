import { IDisposer } from 'disposer-util';

export type TabManagerItem = { id: string | number | boolean };

export interface TabManagerConfig<T extends TabManagerItem> {
  tabs: T[] | (() => T[]);
  disposer?: IDisposer;
  fallbackTab: T['id'];
  getActiveTab?: () => T['id'] | null | undefined;
  onChangeActiveTab?: (activeTab: T['id']) => void;
}
