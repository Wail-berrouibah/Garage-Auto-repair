"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Clock,
  User,
  Car,
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  Wrench,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type WoStatus = "OPEN" | "DIAGNOSED" | "WAITING_PARTS" | "IN_PROGRESS" | "QUALITY_CHECK" | "COMPLETED" | "DELIVERED";
type Priority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
type NoteType = "INTERNAL" | "CUSTOMER" | "TECHNICAL";

type WorkOrderDetail = {
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
  updatedAt: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    companyName: string | null;
    email: string;
    phone: string;
  };
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number | null;
    licensePlate: string;
    vin: string | null;
    color: string | null;
  };
  assignedMechanic: { id: string; firstName: string; lastName: string } | null;
  laborEntries: {
    id: string;
    description: string | null;
    estimatedHours: number;
    actualHours: number;
    rate: number;
    lineTotal: number;
    service: { id: string; name: string; code: string };
    mechanic: { id: string; firstName: string; lastName: string };
  }[];
  partEntries: {
    id: string;
    partNumber: string;
    partName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    isBackorder: boolean;
    stockItem: { id: string; partNumber: string | null; name: string } | null;
  }[];
  timeEntries: {
    id: string;
    clockIn: string;
    clockOut: string | null;
    totalMinutes: number | null;
    isBillable: boolean;
    mechanic: { id: string; firstName: string; lastName: string };
  }[];
  workNotes: {
    id: string;
    noteType: NoteType;
    content: string;
    isPinned: boolean;
    createdAt: string;
    author: { id: string; firstName: string; lastName: string };
  }[];
  statusHistory: {
    id: string;
    fromStatus: string | null;
    toStatus: string;
    changedBy: string;
    reason: string | null;
    createdAt: string;
  }[];
  _count: {
    woAttachments: number;
    invoices: number;
    qcResults: number;
  };
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

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(n: number | null) {
  if (n === null) return "—";
  return `$${n.toFixed(2)}`;
}

function getInitials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

const NEXT_STATUS: Record<WoStatus, WoStatus | null> = {
  OPEN: "DIAGNOSED",
  DIAGNOSED: "IN_PROGRESS",
  WAITING_PARTS: "IN_PROGRESS",
  IN_PROGRESS: "QUALITY_CHECK",
  QUALITY_CHECK: "COMPLETED",
  COMPLETED: "DELIVERED",
  DELIVERED: null,
};

