"use client";

import { useEffect, useState } from "react";
import {
  User,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Laptop,
  Clock,
  LogOut,
  Save,
  Globe,
  Bell,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { profileApi } from "@/services/profileApi";

export default function TeamLeaderProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState("");
  const [successToast, setSuccessToast] = useState("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

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
    setError("");
    try {
      const res = await profileApi.getProfile("/team-leader/profile");
      if (res?.data) {
        setProfile(res.data);
        setFullName(res.data.fullName);
        setPhone(res.data.phone);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await profileApi.updateProfile({ fullName, phone }, "/team-leader/profile");
      showToast(res?.message || "Profile updated!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile.");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    setError("");
    try {
      const res = await profileApi.changePassword({ currentPassword, newPassword }, "/team-leader/profile/change-password");
      showToast(res?.message || "Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-20 font-sans text-slate-800">
      {/* 1. HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-[#274690] sm:text-3xl">Profile & Security</h1>
            <Badge className="bg-[#c96f4a]/10 text-[#c96f4a] border-[#c96f4a]/30 text-xs font-black px-2.5 py-0.5">
              Team Leader Account
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-semibold">
            Manage your personal credentials, active sessions, and notification preferences
          </p>
        </div>
      </div>

      {/* Alerts */}
      {successToast && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 shadow-sm animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-800 shadow-sm animate-in fade-in">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Basic Details (7 cols) */}
        <div className="space-y-6 lg:col-span-7">
          {/* Profile Card */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-linear-to-br from-[#274690] to-[#c96f4a] text-2xl font-black text-white shadow-md">
                {fullName ? fullName.charAt(0) : "T"}
              </div>
              <div>
                <h3 className="text-base font-black text-[#274690]">{fullName || "Team Leader"}</h3>
                <p className="text-xs font-bold text-[#c96f4a]">{profile?.designation || "Team Leader - Operations"}</p>
                <p className="text-[10px] font-semibold text-slate-400">Employee ID: {profile?.employeeId || "TL-2024-09"}</p>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-600">Full Name</label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-1 h-10 rounded-xl text-xs font-semibold focus:border-[#274690]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-600">Phone</label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 h-10 rounded-xl text-xs font-semibold focus:border-[#274690]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-600">Email Address (Managed by Admin)</label>
                <Input
                  disabled
                  value={profile?.email || "teamlead@docucore.ai"}
                  className="mt-1 h-10 rounded-xl text-xs font-semibold bg-slate-50 text-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-600">Department</label>
                  <Input
                    disabled
                    value={profile?.department || "Operations & Logistics"}
                    className="mt-1 h-10 rounded-xl text-xs font-semibold bg-slate-50 text-slate-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-600">Assigned Team</label>
                  <Input
                    disabled
                    value={profile?.team || "Financial Operations"}
                    className="mt-1 h-10 rounded-xl text-xs font-semibold bg-slate-50 text-slate-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button size="sm" type="submit" className="rounded-xl bg-[#274690] text-xs font-bold text-white hover:bg-[#1f3561]">
                  <Save size={13} className="mr-1.5" /> Save Profile
                </Button>
              </div>
            </form>
          </div>

          {/* Change Password Card */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-[#274690] flex items-center gap-2">
              <KeyRound size={16} className="text-[#c96f4a]" /> Change Account Password
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="text-[11px] font-black uppercase text-slate-600">Current Password</label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 h-10 rounded-xl text-xs font-semibold focus:border-[#274690]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-600">New Password</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    className="mt-1 h-10 rounded-xl text-xs font-semibold focus:border-[#274690]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-600">Confirm Password</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="mt-1 h-10 rounded-xl text-xs font-semibold focus:border-[#274690]"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button size="sm" type="submit" className="rounded-xl bg-[#274690] text-xs font-bold text-white hover:bg-[#1f3561]">
                  Update Password
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Sessions & Preferences (5 cols) */}
        <div className="space-y-6 lg:col-span-5">
          {/* Active Sessions */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-[#274690] flex items-center gap-2">
              <Shield size={16} className="text-[#c96f4a]" /> Active Login Sessions
            </h3>

            <div className="space-y-3">
              {profile?.security?.activeSessions?.map((s: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    {s.device.includes("Mac") || s.device.includes("PC") ? (
                      <Laptop size={16} className="text-[#274690]" />
                    ) : (
                      <Smartphone size={16} className="text-[#274690]" />
                    )}
                    <div>
                      <p className="text-xs font-bold text-slate-900">{s.device}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">{s.location} • {s.ip}</p>
                    </div>
                  </div>
                  {s.current && (
                    <Badge className="bg-emerald-50 text-emerald-700 text-[9px] font-black">Current</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Preferences */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-3 text-xs">
            <h3 className="text-sm font-black text-[#274690] flex items-center gap-2">
              <Bell size={16} className="text-[#c96f4a]" /> Notification Preferences
            </h3>

            <div className="space-y-2 font-semibold text-slate-700 pt-2">
              <div className="flex items-center justify-between">
                <span>Email Notifications on Approvals</span>
                <input type="checkbox" defaultChecked className="rounded text-[#274690]" />
              </div>
              <div className="flex items-center justify-between">
                <span>Task Deadline Alerts</span>
                <input type="checkbox" defaultChecked className="rounded text-[#274690]" />
              </div>
              <div className="flex items-center justify-between">
                <span>AI Processing Notifications</span>
                <input type="checkbox" defaultChecked className="rounded text-[#274690]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
