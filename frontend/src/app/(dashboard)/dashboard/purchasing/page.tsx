"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Search, Plus, Pencil, Trash2, X, Loader2, ShoppingCart, Building2,
  Eye, ChevronRight, ChevronDown, Package,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Supplier {
  id: string;
  code: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  isActive: boolean;
  createdAt: string;
}

interface PoLineItem {
  id: string;
  lineNumber: number;
  partNumber: string;
  description: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitPrice: number;
  lineTotal: number;
  stockItem?: { id: string; name: string; sku: string } | null;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: { id: string; name: string; code: string };
  status: string;
  grandTotal: number;
  orderDate: string;
  expectedDate: string | null;
  notes: string | null;
  _count?: { lineItems: number };
  lineItems?: PoLineItem[];
  creator?: { id: string; firstName: string; lastName: string };
}

interface PaginationMeta {
  page: number; pageSize: number; totalCount: number;
  totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean;
}

// ─── Status helpers ─────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SENT: "bg-blue-50 text-blue-700",
  CONFIRMED: "bg-purple-50 text-purple-700",
  SHIPPED: "bg-amber-50 text-amber-700",
  PARTIAL: "bg-orange-50 text-orange-700",
  RECEIVED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-700",
};

const NEXT_STATUS: Record<string, string[]> = {
  DRAFT: ["SENT", "CANCELLED"],
  SENT: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["PARTIAL", "RECEIVED", "CANCELLED"],
  PARTIAL: ["RECEIVED", "CANCELLED"],
  RECEIVED: [],
  CANCELLED: [],
};

// ─── Supplier Form ──────────────────────────────────────────────────────────

interface SupplierFormData {
  code: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  city: string;
}

const emptySupplierForm: SupplierFormData = {
  code: "", name: "", contactPerson: "", email: "", phone: "", city: "",
};

// ─── PO Line Item Form ──────────────────────────────────────────────────────

interface PoLineFormData {
  partNumber: string;
  description: string;
  quantityOrdered: string;
  unitPrice: string;
  stockItemId?: string;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PurchasingPage() {
  const [tab, setTab] = useState<"orders" | "suppliers">("orders");

  // Shared
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Purchase Orders
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [ordersMeta, setOrdersMeta] = useState<PaginationMeta | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  // Suppliers
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [suppliersMeta, setSuppliersMeta] = useState<PaginationMeta | null>(null);

  // Dialogs
  const [poDialogOpen, setPoDialogOpen] = useState(false);
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [supplierForm, setSupplierForm] = useState<SupplierFormData>(emptySupplierForm);
  const [savingSupplier, setSavingSupplier] = useState(false);
  const [deleteSupplierId, setDeleteSupplierId] = useState<string | null>(null);
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);

  // Create PO
  const [poSupplierId, setPoSupplierId] = useState("");
  const [poNotes, setPoNotes] = useState("");
  const [poLineItems, setPoLineItems] = useState<PoLineFormData[]>([]);
  const [savingPo, setSavingPo] = useState(false);
  const [supplierList, setSupplierList] = useState<Supplier[]>([]);

  // View PO detail
  const [viewPoId, setViewPoId] = useState<string | null>(null);
  const [viewPo, setViewPo] = useState<PurchaseOrder | null>(null);
  const [loadingView, setLoadingView] = useState(false);

  // ─── Fetch orders ────────────────────────────────────────────────────────

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{
        data: { data: PurchaseOrder[]; meta: PaginationMeta };
      }>("/purchase-orders", {
        page, pageSize: 25,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setOrders(res.data.data);
      setOrdersMeta(res.data.meta);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  const fetchSuppliers = useCallback(async () => {
    try {
      const res = await api.get<{
        data: { data: Supplier[]; meta: PaginationMeta };
      }>("/suppliers", { page: 1, pageSize: 100 });
      setSupplierList(res.data.data);
    } catch { /* ignore */ }
  }, []);

  const fetchSuppliersPage = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{
        data: { data: Supplier[]; meta: PaginationMeta };
      }>("/suppliers", {
        page, pageSize: 25,
        search: search || undefined,
      });
      setSuppliers(res.data.data);
      setSuppliersMeta(res.data.meta);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    if (tab === "orders") fetchOrders();
    else fetchSuppliersPage();
  }, [tab, fetchOrders, fetchSuppliersPage]);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  // ─── View PO detail ──────────────────────────────────────────────────────

