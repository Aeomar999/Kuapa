# Actor Adaptation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reframe Bexiemart's three user-facing actors (Buyer / Farmer / Transporter) for the AgriTech challenge at the presentation layer only, driven by one central config module.

**Architecture:** Add `src/lib/config/agri.ts` holding role labels, agri terminology, and feature flags. Actor-facing mobile screens import from it instead of hardcoded strings; trimmed surfaces are hidden with `href: null` / conditional render gated on flags. No auth, guard, route-group, or database changes.

**Tech Stack:** Expo / React Native, expo-router, NativeWind, Jest (`jest-expo`), TypeScript. `@/` path alias → `apps/mobile/src/`.

## Global Constraints

- Relabel only — do NOT change role IDs, the Prisma `UserRole` enum, guards, or route-group folder names.
- Currency/labels target Ghana. Rename user-facing brand "Bexiemart"/"BexieMart" → "Farmo" (display name, copy, headers). Do NOT rename npm scopes (`@bexiemart/*`), folder names, app slug, bundle ID, URL scheme, or the DB.
- Agri labels (exact): `CUSTOMER → "Buyer"`, `VENDOR → "Farmer"`, `DISPATCHER → "Transporter"`.
- Feature flags (all `false` in agri mode): `restaurant`, `services`, `reels`, `stories`.
- Trim = hide (via flag), never delete. Destination screens stay; only entry points are gated.
- All work is inside `apps/mobile/`. Run commands from `apps/mobile/`.
- Tests co-locate as `*.test.ts(x)` next to source; run with `npm test`.
- Commit after each task.

---

### Task 1: Central agri config module

**Files:**
- Create: `apps/mobile/src/lib/config/agri.ts`
- Test: `apps/mobile/src/lib/config/agri.test.ts`

**Interfaces:**
- Produces:
  - `ROLE_LABELS: Record<"CUSTOMER"|"VENDOR"|"DISPATCHER"|"ADMIN", string>`
  - `TERMS: Record<string, string>` (keys used by later tasks: `farm`, `produce`, `farmDashboard`, `requestTransport`, `totalProduce`, `farmPerformance`, `farmSettings`)
  - `FEATURES: { restaurant: boolean; services: boolean; reels: boolean; stories: boolean }`

- [ ] **Step 1: Write the failing test**

Create `apps/mobile/src/lib/config/agri.test.ts`:

```ts
import { ROLE_LABELS, TERMS, FEATURES } from "./agri";

describe("agri config", () => {
  it("maps internal roles to agri-facing labels", () => {
    expect(ROLE_LABELS.CUSTOMER).toBe("Buyer");
    expect(ROLE_LABELS.VENDOR).toBe("Farmer");
    expect(ROLE_LABELS.DISPATCHER).toBe("Transporter");
    expect(ROLE_LABELS.ADMIN).toBe("Admin");
  });

  it("exposes agri terminology", () => {
    expect(TERMS.farm).toBe("Farm");
    expect(TERMS.produce).toBe("Produce");
    expect(TERMS.farmDashboard).toBe("Farm Dashboard");
    expect(TERMS.requestTransport).toBe("Request Transport");
  });

  it("disables off-brand surfaces in agri mode", () => {
    expect(FEATURES.restaurant).toBe(false);
    expect(FEATURES.services).toBe(false);
    expect(FEATURES.reels).toBe(false);
    expect(FEATURES.stories).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- agri.test.ts`
Expected: FAIL — `Cannot find module './agri'`.

- [ ] **Step 3: Write minimal implementation**

Create `apps/mobile/src/lib/config/agri.ts`:

```ts
/**
 * AgriTech presentation config. Single source of truth for actor relabeling and
 * feature trimming. Internal role IDs (CUSTOMER/VENDOR/DISPATCHER/ADMIN) are
 * unchanged; these only affect what the user sees. Flip a FEATURES flag to true
 * to restore the original (general-marketplace) surface.
 */
export const ROLE_LABELS = {
  CUSTOMER: "Buyer",
  VENDOR: "Farmer",
  DISPATCHER: "Transporter",
  ADMIN: "Admin",
} as const;

export const TERMS = {
  farm: "Farm",
  produce: "Produce",
  farmDashboard: "Farm Dashboard",
  requestTransport: "Request Transport",
  totalProduce: "Total Produce",
  farmPerformance: "Farm Performance",
  farmSettings: "Farm Settings",
} as const;

export const FEATURES = {
  restaurant: false,
  services: false,
  reels: false,
  stories: false,
} as const;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- agri.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/lib/config/agri.ts apps/mobile/src/lib/config/agri.test.ts
git commit -m "feat(agri): add central role-label/terminology/feature-flag config"
```

---

### Task 2: Relabel registration role cards + intro carousel

