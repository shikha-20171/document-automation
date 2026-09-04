"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState, useMemo } from "react";
import {
  Store,
  Layers,
  CheckSquare,
  Plus,
  Sparkles,
  Search,
  CheckCircle2,
  ExternalLink,
  Download,
  Star,
  Check,
  X,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type MarketplaceApp = {
  id: string;
  title: string;
  dev: string;
  rating: string;
  installs: string;
  category: "ERP" | "E-Sign" | "CRM" | "AI & OCR" | "Storage" | string;
  description: string;
  status: "ACTIVE" | "PENDING_APPROVAL" | "INSTALLED" | string;
  iconBg: string;
};

const INITIAL_APPS: MarketplaceApp[] = [
  {
    id: "APP-01",
    title: "SAP ERP Two-Way Sync",
    dev: "Enterprise Connect Labs",
    rating: "4.9 ★",
    installs: "140+",
    category: "ERP",
    description: "Automate ledger journal syncing and invoice document reconciliations with SAP S/4HANA.",
    status: "INSTALLED",
    iconBg: "bg-blue-100 text-blue-700",
  },
  {
    id: "APP-02",
    title: "DocuSign E-Signature Bridge",
    dev: "DocuSign Official",
    rating: "5.0 ★",
    installs: "280+",
    category: "E-Sign",
    description: "Direct bi-directional envelope dispatch and certificate of completion archiving.",
    status: "INSTALLED",
    iconBg: "bg-emerald-100 text-emerald-700",
  },
  {
    id: "APP-03",
    title: "QuickBooks Invoice Matcher",
    dev: "FinTech Labs",
    rating: "4.8 ★",
    installs: "95+",
    category: "ERP",
    description: "Match accounts payable invoices against QuickBooks purchase orders automatically.",
    status: "ACTIVE",
    iconBg: "bg-amber-100 text-amber-700",
  },
  {
    id: "APP-04",
    title: "Salesforce CRM Document Link",
    dev: "CloudBridge Global",
    rating: "4.7 ★",
    installs: "210+",
    category: "CRM",
    description: "Attach verified customer onboarding documents and KYC cards directly to Salesforce Opportunities.",
    status: "ACTIVE",
    iconBg: "bg-cyan-100 text-cyan-700",
  },
  {
    id: "APP-05",
    title: "AWS Textract High-Res OCR",
    dev: "AI Cloud Solutions",
    rating: "4.9 ★",
    installs: "320+",
    category: "AI & OCR",
    description: "Specialized OCR processor optimized for skewed table extracts and multi-column forms.",
    status: "ACTIVE",
    iconBg: "bg-purple-100 text-purple-700",
  },
  {
    id: "APP-06",
    title: "Dropbox & Google Drive Mirror",
    dev: "StorageMesh",
    rating: "4.6 ★",
    installs: "165+",
    category: "Storage",
    description: "Continuous secondary cloud backup for compliance archiving and cold storage retention.",
    status: "PENDING_APPROVAL",
    iconBg: "bg-indigo-100 text-indigo-700",
  },
];

function MarketplaceContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(tabParam);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [apps, setApps] = useState<MarketplaceApp[]>(INITIAL_APPS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Publish Modal State
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishForm, setPublishForm] = useState({
    title: "",
    dev: "",
    category: "ERP",
    description: "",
  });

  // Manage App Modal
  const [selectedApp, setSelectedApp] = useState<MarketplaceApp | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const tabs = [
    { id: "overview", label: "Marketplace Overview", icon: Store, count: apps.length },
    { id: "apps", label: "Apps & Add-ons", icon: Layers, count: apps.filter((a) => a.status !== "PENDING_APPROVAL").length },
    { id: "categories", label: "Categories", icon: Sparkles },
    { id: "approvals", label: "App Approvals", icon: CheckSquare, count: apps.filter((a) => a.status === "PENDING_APPROVAL").length },
  ];

  const categories = ["ALL", "ERP", "E-Sign", "CRM", "AI & OCR", "Storage"];

  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      if (activeTab === "approvals" && app.status !== "PENDING_APPROVAL") return false;
      if (activeTab === "apps" && app.status === "PENDING_APPROVAL") return false;
      if (selectedCategory !== "ALL" && app.category !== selectedCategory) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          app.title.toLowerCase().includes(q) ||
          app.dev.toLowerCase().includes(q) ||
          app.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [apps, activeTab, selectedCategory, search]);

  const handlePublishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!publishForm.title.trim()) return;

    const newApp: MarketplaceApp = {
      id: `APP-0${apps.length + 1}`,
      title: publishForm.title.trim(),
      dev: publishForm.dev.trim() || "Independent Developer",
      rating: "5.0 ★",
      installs: "1+",
      category: publishForm.category,
      description: publishForm.description.trim() || "Custom community integration extension.",
      status: "PENDING_APPROVAL",
      iconBg: "bg-emerald-100 text-emerald-700",
    };

    setApps((prev) => [newApp, ...prev]);
    showToast(`Extension "${newApp.title}" submitted to App Approval Queue!`);
    setShowPublishModal(false);
    setPublishForm({ title: "", dev: "", category: "ERP", description: "" });
  };

  const handleApproveApp = (appId: string) => {
    setApps((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: "ACTIVE" } : a))
    );
    showToast("Extension approved and published to the live Marketplace!");
  };

  const handleRejectApp = (appId: string) => {
    setApps((prev) => prev.filter((a) => a.id !== appId));
    showToast("Extension submission rejected.");
  };

  const handleToggleInstall = (appId: string) => {
    setApps((prev) =>
      prev.map((a) => {
        if (a.id === appId) {
          const nextStatus = a.status === "INSTALLED" ? "ACTIVE" : "INSTALLED";
          showToast(
            nextStatus === "INSTALLED"
              ? `Installed ${a.title} across all platform organisations!`
              : `Uninstalled ${a.title} from platform.`
          );
          return { ...a, status: nextStatus };
        }
        return a;
      })
    );
    setSelectedApp(null);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 font-sans text-slate-800">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[100] bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-[#274690] flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-[#274690] text-white text-[11px] font-extrabold px-2.5 py-0.5">
              App Store &amp; Connectors
            </Badge>
            <span className="text-[11px] font-bold text-emerald-600">
              ● Developer Ecosystem
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Marketplace &amp; App Ecosystem
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Discover extensions, custom document OCR pipelines, ERP connectors, and manage developer approval queues.
          </p>
        </div>

        <Button
          onClick={() => setShowPublishModal(true)}
          size="sm"
          className="bg-[#274690] hover:bg-[#1f3561] text-white text-xs font-bold gap-1.5 h-9 px-4 rounded-xl shadow-xs"
        >
          <Plus size={15} /> Publish Extension
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-3 text-xs font-bold">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition font-bold ${
                isActive
                  ? "bg-[#274690] text-white shadow-md shadow-[#274690]/20"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
              }`}
            >
              <Icon size={15} />
              <span>{t.label}</span>
              {t.count !== undefined && t.count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search & Category Filter Bar */}
      {activeTab !== "categories" && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search extensions or connectors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 pl-9 pr-3 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-[#274690] focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition shrink-0 ${
                  selectedCategory === cat
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Categories View */}
      {activeTab === "categories" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: "ERP & Accounting", count: 3, desc: "Connect SAP, QuickBooks, NetSuite, and Tally." },
            { name: "E-Signatures", count: 2, desc: "Legally compliant digital signature bridges." },
            { name: "CRM & Sales", count: 2, desc: "Attach documents directly to Salesforce & HubSpot." },
            { name: "AI & OCR Engines", count: 4, desc: "Specialized model processors and token routers." },
            { name: "Cloud Storage", count: 2, desc: "Backup to S3, Google Cloud, Dropbox, Azure Blob." },
          ].map((c) => (
            <Card key={c.name} className="p-5 rounded-2xl bg-white border-slate-200/90 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <Badge className="bg-[#274690]/10 text-[#274690] text-[10px] font-extrabold">{c.count} Apps</Badge>
                <Tag className="w-4 h-4 text-slate-400" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">{c.name}</h3>
              <p className="text-xs text-slate-500">{c.desc}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setActiveTab("apps");
                }}
                className="text-xs font-bold text-[#274690] p-0 h-auto hover:underline pt-2"
              >
                Browse category →
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Tab: App Grid View */}
      {activeTab !== "categories" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredApps.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
              <p className="font-bold text-slate-700 text-sm">No extensions found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your category or search filter.</p>
            </div>
          ) : (
            filteredApps.map((app) => (
              <Card
                key={app.id}
                className="p-5 rounded-2xl bg-white border-slate-200/90 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-semibold">{app.dev}</span>
                    <Badge className="bg-amber-50 text-amber-800 text-[10px] font-extrabold">{app.rating}</Badge>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl ${app.iconBg} flex items-center justify-center shrink-0 font-black text-xs`}>
                      {app.category.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 leading-tight">{app.title}</h3>
                      <Badge variant="outline" className="text-[9px] font-bold mt-1 text-slate-500">
                        {app.category}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {app.description}
                  </p>
                </div>

                <div className="text-xs text-slate-500 flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400">{app.installs} Tenants</span>

                  {app.status === "PENDING_APPROVAL" ? (
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        onClick={() => handleApproveApp(app.id)}
                        className="h-7 text-[11px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2.5"
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectApp(app.id)}
                        className="h-7 text-[11px] font-bold rounded-lg text-rose-600 border-rose-200 hover:bg-rose-50 px-2"
                      >
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant={app.status === "INSTALLED" ? "outline" : "default"}
                      size="sm"
                      onClick={() => setSelectedApp(app)}
                      className={`h-7 text-[11px] font-bold rounded-lg ${
                        app.status === "INSTALLED"
                          ? "border-emerald-200 text-emerald-700 bg-emerald-50/50"
                          : "bg-[#274690] text-white hover:bg-[#1f3561]"
                      }`}
                    >
                      {app.status === "INSTALLED" ? "Installed ✓" : "Install / Configure"}
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Modal: Publish Extension */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4 text-xs animate-in fade-in">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">Publish Marketplace Extension</h3>
              <button onClick={() => setShowPublishModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handlePublishSubmit} className="space-y-3.5">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Extension Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stripe Auto-Invoice Bridge"
                  value={publishForm.title}
                  onChange={(e) => setPublishForm({ ...publishForm, title: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-[#274690] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Developer / Organization</label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Tech"
                    value={publishForm.dev}
                    onChange={(e) => setPublishForm({ ...publishForm, dev: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-[#274690] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={publishForm.category}
                    onChange={(e) => setPublishForm({ ...publishForm, category: e.target.value })}
                    className="w-full h-9 px-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-hidden"
                  >
                    <option value="ERP">ERP &amp; Finance</option>
                    <option value="E-Sign">E-Signatures</option>
                    <option value="CRM">CRM &amp; Sales</option>
                    <option value="AI & OCR">AI &amp; OCR</option>
                    <option value="Storage">Cloud Storage</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe the capabilities, authentication method, and document formats supported..."
                  value={publishForm.description}
                  onChange={(e) => setPublishForm({ ...publishForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-[#274690] focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowPublishModal(false)}>Cancel</Button>
                <Button type="submit" className="bg-[#274690] text-white font-bold text-xs">Submit for Approval</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Manage App / Install */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4 text-xs animate-in fade-in">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{selectedApp.title}</h3>
                <p className="text-[11px] text-slate-400">By {selectedApp.dev}</p>
              </div>
              <button onClick={() => setSelectedApp(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">{selectedApp.description}</p>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Current Status:</span>
                <Badge className={selectedApp.status === "INSTALLED" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"}>
                  {selectedApp.status}
                </Badge>
              </div>
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Category:</span>
                <span className="font-bold text-slate-800">{selectedApp.category}</span>
              </div>
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Rating:</span>
                <span className="font-bold text-amber-600">{selectedApp.rating}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedApp(null)}>Close</Button>
              <Button
                type="button"
                onClick={() => handleToggleInstall(selectedApp.id)}
                className={`font-bold text-xs ${
                  selectedApp.status === "INSTALLED"
                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                    : "bg-[#274690] hover:bg-[#1f3561] text-white"
                }`}
              >
                {selectedApp.status === "INSTALLED" ? "Uninstall Extension" : "Install for All Tenants"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-500">Loading Marketplace...</div>}>
      <MarketplaceContent />
    </Suspense>
  );
}
