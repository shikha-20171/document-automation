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
  Globe,
  Phone,
  Mail,
  User,
  Calendar,
  Sliders,
  Moon,
  Sun,
  Clock,
  Bell,
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

  // Preferences State
  const [themeMode, setThemeMode] = useState("light");
  const [language, setLanguage] = useState("en");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  const [timeFormat, setTimeFormat] = useState("12h");
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [taskNotifs, setTaskNotifs] = useState(true);
  const [approvalNotifs, setApprovalNotifs] = useState(true);

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
      if (res.data.preferences) {
        setThemeMode(res.data.preferences.theme || "light");
        setLanguage(res.data.preferences.language || "en");
        setDateFormat(res.data.preferences.dateFormat || "DD/MM/YYYY");
        setTimeFormat(res.data.preferences.timeFormat || "12h");
      }
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
        preferences: {
          theme: themeMode,
          language,
          dateFormat,
          timeFormat,
          emailNotifs,
          taskNotifs,
          approvalNotifs,
        },
      });
      showToast("Personal profile & preferences updated successfully!");
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
            Manage your personal profile details, account security, working preferences, and active devices.
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

          {/* 2. Employee Preferences */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Sliders size={18} className="text-[#274690]" />
                <h3 className="text-sm font-bold text-slate-800">Working Preferences</h3>
              </div>
              <span className="text-[11px] text-slate-400">Customized for your account</span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Theme Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sun size={14} className="text-[#c96f4a]" />
                  <span>Interface Theme</span>
                </label>
                <select
                  value={themeMode}
                  onChange={(e) => setThemeMode(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-[#274690]"
                >
                  <option value="light">Light Mode (Default)</option>
                  <option value="dark">Dark Mode</option>
                  <option value="system">Follow System</option>
                </select>
              </div>

              {/* Language Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Globe size={14} className="text-[#274690]" />
                  <span>Language</span>
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-[#274690]"
                >
                  <option value="en">English (US/UK)</option>
                  <option value="hi">Hindi (हिन्दी)</option>
                  <option value="es">Spanish (Español)</option>
                  <option value="fr">French (Français)</option>
                  <option value="de">German (Deutsch)</option>
                </select>
              </div>

              {/* Date Format */}
              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar size={14} className="text-[#274690]" />
                  <span>Date Format</span>
                </label>
                <select
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-[#274690]"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 20/08/2026)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 08/20/2026)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-08-20)</option>
                </select>
              </div>

              {/* Time Format */}
              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock size={14} className="text-[#274690]" />
                  <span>Time Format</span>
                </label>
                <select
                  value={timeFormat}
                  onChange={(e) => setTimeFormat(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-[#274690]"
                >
                  <option value="12h">12-Hour (e.g. 04:30 PM)</option>
                  <option value="24h">24-Hour (e.g. 16:30)</option>
                </select>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Bell size={14} className="text-[#274690]" />
                <span>Notification Preferences</span>
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 text-xs">
                <label className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailNotifs}
                    onChange={(e) => setEmailNotifs(e.target.checked)}
                    className="rounded text-[#274690]"
                  />
                  <span className="font-semibold text-slate-700">Email Digest</span>
                </label>
                <label className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={taskNotifs}
                    onChange={(e) => setTaskNotifs(e.target.checked)}
                    className="rounded text-[#274690]"
                  />
                  <span className="font-semibold text-slate-700">Task Deadlines</span>
                </label>
                <label className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={approvalNotifs}
                    onChange={(e) => setApprovalNotifs(e.target.checked)}
                    className="rounded text-[#274690]"
                  />
                  <span className="font-semibold text-slate-700">Approval Results</span>
                </label>
              </div>
            </div>
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