**Files:**
- Modify: `apps/mobile/app/(auth)/register.tsx` (role card labels + step subtitle)
- Modify: `apps/mobile/app/(onboarding)/index.tsx` (`SLIDES` copy)

**Interfaces:**
- Consumes: nothing (pure copy; no import needed — these are user-facing verbs, not the role-noun labels).

This task is copy-only; verify by reading the screens, not by unit test.

- [ ] **Step 1: Relabel the register role cards**

In `apps/mobile/app/(auth)/register.tsx`:
- Line ~229: change the customer card label `Shop` → `Buy`.
- Line ~259: change the vendor card label `Sell` → `Sell` (unchanged text, but confirm it reads as the Farmer path). Leave the `store` icon (reads fine as a farm stall) or optionally change `name="store"` → `name="tractor"` if the icon set supports it; if unsure, leave `store`.
- Line ~188: change subtitle `"Choose your role and name"` → `"Are you buying or selling produce?"`.

Do NOT change `setRole("customer")` / `setRole("vendor")` — the internal role values stay.

- [ ] **Step 2: Replace the onboarding SLIDES with agri copy**

In `apps/mobile/app/(onboarding)/index.tsx`, replace the `SLIDES` array (lines 20–45) with:

```ts
const SLIDES = [
  {
    id: "1",
    titleStart: "Fresh",
    titleBold: "Produce",
    titleEnd: "Straight From Farms",
    description: "Buy tomatoes, peppers, garden eggs and more directly from nearby farmers.",
    image: require("../../assets/images/onboarding/shop.png"),
  },
  {
    id: "2",
    titleStart: "Reliable",
    titleBold: "Transport",
    titleEnd: "For Every Harvest",
    description: "Book a transporter to move produce from farm to buyer before it spoils.",
    image: require("../../assets/images/onboarding/delivery.png"),
  },
  {
    id: "3",
    titleStart: "Secure",
    titleBold: "Payments",
    titleEnd: "With Mobile Money",
    description: "Pay farmers securely via Mobile Money or your Farmo wallet.",
    image: require("../../assets/images/onboarding/payment.png"),
  },
];
```

(Image `require`s are unchanged — reusing existing assets.)

- [ ] **Step 3: Verify the app compiles and screens render**

Run: `npx tsc --noEmit` (from `apps/mobile/`)
Expected: no new type errors.

Manually: launch app (Task 7 covers the full walk); confirm the register step-1 shows "Buy / Sell" and the intro slides read agri.

- [ ] **Step 4: Commit**

```bash
git add "apps/mobile/app/(auth)/register.tsx" "apps/mobile/app/(onboarding)/index.tsx"
git commit -m "feat(agri): relabel registration roles and intro carousel copy"
```

---

### Task 3: Relabel the transporter conversion screen

**Files:**
- Modify: `apps/mobile/app/(customer)/become-dispatcher.tsx`

- [ ] **Step 1: Replace user-facing "Dispatcher"/"Rider" wording**

Read the file, then replace every user-facing occurrence of `Dispatcher` and `Rider` in JSX text, titles, and button labels with `Transporter`. Example transformations:
- `"Become a Dispatcher"` → `"Become a Transporter"`
- `"Start earning as a dispatcher"` → `"Start earning as a transporter"`

Do NOT change route paths (`/(customer)/become-dispatcher`, `/(dispatcher)/...`), variable names, API endpoints, or the `DISPATCHER` role value — text only.

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add "apps/mobile/app/(customer)/become-dispatcher.tsx"
git commit -m "feat(agri): relabel dispatcher conversion screen to Transporter"
```

---

### Task 4: Trim the Buyer navigation and home surfaces

**Files:**
- Modify: `apps/mobile/app/(customer)/(tabs)/_layout.tsx` (hide `reels` tab)
- Modify: `apps/mobile/app/(customer)/(tabs)/(home)/index.tsx` (filter off-brand entry cards)

**Interfaces:**
- Consumes: `FEATURES` from `@/lib/config/agri` (Task 1).

- [ ] **Step 1: Hide the Reels tab behind the flag**

In `apps/mobile/app/(customer)/(tabs)/_layout.tsx`:
- Add import at top: `import { FEATURES } from "@/lib/config/agri";`
- On the `reels` `Tabs.Screen` (lines ~125–131), add an `href` gate so the tab is removed when the flag is off:

```tsx
<Tabs.Screen
  name="reels"
  options={{
    title: "Reels",
    href: FEATURES.reels ? undefined : null,
    tabBarIcon: ({ color }) => <TabIcon name="video" color={color} />,
  }}
