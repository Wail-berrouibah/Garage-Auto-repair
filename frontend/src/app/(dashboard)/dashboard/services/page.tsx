"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import * as Dialog from "@radix-ui/react-dialog";
import { Search, Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string | null;
  defaultRate: number;
  rateUnit: "HOURLY" | "FIXED";
  estimatedHours: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface ServiceFormData {
  code: string;
  name: string;
  description: string;
  category: string;
  defaultRate: string;
  rateUnit: "HOURLY" | "FIXED";
  estimatedHours: string;
}

const emptyForm: ServiceFormData = {
  code: "",
  name: "",
  description: "",
  category: "",
  defaultRate: "",
  rateUnit: "HOURLY",
  estimatedHours: "",
};

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{
        data: { data: Service[]; meta: PaginationMeta };
        meta: { timestamp: string; requestId: string };
      }>("/services", {
        page,
        pageSize: 25,
        search: search || undefined,
        category: category || undefined,
      });
      setServices(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      console.error("Failed to fetch services:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, category]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (svc: Service) => {
    setEditingId(svc.id);
    setForm({
      code: svc.code,
      name: svc.name,
      description: svc.description || "",
      category: svc.category || "",
      defaultRate: String(svc.defaultRate),
      rateUnit: svc.rateUnit,
      estimatedHours: svc.estimatedHours ? String(svc.estimatedHours) : "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {
        code: form.code,
        name: form.name,
        description: form.description || undefined,
        category: form.category || undefined,
        defaultRate: Number(form.defaultRate),
        rateUnit: form.rateUnit,
        estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : undefined,
      };
      if (editingId) {
        await api.patch(`/services/${editingId}`, body);
      } else {
        await api.post("/services", body);
      }
      setDialogOpen(false);
      fetchServices();
    } catch (err) {
      console.error("Failed to save service:", err);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.patch(`/services/${deleteId}`, { isActive: false });
      setDeleteId(null);
      fetchServices();
    } catch (err) {
      console.error("Failed to deactivate service:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Services Catalog</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your workshop service offerings
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add Service
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, code, or category..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            className="pl-9"
          />
        </div>
        <Input
          placeholder="Filter by category..."
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="max-w-[200px]"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Code</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Name</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Category</th>
                  <th className="text-right font-medium text-muted-foreground px-4 py-3">Default Rate</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Rate Unit</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Status</th>
                  <th className="text-right font-medium text-muted-foreground px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                    </td>
                  </tr>
                ) : services.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-12 text-muted-foreground"
                    >
                      No services found
                    </td>
                  </tr>
                ) : (
                  services.map((svc) => (
                    <tr
                      key={svc.id}
                      className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs">{svc.code}</td>
                      <td className="px-4 py-3 font-medium">{svc.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {svc.category || "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        ${svc.defaultRate.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">{svc.rateUnit}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                            svc.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {svc.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(svc)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(svc.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {(meta.page - 1) * meta.pageSize + 1}-
              {Math.min(meta.page * meta.pageSize, meta.totalCount)} of{" "}
              {meta.totalCount}
            </p>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasPreviousPage}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-background rounded-xl shadow-lg border border-border p-6 data-[state=open]:animate-in data-[state=closed]:animate-out">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-lg font-semibold">
                {editingId ? "Edit Service" : "Add Service"}
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon">
                  <X className="h-4 w-4" />
                </Button>
              </Dialog.Close>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    value={form.code}
                    onChange={(e) =>
                      setForm({ ...form, code: e.target.value })
                    }
                    placeholder="e.g. OIL-CHG"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    placeholder="e.g. Oil Change"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Brief description of the service..."
                  className="flex min-h-[80px] w-full rounded-[var(--radius-md)] border border-border bg-input px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    placeholder="e.g. Maintenance"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rateUnit">Rate Unit</Label>
                  <select
                    id="rateUnit"
                    value={form.rateUnit}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        rateUnit: e.target.value as "HOURLY" | "FIXED",
                      })
                    }
                    className="flex h-10 w-full rounded-[var(--radius-md)] border border-border bg-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="HOURLY">HOURLY</option>
                    <option value="FIXED">FIXED</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultRate">Default Rate ($)</Label>
                  <Input
                    id="defaultRate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.defaultRate}
                    onChange={(e) =>
                      setForm({ ...form, defaultRate: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimatedHours">Estimated Hours</Label>
                  <Input
                    id="estimatedHours"
                    type="number"
                    step="0.5"
                    min="0"
                    value={form.estimatedHours}
                    onChange={(e) =>
                      setForm({ ...form, estimatedHours: e.target.value })
                    }
                    placeholder="e.g. 1.5"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Dialog.Close asChild>
                <Button variant="outline">Cancel</Button>
              </Dialog.Close>
              <Button
                onClick={handleSave}
                disabled={saving || !form.code || !form.name}
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingId ? "Update" : "Create"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Confirmation Dialog */}
      <Dialog.Root
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-background rounded-xl shadow-lg border border-border p-6">
            <Dialog.Title className="text-lg font-semibold">
              Delete Service
            </Dialog.Title>
            <p className="text-sm text-muted-foreground mt-2">
              Are you sure you want to deactivate this service? This action can
              be reversed later.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setDeleteId(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Deactivate
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
