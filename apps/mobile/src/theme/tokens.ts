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
  // Brand / primary
  primary: "#15803d", // brand-700
  primaryHover: "#166534", // brand-800
  primaryActive: "#14532d", // brand-900
  primarySubtle: "#f0fdf4", // brand-50
  primaryText: "#ffffff",

  // Secondary / accent
  secondary: "#f97316", // accent-500
  secondaryHover: "#ea580c", // accent-600
  secondaryText: "#ffffff",

  // Feedback
  success: "#00D084",
  error: "#EF4444",
  warning: "#F59E0B",

  // Surfaces & text
  background: "#FAFAF9", // surface-50
  surface: "#ffffff",
  border: "#E7E5E4", // surface-200
  textPrimary: "#1C1917", // surface-900
  textSecondary: "#57534E", // surface-600
  textMuted: "#A8A29E", // surface-400
  textDisabled: "#D6D3D1", // surface-300
} as const;

export type ColorScheme = "light" | "dark";
export type ThemeColors = { readonly [K in keyof typeof lightTokens]: string };

export const darkTokens: ThemeColors = {
  // Brand / primary — lighter brand steps for contrast on dark surfaces
  primary: "#4ade80", // brand-400
  primaryHover: "#86efac", // brand-300
  primaryActive: "#bbf7d0", // brand-200
  primarySubtle: "#14532d", // brand-900
  primaryText: "#ffffff",

  // Secondary / accent
  secondary: "#fb923c", // accent-400
  secondaryHover: "#fdba74", // accent-300
  secondaryText: "#ffffff",

  // Feedback — read fine on dark, unchanged
  success: "#00D084",
  error: "#EF4444",
  warning: "#F59E0B",

  // Surfaces & text — inverted scale
  background: "#0C0A09", // surface-950
  surface: "#1C1917", // surface-900
  border: "#44403C", // surface-700
  textPrimary: "#FAFAF9", // surface-50
  textSecondary: "#D6D3D1", // surface-300
  textMuted: "#78716C", // surface-500
  textDisabled: "#57534E", // surface-600
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
