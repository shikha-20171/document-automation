"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserCircle2,
  Mail,
  Building2,
  Briefcase,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Save,
  Lock,
  RefreshCw,
  LogOut,
  Calendar,
  Phone,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { profileApi } from "@/services/profileApi";

export default function DepartmentManagerProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [error, setError] = useState("");
  const [successToast, setSuccessToast] = useState("");

  const [profile, setProfile] = useState({
    firstName: "Department",
    lastName: "Manager",
    email: "manager@docucore.ai",
    phone: "+91 98765 43210",
    role: "Department Manager",
    department: "Operations & Logistics",
    organisation: "Global Document Automation Corp",
    joiningDate: "2025-06-01",
    photo: "",
    lastLogin: "Today, 08:30 AM (Mac OS / Chrome 127)",
  });

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 4000);
  };

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await profileApi.getProfile("/department-manager/profile");
      if (res?.data) {
        setProfile((prev) => ({ ...prev, ...res.data }));
      }
    } catch {
      // keep initial fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchProfile();
  }, []);

  const handleUpdatePersonalInfo = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await profileApi.updateProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
      }, "/department-manager/profile");
      showToast(res?.message || "Profile information updated successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      setError("Please fill all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setPwSaving(true);
    setError("");
    try {
      const res = await profileApi.changePassword({ currentPassword, newPassword }, "/department-manager/profile/change-password");
      showToast(res?.message || "Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setPwSaving(false);
    }
  };

  const handleLogout = () => {
    showToast("Logging out...");
    setTimeout(() => router.push("/auth/login"), 1000);
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-16 font-sans text-slate-800">
      {/* Profile Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-[#274690]/20 bg-[linear-gradient(135deg,#1b2e59_0%,#274690_60%,#3b5ea6_100%)] p-7 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#c96f4a]/25 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-2xl font-black text-white shadow-inner ring-2 ring-white/30">
              {profile.firstName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-white">
                  {profile.firstName} {profile.lastName}
                </h1>
                <Badge className="border border-white/30 bg-white/15 text-[11px] font-bold text-white">
                  {profile.role}
                </Badge>
              </div>
              <p className="text-xs font-medium text-blue-100 mt-1">
                {profile.department} • {profile.organisation}
              </p>
              <div className="flex items-center gap-4 mt-1 text-[11px] text-blue-200">
                <span>{profile.email}</span>
                <span>Joined: {profile.joiningDate}</span>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="border-white/30 bg-white/10 text-xs font-bold text-white backdrop-blur-sm hover:bg-white/20"
          >
            <LogOut size={14} className="mr-1.5" /> Logout
          </Button>
        </div>
      </section>

      {/* Alerts */}
      {successToast && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 shadow-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-800 shadow-sm">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Personal Information (Left) */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3">
            Personal Information
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-black uppercase text-slate-500">First Name</label>
              <Input
                value={profile.firstName}
                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                className="mt-1 rounded-xl text-xs font-semibold"
              />
            </div>
            <div>
              <label className="text-[11px] font-black uppercase text-slate-500">Last Name</label>
              <Input
                value={profile.lastName}
                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                className="mt-1 rounded-xl text-xs font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-black uppercase text-slate-500">Contact Phone</label>
            <Input
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="mt-1 rounded-xl text-xs font-semibold"
            />
          </div>

          {/* Read-Only Context Box */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-2.5 text-xs">
            <span className="text-[10px] font-black uppercase text-slate-400">Assigned Corporate Context (Read-Only)</span>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Email Address:</span>
              <span className="font-bold text-slate-800">{profile.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Role:</span>
              <span className="font-bold text-[#274690]">{profile.role}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Department:</span>
              <span className="font-bold text-slate-800">{profile.department}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Organisation:</span>
              <span className="font-bold text-slate-800">{profile.organisation}</span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              disabled={saving}
              onClick={handleUpdatePersonalInfo}
              className="bg-[#274690] text-xs font-bold text-white hover:bg-[#1f3770]"
            >
              <Save size={14} className="mr-1.5" /> Save Changes
            </Button>
          </div>
        </div>

        {/* Security & Password (Right) */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3">
            Account Security & Password
          </h2>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-black uppercase text-slate-500">Current Password</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-black uppercase text-slate-500">New Password</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="mt-1 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-black uppercase text-slate-500">Confirm New Password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              disabled={pwSaving}
              onClick={handleChangePassword}
              className="bg-[#c96f4a] text-xs font-bold text-white hover:bg-[#b05d3b]"
            >
              <Lock size={14} className="mr-1.5" /> Update Password
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}