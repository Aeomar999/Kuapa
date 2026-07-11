"use client";

import React from "react";
import { Users, Sprout, ShoppingBasket, Coins } from "lucide-react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { Stat } from "../../components/ui/Stat";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { RevenueChart } from "../../components/charts/RevenueChart";
import { RoleDistribution } from "../../components/charts/RoleDistribution";
import { OrdersTimeline } from "../../components/charts/OrdersTimeline";
import { useDashboardStats } from "../../lib/hooks/use-dashboard";
import { formatCurrency } from "../../lib/utils";

export default function DashboardPage() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-[var(--color-text-muted)]">
            <Sprout className="h-8 w-8 animate-pulse text-[var(--color-primary)]" />
            <p>Gathering today&apos;s harvest data…</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const displayStats = stats || { totalUsers: 0, activeVendors: 0, totalOrders: 0, totalRevenue: 0 };

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
            Farm-to-Market Overview
          </h1>
          <p className="text-[var(--color-text-muted)]">
            Here&apos;s how produce is moving across Kuapa today.
          </p>
        </div>

        {/* KPIs — settlements leads, in gold */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Stat
            title="Settlements"
            value={formatCurrency(displayStats.totalRevenue)}
            icon={<Coins className="h-6 w-6" />}
            highlight
            hint="Farm-gate value moved"
            trend={{ value: 12.5, isPositive: true }}
          />
          <Stat
            title="Active Farmers"
            value={displayStats.activeVendors}
            icon={<Sprout className="h-6 w-6" />}
            trend={{ value: 4.3, isPositive: true }}
          />
          <Stat
            title="Produce Orders"
            value={displayStats.totalOrders}
            icon={<ShoppingBasket className="h-6 w-6" />}
            trend={{ value: 8.2, isPositive: true }}
          />
          <Stat
            title="Farmers & Buyers"
            value={displayStats.totalUsers}
            icon={<Users className="h-6 w-6" />}
            trend={{ value: 2.1, isPositive: true }}
          />
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Settlement Volume</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <RevenueChart />
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Community by Role</CardTitle>
            </CardHeader>
            <CardContent>
              <RoleDistribution />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-1">
          <Card>
            <CardHeader>
              <CardTitle>Order Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <OrdersTimeline />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
