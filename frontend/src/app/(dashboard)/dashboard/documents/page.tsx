"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { Loader2, Download, Wrench, Users, Car, Receipt, BookOpen } from "lucide-react";

const EXPORT_TYPES = {
  WORK_ORDER: {
    label: "Work Orders",
    icon: Wrench,
    endpoint: "/work-orders",
    params: {},
    headers: [
      "ID", "Order #", "Status", "Customer Name", "Company", "Vehicle",
      "Complaint", "Description", "Actual Total", "Assigned To",
      "Labor Entries", "Part Entries", "Created At",
    ],
    row: (wo: any) => [
      wo.id, wo.woNumber || "", wo.status || "",
      `${wo.customer?.firstName || ""} ${wo.customer?.lastName || ""}`.trim(),
      wo.customer?.companyName || "",
      `${wo.vehicle?.make || ""} ${wo.vehicle?.model || ""} ${wo.vehicle?.licensePlate || ""}`.trim(),
      wo.complaint || "", wo.description || "",
      wo.actualTotal ?? 0,
      `${wo.assignedMechanic?.firstName || ""} ${wo.assignedMechanic?.lastName || ""}`.trim(),
      wo._count?.laborEntries ?? 0, wo._count?.partEntries ?? 0,
      new Date(wo.createdAt).toLocaleDateString(),
    ],
  },
  CUSTOMER: {
    label: "Customers",
    icon: Users,
    endpoint: "/customers",
    params: {},
    headers: ["ID", "First Name", "Last Name", "Company", "Email", "Phone", "Vehicles", "Work Orders", "Created At"],
    row: (c: any) => [
      c.id, c.firstName || "", c.lastName || "", c.companyName || "",
      c.email || "", c.phone || "",
      c._count?.vehicles ?? 0, c._count?.workOrders ?? 0,
      new Date(c.createdAt).toLocaleDateString(),
    ],
  },
  VEHICLE: {
    label: "Vehicles",
    icon: Car,
    endpoint: "/vehicles",
    params: {},
    headers: ["ID", "License Plate", "VIN", "Make", "Model", "Year", "Color", "Branch", "Created At"],
    row: (v: any) => [
      v.id, v.licensePlate || "", v.vin || "", v.make || "", v.model || "",
      v.year ?? "", v.color || "", v.branch?.name || "",
      new Date(v.createdAt).toLocaleDateString(),
    ],
  },
  INVOICE: {
    label: "Invoices",
    icon: Receipt,
    endpoint: "/invoices",
    params: {},
    headers: ["ID", "Invoice #", "Status", "Total", "Amount Paid", "Work Order", "Created At"],
    row: (inv: any) => [
      inv.id, inv.invoiceNumber || inv.number || "", inv.status || "",
      inv.total ?? 0, inv.amountPaid ?? 0,
      inv.workOrder?.woNumber || "",
      new Date(inv.createdAt).toLocaleDateString(),
    ],
  },
  SERVICE: {
    label: "Services",
    icon: BookOpen,
    endpoint: "/services",
    params: {},
    headers: ["ID", "Name", "Category", "Description", "Price", "Is Active", "Created At"],
    row: (s: any) => [
      s.id, s.name || "", s.category || "", s.description || "",
      s.price ?? 0, s.isActive ? "Yes" : "No",
      new Date(s.createdAt).toLocaleDateString(),
    ],
  },
};

type ExportKey = keyof typeof EXPORT_TYPES;

export default function DocumentsPage() {
  const [selected, setSelected] = useState<ExportKey>("WORK_ORDER");
  const [exporting, setExporting] = useState(false);
  const [exportedCount, setExportedCount] = useState<number | null>(null);

  async function handleExport() {
    const cfg = EXPORT_TYPES[selected];
    setExporting(true);
    setExportedCount(null);
    try {
      const pageSize = 100;
      let page = 1;
      let allItems: any[] = [];

      while (true) {
        const res = await api.get<any>(cfg.endpoint, { ...cfg.params, page, pageSize });
        const items: any[] = res.data?.data || res.data || [];
        allItems = allItems.concat(items);
        const totalCount = res.data?.meta?.totalCount ?? res.meta?.totalCount ?? 0;
        if (page * pageSize >= totalCount || items.length === 0) break;
        page++;
      }

      const csv = [
        cfg.headers.join(","),
        ...allItems.map((item) =>
          cfg.row(item).map((val: unknown) => `"${String(val ?? "").replace(/"/g, '""')}"`).join(","),
        ),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selected.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setExportedCount(allItems.length);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  }

  const currentCfg = EXPORT_TYPES[selected];
  const Icon = currentCfg.icon;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Data Export</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Export your data as CSV files
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Export Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-1.5">
              <Label>Select data to export</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mt-1.5">
                {(Object.entries(EXPORT_TYPES) as [ExportKey, typeof currentCfg][]).map(([key, cfg]) => {
                  const ItemIcon = cfg.icon;
                  const isActive = selected === key;
                  return (
                    <button
                      key={key}
                      onClick={() => { setSelected(key); setExportedCount(null); }}
                      className={[
                        "flex flex-col items-center gap-1.5 p-3 rounded-lg border text-sm transition-colors",
                        isActive
                          ? "border-primary bg-primary/5 text-primary font-medium"
                          : "border-border hover:border-primary/50 hover:bg-muted/50",
                      ].join(" ")}
                    >
                      <ItemIcon className="h-5 w-5" />
                      <span>{cfg.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-5 pt-4 border-t border-border">
            <Button onClick={handleExport} disabled={exporting} size="lg">
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Download {currentCfg.label} CSV
            </Button>
            {exportedCount !== null && (
              <span className="text-sm text-emerald-600 font-medium">
                Exported {exportedCount} {currentCfg.label.toLowerCase()}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Available Exports</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p><strong>Work Orders</strong> — ID, Order #, Status, Customer, Vehicle, Complaint, Description, Total, Assigned Mechanic, Entry counts, Created date</p>
          <p><strong>Customers</strong> — ID, Name, Company, Email, Phone, Vehicle/Work Order counts, Created date</p>
          <p><strong>Vehicles</strong> — ID, License Plate, VIN, Make, Model, Year, Color, Branch, Created date</p>
          <p><strong>Invoices</strong> — ID, Invoice #, Status, Total, Amount Paid, Work Order, Created date</p>
          <p><strong>Services</strong> — ID, Name, Category, Description, Price, Active status, Created date</p>
        </CardContent>
      </Card>
    </div>
  );
}
