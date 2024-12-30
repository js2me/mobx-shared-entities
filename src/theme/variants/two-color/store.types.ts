export type ColorScheme = 'dark' | 'light';

export type Theme = ColorScheme | 'auto';

export interface TwoColorThemeStoreConfig {
  abortSignal?: AbortSignal;
  /**
   * false - meaning do not store theme in localStorage
   * string - local storage key
   * @default 'theme'
   */
  localStorageKey?: string | false;
  fallbackTheme?: Theme;
}
