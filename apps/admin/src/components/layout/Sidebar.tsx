"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Store,
  ShoppingBasket,
  AlertTriangle,
  FileText,
  Settings,
  LogOut,
  Truck,
  PackageCheck,
  Megaphone,
  ShieldAlert,
  ShieldCheck,
  Ticket,
  ChevronDown,
  ChevronRight,
  Sprout,
  Leaf,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useUiStore } from "../../lib/stores/ui-store";
import { useAuthStore } from "../../lib/stores/auth-store";
import { useUser } from "../../lib/hooks/use-auth";
import { FEATURES } from "../../lib/config/agri";

type FeatureKey = keyof typeof FEATURES;

type RawSubItem = { name: string; href: string; feature?: FeatureKey };

type RawItem = {
  name: string;
  href?: string;
  icon: any;
  badge?: number | string;
  superAdminOnly?: boolean;
  feature?: FeatureKey;
  subItems?: RawSubItem[];
};

type RawGroup = { group: string; items: RawItem[] };

type NavItem = {
  name: string;
  href?: string;
  icon: any;
  badge?: number | string;
  superAdminOnly?: boolean;
  subItems?: { name: string; href: string }[];
};

type NavGroup = { group: string; items: NavItem[] };

// ── Navigation, reframed farm-to-market ──────────────────────────────────────
// Leads with the harvest surfaces (AgriMarket, Farmers, Produce Orders). The
// general-marketplace verticals (restaurants, services, reels, flash sales)
// carry a `feature` key and are gated behind config/agri.ts — hidden by default,
// restored by flipping the flag.
const navigationConfig: RawGroup[] = [
  {
    group: "Overview",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "AgriMarket", href: "/marketplace", icon: Sprout, badge: "Harvests" },
      { name: "Reports", href: "/reports", icon: FileText },
    ],
  },
  {
    group: "Marketplace",
    items: [
      { name: "Farmers", href: "/vendors", icon: Leaf },
      { name: "Buyers & Users", href: "/users", icon: Users },
      {
        name: "Storefronts",
        icon: Store,
        subItems: [
          { name: "Restaurants", href: "/food-vendors", feature: "restaurant" },
          { name: "Service Providers", href: "/service-vendors", feature: "services" },
        ],
      },
      {
        name: "Orders",
        icon: ShoppingBasket,
        subItems: [
          { name: "Produce Orders", href: "/orders" },
          { name: "Food Orders", href: "/food-orders", feature: "restaurant" },
          { name: "Service Bookings", href: "/service-bookings", feature: "services" },
        ],
      },
    ],
  },
  {
    group: "Logistics",
    items: [
      { name: "Transporters", href: "/dispatchers", icon: Truck },
      { name: "Deliveries", href: "/deliveries", icon: PackageCheck },
    ],
  },
  {
    group: "Growth",
    items: [
      {
        name: "Marketing",
        icon: Megaphone,
        subItems: [
          { name: "Banners", href: "/marketing/banners" },
          { name: "Flash Sales", href: "/marketing/flash-sales", feature: "flashSales" },
          { name: "Coupons", href: "/marketing/coupons" },
        ],
      },
      { name: "Referrals", href: "/referrals", icon: Ticket },
    ],
  },
  {
    group: "Moderation",
    items: [
      {
        name: "Content",
        icon: ShieldAlert,
        subItems: [
          { name: "Reels", href: "/moderation/reels", feature: "reels" },
          { name: "Reviews", href: "/moderation/reviews" },
        ],
      },
      { name: "Disputes", href: "/disputes", icon: AlertTriangle, badge: 3 },
    ],
  },
  {
    group: "System",
    items: [
      { name: "Admins", href: "/admins", icon: ShieldCheck, superAdminOnly: true },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

const featureOn = (feature?: FeatureKey) => !feature || FEATURES[feature];

// Apply feature flags: drop hidden sub-items, hide a parent whose children are
// all gone, and collapse a parent with a single surviving child into a direct
// link (keeping the parent's icon).
function resolveNav(config: RawGroup[]): NavGroup[] {
  return config
    .map((group) => {
      const items = group.items
        .filter((item) => featureOn(item.feature))
        .map((item): NavItem | null => {
          if (!item.subItems) {
            return {
              name: item.name,
              href: item.href,
              icon: item.icon,
              badge: item.badge,
              superAdminOnly: item.superAdminOnly,
            };
          }
          const subItems = item.subItems.filter((sub) => featureOn(sub.feature));
          if (subItems.length === 0) return null;
          if (subItems.length === 1) {
            return {
              name: subItems[0].name,
              href: subItems[0].href,
              icon: item.icon,
              badge: item.badge,
            };
          }
          return {
            name: item.name,
            icon: item.icon,
            badge: item.badge,
            subItems: subItems.map(({ name, href }) => ({ name, href })),
          };
        })
        .filter((item): item is NavItem => item !== null);
      return { group: group.group, items };
    })
    .filter((group) => group.items.length > 0);
}

const navigation = resolveNav(navigationConfig);

export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarOpen, toggleSidebar } = useUiStore();
  const logout = useAuthStore((state) => state.logout);
  const { data: me } = useUser();
  const isSuperAdmin = !!me?.isSuperAdmin;

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const newExpanded = { ...expandedItems };
    let changed = false;

    navigation.forEach((group) => {
      group.items.forEach((item) => {
        if (item.subItems) {
          const isChildActive = item.subItems.some(
            (sub) => pathname === sub.href || pathname.startsWith(`${sub.href}/`)
          );
          if (isChildActive && !newExpanded[item.name]) {
            newExpanded[item.name] = true;
            changed = true;
          }
        }
      });
    });

    if (changed) {
      setExpandedItems(newExpanded);
    }
  }, [pathname]);

  const toggleExpand = (name: string) => {
    if (!isSidebarOpen) {
      toggleSidebar();
      setExpandedItems((prev) => ({ ...prev, [name]: true }));
    } else {
      setExpandedItems((prev) => ({ ...prev, [name]: !prev[name] }));
    }
  };

  return (
    <div
      className={cn(
        // The signature: a deep forest-green rail. Cream text, gold for the one
        // thing that matters — where you are.
        "flex flex-col bg-gradient-to-b from-[#09442a] to-[#073B24] text-[#F8F4EA] transition-all duration-300 overflow-hidden",
        isSidebarOpen ? "w-[260px]" : "w-[72px]"
      )}
    >
      <div className="flex h-16 items-center border-b border-white/10 px-4">
        <div className={cn("flex items-center gap-3", !isSidebarOpen && "w-full justify-center")}>
          <img src="/brand/kuapa-icon.svg" alt="Kuapa" className="h-9 w-9 shrink-0 rounded-[10px] shadow-sm" />
          {isSidebarOpen && (
            <div className="flex flex-col leading-none">
              <span className="font-[family-name:var(--font-heading)] text-lg font-bold tracking-tight text-[#F8F4EA]">
                Kuapa
              </span>
              <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F2A81D]">
                Farm to Market
              </span>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 kuapa-rail-scroll">
        {navigation.map((group) => (
          <div key={group.group} className="mb-6 px-3">
            {isSidebarOpen && (
              <h3 className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#F8F4EA]/40">
                {group.group}
              </h3>
            )}

            <div className="space-y-1">
              {group.items
                .filter((item) => !item.superAdminOnly || isSuperAdmin)
                .map((item) => {
                  const isActive = item.href
                    ? pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`))
                    : false;
                  const isChildActive = item.subItems?.some(
                    (sub) => pathname === sub.href || pathname.startsWith(`${sub.href}/`)
                  );
                  const isExpanded = expandedItems[item.name];
                  const Icon = item.icon;
                  const isHarvestBadge = typeof item.badge === "string";

                  return (
                    <div key={item.name} className="flex flex-col">
                      {item.href ? (
                        <Link
                          href={item.href}
                          className={cn(
                            "group relative flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                            isActive
                              ? "bg-white/10 text-[#F2A81D]"
                              : "text-[#F8F4EA]/75 hover:bg-white/5 hover:text-white",
                            !isSidebarOpen && "justify-center px-0"
                          )}
                          title={!isSidebarOpen ? item.name : undefined}
                        >
                          {isActive && (
                            <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[#F2A81D]" />
                          )}
                          <div className="flex items-center">
                            <Icon
                              className={cn(
                                "flex-shrink-0 transition-colors",
                                isActive ? "text-[#F2A81D]" : "text-[#F8F4EA]/55 group-hover:text-white",
                                isSidebarOpen ? "mr-3 h-5 w-5" : "h-6 w-6"
                              )}
                            />
                            {isSidebarOpen && <span>{item.name}</span>}
                          </div>
                          {isSidebarOpen && item.badge != null && (
                            <span
                              className={cn(
                                "ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold",
                                isHarvestBadge
                                  ? "bg-[#F2A81D] text-[#0B5233]"
                                  : "bg-[#EF4444] text-white"
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      ) : (
                        <button
                          onClick={() => toggleExpand(item.name)}
                          className={cn(
                            "group relative flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                            isChildActive
                              ? "bg-white/5 text-white font-semibold"
                              : "text-[#F8F4EA]/75 hover:bg-white/5 hover:text-white",
                            !isSidebarOpen && "justify-center px-0"
                          )}
                          title={!isSidebarOpen ? item.name : undefined}
                        >
                          <div className="flex items-center">
                            <Icon
                              className={cn(
                                "flex-shrink-0 transition-colors",
                                isChildActive ? "text-[#F2A81D]" : "text-[#F8F4EA]/55 group-hover:text-white",
                                isSidebarOpen ? "mr-3 h-5 w-5" : "h-6 w-6"
                              )}
                            />
                            {isSidebarOpen && <span>{item.name}</span>}
                          </div>
                          {isSidebarOpen && (
                            <div className="flex items-center">
                              {item.badge != null && (
                                <span className="mr-2 inline-flex items-center rounded-full bg-[#F2A81D] px-2 py-0.5 text-[10px] font-bold text-[#0B5233]">
                                  {item.badge}
                                </span>
                              )}
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-[#F8F4EA]/45" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-[#F8F4EA]/45" />
                              )}
                            </div>
                          )}
                        </button>
                      )}

                      {isSidebarOpen && isExpanded && item.subItems && (
                        <div className="mt-1 flex flex-col space-y-1 relative before:absolute before:left-[21px] before:top-0 before:bottom-0 before:w-px before:bg-white/15">
                          {item.subItems.map((sub) => {
                            const isSubActive = pathname === sub.href || pathname.startsWith(`${sub.href}/`);
                            return (
                              <Link
                                key={sub.name}
                                href={sub.href}
                                className={cn(
                                  "group relative flex items-center rounded-lg py-2 pl-10 pr-3 text-sm font-medium transition-colors",
                                  isSubActive
                                    ? "text-[#F2A81D]"
                                    : "text-[#F8F4EA]/60 hover:text-white"
                                )}
                              >
                                <div className="absolute left-[21px] top-1/2 h-px w-3 bg-white/15" />
                                <span>{sub.name}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          onClick={logout}
          className={cn(
            "group flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-[#F8F4EA]/70 transition-colors hover:bg-[#EF4444]/20 hover:text-[#FCA5A5]",
            !isSidebarOpen && "justify-center px-0"
          )}
          title={!isSidebarOpen ? "Logout" : undefined}
        >
          <LogOut
            className={cn("flex-shrink-0 transition-colors", isSidebarOpen ? "mr-3 h-5 w-5" : "h-6 w-6")}
            aria-hidden="true"
          />
          {isSidebarOpen && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}
