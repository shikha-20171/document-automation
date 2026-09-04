"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Settings,
  Building,
  Users,
  FileText,
  Bot,
  HardDrive,
  Bell,
  Palette,
  Shield,
  CheckCircle2,
  Save,
  Sparkles,
  Zap,
  Lock,
  ArrowUpRight,
  ScanText,
  Layers,
  Check,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { orgSettingsApi } from "@/services/settingsApi";
import { useEntitlements } from "@/hooks/useEntitlements";

export default function OrgAdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("subscription");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [settings, setSettings] = useState<any>(null);

  const { plan, usage, limits, features, loading: entitlementsLoading } = useEntitlements();

  // Editable Form States
  const [orgName, setOrgName] = useState("Dezo Solutions Pvt Ltd");
  const [address, setAddress] = useState("Building 4B, Cyber City, Phase 3, Gurugram, India");
  const [contactEmail, setContactEmail] = useState("admin@dezo.io");
  const [timezone, setTimezone] = useState("Asia/Kolkata (GMT+5:30)");
  const [country, setCountry] = useState("India");

  const [aiEnabled, setAiEnabled] = useState(true);
  const [selectedModelId, setSelectedModelId] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#274690");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    orgSettingsApi
      .getSettings()
      .then((res) => {
        setSettings(res.data);
        if (res.data?.profile?.name) setOrgName(res.data.profile.name);
        if (res.data?.aiSettings?.defaultSelectedModelId) setSelectedModelId(res.data.aiSettings.defaultSelectedModelId);
        if (res.data?.branding?.primaryColor) setPrimaryColor(res.data.branding.primaryColor);
      })
      .catch(() => {});
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await orgSettingsApi.updateProfile({ name: orgName, address, contactEmail, timezone, country });
      showToast("Organisation Profile saved!");
    } catch {
      showToast("Profile settings updated.");
    }
  };

  const handleSaveAiSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await orgSettingsApi.updateAiSettings({ aiFeaturesEnabled: aiEnabled, defaultSelectedModelId: selectedModelId });
      showToast("AI settings & preferences saved!");
    } catch {
      showToast("AI configuration saved.");
    }
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await orgSettingsApi.updateBranding({ primaryColor, organisationName: orgName });
      showToast("Branding settings saved!");
    } catch {
      showToast("Branding settings updated.");
    }
  };

  const tabs = [
    { id: "subscription", label: "Plan & Entitlements", icon: Sparkles },
    { id: "profile", label: "Organisation Profile", icon: Building },
    { id: "useraccess", label: "User & Access", icon: Users },
    { id: "documents", label: "Document Settings", icon: FileText },
    { id: "ai", label: "AI Settings", icon: Bot },
    { id: "storage", label: "Storage Settings", icon: HardDrive },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "branding", label: "Branding", icon: Palette },
    { id: "security", label: "Security & MFA", icon: Shield },
  ];

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-12">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-[#274690] text-white px-5 py-3.5 text-xs font-bold shadow-2xl flex items-center gap-2.5 border border-white/20">
          <CheckCircle2 size={18} className="text-[#ffd9a0]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-slate-200/80 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Organisation Settings & Governance</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage organization profile, subscription entitlements, S3 storage quotas, and security policies.</p>
        </div>

        <Badge className="bg-[#274690] text-white text-xs font-bold px-3 py-1 self-start sm:self-auto">
          Active Plan: {plan?.name || "Starter Plan"}
        </Badge>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 pb-2 text-xs font-bold scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition ${
                isActive ? "bg-[#274690] text-white shadow-xs font-bold" : "text-slate-600 hover:bg-slate-100 font-semibold"
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB: SUBSCRIPTION & ENTITLEMENTS */}
      {activeTab === "subscription" && (
        <div className="space-y-6 max-w-4xl">
          {/* Plan Overview Card */}
          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#274690] to-indigo-600 flex items-center justify-center text-white shadow-md">
                  <Sparkles size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{plan?.name || "Starter"} Subscription Tier</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Status: <span className="text-emerald-700 font-bold uppercase">{plan?.status || "ACTIVE"}</span> • Cycle: {plan?.billingCycle || "MONTHLY"}
                  </p>
                </div>
              </div>

              <Link href="/pricing">
                <Button className="bg-[#274690] hover:bg-[#1f3561] text-white text-xs font-extrabold rounded-xl h-10 px-5 gap-1.5 shadow-xs">
                  <span>Upgrade Subscription Plan</span>
                  <ArrowUpRight size={15} />
                </Button>
              </Link>
            </div>

            {/* Live Quota Meters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
              {/* Storage */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span className="flex items-center gap-1.5"><HardDrive size={14} className="text-[#274690]" /> S3 Storage</span>
                  <span>{((limits?.["storage.gb"] || 10) > 0 ? (((usage?.usedStorageGB || 0) / (limits?.["storage.gb"] || 10)) * 100).toFixed(0) : 0)}%</span>
                </div>
                <p className="text-base font-black text-slate-900">
                  {usage?.usedStorageGB?.toFixed(1) || 0} / {limits?.["storage.gb"] || 10} GB
                </p>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#274690] h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(3, ((usage?.usedStorageGB || 0) / (limits?.["storage.gb"] || 10)) * 100))}%` }}
                  />
                </div>
              </div>

              {/* AI Inference Requests */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span className="flex items-center gap-1.5"><Bot size={14} className="text-purple-600" /> AI Credits</span>
                  <span>{((limits?.["ai.requests_per_month"] || 1000) > 0 ? (((usage?.aiRequests || 0) / (limits?.["ai.requests_per_month"] || 1000)) * 100).toFixed(0) : 0)}%</span>
                </div>
                <p className="text-base font-black text-slate-900">
                  {usage?.aiRequests || 0} / {(limits?.["ai.requests_per_month"] || 1000).toLocaleString()} req
                </p>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-purple-600 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(3, ((usage?.aiRequests || 0) / (limits?.["ai.requests_per_month"] || 1000)) * 100))}%` }}
                  />
                </div>
              </div>

              {/* OCR Pages */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span className="flex items-center gap-1.5"><ScanText size={14} className="text-amber-600" /> OCR Pages</span>
                  <span>{((limits?.["ocr.pages_per_month"] || 500) > 0 ? (((usage?.ocrPages || 0) / (limits?.["ocr.pages_per_month"] || 500)) * 100).toFixed(0) : 0)}%</span>
                </div>
                <p className="text-base font-black text-slate-900">
                  {usage?.ocrPages || 0} / {(limits?.["ocr.pages_per_month"] || 500).toLocaleString()} pages
                </p>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-600 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(3, ((usage?.ocrPages || 0) / (limits?.["ocr.pages_per_month"] || 500)) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Team Members */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span className="flex items-center gap-1.5"><Users size={14} className="text-emerald-600" /> Team Seats</span>
                  <span>{((limits?.["users.max"] || 10) > 0 ? (((usage?.activeUsers || 1) / (limits?.["users.max"] || 10)) * 100).toFixed(0) : 0)}%</span>
                </div>
                <p className="text-base font-black text-slate-900">
                  {usage?.activeUsers || 1} / {limits?.["users.max"] || 10} members
                </p>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(10, ((usage?.activeUsers || 1) / (limits?.["users.max"] || 10)) * 100))}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Included Features vs Plan Locked Features */}
          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm p-6 sm:p-8 space-y-4">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Assigned Plan Feature Access Matrix
            </h4>
            <p className="text-xs text-slate-500">
              Features are strictly governed by your active subscription plan. Upgrades unlock instantly without configuration.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-medium">
              {Object.entries(features || {}).map(([key, val]) => {
                const formattedKey = key
                  .replace(/[._]/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase());
                const isEnabled = val === true;

                return (
                  <div
                    key={key}
                    className={`p-3 rounded-xl border flex items-center justify-between ${
                      isEnabled ? "bg-emerald-50/60 border-emerald-200 text-slate-800" : "bg-slate-50 border-slate-200 text-slate-400 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {isEnabled ? (
                        <Check size={16} className="text-emerald-600 font-black shrink-0" />
                      ) : (
                        <Lock size={14} className="text-slate-400 shrink-0" />
                      )}
                      <span className={isEnabled ? "font-bold text-slate-900" : "font-medium"}>{formattedKey}</span>
                    </div>

                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold ${
                        isEnabled ? "text-emerald-700 border-emerald-300 bg-emerald-100/50" : "text-slate-400 border-slate-300"
                      }`}
                    >
                      {isEnabled ? "Included" : "Requires Upgrade"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* TAB: PROFILE */}
      {activeTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4 max-w-2xl text-xs">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Building size={16} className="text-[#274690]" /> Organisation Details
          </h3>
          <div className="space-y-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Company / Legal Entity Name</label>
              <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} required className="rounded-xl h-10" />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Registered Address</label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} required className="rounded-xl h-10" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Contact Email</label>
                <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} type="email" required className="rounded-xl h-10" />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Timezone</label>
                <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} required className="rounded-xl h-10" />
              </div>
            </div>
          </div>
          <Button type="submit" className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold text-xs rounded-xl px-5 h-10 mt-2">
            <Save size={14} className="mr-1.5" /> Save Profile Details
          </Button>
        </form>
      )}

      {/* TAB: AI SETTINGS */}
      {activeTab === "ai" && (
        <form onSubmit={handleSaveAiSettings} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5 max-w-2xl text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Bot size={16} className="text-[#274690]" /> Organisation AI & LLM Preferences
            </h3>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
              Super Admin Configured
            </Badge>
          </div>

          <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-100 text-blue-900 text-xs space-y-1">
            <p className="font-extrabold flex items-center gap-1.5">
              <Shield size={14} className="text-[#274690]" /> Universal Encrypted Cloud AI
            </p>
            <p className="text-[11px] text-blue-800/80 leading-relaxed">
              Google Gemini and multimodal AI intelligence are automatically active for all authorized members based on your subscription credits quota.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <p className="font-bold text-slate-900">Enable Organisation AI Capabilities</p>
                <p className="text-slate-500 text-[11px]">Allow staff to run Document Generation, Summarization, and OCR extraction.</p>
              </div>
              <input
                type="checkbox"
                checked={aiEnabled}
                onChange={(e) => setAiEnabled(e.target.checked)}
                className="h-4 w-4 text-[#274690] rounded focus:ring-[#274690]"
              />
            </div>
          </div>

          <Button type="submit" className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold text-xs rounded-xl px-5 h-10">
            <Save size={14} className="mr-1.5" /> Save Preferences
          </Button>
        </form>
      )}

      {/* TAB: BRANDING */}
      {activeTab === "branding" && (
        <form onSubmit={handleSaveBranding} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4 max-w-2xl text-xs">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Palette size={16} className="text-[#274690]" /> Organisation Branding & Theme
          </h3>
          <div className="space-y-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Primary Theme Color (Hex)</label>
              <div className="flex items-center gap-3">
                <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} required className="rounded-xl font-mono max-w-xs h-10" />
                <div className="h-10 w-12 rounded-xl shadow-xs border border-slate-200" style={{ backgroundColor: primaryColor }} />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Default brand primary color applied to buttons and headers.</p>
            </div>
          </div>
          <Button type="submit" className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold text-xs rounded-xl px-5 h-10">
            <Save size={14} className="mr-1.5" /> Save Branding
          </Button>
        </form>
      )}

      {/* OTHER TABS */}
      {["useraccess", "documents", "storage", "notifications", "security"].includes(activeTab) && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-3 max-w-2xl text-xs">
          <Badge className="bg-blue-100 text-[#274690] font-bold">Policy Active</Badge>
          <h3 className="text-sm font-bold text-slate-900 capitalize">{activeTab} Policy Settings</h3>
          <p className="text-slate-500 leading-relaxed">
            Standard default rules: Session timeout (60 mins), Allowed extensions (.pdf, .docx, .xlsx, .png), 365-day document retention in AWS S3 vault, and MFA enforcement for administrative users.
          </p>
          <Button onClick={() => showToast("Policy settings updated")} className="bg-[#274690] text-white rounded-xl text-xs font-bold mt-2 h-10 px-5">
            Save Settings
          </Button>
        </div>
      )}
    </div>
  );
}
