import { Platform } from "react-native";

/**
 * Jetons de couleur GestionPro — mêmes noms que les tokens web
 * (packages/web/src/web/styles.css) : bleu nuit dominant, accent émeraude,
 * ocre pour les alertes de stock. Voir design.md.
 */
export const Colors = {
  light: {
    background: "#F6F8FB",
    foreground: "#0B2A4A",
    card: "#FFFFFF",
    cardForeground: "#0B2A4A",
    primary: "#0B2A4A",
    primaryForeground: "#FFFFFF",
    secondary: "#E8EEF6",
    secondaryForeground: "#0B2A4A",
    muted: "#EDF1F7",
    mutedForeground: "#5B6B80",
    accent: "#0E9F6E",
    accentForeground: "#FFFFFF",
    border: "#DCE4EE",
    destructive: "#DC2626",
    success: "#0E9F6E",
    warning: "#D97706",
  },
  dark: {
    background: "#071B2F",
    foreground: "#EAF1F8",
    card: "#0D2740",
    cardForeground: "#EAF1F8",
    primary: "#3D8FD1",
    primaryForeground: "#04121F",
    secondary: "#123253",
    secondaryForeground: "#EAF1F8",
    muted: "#102C49",
    mutedForeground: "#9DB2C7",
    accent: "#2BC48E",
    accentForeground: "#04121F",
    border: "#1B3E61",
    destructive: "#F87171",
    success: "#2BC48E",
    warning: "#F59E0B",
  },
} as const;

export type ColorScheme = keyof typeof Colors;
export type ThemeColors = (typeof Colors)[ColorScheme];

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "'Public Sans', system-ui, -apple-system, 'Segoe UI', sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'Plus Jakarta Sans', system-ui, sans-serif",
    mono: "'SF Mono', 'Roboto Mono', monospace",
  },
});
