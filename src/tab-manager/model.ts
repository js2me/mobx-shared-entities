import { Disposable, Disposer, IDisposer } from 'disposer-util';
import {
  action,
  autorun,
  computed,
  makeObservable,
  observable,
  runInAction,
} from 'mobx';

import { TabManagerConfig, TabManagerItem } from './model.types';

export class TabManager<T extends TabManagerItem> implements Disposable {
  private disposer: IDisposer;

  private syncedActiveTab!: T['id'];

  tabs!: T[];
  tabsMap!: Map<T['id'], T>;

  constructor(private config: TabManagerConfig<T>) {
    this.disposer = config.disposer ?? new Disposer();

    this.setTabs(this.getTabs());

    makeObservable<this, 'syncedActiveTab' | 'tabsMap'>(this, {
      syncedActiveTab: observable.ref,
      tabsMap: computed,
      setTabs: action,
      tabs: observable.ref,
    });

    if (typeof this.config.tabs === 'function') {
      this.disposer.add(
        autorun(() => {
          this.setTabs(this.getTabs());
        }),
      );
    }
  }

  private getTabs = () => {
    if (typeof this.config.tabs === 'function') {
      return this.config.tabs();
    }
    return this.config.tabs;
  };

  setTabs = (tabs: T[]) => {
    this.tabs = tabs;

    this.tabsMap = observable.map<T['id'], T>(
      this.tabs.map((tab) => [tab.id, tab]),
    );
  };

  getTabData = (tabId: T['id']): T => {
    return this.tabsMap.get(tabId)!;
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
