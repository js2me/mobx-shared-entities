import { LinkedAbortController } from 'linked-abort-controller';
import { action, computed, makeObservable, observable, reaction } from 'mobx';

import { StorageModel } from '../../../storage/index.js';

import { ColorScheme, Theme, TwoColorThemeStoreConfig } from './store.types.js';

export class TwoColorThemeStore {
  protected abortController: AbortController;
  protected abortSignal: AbortSignal;
  protected storageModel?: StorageModel;

  theme!: Theme;
  mediaColorScheme: ColorScheme;

  constructor(protected config?: TwoColorThemeStoreConfig) {
    this.abortController = new LinkedAbortController(config?.abortSignal);
    this.abortSignal = this.abortController.signal;

    this.mediaColorScheme = this.getMediaColorScheme();

    observable.ref(this, 'theme');
    observable.ref(this, 'mediaColorScheme');
    computed(this, 'colorScheme');
    action.bound(this, 'updateMediaColorSchema');
    action.bound(this, 'setTheme');
    action.bound(this, 'switchTheme');

    makeObservable(this);

    if (config?.localStorageKey === false) {
      this.theme = this.getFallbackTheme();
    } else {
      this.storageModel = new StorageModel({
        abortSignal: this.abortSignal,
      });

      this.storageModel.syncProperty(this, 'theme', {
        key: this.getCacheKey(),
        fallback: this.getFallbackTheme(),
      });
    }

    globalThis
      .matchMedia?.('(prefers-color-scheme: dark)')
      ?.addEventListener('change', this.updateMediaColorSchema, {
        signal: this.abortSignal,
      });

    if (config?.onChangeTheme) {
      reaction(() => this.theme, config.onChangeTheme, {
        signal: this.abortController.signal,
        fireImmediately: true,
      });
    }

    if (config?.onChangeColorScheme) {
      reaction(() => this.colorScheme, config.onChangeColorScheme, {
        signal: this.abortController.signal,
        fireImmediately: true,
      });
    }
  }

  get colorScheme() {
    return this.theme === 'auto' ? this.mediaColorScheme : this.theme;
  }

  protected getMediaColorScheme(): ColorScheme {
    if (globalThis.matchMedia?.('(prefers-color-scheme: dark)')?.matches) {
      return 'dark';
    }

    return 'light';
  }

  protected getFallbackTheme(): Theme {
    return this.config?.fallbackTheme ?? 'auto';
  }

  protected getCacheKey() {
    if (
      this.config?.localStorageKey == null ||
      this.config?.localStorageKey === false
    ) {
      return 'theme';
    } else {
      return this.config.localStorageKey;
    }
  }

  protected updateMediaColorSchema() {
    this.mediaColorScheme = this.getMediaColorScheme();
  }

  setTheme(theme: Theme) {
    this.theme = theme;
  }

  switchTheme() {
    if (this.theme === 'dark') {
      this.setTheme('auto');
    } else if (this.theme === 'auto') {
      this.setTheme('light');
    } else {
      this.setTheme('dark');
    }
  }

  destroy() {
    this.abortController.abort();
    this.storageModel?.destroy();
  }
}

export const createTwoColorThemeStore = (config?: TwoColorThemeStoreConfig) =>
  new TwoColorThemeStore(config);