  const openViewPo = async (id: string) => {
    setViewPoId(id);
    setLoadingView(true);
    try {
      const res = await api.get<{ data: PurchaseOrder }>(`/purchase-orders/${id}`);
      setViewPo(res.data);
    } catch { /* ignore */ } finally {
      setLoadingView(false);
    }
  };

  // ─── PO Status update ────────────────────────────────────────────────────

  const updatePoStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/purchase-orders/${id}/status`, { status });
      fetchOrders();
      if (viewPoId === id) openViewPo(id);
    } catch { /* ignore */ }
  };

  // ─── Delete PO ───────────────────────────────────────────────────────────

  const confirmDeleteOrder = async () => {
    if (!deleteOrderId) return;
    try {
      await api.delete(`/purchase-orders/${deleteOrderId}`);
      setDeleteOrderId(null);
      fetchOrders();
    } catch { /* ignore */ }
  };

  // ─── Supplier CRUD ───────────────────────────────────────────────────────

  const openCreateSupplier = () => {
    setEditingSupplierId(null);
    setSupplierForm(emptySupplierForm);
    setSupplierDialogOpen(true);
  };

  const openEditSupplier = (s: Supplier) => {
    setEditingSupplierId(s.id);
    setSupplierForm({
      code: s.code, name: s.name,
      contactPerson: s.contactPerson || "",
      email: s.email || "",
      phone: s.phone || "",
      city: s.city || "",
    });
    setSupplierDialogOpen(true);
  };

  const handleSaveSupplier = async () => {
    setSavingSupplier(true);
    try {
      const body = {
        ...supplierForm,
        contactPerson: supplierForm.contactPerson || undefined,
        email: supplierForm.email || undefined,
        phone: supplierForm.phone || undefined,
        city: supplierForm.city || undefined,
      };
      if (editingSupplierId) {
        await api.patch(`/suppliers/${editingSupplierId}`, body);
      } else {
        await api.post("/suppliers", body);
      }
      setSupplierDialogOpen(false);
      fetchSuppliersPage();
      fetchSuppliers();
    } catch { /* ignore */ } finally {
      setSavingSupplier(false);
    }
  };

  const confirmDeleteSupplier = async () => {
    if (!deleteSupplierId) return;
    try {
      await api.patch(`/suppliers/${deleteSupplierId}`, { isActive: false });
      setDeleteSupplierId(null);
      fetchSuppliersPage();
      fetchSuppliers();
    } catch { /* ignore */ }
  };

  // ─── Create PO ───────────────────────────────────────────────────────────

  const openCreatePo = () => {
    setPoSupplierId("");
    setPoNotes("");
    setPoLineItems([{ partNumber: "", description: "", quantityOrdered: "1", unitPrice: "0" }]);
    setPoDialogOpen(true);
  };

  const updatePoLineItem = (idx: number, field: keyof PoLineFormData, value: string) => {
    const items = [...poLineItems];
    items[idx] = { ...items[idx], [field]: value };
    setPoLineItems(items);
  };

  const addPoLineItem = () => {
    setPoLineItems([...poLineItems, { partNumber: "", description: "", quantityOrdered: "1", unitPrice: "0" }]);
  };

  const removePoLineItem = (idx: number) => {
    setPoLineItems(poLineItems.filter((_, i) => i !== idx));
  };

  const handleCreatePo = async () => {
    if (!poSupplierId) return;
    setSavingPo(true);
    try {
      await api.post("/purchase-orders", {
        supplierId: poSupplierId,
        notes: poNotes || undefined,
        lineItems: poLineItems.map((li) => ({
          partNumber: li.partNumber,
          description: li.description,
          quantityOrdered: Number(li.quantityOrdered),
          unitPrice: Number(li.unitPrice),
          stockItemId: li.stockItemId || undefined,
        })),
      });
      setPoDialogOpen(false);
      fetchOrders();
    } catch { /* ignore */ } finally {
      setSavingPo(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Purchasing</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage purchase orders and suppliers
          </p>
        </div>
        <div className="flex gap-2">
          {tab === "orders" && (
            <Button onClick={openCreatePo}>
              <Plus className="h-4 w-4" /> New Purchase Order
            </Button>
          )}
          {tab === "suppliers" && (
            <Button onClick={openCreateSupplier}>
              <Plus className="h-4 w-4" /> Add Supplier
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        <button
          onClick={() => { setTab("orders"); setPage(1); setSearch(""); }}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
            tab === "orders"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <ShoppingCart className="h-4 w-4 inline mr-1.5" />
          Purchase Orders
        </button>
        <button
          onClick={() => { setTab("suppliers"); setPage(1); setSearch(""); }}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
            tab === "suppliers"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <Building2 className="h-4 w-4 inline mr-1.5" />
          Suppliers
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={tab === "orders" ? "Search by PO number or supplier..." : "Search suppliers..."}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        {tab === "orders" && (
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="flex h-10 w-[160px] rounded-[var(--radius-md)] border border-border bg-input px-3 py-2 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="SENT">SENT</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="PARTIAL">PARTIAL</option>
            <option value="RECEIVED">RECEIVED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        )}
      </div>

      {/* ─── Purchase Orders Table ─────────────────────────────────────── */}
      {tab === "orders" && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">PO Number</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">Supplier</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">Status</th>
                    <th className="text-center font-medium text-muted-foreground px-4 py-3">Items</th>
                    <th className="text-right font-medium text-muted-foreground px-4 py-3">Total</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">Date</th>
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
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-muted-foreground">
                        <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                        No purchase orders found
                      </td>
                    </tr>
                  ) : (
                    orders.map((po) => (
                      <tr key={po.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs font-medium">{po.poNumber}</td>
                        <td className="px-4 py-3">{po.supplier.name}</td>
                        <td className="px-4 py-3">
                          <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", STATUS_COLORS[po.status] || "")}>
                            {po.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-muted-foreground">{po._count?.lineItems ?? 0}</td>
                        <td className="px-4 py-3 text-right font-medium">${po.grandTotal.toFixed(2)}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(po.orderDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openViewPo(po.id)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteOrderId(po.id)}>
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
          {ordersMeta && ordersMeta.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing {(ordersMeta.page - 1) * ordersMeta.pageSize + 1}-
                {Math.min(ordersMeta.page * ordersMeta.pageSize, ordersMeta.totalCount)} of {ordersMeta.totalCount}
              </p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={!ordersMeta.hasPreviousPage} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={!ordersMeta.hasNextPage} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ─── Suppliers Table ──────────────────────────────────────────── */}
      {tab === "suppliers" && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">Code</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">Name</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">Contact</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">Phone</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">City</th>
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
                  ) : suppliers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-muted-foreground">
                        <Building2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                        No suppliers found
                      </td>
                    </tr>
                  ) : (
                    suppliers.map((s) => (
                      <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs">{s.code}</td>
                        <td className="px-4 py-3 font-medium">{s.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{s.contactPerson || "-"}</td>
                        <td className="px-4 py-3">{s.phone || "-"}</td>
                        <td className="px-4 py-3">{s.city || "-"}</td>
                        <td className="px-4 py-3">
                          <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", s.isActive ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground")}>
                            {s.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditSupplier(s)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteSupplierId(s.id)}>
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
          {suppliersMeta && suppliersMeta.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing {(suppliersMeta.page - 1) * suppliersMeta.pageSize + 1}-
                {Math.min(suppliersMeta.page * suppliersMeta.pageSize, suppliersMeta.totalCount)} of {suppliersMeta.totalCount}
              </p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={!suppliersMeta.hasPreviousPage} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={!suppliersMeta.hasNextPage} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ─── View PO Detail Drawer ────────────────────────────────────── */}
      <Dialog.Root open={!!viewPoId} onOpenChange={(o) => { if (!o) setViewPoId(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40" />
          <Dialog.Content className="fixed right-0 top-0 h-full w-full max-w-xl bg-background shadow-xl border-l border-border p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-lg font-semibold">
                {viewPo?.poNumber || "Purchase Order"}
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon"><X className="h-4 w-4" /></Button>
              </Dialog.Close>
            </div>
            {loadingView ? (
              <Loader2 className="h-5 w-5 animate-spin mx-auto mt-12 text-muted-foreground" />
            ) : viewPo ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Supplier</p>
                    <p className="font-medium">{viewPo.supplier.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1", STATUS_COLORS[viewPo.status] || "")}>
                      {viewPo.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Order Date</p>
                    <p className="font-medium">{new Date(viewPo.orderDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Grand Total</p>
                    <p className="font-medium text-lg">${viewPo.grandTotal.toFixed(2)}</p>
                  </div>
                  {viewPo.notes && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Notes</p>
                      <p className="text-sm">{viewPo.notes}</p>
                    </div>
                  )}
                </div>

                {/* Status actions */}
                <div>
                  <p className="text-sm font-medium mb-2">Actions</p>
                  <div className="flex flex-wrap gap-2">
                    {(NEXT_STATUS[viewPo.status] || []).map((next) => (
                      <Button
                        key={next}
                        size="sm"
                        variant={next === "CANCELLED" ? "destructive" : "outline"}
                        onClick={() => updatePoStatus(viewPo.id, next)}
                      >
                        {next === "CANCELLED" ? "Cancel Order" : `Mark ${next}`}
                      </Button>
                    ))}
                    {(!NEXT_STATUS[viewPo.status] || NEXT_STATUS[viewPo.status].length === 0) && (
                      <p className="text-xs text-muted-foreground">No further actions available</p>
                    )}
                  </div>
                </div>

                {/* Line Items */}
                <div>
                  <p className="text-sm font-medium mb-2">Line Items ({viewPo.lineItems?.length || 0})</p>
                  <div className="border border-border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">#</th>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Part</th>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Description</th>
                          <th className="text-right px-3 py-2 font-medium text-muted-foreground text-xs">Qty</th>
                          <th className="text-right px-3 py-2 font-medium text-muted-foreground text-xs">Price</th>
                          <th className="text-right px-3 py-2 font-medium text-muted-foreground text-xs">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewPo.lineItems?.map((li) => (
                          <tr key={li.id} className="border-t border-border">
                            <td className="px-3 py-2 text-muted-foreground">{li.lineNumber}</td>
                            <td className="px-3 py-2 font-mono text-xs">{li.partNumber}</td>
                            <td className="px-3 py-2">{li.description}</td>
                            <td className="px-3 py-2 text-right">{li.quantityOrdered}</td>
                            <td className="px-3 py-2 text-right">${li.unitPrice.toFixed(2)}</td>
                            <td className="px-3 py-2 text-right font-medium">${li.lineTotal.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ─── Create PO Dialog ─────────────────────────────────────────── */}
      <Dialog.Root open={poDialogOpen} onOpenChange={setPoDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-background rounded-xl shadow-lg border border-border p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-lg font-semibold">New Purchase Order</Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon"><X className="h-4 w-4" /></Button>
              </Dialog.Close>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="po-supplier">Supplier *</Label>
                <select
                  id="po-supplier"
                  value={poSupplierId}
                  onChange={(e) => setPoSupplierId(e.target.value)}
                  className="flex h-10 w-full rounded-[var(--radius-md)] border border-border bg-input px-3 py-2 text-sm"
                >
                  <option value="">Select supplier...</option>
                  {supplierList.filter((s) => s.isActive).map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="po-notes">Notes</Label>
                <textarea
                  id="po-notes"
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  className="flex min-h-[60px] w-full rounded-[var(--radius-md)] border border-border bg-input px-3 py-2 text-sm resize-none"
                  placeholder="Optional notes..."
                />
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Line Items</Label>
                  <Button variant="outline" size="sm" onClick={addPoLineItem}>
                    <Plus className="h-3 w-3" /> Add Item
                  </Button>
                </div>
                {poLineItems.map((li, idx) => (
                  <div key={idx} className="flex gap-2 items-start mb-2 p-2 border border-border rounded-lg">
                    <div className="flex-1 grid grid-cols-4 gap-2">
                      <div>
                        <Label className="text-xs">Part #</Label>
                        <Input
                          value={li.partNumber}
                          onChange={(e) => updatePoLineItem(idx, "partNumber", e.target.value)}
                          placeholder="e.g. OIL-5W30"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Description</Label>
                        <Input
                          value={li.description}
                          onChange={(e) => updatePoLineItem(idx, "description", e.target.value)}
                          placeholder="Item description"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Qty</Label>
                        <Input
                          type="number"
                          min="1"
                          value={li.quantityOrdered}
                          onChange={(e) => updatePoLineItem(idx, "quantityOrdered", e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Unit Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={li.unitPrice}
                          onChange={(e) => updatePoLineItem(idx, "unitPrice", e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="mt-5 h-8 w-8 shrink-0"
                      onClick={() => removePoLineItem(idx)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Dialog.Close asChild>
                <Button variant="outline">Cancel</Button>
              </Dialog.Close>
              <Button
                onClick={handleCreatePo}
                disabled={savingPo || !poSupplierId || poLineItems.length === 0 || poLineItems.some((li) => !li.partNumber || !li.description)}
              >
                {savingPo && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Order
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ─── Supplier Create/Edit Dialog ───────────────────────────────── */}
      <Dialog.Root open={supplierDialogOpen} onOpenChange={setSupplierDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-background rounded-xl shadow-lg border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-lg font-semibold">
                {editingSupplierId ? "Edit Supplier" : "Add Supplier"}
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon"><X className="h-4 w-4" /></Button>
              </Dialog.Close>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sup-code">Code *</Label>
                  <Input id="sup-code" value={supplierForm.code} onChange={(e) => setSupplierForm({ ...supplierForm, code: e.target.value })} placeholder="e.g. SUP-001" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sup-name">Name *</Label>
                  <Input id="sup-name" value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} placeholder="e.g. Auto Parts Co." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sup-contact">Contact Person</Label>
                  <Input id="sup-contact" value={supplierForm.contactPerson} onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sup-email">Email</Label>
                  <Input id="sup-email" type="email" value={supplierForm.email} onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sup-phone">Phone</Label>
                  <Input id="sup-phone" value={supplierForm.phone} onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sup-city">City</Label>
                  <Input id="sup-city" value={supplierForm.city} onChange={(e) => setSupplierForm({ ...supplierForm, city: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Dialog.Close asChild>
                <Button variant="outline">Cancel</Button>
              </Dialog.Close>
              <Button onClick={handleSaveSupplier} disabled={savingSupplier || !supplierForm.code || !supplierForm.name}>
                {savingSupplier && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingSupplierId ? "Update" : "Create"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ─── Delete PO Confirmation ───────────────────────────────────── */}
      <Dialog.Root open={!!deleteOrderId} onOpenChange={(o) => { if (!o) setDeleteOrderId(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-background rounded-xl shadow-lg border border-border p-6">
            <Dialog.Title className="text-lg font-semibold">Delete Purchase Order</Dialog.Title>
            <p className="text-sm text-muted-foreground mt-2">Are you sure you want to delete this purchase order?</p>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setDeleteOrderId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={confirmDeleteOrder}>Delete</Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ─── Delete Supplier Confirmation ─────────────────────────────── */}
      <Dialog.Root open={!!deleteSupplierId} onOpenChange={(o) => { if (!o) setDeleteSupplierId(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-background rounded-xl shadow-lg border border-border p-6">
            <Dialog.Title className="text-lg font-semibold">Deactivate Supplier</Dialog.Title>
            <p className="text-sm text-muted-foreground mt-2">Are you sure you want to deactivate this supplier?</p>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setDeleteSupplierId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={confirmDeleteSupplier}>Deactivate</Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
