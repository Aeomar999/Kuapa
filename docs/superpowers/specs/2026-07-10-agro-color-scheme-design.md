# Agro Color Scheme — Design

**Date:** 2026-07-10
**Goal:** The current palette (Bexiemart navy `#06406b` + sky-blue accent + cool slate greys) doesn't read as agro. Replace it across all apps (mobile, admin, server emails) with an agritech palette that fits the Afuomu "Farm to Market" rebrand.

## Approach

Keep the existing token architecture untouched (primitive scales → semantic tokens → components) and swap only the primitive hex values. Every semantic mapping (`--color-primary: var(--brand-700)` etc.) and every dark-mode override stays structurally identical, so contrast relationships carry over automatically.

Alternatives considered:
- **Re-map semantics to new scale names** (e.g. add a `leaf` scale): larger diff, no benefit — the `brand`/`accent`/`surface` names are already semantic-agnostic.
- **Green + lime accent:** too monochrome; success (`#00D084`) would be a third green.
- **Chosen: green + harvest orange:** classic farm-to-market pairing, instantly reads agro, accent stays distinct from warning amber and success mint.

## Palette

| Scale | Old | New | Anchor |
|---|---|---|---|
| `brand` | Navy | **Leaf Green** (Tailwind `green`) | 700 = `#15803d` (primary) |
| `accent` | Sky | **Harvest Orange** (Tailwind `orange`) | 500 = `#f97316` (secondary) |
| `surface` | Cool slate | **Warm Stone** (Tailwind `stone`) | unchanged roles |
| feedback | — | unchanged (`#00D084` / `#EF4444` / `#F59E0B`) | — |

Full scales:

- **brand:** 50 `#f0fdf4`, 100 `#dcfce7`, 200 `#bbf7d0`, 300 `#86efac`, 400 `#4ade80`, 500 `#22c55e`, 600 `#16a34a`, 700 `#15803d`, 800 `#166534`, 900 `#14532d`, 950 `#052e16`
- **accent:** 50 `#fff7ed`, 100 `#ffedd5`, 200 `#fed7aa`, 300 `#fdba74`, 400 `#fb923c`, 500 `#f97316`, 600 `#ea580c`, 700 `#c2410c`, 800 `#9a3412`, 900 `#7c2d12`, 950 `#431407`
- **surface:** 50 `#fafaf9`, 100 `#f5f5f4`, 200 `#e7e5e4`, 300 `#d6d3d1`, 400 `#a8a29e`, 500 `#78716c`, 600 `#57534e`, 700 `#44403c`, 800 `#292524`, 900 `#1c1917`, 950 `#0c0a09`

Dark mode keeps the existing structure: primary = brand-400 (`#4ade80`), secondary = accent-400 (`#fb923c`), surfaces inverted on the stone scale.

## Files to change

1. `apps/mobile/global.css` — primitive scales (brand/accent/surface)
2. `apps/mobile/src/theme/colors.ts` — JS mirror of scales
3. `apps/mobile/src/theme/tokens.ts` — resolved light/dark semantic hexes
4. `apps/admin/src/app/globals.css` — primitive scales
5. Hardcoded hexes: `AnimatedSplashScreen.tsx`, `app/(customer)/support/tickets.tsx`, `app/(customer)/services.tsx`, `app/(customer)/services/[id].tsx`, `app/(customer)/book-rider.tsx`, `app/(vendor)/add-reel.tsx` — map old blue → new equivalent step
6. `apps/mobile/app.json` — expo-splash-screen background `#004CFF` → `#15803d`
7. `apps/mobile/android/.../values/colors.xml` — splash/icon/colorPrimary blues → greens
8. `apps/server/src/auth/templates/otp-email.template.ts` + `email-verify.template.ts` — `#004CFF` buttons/accents → `#15803d`

Out of scope: `design/bexiemart-ds/` static HTML mockups (design references, not shipped apps); name strings ("BexieMart") — separate rebrand task.

## Testing

- Grep sweep confirms no old brand/accent hexes remain in `apps/`
- Existing test suites unaffected (values only, no API changes); spot-run mobile theme tests if present
