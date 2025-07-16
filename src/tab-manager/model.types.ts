import { IDisposer } from 'disposer-util';
import { Maybe, MaybeFn } from 'yummies/utils/types';

export type TabManagerItem = { id: string | number | boolean };

export interface TabManagerConfig<
  TItem extends TabManagerItem | Readonly<TabManagerItem>,
> {
  tabs: MaybeFn<Maybe<ReadonlyArray<TItem> | Array<TItem>>>;
  /**
   * @deprecated please use {abortSignal} instead
   */
  disposer?: IDisposer;
  abortSignal?: AbortSignal;
  fallbackTab: NoInfer<TItem>['id'];
  getActiveTab?: () => NoInfer<TItem>['id'] | null | undefined;
  onChangeActiveTab?: (
    nextActiveTab: NoInfer<TItem>['id'],
    currentActiveTabData: TItem,
  ) => void;
}
