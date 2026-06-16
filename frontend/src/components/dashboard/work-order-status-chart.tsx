"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type StatusBreakdownItem = {
  status: string;
  count: number;
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: "#3b82f6",
  DIAGNOSED: "#a855f7",
  WAITING_PARTS: "#f59e0b",
  IN_PROGRESS: "#06b6d4",
  QUALITY_CHECK: "#8b5cf6",
  COMPLETED: "#10b981",
  DELIVERED: "#6b7280",
};

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}

function StatusTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { status, count } = payload[0].payload;
  return (
    <div className="rounded-lg border bg-popover px-3 py-1.5 text-xs shadow-md">
      <span className="font-medium">{formatStatus(status)}</span>: {count}
    </div>
  );
}

type Props = {
  data: StatusBreakdownItem[];
};

export default function WorkOrderStatusChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-center">
        <p className="text-sm text-muted-foreground">No work orders yet.</p>
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.count, 0);

  const chartData = data
    .filter((d) => d.count > 0)
    .map((d) => ({
      ...d,
      fill: STATUS_COLORS[d.status] || "#94a3b8",
    }));

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="shrink-0">
        <ResponsiveContainer width={180} height={180}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="status"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={78}
              paddingAngle={2}
              strokeWidth={0}
            >
              {chartData.map((entry, i) => (
                <Cell key={entry.status} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<StatusTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-1 gap-x-4 gap-y-1.5">
        {chartData.map((d) => (
          <div key={d.status} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: d.fill }}
            />
            <span className="text-muted-foreground truncate">
              {formatStatus(d.status)}
            </span>
            <span className="font-medium tabular-nums ml-auto">
              {d.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