/>
```

`href: null` removes the tab from the bar (expo-router) while leaving the route reachable if navigated directly, so nothing crashes.

- [ ] **Step 2: Filter off-brand entry cards on the home screen**

In `apps/mobile/app/(customer)/(tabs)/(home)/index.tsx`, the quick-action / category entries are data-driven arrays whose items carry a `route` (verified: `/(customer)/food` at lines 38 & 86, `Reels`→`/(customer)/reels` at 58–62, `/(customer)/services` at 70).

- Add import: `import { FEATURES } from "@/lib/config/agri";`
- Immediately before each array is rendered (`.map(...)`), filter out flagged routes. Add this helper near the top of the component body and wrap each source array:

```ts
const isTrimmedRoute = (route?: string) =>
  (!FEATURES.reels && route?.includes("/reels")) ||
  (!FEATURES.services && route?.includes("/services")) ||
  (!FEATURES.restaurant && route?.includes("/food")) ||
  (!FEATURES.restaurant && route?.includes("/restaurant"));
```

Then apply `.filter((item) => !isTrimmedRoute(item.route))` to each entries array before `.map()`. If any entry is a Story/stories carousel rendered separately, wrap it as `{!FEATURES.stories && (<StoriesRow ... />) === null}` — i.e. render it only when `FEATURES.stories` is true: `{FEATURES.stories && <StoriesRow ... />}`.

- [ ] **Step 3: Verify no dead links remain and app compiles**

Run: `npx tsc --noEmit`
Expected: no new errors.
Manually confirm the Buyer home shows no Food/Reels/Services/Stories entry points and the bottom tab bar has no Reels tab.

- [ ] **Step 4: Commit**

```bash
git add "apps/mobile/app/(customer)/(tabs)/_layout.tsx" "apps/mobile/app/(customer)/(tabs)/(home)/index.tsx"
git commit -m "feat(agri): trim reels/food/services/stories from Buyer surfaces"
```

---

### Task 5: Relabel + trim the Farmer dashboard

**Files:**
- Modify: `apps/mobile/app/(vendor)/(dashboard)/index.tsx`

**Interfaces:**
- Consumes: `TERMS`, `FEATURES` from `@/lib/config/agri` (Task 1).

- [ ] **Step 1: Relabel store/product terminology**

In `apps/mobile/app/(vendor)/(dashboard)/index.tsx`:
- Add import: `import { TERMS, FEATURES } from "@/lib/config/agri";`
- Line ~15 stat label `"Total Products"` → use `TERMS.totalProduce` (`"Total Produce"`).
- Line ~218 section header `"Store Performance"` → use `TERMS.farmPerformance` (`"Farm Performance"`).
- Line ~58 quick action `"Store\nSettings"` → `"Farm\nSettings"` (or `` `${TERMS.farm}\nSettings` ``).
- Any header greeting referencing "store"/"shop" → "farm".

- [ ] **Step 2: Trim the "Create Reel" quick action**

The quick-actions are a data-driven array (verified: `"Add\nProduct"` line 34, earnings line 46, `"Create\nReel"`→`/(vendor)/add-reel` lines 50–54, `"Store\nSettings"` line 58). Remove the Create-Reel action when the flag is off by filtering the array before render:

```ts
const visibleActions = QUICK_ACTIONS.filter(
  (a) => FEATURES.reels || !a.route?.includes("/add-reel")
);
```

Render `visibleActions` instead of the raw array. (Replace `QUICK_ACTIONS` with the actual array identifier in the file.)

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no new errors.
Manually confirm the Farmer dashboard reads "Farm …", shows "Total Produce", and has no "Create Reel" action.

- [ ] **Step 4: Commit**

```bash
git add "apps/mobile/app/(vendor)/(dashboard)/index.tsx"
git commit -m "feat(agri): relabel Farmer dashboard and trim Create Reel"
```

---

### Task 6: Relabel the Transporter dashboard copy

**Files:**
- Modify: `apps/mobile/app/(dispatcher)/(tabs)/_layout.tsx`
- Modify: dispatcher dashboard/home screen(s) under `apps/mobile/app/(dispatcher)/(tabs)/` (locate the home/profile screens; no trim, copy only)

- [ ] **Step 1: Replace user-facing "Dispatcher"/"Rider" wording with "Transporter"**

Read the dispatcher tab layout and home/profile screens. Replace user-facing `Dispatcher`/`Rider` text (tab titles, headers, greetings) with `Transporter`. Do NOT touch route-group folder names, the `DISPATCHER` role, API paths, or variable names.

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add "apps/mobile/app/(dispatcher)"
git commit -m "feat(agri): relabel Transporter (dispatcher) dashboard copy"
```

---

### Task 7: Brand rename sweep (Bexiemart → Farmo)

