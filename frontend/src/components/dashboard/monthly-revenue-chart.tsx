"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { api, ApiError } from "@/lib/api";
import { Loader2, ShieldAlert } from "lucide-react";

type MonthlyRevenue = {
  month: string;
  revenue: number;
};

type FinancialReport = {
  monthlyRevenue: MonthlyRevenue[];
};

function formatMonth(month: string) {
  const [y, m] = month.split("-");
  const date = new Date(+y, +m - 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function MonthlyRevenueChart() {
  const [data, setData] = useState<MonthlyRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setForbidden(false);
      setError(false);
      try {
        const res = await api.get<{ data: FinancialReport }>(
          "/reports/financial"
        );
        if (!cancelled) setData(res.data.monthlyRevenue || []);
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 403) {
          setForbidden(true);
        } else {
          setError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <ShieldAlert className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          Revenue chart is available for managers only.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-10 text-center">
        <p className="text-sm text-muted-foreground">
          Failed to load revenue data.
        </p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-center">
        <p className="text-sm text-muted-foreground">
          No revenue data yet.
        </p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    monthLabel: formatMonth(d.month),
    revenue: Number(d.revenue),
  }));

  const maxRevenue = Math.max(...chartData.map((d) => d.revenue), 1);

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="monthLabel"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={{ stroke: "hsl(var(--border))" }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            domain={[0, Math.ceil(maxRevenue * 1.15 / 1000) * 1000]}
          />
          <Tooltip
            formatter={(value) => [formatCurrency(Number(value)), "Revenue"]}
            labelFormatter={(label) => label}
            contentStyle={{
              borderRadius: 6,
              border: "1px solid hsl(var(--border))",
              fontSize: 13,
            }}
          />
          <Bar
            dataKey="revenue"
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
