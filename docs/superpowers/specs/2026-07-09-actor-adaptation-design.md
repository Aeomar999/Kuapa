# Actor Adaptation — Bexiemart → AgriTech Marketplace

**Date:** 2026-07-09
**Scope:** Reframe Bexiemart's three user-facing actors to the GDSS-PSInno AgriTech
Challenge (Farmer-to-Buyer marketplace) at the **presentation layer only**.
**Non-goal:** No changes to auth, guards, route-group names, database schema, or
Prisma enums. This is a reversible relabel + navigation trim, not a rename.

## Context

Bexiemart is a Ghana-based (GHS, MTN/Vodafone/AirtelTigo momo) multi-role
marketplace + logistics super-app. Its four roles map cleanly onto the
challenge's actors; the challenge deliverable is a working prototype demoed
end-to-end (farmer registers → uploads produce → buyer searches/orders →
transport → delivery). All those paths are already verified working
(see `NONFUNCTIONAL-FEATURES-AUDIT.md`, 2026-07-05).

## Decisions (approved)

1. **Relabel only** — internal role IDs (`CUSTOMER`/`VENDOR`/`DISPATCHER`/`ADMIN`)
   are untouched. Only user-facing labels, copy, icons, and seed data change.
2. **Trim to agri-core** — off-brand surfaces (restaurant/food ordering, services
   marketplace, reels, stories) are **hidden via feature flags, not deleted**, so
   the apps read as a produce marketplace. Reversible by flipping a boolean.
3. **Implementation approach A** — a single central config module drives labels,
   terminology, and feature flags; actor-facing surfaces import from it.

## Actor mapping

| Challenge actor | Internal role (unchanged) | User-facing label |
|---|---|---|
| Buyer (retailers, restaurants, processors, households) | `CUSTOMER` | **Buyer** |
| Farmer / seller | `VENDOR` | **Farmer** |
| Transport provider | `DISPATCHER` | **Transporter** |
| Platform operator | `ADMIN` | Admin (unchanged) |

## Terminology swaps (copy layer)

| Current | Agri label |
|---|---|
| Shop / Store | Farm |
| Vendor | Farmer |
| Product / Listing | Produce |
| Vendor dashboard | Farm dashboard |
| Book a rider / Delivery | Request transport / Transport |
| Dispatcher / Rider | Transporter |

**Brand rename:** user-facing "Bexiemart"/"BexieMart" → **"Farmo"** (app display
name, splash/logo text, copy, headers). Internal npm scopes (`@bexiemart/*`),
folder names, bundle ID, URL scheme, and the DB are NOT renamed. Keeps this agri
build distinct from the user's existing (non-agri) Bexiemart repo.

## Per-actor trim (feature flags)

Flags: `restaurant`, `services`, `reels`, `stories` — all `false` in agri mode.

- **Farmer (`VENDOR`):** hide add-reel, services management, food/restaurant
  management. **Keep:** produce CRUD, orders, earnings, chat, hours, documents.
- **Buyer (`CUSTOMER`):** hide the Reels tab, restaurant/food ordering, services
  marketplace, stories. **Keep:** marketplace/search, cart, orders, track-order,
  chat, wallet/momo.
- **Transporter (`DISPATCHER`):** no trim — relabel copy only. Tasks, earnings,
  and live-location tracking stay.

## Design — central config module (approach A)

New file: `apps/mobile/src/lib/config/agri.ts`

```ts
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
  // ...extended as screens are touched
} as const;

export const FEATURES = {
  restaurant: false,
  services: false,
  reels: false,
  stories: false,
} as const;
```

**Consumption pattern**
- **Labels/terms:** actor-facing surfaces import `ROLE_LABELS` / `TERMS` instead
  of hardcoded strings.
- **Hide a tab:** in the relevant `_layout.tsx`, set
  `href: FEATURES.reels ? undefined : null` on the trimmed `Tabs.Screen`.
- **Hide a home/profile section:** wrap the entry card in `FEATURES.<flag> && (...)`.
- Destination screens (`food.tsx`, `restaurant/[id].tsx`, `services.tsx`, etc.)
  are left in place; only their **entry points** are removed, so nothing breaks
  and the trim is reversible.

## Where roles are actually selected (verified in code)

- **Registration** `app/(auth)/register.tsx` — a two-card toggle,
  `role: "customer" | "vendor"`. These two cards are the primary role labels to
  relabel: **customer → Buyer**, **vendor → Farmer**.
- **Transporter path** `app/(customer)/become-dispatcher.tsx` — a Buyer converts
  to a Transporter (DISPATCHER is not a signup option; it's an upgrade). Relabel
  "Dispatcher" → "Transporter" here.
- **Intro carousel** `app/(onboarding)/index.tsx` — a 3-slide intro (currently
  campus/shop/delivery themed); **not** a role picker. Reword slide copy to
  agri (produce/farm) for the demo.

## Files in scope (representative; exhaustive list in the plan)

- **New:** `apps/mobile/src/lib/config/agri.ts`
- **Role labels:** `app/(auth)/register.tsx` (customer→Buyer, vendor→Farmer
  cards), `app/(customer)/become-dispatcher.tsx` (→ Transporter)
- **Intro copy:** `app/(onboarding)/index.tsx` (agri wording)
- **Buyer nav/home:** `app/(customer)/(tabs)/_layout.tsx` (hide `reels` via
  `href: null`), `app/(customer)/(tabs)/(home)/index.tsx` (hide
  restaurant/food/services/stories entry cards), `app/(customer)/(tabs)/profile.tsx`
- **Farmer nav/dashboard:** `app/(vendor)/(dashboard)/_layout.tsx`,
  `app/(vendor)/(dashboard)/index.tsx` (hide add-reel/services/food entry points)
- **Transporter:** `app/(dispatcher)/(tabs)/_layout.tsx` + dashboard copy

## Out of scope (later work items, not this spec)

Produce categories/units, farm geo-coordinates + "nearby produce" map, the
GHS/Nigeria default cleanups, and bonus items (USSD/SMS, recommendation). These
are separate specs; this one only reframes the actors.

## Verification

- Manual: launch mobile app, walk each role's onboarding + primary tabs; confirm
  labels read Farmer/Buyer/Transporter and trimmed surfaces are absent.
- Confirm no route-not-found errors from removed entry points (destinations still
  exist; only links removed).
- Flip all `FEATURES` flags to `true` and confirm original surfaces reappear
  (reversibility check).
- No server, auth, or DB changes → no backend regression surface.
