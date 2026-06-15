"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Loader2, Save, Building2, Settings2, Receipt, Wrench } from "lucide-react";

type Branch = {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  settings?: Record<string, unknown>;
};

type BranchSettings = {
  defaultCurrency: string;
  timezone: string;
  defaultLaborRate: number;
  invoicePrefix: string;
  invoiceFooter: string;
  defaultPaymentTerms: number;
  defaultDueDays: number;
  defaultWorkOrderStatus: string;
  autoAssignMechanic: boolean;
  receiptFooter: string;
  taxRate: number;
};

const defaultSettings: BranchSettings = {
  defaultCurrency: "USD",
  timezone: "America/New_York",
  defaultLaborRate: 85,
  invoicePrefix: "INV-",
  invoiceFooter: "Thank you for your business!",
  defaultPaymentTerms: 30,
  defaultDueDays: 15,
  defaultWorkOrderStatus: "PENDING",
  autoAssignMechanic: false,
  receiptFooter: "All services guaranteed for 12 months or 12,000 miles.",
  taxRate: 0,
};

type Tab = "general" | "invoicing" | "workOrder";

export default function SettingsPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [settings, setSettings] = useState<BranchSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("general");

  const fetchBranches = useCallback(async () => {
    try {
      const res = await api.get<{ data: Branch[] }>("/branches");
      const list = res.data;
      setBranches(list);
      if (list.length > 0 && !selectedBranchId) {
        setSelectedBranchId(list[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch branches:", err);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    if (!selectedBranchId) return;
    setLoading(true);
    try {
      const res = await api.get<{ data: Branch }>(`/branches/${selectedBranchId}`);
      const branch = res.data;
      setSettings({ ...defaultSettings, ...(branch.settings || {}) });
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId]);

  useEffect(() => { fetchBranches(); }, []);
  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await api.patch(`/branches/${selectedBranchId}`, { settings });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  }

  function set<T extends keyof BranchSettings>(key: T, val: BranchSettings[T]) {
    setSettings((prev) => ({ ...prev, [key]: val }));
  }

  const selectedBranch = branches.find((b) => b.id === selectedBranchId);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "general", label: "General", icon: <Settings2 className="h-4 w-4" /> },
    { key: "invoicing", label: "Invoicing", icon: <Receipt className="h-4 w-4" /> },
    { key: "workOrder", label: "Work Order", icon: <Wrench className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure your branch preferences</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label>Branch</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors mt-1.5"
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
              >
                {branches
                  .filter((b) => b.isActive)
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
              </select>
            </div>
            {selectedBranch && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-5">
                <Building2 className="h-4 w-4" />
                <span>{selectedBranch.name}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="flex gap-1 border-b border-border pb-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-md transition-colors",
                  activeTab === tab.key
                    ? "bg-card text-foreground border border-b-0 border-border"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <Card>
            <CardContent className="pt-6 space-y-5">
              {activeTab === "general" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Default Currency</Label>
                      <Input
                        value={settings.defaultCurrency}
                        onChange={(e) => set("defaultCurrency", e.target.value)}
                        placeholder="USD"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Timezone</Label>
                      <Input
                        value={settings.timezone}
                        onChange={(e) => set("timezone", e.target.value)}
                        placeholder="America/New_York"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Default Labor Rate ($/hr)</Label>
                      <Input
                        type="number"
                        value={settings.defaultLaborRate}
                        onChange={(e) => set("defaultLaborRate", Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Tax Rate (%)</Label>
                      <Input
                        type="number"
                        value={settings.taxRate}
                        onChange={(e) => set("taxRate", Number(e.target.value))}
                      />
                    </div>
                  </div>
                </>
              )}

              {activeTab === "invoicing" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Invoice Prefix</Label>
                      <Input
                        value={settings.invoicePrefix}
                        onChange={(e) => set("invoicePrefix", e.target.value)}
                        placeholder="INV-"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Default Payment Terms (days)</Label>
                      <Input
                        type="number"
                        value={settings.defaultPaymentTerms}
                        onChange={(e) => set("defaultPaymentTerms", Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Default Due Days</Label>
                      <Input
                        type="number"
                        value={settings.defaultDueDays}
                        onChange={(e) => set("defaultDueDays", Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Invoice Footer</Label>
                    <textarea
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors mt-1.5"
                      value={settings.invoiceFooter}
                      onChange={(e) => set("invoiceFooter", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Receipt Footer</Label>
                    <textarea
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors mt-1.5"
                      value={settings.receiptFooter}
                      onChange={(e) => set("receiptFooter", e.target.value)}
                    />
                  </div>
                </>
              )}

              {activeTab === "workOrder" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Default Work Order Status</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors mt-1.5"
                        value={settings.defaultWorkOrderStatus}
                        onChange={(e) => set("defaultWorkOrderStatus", e.target.value)}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                    </div>
                    <div className="space-y-1.5 pt-5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.autoAssignMechanic}
                          onChange={(e) => set("autoAssignMechanic", e.target.checked)}
                          className="h-4 w-4 rounded border-border"
                        />
                        <span className="text-sm font-medium">Auto-assign mechanic</span>
                      </label>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3">
            {saved && <span className="text-sm text-emerald-600 font-medium">Settings saved</span>}
            <Button onClick={save} disabled={saving || !selectedBranchId}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4" />
              Save Settings
            </Button>
          </div>
        </>
      )}
    </div>
  );
}