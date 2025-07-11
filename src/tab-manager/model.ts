import { Disposable } from 'disposer-util';
import { LinkedAbortController } from 'linked-abort-controller';
import {
  action,
  makeObservable,
  observable,
  reaction,
  runInAction,
} from 'mobx';
import { callFunction } from 'yummies/common';

import { TabManagerConfig, TabManagerItem } from './model.types.js';

export class TabManager<T extends TabManagerItem> implements Disposable {
  private abortController: AbortController;

  private syncedActiveTab!: T['id'];

  tabs!: T[];

  protected tabIndexesMap!: Map<T['id'], number>;

  constructor(private config: TabManagerConfig<T>) {
    this.abortController = new LinkedAbortController(config.abortSignal);

    // eslint-disable-next-line sonarjs/deprecation
    if (config.disposer) {
      // eslint-disable-next-line sonarjs/deprecation
      config.disposer.add(() => {
        this.abortController.abort();
      });
    }

    observable.ref(this, 'syncedActiveTab');
    action(this, 'setTabs');
    observable.ref(this, 'tabs');
    observable.ref(this, 'tabIndexesMap');

    makeObservable(this);

    reaction(
      () => callFunction(this.config.tabs),
      (tabs) => this.setTabs(tabs ?? []),
      { signal: this.abortController.signal, fireImmediately: true },
    );
  }

  setTabs = (tabs: T[]) => {
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

  /**
   * @deprecated use {`destroy()`}
   */
  dispose() {
    this.destroy();
  }

  destroy() {
    this.abortController.abort();
  }
}

export const createTabManager = <T extends TabManagerItem>(
  config: TabManagerConfig<T>,
) => new TabManager(config);
