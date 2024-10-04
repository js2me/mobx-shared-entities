import { IDisposer } from 'disposer-util';

export interface MobxTabManagerConfig<T extends { id: string }> {
  tabs: T[] | (() => T[]);
  disposer?: IDisposer;
  fallbackTab: T['id'];
  getActiveTab?: () => T['id'] | null | undefined;
  onChangeActiveTab?: (activeTab: T['id']) => void;
}

export type MobxTabManagerItem = { id: string };
