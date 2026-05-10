import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';
 
// Only NAV_THEME is used externally — THEME was defined but never imported.
export const NAV_THEME = {
  light: {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background:   "hsl(340 60% 98%)",
      border:       "hsl(340 30% 88%)",
      card:         "hsl(0 0% 100%)",
      notification: "hsl(340 50% 70%)",
      primary:      "hsl(217 87% 15%)",
      text:         "hsl(217 87% 15%)",
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background:   "hsl(217 87% 8%)",
      border:       "hsl(217 40% 20%)",
      card:         "hsl(217 87% 12%)",
      notification: "hsl(340 50% 60%)",
      primary:      "hsl(340 60% 80%)",
      text:         "hsl(340 60% 95%)",
    },
  },
};