"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import {
  Loader2, Save, Building2, Settings2, Receipt, Wrench,
  User, Lock, Mail, KeyRound, ShieldAlert,
} from "lucide-react";

type Branch = {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  settings?: Record<string, unknown>;
};

type BranchSettings = {
  defaultCurrency: string;
  timezone: string;
  defaultLaborRate: number;
  invoicePrefix: string;
  invoiceFooter: string;
  defaultPaymentTerms: number;
  defaultDueDays: number;
  defaultWorkOrderStatus: string;
  autoAssignMechanic: boolean;
  receiptFooter: string;
  taxRate: number;
};

const defaultSettings: BranchSettings = {
  defaultCurrency: "USD",
  timezone: "America/New_York",
  defaultLaborRate: 85,
  invoicePrefix: "INV-",
  invoiceFooter: "Thank you for your business!",
  defaultPaymentTerms: 30,
  defaultDueDays: 15,
  defaultWorkOrderStatus: "PENDING",
  autoAssignMechanic: false,
  receiptFooter: "All services guaranteed for 12 months or 12,000 miles.",
  taxRate: 0,
};

type Tab = "account" | "general" | "invoicing" | "workOrder";

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [settings, setSettings] = useState<BranchSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("account");

  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [changingEmail, setChangingEmail] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryOtp, setRecoveryOtp] = useState("");
  const [recoveryNewPassword, setRecoveryNewPassword] = useState("");
  const [recoveryStep, setRecoveryStep] = useState<"email" | "otp" | "done">("email");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [recoveryMsg, setRecoveryMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const fetchBranches = useCallback(async () => {
    try {
      const res = await api.get<{ data: Branch[] }>("/branches");
      const list = res.data;
      setBranches(list);
      if (list.length > 0 && !selectedBranchId) {
        setSelectedBranchId(list[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch branches:", err);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    if (!selectedBranchId) return;
    setLoading(true);
    try {
      const res = await api.get<{ data: Branch }>(`/branches/${selectedBranchId}`);
      const branch = res.data;
      setSettings({ ...defaultSettings, ...(branch.settings || {}) });
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId]);

  useEffect(() => { fetchBranches(); }, []);
  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await api.patch(`/branches/${selectedBranchId}`, { settings });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  }

  function setSetting<T extends keyof BranchSettings>(key: T, val: BranchSettings[T]) {
    setSettings((prev) => ({ ...prev, [key]: val }));
  }

  async function handleChangeEmail() {
    setEmailMsg(null);
    if (!newEmail || !emailPassword) {
      setEmailMsg({ ok: false, text: "Please fill in all fields" });
      return;
    }
    setChangingEmail(true);
    try {
      await api.post("/auth/change-email", { newEmail, password: emailPassword });
      setEmailMsg({ ok: true, text: "Email updated successfully" });
      setUser({ ...user!, email: newEmail });
      setNewEmail("");
      setEmailPassword("");
    } catch (err: any) {
      setEmailMsg({ ok: false, text: err.message || "Failed to update email" });
    } finally {
      setChangingEmail(false);
    }
  }

  async function handleChangePassword() {
    setPasswordMsg(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMsg({ ok: false, text: "Please fill in all fields" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ ok: false, text: "New passwords do not match" });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ ok: false, text: "Password must be at least 6 characters" });
      return;
    }
    setChangingPassword(true);
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword });
      setPasswordMsg({ ok: true, text: "Password updated successfully" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMsg({ ok: false, text: err.message || "Failed to update password" });
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleSendOtp() {
    setRecoveryMsg(null);
    if (!recoveryEmail) {
      setRecoveryMsg({ ok: false, text: "Please enter your email" });
      return;
    }
    setSendingOtp(true);
    try {
      await api.post("/auth/forgot-password", { email: recoveryEmail });
      setRecoveryMsg({ ok: true, text: "If the email exists, an OTP has been sent" });
      setRecoveryStep("otp");
    } catch (err: any) {
      setRecoveryMsg({ ok: false, text: err.message || "Failed to send OTP" });
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleResetPassword() {
    setRecoveryMsg(null);
    if (!recoveryOtp || !recoveryNewPassword) {
      setRecoveryMsg({ ok: false, text: "Please fill in all fields" });
      return;
    }
    if (recoveryNewPassword.length < 6) {
      setRecoveryMsg({ ok: false, text: "Password must be at least 6 characters" });
      return;
    }
    setResettingPassword(true);
    try {
      await api.post("/auth/reset-password", {
        email: recoveryEmail,
        otp: recoveryOtp,
        newPassword: recoveryNewPassword,
      });
      setRecoveryMsg({ ok: true, text: "Password reset successfully! You can now login with your new password." });
      setRecoveryStep("done");
    } catch (err: any) {
      setRecoveryMsg({ ok: false, text: err.message || "Failed to reset password" });
    } finally {
      setResettingPassword(false);
    }
  }

  function handleResetRecovery() {
    setRecoveryEmail("");
    setRecoveryOtp("");
    setRecoveryNewPassword("");
    setRecoveryStep("email");
    setRecoveryMsg(null);
  }

  const selectedBranch = branches.find((b) => b.id === selectedBranchId);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "account", label: "Account", icon: <User className="h-4 w-4" /> },
    { key: "general", label: "General", icon: <Settings2 className="h-4 w-4" /> },
    { key: "invoicing", label: "Invoicing", icon: <Receipt className="h-4 w-4" /> },
    { key: "workOrder", label: "Work Order", icon: <Wrench className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your account and branch preferences</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border pb-0.5 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-md transition-colors",
              activeTab === tab.key
                ? "bg-card text-foreground border border-b-0 border-border"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "account" && (
        <div className="space-y-6">
          {/* Change Email */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Change Email
              </div>
              <p className="text-xs text-muted-foreground">
                Current email: <span className="font-medium text-foreground">{user?.email}</span>
              </p>
              <div className="grid gap-3 max-w-sm">
                <div className="space-y-1.5">
                  <Label>New Email</Label>
                  <Input
                    type="email"
                    placeholder="newemail@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Current Password</Label>
                  <Input
                    type="password"
                    placeholder="Enter your current password"
                    value={emailPassword}
                    onChange={(e) => setEmailPassword(e.target.value)}
                  />
                </div>
              </div>
              {emailMsg && (
                <p className={cn("text-xs", emailMsg.ok ? "text-emerald-600" : "text-red-600")}>
                  {emailMsg.text}
                </p>
              )}
              <Button onClick={handleChangeEmail} disabled={changingEmail}>
                {changingEmail && <Loader2 className="h-4 w-4 animate-spin" />}
                Update Email
              </Button>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Lock className="h-4 w-4 text-muted-foreground" />
                Change Password
              </div>
              <div className="grid gap-3 max-w-sm">
                <div className="space-y-1.5">
                  <Label>Current Password</Label>
                  <Input
                    type="password"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>New Password</Label>
                  <Input
                    type="password"
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Confirm New Password</Label>
                  <Input
                    type="password"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
              {passwordMsg && (
                <p className={cn("text-xs", passwordMsg.ok ? "text-emerald-600" : "text-red-600")}>
                  {passwordMsg.text}
                </p>
              )}
              <Button onClick={handleChangePassword} disabled={changingPassword}>
                {changingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </CardContent>
          </Card>

          {/* Account Recovery */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <KeyRound className="h-4 w-4 text-muted-foreground" />
                Account Recovery
              </div>
              <p className="text-xs text-muted-foreground">
                Forgot your password? Request an OTP sent to your email to reset it.
              </p>

              {recoveryStep === "email" && (
                <div className="space-y-3 max-w-sm">
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="Your account email"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                    />
                  </div>
                  {recoveryMsg && (
                    <p className={cn("text-xs", recoveryMsg.ok ? "text-emerald-600" : "text-red-600")}>
                      {recoveryMsg.text}
                    </p>
                  )}
                  <Button onClick={handleSendOtp} disabled={sendingOtp}>
                    {sendingOtp && <Loader2 className="h-4 w-4 animate-spin" />}
                    Send OTP
                  </Button>
                </div>
              )}

              {recoveryStep === "otp" && (
                <div className="space-y-3 max-w-sm">
                  <div className="space-y-1.5">
                    <Label>OTP Code</Label>
                    <Input
                      placeholder="Enter the 6-digit code"
                      value={recoveryOtp}
                      onChange={(e) => setRecoveryOtp(e.target.value)}
                      maxLength={6}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>New Password</Label>
                    <Input
                      type="password"
                      placeholder="Min 6 characters"
                      value={recoveryNewPassword}
                      onChange={(e) => setRecoveryNewPassword(e.target.value)}
                    />
                  </div>
                  {recoveryMsg && (
                    <p className={cn("text-xs", recoveryMsg.ok ? "text-emerald-600" : "text-red-600")}>
                      {recoveryMsg.text}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button onClick={handleResetPassword} disabled={resettingPassword}>
                      {resettingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
                      Reset Password
                    </Button>
                    <Button variant="ghost" onClick={() => setRecoveryStep("email")}>
                      Back
                    </Button>
                  </div>
                </div>
              )}

              {recoveryStep === "done" && (
                <div className="space-y-3">
                  {recoveryMsg && (
                    <p className={cn("text-xs", recoveryMsg.ok ? "text-emerald-600" : "text-red-600")}>
                      {recoveryMsg.text}
                    </p>
                  )}
                  <Button variant="outline" onClick={handleResetRecovery}>
                    Start Over
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Branch Settings (unchanged) */}
      {activeTab !== "account" && (
        <>
          {/* Branch selector */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label>Branch</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors mt-1.5"
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                  >
                    {branches
                      .filter((b) => b.isActive)
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.code})
                        </option>
                      ))}
                  </select>
                </div>
                {selectedBranch && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-5">
                    <Building2 className="h-4 w-4" />
                    <span>{selectedBranch.name}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <Card>
                <CardContent className="pt-6 space-y-5">
                  {activeTab === "general" && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label>Default Currency</Label>
                          <Input
                            value={settings.defaultCurrency}
                            onChange={(e) => setSetting("defaultCurrency", e.target.value)}
                            placeholder="USD"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Timezone</Label>
                          <Input
                            value={settings.timezone}
                            onChange={(e) => setSetting("timezone", e.target.value)}
                            placeholder="America/New_York"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label>Default Labor Rate ($/hr)</Label>
                          <Input
                            type="number"
                            value={settings.defaultLaborRate}
                            onChange={(e) => setSetting("defaultLaborRate", Number(e.target.value))}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Tax Rate (%)</Label>
                          <Input
                            type="number"
                            value={settings.taxRate}
                            onChange={(e) => setSetting("taxRate", Number(e.target.value))}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === "invoicing" && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label>Invoice Prefix</Label>
                          <Input
                            value={settings.invoicePrefix}
                            onChange={(e) => setSetting("invoicePrefix", e.target.value)}
                            placeholder="INV-"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Default Payment Terms (days)</Label>
                          <Input
                            type="number"
                            value={settings.defaultPaymentTerms}
                            onChange={(e) => setSetting("defaultPaymentTerms", Number(e.target.value))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label>Default Due Days</Label>
                          <Input
                            type="number"
                            value={settings.defaultDueDays}
                            onChange={(e) => setSetting("defaultDueDays", Number(e.target.value))}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Invoice Footer</Label>
                        <textarea
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors mt-1.5"
                          value={settings.invoiceFooter}
                          onChange={(e) => setSetting("invoiceFooter", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Receipt Footer</Label>
                        <textarea
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors mt-1.5"
                          value={settings.receiptFooter}
                          onChange={(e) => setSetting("receiptFooter", e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  {activeTab === "workOrder" && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label>Default Work Order Status</Label>
                          <select
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors mt-1.5"
                            value={settings.defaultWorkOrderStatus}
                            onChange={(e) => setSetting("defaultWorkOrderStatus", e.target.value)}
                          >
                            <option value="PENDING">Pending</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                          </select>
                        </div>
                        <div className="space-y-1.5 pt-5">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.autoAssignMechanic}
                              onChange={(e) => setSetting("autoAssignMechanic", e.target.checked)}
                              className="h-4 w-4 rounded border-border"
                            />
                            <span className="text-sm font-medium">Auto-assign mechanic</span>
                          </label>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <div className="flex items-center justify-end gap-3">
                {saved && <span className="text-sm text-emerald-600 font-medium">Settings saved</span>}
                <Button onClick={save} disabled={saving || !selectedBranchId}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Save className="h-4 w-4" />
                  Save Settings
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
