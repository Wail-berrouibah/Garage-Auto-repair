"use client";

import { useCallback, useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Search, Plus, Pencil, X, Loader2, Users as UsersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
  roles: { role: { id: string; name: string } }[];
  branchAssignments: { branch: { id: string; name: string } }[];
  createdAt: string;
};

type Role = {
  id: string;
  name: string;
};

type Branch = {
  id: string;
  name: string;
};

type FormData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  roleIds: string[];
  branchIds: string[];
};

const defaults: FormData = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  phone: "",
  roleIds: [],
  branchIds: [],
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [data, setData] = useState<FormData>(defaults);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [globalError, setGlobalError] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<{ data: { data: User[] } }>("/users", {
        search: query || undefined,
      });
      setUsers(res.data.data);
    } catch { setUsers([]); }
    finally { setLoading(false); }
  }, [query]);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await api.get<{ data: Role[] }>("/roles");
      setRoles(res.data);
    } catch { setRoles([]); }
  }, []);

  const fetchBranches = useCallback(async () => {
    try {
      const res = await api.get<{ data: Branch[] }>("/branches");
      setBranches(res.data);
    } catch { setBranches([]); }
  }, []);

  useEffect(() => { fetchUsers(); fetchRoles(); fetchBranches(); }, [fetchUsers, fetchRoles, fetchBranches]);

  function f(key: keyof FormData, val: string | string[]) {
    setData({ ...data, [key]: val as any });
  }

  function openCreate() {
    setEditId(null);
    setData(defaults);
    setErrors({});
    setGlobalError("");
    setOpen(true);
  }

  async function openEdit(id: string) {
    try {
      setSaving(true);
      const res = await api.get<{ data: User }>(`/users/${id}`);
      const u = res.data;
      setEditId(id);
      setData({
        email: u.email,
        password: "",
        firstName: u.firstName,
        lastName: u.lastName,
        phone: u.phone || "",
        roleIds: u.roles.map((r) => r.role.id),
        branchIds: u.branchAssignments.map((b) => b.branch.id),
      });
      setErrors({});
      setGlobalError("");
      setOpen(true);
    } catch { console.error("Failed to fetch user"); }
    finally { setSaving(false); }
  }

  function validate() {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!data.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errs.email = "Invalid email format";
    if (!editId && !data.password.trim()) errs.password = "Password is required";
    if (editId && data.password && data.password.length < 8) errs.password = "Password must be at least 8 characters";
    if (!data.firstName.trim()) errs.firstName = "First name is required";
    if (!data.lastName.trim()) errs.lastName = "Last name is required";
    if (!data.roleIds.length) errs.roleIds = "At least one role is required";
    if (!data.branchIds.length) errs.branchIds = "At least one branch is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    setSaving(true);
    setGlobalError("");
    try {
      const body = editId
        ? { firstName: data.firstName, lastName: data.lastName, phone: data.phone || undefined, password: data.password || undefined, roleIds: data.roleIds, branchIds: data.branchIds }
        : data;
      editId ? await api.patch(`/users/${editId}`, body) : await api.post("/users", body);
      setOpen(false);
      fetchUsers();
    } catch (err: any) {
      setGlobalError(err?.message || "Failed to save user");
    } finally { setSaving(false); }
  }

  function toggleRole(roleId: string) {
    f("roleIds", data.roleIds.includes(roleId) ? data.roleIds.filter((id) => id !== roleId) : [...data.roleIds, roleId]);
  }

  function toggleBranch(branchId: string) {
    f("branchIds", data.branchIds.includes(branchId) ? data.branchIds.filter((id) => id !== branchId) : [...data.branchIds, branchId]);
  }

  const filtered = users.filter((u) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return [u.firstName, u.lastName, u.email].some((s) => s.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage system users and their permissions</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add User
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search users..." className="pl-9 max-w-sm" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} />
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Name", "Email", "Phone", "Roles", "Branches", "Status", "Actions"].map((h) => (
                  <th key={h} className={cn("px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider", h === "Actions" && "text-right")}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" /> Loading users...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    <UsersIcon className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    {query ? "No users match your search" : "No users yet"}
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium">{u.firstName} {u.lastName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.phone || "\u2014"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((r) => (
                          <span key={r.role.id} className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                            {r.role.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.branchAssignments.map((b) => (
                          <span key={b.branch.id} className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                            {b.branch.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", u.isActive ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" : "bg-gray-50 text-gray-600 ring-gray-500/10")}>
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(u.id)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
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
                {editId ? "Edit User" : "Add User"}
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8"><X className="h-4 w-4" /></Button>
              </Dialog.Close>
            </div>

            <div className="p-5 space-y-4">
              {globalError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{globalError}</div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Field label="First Name" error={errors.firstName} required>
                  <Input value={data.firstName} onChange={(e) => f("firstName", e.target.value)} placeholder="John" />
                </Field>
                <Field label="Last Name" error={errors.lastName} required>
                  <Input value={data.lastName} onChange={(e) => f("lastName", e.target.value)} placeholder="Doe" />
                </Field>
              </div>

              <Field label="Email" error={errors.email} required>
                <Input type="email" value={data.email} onChange={(e) => f("email", e.target.value)} placeholder="john@mechanica.com" />
              </Field>

              <Field label={editId ? "New Password (leave blank to keep)" : "Password"} error={errors.password} required={!editId}>
                <Input type="password" value={data.password} onChange={(e) => f("password", e.target.value)} placeholder="Min. 8 characters" />
              </Field>

              <Field label="Phone">
                <Input value={data.phone} onChange={(e) => f("phone", e.target.value)} placeholder="+1-555-0123" />
              </Field>

              <Field label="Roles" error={errors.roleIds} required>
                <div className="flex flex-wrap gap-2 mt-1">
                  {roles.map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => toggleRole(role.id)}
                      className={cn("inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition-colors", data.roleIds.includes(role.id) ? "bg-blue-50 text-blue-700 ring-blue-600/20" : "bg-gray-50 text-gray-500 ring-gray-300 hover:bg-gray-100")}
                    >
                      {role.name}
                    </button>
                  ))}
                  {roles.length === 0 && <span className="text-xs text-muted-foreground">No roles available</span>}
                </div>
              </Field>

              <Field label="Branches" error={errors.branchIds} required>
                <div className="flex flex-wrap gap-2 mt-1">
                  {branches.map((branch) => (
                    <button
                      key={branch.id}
                      type="button"
                      onClick={() => toggleBranch(branch.id)}
                      className={cn("inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition-colors", data.branchIds.includes(branch.id) ? "bg-amber-50 text-amber-700 ring-amber-600/20" : "bg-gray-50 text-gray-500 ring-gray-300 hover:bg-gray-100")}
                    >
                      {branch.name}
                    </button>
                  ))}
                  {branches.length === 0 && <span className="text-xs text-muted-foreground">No branches available</span>}
                </div>
              </Field>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-border">
              <Dialog.Close asChild><Button variant="outline">Cancel</Button></Dialog.Close>
              <Button onClick={submit} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editId ? "Save Changes" : "Create User"}
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
