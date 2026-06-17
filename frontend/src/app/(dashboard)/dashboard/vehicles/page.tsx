"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as Dialog from "@radix-ui/react-dialog";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Search, Plus, Pencil, Trash2, X, Loader2, Car } from "lucide-react";

type Vehicle = {
  id: string;
  vin: string;
  licensePlate: string;
  licenseState: string;
  make: string;
  model: string;
  year: number;
  color: string;
  trimLevel: string;
  engine: string;
  transmission: string;
  drivetrain: string;
  fuelType: string;
  bodyClass: string;
  odometer: number;
  odometerUnit: "mi" | "km";
  notes: string;
  _count: { customers: number; workOrders: number };
  createdAt: string;
  updatedAt: string;
};

type PaginationMeta = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

const defaultForm: Omit<Vehicle, "id" | "createdAt" | "updatedAt" | "_count"> = {
  vin: "",
  licensePlate: "",
  licenseState: "",
  make: "",
  model: "",
  year: new Date().getFullYear(),
  color: "",
  trimLevel: "",
  engine: "",
  transmission: "",
  drivetrain: "",
  fuelType: "",
  bodyClass: "",
  odometer: 0,
  odometerUnit: "mi",
  notes: "",
};

const ODOMETER_UNITS = ["mi", "km"] as const;

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString));
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, pageSize: 25, totalCount: 0, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{
        data: { data: Vehicle[]; meta: PaginationMeta };
        meta: { timestamp: string; requestId: string };
      }>("/vehicles", {
        page,
        pageSize: meta.pageSize,
        search: search || undefined,
      });
      setVehicles(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      console.error("Failed to fetch vehicles:", err);
    } finally {
      setLoading(false);
    }
  }, [page, meta.pageSize, search]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const openCreate = () => {
    setEditingVehicle(null);
    setForm(defaultForm);
    setFormOpen(true);
  };

  const openEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setForm({
      vin: vehicle.vin,
      licensePlate: vehicle.licensePlate,
      licenseState: vehicle.licenseState,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      trimLevel: vehicle.trimLevel,
      engine: vehicle.engine,
      transmission: vehicle.transmission,
      drivetrain: vehicle.drivetrain,
      fuelType: vehicle.fuelType,
      bodyClass: vehicle.bodyClass,
      odometer: vehicle.odometer,
      odometerUnit: vehicle.odometerUnit,
      notes: vehicle.notes,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingVehicle) {
        const res = await api.patch<{ data: Vehicle }>(`/vehicles/${editingVehicle.id}`, form);
        setVehicles((prev) => prev.map((v) => (v.id === editingVehicle.id ? res.data : v)));
      } else {
        const res = await api.post<{ data: Vehicle }>("/vehicles", form);
        setVehicles((prev) => [res.data, ...prev]);
        setMeta((prev) => ({ ...prev, totalCount: prev.totalCount + 1 }));
      }
      setFormOpen(false);
    } catch (err) {
      console.error("Failed to save vehicle:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/vehicles/${deleteTarget.id}`);
      setVehicles((prev) => prev.filter((v) => v.id !== deleteTarget.id));
      setMeta((prev) => ({ ...prev, totalCount: prev.totalCount - 1 }));
      setDeleteTarget(null);
    } catch (err) {
      console.error("Failed to delete vehicle:", err);
    } finally {
      setDeleting(false);
    }
  };

  const updateForm = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Car className="h-5 w-5 text-accent" />
            <h1 className="text-2xl font-semibold tracking-tight">Vehicles</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5 ml-7">
            Manage vehicles registered in the system
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Vehicle
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by VIN, make, model, or license plate..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setPage(1);
              (e.target as HTMLInputElement).blur();
            }
          }}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : vehicles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Car className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No vehicles found</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                {search ? "Try a different search term" : "Add your first vehicle to get started"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <Th>VIN</Th>
                    <Th>Make / Model / Year</Th>
                    <Th>License Plate</Th>
                    <Th>Color</Th>
                    <Th>Customers</Th>
                    <Th>Created</Th>
                    <Th className="w-20">Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((vehicle) => (
                    <tr
                      key={vehicle.id}
                      className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                    >
                      <Td>
                        <code className="text-xs font-mono">{vehicle.vin}</code>
                      </Td>
                      <Td>
                        <span className="font-medium">
                          {vehicle.make} {vehicle.model}
                        </span>
                        <span className="text-muted-foreground ml-1">{vehicle.year}</span>
                      </Td>
                      <Td>
                        {vehicle.licensePlate ? (
                          <span>
                            {vehicle.licensePlate}
                            {vehicle.licenseState && (
                              <span className="text-muted-foreground ml-1">({vehicle.licenseState})</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </Td>
                      <Td>
                        {vehicle.color ? (
                          <span className="flex items-center gap-2">
                            <span
                              className="inline-block h-3.5 w-3.5 rounded-full border border-border"
                              style={{ backgroundColor: vehicle.color.toLowerCase() }}
                            />
                            {vehicle.color}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </Td>
                      <Td>
                        <span className="tabular-nums">{vehicle._count?.customers ?? 0}</span>
                      </Td>
                      <Td>
                        <span className="text-muted-foreground">{formatDate(vehicle.createdAt)}</span>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(vehicle)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(vehicle)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
        {meta.totalPages > 1 && !loading && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing {(meta.page - 1) * meta.pageSize + 1}–{Math.min(meta.page * meta.pageSize, meta.totalCount)} of{" "}
              {meta.totalCount}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create / Edit Modal */}
      <Dialog.Root open={formOpen} onOpenChange={setFormOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[85vh] overflow-y-auto z-50 bg-background rounded-[var(--radius-xl)] shadow-lg border border-border p-0 data-[state=open]:animate-in data-[state=closed]:animate-out">
            <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between rounded-t-[var(--radius-xl)]">
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-accent" />
                <Dialog.Title className="text-lg font-semibold">
                  {editingVehicle ? "Edit Vehicle" : "Add Vehicle"}
                </Dialog.Title>
              </div>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon">
                  <X className="h-4 w-4" />
                </Button>
              </Dialog.Close>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <Field label="VIN" required>
                  <Input
                    placeholder="17-character VIN"
                    maxLength={17}
                    value={form.vin}
                    onChange={(e) => updateForm("vin", e.target.value.toUpperCase())}
                  />
                </Field>
                <Field label="License Plate">
                  <Input
                    placeholder="e.g. ABC123"
                    value={form.licensePlate}
                    onChange={(e) => updateForm("licensePlate", e.target.value)}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="License State">
                  <Input
                    placeholder="e.g. CA"
                    value={form.licenseState}
                    onChange={(e) => updateForm("licenseState", e.target.value)}
                  />
                </Field>
                <Field label="Make">
                  <Input
                    placeholder="e.g. Toyota"
                    value={form.make}
                    onChange={(e) => updateForm("make", e.target.value)}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Field label="Model">
                  <Input
                    placeholder="e.g. Camry"
                    value={form.model}
                    onChange={(e) => updateForm("model", e.target.value)}
                  />
                </Field>
                <Field label="Year">
                  <Input
                    type="number"
                    min={1900}
                    max={2099}
                    value={form.year}
                    onChange={(e) => updateForm("year", Number(e.target.value))}
                  />
                </Field>
                <Field label="Color">
                  <Input
                    placeholder="e.g. White"
                    value={form.color}
                    onChange={(e) => updateForm("color", e.target.value)}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Trim Level">
                  <Input
                    placeholder="e.g. LE"
                    value={form.trimLevel}
                    onChange={(e) => updateForm("trimLevel", e.target.value)}
                  />
                </Field>
                <Field label="Engine">
                  <Input
                    placeholder="e.g. 2.5L I4"
                    value={form.engine}
                    onChange={(e) => updateForm("engine", e.target.value)}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Transmission">
                  <Input
                    placeholder="e.g. Automatic"
                    value={form.transmission}
                    onChange={(e) => updateForm("transmission", e.target.value)}
                  />
                </Field>
                <Field label="Drivetrain">
                  <Input
                    placeholder="e.g. FWD"
                    value={form.drivetrain}
                    onChange={(e) => updateForm("drivetrain", e.target.value)}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Fuel Type">
                  <Input
                    placeholder="e.g. Gasoline"
                    value={form.fuelType}
                    onChange={(e) => updateForm("fuelType", e.target.value)}
                  />
                </Field>
                <Field label="Body Class">
                  <Input
                    placeholder="e.g. Sedan"
                    value={form.bodyClass}
                    onChange={(e) => updateForm("bodyClass", e.target.value)}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Odometer">
                  <Input
                    type="number"
                    min={0}
                    value={form.odometer}
                    onChange={(e) => updateForm("odometer", Number(e.target.value))}
                  />
                </Field>
                <Field label="Odometer Unit">
                  <select
                    value={form.odometerUnit}
                    onChange={(e) => updateForm("odometerUnit", e.target.value as "mi" | "km")}
                    className="flex h-10 w-full rounded-[var(--radius-md)] border border-border bg-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all duration-200"
                  >
                    {ODOMETER_UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Notes">
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => updateForm("notes", e.target.value)}
                  className="flex w-full rounded-[var(--radius-md)] border border-border bg-input px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all duration-200 resize-none"
                  placeholder="Additional notes about the vehicle..."
                />
              </Field>
            </div>

            <div className="sticky bottom-0 bg-background border-t border-border px-6 py-4 flex items-center justify-end gap-3 rounded-b-[var(--radius-xl)]">
              <Dialog.Close asChild>
                <Button variant="outline">Cancel</Button>
              </Dialog.Close>
              <Button onClick={handleSave} disabled={saving || !form.vin.trim()} className="gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingVehicle ? "Save Changes" : "Create Vehicle"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Confirmation */}
      <Dialog.Root open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 bg-background rounded-[var(--radius-xl)] shadow-lg border border-border p-0">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-destructive" />
                </div>
                <Dialog.Title className="text-lg font-semibold">Delete Vehicle</Dialog.Title>
              </div>
              <p className="text-sm text-muted-foreground ml-13">
                Are you sure you want to delete this vehicle? This action cannot be undone.
              </p>
              {deleteTarget && (
                <div className="mt-4 ml-13 p-3 rounded-[var(--radius-md)] bg-muted text-sm">
                  <span className="font-medium">
                    {deleteTarget.make} {deleteTarget.model}
                  </span>
                  <span className="text-muted-foreground ml-1">({deleteTarget.year})</span>
                  <br />
                  <code className="text-xs font-mono text-muted-foreground">{deleteTarget.vin}</code>
                </div>
              )}
            </div>
            <div className="border-t border-border px-6 py-4 flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
                className="gap-2"
              >
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

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider",
        className,
      )}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 text-sm">{children}</td>;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}
