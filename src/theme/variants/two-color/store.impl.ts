import { LinkedAbortController } from 'linked-abort-controller';
import { action, computed, makeObservable, observable } from 'mobx';

import { TwoColorThemeStore } from './store';
import { ColorScheme, Theme, TwoColorThemeStoreConfig } from './store.types';

export class TwoColorThemeStoreImpl implements TwoColorThemeStore {
  protected abortController: AbortController;
  protected abortSignal: AbortSignal;

  theme: Theme;
  mediaColorScheme: ColorScheme;

  constructor(protected config?: TwoColorThemeStoreConfig) {
    this.abortController = new LinkedAbortController(config?.abortSignal);
    this.abortSignal = this.abortController.signal;

    if (config?.localStorageKey === false) {
      this.theme = this.getFallbackTheme();
    } else {
      this.theme = this.getCachedTheme();
    }

    this.mediaColorScheme = this.getMediaColorScheme();

    observable.ref(this, 'theme');
    observable.ref(this, 'mediaColorScheme');
    computed(this, 'colorScheme');
    action.bound(this, 'updateMediaColorSchema');
    action.bound(this, 'setTheme');
    action.bound(this, 'switchTheme');

    makeObservable(this);

    globalThis
      .matchMedia?.('(prefers-color-scheme: dark)')
      ?.addEventListener('change', this.updateMediaColorSchema, {
        signal: this.abortSignal,
      });
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

  protected getCachedTheme(): Theme {
    return (
      (globalThis.localStorage.getItem(this.getCacheKey()) as Theme | null) ??
      this.getFallbackTheme()
    );
  }

  protected updateMediaColorSchema() {
    this.mediaColorScheme = this.getMediaColorScheme();
  }

  setTheme(theme: Theme) {
    if (this.theme === theme) {
      return;
    }

    this.theme = theme;
    if (this.config?.localStorageKey !== false) {
      localStorage.setItem(this.getCacheKey(), theme);
    }
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

  clean() {
    this.abortController.abort();
  }
}