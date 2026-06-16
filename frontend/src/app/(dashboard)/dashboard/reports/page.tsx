"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign, Wrench, Users, Package,
  Loader2, AlertTriangle, Building2,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Tab = "financial" | "workshop" | "mechanic" | "inventory" | "customers";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "financial", label: "Financial", icon: <DollarSign className="h-4 w-4" /> },
  { key: "workshop", label: "Workshop", icon: <Wrench className="h-4 w-4" /> },
  { key: "mechanic", label: "Mechanic", icon: <Users className="h-4 w-4" /> },
  { key: "inventory", label: "Inventory", icon: <Package className="h-4 w-4" /> },
  { key: "customers", label: "Customers", icon: <Building2 className="h-4 w-4" /> },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function CardStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-xl font-semibold">{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("financial");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<any>(`/reports/${activeTab}`);
      setData(res.data ?? res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  function renderFinancial() {
    if (!data) return null;
    return (
      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <CardStat label="Total Revenue" value={formatCurrency(data.totalRevenue)} />
          <CardStat label="Average per Work Order" value={formatCurrency(data.averageRevenue)} />
          <CardStat label="Completed Orders" value={String(data.completedWorkOrders)} sub={`Out of ${data.totalWorkOrders} total`} />
          <CardStat label="Invoices Issued" value={String(data.invoiceCount)} />
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <CardStat label="Total Invoiced" value={formatCurrency(data.totalInvoiced)} />
          <CardStat label="Total Collected" value={formatCurrency(data.totalCollected)} />
          <CardStat label="Outstanding" value={formatCurrency(data.outstanding)} />
        </div>
        {data.monthlyRevenue?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.monthlyRevenue.map((m: { month: string; revenue: number }) => (
                  <div key={m.month} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{m.month}</span>
                    <div className="flex items-center gap-3 flex-1 ml-4">
                      <div
                        className="h-2 rounded-full bg-primary/20"
                        style={{
                          width: `${Math.min((m.revenue / Math.max(...data.monthlyRevenue.map((x: any) => x.revenue))) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <span className="font-mono text-xs">{formatCurrency(m.revenue)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  function renderWorkshop() {
    if (!data) return null;
    return (
      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <CardStat label="Total Labor Hours" value={`${(data.totalLaborHours ?? 0).toFixed(1)}h`} />
          <CardStat label="Labor Revenue" value={formatCurrency(data.totalLaborRevenue ?? 0)} />
          <CardStat label="Avg Completion" value={`${(data.averageCompletionDays ?? 0).toFixed(1)} days`} />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Work Orders by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(data.statusBreakdown ?? []).map((s: { status: string; count: number }) => (
                <div key={s.status} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{s.status.replace(/_/g, " ")}</span>
                  <span className="font-mono text-xs">{s.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        {data.topServices?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Top Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(data.topServices ?? []).map((s: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="font-medium">Service #{s.serviceId?.slice(0, 8)}</span>
                    <span className="font-mono text-xs">{s._count} times — {formatCurrency(s._sum?.lineTotal ?? 0)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  function renderMechanic() {
    if (!Array.isArray(data) || data.length === 0) return <p className="text-sm text-muted-foreground py-8 text-center">No mechanic data available</p>;
    return (
      <div className="space-y-4">
        {data.map((m: any) => (
          <Card key={m.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{m.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Work Orders</p>
                  <p className="text-lg font-semibold">{m.workOrders}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Labor Hours</p>
                  <p className="text-lg font-semibold">{(m.laborHours ?? 0).toFixed(1)}h</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                  <p className="text-lg font-semibold">{formatCurrency(m.laborRevenue ?? 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Clocked Time</p>
                  <p className="text-lg font-semibold">{((m.clockedMinutes ?? 0) / 60).toFixed(1)}h</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  function renderInventory() {
    if (!data) return null;
    return (
      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <CardStat label="Total Items" value={String(data.totalItems)} />
          <CardStat label="Stock Value (Cost)" value={formatCurrency(data.totalStockValue)} />
          <CardStat label="Stock Value (Retail)" value={formatCurrency(data.totalSellingValue)} />
          <CardStat label="Low Stock Items" value={String(data.lowStockCount)} />
        </div>
        {data.lowStockItems?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Low Stock Items
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {data.lowStockItems.map((i: any) => (
                  <div key={i.id} className="flex items-center justify-between px-6 py-3 text-sm">
                    <div>
                      <p className="font-medium">{i.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{i.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-destructive">{i.available} available</p>
                      <p className="text-xs text-muted-foreground">Reorder at {i.reorderPoint}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        {data.categoryBreakdown?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.categoryBreakdown.map((c: any) => (
                  <div key={c.category} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{c.category}</span>
                    <span className="text-xs text-muted-foreground">{c.count} items</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  function renderCustomers() {
    if (!data) return null;
    return (
      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <CardStat label="Total Customers" value={String(data.totalCustomers)} />
          <CardStat label="New Customers (period)" value={String(data.newCustomers)} />
        </div>
        {data.topCustomers?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Top Customers</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {data.topCustomers.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between px-6 py-3 text-sm">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-xs text-muted-foreground">{c.workOrderCount} work orders</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Analytics and insights for your workshop
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-1 border-b border-border pb-0.5 max-h-48 md:max-h-none overflow-y-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-md transition-colors shrink-0",
              activeTab === tab.key
                ? "bg-card text-foreground border md:border-b-0 border-border"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {activeTab === "financial" && renderFinancial()}
          {activeTab === "workshop" && renderWorkshop()}
          {activeTab === "mechanic" && renderMechanic()}
          {activeTab === "inventory" && renderInventory()}
          {activeTab === "customers" && renderCustomers()}
        </>
      )}
    </div>
  );
}
