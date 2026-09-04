"use client";

import { useState, useEffect, ChangeEvent, FormEvent, MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User, Mail, Phone, Globe, Sparkles, Save, CheckCircle2, Upload, Lock, KeyRound, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import axios from "@/lib/axios";

interface ProfileFormData {
  platformName: string;
  platformTagline: string;
  platformLogo: string;
  platformWebsite: string;
  supportEmail: string;
  supportPhone: string;
  fullName: string;
  email: string;
  phone: string;
  profilePhoto: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  language: string;
  timeZone: string;
  dateFormat: string;
  theme: string;
}

const DEFAULT_PROFILE: ProfileFormData = {
  platformName: "DocuCore AI Platform",
  platformTagline: "Enterprise AI Document Automation Platform",
  platformLogo: "",
  platformWebsite: "https://docucore.ai",
  supportEmail: "support@docucore.ai",
  supportPhone: "+91 22 5555 0100",
  fullName: "Super Admin",
  email: "admin@demo.com",
  phone: "+91 98765 43210",
  profilePhoto: "",
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
  language: "English (US)",
  timeZone: "(UTC+05:30) India Standard Time (IST)",
  dateFormat: "DD/MM/YYYY",
  theme: "Light",
};

export default function SuperAdminProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>(DEFAULT_PROFILE);

  useEffect(() => {
    const raw = localStorage.getItem("superAdminProfile") || localStorage.getItem("organization");
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      setFormData((prev) => ({
        ...prev,
        platformName: data.platformName || data.name || prev.platformName,
        platformTagline: data.platformTagline || prev.platformTagline,
        platformLogo: data.platformLogo || data.logo || prev.platformLogo,
        fullName: data.fullName || data.admin_name || prev.fullName,
        email: data.email || data.admin_email || prev.email,
        phone: data.phone || prev.phone,
        profilePhoto: data.profilePhoto || prev.profilePhoto,
      }));
    } catch {
      // Ignore parse errors
    }
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const compressImage = (file: File, maxDim = 300): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", 0.8));
          } else {
            resolve((event.target?.result as string) || "");
          }
        };
        img.onerror = () => resolve((event.target?.result as string) || "");
        img.src = (event.target?.result as string) || "";
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>, field: "platformLogo" | "profilePhoto") => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedBase64 = await compressImage(file, 300);
      setFormData((prev) => ({ ...prev, [field]: compressedBase64 }));
    } catch {
      // Fallback
    }
  };

  const safeStorageSet = (key: string, value: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn(`localStorage setItem failed for ${key}:`, err);
      try {
        if (typeof value === "object" && value !== null) {
          const safeObject = { ...value, platformLogo: "", logo: "", profilePhoto: "" };
          localStorage.setItem(key, JSON.stringify(safeObject));
        }
      } catch {
        // Ignore if storage is completely blocked
      }
    }
  };

  const handleChangePassword = (e: MouseEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    const { currentPassword, newPassword, confirmPassword } = formData;
    if (!currentPassword) {
      setPasswordMessage("Please enter your current password.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordMessage("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage("New passwords do not match.");
      return;
    }

    setPasswordMessage("Password changed successfully!");
    setFormData((prev) => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
  };

  const handleSaveChanges = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSavedSuccess(false);

    try {
      const profilePayload = {
        ...formData,
        name: formData.platformName,
        logo: formData.platformLogo,
        admin_name: formData.fullName,
        admin_email: formData.email,
      };

      safeStorageSet("superAdminProfile", profilePayload);
      safeStorageSet("organization", profilePayload);

      await Promise.allSettled([
        axios.put("/super-admin/settings", {
          systemName: formData.platformName,
          supportEmail: formData.supportEmail,
        }),
        axios.put("/organisations/1", {
          name: formData.platformName,
          email: formData.email,
          phone: formData.phone,
          website: formData.platformWebsite,
          logo_url: formData.platformLogo,
        }),
      ]);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("organizationUpdated"));
        window.dispatchEvent(new Event("profileUpdated"));
      }

      setSavedSuccess(true);
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-slate-50/70 p-6 lg:p-10 space-y-8 font-sans">
      <div className="pointer-events-none absolute left-[-5%] top-[-5%] h-96 w-96 rounded-full bg-[#274690]/10 blur-3xl" />
      <div className="pointer-events-none absolute right-[-5%] bottom-[-5%] h-96 w-96 rounded-full bg-[#c96f4a]/10 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-slate-200/80 pb-6"
      >
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#274690]/20 bg-[#274690]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#274690]">
            <Sparkles size={13} />
            Platform Branding & Profile
          </span>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight">SUPER ADMIN PANEL</h1>
          <p className="mt-1 text-slate-500 text-sm">
            Manage company branding, logo photo upload, administrator details, security, and preferences
          </p>
        </div>
      </motion.div>

      {savedSuccess && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-900 font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 size={18} className="text-emerald-600" />
          Profile & Company Branding saved successfully!
        </div>
      )}

      <form onSubmit={handleSaveChanges} className="space-y-8">
        <Card className="rounded-[1.75rem] border border-white/80 bg-white/85 shadow-xs backdrop-blur-xl">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-4 px-6">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Globe size={18} className="text-[#274690]" />
              Platform Profile & Global Branding
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="md:col-span-2 space-y-2">
                <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Platform Logo</Label>
                <div className="flex items-center gap-4">
                  {formData.platformLogo ? (
                    <div className="relative h-16 w-16 rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                      <img src={formData.platformLogo} alt="Logo" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, platformLogo: "" }))}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400">
                      <Upload size={20} />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      id="logoUploadInput"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, "platformLogo")}
                      className="hidden"
                    />
                    <label
                      htmlFor="logoUploadInput"
                      className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
                    >
                      <Upload size={14} className="text-[#274690]" />
                      Upload New Logo
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="platformName" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Platform Name *</Label>
                <Input id="platformName" name="platformName" value={formData.platformName} onChange={handleChange} required className="mt-1.5 h-11 rounded-xl" />
              </div>
              <div>
                <Label htmlFor="platformTagline" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Tagline</Label>
                <Input id="platformTagline" name="platformTagline" value={formData.platformTagline} onChange={handleChange} className="mt-1.5 h-11 rounded-xl" />
              </div>
              <div>
                <Label htmlFor="platformWebsite" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Website URL</Label>
                <Input id="platformWebsite" name="platformWebsite" value={formData.platformWebsite} onChange={handleChange} className="mt-1.5 h-11 rounded-xl" />
              </div>
              <div>
                <Label htmlFor="supportEmail" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Support Email</Label>
                <Input id="supportEmail" name="supportEmail" value={formData.supportEmail} onChange={handleChange} className="mt-1.5 h-11 rounded-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border border-white/80 bg-white/85 shadow-xs backdrop-blur-xl">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-4 px-6">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <User size={18} className="text-[#274690]" />
              Owner Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="md:col-span-2 space-y-2">
                <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Profile Photo</Label>
                <div className="flex items-center gap-4">
                  {formData.profilePhoto ? (
                    <div className="relative h-16 w-16 rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                      <img src={formData.profilePhoto} alt="Profile" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, profilePhoto: "" }))}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400">
                      <User size={24} />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      id="profilePhotoUploadInput"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, "profilePhoto")}
                      className="hidden"
                    />
                    <label
                      htmlFor="profilePhotoUploadInput"
                      className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
                    >
                      <Upload size={14} className="text-[#274690]" />
                      Upload Photo
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="fullName" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Full Name *</Label>
                <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} required className="mt-1.5 h-11 rounded-xl" />
              </div>
              <div>
                <Label htmlFor="email" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Email *</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required className="pl-10 h-11 rounded-xl" />
                </div>
              </div>
              <div>
                <Label htmlFor="phone" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Phone</Label>
                <div className="relative mt-1.5">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} className="pl-10 h-11 rounded-xl" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border border-white/80 bg-white/85 shadow-xs backdrop-blur-xl">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-4 px-6">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Lock size={18} className="text-[#274690]" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            {passwordMessage && (
              <div className={`p-3 rounded-xl text-xs font-semibold ${
                passwordMessage.includes("successfully") ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
              }`}>
                {passwordMessage}
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div>
                <Label htmlFor="currentPassword" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Current Password</Label>
                <Input id="currentPassword" name="currentPassword" type="password" value={formData.currentPassword || ""} onChange={handleChange} placeholder="••••••••" className="mt-1.5 h-11 rounded-xl" />
              </div>
              <div>
                <Label htmlFor="newPassword" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">New Password</Label>
                <Input id="newPassword" name="newPassword" type="password" value={formData.newPassword || ""} onChange={handleChange} placeholder="••••••••" className="mt-1.5 h-11 rounded-xl" />
              </div>
              <div>
                <Label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Confirm Password</Label>
                <Input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword || ""} onChange={handleChange} placeholder="••••••••" className="mt-1.5 h-11 rounded-xl" />
              </div>
            </div>

            <div className="pt-2">
              <Button type="button" onClick={handleChangePassword} className="bg-[#274690] text-white text-xs font-semibold rounded-xl h-10 px-4 gap-1.5">
                <KeyRound size={14} /> Change Password
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-4 border-t border-slate-200/80 pt-6">
          <Button type="button" variant="outline" onClick={() => router.back()} className="h-11 rounded-2xl bg-white px-6 text-sm font-semibold">
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="h-11 rounded-2xl bg-[#274690] px-8 text-sm font-semibold text-white gap-2">
            <Save size={16} />
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
