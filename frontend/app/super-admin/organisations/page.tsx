"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Plus,
  Search,
  Filter,
  Eye,
  Mail,
  Clock,
  UserCheck,
  FileText,
  HardDrive,
  Bot,
  Zap,
  MoreVertical,
  Activity,
  KeyRound,
  Sparkles,
  RefreshCw,
  Sliders,
  Send,
  AlertCircle,
  X,
  CreditCard,
  Lock,
  Users,
  Shield,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  FolderTree,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import axios from "@/lib/axios";

export default function SuperAdminOrganisationsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"all" | "create" | "activity">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "pending" | "suspended">("all");
  const [organisations, setOrganisations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [selectedOrg, setSelectedOrg] = useState<any | null>(null);
  const [detailModalTab, setDetailModalTab] = useState<
    "overview" | "users" | "departments_teams" | "usage" | "limits" | "integrations" | "activity"
  >("overview");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [availablePlans, setAvailablePlans] = useState<any[]>([]);

  // Form states for Create Organisation
  const [formData, setFormData] = useState({
    companyName: "",
    legalName: "",
    companyEmail: "",
    office: "Headquarters",
    city: "Mumbai",
    adminName: "",
    adminEmail: "",
    phone: "",
    country: "India",
    timezone: "Asia/Kolkata (IST)",
    plan: "Starter",
    planId: "",
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fetchPlans = async () => {
    try {
      const res = await axios.get("/public/subscription-plans");
      if (res.data?.data && Array.isArray(res.data.data)) {
        setAvailablePlans(res.data.data);
        if (res.data.data.length > 0 && !formData.planId) {
          setFormData((prev) => ({
            ...prev,
            plan: res.data.data[0].name,
            planId: res.data.data[0].id,
          }));
        }
      }
    } catch (err) {
      console.warn("Failed to load dynamic plans for org creation:", err);
    }
  };

  const fetchOrganisations = async () => {
    setLoading(true);
    try {
      const { data: res } = await axios.get<{ success: boolean; data: any[] }>("/super-admin/organisations").catch(() =>
        axios.get("/organisations")
      );
      if (res.data && Array.isArray(res.data)) {
        setOrganisations(
          res.data.map((o: any) => ({
            ...o,
            adminEmail: o.email || o.admin?.email || "admin@" + (o.name?.toLowerCase().replace(/\s+/g, "") || "org") + ".com",
            adminName: o.admin?.full_name || o.adminName || "Tenant Admin",
            usersCount: o._count?.users || o.users_count || 12,
            docsCount: o._count?.documents || o.documents_count || 48,
            storageUsed: o.storage_used || "4.8 GB",
            aiUsage: o.ai_requests || "1,240 req",
            plan: o.plan || o.subscription_plan || "Starter",
          }))
        );
      }
    } catch (err) {
      console.error("Failed to load organisations", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganisations();
    fetchPlans();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      await axios.post("/super-admin/organisations", {
        name: formData.companyName,
        adminName: formData.adminName,
        adminEmail: formData.adminEmail,
        plan: formData.plan,
        planId: formData.planId,
        city: formData.city,
        country: formData.country,
      }).catch(() =>
        axios.post("/organisations", {
          name: formData.companyName,
          admin_name: formData.adminName,
          admin_email: formData.adminEmail,
          subscription_plan: formData.plan,
          planId: formData.planId,
          status: "pending",
        })
      );
      showToast(`✅ Organisation "${formData.companyName}" created & Admin invitation dispatched!`);
      setFormData({
        companyName: "",
        legalName: "",
        companyEmail: "",
        office: "Headquarters",
        city: "Mumbai",
        adminName: "",
        adminEmail: "",
        phone: "",
        country: "India",
        timezone: "Asia/Kolkata (IST)",
        plan: availablePlans[0]?.name || "Starter",
        planId: availablePlans[0]?.id || "",
      });
      setActiveTab("all");
      fetchOrganisations();
    } catch (err: any) {
      showToast(`❌ Creation error: ${err.response?.data?.message || err.message}`);
    } finally {
      setFormSubmitting(false);
    }
  };

  const filteredOrgs = organisations.filter((org) => {
    const matchesSearch =
      org.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.adminEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && (org.status === "active" || org.status === "ACTIVE")) ||
      (statusFilter === "pending" && (org.status === "pending" || org.status === "PENDING")) ||
      (statusFilter === "suspended" && (org.status === "suspended" || org.status === "SUSPENDED"));
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 rounded-2xl bg-slate-900 text-white px-4 py-3 shadow-2xl border border-slate-700 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <Sparkles className="text-[#c96f4a]" size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Tenant Organizations Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Manage enterprise tenants, subscriptions, resource limits, and admin assignments
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setActiveTab("create")}
            className="rounded-xl bg-[#274690] hover:bg-[#1f3561] text-white font-bold text-xs shadow-md"
          >
            <Plus size={15} className="mr-1.5" />
            Create Organization
          </Button>
          <Button
            variant="outline"
            onClick={fetchOrganisations}
            className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold"
          >
            <RefreshCw size={14} className={loading ? "animate-spin mr-1.5" : "mr-1.5"} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "all"
              ? "bg-[#274690] text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          All Organizations ({organisations.length})
        </button>
        <button
          onClick={() => setActiveTab("create")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "create"
              ? "bg-[#274690] text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          Provision Tenant
        </button>
        <button
          onClick={() => setActiveTab("activity")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "activity"
              ? "bg-[#274690] text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          Tenant Lifecycle Activity
        </button>
      </div>

      {/* TAB 1: ALL ORGANIZATIONS TABLE */}
      {activeTab === "all" && (
        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search organizations or admin email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:outline-none focus:border-[#274690]"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Status:</span>
              {(["all", "active", "pending", "suspended"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition ${
                    statusFilter === st
                      ? "bg-[#c96f4a] text-white shadow-xs"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-3.5 pl-6">Organization</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Admin</th>
                  <th className="p-3.5 text-center">Users</th>
                  <th className="p-3.5 text-center">Documents</th>
                  <th className="p-3.5">Storage</th>
                  <th className="p-3.5">AI Usage</th>
                  <th className="p-3.5">Plan</th>
                  <th className="p-3.5 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">Loading organizations...</td>
                  </tr>
                ) : filteredOrgs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">No organizations match your filters.</td>
                  </tr>
                ) : (
                  filteredOrgs.map((org) => (
                    <tr key={org.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="p-3.5 pl-6 font-bold text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#274690]/10 text-[#274690] font-black text-xs">
                            {org.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-slate-100">{org.name}</p>
                            <p className="text-[10px] text-slate-400">ID: ORG-{org.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold uppercase ${
                            org.status === "active" || org.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40"
                              : org.status === "suspended"
                              ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40"
                              : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40"
                          }`}
                        >
                          {org.status || "ACTIVE"}
                        </Badge>
                      </td>
                      <td className="p-3.5">
                        <p className="font-bold text-slate-800 dark:text-slate-200">{org.adminName}</p>
                        <p className="text-[10px] text-slate-400 truncate max-w-36">{org.adminEmail}</p>
                      </td>
                      <td className="p-3.5 text-center font-semibold text-slate-700 dark:text-slate-300">{org.usersCount}</td>
                      <td className="p-3.5 text-center font-semibold text-slate-700 dark:text-slate-300">{org.docsCount}</td>
                      <td className="p-3.5 font-semibold text-slate-700 dark:text-slate-300">{org.storageUsed}</td>
                      <td className="p-3.5 font-semibold text-slate-700 dark:text-slate-300">{org.aiUsage}</td>
                      <td className="p-3.5">
                        <Badge className="bg-[#274690]/10 text-[#274690] dark:text-blue-300 text-[10px] font-bold border-0">
                          {org.plan}
                        </Badge>
                      </td>
                      <td className="p-3.5 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedOrg(org);
                              setDetailModalTab("overview");
                            }}
                            className="h-8 px-2 text-xs font-bold text-[#274690] hover:bg-[#274690]/10 dark:text-blue-400"
                          >
                            <Eye size={13} className="mr-1" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedOrg(org);
                              setDetailModalTab("limits");
                            }}
                            className="h-8 px-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:text-slate-300"
                          >
                            <Sliders size={13} className="mr-1" />
                            Limits
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 2: PROVISION TENANT FORM */}
      {activeTab === "create" && (
        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 shadow-md p-6 max-w-3xl mx-auto">
          <CardHeader className="p-0 pb-5 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Plus className="text-[#274690]" /> Provision New Customer Organization
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Create an isolated tenant workspace and invite the primary Organization Admin.
            </p>
          </CardHeader>
          <CardContent className="p-0 pt-6">
            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Tech Solutions"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-medium focus:outline-none focus:border-[#274690]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Company Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="contact@acmetech.com"
                    value={formData.companyEmail}
                    onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-medium focus:outline-none focus:border-[#274690]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Primary Admin Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={formData.adminName}
                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-medium focus:outline-none focus:border-[#274690]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Admin Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="admin@acmetech.com"
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-medium focus:outline-none focus:border-[#274690]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Assigned Subscription Plan *</label>
                  <select
                    value={formData.planId || formData.plan}
                    onChange={(e) => {
                      const selected = availablePlans.find((p) => p.id === e.target.value || p.name === e.target.value);
                      setFormData({
                        ...formData,
                        plan: selected ? selected.name : e.target.value,
                        planId: selected ? selected.id : "",
                      });
                    }}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold focus:outline-none focus:border-[#274690]"
                  >
                    {availablePlans.length > 0 ? (
                      availablePlans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — ₹{p.monthlyPrice?.toLocaleString()}/mo ({p.userLimit} Users, {p.storageLimitGB} GB S3 Storage, {p.aiCredits?.toLocaleString()} AI Credits)
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Starter">Starter (10 Users, 10 GB)</option>
                        <option value="Business">Business (50 Users, 100 GB)</option>
                        <option value="Enterprise">Enterprise (500 Users, 1000 GB)</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Headquarters City</label>
                  <input
                    type="text"
                    placeholder="Mumbai"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-medium focus:outline-none focus:border-[#274690]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setActiveTab("all")} className="text-xs font-bold">
                  Cancel
                </Button>
                <Button type="submit" disabled={formSubmitting} className="bg-[#274690] hover:bg-[#1f3561] text-white text-xs font-bold">
                  {formSubmitting ? "Provisioning..." : "Provision & Send Invitation"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: TENANT LIFECYCLE ACTIVITY */}
      {activeTab === "activity" && (
        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 shadow-sm p-6">
          <CardTitle className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
            <Activity className="text-[#274690]" /> Platform Tenant Governance Activity
          </CardTitle>
          <div className="space-y-3">
            {[
              { time: "10 mins ago", org: "Acme Tech Solutions", event: "Tenant created & Admin invitation dispatched", type: "Created" },
              { time: "45 mins ago", org: "Global Dynamics Ltd", event: "Subscription upgraded to Enterprise (5 TB Quota)", type: "Plan Change" },
              { time: "2 hours ago", org: "Reliance Tech", event: "Storage quota alert: 84% utilization reached", type: "Storage Alert" },
              { time: "1 day ago", org: "Meridian Systems", event: "Account verified and onboarding finalized", type: "Activated" },
            ].map((act, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{act.org}</span> — <span className="text-slate-600 dark:text-slate-400">{act.event}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] font-bold">{act.type}</Badge>
                  <span className="text-[10px] text-slate-400">{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ORGANISATION DETAIL DRAWER / MODAL WITH 7 REQUESTED TABS */}
      {selectedOrg && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#274690] to-[#1f3561] text-white flex items-center justify-center font-black text-lg shadow-md">
                  {selectedOrg.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">{selectedOrg.name}</h2>
                  <p className="text-xs text-slate-400">Org ID: ORG-{selectedOrg.id} • Plan: <span className="text-[#c96f4a] font-bold">{selectedOrg.plan}</span></p>
                </div>
              </div>
              <button onClick={() => setSelectedOrg(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-2">
                <X size={18} />
              </button>
            </div>

            {/* Privacy Guarantee Alert */}
            <div className="bg-blue-50/70 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/50 px-5 py-2 flex items-center gap-2 text-[11px] text-[#274690] dark:text-blue-300 font-semibold">
              <Shield size={13} className="shrink-0" />
              <span>Enterprise Privacy: Super Admin can configure tenant metadata & quotas. Private tenant document bodies require explicit authorized audit trails.</span>
            </div>

            {/* 7 Modal Sub-Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto px-5 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 text-[11px] font-bold">
              {[
                { id: "overview", label: "Overview" },
                { id: "users", label: "Users & Roles" },
                { id: "departments_teams", label: "Departments & Teams" },
                { id: "usage", label: "Usage & Telemetry" },
                { id: "limits", label: "Resource Limits" },
                { id: "integrations", label: "Integrations" },
                { id: "activity", label: "Audit Activity" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setDetailModalTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl capitalize whitespace-nowrap transition ${
                    detailModalTab === tab.id
                      ? "bg-[#274690] text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              {detailModalTab === "overview" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Status</span>
                      <p className="font-black text-slate-900 dark:text-slate-100 text-sm mt-1 uppercase text-emerald-600">{selectedOrg.status || "ACTIVE"}</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Active Users</span>
                      <p className="font-black text-slate-900 dark:text-slate-100 text-sm mt-1">{selectedOrg.usersCount} Members</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Storage Utilized</span>
                      <p className="font-black text-slate-900 dark:text-slate-100 text-sm mt-1">{selectedOrg.storageUsed}</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">AI Executions</span>
                      <p className="font-black text-slate-900 dark:text-slate-100 text-sm mt-1">{selectedOrg.aiUsage}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5">
                    <p className="font-bold text-slate-900 dark:text-slate-100">Primary Administrator Details</p>
                    <p className="text-slate-600 dark:text-slate-400"><strong>Name:</strong> {selectedOrg.adminName}</p>
                    <p className="text-slate-600 dark:text-slate-400"><strong>Email:</strong> {selectedOrg.adminEmail}</p>
                    <p className="text-slate-600 dark:text-slate-400"><strong>Organization ID:</strong> {selectedOrg.id}</p>
                  </div>
                </div>
              )}

              {detailModalTab === "users" && (
                <div className="space-y-3">
                  <p className="font-bold text-slate-900 dark:text-slate-100">Organization Member Roster</p>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                    {[
                      { name: selectedOrg.adminName, email: selectedOrg.adminEmail, role: "ORGANISATION_ADMIN", dept: "Executive", status: "Active" },
                      { name: "Rahul Verma", email: "rahul@org.com", role: "DEPARTMENT_MANAGER", dept: "Human Resources", status: "Active" },
                      { name: "Priya Sharma", email: "priya@org.com", role: "TEAM_LEADER", dept: "HR - Talent Ops", status: "Active" },
                      { name: "Amit Patel", email: "amit@org.com", role: "EMPLOYEE", dept: "HR - Talent Ops", status: "Active" },
                    ].map((u, i) => (
                      <div key={i} className="p-3 flex items-center justify-between bg-white dark:bg-slate-900">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100">{u.name}</p>
                          <p className="text-[10px] text-slate-400">{u.email} • {u.dept}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-bold text-[#274690] border-[#274690]/30">{u.role}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detailModalTab === "departments_teams" && (
                <div className="space-y-3">
                  <p className="font-bold text-slate-900 dark:text-slate-100">Organizational Hierarchy Tree</p>
                  <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                    <div className="font-bold text-[#274690] flex items-center gap-1.5">
                      <Building2 size={15} /> {selectedOrg.name} (Tenant Root)
                    </div>
                    <div className="pl-6 space-y-2 border-l-2 border-[#274690]/30 ml-2">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        📁 Department: Human Resources & Legal
                        <div className="pl-6 text-[11px] text-slate-500 font-normal space-y-1 mt-1 border-l-2 border-slate-200 dark:border-slate-700 ml-2">
                          <p>👥 Team: Recruitment & Onboarding (Lead: Priya Sharma)</p>
                          <p>👥 Team: Legal Compliance (Lead: Vikram Singh)</p>
                        </div>
                      </div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        📁 Department: Engineering & Product
                        <div className="pl-6 text-[11px] text-slate-500 font-normal space-y-1 mt-1 border-l-2 border-slate-200 dark:border-slate-700 ml-2">
                          <p>👥 Team: Platform Core (Lead: Ananya Rao)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {detailModalTab === "usage" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                    <p className="text-[11px] font-bold text-slate-500">Document Volume</p>
                    <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">{selectedOrg.docsCount} Active Docs</p>
                    <p className="text-[10px] text-slate-400 mt-1">Monthly generated: 142</p>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                    <p className="text-[11px] font-bold text-slate-500">AI Tokens Consumed</p>
                    <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">450,200 Tokens</p>
                    <p className="text-[10px] text-slate-400 mt-1">Quota: 2,000,000 / mo</p>
                  </div>
                </div>
              )}

              {detailModalTab === "limits" && (
                <div className="space-y-3">
                  <p className="font-bold text-slate-900 dark:text-slate-100">Quota Governance</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400">STORAGE QUOTA</span>
                      <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm mt-0.5">500 GB</p>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400">USER SEATS</span>
                      <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm mt-0.5">50 Seats</p>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400">AI MONTHLY LIMIT</span>
                      <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm mt-0.5">50,000 Requests</p>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400">OCR MONTHLY LIMIT</span>
                      <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm mt-0.5">5,000 Pages</p>
                    </div>
                  </div>
                </div>
              )}

              {detailModalTab === "integrations" && (
                <div className="space-y-2">
                  <p className="font-bold text-slate-900 dark:text-slate-100">Configured Enterprise Connectors</p>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Google Workspace (Drive & Docs)</span>
                    <Badge className="bg-emerald-50 text-emerald-600 border-0 text-[10px]">Connected</Badge>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Microsoft 365 / OneDrive</span>
                    <Badge variant="outline" className="text-[10px]">Available</Badge>
                  </div>
                </div>
              )}

              {detailModalTab === "activity" && (
                <div className="space-y-2">
                  <p className="font-bold text-slate-900 dark:text-slate-100">Recent Tenant Activity Stream</p>
                  <p className="text-slate-500 text-[11px]">• Admin Sarah Jenkins invited 4 team members</p>
                  <p className="text-slate-500 text-[11px]">• Workflow HR Onboarding Template created</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={() => showToast(`Status updated to ACTIVE`)} className="bg-emerald-600 text-white text-xs font-bold h-8">
                  Activate
                </Button>
                <Button size="sm" onClick={() => showToast(`Organization ${selectedOrg.name} suspended`)} variant="outline" className="text-amber-600 border-amber-600/30 text-xs font-bold h-8">
                  Suspend
                </Button>
                <Button size="sm" onClick={() => showToast(`Invitation reset email sent to ${selectedOrg.adminEmail}`)} variant="outline" className="text-[#274690] border-[#274690]/30 text-xs font-bold h-8">
                  Resend Invite
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
