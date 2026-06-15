"use client";

import { useCallback, useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Search, Plus, Pencil, X, Loader2, Building2, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Branch = {
  id: string;
  code: string;
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
  email?: string;
  taxId?: string;
  currency: string;
  timezone: string;
  isActive: boolean;
};

type FormData = {
  code: string;
  name: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  email: string;
  taxId: string;
  currency: string;
  timezone: string;
};

const defaults: FormData = {
  code: "",
  name: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  zipCode: "",
  country: "US",
  phone: "",
  email: "",
  taxId: "",
  currency: "USD",
  timezone: "America/New_York",
};

const labels: Record<keyof FormData, string> = {
  code: "Code",
  name: "Name",
  addressLine1: "Address Line 1",
  addressLine2: "Address Line 2",
  city: "City",
  state: "State",
  zipCode: "Zip Code",
  country: "Country",
  phone: "Phone",
  email: "Email",
  taxId: "Tax ID",
  currency: "Currency",
  timezone: "Timezone",
};

const required: (keyof FormData)[] = ["code", "name", "addressLine1", "city", "state", "zipCode"];

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [data, setData] = useState<FormData>(defaults);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<{ data: Branch[] }>("/branches", {
        search: query || undefined,
      });
      setBranches(res.data);
    } catch (err) {
      console.error("Failed to fetch branches:", err);
      setBranches([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { fetch(); }, [fetch]);

  function f(key: keyof FormData, val: string) {
    setData({ ...data, [key]: val });
  }

  function openCreate() {
    setEditId(null);
    setData(defaults);
    setErrors({});
    setOpen(true);
  }

  async function openEdit(id: string) {
    try {
      setSaving(true);
      const res = await api.get<{ data: Branch }>(`/branches/${id}`);
      const b = res.data;
      setEditId(id);
      setData({
        code: b.code, name: b.name,
        addressLine1: b.addressLine1, addressLine2: b.addressLine2 || "",
        city: b.city, state: b.state, zipCode: b.zipCode,
        country: b.country, phone: b.phone || "", email: b.email || "",
        taxId: b.taxId || "", currency: b.currency, timezone: b.timezone,
      });
      setErrors({});
      setOpen(true);
    } catch (err) { console.error("Failed to fetch branch:", err); } finally { setSaving(false); }
  }

  function validate() {
    const errs: Partial<Record<keyof FormData, string>> = {};
    for (const k of required) { if (!data[k].trim()) errs[k] = `${labels[k]} is required`; }
    if (data.code.length > 10) errs.code = "Code must be 10 characters or less";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    setSaving(true);
    try {
      editId ? await api.patch(`/branches/${editId}`, data) : await api.post("/branches", data);
      setOpen(false);
      fetch();
    } catch (err) { console.error("Failed to save branch:", err); } finally { setSaving(false); }
  }

  async function toggleActive(b: Branch) {
    try {
      await api.patch(`/branches/${b.id}`, { isActive: !b.isActive });
      fetch();
    } catch (err) { console.error("Failed to toggle branch status:", err); }
  }

  async function confirmDelete(b: Branch) {
    if (!window.confirm(`Delete branch "${b.name}" (${b.code})? This action cannot be undone.`)) return;
    try {
      await api.delete(`/branches/${b.id}`);
      fetch();
    } catch (err) { console.error("Failed to delete branch:", err); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Branches</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your business locations</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Branch
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search branches..." className="pl-9 max-w-sm" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Code", "Name", "City", "State", "Phone", "Email", "Status", "Actions"].map((h) => (
                  <th key={h} className={cn("px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider", h === "Actions" && "text-right")}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" /> Loading branches...
                  </td>
                </tr>
              ) : branches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground">
                    <Building2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    {query ? "No branches match your search" : "No branches yet"}
                  </td>
                </tr>
              ) : (
                branches.map((b) => (
                  <tr key={b.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{b.code}</td>
                    <td className="px-4 py-3 font-medium">{b.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{b.city}</td>
                    <td className="px-4 py-3 text-muted-foreground">{b.state}</td>
                    <td className="px-4 py-3 text-muted-foreground">{b.phone || "\u2014"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{b.email || "\u2014"}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", b.isActive ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" : "bg-gray-50 text-gray-600 ring-gray-500/10")}>
                        {b.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => toggleActive(b)} title={b.isActive ? "Deactivate" : "Activate"}>
                          {b.isActive ? <ToggleRight className="h-3.5 w-3.5 text-emerald-600" /> : <ToggleLeft className="h-3.5 w-3.5 text-muted-foreground" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(b.id)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => confirmDelete(b)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl bg-card border border-border shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <Dialog.Title className="text-lg font-semibold tracking-tight">
                {editId ? "Edit Branch" : "Add Branch"}
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8"><X className="h-4 w-4" /></Button>
              </Dialog.Close>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label={labels.code} error={errors.code} required>
                  <Input value={data.code} onChange={(e) => f("code", e.target.value)} maxLength={10} placeholder="BR-001" />
                </Field>
                <Field label={labels.name} error={errors.name} required>
                  <Input value={data.name} onChange={(e) => f("name", e.target.value)} placeholder="Downtown Auto Care" />
                </Field>
              </div>

              <Field label={labels.addressLine1} error={errors.addressLine1} required>
                <Input value={data.addressLine1} onChange={(e) => f("addressLine1", e.target.value)} placeholder="123 Main St" />
              </Field>
              <Field label={labels.addressLine2}>
                <Input value={data.addressLine2} onChange={(e) => f("addressLine2", e.target.value)} placeholder="Suite 100" />
              </Field>

              <div className="grid grid-cols-3 gap-4">
                <Field label={labels.city} error={errors.city} required>
                  <Input value={data.city} onChange={(e) => f("city", e.target.value)} placeholder="New York" />
                </Field>
                <Field label={labels.state} error={errors.state} required>
                  <Input value={data.state} onChange={(e) => f("state", e.target.value)} placeholder="NY" />
                </Field>
                <Field label={labels.zipCode} error={errors.zipCode} required>
                  <Input value={data.zipCode} onChange={(e) => f("zipCode", e.target.value)} placeholder="10001" />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label={labels.country}>
                  <Input value={data.country} onChange={(e) => f("country", e.target.value)} />
                </Field>
                <Field label={labels.phone}>
                  <Input value={data.phone} onChange={(e) => f("phone", e.target.value)} placeholder="+1 (555) 000-0000" />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label={labels.email}>
                  <Input type="email" value={data.email} onChange={(e) => f("email", e.target.value)} placeholder="branch@example.com" />
                </Field>
                <Field label={labels.taxId}>
                  <Input value={data.taxId} onChange={(e) => f("taxId", e.target.value)} placeholder="XX-XXXXXXX" />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label={labels.currency}>
                  <Input value={data.currency} onChange={(e) => f("currency", e.target.value)} />
                </Field>
                <Field label={labels.timezone}>
                  <Input value={data.timezone} onChange={(e) => f("timezone", e.target.value)} />
                </Field>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-border">
              <Dialog.Close asChild><Button variant="outline">Cancel</Button></Dialog.Close>
              <Button onClick={submit} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editId ? "Save Changes" : "Create Branch"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function Field({ label, children, error, required }: {
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
