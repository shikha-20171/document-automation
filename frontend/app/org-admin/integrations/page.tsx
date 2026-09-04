"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plug,
  ShieldCheck,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RotateCw,
  Cloud,
  MessageSquare,
  Mail,
  Smartphone,
  Layers,
  Settings,
  Sparkles,
  Zap,
} from "lucide-react";
import integrationsApi, {
  type IntegrationProviderMeta,
  DEFAULT_TENANT_INTEGRATIONS,
} from "@/services/integrationsApi";

export default function OrgAdminIntegrationsPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [providers, setProviders] = useState<IntegrationProviderMeta[]>(
    DEFAULT_TENANT_INTEGRATIONS.filter((p) => p.id !== "AWS_S3" && p.slug !== "aws-s3")
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const res = await integrationsApi.getProvidersCatalog();
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        // Exclude platform storage (AWS S3) from Organisation Admin integrations list
        const tenantCatalog = res.data.filter((p) => p.id !== "AWS_S3" && p.slug !== "aws-s3");
        setProviders(tenantCatalog);
      }
    } catch (err: any) {
      console.warn("Notice loading integrations:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOneClickConnect = async (provider: IntegrationProviderMeta) => {
    setActionLoading(provider.id);
    try {
      if (provider.authType === "OAUTH2") {
        const res: any = await integrationsApi.connect(provider.slug || provider.id);
        const authUrl = res?.authUrl || res?.data?.authUrl;
        if (authUrl) {
          window.location.href = authUrl;
          return;
        }
        if (res?.success) {
          showToast(`Connected to ${provider.name}!`);
          loadData(true);
        } else {
          showToast(res?.message || "OAuth initiation failed");
        }
      } else if (provider.id === "SMTP_EMAIL") {
        // 1-Click DocuCore Email Infrastructure
        const res = await integrationsApi.connect("email", { mode: "DOCUCORE_MANAGED" });
        if (res.success) {
          showToast("✓ DocuCore Email Infrastructure enabled!");
          loadData(true);
        }
      }
    } catch (err: any) {
      showToast(err.message || "Connection failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleTestConnection = async (providerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionLoading(providerId);
    try {
      const res = await integrationsApi.testConnection(providerId);
      if (res.success) {
        showToast(`✓ ${providerId} connection verified successfully!`);
      } else {
        showToast(`Notice: ${res.data?.error || res.message || "Connection test failed"}`);
      }
      loadData(true);
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisconnect = async (providerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to disconnect ${providerId}?`)) return;
    setActionLoading(providerId);
    try {
      const res = await integrationsApi.disconnect(providerId);
      if (res.success) {
        showToast(`Disconnected from ${providerId}.`);
        loadData(true);
      }
    } catch (err: any) {
      showToast(err.message || "Disconnect failed");
    } finally {
      setActionLoading(null);
    }
  };

  // Filter providers to tenant integrations
  const filteredProviders = providers
    .filter((p) => p.id !== "AWS_S3" && p.slug !== "aws-s3")
    .filter((p) => {
      const matchesCat = selectedCategory === "ALL" || p.category === selectedCategory;
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });

  const getProviderIcon = (provider: IntegrationProviderMeta) => {
    if (provider.icon) {
      return (
        <img
          src={provider.icon}
          alt={provider.name}
          className="h-10 w-10 rounded-xl object-contain p-1 border border-slate-100 bg-slate-50"
          onError={(e) => {
            (e.target as HTMLElement).style.display = "none";
          }}
        />
      );
    }
    if (provider.id === "SMTP_EMAIL") return <Mail className="h-10 w-10 text-indigo-600 p-2 bg-indigo-50 rounded-xl" />;
    if (provider.id === "WHATSAPP_BUSINESS") return <Smartphone className="h-10 w-10 text-emerald-600 p-2 bg-emerald-50 rounded-xl" />;
    return <Layers className="h-10 w-10 text-slate-600 p-2 bg-slate-50 rounded-xl" />;
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-2xl transition-all">
          {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#274690]">
                <Zap size={13} /> 1-Click Enterprise Integrations
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                <ShieldCheck size={11} /> Tenant Isolated Vault
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
              Connected Apps & Services
            </h1>
            <p className="mt-1 text-xs text-slate-500 max-w-2xl">
              Connect your company's Google, Microsoft, Slack, and messaging accounts with <strong>1-Click OAuth</strong>.
              All developer credentials are configured globally by the platform administrator—you never have to input Client IDs or secrets.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsRefreshing(true);
              loadData();
            }}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 rounded-xl bg-[#274690] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#1f3561] disabled:opacity-50 transition-all self-start md:self-auto cursor-pointer"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            Sync & Refresh
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "ALL", label: `All Integrations (${providers.length || 6})` },
            { id: "STORAGE", label: "Cloud Drives & Docs" },
            { id: "COMMUNICATION", label: "Communication & Messaging" },
            { id: "PRODUCTIVITY", label: "Productivity" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-slate-900 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs focus:border-[#274690] focus:outline-none"
          />
        </div>
      </div>

      {/* Enterprise Integrations Grid */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center text-xs text-slate-400">
          <RotateCw size={16} className="animate-spin text-[#274690] mr-2" /> Loading integrations...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredProviders.map((item) => {
            const isConnected = item.status === "CONNECTED";
            const isNotAvailable = item.status === "NOT_CONFIGURED" || item.isPlatformAvailable === false;
            const isReadyToConnect = item.status === "READY_TO_CONNECT" || (!isConnected && !isNotAvailable);
            const isLoadingThis = actionLoading === item.id;

            return (
              <div
                key={item.id}
                onClick={() => router.push(`/org-admin/integrations/${item.slug || item.id.toLowerCase()}`)}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-[#274690] hover:shadow-md transition-all cursor-pointer"
              >
                <div>
                  {/* Top Bar: Icon + Status Badge */}
                  <div className="flex items-start justify-between">
                    {getProviderIcon(item)}
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                        isConnected
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : isNotAvailable
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-blue-50 text-[#274690] border border-blue-200"
                      }`}
                    >
                      {isConnected && <CheckCircle2 size={11} />}
                      {isNotAvailable && <AlertCircle size={11} />}
                      {isReadyToConnect && <Plug size={11} />}
                      {isConnected ? "Connected" : isNotAvailable ? "Setup Pending" : "1-Click Ready"}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="mt-4 text-base font-black text-slate-900 group-hover:text-[#274690] transition-colors">
                    {item.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Connected Metadata */}
                  {isConnected && item.connectedRecord && (
                    <div className="mt-3 rounded-xl bg-slate-50 border border-slate-100 p-2 text-[11px] text-slate-600 space-y-0.5">
                      <div className="font-bold text-slate-800 truncate">
                        {item.connectedRecord.accountName || item.connectedRecord.accountEmail || "Authorized Account"}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Connected: {item.connectedRecord.connectedAt ? new Date(item.connectedRecord.connectedAt).toLocaleDateString() : "Active"}
                      </div>
                    </div>
                  )}

                  {/* Platform notice if Super Admin hasn't configured */}
                  {isNotAvailable && item.platformNotice && (
                    <div className="mt-3 rounded-xl bg-amber-50/70 border border-amber-200/60 p-2 text-[10px] font-medium text-amber-800">
                      ⚠️ Platform configuration required by Super Admin before connecting.
                    </div>
                  )}
                </div>

                {/* Bottom Action Footer */}
                <div className="mt-5 border-t border-slate-100 pt-4 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                  {isConnected ? (
                    <>
                      <button
                        type="button"
                        onClick={(e) => handleTestConnection(item.id, e)}
                        disabled={isLoadingThis}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition cursor-pointer"
                      >
                        {isLoadingThis ? "Testing..." : "Test Connection"}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDisconnect(item.id, e)}
                        disabled={isLoadingThis}
                        className="rounded-xl px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition cursor-pointer"
                      >
                        Disconnect
                      </button>
                    </>
                  ) : isNotAvailable ? (
                    <span className="text-[11px] font-bold text-slate-400">
                      Super Admin Setup Required
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOneClickConnect(item)}
                      disabled={isLoadingThis}
                      className="w-full rounded-xl bg-[#274690] py-2 text-xs font-black text-white hover:bg-[#1f3561] shadow-xs disabled:opacity-50 transition cursor-pointer"
                    >
                      {isLoadingThis
                        ? "Connecting..."
                        : item.authType === "OAUTH2"
                        ? item.id === "GOOGLE_WORKSPACE"
                          ? "Connect with Google"
                          : item.id === "MICROSOFT_365"
                          ? "Connect with Microsoft"
                          : `Connect ${item.name}`
                        : `Enable ${item.name}`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
