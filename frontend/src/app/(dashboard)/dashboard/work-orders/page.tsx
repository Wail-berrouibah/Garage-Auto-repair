"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Pencil, Trash2, Loader2, Wrench, ChevronDown } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

type WoStatus = "OPEN" | "DIAGNOSED" | "WAITING_PARTS" | "IN_PROGRESS" | "QUALITY_CHECK" | "COMPLETED" | "DELIVERED";
type Priority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

type WorkOrder = {
  id: string;
  woNumber: string;
  status: WoStatus;
  priority: Priority;
  complaint: string;
  diagnosis: string | null;
  odometerIn: number | null;
  odometerOut: number | null;
  estimatedTotal: number | null;
  actualTotal: number | null;
  promisedDate: string | null;
  startedAt: string | null;
  completedAt: string | null;
  deliveredAt: string | null;
  isBlocked: boolean;
  blockReason: string | null;
  createdAt: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    companyName: string | null;
  };
  vehicle: {
    id: string;
    make: string;
    model: string;
    licensePlate: string;
  };
  assignedMechanic: { id: string; firstName: string; lastName: string } | null;
  _count: {
    laborEntries: number;
    partEntries: number;
    timeEntries: number;
    workNotes: number;
  };
};

type PaginationMeta = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type CustomerOption = { id: string; firstName: string; lastName: string; companyName: string | null };
type VehicleOption = { id: string; make: string; model: string; licensePlate: string };
type MechanicOption = { id: string; firstName: string; lastName: string };

type WorkOrderForm = {
  customerId: string;
  vehicleId: string;
  complaint: string;
  priority: Priority;
  diagnosis: string;
  odometerIn: string;
  assignedTo: string;
  estimatedTotal: string;
  promisedDate: string;
  status: WoStatus;
};

const emptyForm: WorkOrderForm = {
  customerId: "",
  vehicleId: "",
  complaint: "",
  priority: "NORMAL",
  diagnosis: "",
  odometerIn: "",
  assignedTo: "",
  estimatedTotal: "",
  promisedDate: "",
  status: "OPEN",
};

const STATUS_OPTIONS: Record<WoStatus, WoStatus[]> = {
  OPEN: ["DIAGNOSED"],
  DIAGNOSED: ["IN_PROGRESS", "WAITING_PARTS"],
  WAITING_PARTS: ["IN_PROGRESS"],
  IN_PROGRESS: ["QUALITY_CHECK"],
  QUALITY_CHECK: ["COMPLETED", "IN_PROGRESS"],
  COMPLETED: ["DELIVERED"],
  DELIVERED: [],
};

const STATUS_STYLES: Record<WoStatus, string> = {
  OPEN: "bg-blue-50 text-blue-700",
  DIAGNOSED: "bg-purple-50 text-purple-700",
  WAITING_PARTS: "bg-amber-50 text-amber-700",
  IN_PROGRESS: "bg-cyan-50 text-cyan-700",
  QUALITY_CHECK: "bg-violet-50 text-violet-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  DELIVERED: "bg-gray-100 text-gray-700",
};

