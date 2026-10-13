"use client";

import { useState, useEffect, useCallback } from "react";
import {
  User as UserIcon,
  Shield,
  Bell,
  Save,
  Loader2,
  Trash2,
  CheckCircle2,
  XCircle,
  Settings as SettingsIcon,
  Mail,
  BellRing,
  Megaphone,
  Clock,
  Languages,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { settingsApi, type Preferences } from "@/lib/api/settings";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/learning-generator/ConfirmDialog";

type Tab = "profile" | "security" | "preferences";

const JAVA_LEVELS = ["beginner", "intermediate", "advanced"] as const;

const inputClasses =
  "h-11 w-full rounded-xl border border-border bg-muted px-4 text-sm text-foreground placeholder:text-subtle-foreground transition-all hover:border-border-strong hover:bg-surface-3 focus-visible:border-teal-500/70 focus-visible:ring-0 focus-visible:bg-surface-3 focus-visible:outline-none";

const fieldLabel =
  "block text-sm font-medium text-foreground/80 mb-1.5";

function StatusBanner({
  kind,
  message,
}: {
  kind: "success" | "error";
  message: string | null;
}) {
  if (!message) return null;
  return (
    <div
      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium border ${
        kind === "success"
          ? "bg-teal-500/10 border-teal-500/20 text-teal-700 dark:text-teal-300"
          : "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300"
      }`}
    >
      {kind === "success" ? (
        <CheckCircle2 className="w-4 h-4 shrink-0" />
      ) : (
        <XCircle className="w-4 h-4 shrink-0" />
      )}
      {message}
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
  icon,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="text-xs text-subtle-foreground mt-0.5">{description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
          checked ? "bg-teal-500" : "bg-border-strong"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState<Tab>("profile");
  const [mounted, setMounted] = useState(false);

  // Profile
  const [form, setForm] = useState({
    name: "",
    javaLevel: "beginner" as "beginner" | "intermediate" | "advanced",
    institution: "",
    country: "",
    bio: "",
    avatarUrl: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  // Security
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  // Preferences
  const [prefs, setPrefs] = useState({
    notifications: { email: true, push: true, marketing: false },
    language: "en",
    timezone: "",
  });
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsMsg, setPrefsMsg] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  // Danger zone
  const [deletePw, setDeletePw] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const profile = user?.profile;
    setForm({
      name: user?.name || "",
      javaLevel: (profile?.java_level as "beginner" | "intermediate" | "advanced") || "beginner",
      institution: profile?.institution || "",
      country: profile?.country || "",
      bio: profile?.bio || "",
      avatarUrl: profile?.avatar_url || "",
    });
  }, [user]);

  const loadPreferences = useCallback(async () => {
    if (!mounted) return;
    setPrefsLoading(true);
    const res = await settingsApi.getPreferences();
    if (res.success && res.data) {
      const p = res.data;
      setPrefs({
        notifications: {
          email: p.notifications?.email ?? true,
          push: p.notifications?.push ?? true,
          marketing: p.notifications?.marketing ?? false,
        },
        language: p.language || "en",
        timezone:
          p.timezone ||
          (typeof window !== "undefined"
            ? Intl.DateTimeFormat().resolvedOptions().timeZone
            : "UTC"),
      });
    } else {
      setPrefs((prev) => ({
        ...prev,
        timezone:
          prev.timezone ||
          (typeof window !== "undefined"
            ? Intl.DateTimeFormat().resolvedOptions().timeZone
            : "UTC"),
      }));
    }
    setPrefsLoading(false);
  }, [mounted]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const switchTab = (t: Tab) => {
    setTab(t);
    setProfileMsg(null);
    setPwMsg(null);
    setPrefsMsg(null);
  };

  const saveProfile = async () => {
    setProfileSaving(true);
    setProfileMsg(null);
    const res = await settingsApi.updateProfile({
      name: form.name && form.name !== user?.name ? form.name : undefined,
      profile: {
        avatar_url: form.avatarUrl !== user?.profile?.avatar_url ? form.avatarUrl : undefined,
        bio: form.bio !== user?.profile?.bio ? form.bio : undefined,
        java_level: form.javaLevel,
        institution: form.institution !== user?.profile?.institution ? form.institution : undefined,
        country: form.country !== user?.profile?.country ? form.country : undefined,
      },
    });
    if (res.success) {
      await refreshUser();
      setProfileMsg({ kind: "success", message: res.message || "Profile updated successfully." });
    } else {
      setProfileMsg({ kind: "error", message: res.error || res.message || "Failed to update profile." });
    }
    setProfileSaving(false);
  };

  const savePassword = async () => {
    setPwMsg(null);
    if (pw.next.length < 6) {
      setPwMsg({ kind: "error", message: "New password must be at least 6 characters." });
      return;
    }
    if (pw.next !== pw.confirm) {
      setPwMsg({ kind: "error", message: "New password and confirmation do not match." });
      return;
    }
    setPwSaving(true);
    const res = await settingsApi.updatePassword(pw.current, pw.next);
    if (res.success) {
      setPw({ current: "", next: "", confirm: "" });
      setPwMsg({
        kind: "success",
        message: res.message || "Password updated. Please log in again.",
      });
    } else {
      setPwMsg({
        kind: "error",
        message: res.error || res.message || "Failed to update password.",
      });
    }
    setPwSaving(false);
  };

  const savePreferences = async () => {
    setPrefsSaving(true);
    setPrefsMsg(null);
    const res = await settingsApi.updatePreferences({
      notifications: prefs.notifications,
      language: prefs.language,
      timezone: prefs.timezone,
    });
    if (res.success) {
      setPrefsMsg({ kind: "success", message: res.message || "Preferences saved." });
    } else {
      setPrefsMsg({ kind: "error", message: res.error || res.message || "Failed to save preferences." });
    }
    setPrefsSaving(false);
  };

  const performDelete = async () => {
    if (!deletePw || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    const res = await settingsApi.deleteAccount(deletePw);
    if (res.success) {
      await refreshUser();
    } else {
      setDeleting(false);
      setDeleteError(res.error || res.message || "Unable to delete account.");
    }
  };

  const setField = (
    key: keyof typeof form,
    value: string | (typeof form)["javaLevel"],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const cancelDelete = () => {
    if (deleting) return;
    setShowDeleteConfirm(false);
    setDeleteError(null);
  };

  const tabs: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "profile", label: "Profile", icon: UserIcon },
    { key: "security", label: "Security", icon: Shield },
    { key: "preferences", label: "Preferences", icon: Bell },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center">
          <SettingsIcon className="w-6 h-6 text-teal-700 dark:text-teal-400" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your profile, security and preferences.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => switchTab(t.key)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors border ${
              tab === t.key
                ? "bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-400"
                : "bg-muted border-border text-muted-foreground hover:text-foreground/80 hover:bg-surface-3"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="p-6 bg-surface-3/20 border border-border rounded-2xl space-y-4">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-teal-700 dark:text-teal-400" /> Personal Information
            </h3>

            <div className="space-y-1.5">
              <Label htmlFor="name" className={fieldLabel}>Full name</Label>
              <Input id="name" value={form.name} onChange={(e) => setField("name", e.target.value)} className={inputClasses} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className={fieldLabel}>Email</Label>
              <Input id="email" value={user?.email || ""} disabled className={`${inputClasses} opacity-60`} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="studentId" className={fieldLabel}>Student ID</Label>
              <Input id="studentId" value={user?.student_id || ""} disabled className={`${inputClasses} opacity-60`} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="javaLevel" className={fieldLabel}>Java level</Label>
                <select
                  id="javaLevel"
                  value={form.javaLevel}
                  onChange={(e) => setField("javaLevel", e.target.value as typeof form.javaLevel)}
                  className={`${inputClasses} appearance-none bg-[#0F172F] cursor-pointer`}
                >
                  {JAVA_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl} className="capitalize">{lvl}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="country" className={fieldLabel}>Country</Label>
                <Input id="country" value={form.country} onChange={(e) => setField("country", e.target.value)} className={inputClasses} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="institution" className={fieldLabel}>Institution</Label>
              <Input id="institution" value={form.institution} onChange={(e) => setField("institution", e.target.value)} className={inputClasses} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="avatarUrl" className={fieldLabel}>Avatar URL</Label>
              <Input id="avatarUrl" value={form.avatarUrl} onChange={(e) => setField("avatarUrl", e.target.value)} placeholder="https://..." className={inputClasses} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 bg-surface-3/20 border border-border rounded-2xl space-y-4">
              <h3 className="text-lg font-bold text-foreground">Bio</h3>
              <div className="space-y-1.5">
                <Label htmlFor="bio" className={fieldLabel}>About you</Label>
                <textarea
                  id="bio"
                  value={form.bio}
                  onChange={(e) => setField("bio", e.target.value)}
                  rows={5}
                  maxLength={500}
                  placeholder="Tell your tutor a bit about yourself..."
                  className={`${inputClasses} h-auto py-3 resize-none`}
                />
                <p className="text-xs text-subtle-foreground text-right">{form.bio.length}/500</p>
              </div>
            </div>

            <div className="space-y-3">
              {profileMsg && <StatusBanner kind={profileMsg.kind} message={profileMsg.message} />}
              <Button
                onClick={saveProfile}
                disabled={profileSaving}
                className="w-full h-11 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold cursor-pointer"
              >
                {profileSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {tab === "security" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="p-6 bg-surface-3/20 border border-border rounded-2xl space-y-4">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5 text-teal-700 dark:text-teal-400" /> Change Password
            </h3>

            <div className="space-y-1.5">
              <Label htmlFor="currentPw" className={fieldLabel}>Current password</Label>
              <Input id="currentPw" type="password" value={pw.current} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} className={inputClasses} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newPw" className={fieldLabel}>New password</Label>
              <Input id="newPw" type="password" value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} className={inputClasses} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPw" className={fieldLabel}>Confirm new password</Label>
              <Input id="confirmPw" type="password" value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} className={inputClasses} />
            </div>

            <div className="space-y-3 pt-1">
              {pwMsg && <StatusBanner kind={pwMsg.kind} message={pwMsg.message} />}
              <Button
                onClick={savePassword}
                disabled={pwSaving || !pw.current || !pw.next}
                className="w-full h-11 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold cursor-pointer"
              >
                {pwSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                Update Password
              </Button>
            </div>
          </div>

          <div className="p-6 bg-red-500/[0.04] border border-red-500/15 rounded-2xl space-y-4 h-fit">
            <h3 className="text-lg font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Danger Zone
            </h3>
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all associated data. This action
              cannot be undone.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="deletePw" className={fieldLabel}>Confirm password</Label>
              <Input
                id="deletePw"
                type="password"
                value={deletePw}
                onChange={(e) => setDeletePw(e.target.value)}
                placeholder="Enter your password"
                className={`${inputClasses} border-red-500/30`}
              />
            </div>
            <Button
              variant="destructive"
              onClick={() => {
                setDeleteError(null);
                setShowDeleteConfirm(true);
              }}
              disabled={!deletePw || deleting}
              className="w-full h-11 rounded-xl font-bold cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Delete Account
            </Button>
          </div>
        </div>
      )}

      {tab === "preferences" && (
        <div className="max-w-2xl space-y-6">
          <div className="p-6 bg-surface-3/20 border border-border rounded-2xl">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-2">
              <BellRing className="w-5 h-5 text-teal-700 dark:text-teal-400" /> Notifications
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Choose what updates you want to receive.
            </p>
            {prefsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-teal-700 dark:text-teal-400 animate-spin" />
              </div>
            ) : (
              <>
                <div className="divide-y divide-border">
                  <Toggle
                    label="Email notifications"
                    description="Progress reports and assessment results by email."
                    checked={prefs.notifications.email}
                    onChange={(v) => setPrefs((p) => ({ ...p, notifications: { ...p.notifications, email: v } }))}
                    icon={<Mail className="w-4 h-4" />}
                  />
                  <Toggle
                    label="Push notifications"
                    description="Real-time alerts for completed lessons and reviews."
                    checked={prefs.notifications.push}
                    onChange={(v) => setPrefs((p) => ({ ...p, notifications: { ...p.notifications, push: v } }))}
                    icon={<BellRing className="w-4 h-4" />}
                  />
                  <Toggle
                    label="Marketing updates"
                    description="Occasional tips and feature announcements."
                    checked={prefs.notifications.marketing}
                    onChange={(v) => setPrefs((p) => ({ ...p, notifications: { ...p.notifications, marketing: v } }))}
                    icon={<Megaphone className="w-4 h-4" />}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="space-y-1.5">
                    <Label htmlFor="language" className={`${fieldLabel} flex items-center gap-2`}>
                      <Languages className="w-3.5 h-3.5" /> Language
                    </Label>
                    <select
                      id="language"
                      value={prefs.language}
                      onChange={(e) => setPrefs((p) => ({ ...p, language: e.target.value }))}
                      className={`${inputClasses} appearance-none bg-[#0F172F] cursor-pointer`}
                    >
                      <option value="en">English</option>
                      <option value="si">Sinhala</option>
                      <option value="ta">Tamil</option>
                      <option value="fr">Français</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="timezone" className={`${fieldLabel} flex items-center gap-2`}>
                      <Clock className="w-3.5 h-3.5" /> Timezone
                    </Label>
                    <Input id="timezone" value={prefs.timezone} onChange={(e) => setPrefs((p) => ({ ...p, timezone: e.target.value }))} className={inputClasses} />
                  </div>
                </div>

                <div className="space-y-3 mt-6">
                  {prefsMsg && <StatusBanner kind={prefsMsg.kind} message={prefsMsg.message} />}
                  <Button
                    onClick={savePreferences}
                    disabled={prefsSaving}
                    className="w-full sm:w-auto h-11 px-8 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold cursor-pointer"
                  >
                    {prefsSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Preferences
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete your account?"
        message="This will permanently delete your account and all associated learning data. This action cannot be undone."
        confirmLabel="Delete Account"
        isDeleting={deleting}
        error={deleteError}
        onConfirm={performDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}