export default function WorkOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [wo, setWo] = useState<WorkOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusReason, setStatusReason] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);

  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteForm, setNoteForm] = useState({ noteType: "INTERNAL" as NoteType, content: "" });
  const [noteSaving, setNoteSaving] = useState(false);

  const fetchWorkOrder = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: WorkOrderDetail }>(`/work-orders/${id}`);
      setWo(res.data);
    } catch (err) {
      console.error("Failed to load work order:", err);
      setError("Failed to load work order");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchWorkOrder();
  }, [fetchWorkOrder]);

  async function handleStatusChange() {
    if (!wo) return;
    const next = NEXT_STATUS[wo.status];
    if (!next) return;
    setStatusUpdating(true);
    try {
      await api.patch(`/work-orders/${id}/status`, {
        status: next,
        reason: statusReason || undefined,
      });
      setStatusDialogOpen(false);
      setStatusReason("");
      fetchWorkOrder();
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setStatusUpdating(false);
    }
  }

  async function handleAddNote() {
    if (!noteForm.content.trim()) return;
    setNoteSaving(true);
    try {
      await api.post(`/work-orders/${id}/notes`, {
        noteType: noteForm.noteType,
        content: noteForm.content,
      });
      setNoteDialogOpen(false);
      setNoteForm({ noteType: "INTERNAL", content: "" });
      fetchWorkOrder();
    } catch (err) {
      console.error("Failed to add note:", err);
    } finally {
      setNoteSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !wo) {
    return (
      <div className="text-center py-24">
        <p className="text-muted-foreground">{error || "Work order not found"}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const nextStatus = NEXT_STATUS[wo.status];

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/work-orders")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{wo.woNumber}</h1>
            <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", STATUS_STYLES[wo.status])}>
              {wo.status.replace(/_/g, " ")}
            </span>
            <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", PRIORITY_STYLES[wo.priority])}>
              {wo.priority}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Created {formatDate(wo.createdAt)}
            {wo.assignedMechanic && ` — Assigned to ${wo.assignedMechanic.firstName} ${wo.assignedMechanic.lastName}`}
          </p>
        </div>
        <div className="flex gap-2">
          {nextStatus && (
            <Button onClick={() => setStatusDialogOpen(true)}>
              <CheckCircle2 className="h-4 w-4" />
              Move to {nextStatus.replace(/_/g, " ")}
            </Button>
          )}
        </div>
      </div>

      {/* Customer + Vehicle Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Customer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="text-xs bg-accent/10 text-accent">
                  {getInitials(wo.customer.firstName, wo.customer.lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{wo.customer.firstName} {wo.customer.lastName}</p>
                {wo.customer.companyName && (
                  <p className="text-xs text-muted-foreground">{wo.customer.companyName}</p>
                )}
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-muted-foreground">{wo.customer.email}</p>
              <p className="text-muted-foreground">{wo.customer.phone}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Car className="h-4 w-4 text-muted-foreground" />
              Vehicle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{wo.vehicle.make} {wo.vehicle.model}</p>
            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
              <div>
                <span className="text-muted-foreground">Plate:</span> {wo.vehicle.licensePlate}
              </div>
              {wo.vehicle.vin && (
                <div>
                  <span className="text-muted-foreground">VIN:</span>{" "}
                  <span className="font-mono text-xs">{wo.vehicle.vin}</span>
                </div>
              )}
              {wo.vehicle.year && (
                <div>
                  <span className="text-muted-foreground">Year:</span> {wo.vehicle.year}
                </div>
              )}
              {wo.vehicle.color && (
                <div>
                  <span className="text-muted-foreground">Color:</span> {wo.vehicle.color}
                </div>
              )}
              {wo.odometerIn && (
                <div>
                  <span className="text-muted-foreground">Odometer:</span> {wo.odometerIn.toLocaleString()} mi
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Complaint + Diagnosis */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Customer Complaint</Label>
            <p className="mt-1 text-sm">{wo.complaint}</p>
          </div>
          {wo.diagnosis && (
            <div>
              <Label className="text-xs text-muted-foreground">Diagnosis</Label>
              <p className="mt-1 text-sm">{wo.diagnosis}</p>
            </div>
          )}
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Estimated Total</span>
              <p className="font-medium">{formatCurrency(wo.estimatedTotal)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Actual Total</span>
              <p className="font-medium">{formatCurrency(wo.actualTotal)}</p>
            </div>
            {wo.promisedDate && (
              <div>
                <span className="text-muted-foreground">Promised Date</span>
                <p className="font-medium">{formatDate(wo.promisedDate)}</p>
              </div>
            )}
            {wo.startedAt && (
              <div>
                <span className="text-muted-foreground">Started</span>
                <p className="font-medium">{formatDate(wo.startedAt)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Labor Entries */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Labor Entries</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {wo.laborEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground px-6 py-4">No labor entries recorded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left font-medium text-muted-foreground px-4 py-2">Service</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-2">Mechanic</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-2">Description</th>
                    <th className="text-right font-medium text-muted-foreground px-4 py-2">Hours</th>
                    <th className="text-right font-medium text-muted-foreground px-4 py-2">Rate</th>
                    <th className="text-right font-medium text-muted-foreground px-4 py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {wo.laborEntries.map((e) => (
                    <tr key={e.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-2">{e.service.name}</td>
                      <td className="px-4 py-2">{e.mechanic.firstName} {e.mechanic.lastName}</td>
                      <td className="px-4 py-2 text-muted-foreground">{e.description || "—"}</td>
                      <td className="px-4 py-2 text-right">{e.actualHours}h</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(e.rate)}</td>
                      <td className="px-4 py-2 text-right font-medium">{formatCurrency(e.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Part Entries */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Parts Used</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {wo.partEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground px-6 py-4">No parts recorded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left font-medium text-muted-foreground px-4 py-2">Part #</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-2">Name</th>
                    <th className="text-right font-medium text-muted-foreground px-4 py-2">Qty</th>
                    <th className="text-right font-medium text-muted-foreground px-4 py-2">Unit Price</th>
                    <th className="text-right font-medium text-muted-foreground px-4 py-2">Total</th>
                    <th className="text-center font-medium text-muted-foreground px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {wo.partEntries.map((e) => (
                    <tr key={e.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-2 font-mono text-xs">{e.partNumber}</td>
                      <td className="px-4 py-2">{e.partName}</td>
                      <td className="px-4 py-2 text-right">{e.quantity}</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(e.unitPrice)}</td>
                      <td className="px-4 py-2 text-right font-medium">{formatCurrency(e.lineTotal)}</td>
                      <td className="px-4 py-2 text-center">
                        {e.isBackorder ? (
                          <span className="text-xs text-amber-600 font-medium">Backorder</span>
                        ) : (
                          <span className="text-xs text-emerald-600 font-medium">In Stock</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Time Entries */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Time Tracking</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {wo.timeEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground px-6 py-4">No time entries recorded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left font-medium text-muted-foreground px-4 py-2">Mechanic</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-2">Clock In</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-2">Clock Out</th>
                    <th className="text-right font-medium text-muted-foreground px-4 py-2">Minutes</th>
                    <th className="text-center font-medium text-muted-foreground px-4 py-2">Billable</th>
                  </tr>
                </thead>
                <tbody>
                  {wo.timeEntries.map((e) => (
                    <tr key={e.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-2">{e.mechanic.firstName} {e.mechanic.lastName}</td>
                      <td className="px-4 py-2 text-xs">{formatDateTime(e.clockIn)}</td>
                      <td className="px-4 py-2 text-xs">{e.clockOut ? formatDateTime(e.clockOut) : "—"}</td>
                      <td className="px-4 py-2 text-right">
                        {e.totalMinutes !== null ? `${e.totalMinutes}m` : "—"}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {e.isBillable ? (
                          <span className="text-xs text-emerald-600 font-medium">Yes</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">No</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Notes</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setNoteDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add Note
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {wo.workNotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notes yet.</p>
          ) : (
            wo.workNotes.map((note) => (
              <div
                key={note.id}
                className={cn(
                  "rounded-[var(--radius-md)] border p-4 text-sm",
                  note.isPinned && "border-accent/30 bg-accent/[0.02]",
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium",
                    note.noteType === "INTERNAL" && "bg-gray-100 text-gray-700",
                    note.noteType === "CUSTOMER" && "bg-blue-50 text-blue-700",
                    note.noteType === "TECHNICAL" && "bg-purple-50 text-purple-700",
                  )}>
                    {note.noteType}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {note.author.firstName} {note.author.lastName} — {formatDateTime(note.createdAt)}
                  </span>
                </div>
                <p className="whitespace-pre-wrap">{note.content}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Status History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Status History</CardTitle>
        </CardHeader>
        <CardContent>
          {wo.statusHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No history.</p>
          ) : (
            <div className="space-y-3">
              {wo.statusHistory.map((h, i) => (
                <div key={h.id} className="flex items-start gap-3 text-sm">
                  <div className="flex flex-col items-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-accent/30 mt-1.5" />
                    {i < wo.statusHistory.length - 1 && (
                      <div className="w-px flex-1 bg-border" />
                    )}
                  </div>
                  <div className="pb-3">
                    <p>
                      {h.fromStatus ? (
                        <>{h.fromStatus.replace(/_/g, " ")} → <strong>{h.toStatus.replace(/_/g, " ")}</strong></>
                      ) : (
                        <strong>{h.toStatus.replace(/_/g, " ")}</strong>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDateTime(h.createdAt)}
                      {h.reason && ` — ${h.reason}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Change Dialog */}
      <Dialog.Root open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-background rounded-xl shadow-lg border border-border p-6">
            <Dialog.Title className="text-lg font-semibold">
              Move to {nextStatus?.replace(/_/g, " ")}
            </Dialog.Title>
            <p className="text-sm text-muted-foreground mt-2">
              Update work order {wo.woNumber} status from {wo.status.replace(/_/g, " ")} to{" "}
              {nextStatus?.replace(/_/g, " ")}.
            </p>
            <div className="mt-4 space-y-2">
              <Label htmlFor="statusReason">Reason (optional)</Label>
              <Input
                id="statusReason"
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="e.g. Diagnosis complete"
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleStatusChange} disabled={statusUpdating}>
                {statusUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
                Update Status
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Add Note Dialog */}
      <Dialog.Root open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-background rounded-xl shadow-lg border border-border p-6">
            <Dialog.Title className="text-lg font-semibold">Add Note</Dialog.Title>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="noteType">Type</Label>
                <select
                  id="noteType"
                  value={noteForm.noteType}
                  onChange={(e) => setNoteForm({ ...noteForm, noteType: e.target.value as NoteType })}
                  className="flex h-10 w-full rounded-[var(--radius-md)] border border-border bg-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="INTERNAL">Internal</option>
                  <option value="CUSTOMER">Customer</option>
                  <option value="TECHNICAL">Technical</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="noteContent">Content</Label>
                <textarea
                  id="noteContent"
                  value={noteForm.content}
                  onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                  placeholder="Write your note..."
                  rows={4}
                  className="flex min-h-[100px] w-full rounded-[var(--radius-md)] border border-border bg-input px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddNote} disabled={noteSaving || !noteForm.content.trim()}>
                {noteSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                Add Note
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
