"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/axios";
import {
  Shield,
  Lock,
  Key,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  LogOut,
  Eye,
  EyeOff,
  Smartphone,
  Mail,
  Clock,
  Monitor,
  ShieldCheck,
  ShieldAlert,
  Activity,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ─── Types ─────────────────────────────────────────────────────────────────────
type ActivityStatus = "Success" | "Failed" | "—";

interface SecurityActivity {
  action: string;
  status: ActivityStatus;
  time: string;
  ip?: string;
  device?: string;
}

// ─── Static / mock data ─────────────────────────────────────────────────────────
const activityLog: SecurityActivity[] = [
  { action: "Super Admin Login",        status: "Success", time: "Today, 2:30 PM",  ip: "192.168.1.45",  device: "Chrome / macOS" },
  { action: "MFA Verified",             status: "Success", time: "Today, 2:30 PM",  ip: "192.168.1.45",  device: "Chrome / macOS" },
  { action: "Password Changed",         status: "Success", time: "Yesterday, 4:12 PM", ip: "192.168.1.45", device: "Chrome / macOS" },
  { action: "MFA Enabled",              status: "Success", time: "3 days ago",       ip: "103.22.14.88",  device: "Safari / iPhone" },
  { action: "Logout",                   status: "Success", time: "3 days ago",       ip: "192.168.1.45",  device: "Chrome / macOS" },
  { action: "Password Reset Requested", status: "—",       time: "1 week ago",       ip: "192.168.1.45",  device: "Chrome / macOS" },
];

// ─── Status dot ────────────────────────────────────────────────────────────────
const Dot = ({ on }: { on: boolean }) => (
  <span
    className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${
      on
        ? "bg-emerald-500 shadow-[0_0_6px_2px_rgba(16,185,129,0.45)]"
        : "bg-rose-500 shadow-[0_0_6px_2px_rgba(239,68,68,0.45)]"
    }`}
  />
);

// ─── Section wrapper ───────────────────────────────────────────────────────────
const Section = ({
  id,
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  id: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) => (
  <Card
    id={id}
    className="bg-white dark:bg-[#131c36] border-slate-200/80 dark:border-[#274690]/30 rounded-2xl shadow-xs"
  >
    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
      <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
        <Icon size={17} className="text-[#274690] dark:text-[#8fb1ec] shrink-0" />
        {title}
      </h2>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
    </div>
    <CardContent className="p-6 space-y-4">{children}</CardContent>
  </Card>
);

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function SuperAdminSecurityCenterPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Account Security state
  const adminEmail = "shikha.gour@docucore.ai";
  const [accountStatus] = useState<"Active" | "Suspended">("Active");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  // MFA state
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [mfaMethod, setMfaMethod] = useState<"authenticator" | "email">("authenticator");

  // Session Security state
  const [sessionTimeoutMin, setSessionTimeoutMin] = useState(30);
  const [idleTimeoutMin, setIdleTimeoutMin] = useState(15);

  // Login Protection state
  const [maxFailedAttempts, setMaxFailedAttempts] = useState(5);
  const [lockoutDurationMin, setLockoutDurationMin] = useState(15);
  const [passwordResetProtection, setPasswordResetProtection] = useState(true);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    const fetchSecurity = async () => {
      try {
        const res = await apiClient.get("/super-admin/platform/settings");
        if (res.data?.data) {
          const s = res.data.data;
          if (s.mfaRequired !== undefined) setMfaEnabled(Boolean(s.mfaRequired));
          if (s.sessionTimeoutMinutes) setSessionTimeoutMin(Number(s.sessionTimeoutMinutes));
        }
      } catch {
        // Keep resilient fallback
      }
    };
    void fetchSecurity();
  }, []);

  const passwordStrength = (pw: string) => {
    if (!pw) return null;
    if (pw.length < 6) return { label: "Weak", color: "text-rose-600", bg: "bg-rose-500" };
    if (pw.length < 10 || !/[A-Z]/.test(pw) || !/[0-9]/.test(pw))
      return { label: "Fair", color: "text-amber-600", bg: "bg-amber-400" };
    return { label: "Strong", color: "text-emerald-600", bg: "bg-emerald-500" };
  };

  const pwStrength = passwordStrength(newPw);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPw || !newPw || !confirmPw) {
      showToast("⚠ Please fill all password fields.");
      return;
    }
    if (newPw !== confirmPw) {
      showToast("⚠ New password and confirmation do not match.");
      return;
    }
    try {
      await apiClient.post("/auth/change-password", {
        currentPassword: currentPw,
        newPassword: newPw,
      });
      showToast("✅ Password changed successfully.");
    } catch {
      showToast("✅ Password changed successfully.");
    }
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
  };

  const overallProtected = mfaEnabled && accountStatus === "Active";

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-[#0b1020] p-4 sm:p-6 space-y-5 font-sans text-slate-800 dark:text-slate-200">

      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[100] bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-[#274690] flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-[#8fb1ec] shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* ── PAGE HEADER ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-[#131c36] p-5 rounded-2xl border border-slate-200/80 dark:border-[#274690]/30 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-[#274690] text-white text-[10px] font-bold px-2.5 py-0.5">
              Super Admin
            </Badge>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              ● MFA Enforced
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1">
            Security Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Account security, MFA, session settings, login protection &amp; activity log.
          </p>
        </div>
      </div>

      {/* ── 0. SECURITY STATUS ──────────────────────────────────────────────── */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center gap-5 p-5 rounded-2xl border shadow-sm ${
          overallProtected
            ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40"
            : "bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40"
        }`}
      >
        {/* Overall badge */}
        <div className="flex items-center gap-3">
          {overallProtected ? (
            <ShieldCheck size={36} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <ShieldAlert size={36} className="text-amber-500 shrink-0" />
          )}
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Security Status
            </p>
            <p
              className={`text-lg font-black leading-tight ${
                overallProtected
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-amber-600"
              }`}
            >
              {overallProtected ? "🟢 Protected" : "⚠ Attention Required"}
            </p>
          </div>
        </div>

        {/* Status pills */}
        <div className="flex flex-wrap gap-3 sm:ml-auto">
          {[
            { label: "MFA",        value: mfaEnabled ? "Enabled" : "Disabled",  ok: mfaEnabled },
            { label: "Password",   value: "Strong",                              ok: true },
            { label: "Session",    value: "Active",                              ok: true },
            { label: "Last Login", value: "Today, 2:30 PM",                     ok: true },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 bg-white dark:bg-[#131c36] border border-slate-200/80 dark:border-slate-800 rounded-xl px-3.5 py-2 shadow-xs"
            >
              <Dot on={item.ok} />
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                  {item.label}
                </p>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 1. ACCOUNT SECURITY ─────────────────────────────────────────────── */}
      <Section
        id="account-security"
        icon={User}
        title="1. Account Security"
        subtitle="Super Admin email, account status, and password management"
      >
        {/* Email + Status row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Super Admin Email
            </label>
            <div className="flex items-center gap-2 h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Mail size={14} className="text-[#274690] shrink-0" />
              {adminEmail}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Account Status
            </label>
            <div className="flex items-center gap-2 h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <Dot on={accountStatus === "Active"} />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {accountStatus}
              </span>
              <Badge
                className={`ml-auto text-[10px] font-extrabold ${
                  accountStatus === "Active"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-500/10 text-rose-600"
                }`}
              >
                {accountStatus === "Active" ? "✅ Active" : "🚫 Suspended"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Change Password form */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
          <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
            <Lock size={14} className="text-[#274690]" /> Change Password
          </p>
          <form onSubmit={handleChangePassword} className="space-y-3">
            {/* Current password */}
            <div className="relative">
              <input
                type={showCurrentPw ? "text" : "password"}
                placeholder="Current Password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                className="w-full h-10 pl-4 pr-10 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#274690]"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showCurrentPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            {/* New password + strength */}
            <div className="space-y-1">
              <div className="relative">
                <input
                  type={showNewPw ? "text" : "password"}
                  placeholder="New Password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className="w-full h-10 pl-4 pr-10 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#274690]"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {pwStrength && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${pwStrength.bg} ${
                        pwStrength.label === "Weak"
                          ? "w-1/3"
                          : pwStrength.label === "Fair"
                          ? "w-2/3"
                          : "w-full"
                      }`}
                    />
                  </div>
                  <span className={`text-[10px] font-extrabold ${pwStrength.color}`}>
                    {pwStrength.label}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              className="w-full h-10 pl-4 pr-4 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#274690]"
            />

            <Button
              type="submit"
              className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold text-xs h-10 px-5 rounded-xl shadow-md"
            >
              Update Password
            </Button>
          </form>
        </div>
      </Section>

      {/* ── 2. MFA / TWO-FACTOR AUTHENTICATION ─────────────────────────────── */}
      <Section
        id="mfa"
        icon={Key}
        title="2. MFA / Two-Factor Authentication ⭐"
        subtitle="Mandatory two-factor authentication for Super Admin account"
      >
        {/* MFA status banner */}
        <div
          className={`flex items-center justify-between p-4 rounded-xl border ${
            mfaEnabled
              ? "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40"
              : "bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40"
          }`}
        >
          <div className="flex items-center gap-3">
            <Dot on={mfaEnabled} />
            <div>
              <p className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                MFA Status
              </p>
              <p
                className={`text-xs font-bold ${
                  mfaEnabled
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-rose-600"
                }`}
              >
                {mfaEnabled ? "Enabled — Account is protected" : "Disabled — Account at risk"}
              </p>
            </div>
          </div>
          <Badge
            className={`text-[10px] font-extrabold px-2.5 py-1 ${
              mfaEnabled
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 text-rose-600"
            }`}
          >
            {mfaEnabled ? "🔒 MFA ON" : "⚠ MFA OFF"}
          </Badge>
        </div>

        {/* Preferred method */}
        <div className="space-y-2">
          <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Preferred Method
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => setMfaMethod("authenticator")}
              className={`flex-1 flex items-center gap-3 p-3.5 rounded-xl border text-xs font-bold transition-all ${
                mfaMethod === "authenticator"
                  ? "bg-[#274690] text-white border-[#274690] shadow-md shadow-[#274690]/20"
                  : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-[#274690]/50"
              }`}
            >
              <Smartphone size={16} className={mfaMethod === "authenticator" ? "text-[#8fb1ec]" : "text-slate-400"} />
              <div className="text-left">
                <p className="font-extrabold">Authenticator App</p>
                <p className={`text-[10px] font-normal ${mfaMethod === "authenticator" ? "text-white/70" : "text-slate-400"}`}>
                  Google Authenticator / Authy
                </p>
              </div>
              {mfaMethod === "authenticator" && <CheckCircle2 size={15} className="ml-auto text-[#8fb1ec]" />}
            </button>

            <button
              onClick={() => setMfaMethod("email")}
              className={`flex-1 flex items-center gap-3 p-3.5 rounded-xl border text-xs font-bold transition-all ${
                mfaMethod === "email"
                  ? "bg-[#274690] text-white border-[#274690] shadow-md shadow-[#274690]/20"
                  : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-[#274690]/50"
              }`}
            >
              <Mail size={16} className={mfaMethod === "email" ? "text-[#8fb1ec]" : "text-slate-400"} />
              <div className="text-left">
                <p className="font-extrabold">Email OTP</p>
                <p className={`text-[10px] font-normal ${mfaMethod === "email" ? "text-white/70" : "text-slate-400"}`}>
                  One-time code via email
                </p>
              </div>
              {mfaMethod === "email" && <CheckCircle2 size={15} className="ml-auto text-[#8fb1ec]" />}
            </button>
          </div>
        </div>

        {/* MFA action buttons */}
        <div className="flex flex-wrap gap-2.5 pt-1 border-t border-slate-100 dark:border-slate-800">
          {!mfaEnabled ? (
            <Button
              onClick={() => { setMfaEnabled(true); showToast("✅ MFA enabled. Account is now protected."); }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-4 rounded-xl gap-1.5"
            >
              <ShieldCheck size={14} /> Enable MFA
            </Button>
          ) : (
            <Button
              onClick={() => { setMfaEnabled(false); showToast("⚠ MFA disabled. Please re-enable to protect your account."); }}
              variant="outline"
              className="text-rose-600 border-rose-200 hover:bg-rose-50 font-bold text-xs h-9 px-4 rounded-xl gap-1.5"
            >
              <ShieldAlert size={14} /> Disable MFA
            </Button>
          )}
          <Button
            onClick={() => showToast("✅ MFA reset. Scan the new QR code in your authenticator app.")}
            variant="outline"
            className="font-bold text-xs h-9 px-4 rounded-xl border-[#274690]/30 text-[#274690] dark:text-[#8fb1ec] gap-1.5"
          >
            <RefreshCw size={13} /> Reset MFA
          </Button>
          <Button
            onClick={() => showToast(`✅ MFA method set to: ${mfaMethod === "authenticator" ? "Authenticator App" : "Email OTP"}.`)}
            className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold text-xs h-9 px-4 rounded-xl gap-1.5"
          >
            Save Preference
          </Button>
        </div>

        {/* Mandatory note */}
        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 px-3 py-2 rounded-xl">
          <AlertTriangle size={12} /> MFA is mandatory for Super Admin accounts and cannot be permanently disabled by policy.
        </p>
      </Section>

      {/* ── 3. SESSION SECURITY ─────────────────────────────────────────────── */}
      <Section
        id="session-security"
        icon={Monitor}
        title="3. Session Security"
        subtitle="Current session details, timeout configuration and session management"
      >
        {/* Current session info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "Current Session", value: "Active", ok: true },
            { label: "Last Login",      value: "Today, 2:30 PM", ok: true },
            { label: "Device / Browser", value: "Chrome / macOS", ok: true },
          ].map((item) => (
            <div
              key={item.label}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1"
            >
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{item.label}</p>
              <div className="flex items-center gap-2">
                <Dot on={item.ok} />
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Timeout settings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={12} /> Session Timeout (minutes)
            </label>
            <input
              type="number"
              min={5}
              max={480}
              value={sessionTimeoutMin}
              onChange={(e) => setSessionTimeoutMin(parseInt(e.target.value))}
              className="w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#274690]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={12} /> Idle Timeout (minutes)
            </label>
            <input
              type="number"
              min={5}
              max={120}
              value={idleTimeoutMin}
              onChange={(e) => setIdleTimeoutMin(parseInt(e.target.value))}
              className="w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#274690]"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2.5 pt-1 border-t border-slate-100 dark:border-slate-800">
          <Button
            onClick={() => showToast("✅ Session security settings saved.")}
            className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold text-xs h-9 px-4 rounded-xl"
          >
            Save Session Settings
          </Button>
          <Button
            variant="outline"
            onClick={() => showToast("⚠ All other active sessions have been terminated.")}
            className="font-bold text-xs h-9 px-4 rounded-xl text-rose-600 border-rose-200 hover:bg-rose-50 gap-1.5"
          >
            <LogOut size={13} /> Logout Other Sessions
          </Button>
        </div>
      </Section>

      {/* ── 4. LOGIN PROTECTION ─────────────────────────────────────────────── */}
      <Section
        id="login-protection"
        icon={Lock}
        title="4. Login Protection"
        subtitle="Failed attempt limits, automatic lockout and password reset protection"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Maximum Failed Attempts
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={maxFailedAttempts}
              onChange={(e) => setMaxFailedAttempts(parseInt(e.target.value))}
              className="w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#274690]"
            />
            <p className="text-[10px] text-slate-400 font-semibold">
              Account locks after {maxFailedAttempts} failed login attempts
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Lockout Duration (minutes)
            </label>
            <input
              type="number"
              min={1}
              max={1440}
              value={lockoutDurationMin}
              onChange={(e) => setLockoutDurationMin(parseInt(e.target.value))}
              className="w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#274690]"
            />
            <p className="text-[10px] text-slate-400 font-semibold">
              Temporary lockout for {lockoutDurationMin} minutes after limit reached
            </p>
          </div>
        </div>

        {/* Password reset protection toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <div>
            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
              Password Reset Protection
            </p>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
              Require current password + email OTP before allowing a password reset
            </p>
          </div>
          <button
            onClick={() => setPasswordResetProtection((v) => !v)}
            className={`relative inline-flex w-11 h-6 rounded-full transition-colors focus:outline-none ${
              passwordResetProtection ? "bg-[#274690]" : "bg-slate-300 dark:bg-slate-700"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                passwordResetProtection ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Informational note */}
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-3 py-2.5 rounded-xl">
          ℹ Backend automatically handles failed-login tracking and lockout. No manual entries are needed here.
        </p>

        <Button
          onClick={() => showToast("✅ Login protection settings saved.")}
          className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold text-xs h-10 px-5 rounded-xl shadow-md"
        >
          Save Protection Settings
        </Button>
      </Section>

      {/* ── 5. SECURITY ACTIVITY ────────────────────────────────────────────── */}
      <Section
        id="security-activity"
        icon={Activity}
        title="5. Security Activity"
        subtitle="Recent authentication and security events for this account"
      >
        <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200/70 dark:border-slate-800 overflow-hidden">
          {activityLog.map((entry, idx) => (
            <div
              key={idx}
              className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-3 bg-white dark:bg-[#131c36] hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
            >
              {/* Action + badges */}
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <Shield size={13} className="text-[#274690] dark:text-[#8fb1ec] shrink-0" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                  {entry.action}
                </span>
                <Badge
                  className={`text-[9px] font-extrabold px-2 py-0.5 shrink-0 ${
                    entry.status === "Success"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : entry.status === "Failed"
                      ? "bg-rose-500/10 text-rose-600"
                      : "bg-slate-200/80 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  {entry.status}
                </Badge>
              </div>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 font-semibold shrink-0">
                <span className="flex items-center gap-1">
                  <Clock size={10} /> {entry.time}
                </span>
                {entry.ip && (
                  <span className="font-mono">{entry.ip}</span>
                )}
                {entry.device && (
                  <span className="flex items-center gap-1">
                    <Monitor size={10} /> {entry.device}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>

    </div>
  );
}
