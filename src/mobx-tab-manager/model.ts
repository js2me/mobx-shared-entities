import { Disposable, Disposer, IDisposer } from 'disposer-util';
import {
  autorun,
  computed,
  makeObservable,
  observable,
  runInAction,
} from 'mobx';

import { MobxTabManagerConfig, MobxTabManagerItem } from './model.types';

export class MobxTabManager<T extends MobxTabManagerItem>
  implements Disposable
{
  private disposer: IDisposer;

  private syncedActiveTab!: T['id'];

  tabs: T[];

  constructor(private config: MobxTabManagerConfig<T>) {
    this.disposer = config.disposer ?? new Disposer();
    this.tabs = this.getTabs();

    makeObservable<this, 'syncedActiveTab' | 'tabsMap'>(this, {
      syncedActiveTab: observable.ref,
      tabsMap: computed,
      tabs: observable.ref,
    });

    if (typeof this.config.tabs === 'function') {
      this.disposer.add(
        autorun(() => {
          const tabs = this.getTabs();

          runInAction(() => {
            this.tabs = tabs;
          });
        }),
      );
    }
  }
  private get tabsMap() {
    return this.tabs.reduce<Record<T['id'], T>>(
      (acc, tab) => {
        const tabId = tab.id as any as T['id'];
        acc[tabId] = tab;
        return acc;
      },
      {} as Record<T['id'], T>,
    );
  }

  private getTabs = () => {
    if (typeof this.config.tabs === 'function') {
      return this.config.tabs();
    }
    return this.config.tabs;
  };

  getTabData = (tabId: T['id']): T => {
    return this.tabsMap[tabId];
  };

  get activeTab() {
    const tabId = this.config.getActiveTab
      ? this.config.getActiveTab()
      : this.syncedActiveTab;

    const activeTabId = tabId ?? this.config.fallbackTab;

    const tabData = this.getTabData(activeTabId);

    if (!tabData) {
      return this.config.fallbackTab;
    }

    return activeTabId;
  }

  get activeTabData() {
    return this.getTabData(this.activeTab);
  }

  setActiveTab = (activeTabId: T['id']) => {
    if (this.config.getActiveTab && this.config.onChangeActiveTab) {
      this.config.onChangeActiveTab(activeTabId);
    } else {
      runInAction(() => {
        this.syncedActiveTab = activeTabId;
      });
    }
  };

  dispose() {
    this.disposer.dispose();
  }
}
