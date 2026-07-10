/**
 * Resolved hex values for the semantic design tokens defined in `global.css`.
 *
 * Why this file exists:
 * NativeWind only resolves CSS custom properties (`var(--…)`) inside `className`
 * strings. When a `var(--…)` is passed to a React Native JS prop — `color=`,
 * `style={{ backgroundColor }}`, `ActivityIndicator color`, icon `color`, etc. —
 * React Native's color parser cannot understand it and the color silently falls
 * back to the platform default. Always import these values for prop-level
 * colors; keep `var(--…)` for `className` only.
 *
 * Dark mode:
 * `lightTokens` and `darkTokens` mirror the `:root` and `.dark` blocks in
 * `global.css` respectively — one palette, two consumers (CSS vars for classes,
 * these hexes for JS props). Components that need prop-level colors should read
 * the active palette via `useThemeColors()` rather than importing a static set.
 * `tokens` remains as a light-only alias for not-yet-migrated call sites.
 */

export const lightTokens = {
  // Brand / primary (Kuapa Green 800)
  primary: "#0B5233",
  primaryHover: "#09442a",
  primaryActive: "#073B24",
  primarySubtle: "#f2faf6",
  primaryText: "#ffffff",

  // Secondary / accent (Harvest Gold)
  secondary: "#F2A81D",
  secondaryHover: "#d98f12",
  secondaryText: "#142019",

  // Feedback
  success: "#00D084",
  error: "#EF4444",
  warning: "#F59E0B",

  // Surfaces & text (Kuapa Cream & Ink)
  background: "#FDFBF7",
  surface: "#ffffff",
  border: "#EBE5D8",
  textPrimary: "#142019",
  textSecondary: "#554F43",
  textMuted: "#A8A090",
  textDisabled: "#D8D0BF",
} as const;

export type ColorScheme = "light" | "dark";
export type ThemeColors = { readonly [K in keyof typeof lightTokens]: string };

export const darkTokens: ThemeColors = {
  // Brand / primary — lighter Kuapa steps for contrast on dark surfaces
  primary: "#1E9960",
  primaryHover: "#4abb84",
  primaryActive: "#BFE6CD",
  primarySubtle: "#073B24",
  primaryText: "#ffffff",

  // Secondary / accent
  secondary: "#fbbf24",
  secondaryHover: "#fcd34d",
  secondaryText: "#142019",

  // Feedback
  success: "#00D084",
  error: "#EF4444",
  warning: "#F59E0B",

  // Surfaces & text — Kuapa Ink dark container
  background: "#0A110D",
  surface: "#142019",
  border: "#3A352C",
  textPrimary: "#F8F4EA",
  textSecondary: "#D8D0BF",
  textMuted: "#787062",
  textDisabled: "#554F43",
};

/** Return the resolved palette for a concrete scheme (non-React callers). */
export function getThemeColors(scheme: ColorScheme): ThemeColors {
  return scheme === "dark" ? darkTokens : lightTokens;
}

/**
 * Backward-compatible alias. Existing `import { tokens }` call sites keep the
 * light palette until they migrate to `useThemeColors()`. Prefer the hook for
 * any new code so colors react to the active scheme.
 */
export const tokens = lightTokens;

export type TokenKey = keyof typeof lightTokens;
