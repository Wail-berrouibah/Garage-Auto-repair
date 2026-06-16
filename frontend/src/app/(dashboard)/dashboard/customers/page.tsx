"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Pencil, Trash2, Loader2, Building2, User, Check, XCircle, Car, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

type CustomerType = "INDIVIDUAL" | "COMPANY";

type Customer = {
  id: string;
  customerType: CustomerType;
  firstName: string;
  lastName: string;
  companyName?: string | null;
  email: string;
  phone: string;
  phoneSecondary?: string | null;
  addressLine1?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  notes?: string | null;
  tags?: string[] | null;
  isActive?: boolean;
  _count?: { vehicles: number; workOrders: number };
  createdAt: string;
  updatedAt: string;
};

type CustomerForm = {
  customerType: CustomerType;
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  phone: string;
  phoneSecondary: string;
  addressLine1: string;
  city: string;
  state: string;
  zipCode: string;
  notes: string;
  tags: string;
};

const emptyForm: CustomerForm = {
  customerType: "INDIVIDUAL",
  firstName: "",
  lastName: "",
  companyName: "",
  email: "",
  phone: "",
  phoneSecondary: "",
  addressLine1: "",
  city: "",
  state: "",
  zipCode: "",
  notes: "",
  tags: "",
};

function getInitials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function CustomersPage() {
  const token = useAuthStore((s) => s.accessToken);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [emailError, setEmailError] = useState("");

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [vehicleCustomerId, setVehicleCustomerId] = useState<string | null>(null);
  const [assignedVehicles, setAssignedVehicles] = useState<any[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<any[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [savingVehicle, setSavingVehicle] = useState(false);

  const fetchCustomers = useCallback(
    async (p: number, q: string) => {
      setLoading(true);
      try {
        const res = await api.get<{
          data: { data: Customer[]; meta: { page: number; pageSize: number; totalCount: number; totalPages: number } };
          meta: { timestamp: string; requestId: string };
        }>("/customers", { page: p, pageSize: 25, search: q || undefined });
        setCustomers(res.data.data);
        setTotalPages(res.data.meta.totalPages);
        setTotalCount(res.data.meta.totalCount);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchCustomers(page, search);
  }, [page, fetchCustomers, search]);

  function handleSearchChange(value: string) {
    setSearch(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      setPage(1);
    }, 400);
    setSearchTimeout(timeout);
  }

  function openCreateModal() {
    setEditingId(null);
    setForm(emptyForm);
    setEmailError("");
    setModalOpen(true);
  }

  async function openEditModal(customer: Customer) {
    setEditingId(customer.id);
    setForm({
      customerType: customer.customerType,
      firstName: customer.firstName,
      lastName: customer.lastName,
      companyName: customer.companyName || "",
      email: customer.email,
      phone: customer.phone,
      phoneSecondary: customer.phoneSecondary || "",
      addressLine1: customer.addressLine1 || "",
      city: customer.city || "",
      state: customer.state || "",
      zipCode: customer.zipCode || "",
      notes: customer.notes || "",
      tags: customer.tags?.join(", ") || "",
    });
    setEmailError("");
    setModalOpen(true);
  }

  function validateEmail(email: string) {
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async function handleSave() {
    setEmailError("");
    if (form.email && !validateEmail(form.email)) {
      setEmailError("Invalid email format");
      return;
    }
    setSaving(true);
    try {
      const body = {
        ...form,
        tags: form.tags
          ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
      };
      if (editingId) {
        await api.patch(`/customers/${editingId}`, body);
      } else {
        await api.post("/customers", body);
      }
      setModalOpen(false);
      fetchCustomers(page, search);
    } catch (err) {
      console.error("Failed to save customer:", err);
      alert(err instanceof Error ? err.message : "Failed to save customer");
    } finally {
      setSaving(false);
    }
  }

  function openDeleteConfirm(id: string) {
    setDeletingId(id);
    setDeleteConfirmOpen(true);
  }

  async function handleDelete() {
    if (!deletingId) return;
    setDeleting(true);
    try {
      await api.delete(`/customers/${deletingId}`);
      setDeleteConfirmOpen(false);
      setDeletingId(null);
      fetchCustomers(page, search);
    } catch {
      // silent
    } finally {
      setDeleting(false);
    }
  }

  async function openVehicleDialog(customerId: string) {
    setVehicleCustomerId(customerId);
    setSelectedVehicleId("");
    setVehicleDialogOpen(true);
    setLoadingVehicles(true);
    try {
      const [assignedRes, allRes] = await Promise.all([
        api.get<{ data: any[] }>(`/customers/${customerId}/vehicles`),
        api.get<{ data: { data: any[] } }>("/vehicles", { page: 1, pageSize: 100 }),
      ]);
      setAssignedVehicles(assignedRes.data);
      const assignedIds = new Set(assignedRes.data.map((cv: any) => cv.vehicleId));
      setAvailableVehicles(allRes.data.data.filter((v: any) => !assignedIds.has(v.id)));
    } catch { setAssignedVehicles([]); setAvailableVehicles([]); }
    finally { setLoadingVehicles(false); }
  }

  async function assignVehicle() {
    if (!vehicleCustomerId || !selectedVehicleId) return;
    setSavingVehicle(true);
    try {
      await api.post(`/customers/${vehicleCustomerId}/vehicles`, { vehicleId: selectedVehicleId });
      setSelectedVehicleId("");
      await openVehicleDialog(vehicleCustomerId);
      fetchCustomers(page, search);
    } catch (err) { console.error("Failed to assign vehicle:", err); }
    finally { setSavingVehicle(false); }
  }

  async function unassignVehicle(vehicleId: string) {
    if (!vehicleCustomerId) return;
    try {
      await api.delete(`/customers/${vehicleCustomerId}/vehicles/${vehicleId}`);
      await openVehicleDialog(vehicleCustomerId);
      fetchCustomers(page, search);
    } catch (err) { console.error("Failed to unassign vehicle:", err); }
  }

  function updateForm<K extends keyof CustomerForm>(key: K, value: CustomerForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your customer directory
          </p>
        </div>
        <Button onClick={openCreateModal} className="gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 bg-muted/50"
        />
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {totalCount > 0 ? `${totalCount} customer${totalCount !== 1 ? "s" : ""}` : "Customers"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Name</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Email</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Phone</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Type</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Status</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Vehicles</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Created</th>
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
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-muted-foreground">
                      {search ? "No customers match your search." : "No customers yet. Add your first customer."}
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                      <tr
                        key={customer.id}
                        className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarFallback className="text-xs bg-accent/10 text-accent">
                                {getInitials(customer.firstName, customer.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <span className="font-medium whitespace-nowrap">
                                {customer.firstName} {customer.lastName}
                              </span>
                              {customer.companyName && (
                                <span className="ml-1.5 text-xs text-muted-foreground whitespace-nowrap">
                                  ({customer.companyName})
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">{customer.email}</td>
                        <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">{customer.phone}</td>
                        <td className="px-4 py-4">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
                              customer.customerType === "COMPANY"
                                ? "bg-violet-50 text-violet-700"
                                : "bg-blue-50 text-blue-700",
                            )}
                          >
                            {customer.customerType === "COMPANY" ? (
                              <Building2 className="h-3 w-3" />
                            ) : (
                              <User className="h-3 w-3" />
                            )}
                            {customer.customerType === "COMPANY" ? "Company" : "Individual"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
                              customer.isActive ?? true
                                ? "bg-green-50 text-green-700"
                                : "bg-red-50 text-red-700",
                            )}
                          >
                            {customer.isActive ?? true ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            {customer.isActive ?? true ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <button
                            onClick={() => openVehicleDialog(customer.id)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent/80 transition-colors whitespace-nowrap"
                          >
                            <Car className="h-3 w-3" />
                            {customer._count?.vehicles ?? 0} vehicle{(customer._count?.vehicles ?? 0) !== 1 ? "s" : ""}
                          </button>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">{formatDate(customer.createdAt)}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditModal(customer)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => openDeleteConfirm(customer.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )))}
                </tbody>
              </table>
            </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog.Root open={modalOpen} onOpenChange={setModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 data-[state=open]:animate-in data-[state=closed]:animate-out" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-[var(--radius-xl)] bg-card shadow-lg border border-border p-6 data-[state=open]:animate-in data-[state=closed]:animate-out">
            <Dialog.Title className="text-lg font-semibold tracking-tight">
              {editingId ? "Edit Customer" : "Add Customer"}
            </Dialog.Title>
            <Dialog.Description className="text-sm text-muted-foreground mt-1 mb-6">
              {editingId ? "Update the customer details below." : "Fill in the details to add a new customer."}
            </Dialog.Description>

            <div className="space-y-5">
              {/* Customer Type */}
              <div className="space-y-2">
                <Label>Customer Type</Label>
                <div className="flex gap-3">
                  {(["INDIVIDUAL", "COMPANY"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => updateForm("customerType", type)}
                      className={cn(
                        "flex-1 rounded-[var(--radius-md)] border px-4 py-2.5 text-sm font-medium transition-all",
                        form.customerType === type
                          ? "border-accent bg-accent/5 text-accent"
                          : "border-border bg-transparent text-muted-foreground hover:border-accent/50",
                      )}
                    >
                      {type === "COMPANY" ? "Company" : "Individual"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={form.firstName}
                    onChange={(e) => updateForm("firstName", e.target.value)}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={form.lastName}
                    onChange={(e) => updateForm("lastName", e.target.value)}
                    placeholder="Doe"
                  />
                </div>
              </div>

              {/* Company Name */}
              {form.customerType === "COMPANY" && (
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={form.companyName}
                    onChange={(e) => updateForm("companyName", e.target.value)}
                    placeholder="Acme Inc."
                  />
                </div>
              )}

              {/* Contact */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => { updateForm("email", e.target.value); setEmailError(""); }}
                  placeholder="john@example.com"
                  className={emailError ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {emailError && <p className="text-xs text-destructive">{emailError}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => updateForm("phone", e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneSecondary">Phone Secondary</Label>
                  <Input
                    id="phoneSecondary"
                    value={form.phoneSecondary}
                    onChange={(e) => updateForm("phoneSecondary", e.target.value)}
                    placeholder="(555) 987-6543"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="addressLine1">Address Line 1</Label>
                <Input
                  id="addressLine1"
                  value={form.addressLine1}
                  onChange={(e) => updateForm("addressLine1", e.target.value)}
                  placeholder="123 Main St"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={form.city}
                    onChange={(e) => updateForm("city", e.target.value)}
                    placeholder="New York"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={form.state}
                    onChange={(e) => updateForm("state", e.target.value)}
                    placeholder="NY"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">Zip Code</Label>
                  <Input
                    id="zipCode"
                    value={form.zipCode}
                    onChange={(e) => updateForm("zipCode", e.target.value)}
                    placeholder="10001"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => updateForm("notes", e.target.value)}
                  placeholder="Any additional notes..."
                  rows={3}
                  className="flex w-full rounded-[var(--radius-md)] border border-border bg-input px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all duration-200 resize-none"
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={form.tags}
                  onChange={(e) => updateForm("tags", e.target.value)}
                  placeholder="vip, fleet, corporate"
                />
                <p className="text-xs text-muted-foreground">Separate tags with commas.</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 mt-8">
              <Dialog.Close asChild>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingId ? "Update Customer" : "Create Customer"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Confirmation */}
      <Dialog.Root open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm rounded-[var(--radius-xl)] bg-card shadow-lg border border-border p-6">
            <Dialog.Title className="text-lg font-semibold tracking-tight">
              Delete Customer
            </Dialog.Title>
            <Dialog.Description className="text-sm text-muted-foreground mt-2">
              Are you sure you want to delete this customer? This action cannot be undone.
            </Dialog.Description>
            <div className="flex items-center justify-end gap-3 mt-6">
              <Dialog.Close asChild>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Vehicle Management Dialog */}
      <Dialog.Root open={vehicleDialogOpen} onOpenChange={setVehicleDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md rounded-[var(--radius-xl)] bg-card shadow-lg border border-border p-6">
            <Dialog.Title className="text-lg font-semibold tracking-tight flex items-center gap-2">
              <Car className="h-4 w-4" /> Manage Vehicles
            </Dialog.Title>
            <Dialog.Description className="text-sm text-muted-foreground mt-1 mb-4">
              Assign or unassign vehicles for this customer.
            </Dialog.Description>

            {loadingVehicles ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : (
              <>
                {/* Assigned Vehicles */}
                <div className="space-y-2 mb-4">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Assigned Vehicles</Label>
                  {assignedVehicles.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">No vehicles assigned.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {assignedVehicles.map((cv: any) => (
                        <div key={cv.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                          <span>{cv.vehicle.make} {cv.vehicle.model} — {cv.vehicle.licensePlate || cv.vehicle.vin}</span>
                          <button
                            onClick={() => unassignVehicle(cv.vehicleId)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Assign New Vehicle */}
                {availableVehicles.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-border">
                    <Label>Assign Vehicle</Label>
                    <div className="flex gap-2">
                      <select
                        value={selectedVehicleId}
                        onChange={(e) => setSelectedVehicleId(e.target.value)}
                        className="flex-1 h-10 rounded-[var(--radius-md)] border border-border bg-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">Select a vehicle...</option>
                        {availableVehicles.map((v: any) => (
                          <option key={v.id} value={v.id}>
                            {v.make} {v.model} — {v.licensePlate || v.vin}
                          </option>
                        ))}
                      </select>
                      <Button onClick={assignVehicle} disabled={!selectedVehicleId || savingVehicle}>
                        {savingVehicle ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assign"}
                      </Button>
                    </div>
                  </div>
                )}
                {availableVehicles.length === 0 && assignedVehicles.length > 0 && (
                  <p className="text-xs text-muted-foreground pt-2">All vehicles are already assigned to this customer.</p>
                )}
              </>
            )}

            <div className="flex justify-end mt-6">
              <Dialog.Close asChild><Button variant="outline">Close</Button></Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
