"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import * as Dialog from "@radix-ui/react-dialog";
import { Search, Plus, Minus, Pencil, Trash2, X, Loader2, Package } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface StockItem {
  id: string;
  sku: string;
  partNumber: string | null;
  barcode: string | null;
  name: string;
  description: string | null;
  category: string | null;
  brand: string | null;
  unitOfMeasure: string;
  quantityOnHand: number;
  quantityReserved: number;
  unitCost: number;
  sellingPrice: number;
  reorderPoint: number;
  reorderQuantity: number;
  leadTimeDays: number | null;
  isActive: boolean;
  warehouse: { id: string; name: string; code: string };
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

interface StockItemFormData {
  sku: string;
  partNumber: string;
  barcode: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  unitOfMeasure: string;
  quantityOnHand: string;
  quantityReserved: string;
  unitCost: string;
  sellingPrice: string;
  reorderPoint: string;
  reorderQuantity: string;
  leadTimeDays: string;
}

const emptyForm: StockItemFormData = {
  sku: "",
  partNumber: "",
  barcode: "",
  name: "",
  description: "",
  category: "",
  brand: "",
  unitOfMeasure: "EA",
  quantityOnHand: "0",
  quantityReserved: "0",
  unitCost: "",
  sellingPrice: "",
  reorderPoint: "0",
  reorderQuantity: "0",
  leadTimeDays: "",
};

export default function InventoryPage() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<StockItemFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{
        data: { data: StockItem[]; meta: PaginationMeta };
        meta: { timestamp: string; requestId: string };
      }>("/inventory", {
        page,
        pageSize: 25,
        search: search || undefined,
        category: category || undefined,
      });
      setItems(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      console.error("Failed to fetch inventory:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, category]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (item: StockItem) => {
    setEditingId(item.id);
    setForm({
      sku: item.sku,
      partNumber: item.partNumber || "",
      barcode: item.barcode || "",
      name: item.name,
      description: item.description || "",
      category: item.category || "",
      brand: item.brand || "",
      unitOfMeasure: item.unitOfMeasure,
      quantityOnHand: String(item.quantityOnHand),
      quantityReserved: String(item.quantityReserved),
      unitCost: String(item.unitCost),
      sellingPrice: String(item.sellingPrice),
      reorderPoint: String(item.reorderPoint),
      reorderQuantity: String(item.reorderQuantity),
      leadTimeDays: item.leadTimeDays ? String(item.leadTimeDays) : "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {
        sku: form.sku,
        partNumber: form.partNumber || undefined,
        barcode: form.barcode || undefined,
        name: form.name,
        description: form.description || undefined,
        category: form.category || undefined,
        brand: form.brand || undefined,
        unitOfMeasure: form.unitOfMeasure,
        quantityOnHand: Number(form.quantityOnHand),
        quantityReserved: Number(form.quantityReserved),
        unitCost: Number(form.unitCost),
        sellingPrice: Number(form.sellingPrice),
        reorderPoint: Number(form.reorderPoint),
        reorderQuantity: Number(form.reorderQuantity),
        leadTimeDays: form.leadTimeDays ? Number(form.leadTimeDays) : undefined,
      };
      if (editingId) {
        await api.patch(`/inventory/${editingId}`, body);
      } else {
        await api.post("/inventory", body);
      }
      setDialogOpen(false);
      fetchItems();
    } catch (err) {
      console.error("Failed to save stock item:", err);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.patch(`/inventory/${deleteId}`, { isActive: false });
      setDeleteId(null);
      fetchItems();
    } catch (err) {
      console.error("Failed to deactivate stock item:", err);
    }
  };

  const handleAdjust = async (id: string, delta: number) => {
    setAdjustingId(id);
    try {
      await api.post(`/inventory/${id}/adjust`, { quantity: delta });
      await fetchItems();
    } catch (err) {
      console.error("Failed to adjust stock:", err);
    } finally {
      setAdjustingId(null);
    }
  };

  const availableQty = (item: StockItem) =>
    Number(item.quantityOnHand) - Number(item.quantityReserved);

  const isLowStock = (item: StockItem) =>
    item.reorderPoint > 0 && availableQty(item) <= item.reorderPoint;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage stock items, track quantities, and control reordering
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add Stock Item
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, SKU, or part number..."
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
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Item</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">SKU</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Category</th>
                  <th className="text-right font-medium text-muted-foreground px-4 py-3">On Hand</th>
                  <th className="text-right font-medium text-muted-foreground px-4 py-3">Cost</th>
                  <th className="text-right font-medium text-muted-foreground px-4 py-3">Price</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Status</th>
                  <th className="text-right font-medium text-muted-foreground px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-muted-foreground">
                      <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                      No stock items found
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.brand && (
                            <p className="text-xs text-muted-foreground">{item.brand}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{item.sku}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {item.category || "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            disabled={adjustingId === item.id || !item.isActive}
                            onClick={() => handleAdjust(item.id, -1)}
                          >
                            {adjustingId === item.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Minus className="h-3 w-3" />
                            )}
                          </Button>
                          <span
                            className={cn(
                              "font-medium tabular-nums w-10 text-right",
                              isLowStock(item) && "text-destructive",
                            )}
                          >
                            {availableQty(item)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            disabled={adjustingId === item.id || !item.isActive}
                            onClick={() => handleAdjust(item.id, 1)}
                          >
                            {adjustingId === item.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Plus className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                        {item.reorderPoint > 0 && availableQty(item) <= item.reorderPoint && (
                          <p className="text-[10px] text-destructive text-right">
                            Reorder at {item.reorderPoint}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        ${item.unitCost.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        ${item.sellingPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                            item.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {item.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(item.id)}
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
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-background rounded-xl shadow-lg border border-border p-6 data-[state=open]:animate-in data-[state=closed]:animate-out max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-lg font-semibold">
                {editingId ? "Edit Stock Item" : "Add Stock Item"}
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
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    placeholder="e.g. OIL-5W30-1L"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Engine Oil 5W-30 1L"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="partNumber">Part Number</Label>
                  <Input
                    id="partNumber"
                    value={form.partNumber}
                    onChange={(e) => setForm({ ...form, partNumber: e.target.value })}
                    placeholder="e.g. 12345"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input
                    id="barcode"
                    value={form.barcode}
                    onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                    placeholder="e.g. 5901234567890"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of the item..."
                  className="flex min-h-[80px] w-full rounded-[var(--radius-md)] border border-border bg-input px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="e.g. Oils & Lubricants"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    placeholder="e.g. Shell"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitOfMeasure">Unit</Label>
                  <select
                    id="unitOfMeasure"
                    value={form.unitOfMeasure}
                    onChange={(e) => setForm({ ...form, unitOfMeasure: e.target.value })}
                    className="flex h-10 w-full rounded-[var(--radius-md)] border border-border bg-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="EA">EA (Each)</option>
                    <option value="L">L (Liter)</option>
                    <option value="KG">KG (Kilogram)</option>
                    <option value="M">M (Meter)</option>
                    <option value="BOX">BOX (Box)</option>
                    <option value="SET">SET (Set)</option>
                  </select>
                </div>
              </div>
              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-medium mb-3">Pricing & Stock</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="unitCost">Unit Cost ($) *</Label>
                    <Input
                      id="unitCost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.unitCost}
                      onChange={(e) => setForm({ ...form, unitCost: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sellingPrice">Selling Price ($) *</Label>
                    <Input
                      id="sellingPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.sellingPrice}
                      onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="leadTimeDays">Lead Time (Days)</Label>
                    <Input
                      id="leadTimeDays"
                      type="number"
                      min="0"
                      value={form.leadTimeDays}
                      onChange={(e) => setForm({ ...form, leadTimeDays: e.target.value })}
                      placeholder="e.g. 7"
                    />
                  </div>
                </div>
              </div>
              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-medium mb-3">Reorder Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reorderPoint">Reorder Point</Label>
                    <Input
                      id="reorderPoint"
                      type="number"
                      step="1"
                      min="0"
                      value={form.reorderPoint}
                      onChange={(e) => setForm({ ...form, reorderPoint: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reorderQuantity">Reorder Quantity</Label>
                    <Input
                      id="reorderQuantity"
                      type="number"
                      step="1"
                      min="0"
                      value={form.reorderQuantity}
                      onChange={(e) => setForm({ ...form, reorderQuantity: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-medium mb-3">Initial Stock</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantityOnHand">Quantity On Hand</Label>
                    <Input
                      id="quantityOnHand"
                      type="number"
                      step="1"
                      min="0"
                      value={form.quantityOnHand}
                      onChange={(e) => setForm({ ...form, quantityOnHand: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantityReserved">Quantity Reserved</Label>
                    <Input
                      id="quantityReserved"
                      type="number"
                      step="1"
                      min="0"
                      value={form.quantityReserved}
                      onChange={(e) => setForm({ ...form, quantityReserved: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Dialog.Close asChild>
                <Button variant="outline">Cancel</Button>
              </Dialog.Close>
              <Button
                onClick={handleSave}
                disabled={saving || !form.sku || !form.name || !form.unitCost || !form.sellingPrice}
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
              Deactivate Stock Item
            </Dialog.Title>
            <p className="text-sm text-muted-foreground mt-2">
              Are you sure you want to deactivate this stock item? This action
              can be reversed later.
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
