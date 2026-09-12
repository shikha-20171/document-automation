"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserCheck,
  Building2,
  Users,
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  Save,
  LogOut,
  Key,
  Phone,
  Mail,
  User,
  Check,
} from "lucide-react";
import { profileApi } from "@/services/profileApi";

export default function EmployeeProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Form State for Editable Fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    const res = await profileApi.getProfile();
    if (res?.data) {
      setProfile(res.data);
      setFullName(res.data.fullName || "");
      setPhone(res.data.phone || "");
      setBio(res.data.bio || "");
      setAvatarUrl(res.data.avatarUrl || "");
      setEmergencyPhone(res.data.emergencyContact?.phone || "");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await profileApi.updateProfile({
        fullName,
        phone,
        bio,
        avatarUrl,
        emergencyContact: { phone: emergencyPhone },
      });
      showToast("Personal profile updated successfully!");
      fetchProfile();
    } catch (err: any) {
      alert("Failed to update profile: " + err.message);
    }
    setSaving(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    try {
      await profileApi.changePassword({ currentPassword, newPassword, confirmPassword });
      showToast("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    }
    setPasswordLoading(false);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("currentUser");
      localStorage.removeItem("accessToken");
    } catch {}
    router.push("/auth/login");
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl bg-white/90 p-6 shadow-xl backdrop-blur-md border border-[#274690]/10">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#274690] border-t-transparent" />
          <span className="text-sm font-bold text-slate-700">Loading Staff Profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#274690]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#274690] border border-[#274690]/20">
              Account & Security
            </span>
            <span className="text-xs text-slate-400">Employee ID: {profile?.employeeId || "EMP-7804"}</span>
          </div>
          <h1 className="mt-1 text-xl font-black text-slate-800 sm:text-2xl">Staff Profile & Settings</h1>
          <p className="mt-1 text-xs text-slate-500">
            Manage your personal profile details and account security.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 shadow-sm hover:bg-rose-100"
        >
          <LogOut size={15} />
          <span>Log Out</span>
        </button>
      </div>

      {/* Toast Alert */}
      {toast && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      {/* Main Two Columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LEFT 2 COLS: Personal Details, Preferences & Password */}
        <div className="space-y-6 lg:col-span-2">
          {/* 1. Editable Personal Details */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <User size={18} className="text-[#274690]" />
                <h3 className="text-sm font-bold text-slate-800">Personal Information</h3>
              </div>
              <span className="text-[11px] text-slate-400">Editable by Employee</span>
            </div>

            <form onSubmit={handleUpdateProfile} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#274690]"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#274690]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Professional Bio</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell your team a little about yourself..."
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 outline-none focus:border-[#274690]"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-slate-700">Avatar / Profile Photo URL</label>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://..."
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#274690]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Emergency Contact Phone</label>
                  <input
                    type="text"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    placeholder="+91 ..."
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#274690]"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-2xl bg-[#274690] px-5 py-2 text-xs font-bold text-white shadow-sm hover:brightness-110 disabled:opacity-50"
                >
                  <Save size={14} />
                  <span>{saving ? "Saving..." : "Save Profile Details"}</span>
                </button>
              </div>
            </form>
          </div>



          {/* 3. Password & Security Credentials */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Lock size={18} className="text-[#274690]" />
                <h3 className="text-sm font-bold text-slate-800">Change Password</h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Last changed: {profile?.security?.lastPasswordChange || "Recently"}
              </span>
            </div>

            <form onSubmit={handleChangePassword} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#274690]"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#274690]"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#274690]"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex items-center gap-1.5 rounded-2xl bg-slate-800 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-700 disabled:opacity-50"
                >
                  <Key size={14} />
                  <span>{passwordLoading ? "Updating..." : "Update Password"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT 1 COL: Read-only Org Hierarchy */}
        <div className="space-y-6">
          {/* Read-Only Organizational Attributes */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#274690]" />
                <h3 className="text-sm font-bold text-slate-800">Organization Role</h3>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500">
                Read-Only
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5">
                <span className="text-slate-500 font-medium">Department</span>
                <span className="font-bold text-slate-800">{profile?.department}</span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5">
                <span className="text-slate-500 font-medium">Team</span>
                <span className="font-bold text-slate-800">{profile?.team}</span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5">
                <span className="text-slate-500 font-medium">Designation</span>
                <span className="font-bold text-slate-800">{profile?.designation}</span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5">
                <span className="text-slate-500 font-medium">Employee ID</span>
                <span className="font-bold text-[#274690]">{profile?.employeeId || "EMP-7804"}</span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5">
                <span className="text-slate-500 font-medium">Corporate Email</span>
                <span className="font-bold text-slate-800">{profile?.email}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-800">
              Department, Team, and Designation changes must be requested through your Department Manager or Organization Admin.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
