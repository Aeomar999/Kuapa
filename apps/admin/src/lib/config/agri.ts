/**
 * AgriTech presentation config for the Admin Portal. Single source of truth for
 * actor relabeling and vertical trimming. Internal role IDs
 * (CUSTOMER/VENDOR/DISPATCHER/ADMIN) are unchanged — these only affect what the
 * admin sees. Mirrors apps/mobile/src/lib/config/agri.ts so the two surfaces
 * stay in sync. Flip a FEATURES flag to true to restore a non-agri vertical.
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
  harvest: "Harvest",
  agriMarket: "AgriMarket",
  settlements: "Settlements",
  farmers: "Farmers",
  buyers: "Buyers",
  transporters: "Transporters",
} as const;

/**
 * Vertical flags. `false` hides the vertical from the admin navigation without
 * deleting its routes or code — set to `true` to bring it back. These are the
 * non-agri surfaces inherited from the general-marketplace product.
 */
export const FEATURES = {
  restaurant: false,
  services: false,
  reels: false,
  flashSales: false,
} as const;

/** Relabel an internal role ID for display. Falls back to the raw value. */
export function roleLabel(role: string): string {
  const key = role?.toUpperCase() as keyof typeof ROLE_LABELS;
  return ROLE_LABELS[key] ?? role;
}
