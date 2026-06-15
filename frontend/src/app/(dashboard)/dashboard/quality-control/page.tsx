"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ClipboardCheck,
  FileText,
  Check,
  XCircle,
  Eye,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

type ChecklistTemplate = {
  id: string;
  name: string;
  serviceType: string | null;
  isActive: boolean;
  _count: { items: number; qcResults: number };
  items?: ChecklistItem[];
  createdAt: string;
};

type ChecklistItem = {
  id: string;
  description: string;
  isRequired: boolean;
  sortOrder: number;
};

type QcInspection = {
  id: string;
  workOrderId: string;
  result: string;
  notes: string | null;
  inspectedAt: string;
  template: { id: string; name: string };
  inspector: { id: string; firstName: string; lastName: string };
  workOrder?: { id: string; woNumber: string };
  _count?: { checks: number };
  checks?: QcCheck[];
};

type QcCheck = {
  id: string;
  checklistItemId: string;
  passed: boolean;
  notes: string | null;
  checklistItem: ChecklistItem;
};

const emptyTemplateForm = {
  name: "",
  serviceType: "",
};

const emptyItemForm = {
  description: "",
  isRequired: true,
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function QualityControlPage() {
  const [activeTab, setActiveTab] = useState<"templates" | "inspections">("templates");

  // ---- Templates State ----
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [templatesPage, setTemplatesPage] = useState(1);
  const [templatesTotalPages, setTemplatesTotalPages] = useState(1);
  const [templatesTotalCount, setTemplatesTotalCount] = useState(0);
  const [templatesSearch, setTemplatesSearch] = useState("");
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);

  // ---- Template CRUD ----
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [templateForm, setTemplateForm] = useState(emptyTemplateForm);
  const [templateSaving, setTemplateSaving] = useState(false);

  // ---- Template Items ----
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [itemTemplateId, setItemTemplateId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState(emptyItemForm);
  const [itemSaving, setItemSaving] = useState(false);
  const [templateItems, setTemplateItems] = useState<ChecklistItem[]>([]);

  // ---- Delete ----
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ---- Inspections State ----
  const [inspections, setInspections] = useState<QcInspection[]>([]);
  const [inspectionsPage, setInspectionsPage] = useState(1);
  const [inspectionsTotalPages, setInspectionsTotalPages] = useState(1);
  const [inspectionsTotalCount, setInspectionsTotalCount] = useState(0);
  const [inspectionsLoading, setInspectionsLoading] = useState(true);
  const [inspectionDetail, setInspectionDetail] = useState<QcInspection | null>(null);
  const [inspectionDetailOpen, setInspectionDetailOpen] = useState(false);

  // ---- Fetch Templates ----
  const fetchTemplates = useCallback(async (p: number, q: string) => {
    setTemplatesLoading(true);
    try {
      const res = await api.get<{
        data: { data: ChecklistTemplate[]; meta: any };
      }>("/qc/templates", { page: p, pageSize: 25, search: q || undefined });
      setTemplates(res.data.data);
      setTemplatesTotalPages(res.data.meta.totalPages);
      setTemplatesTotalCount(res.data.meta.totalCount);
    } catch {
      // silent
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates(templatesPage, templatesSearch);
  }, [templatesPage, fetchTemplates, templatesSearch]);

  function handleTemplatesSearchChange(value: string) {
    setTemplatesSearch(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => setTemplatesPage(1), 400);
    setSearchTimeout(timeout);
  }

  // ---- Template CRUD Handlers ----
  function openCreateTemplate() {
    setEditingTemplateId(null);
    setTemplateForm(emptyTemplateForm);
    setTemplateModalOpen(true);
  }

  async function openEditTemplate(template: ChecklistTemplate) {
    setEditingTemplateId(template.id);
    setTemplateForm({
      name: template.name,
      serviceType: template.serviceType || "",
    });
    setTemplateModalOpen(true);
  }

  async function handleSaveTemplate() {
    setTemplateSaving(true);
    try {
      if (editingTemplateId) {
        await api.patch(`/qc/templates/${editingTemplateId}`, templateForm);
      } else {
        await api.post("/qc/templates", templateForm);
      }
      setTemplateModalOpen(false);
      fetchTemplates(templatesPage, templatesSearch);
    } catch (err) {
      console.error("Failed to save template:", err);
      alert(err instanceof Error ? err.message : "Failed to save template");
    } finally {
      setTemplateSaving(false);
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
      await api.delete(`/qc/templates/${deletingId}`);
      setDeleteConfirmOpen(false);
      setDeletingId(null);
      fetchTemplates(templatesPage, templatesSearch);
    } catch {
      // silent
    } finally {
      setDeleting(false);
    }
  }

  // ---- Items Handlers ----
  async function toggleExpand(templateId: string) {
    if (expandedTemplate === templateId) {
      setExpandedTemplate(null);
      return;
    }
    setExpandedTemplate(templateId);
    try {
      const res = await api.get<{ data: ChecklistTemplate }>(`/qc/templates/${templateId}`);
      setTemplateItems(res.data.items || []);
    } catch {
      setTemplateItems([]);
    }
  }

  function openAddItem(templateId: string) {
    setItemTemplateId(templateId);
    setEditingItemId(null);
    setItemForm(emptyItemForm);
    setItemModalOpen(true);
  }

  function openEditItem(item: ChecklistItem) {
    setEditingItemId(item.id);
    setItemForm({
      description: item.description,
      isRequired: item.isRequired,
    });
    setItemModalOpen(true);
  }

  async function handleSaveItem() {
    if (!itemTemplateId) return;
    setItemSaving(true);
    try {
      if (editingItemId) {
        await api.patch(`/qc/templates/${itemTemplateId}/items/${editingItemId}`, itemForm);
      } else {
        await api.post(`/qc/templates/${itemTemplateId}/items`, itemForm);
      }
      setItemModalOpen(false);
      toggleExpand(itemTemplateId);
    } catch (err) {
      console.error("Failed to save item:", err);
      alert(err instanceof Error ? err.message : "Failed to save item");
    } finally {
      setItemSaving(false);
    }
  }

  async function handleDeleteItem(itemId: string) {
    if (!itemTemplateId) return;
    try {
      await api.delete(`/qc/templates/${itemTemplateId}/items/${itemId}`);
      toggleExpand(itemTemplateId);
    } catch {
      // silent
    }
  }

  // ---- Fetch Inspections ----
  const fetchInspections = useCallback(async (p: number) => {
    setInspectionsLoading(true);
    try {
      const res = await api.get<{
        data: { data: QcInspection[]; meta: any };
      }>("/qc/inspections", { page: p, pageSize: 25 });
      setInspections(res.data.data);
      setInspectionsTotalPages(res.data.meta.totalPages);
      setInspectionsTotalCount(res.data.meta.totalCount);
    } catch {
      // silent
    } finally {
      setInspectionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "inspections") {
      fetchInspections(inspectionsPage);
    }
  }, [activeTab, inspectionsPage, fetchInspections]);

  async function openInspectionDetail(id: string) {
    try {
      const res = await api.get<{ data: QcInspection }>(`/qc/inspections/${id}`);
      setInspectionDetail(res.data);
      setInspectionDetailOpen(true);
    } catch {
      // silent
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Quality Control</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage inspection checklists and review work order quality inspections
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        <button
          onClick={() => setActiveTab("templates")}
          className={cn(
            "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
            activeTab === "templates"
              ? "border-accent text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <FileText className="h-4 w-4 inline mr-2" />
          Checklist Templates
        </button>
        <button
          onClick={() => setActiveTab("inspections")}
          className={cn(
            "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
            activeTab === "inspections"
              ? "border-accent text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <ClipboardCheck className="h-4 w-4 inline mr-2" />
          Inspections
        </button>
      </div>

      {/* Templates Tab */}
      {activeTab === "templates" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search templates..."
                value={templatesSearch}
                onChange={(e) => handleTemplatesSearchChange(e.target.value)}
                className="pl-10 bg-muted/50"
              />
            </div>
            <Button onClick={openCreateTemplate} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Template
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {templatesTotalCount > 0
                  ? `${templatesTotalCount} template${templatesTotalCount !== 1 ? "s" : ""}`
                  : "Templates"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {templatesLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-16 text-sm text-muted-foreground">
                  {templatesSearch
                    ? "No templates match your search."
                    : "No templates yet. Create your first checklist template."}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-[1fr_0.8fr_0.5fr_0.5fr_80px] gap-4 px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border">
                    <div>Name</div>
                    <div>Service Type</div>
                    <div>Items</div>
                    <div>Inspections</div>
                    <div className="text-right">Actions</div>
                  </div>
                  {templates.map((template) => (
                    <div key={template.id}>
                      <div className="grid grid-cols-[1fr_0.8fr_0.5fr_0.5fr_80px] gap-4 px-6 py-4 items-center text-sm border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleExpand(template.id)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            {expandedTemplate === template.id ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                          <span className="font-medium">{template.name}</span>
                          {!template.isActive && (
                            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              inactive
                            </span>
                          )}
                        </div>
                        <div className="text-muted-foreground">
                          {template.serviceType || "—"}
                        </div>
                        <div className="text-muted-foreground">{template._count.items}</div>
                        <div className="text-muted-foreground">{template._count.qcResults}</div>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditTemplate(template)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => openDeleteConfirm(template.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Expanded Items */}
                      {expandedTemplate === template.id && (
                        <div className="bg-muted/20 border-b border-border">
                          <div className="flex items-center justify-between px-6 py-2">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Checklist Items
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 h-7 text-xs"
                              onClick={() => openAddItem(template.id)}
                            >
                              <Plus className="h-3 w-3" />
                              Add Item
                            </Button>
                          </div>
                          {templateItems.length === 0 ? (
                            <p className="px-6 pb-3 text-sm text-muted-foreground">
                              No items in this template.
                            </p>
                          ) : (
                            <div className="px-6 pb-3 space-y-1">
                              {templateItems.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                                >
                                  <div className="flex items-center gap-2">
                                    {item.isRequired ? (
                                      <span className="text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded font-medium">
                                        Required
                                      </span>
                                    ) : (
                                      <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                                        Optional
                                      </span>
                                    )}
                                    <span>{item.description}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => openEditItem(item)}
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-destructive hover:text-destructive"
                                      onClick={() => handleDeleteItem(item.id)}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Pagination */}
                  {templatesTotalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                      <span className="text-xs text-muted-foreground">
                        Page {templatesPage} of {templatesTotalPages}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={templatesPage <= 1}
                          onClick={() => setTemplatesPage((p) => Math.max(1, p - 1))}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={templatesPage >= templatesTotalPages}
                          onClick={() => setTemplatesPage((p) => p + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Inspections Tab */}
      {activeTab === "inspections" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {inspectionsTotalCount > 0
                  ? `${inspectionsTotalCount} inspection${inspectionsTotalCount !== 1 ? "s" : ""}`
                  : "Inspections"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {inspectionsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : inspections.length === 0 ? (
                <div className="text-center py-16 text-sm text-muted-foreground">
                  No inspections yet. Perform a QC inspection on a work order.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-[1fr_1fr_0.8fr_0.8fr_0.6fr_80px] gap-4 px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border">
                    <div>Work Order</div>
                    <div>Template</div>
                    <div>Inspector</div>
                    <div>Result</div>
                    <div>Date</div>
                    <div className="text-right">Actions</div>
                  </div>
                  {inspections.map((inspection) => (
                    <div
                      key={inspection.id}
                      className="grid grid-cols-[1fr_1fr_0.8fr_0.8fr_0.6fr_80px] gap-4 px-6 py-4 items-center text-sm border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
                    >
                      <div className="font-medium">
                        {inspection.workOrder?.woNumber || inspection.workOrderId.slice(0, 8)}
                      </div>
                      <div className="text-muted-foreground">{inspection.template.name}</div>
                      <div className="text-muted-foreground">
                        {inspection.inspector.firstName} {inspection.inspector.lastName}
                      </div>
                      <div>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                            inspection.result === "PASS"
                              ? "bg-green-50 text-green-700"
                              : inspection.result === "FAIL"
                                ? "bg-red-50 text-red-700"
                                : "bg-yellow-50 text-yellow-700",
                          )}
                        >
                          {inspection.result === "PASS" ? (
                            <Check className="h-3 w-3" />
                          ) : inspection.result === "FAIL" ? (
                            <XCircle className="h-3 w-3" />
                          ) : (
                            <Loader2 className="h-3 w-3" />
                          )}
                          {inspection.result}
                        </span>
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {formatDate(inspection.inspectedAt)}
                      </div>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openInspectionDetail(inspection.id)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* Pagination */}
                  {inspectionsTotalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                      <span className="text-xs text-muted-foreground">
                        Page {inspectionsPage} of {inspectionsTotalPages}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={inspectionsPage <= 1}
                          onClick={() => setInspectionsPage((p) => Math.max(1, p - 1))}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={inspectionsPage >= inspectionsTotalPages}
                          onClick={() => setInspectionsPage((p) => p + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create/Edit Template Modal */}
      <Dialog.Root open={templateModalOpen} onOpenChange={setTemplateModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md rounded-[var(--radius-xl)] bg-card shadow-lg border border-border p-6">
            <Dialog.Title className="text-lg font-semibold tracking-tight">
              {editingTemplateId ? "Edit Template" : "Add Template"}
            </Dialog.Title>
            <Dialog.Description className="text-sm text-muted-foreground mt-1 mb-6">
              {editingTemplateId
                ? "Update the checklist template details."
                : "Create a new checklist template for quality inspections."}
            </Dialog.Description>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Oil Change QC"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceType">Service Type (optional)</Label>
                <Input
                  id="serviceType"
                  value={templateForm.serviceType}
                  onChange={(e) => setTemplateForm((p) => ({ ...p, serviceType: e.target.value }))}
                  placeholder="OIL_CHANGE, BRAKE_REPAIR, etc."
                />
                <p className="text-xs text-muted-foreground">
                  Used to auto-assign templates to matching work order services.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-8">
              <Dialog.Close asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </Dialog.Close>
              <Button onClick={handleSaveTemplate} disabled={templateSaving || !templateForm.name}>
                {templateSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingTemplateId ? "Update" : "Create"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Add/Edit Item Modal */}
      <Dialog.Root open={itemModalOpen} onOpenChange={setItemModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md rounded-[var(--radius-xl)] bg-card shadow-lg border border-border p-6">
            <Dialog.Title className="text-lg font-semibold tracking-tight">
              {editingItemId ? "Edit Item" : "Add Item"}
            </Dialog.Title>
            <Dialog.Description className="text-sm text-muted-foreground mt-1 mb-6">
              {editingItemId
                ? "Update the checklist item."
                : "Add a new item to the checklist."}
            </Dialog.Description>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={itemForm.description}
                  onChange={(e) => setItemForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Check oil level and condition"
                  rows={3}
                  className="flex w-full rounded-[var(--radius-md)] border border-border bg-input px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all duration-200 resize-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isRequired"
                  checked={itemForm.isRequired}
                  onChange={(e) => setItemForm((p) => ({ ...p, isRequired: e.target.checked }))}
                  className="h-4 w-4 rounded border-border accent-accent"
                />
                <Label htmlFor="isRequired" className="text-sm">Required check</Label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-8">
              <Dialog.Close asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </Dialog.Close>
              <Button onClick={handleSaveItem} disabled={itemSaving || !itemForm.description}>
                {itemSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingItemId ? "Update" : "Add"}
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
              Delete Template
            </Dialog.Title>
            <Dialog.Description className="text-sm text-muted-foreground mt-2">
              Are you sure you want to delete this template? This action cannot be undone.
            </Dialog.Description>
            <div className="flex items-center justify-end gap-3 mt-6">
              <Dialog.Close asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </Dialog.Close>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Inspection Detail Modal */}
      <Dialog.Root open={inspectionDetailOpen} onOpenChange={setInspectionDetailOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-[var(--radius-xl)] bg-card shadow-lg border border-border p-6">
            <Dialog.Title className="text-lg font-semibold tracking-tight flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Inspection Details
            </Dialog.Title>
            {inspectionDetail && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Work Order:</span>
                    <p className="font-medium">
                      {inspectionDetail.workOrder?.woNumber || inspectionDetail.workOrderId}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Template:</span>
                    <p className="font-medium">{inspectionDetail.template.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Inspector:</span>
                    <p className="font-medium">
                      {inspectionDetail.inspector.firstName} {inspectionDetail.inspector.lastName}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Result:</span>
                    <p>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                          inspectionDetail.result === "PASS"
                            ? "bg-green-50 text-green-700"
                            : inspectionDetail.result === "FAIL"
                              ? "bg-red-50 text-red-700"
                              : "bg-yellow-50 text-yellow-700",
                        )}
                      >
                        {inspectionDetail.result === "PASS" ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {inspectionDetail.result}
                      </span>
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Inspected At:</span>
                    <p className="font-medium">{formatDate(inspectionDetail.inspectedAt)}</p>
                  </div>
                  {inspectionDetail.notes && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Notes:</span>
                      <p className="text-sm mt-1 bg-muted/30 rounded-md p-3">
                        {inspectionDetail.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Checks */}
                {inspectionDetail.checks && inspectionDetail.checks.length > 0 && (
                  <div className="border-t border-border pt-4">
                    <h4 className="text-sm font-medium mb-3">Checklist Items</h4>
                    <div className="space-y-2">
                      {inspectionDetail.checks.map((check) => (
                        <div
                          key={check.id}
                          className="flex items-start gap-3 rounded-md border border-border p-3 text-sm"
                        >
                          {check.passed ? (
                            <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                          )}
                          <div>
                            <p className="font-medium">{check.checklistItem.description}</p>
                            {check.notes && (
                              <p className="text-xs text-muted-foreground mt-0.5">{check.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end mt-6">
              <Dialog.Close asChild>
                <Button variant="outline">Close</Button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
