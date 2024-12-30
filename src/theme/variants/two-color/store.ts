import { ColorScheme, Theme } from './store.types';

export interface TwoColorThemeStore {
  theme: Theme;
  mediaColorScheme: ColorScheme;
  colorScheme: ColorScheme;
  setTheme(theme: Theme): void;
  switchTheme(): void;
  clean(): void;
}
