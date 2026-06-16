"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, Wrench, Users, DollarSign, Loader2, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import MonthlyRevenueChart from "@/components/dashboard/monthly-revenue-chart";
import WorkOrderStatusChart from "@/components/dashboard/work-order-status-chart";

type WoStatus = "OPEN" | "DIAGNOSED" | "WAITING_PARTS" | "IN_PROGRESS" | "QUALITY_CHECK" | "COMPLETED" | "DELIVERED";

type RecentWorkOrder = {
  id: string;
  woNumber: string;
  status: WoStatus;
  priority: string;
  complaint: string;
  createdAt: string;
  customer: { firstName: string; lastName: string; companyName: string | null };
  vehicle: { make: string; model: string; licensePlate: string };
  assignedMechanic: { firstName: string; lastName: string } | null;
};

type StatusBreakdownItem = {
  status: string;
  count: number;
};

type DashboardStats = {
  totalWorkOrders: number;
  vehiclesInShop: number;
  totalCustomers: number;
  totalRevenue: number;
  statusBreakdown: StatusBreakdownItem[];
};

const STATUS_STYLES: Record<WoStatus, string> = {
  OPEN: "bg-blue-50 text-blue-700",
  DIAGNOSED: "bg-purple-50 text-purple-700",
  WAITING_PARTS: "bg-amber-50 text-amber-700",
  IN_PROGRESS: "bg-cyan-50 text-cyan-700",
  QUALITY_CHECK: "bg-violet-50 text-violet-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  DELIVERED: "bg-gray-100 text-gray-700",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentWorkOrders, setRecentWorkOrders] = useState<RecentWorkOrder[]>([]);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, woRes] = await Promise.all([
        api.get<{ data: DashboardStats }>("/dashboard/stats"),
        api.get<{
          data: { data: RecentWorkOrder[]; meta: { totalCount: number } };
          meta: { timestamp: string; requestId: string };
        }>("/work-orders", { page: 1, pageSize: 50, notStatus: "DELIVERED" }),
      ]);
      setStats(statsRes.data);
      const allOrders: RecentWorkOrder[] = (woRes.data as any).data || [];
      setRecentWorkOrders(allOrders.filter((o) => o.status !== "DELIVERED"));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const cards = [
    {
      title: "Active Work Orders",
      value: stats?.totalWorkOrders ?? "—",
      icon: Wrench,
      href: "/dashboard/work-orders",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Vehicles in Shop",
      value: stats?.vehiclesInShop ?? "—",
      icon: Car,
      href: "/dashboard/work-orders",
      color: "text-cyan-600",
      bg: "bg-cyan-50",
    },
    {
      title: "Total Customers",
      value: stats?.totalCustomers ?? "—",
      icon: Users,
      href: "/dashboard/customers",
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      title: "Total Revenue",
      value: stats ? formatCurrency(stats.totalRevenue) : "—",
      icon: DollarSign,
      href: "/dashboard/work-orders",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-0.5">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Overview of your workshop operations
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Link key={stat.title} href={stat.href}>
                  <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                    <CardHeader className="flex-row items-center justify-between pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                      <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </CardTitle>
                      <div className={cn("rounded-lg p-1.5 sm:p-2", stat.bg)}>
                        <Icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", stat.color)} />
                      </div>
                    </CardHeader>
                    <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                      <div className="text-lg sm:text-2xl font-semibold">{stat.value}</div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="min-w-0">
              <CardHeader className="flex-row items-center justify-between px-4 sm:px-6 pt-4 sm:pt-6">
                <CardTitle className="text-sm font-medium">Recent Work Orders</CardTitle>
                <Link href="/dashboard/work-orders">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    View All <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                {recentWorkOrders.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    No work orders yet
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {recentWorkOrders.map((wo) => (
                      <div
                        key={wo.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 text-sm gap-0.5 sm:gap-0"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[11px] sm:text-xs font-medium">{wo.woNumber}</span>
                            <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium", STATUS_STYLES[wo.status])}>
                              {wo.status.replace(/_/g, " ")}
                            </span>
                          </div>
                          <p className="text-muted-foreground text-[11px] sm:text-xs mt-0.5 truncate">
                            {wo.vehicle.make} {wo.vehicle.model} — {wo.customer.firstName} {wo.customer.lastName}
                          </p>
                        </div>
                        <span className="text-[11px] sm:text-xs text-muted-foreground sm:ml-4 shrink-0">
                          {formatDate(wo.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="min-w-0">
              <CardHeader className="flex-row items-center justify-between px-4 sm:px-6 pt-4 sm:pt-6">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <div className="-mx-2 sm:mx-0">
                  <MonthlyRevenueChart />
                </div>
              </CardContent>
            </Card>

            <Card className="min-w-0">
              <CardHeader className="flex-row items-center justify-between px-4 sm:px-6 pt-4 sm:pt-6">
                <CardTitle className="text-sm font-medium">Work Order Status</CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                {stats?.statusBreakdown ? (
                  <WorkOrderStatusChart data={stats.statusBreakdown} />
                ) : (
                  <div className="flex items-center justify-center py-10 text-center">
                    <p className="text-sm text-muted-foreground">No status data available.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