**Files:**
- Modify: `apps/mobile/app.json` (`expo.name` display name only)
- Modify: any mobile source with a visible "Bexiemart"/"BexieMart" string (found by sweep)

**Scope:** user-facing brand text only. This task is mobile-only (Global Constraint). Server email from-name and the admin portal brand are out of scope for this plan (follow-up).

- [ ] **Step 1: Find every occurrence**

Run (from `apps/mobile/`):
`grep -rniI "bexiemart" app src app.json`
Note each hit and classify it as **visible copy** (relabel) vs **internal identifier** (leave).

- [ ] **Step 2: Replace visible brand strings → "Farmo"**

Replace only user-facing strings, preserving case (`BexieMart`/`Bexiemart` → `Farmo`): screen copy, headers, titles, alerts, the wallet/onboarding text, and any logo/wordmark `<Text>`.

Do NOT change (these are internal, not user-facing — changing them breaks things):
- `@bexiemart/*` package references / imports
- persisted keys / storage names containing `bexiemart` (SecureStore keys, `zustand` persist names, AsyncStorage keys) — renaming these drops existing sessions/state
- env var names, deep-link `scheme`, `slug`, `ios.bundleIdentifier`, `android.package`

- [ ] **Step 3: Set the app display name**

In `apps/mobile/app.json`, set `expo.name` to `"Farmo"`. Leave `slug`, `scheme`, `ios.bundleIdentifier`, and `android.package` unchanged.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit` → no new errors.
Run: `grep -rniI "bexiemart" app src app.json` → only intentional internal identifiers remain (packages, storage keys, bundle/scheme). No visible copy should match.

- [ ] **Step 5: Commit**

```bash
git add "apps/mobile/app.json" apps/mobile/app apps/mobile/src
git commit -m "feat(farmo): rename user-facing brand Bexiemart -> Farmo"
```

---

### Task 8: End-to-end verification + reversibility check

**Files:** none (verification only).

- [ ] **Step 1: Launch the app and walk each role**

Run: `npm start` (from `apps/mobile/`), open on device/emulator.
Confirm:
- App display name and all visible copy read "Farmo" (no "Bexiemart" left on screen).
- Intro carousel reads agri (Fresh Produce / Reliable Transport / Secure Payments).
- Register step 1 shows Buy / Sell.
- Buyer: no Reels tab; home has no Food/Reels/Services/Stories entries; marketplace/search, cart, orders, chat, wallet still work.
- Farmer: dashboard reads "Farm …", "Total Produce", no Create Reel; produce CRUD, orders, earnings, chat work.
- Transporter: copy reads "Transporter"; tasks/earnings/live-location work.

- [ ] **Step 2: Reversibility check**

Temporarily set all `FEATURES` flags in `agri.ts` to `true`. Relaunch. Confirm the Reels tab, Food/Services entries, and Create-Reel action reappear. Revert the flags to `false`. (No commit — this is a check.)

- [ ] **Step 3: Run the test suite**

Run: `npm test`
Expected: existing tests pass; `agri.test.ts` passes.

- [ ] **Step 4: Final commit (if any copy fixups were made during the walk)**

Stage only the mobile files you touched — never `git add -A`/`git add .` (the
working tree contains unrelated dark-mode WIP in `apps/admin` and deleted docs
that must NOT be committed):

```bash
git add apps/mobile/app apps/mobile/src apps/mobile/app.json   # only the paths you changed
git commit -m "chore(agri): verification-pass copy fixups"
```

---

## Self-Review

**Spec coverage:**
- Central config module → Task 1. ✔
- Actor mapping / role labels → Tasks 1, 2, 3, 6. ✔
- Terminology swaps → Tasks 2, 5. ✔
- Per-actor trim (reels/food/services/stories) → Tasks 4 (Buyer), 5 (Farmer). ✔
- Role-selection surfaces (register, become-dispatcher, intro) → Tasks 2, 3. ✔
- Brand rename Bexiemart → Farmo (user-facing) → Task 7. ✔
- Verification + reversibility → Task 8. ✔
- Out-of-scope items (categories/units, geo map, GHS/Nigeria cleanup, bonuses) correctly NOT in this plan. ✔

**Placeholder scan:** No TBD/TODO. The two spots that say "replace with the actual array identifier in the file" are explicit instructions to bind a shown code pattern to a verified data array, not vague hand-waving — the pattern code is given in full.

**Type consistency:** `ROLE_LABELS`, `TERMS`, `FEATURES` names and the `TERMS` keys (`farm`, `produce`, `farmDashboard`, `requestTransport`, `totalProduce`, `farmPerformance`, `farmSettings`) match between Task 1's definition and their consumers in Tasks 4–5. `FEATURES` flag names (`restaurant`, `services`, `reels`, `stories`) are consistent across Tasks 1, 4, 5.
