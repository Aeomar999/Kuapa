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