const PRIORITY_STYLES: Record<Priority, string> = {
  LOW: "bg-green-50 text-green-700",
  NORMAL: "bg-blue-50 text-blue-700",
  HIGH: "bg-orange-50 text-orange-700",
  URGENT: "bg-red-50 text-red-700",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<WorkOrderForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [mechanics, setMechanics] = useState<MechanicOption[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [loadingMechanics, setLoadingMechanics] = useState(false);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchWorkOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{
        data: { data: WorkOrder[]; meta: PaginationMeta };
        meta: { timestamp: string; requestId: string };
      }>("/work-orders", {
        page,
        pageSize: 25,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setWorkOrders(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      console.error("Failed to fetch work orders:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchWorkOrders();
  }, [fetchWorkOrders]);

  const fetchDropdownData = useCallback(async () => {
    setLoadingCustomers(true);
    setLoadingMechanics(true);
    try {
      const res = await api.get<{
        data: { data: CustomerOption[]; meta: PaginationMeta };
        meta: { timestamp: string; requestId: string };
      }>("/customers", { page: 1, pageSize: 100 });
      setCustomers(res.data.data);
    } catch (err) {
      console.error("Failed to fetch customers:", err);
    } finally {
      setLoadingCustomers(false);
    }
    try {
      const res = await api.get<{
        data: { data: MechanicOption[]; meta: PaginationMeta };
        meta: { timestamp: string; requestId: string };
      }>("/users", { page: 1, pageSize: 100 });
      setMechanics(res.data.data);
    } catch (err) {
      console.error("Failed to fetch mechanics:", err);
    } finally {
      setLoadingMechanics(false);
    }
  }, []);

  const fetchAllVehicles = useCallback(async () => {
    setLoadingVehicles(true);
    try {
      const res = await api.get<{ data: { data: VehicleOption[] } }>(
        "/vehicles", { page: 1, pageSize: 100 },
      );
      setVehicles(res.data.data);
    } catch (err) {
      console.error("Failed to fetch vehicles:", err);
      setVehicles([]);
    } finally {
      setLoadingVehicles(false);
    }
  }, []);

  const tryAutoSelectVehicle = useCallback(async (customerId: string) => {
    if (!customerId) return;
    try {
      const res = await api.get<{ data: { vehicle: VehicleOption }[] }>(
        `/customers/${customerId}/vehicles`,
      );
      const mapped: VehicleOption[] = (res.data as any).map(
        (cv: { vehicle: VehicleOption }) => cv.vehicle,
      ) || [];
      if (mapped.length === 1) {
        setForm((prev) => ({ ...prev, vehicleId: mapped[0].id }));
      }
    } catch {
      // silent
    }
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setSaveError(null);
    fetchDropdownData();
    fetchAllVehicles();
    setModalOpen(true);
  }

  async function openEdit(wo: WorkOrder) {
    setEditingId(wo.id);
    setSaveError(null);
    setForm({
      customerId: wo.customer.id,
      vehicleId: wo.vehicle.id,
      complaint: wo.complaint,
      priority: wo.priority,
      diagnosis: wo.diagnosis || "",
      odometerIn: wo.odometerIn?.toString() || "",
      assignedTo: wo.assignedMechanic?.id || "",
      estimatedTotal: wo.estimatedTotal?.toString() || "",
      promisedDate: wo.promisedDate ? wo.promisedDate.slice(0, 10) : "",
      status: wo.status,
    });
    await fetchDropdownData();
    await fetchAllVehicles();
    tryAutoSelectVehicle(wo.customer.id);
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      const body: Record<string, unknown> = {
        customerId: form.customerId,
        vehicleId: form.vehicleId,
        complaint: form.complaint,
        priority: form.priority,
        diagnosis: form.diagnosis || undefined,
        odometerIn: form.odometerIn ? Number(form.odometerIn) : undefined,
        assignedTo: form.assignedTo || undefined,
        estimatedTotal: form.estimatedTotal ? Number(form.estimatedTotal) : undefined,
        promisedDate: form.promisedDate || undefined,
      };
      if (editingId) {
        await api.patch(`/work-orders/${editingId}`, body);
      } else {
        await api.post("/work-orders", body);
      }
      setModalOpen(false);
      fetchWorkOrders();
    } catch (err: unknown) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to save work order";
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingId) return;
    setDeleting(true);
    try {
      await api.delete(`/work-orders/${deletingId}`);
      setDeleteConfirmOpen(false);
      setDeletingId(null);
      fetchWorkOrders();
    } catch (err) {
      console.error("Failed to delete work order:", err);
    } finally {
      setDeleting(false);
    }
  }

  async function handleStatusUpdate(woId: string, next: WoStatus) {
    setUpdatingStatusId(woId);
    try {
      await api.patch(`/work-orders/${woId}/status`, { status: next });
      fetchWorkOrders();
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingStatusId(null);
    }
  }

  const statuses: WoStatus[] = ["OPEN", "DIAGNOSED", "WAITING_PARTS", "IN_PROGRESS", "QUALITY_CHECK", "COMPLETED", "DELIVERED"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Work Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and track repair work orders
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          New Work Order
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by WO number or complaint..."
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
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="flex h-10 rounded-[var(--radius-md)] border border-border bg-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">All Statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">WO #</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Customer</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Vehicle</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Status</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Priority</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Complaint</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Assigned</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Created</th>
                  <th className="text-right font-medium text-muted-foreground px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                    </td>
                  </tr>
                ) : workOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-muted-foreground">
                      No work orders found
                    </td>
                  </tr>
                ) : (
                  workOrders.map((wo) => (
                    <tr key={wo.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-medium">{wo.woNumber}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium">
                          {wo.customer.firstName} {wo.customer.lastName}
                        </span>
                        {wo.customer.companyName && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({wo.customer.companyName})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {wo.vehicle.make} {wo.vehicle.model}
                        <span className="ml-1 font-mono">{wo.vehicle.licensePlate}</span>
                      </td>
                      <td className="px-4 py-3">
                        {STATUS_OPTIONS[wo.status]?.length ? (
                          <div className="relative inline-flex items-center">
                            <select
                              value={wo.status}
                              onChange={(e) => handleStatusUpdate(wo.id, e.target.value as WoStatus)}
                              disabled={updatingStatusId === wo.id}
                              className={cn(
                                "appearance-none inline-flex items-center px-2 py-0.5 pr-6 rounded-full text-xs font-medium border-0 cursor-pointer",
                                STATUS_STYLES[wo.status],
                                updatingStatusId === wo.id && "opacity-50",
                              )}
                              style={{ backgroundImage: "none" }}
                            >
                              <option value={wo.status}>{wo.status.replace(/_/g, " ")}</option>
                              {STATUS_OPTIONS[wo.status].map((opt) => (
                                <option key={opt} value={opt}>
                                  → {opt.replace(/_/g, " ")}
                                </option>
                              ))}
                            </select>
                            {updatingStatusId === wo.id ? (
                              <Loader2 className="absolute right-1 h-3 w-3 animate-spin text-current" />
                            ) : (
                              <ChevronDown className="absolute right-1 h-3 w-3 pointer-events-none text-current opacity-60" />
                            )}
                          </div>
                        ) : (
                          <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", STATUS_STYLES[wo.status])}>
                            {wo.status.replace(/_/g, " ")}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", PRIORITY_STYLES[wo.priority])}>
                          {wo.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                        {wo.complaint}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {wo.assignedMechanic
                          ? `${wo.assignedMechanic.firstName} ${wo.assignedMechanic.lastName}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {formatDate(wo.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(wo)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { setDeletingId(wo.id); setDeleteConfirmOpen(true); }}>
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
              <Button variant="outline" size="sm" disabled={!meta.hasPreviousPage} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={!meta.hasNextPage} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog.Root open={modalOpen} onOpenChange={(open) => { setModalOpen(open); if (!open) setSaveError(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-background rounded-xl shadow-lg border border-border p-6 data-[state=open]:animate-in data-[state=closed]:animate-out max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-lg font-semibold">
                {editingId ? "Edit Work Order" : "New Work Order"}
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon"><Wrench className="h-4 w-4" /></Button>
              </Dialog.Close>
            </div>
            <div className="space-y-4">
              {/* Customer */}
              <div className="space-y-2">
                <Label htmlFor="customerId">Customer *</Label>
                <select
                  id="customerId"
                  value={form.customerId}
                  onChange={(e) => {
                    setForm({ ...form, customerId: e.target.value, vehicleId: "" });
                    tryAutoSelectVehicle(e.target.value);
                  }}
                  className="flex h-10 w-full rounded-[var(--radius-md)] border border-border bg-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  disabled={loadingCustomers}
                >
                  <option value="">{loadingCustomers ? "Loading..." : "Select customer..."}</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName}{c.companyName ? ` (${c.companyName})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vehicle */}
              <div className="space-y-2">
                <Label htmlFor="vehicleId">Vehicle *</Label>
                <select
                  id="vehicleId"
                  value={form.vehicleId}
                  onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                  className="flex h-10 w-full rounded-[var(--radius-md)] border border-border bg-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  disabled={loadingVehicles}
                >
                  <option value="">
                    {loadingVehicles ? "Loading..." : "Select vehicle..."}
                  </option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.make} {v.model} — {v.licensePlate}
                    </option>
                  ))}
                </select>
              </div>

              {/* Complaint */}
              <div className="space-y-2">
                <Label htmlFor="complaint">Customer Complaint *</Label>
                <textarea
                  id="complaint"
                  value={form.complaint}
                  onChange={(e) => setForm({ ...form, complaint: e.target.value })}
                  placeholder="Describe the issue reported by customer..."
                  rows={3}
                  className="flex min-h-[60px] w-full rounded-[var(--radius-md)] border border-border bg-input px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
                  className="flex h-10 w-full rounded-[var(--radius-md)] border border-border bg-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="LOW">Low</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              {/* Diagnosis */}
              <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnosis</Label>
                <textarea
                  id="diagnosis"
                  value={form.diagnosis}
                  onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                  placeholder="Initial diagnosis (optional)..."
                  rows={2}
                  className="flex min-h-[50px] w-full rounded-[var(--radius-md)] border border-border bg-input px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>

              {/* Odometer + Assigned */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="odometerIn">Odometer In</Label>
                  <Input
                    id="odometerIn"
                    type="number"
                    min="0"
                    value={form.odometerIn}
                    onChange={(e) => setForm({ ...form, odometerIn: e.target.value })}
                    placeholder="Mileage"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignedTo">Assign To</Label>
                  <select
                    id="assignedTo"
                    value={form.assignedTo}
                    onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                    className="flex h-10 w-full rounded-[var(--radius-md)] border border-border bg-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    disabled={loadingMechanics}
                  >
                    <option value="">{loadingMechanics ? "Loading..." : "Unassigned"}</option>
                    {mechanics.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.firstName} {m.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Estimated Total + Promised Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estimatedTotal">Est. Total ($)</Label>
                  <Input
                    id="estimatedTotal"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.estimatedTotal}
                    onChange={(e) => setForm({ ...form, estimatedTotal: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promisedDate">Promised Date</Label>
                  <Input
                    id="promisedDate"
                    type="date"
                    value={form.promisedDate}
                    onChange={(e) => setForm({ ...form, promisedDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
            {saveError && (
              <div className="mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {saveError}
              </div>
            )}
            <div className="flex justify-end gap-3 mt-6">
              <Dialog.Close asChild>
                <Button variant="outline">Cancel</Button>
              </Dialog.Close>
              <Button
                onClick={handleSave}
                disabled={saving || !form.customerId || !form.vehicleId || !form.complaint}
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingId ? "Update" : "Create"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Confirmation */}
      <Dialog.Root open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-background rounded-xl shadow-lg border border-border p-6">
            <Dialog.Title className="text-lg font-semibold">Delete Work Order</Dialog.Title>
            <p className="text-sm text-muted-foreground mt-2">
              Are you sure you want to delete this work order? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
