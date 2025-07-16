import { LinkedAbortController } from 'linked-abort-controller';
import {
  action,
  computed,
  makeObservable,
  observable,
  reaction,
  runInAction,
} from 'mobx';
import { callFunction } from 'yummies/common';

import { TabManagerConfig, TabManagerItem } from './model.types.js';

export class TabManager<T extends TabManagerItem | Readonly<TabManagerItem>> {
  private abortController: AbortController;

  /**
   * This is needed ONLY WHEN `getActiveTab` IS NOT SET
   */
  private localActiveTab!: T['id'];

  tabs!: ReadonlyArray<T> | Array<T>;

  protected tabIndexesMap!: Map<T['id'], number>;

  constructor(private config: TabManagerConfig<T>) {
    this.abortController = new LinkedAbortController(config.abortSignal);

    observable.ref(this, 'syncedActiveTab');
    action(this, 'setTabs');
    computed.struct(this, 'activeTab');
    computed.struct(this, 'activeTabData');
    observable.ref(this, 'tabs');
    observable.ref(this, 'tabIndexesMap');

    makeObservable(this);

    reaction(
      () => callFunction(this.config.tabs),
      (tabs) => this.setTabs(tabs ?? []),
      { signal: this.abortController.signal, fireImmediately: true },
    );
  }

  setTabs = (tabs: Array<T> | ReadonlyArray<T>) => {
    this.tabs = tabs;
    this.tabIndexesMap = new Map(this.tabs.map((tab, i) => [tab.id, i]));
  };

  getTabData = (tabId: T['id']): T => {
    const index = this.tabIndexesMap.get(tabId)!;
    return this.tabs[index];
  };

  get activeTab() {
    const tabId = this.config.getActiveTab
      ? this.config.getActiveTab()
      : this.localActiveTab;

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
    if (this.activeTabData.id === activeTabId) {
      return;
    }

    if (this.config.getActiveTab && this.config.onChangeActiveTab) {
      this.config.onChangeActiveTab(activeTabId, this.activeTabData);
    } else {
      runInAction(() => {
        this.localActiveTab = activeTabId;
      });
    }
  };

  destroy() {
    this.abortController.abort();
  }
}

export const createTabManager = <T extends TabManagerItem>(
  config: TabManagerConfig<T>,
) => new TabManager(config);
