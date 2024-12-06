import { Disposable } from 'disposer-util';
import { LinkedAbortController } from 'linked-abort-controller';
import { action, autorun, makeObservable, observable, runInAction } from 'mobx';

import { TabManagerConfig, TabManagerItem } from './model.types';

export class TabManager<T extends TabManagerItem> implements Disposable {
  private abortController: AbortController;

  private syncedActiveTab!: T['id'];

  tabs!: T[];
  tabsMap!: Map<T['id'], T>;

  constructor(private config: TabManagerConfig<T>) {
    this.abortController = new LinkedAbortController(config.abortSignal);

    // eslint-disable-next-line sonarjs/deprecation
    if (config.disposer) {
      // eslint-disable-next-line sonarjs/deprecation
      config.disposer.add(() => {
        this.abortController.abort();
      });
    }

    this.setTabs(this.getTabs());

    observable.ref(this, 'syncedActiveTab');
    action(this, 'setTabs');
    observable.ref(this, 'tabs');

    makeObservable(this);

    if (typeof this.config.tabs === 'function') {
      autorun(
        () => {
          this.setTabs(this.getTabs());
        },
        {
          signal: this.abortController.signal,
        },
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
    this.abortController.abort();
  }
}
