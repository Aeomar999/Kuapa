"use client";

import React, { useState } from "react";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import { Stat } from "../../../components/ui/Stat";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/Card";
import { Sprout, Truck, ThermometerSnowflake, PhoneCall, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { formatCurrency } from "../../../lib/utils";

interface HarvestItem {
  id: string;
  name: string;
  farmer: string;
  phone: string;
  quantity: number;
  unit: string;
  price: number;
  shelfLifeRemainingDays: number;
  totalShelfLifeDays: number;
  smartMatchScore: number;
  recommendedTransport: string;
  statusTag: "PEAK_FRESHNESS" | "URGENT_SALE_DISCOUNT" | "LOCAL_FARM_NEARBY";
}

const SAMPLE_HARVESTS: HarvestItem[] = [
  {
    id: "h1",
    name: "Akumadan Fresh Tomatoes",
    farmer: "Kofi Owusu (USSD Farmer)",
    phone: "+233 24 123 4567",
    quantity: 45,
    unit: "CRATE",
    price: 120,
    shelfLifeRemainingDays: 5,
    totalShelfLifeDays: 7,
    smartMatchScore: 94,
    recommendedTransport: "ABOBOYAA_TRICYCLE",
    statusTag: "PEAK_FRESHNESS",
  },
  {
    id: "h2",
    name: "Navrongo Organic Red Pepper",
    farmer: "Amina Sulley",
    phone: "+233 20 890 1234",
    quantity: 30,
    unit: "BAG",
    price: 180,
    shelfLifeRemainingDays: 1.5,
    totalShelfLifeDays: 6,
    smartMatchScore: 88,
    recommendedTransport: "PICKUP_TRUCK",
    statusTag: "URGENT_SALE_DISCOUNT",
  },
  {
    id: "h3",
    name: "Amanfrom Garden Eggs",
    farmer: "Kwame Boateng",
    phone: "+233 54 345 6789",
    quantity: 20,
    unit: "BASKET",
    price: 85,
    shelfLifeRemainingDays: 6,
    totalShelfLifeDays: 8,
    smartMatchScore: 92,
    recommendedTransport: "ABOBOYAA_TRICYCLE",
    statusTag: "LOCAL_FARM_NEARBY",
  },
  {
    id: "h4",
    name: "Ada Leafy Greens & Spinach",
    farmer: "Esi Mensah",
    phone: "+233 26 789 0123",
    quantity: 15,
    unit: "BASKET",
    price: 65,
    shelfLifeRemainingDays: 1.2,
    totalShelfLifeDays: 4,
    smartMatchScore: 81,
    recommendedTransport: "REFRIGERATED_VAN",
    statusTag: "URGENT_SALE_DISCOUNT",
  },
];

export default function MarketplacePortalPage() {
  const [harvests] = useState<HarvestItem[]>(SAMPLE_HARVESTS);
  const [selectedTransportFilter, setSelectedTransportFilter] = useState<string>("ALL");

  const filteredHarvests = harvests.filter((h) =>
    selectedTransportFilter === "ALL" ? true : h.recommendedTransport === selectedTransportFilter
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
              AgriMarket & Perishable Harvests
            </h1>
            <p className="text-[var(--color-text-muted)]">
              GDSS-PSInno Challenge Hub — Real-time produce monitoring, freshness tracking, and agricultural logistics.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <Sprout className="w-3.5 h-3.5 mr-1.5" />
              100% GDSS-PSInno Green
            </span>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Stat
            title="Active Perishable Listings"
            value="142"
            icon={<Sprout className="h-6 w-6 text-emerald-500" />}
            trend={{ value: 18.4, isPositive: true }}
          />
          <Stat
            title="Aboboyaa & Farm Vehicles"
            value="38 Active"
            icon={<Truck className="h-6 w-6 text-amber-500" />}
            trend={{ value: 12.0, isPositive: true }}
          />
          <Stat
            title="Avg. Shelf Life Remaining"
            value="4.6 Days"
            icon={<ThermometerSnowflake className="h-6 w-6 text-blue-500" />}
          />
          <Stat
            title="USSD (*920*26#) Sessions"
            value="1,284"
            icon={<PhoneCall className="h-6 w-6 text-purple-500" />}
            trend={{ value: 34.2, isPositive: true }}
          />
        </div>

        {/* Filter Toolbar */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle>Live Perishable Produce Directory</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { label: "All Vehicles", value: "ALL" },
                  { label: "Aboboyaa Tricycle (1.2x)", value: "ABOBOYAA_TRICYCLE" },
                  { label: "Pickup Truck (1.6x)", value: "PICKUP_TRUCK" },
                  { label: "Refrigerated Van (2.4x)", value: "REFRIGERATED_VAN" },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setSelectedTransportFilter(filter.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      selectedTransportFilter === filter.value
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] border border-[var(--color-border)]"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                    <th className="pb-3 pr-4">Produce & Vendor</th>
                    <th className="pb-3 px-4">Quantity / Unit</th>
                    <th className="pb-3 px-4">Price</th>
                    <th className="pb-3 px-4">Freshness Indicator</th>
                    <th className="pb-3 px-4">Logistics Vehicle</th>
                    <th className="pb-3 pl-4">Smart Match</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {filteredHarvests.map((h) => {
                    const freshnessPercent = Math.round((h.shelfLifeRemainingDays / h.totalShelfLifeDays) * 100);
                    const isUrgent = h.statusTag === "URGENT_SALE_DISCOUNT";

                    return (
                      <tr key={h.id} className="hover:bg-[var(--color-surface)]/50 transition-colors">
                        <td className="py-4 pr-4">
                          <div className="font-semibold text-[var(--color-text)]">{h.name}</div>
                          <div className="text-xs text-[var(--color-text-muted)]">{h.farmer}</div>
                        </td>
                        <td className="py-4 px-4 font-medium text-[var(--color-text)]">
                          {h.quantity} {h.unit}S
                        </td>
                        <td className="py-4 px-4 font-semibold text-[var(--color-text)]">
                          {formatCurrency(h.price)} /{h.unit}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-1 w-36">
                            <div className="flex items-center justify-between text-xs">
                              <span
                                className={`font-medium ${
                                  isUrgent ? "text-red-500 font-bold" : "text-[var(--color-text)]"
                                }`}
                              >
                                {h.shelfLifeRemainingDays} days left
                              </span>
                              <span className="text-[var(--color-text-muted)]">{freshnessPercent}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-[var(--color-border)] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isUrgent
                                    ? "bg-red-500"
                                    : freshnessPercent > 60
                                      ? "bg-emerald-500"
                                      : "bg-amber-500"
                                }`}
                                style={{ width: `${freshnessPercent}%` }}
                              />
                            </div>
                            {isUrgent && (
                              <span className="inline-flex items-center text-[10px] text-red-500 font-semibold">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Urgent Discount Tag
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)]">
                            <Truck className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
                            {h.recommendedTransport.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-4 pl-4">
                          <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            Score: {h.smartMatchScore}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
