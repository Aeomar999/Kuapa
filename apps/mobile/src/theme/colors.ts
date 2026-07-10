// Canonical agro palette — mirrors the primitive scales in global.css.
// Brand = Leaf Green (#15803d @ 700), Accent = Harvest Orange (#f97316 @ 500).
export const colors = {
  brand: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e",
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
    900: "#14532d",
    950: "#052e16",
  },
  accent: {
    50: "#fff7ed",
    100: "#ffedd5",
    200: "#fed7aa",
    300: "#fdba74",
    400: "#fb923c",
    500: "#f97316",
    600: "#ea580c",
    700: "#c2410c",
    800: "#9a3412",
    900: "#7c2d12",
    950: "#431407",
  },
  surface: {
    50: "#FAFAF9",
    100: "#F5F5F4",
    200: "#E7E5E4",
    300: "#D6D3D1",
    400: "#A8A29E",
    500: "#78716C",
    600: "#57534E",
    700: "#44403C",
    800: "#292524",
    900: "#1C1917",
    950: "#0C0A09",
  },
  success: { DEFAULT: "#00D084", light: "#E6F9F3" },
  error: { DEFAULT: "#EF4444", light: "#FEF2F2" },
  warning: { DEFAULT: "#F59E0B", light: "#FFFBEB" },
} as const;

export type ColorKey = keyof typeof colors;
