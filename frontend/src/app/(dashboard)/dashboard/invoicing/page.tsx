"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Search, Plus, Pencil, Trash2, X, Loader2, Receipt, Eye,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface InvoiceLine {
  id: string;
  lineType: "LABOR" | "PART" | "FEE";
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  lineTotal: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: { id: string; firstName: string; lastName: string };
  workOrder: { id: string; woNumber: string };
  status: string;
  subtotal: number;
  discountType: string | null;
  discountValue: number;
  taxTotal: number;
  total: number;
  amountPaid: number;
  invoiceDate: string;
  dueDate: string;
  notes: string | null;
  lines?: InvoiceLine[];
  _count?: { lines: number };
}

interface PaginationMeta {
  page: number; pageSize: number; totalCount: number;
  totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean;
}

// ─── Status helpers ─────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  ISSUED: "bg-blue-50 text-blue-700",
  PARTIALLY_PAID: "bg-amber-50 text-amber-700",
  PAID: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-700",
  CREDITED: "bg-purple-50 text-purple-700",
};

const NEXT_STATUS: Record<string, string[]> = {
  DRAFT: ["ISSUED", "CANCELLED"],
  ISSUED: ["PARTIALLY_PAID", "PAID", "CANCELLED"],
  PARTIALLY_PAID: ["PAID", "CANCELLED"],
  PAID: [],
  CANCELLED: [],
  CREDITED: [],
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default function InvoicingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [workOrderId, setWorkOrderId] = useState("");
  const [discountType, setDiscountType] = useState("");
  const [discountValue, setDiscountValue] = useState("");
  const [invNotes, setInvNotes] = useState("");
  const [lineItems, setLineItems] = useState<{ lineType: string; description: string; quantity: string; unitPrice: string }[]>([]);
  const [saving, setSaving] = useState(false);

  // View detail
  const [viewId, setViewId] = useState<string | null>(null);
  const [viewInv, setViewInv] = useState<Invoice | null>(null);
  const [loadingView, setLoadingView] = useState(false);

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // ─── Fetch ──────────────────────────────────────────────────────────────

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{
        data: { data: Invoice[]; meta: PaginationMeta };
      }>("/invoices", {
        page, pageSize: 25,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setInvoices(res.data.data);
      setMeta(res.data.meta);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  // ─── View ───────────────────────────────────────────────────────────────

  const openView = async (id: string) => {
    setViewId(id);
    setLoadingView(true);
    try {
      const res = await api.get<{ data: Invoice }>(`/invoices/${id}`);
      setViewInv(res.data);
    } catch { /* ignore */ } finally {
      setLoadingView(false);
    }
  };

  // ─── Status update ──────────────────────────────────────────────────────

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/invoices/${id}/status`, { status });
      fetchInvoices();
      if (viewId === id) openView(id);
    } catch { /* ignore */ }
  };

  // ─── Delete ─────────────────────────────────────────────────────────────

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/invoices/${deleteId}`);
      setDeleteId(null);
      fetchInvoices();
    } catch { /* ignore */ }
  };

  // ─── Create ─────────────────────────────────────────────────────────────

  const openCreate = () => {
    setWorkOrderId("");
    setDiscountType("");
    setDiscountValue("");
    setInvNotes("");
    setLineItems([{ lineType: "LABOR", description: "", quantity: "1", unitPrice: "0" }]);
    setCreateOpen(true);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { lineType: "LABOR", description: "", quantity: "1", unitPrice: "0" }]);
  };

  const removeLineItem = (idx: number) => {
    setLineItems(lineItems.filter((_, i) => i !== idx));
  };

  const handleCreate = async () => {
    if (!workOrderId || lineItems.length === 0) return;
    setSaving(true);
    try {
      await api.post("/invoices", {
        workOrderId,
        discountType: discountType || undefined,
        discountValue: discountValue ? Number(discountValue) : undefined,
        notes: invNotes || undefined,
        lineItems: lineItems.map((li) => ({
          lineType: li.lineType,
          description: li.description,
          quantity: Number(li.quantity),
          unitPrice: Number(li.unitPrice),
        })),
      });
      setCreateOpen(false);
      fetchInvoices();
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoicing</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage customer invoices
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Create Invoice
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by invoice number or customer..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="flex h-10 w-[160px] rounded-[var(--radius-md)] border border-border bg-input px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">DRAFT</option>
          <option value="ISSUED">ISSUED</option>
          <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
          <option value="PAID">PAID</option>
          <option value="CANCELLED">CANCELLED</option>
          <option value="CREDITED">CREDITED</option>
        </select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Invoice #</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Customer</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Work Order</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Status</th>
                  <th className="text-right font-medium text-muted-foreground px-4 py-3">Lines</th>
                  <th className="text-right font-medium text-muted-foreground px-4 py-3">Total</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Date</th>
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
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-muted-foreground">
                      <Receipt className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                      No invoices found
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-medium">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3">{inv.customer.firstName} {inv.customer.lastName}</td>
                      <td className="px-4 py-3 font-mono text-xs">{inv.workOrder.woNumber}</td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", STATUS_COLORS[inv.status] || "")}>
                          {inv.status === "PARTIALLY_PAID" ? "PARTIAL" : inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{inv._count?.lines ?? 0}</td>
                      <td className="px-4 py-3 text-right font-medium">${inv.total.toFixed(2)}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openView(inv.id)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(inv.id)}>
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
              {Math.min(meta.page * meta.pageSize, meta.totalCount)} of {meta.totalCount}
            </p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={!meta.hasPreviousPage} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={!meta.hasNextPage} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>

      {/* ─── View Detail ────────────────────────────────────────────────── */}
      <Dialog.Root open={!!viewId} onOpenChange={(o) => { if (!o) setViewId(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40" />
          <Dialog.Content className="fixed right-0 top-0 h-full w-full max-w-xl bg-background shadow-xl border-l border-border p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-lg font-semibold">
                {viewInv?.invoiceNumber || "Invoice"}
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon"><X className="h-4 w-4" /></Button>
              </Dialog.Close>
            </div>
            {loadingView ? (
              <Loader2 className="h-5 w-5 animate-spin mx-auto mt-12 text-muted-foreground" />
            ) : viewInv ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Customer</p>
                    <p className="font-medium">{viewInv.customer.firstName} {viewInv.customer.lastName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Work Order</p>
                    <p className="font-mono text-xs">{viewInv.workOrder.woNumber}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1", STATUS_COLORS[viewInv.status] || "")}>
                      {viewInv.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Due Date</p>
                    <p className="font-medium">{new Date(viewInv.dueDate).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="border border-border rounded-lg p-4 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${viewInv.subtotal.toFixed(2)}</span>
                  </div>
                  {Number(viewInv.discountValue) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Discount{viewInv.discountType === "PERCENTAGE" ? "" : " (FIXED)"}
                      </span>
                      <span className="text-destructive">-${viewInv.discountValue.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium text-base pt-2 border-t border-border">
                    <span>Total</span>
                    <span>${viewInv.total.toFixed(2)}</span>
                  </div>
                  {Number(viewInv.amountPaid) > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Paid</span>
                      <span>${viewInv.amountPaid.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Status Actions */}
                <div>
                  <p className="text-sm font-medium mb-2">Actions</p>
                  <div className="flex flex-wrap gap-2">
                    {(NEXT_STATUS[viewInv.status] || []).map((next) => (
                      <Button
                        key={next}
                        size="sm"
                        variant={next === "CANCELLED" ? "destructive" : "outline"}
                        onClick={() => updateStatus(viewInv.id, next)}
                      >
                        {next === "CANCELLED" ? "Cancel Invoice" : `Mark ${next === "PARTIALLY_PAID" ? "Partial Payment" : next}`}
                      </Button>
                    ))}
                    {(!NEXT_STATUS[viewInv.status] || NEXT_STATUS[viewInv.status].length === 0) && (
                      <p className="text-xs text-muted-foreground">No further actions available</p>
                    )}
                  </div>
                </div>

                {/* Line Items */}
                <div>
                  <p className="text-sm font-medium mb-2">Line Items</p>
                  <div className="border border-border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Type</th>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Description</th>
                          <th className="text-right px-3 py-2 font-medium text-muted-foreground text-xs">Qty</th>
                          <th className="text-right px-3 py-2 font-medium text-muted-foreground text-xs">Price</th>
                          <th className="text-right px-3 py-2 font-medium text-muted-foreground text-xs">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewInv.lines?.map((l) => (
                          <tr key={l.id} className="border-t border-border">
                            <td className="px-3 py-2">
                              <span className={cn(
                                "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium",
                                l.lineType === "LABOR" ? "bg-blue-50 text-blue-700" :
                                l.lineType === "PART" ? "bg-amber-50 text-amber-700" :
                                "bg-gray-100 text-gray-700",
                              )}>{l.lineType}</span>
                            </td>
                            <td className="px-3 py-2">{l.description}</td>
                            <td className="px-3 py-2 text-right">{l.quantity}</td>
                            <td className="px-3 py-2 text-right">${l.unitPrice.toFixed(2)}</td>
                            <td className="px-3 py-2 text-right font-medium">${l.lineTotal.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {viewInv.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="text-sm">{viewInv.notes}</p>
                  </div>
                )}
              </div>
            ) : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ─── Create Dialog ──────────────────────────────────────────────── */}
      <Dialog.Root open={createOpen} onOpenChange={setCreateOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-background rounded-xl shadow-lg border border-border p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-lg font-semibold">Create Invoice</Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon"><X className="h-4 w-4" /></Button>
              </Dialog.Close>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inv-wo">Work Order *</Label>
                <Input
                  id="inv-wo"
                  value={workOrderId}
                  onChange={(e) => setWorkOrderId(e.target.value)}
                  placeholder="Work Order ID (UUID)"
                />
                <p className="text-xs text-muted-foreground">Enter the work order UUID to link this invoice</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inv-disc-type">Discount Type</Label>
                  <select
                    id="inv-disc-type"
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="flex h-10 w-full rounded-[var(--radius-md)] border border-border bg-input px-3 py-2 text-sm"
                  >
                    <option value="">No discount</option>
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed ($)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inv-disc-val">Discount Value</Label>
                  <Input
                    id="inv-disc-val"
                    type="number"
                    step="0.01"
                    min="0"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder="0"
                    disabled={!discountType}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="inv-notes">Notes</Label>
                <textarea
                  id="inv-notes"
                  value={invNotes}
                  onChange={(e) => setInvNotes(e.target.value)}
                  className="flex min-h-[60px] w-full rounded-[var(--radius-md)] border border-border bg-input px-3 py-2 text-sm resize-none"
                  placeholder="Optional notes..."
                />
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Line Items</Label>
                  <Button variant="outline" size="sm" onClick={addLineItem}>
                    <Plus className="h-3 w-3" /> Add Line
                  </Button>
                </div>
                {lineItems.map((li, idx) => (
                  <div key={idx} className="flex gap-2 items-start mb-2 p-2 border border-border rounded-lg">
                    <div className="flex-1 grid grid-cols-4 gap-2">
                      <div>
                        <Label className="text-xs">Type</Label>
                        <select
                          value={li.lineType}
                          onChange={(e) => {
                            const items = [...lineItems];
                            items[idx] = { ...items[idx], lineType: e.target.value };
                            setLineItems(items);
                          }}
                          className="flex h-8 w-full rounded-[var(--radius-md)] border border-border bg-input px-2 py-1 text-xs"
                        >
                          <option value="LABOR">LABOR</option>
                          <option value="PART">PART</option>
                          <option value="FEE">FEE</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs">Description *</Label>
                        <Input
                          value={li.description}
                          onChange={(e) => {
                            const items = [...lineItems];
                            items[idx] = { ...items[idx], description: e.target.value };
                            setLineItems(items);
                          }}
                          placeholder="Description"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Qty</Label>
                        <Input
                          type="number"
                          min="1"
                          value={li.quantity}
                          onChange={(e) => {
                            const items = [...lineItems];
                            items[idx] = { ...items[idx], quantity: e.target.value };
                            setLineItems(items);
                          }}
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
                          onChange={(e) => {
                            const items = [...lineItems];
                            items[idx] = { ...items[idx], unitPrice: e.target.value };
                            setLineItems(items);
                          }}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="mt-5 h-8 w-8 shrink-0"
                      onClick={() => removeLineItem(idx)}
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
                onClick={handleCreate}
                disabled={saving || !workOrderId || lineItems.length === 0 || lineItems.some((li) => !li.description)}
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Invoice
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ─── Delete Confirmation ────────────────────────────────────────── */}
      <Dialog.Root open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-background rounded-xl shadow-lg border border-border p-6">
            <Dialog.Title className="text-lg font-semibold">Delete Invoice</Dialog.Title>
            <p className="text-sm text-muted-foreground mt-2">Are you sure you want to delete this invoice?</p>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
