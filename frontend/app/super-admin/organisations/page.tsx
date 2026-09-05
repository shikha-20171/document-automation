"use client";

import { useState, useEffect, useMemo } from "react";
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
  Globe,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  ExternalLink,
  Edit3,
  Power,
  Trash2,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import axios from "@/lib/axios";

// Standard dynamic plan defaults
const DEFAULT_PLANS = [
  {
    id: "plan-starter",
    planName: "Starter",
    planCode: "starter",
    userLimit: 10,
    storageLimitGB: 50,
    aiCredits: 2000,
    ocrLimit: 1000,
    monthlyPrice: 0,
    currency: "INR",
  },
  {
    id: "plan-business",
    planName: "Business",
    planCode: "business",
    userLimit: 50,
    storageLimitGB: 250,
    aiCredits: 10000,
    ocrLimit: 5000,
    monthlyPrice: 4999,
    currency: "INR",
  },
  {
    id: "plan-enterprise",
    planName: "Enterprise",
    planCode: "enterprise",
    userLimit: 500,
    storageLimitGB: 1000,
    aiCredits: 50000,
    ocrLimit: 25000,
    monthlyPrice: 19999,
    currency: "INR",
  },
];

// Curated high-fidelity static demo organisations for presentation and fallback
const DEMO_STATIC_ORGANISATIONS = [
  {
    id: 9901,
    name: "Tata Consultancy Services (TCS)",
    branch: "Mumbai HQ",
    orgType: "Company",
    industry: "Technology",
    companySize: "500+",
    website: "https://www.tcs.com",
    logo: "",
    description: "Global leader in IT services, consulting, and digital business solutions.",
    email: "contact@tcs-demo.com",
    phone: "+91 22 6778 9999",
    address: "TCS House, Raveline Street, Fort",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    timezone: "Asia/Kolkata (IST)",
    dateFormat: "DD-MM-YYYY",
    currency: "INR",
    status: "active",
    plan: "Enterprise",
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastActivity: new Date().toISOString(),
    subscription: {
      planName: "Enterprise",
      status: "ACTIVE",
      userLimit: 500,
      storageLimitGB: 1000,
      aiCredits: 50000,
      ocrLimit: 25000,
    },
    admin: {
      id: 901,
      fullName: "Rajesh Gopinathan",
      email: "admin@tcs-demo.com",
      status: "ACTIVE",
    },
    stats: {
      usersCount: 142,
      activeUsersCount: 138,
      docsCount: 1840,
      departmentsCount: 8,
      teamsCount: 24,
      storageUsedGB: 412.5,
      storageUsedMB: 422400,
    },
  },
  {
    id: 9902,
    name: "Infosys Technologies Ltd",
    branch: "Electronic City",
    orgType: "Company",
    industry: "Technology",
    companySize: "500+",
    website: "https://www.infosys.com",
    logo: "",
    description: "Next-generation digital services, enterprise cloud and AI consulting leader.",
    email: "enterprise@infosys-demo.com",
    phone: "+91 80 2852 0261",
    address: "Electronics City, Hosur Road",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    timezone: "Asia/Kolkata (IST)",
    dateFormat: "DD-MM-YYYY",
    currency: "INR",
    status: "active",
    plan: "Enterprise",
    created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    subscription: {
      planName: "Enterprise",
      status: "ACTIVE",
      userLimit: 500,
      storageLimitGB: 1000,
      aiCredits: 50000,
      ocrLimit: 25000,
    },
    admin: {
      id: 902,
      fullName: "Salil Parekh",
      email: "admin@infosys-demo.com",
      status: "ACTIVE",
    },
    stats: {
      usersCount: 98,
      activeUsersCount: 92,
      docsCount: 1250,
      departmentsCount: 6,
      teamsCount: 18,
      storageUsedGB: 280.0,
      storageUsedMB: 286720,
    },
  },
  {
    id: 9903,
    name: "Apollo Health & Life Sciences",
    branch: "Delhi Central",
    orgType: "Healthcare",
    industry: "Healthcare",
    companySize: "201-500",
    website: "https://www.apollohospitals.com",
    logo: "",
    description: "Multi-specialty healthcare network, clinical diagnostics and records management.",
    email: "info@apollo-demo.org",
    phone: "+91 11 2692 5858",
    address: "Sarita Vihar, Delhi Mathura Road",
    city: "New Delhi",
    state: "Delhi",
    country: "India",
    timezone: "Asia/Kolkata (IST)",
    dateFormat: "DD-MM-YYYY",
    currency: "INR",
    status: "active",
    plan: "Business",
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    lastActivity: new Date().toISOString(),
    subscription: {
      planName: "Business",
      status: "ACTIVE",
      userLimit: 50,
      storageLimitGB: 250,
      aiCredits: 10000,
      ocrLimit: 5000,
    },
    admin: {
      id: 903,
      fullName: "Dr. Preetha Reddy",
      email: "admin@apollo-demo.org",
      status: "ACTIVE",
    },
    stats: {
      usersCount: 34,
      activeUsersCount: 31,
      docsCount: 620,
      departmentsCount: 4,
      teamsCount: 10,
      storageUsedGB: 85.4,
      storageUsedMB: 87449,
    },
  },
  {
    id: 9904,
    name: "NexGen Financial Advisory",
    branch: "BKC Office",
    orgType: "Agency",
    industry: "Finance",
    companySize: "11-50",
    website: "https://www.nexgenfin-demo.com",
    logo: "",
    description: "Institutional financial auditing, legal compliance and AI contract processing.",
    email: "contact@nexgenfin-demo.com",
    phone: "+91 22 4000 8800",
    address: "G-Block, Bandra Kurla Complex",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    timezone: "Asia/Kolkata (IST)",
    dateFormat: "DD-MM-YYYY",
    currency: "INR",
    status: "active",
    plan: "Starter",
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    lastActivity: new Date().toISOString(),
    subscription: {
      planName: "Starter",
      status: "ACTIVE",
      userLimit: 10,
      storageLimitGB: 50,
      aiCredits: 2000,
      ocrLimit: 1000,
    },
    admin: {
      id: 904,
      fullName: "Ananya Sharma",
      email: "ananya@nexgenfin-demo.com",
      status: "ACTIVE",
    },
    stats: {
      usersCount: 8,
      activeUsersCount: 8,
      docsCount: 145,
      departmentsCount: 2,
      teamsCount: 4,
      storageUsedGB: 12.8,
      storageUsedMB: 13107,
    },
  },
];

function generateSecurePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let pwd = "Docu@";
  for (let i = 0; i < 6; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  pwd += "!9";
  return pwd;
}

export default function SuperAdminOrganisationsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"all" | "create">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "pending" | "suspended">("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [organisations, setOrganisations] = useState<any[]>(DEMO_STATIC_ORGANISATIONS);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [availablePlans, setAvailablePlans] = useState<any[]>(DEFAULT_PLANS);

  // Modals & Drawers
  const [selectedOrg, setSelectedOrg] = useState<any | null>(null);
  const [detailModalTab, setDetailModalTab] = useState<"overview" | "limits" | "users">("overview");
  const [editModalOrg, setEditModalOrg] = useState<any | null>(null);
  const [deleteModalOrg, setDeleteModalOrg] = useState<any | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // --- Form State for 5-Section Organisation Creation ---
  const [formData, setFormData] = useState({
    // Section 1: Organisation Information
    organisationName: "",
    organisationType: "Company",
    industry: "Technology",
    companySize: "1-10",
    website: "",
    logo: "",
    description: "",

    // Section 2: Organisation Contact
    businessEmail: "",
    phone: "",
    country: "India",
    state: "Maharashtra",
    city: "Mumbai",
    address: "",
    timezone: "Asia/Kolkata (IST)",
    dateFormat: "DD-MM-YYYY",
    currency: "INR",

    // Section 3: Organisation Admin
    adminName: "",
    adminEmail: "",
    adminPhone: "",
    adminUsername: "",
    temporaryPassword: generateSecurePassword(),
    forcePasswordChange: true,
    sendWelcomeEmail: true,

    // Section 4: Subscription
    subscriptionPlan: "Starter",
    planId: "",
    subscriptionStatus: "ACTIVE",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],

    // Section 5: Status
    status: "active",
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // 1. Fetch Subscription Plans
  const fetchPlans = async () => {
    try {
      const res = await axios.get("/public/subscription-plans");
      const list = res.data?.data || res.data;
      if (Array.isArray(list) && list.length > 0) {
        setAvailablePlans(list);
        if (!formData.planId) {
          setFormData((prev) => ({
            ...prev,
            subscriptionPlan: list[0].planName || list[0].name || "Starter",
            planId: list[0].id,
          }));
        }
      }
    } catch (err) {
      console.warn("[Plans] Using preset plans:", err);
    }
  };

  // 2. Fetch Organisations from Real Database + Merge Demo Dataset
  const fetchOrganisations = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/organisations");
      const serverList = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      
      // Real DB items placed on top, demo items appended if not already present
      const existingNames = new Set(serverList.map((o: any) => o.name?.toLowerCase().trim()));
      const existingIds = new Set(serverList.map((o: any) => String(o.id)));
      const demoItems = DEMO_STATIC_ORGANISATIONS.filter(
        (d) => !existingNames.has(d.name.toLowerCase().trim()) && !existingIds.has(String(d.id))
      );

      setOrganisations([...serverList, ...demoItems]);
    } catch (err: any) {
      console.warn("Could not fetch organisations from server, using demo dataset:", err);
      setOrganisations(DEMO_STATIC_ORGANISATIONS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganisations();
    fetchPlans();
  }, []);

  // Compute live limits based on currently selected plan in form
  const selectedPlanDetails = useMemo(() => {
    const found = availablePlans.find(
      (p) =>
        p.id === formData.planId ||
        p.planName?.toLowerCase() === formData.subscriptionPlan?.toLowerCase() ||
        p.name?.toLowerCase() === formData.subscriptionPlan?.toLowerCase()
    );
    return (
      found || {
        planName: formData.subscriptionPlan || "Starter",
        userLimit: 10,
        storageLimitGB: 50,
        aiCredits: 2000,
        ocrLimit: 1000,
      }
    );
  }, [availablePlans, formData.planId, formData.subscriptionPlan]);

  // Handle Create Organisation Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.organisationName.trim()) {
      showToast("Organisation Name is required", "error");
      return;
    }
    if (!formData.businessEmail.trim() && !formData.adminEmail.trim()) {
      showToast("Email address is required", "error");
      return;
    }

    setFormSubmitting(true);
    try {
      const payload = {
        name: formData.organisationName.trim(),
        organisationType: formData.organisationType,
        industry: formData.industry,
        companySize: formData.companySize,
        website: formData.website.trim() || undefined,
        logo: formData.logo.trim() || undefined,
        description: formData.description.trim() || undefined,

        email: (formData.businessEmail || formData.adminEmail).trim().toLowerCase(),
        phone: formData.phone.trim() || undefined,
        country: formData.country,
        state: formData.state,
        city: formData.city,
        address: formData.address.trim() || undefined,
        timezone: formData.timezone,
        dateFormat: formData.dateFormat,
        currency: formData.currency,

        adminName: (formData.adminName || "Admin").trim(),
        adminEmail: (formData.adminEmail || formData.businessEmail).trim().toLowerCase(),
        adminPhone: formData.adminPhone.trim() || formData.phone.trim() || undefined,
        adminUsername: formData.adminUsername.trim() || undefined,
        temporaryPassword: formData.temporaryPassword,
        forcePasswordChange: formData.forcePasswordChange,
        sendWelcomeEmail: formData.sendWelcomeEmail,

        subscriptionPlan: formData.subscriptionPlan,
        planId: formData.planId,
        subscriptionStatus: formData.subscriptionStatus,
        startDate: formData.startDate,
        endDate: formData.endDate,

        status: formData.status,
      };

      const res = await axios.post("/organisations", payload);
      const createdData = res.data?.data || res.data;

      // Construct immediate item to instantly reflect on table
      const newOrgItem = {
        id: createdData?.id || Date.now(),
        name: payload.name,
        branch: payload.city || "Headquarters",
        orgType: payload.organisationType,
        industry: payload.industry,
        companySize: payload.companySize,
        website: payload.website,
        logo: payload.logo,
        description: payload.description,
        email: payload.email,
        phone: payload.phone,
        address: payload.address,
        city: payload.city,
        state: payload.state,
        country: payload.country,
        timezone: payload.timezone,
        dateFormat: payload.dateFormat,
        currency: payload.currency,
        status: payload.status || "active",
        created_at: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        plan: payload.subscriptionPlan || "Starter",
        subscription: {
          planName: payload.subscriptionPlan || "Starter",
          status: payload.subscriptionStatus || "ACTIVE",
          userLimit: selectedPlanDetails.userLimit || 10,
          storageLimitGB: selectedPlanDetails.storageLimitGB || 50,
          aiCredits: selectedPlanDetails.aiCredits || 2000,
          ocrLimit: selectedPlanDetails.ocrLimit || 1000,
        },
        admin: {
          id: createdData?.admin?.id || Date.now() + 1,
          fullName: payload.adminName,
          email: payload.adminEmail,
          status: "ACTIVE",
        },
        stats: {
          usersCount: 1,
          activeUsersCount: 1,
          docsCount: 0,
          departmentsCount: 1,
          teamsCount: 0,
          storageUsedGB: 0,
          storageUsedMB: 0,
        },
        ...(createdData || {}),
      };

      // Instantly insert at index 0 of the table
      setOrganisations((prev) => [newOrgItem, ...prev.filter((o) => o.id !== newOrgItem.id)]);

      showToast(
        `✅ Organisation "${payload.name}" created successfully! ${
          payload.sendWelcomeEmail ? "Credentials dispatched to " + payload.adminEmail : ""
        }`,
        "success"
      );

      // Reset form with a fresh secure password
      setFormData({
        organisationName: "",
        organisationType: "Company",
        industry: "Technology",
        companySize: "1-10",
        website: "",
        logo: "",
        description: "",
        businessEmail: "",
        phone: "",
        country: "India",
        state: "Maharashtra",
        city: "Mumbai",
        address: "",
        timezone: "Asia/Kolkata (IST)",
        dateFormat: "DD-MM-YYYY",
        currency: "INR",
        adminName: "",
        adminEmail: "",
        adminPhone: "",
        adminUsername: "",
        temporaryPassword: generateSecurePassword(),
        forcePasswordChange: true,
        sendWelcomeEmail: true,
        subscriptionPlan: availablePlans[0]?.planName || "Starter",
        planId: availablePlans[0]?.id || "",
        subscriptionStatus: "ACTIVE",
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        status: "active",
      });

      setActiveTab("all");
      fetchOrganisations();
    } catch (err: any) {
      console.error("Creation error:", err);
      showToast(err.response?.data?.message || err.message || "Failed to create organisation", "error");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Toggle Activate / Suspend
  const handleToggleStatus = async (org: any) => {
    const nextStatus = org.status === "active" ? "suspended" : "active";
    try {
      await axios.patch(`/organisations/${org.id}/status`, { status: nextStatus }).catch(() =>
        axios.post(`/organisations/${org.id}/status`, { status: nextStatus })
      );
      showToast(`Organisation ${org.name} is now ${nextStatus.toUpperCase()}`, "success");
      fetchOrganisations();
      if (selectedOrg?.id === org.id) {
        setSelectedOrg((prev: any) => ({ ...prev, status: nextStatus }));
      }
    } catch (err: any) {
      showToast(`Failed to update status: ${err.message}`, "error");
    }
  };

  // Resend Welcome Email via Brevo
  const handleResendWelcomeEmail = async (orgId: number | string) => {
    try {
      const res = await axios.post(`/organisations/${orgId}/resend-welcome-email`);
      showToast(res.data?.message || "Welcome credentials email dispatched successfully via Brevo!", "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to resend welcome email", "error");
    }
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalOrg) return;
    try {
      await axios.put(`/organisations/${editModalOrg.id}`, {
        name: editModalOrg.name,
        orgType: editModalOrg.orgType,
        industry: editModalOrg.industry,
        companySize: editModalOrg.companySize,
        website: editModalOrg.website,
        email: editModalOrg.email,
        phone: editModalOrg.phone,
        address: editModalOrg.address,
        city: editModalOrg.city,
        state: editModalOrg.state,
        country: editModalOrg.country,
        timezone: editModalOrg.timezone,
        dateFormat: editModalOrg.dateFormat,
        currency: editModalOrg.currency,
        status: editModalOrg.status,
      });
      showToast(`Organisation "${editModalOrg.name}" updated successfully!`, "success");
      setEditModalOrg(null);
      fetchOrganisations();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to update organisation", "error");
    }
  };

  // Handle Delete
  const handleDeleteConfirm = async () => {
    if (!deleteModalOrg) return;
    try {
      await axios.delete(`/organisations/${deleteModalOrg.id}`);
      showToast(`Organisation "${deleteModalOrg.name}" removed successfully`, "info");
      setDeleteModalOrg(null);
      setSelectedOrg(null);
      fetchOrganisations();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to delete organisation", "error");
    }
  };

  // Filtered List
  const filteredOrgs = useMemo(() => {
    return organisations.filter((org) => {
      const matchesSearch =
        !searchTerm ||
        org.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.admin?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.admin?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.industry?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        org.status?.toLowerCase() === statusFilter.toLowerCase();

      const matchesPlan =
        planFilter === "all" ||
        org.plan?.toLowerCase() === planFilter.toLowerCase() ||
        org.subscription?.planName?.toLowerCase() === planFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [organisations, searchTerm, statusFilter, planFilter]);

  // Summary Metrics
  const stats = useMemo(() => {
    const total = organisations.length;
    const active = organisations.filter((o) => o.status === "active").length;
    const suspended = organisations.filter((o) => o.status === "suspended").length;
    const pending = organisations.filter((o) => o.status === "pending").length;
    const totalUsers = organisations.reduce((sum, o) => sum + (o.stats?.usersCount || 0), 0);
    const totalDocs = organisations.reduce((sum, o) => sum + (o.stats?.docsCount || 0), 0);
    return { total, active, suspended, pending, totalUsers, totalDocs };
  }, [organisations]);

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto min-h-screen bg-slate-50 dark:bg-[#080c16] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border transition-all duration-300 ${
            toastMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200"
              : toastMessage.type === "error"
              ? "bg-rose-50 dark:bg-rose-950 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200"
              : "bg-sky-50 dark:bg-sky-950 border-sky-300 dark:border-sky-700 text-sky-900 dark:text-sky-200"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          )}
          <span className="text-sm font-medium">{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-slate-700 dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#274690]/10 dark:bg-[#274690]/25 border border-[#274690]/30 text-[#274690] dark:text-[#5b83e0]">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
                Organisations Management
                <Badge variant="outline" className="border-[#274690]/40 text-[#274690] dark:text-[#5b83e0] bg-[#274690]/10 font-mono text-xs">
                  {stats.total} Total
                </Badge>
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Register, manage, monitor, and provision enterprise tenant organisations and initial administrators.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrganisations}
            className="border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {activeTab !== "create" ? (
            <Button
              onClick={() => setActiveTab("create")}
              className="bg-[#274690] hover:bg-[#1f3561] text-white font-medium shadow-md shadow-[#274690]/20 gap-2"
            >
              <Plus className="w-4 h-4" />
              Register New Organisation
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => setActiveTab("all")}
              className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Back to List
            </Button>
          )}
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <Card className="bg-white dark:bg-[#0f172a] border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Orgs</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-[#0f172a] border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Active Tenants</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.active}</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-[#0f172a] border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Pending Setup</p>
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-[#0f172a] border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">Suspended</p>
            <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">{stats.suspended}</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-[#0f172a] border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-[#274690] dark:text-[#5b83e0] font-medium">Total Users</p>
            <p className="text-xl font-bold text-[#274690] dark:text-[#5b83e0] mt-1">{stats.totalUsers}</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-[#0f172a] border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Documents</p>
            <p className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">{stats.totalDocs}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "all"
              ? "border-[#274690] text-[#274690] dark:text-[#5b83e0]"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Building2 className="w-4 h-4" />
          All Organisations ({filteredOrgs.length})
        </button>

        <button
          onClick={() => setActiveTab("create")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "create"
              ? "border-[#274690] text-[#274690] dark:text-[#5b83e0]"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Plus className="w-4 h-4" />
          5-Section Organisation Wizard
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ALL ORGANISATIONS TABLE                                            */}
      {/* ========================================================================= */}
      {activeTab === "all" && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#0f172a] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, admin, city, industry..."
                className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#274690]"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#0b1120] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e: any) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none"
                >
                  <option value="all" className="bg-white dark:bg-slate-900">All</option>
                  <option value="active" className="bg-white dark:bg-slate-900">Active</option>
                  <option value="pending" className="bg-white dark:bg-slate-900">Pending</option>
                  <option value="suspended" className="bg-white dark:bg-slate-900">Suspended</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#0b1120] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-medium">Plan:</span>
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  className="bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none"
                >
                  <option value="all" className="bg-white dark:bg-slate-900">All Plans</option>
                  <option value="Starter" className="bg-white dark:bg-slate-900">Starter</option>
                  <option value="Business" className="bg-white dark:bg-slate-900">Business</option>
                  <option value="Enterprise" className="bg-white dark:bg-slate-900">Enterprise</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-100 dark:bg-slate-900 text-xs uppercase text-slate-600 dark:text-slate-400 tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Organisation</th>
                    <th className="px-4 py-3.5">Admin Contact</th>
                    <th className="px-4 py-3.5">Plan & Limits</th>
                    <th className="px-4 py-3.5">Usage Stats</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Registered</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                        <div className="flex items-center justify-center gap-3">
                          <RefreshCw className="w-5 h-5 animate-spin text-[#274690]" />
                          <span>Loading organisations from database...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredOrgs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                        <Building2 className="w-10 h-10 mx-auto text-slate-400 mb-3" />
                        <p className="text-base font-semibold text-slate-800 dark:text-slate-200">No organisations found</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {searchTerm ? "Try adjusting your search or filters." : "Click Register New Organisation to get started."}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredOrgs.map((org) => {
                      const isSuspended = org.status?.toLowerCase() === "suspended";
                      const isPending = org.status?.toLowerCase() === "pending";
                      return (
                        <tr key={org.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          {/* Org Column */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-[#274690]/10 dark:bg-[#274690]/25 border border-[#274690]/30 flex items-center justify-center text-[#274690] dark:text-[#5b83e0] font-bold text-sm shrink-0">
                                {org.name?.charAt(0) || "O"}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                  {org.name}
                                  {org.industry && (
                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                      {org.industry}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  <span>
                                    {org.city || "Mumbai"}, {org.country || "India"}
                                  </span>
                                  <span>•</span>
                                  <span>{org.orgType || "Company"}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Admin Column */}
                          <td className="px-4 py-4">
                            <div className="text-xs">
                              <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <UserCheck className="w-3.5 h-3.5 text-[#274690] dark:text-[#5b83e0]" />
                                {org.admin?.fullName || org.admin?.full_name || org.adminName || "Admin User"}
                              </div>
                              <div className="text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-400" />
                                {org.admin?.email || org.email}
                              </div>
                            </div>
                          </td>

                          {/* Plan Column */}
                          <td className="px-4 py-4">
                            <Badge
                              className={`text-xs font-semibold ${
                                org.plan === "Enterprise"
                                  ? "bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800"
                                  : org.plan === "Business"
                                  ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800"
                                  : "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800"
                              }`}
                            >
                              {org.plan || org.subscription?.planName || "Starter"}
                            </Badge>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                              Max: {org.subscription?.userLimit || 10} Users • {org.subscription?.storageLimitGB || 50} GB
                            </div>
                          </td>

                          {/* Stats Column */}
                          <td className="px-4 py-4">
                            <div className="text-xs space-y-0.5">
                              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                <Users className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                                <span>{org.stats?.usersCount ?? 1} users</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                <HardDrive className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                <span>{org.stats?.storageUsedGB ?? "0.00"} GB used</span>
                              </div>
                            </div>
                          </td>

                          {/* Status Column */}
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                isSuspended
                                  ? "bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800/60"
                                  : isPending
                                  ? "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60"
                                  : "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isSuspended ? "bg-rose-500" : isPending ? "bg-amber-500" : "bg-emerald-500"
                                }`}
                              />
                              {org.status?.toUpperCase() || "ACTIVE"}
                            </span>
                          </td>

                          {/* Date Column */}
                          <td className="px-4 py-4 text-xs text-slate-500 dark:text-slate-400">
                            {org.created_at ? new Date(org.created_at).toLocaleDateString() : "Recent"}
                          </td>

                          {/* Actions Column */}
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedOrg(org);
                                  setDetailModalTab("overview");
                                }}
                                className="h-8 px-2.5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4 text-[#274690] dark:text-[#5b83e0] mr-1" />
                                View
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditModalOrg(org)}
                                className="h-8 px-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                                title="Edit Organisation"
                              >
                                <Edit3 className="w-4 h-4" />
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleToggleStatus(org)}
                                className={`h-8 px-2 ${
                                  isSuspended
                                    ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                                    : "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                                }`}
                                title={isSuspended ? "Activate Organisation" : "Suspend Organisation"}
                              >
                                <Power className="w-4 h-4" />
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleResendWelcomeEmail(org.id)}
                                className="h-8 px-2 text-[#274690] dark:text-[#5b83e0] hover:bg-blue-50 dark:hover:bg-blue-950/50"
                                title="Resend Credentials via Brevo"
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: 5-SECTION CREATE ORGANISATION WIZARD                               */}
      {/* ========================================================================= */}
      {activeTab === "create" && (
        <form onSubmit={handleCreateSubmit} className="space-y-6 max-w-4xl mx-auto">
          {/* Top Info Banner */}
          <div className="bg-gradient-to-r from-blue-50 dark:from-[#274690]/20 via-indigo-50 dark:via-indigo-950/30 to-purple-50 dark:to-purple-950/20 border border-blue-200 dark:border-[#274690]/30 p-5 rounded-2xl flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-[#274690]/15 text-[#274690] dark:text-[#5b83e0] border border-[#274690]/30 shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">5-Section Enterprise Provisioning Engine</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                When you create an organisation, DocuCore AI automatically provisions the database tenant, initializes the initial Organisation Administrator with a temporary password, applies subscription limits, and dispatches credentials via Brevo HTTPS REST API.
              </p>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* SECTION 1: ORGANISATION INFORMATION                           */}
          {/* ───────────────────────────────────────────────────────────── */}
          <Card className="bg-white dark:bg-[#0f172a] border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#274690]/15 border border-[#274690]/30 text-[#274690] dark:text-[#5b83e0] text-xs font-bold font-mono">
                  1
                </span>
                <CardTitle className="text-lg text-slate-900 dark:text-white">Organisation Information</CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Primary business identity, corporate structure, industry categorization, and branding.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1.5">
                    Organisation Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.organisationName}
                    onChange={(e) => setFormData({ ...formData, organisationName: e.target.value })}
                    placeholder="e.g. ABC Technologies Pvt. Ltd."
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#274690]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Organisation Type</label>
                  <select
                    value={formData.organisationType}
                    onChange={(e) => setFormData({ ...formData, organisationType: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  >
                    <option value="Company">Company / Corporate</option>
                    <option value="Agency">Agency / Services</option>
                    <option value="Educational">Educational Institute</option>
                    <option value="Healthcare">Healthcare / Hospital</option>
                    <option value="Government">Government / Public Sector</option>
                    <option value="Other">Other Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Industry</label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  >
                    <option value="Technology">Technology & Software</option>
                    <option value="Financial Services">Financial Services & Banking</option>
                    <option value="Healthcare & Biotech">Healthcare & Pharmaceuticals</option>
                    <option value="Manufacturing">Manufacturing & Logistics</option>
                    <option value="Legal & Compliance">Legal & Compliance</option>
                    <option value="Education">Education & EdTech</option>
                    <option value="Real Estate">Real Estate & Construction</option>
                    <option value="Retail & E-commerce">Retail & E-commerce</option>
                    <option value="Consulting">Professional Consulting</option>
                    <option value="Other">Other Industry</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Company Size</label>
                  <select
                    value={formData.companySize}
                    onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  >
                    <option value="1-10">1–10 Employees (Startup)</option>
                    <option value="11-50">11–50 Employees (Small Business)</option>
                    <option value="51-200">51–200 Employees (Mid-market)</option>
                    <option value="201-500">201–500 Employees (Large)</option>
                    <option value="500+">500+ Employees (Enterprise)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Website</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://example.com"
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#274690]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Organisation Logo URL</label>
                  <input
                    type="url"
                    value={formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                    placeholder="https://cdn.example.com/logo.png"
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#274690]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief summary of organisation operations, departments, and purpose..."
                  className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#274690]"
                />
              </div>
            </CardContent>
          </Card>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* SECTION 2: ORGANISATION CONTACT                               */}
          {/* ───────────────────────────────────────────────────────────── */}
          <Card className="bg-white dark:bg-[#0f172a] border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#274690]/15 border border-[#274690]/30 text-[#274690] dark:text-[#5b83e0] text-xs font-bold font-mono">
                  2
                </span>
                <CardTitle className="text-lg text-slate-900 dark:text-white">Organisation Contact</CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Official billing contact, office location, regional timezone, and currency standards.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1.5">
                    Business Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.businessEmail}
                    onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
                    placeholder="contact@company.com"
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#274690]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#274690]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1.5">
                    Country <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="e.g. India"
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">State / Region</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="e.g. Maharashtra"
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Mumbai"
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Address / Street</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. Tower 4, Suite 800"
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1.5">
                    Timezone <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  >
                    <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST, UTC+5:30)</option>
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="America/New_York (EST)">America/New_York (EST, UTC-5)</option>
                    <option value="America/Los_Angeles (PST)">America/Los_Angeles (PST, UTC-8)</option>
                    <option value="Europe/London (GMT)">Europe/London (GMT/BST)</option>
                    <option value="Europe/Paris (CET)">Europe/Paris (CET, UTC+1)</option>
                    <option value="Asia/Dubai (GST)">Asia/Dubai (GST, UTC+4)</option>
                    <option value="Asia/Singapore (SGT)">Asia/Singapore (SGT, UTC+8)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Date Format</label>
                  <select
                    value={formData.dateFormat}
                    onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  >
                    <option value="DD-MM-YYYY">DD-MM-YYYY (e.g. 05-09-2026)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (ISO standard)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (US standard)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  >
                    <option value="INR">INR (₹ - Indian Rupee)</option>
                    <option value="USD">USD ($ - US Dollar)</option>
                    <option value="EUR">EUR (€ - Euro)</option>
                    <option value="GBP">GBP (£ - British Pound)</option>
                    <option value="CAD">CAD ($ - Canadian Dollar)</option>
                    <option value="AUD">AUD ($ - Australian Dollar)</option>
                    <option value="AED">AED (د.إ - UAE Dirham)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* SECTION 3: ORGANISATION ADMIN                                 */}
          {/* ───────────────────────────────────────────────────────────── */}
          <Card className="bg-white dark:bg-[#0f172a] border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#274690]/15 border border-[#274690]/30 text-[#274690] dark:text-[#5b83e0] text-xs font-bold font-mono">
                  3
                </span>
                <CardTitle className="text-lg text-slate-900 dark:text-white">Initial Organisation Admin</CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Super Admin creates the primary tenant administrator account with automated password generation and Brevo email delivery.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1.5">
                    Admin Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.adminName}
                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                    placeholder="e.g. Rajesh Gopinathan"
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#274690]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1.5">
                    Admin Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                    placeholder="admin@company.com"
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#274690]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Admin Phone</label>
                  <input
                    type="tel"
                    value={formData.adminPhone}
                    onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#274690]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Username (Optional)</label>
                  <input
                    type="text"
                    value={formData.adminUsername}
                    onChange={(e) => setFormData({ ...formData, adminUsername: e.target.value })}
                    placeholder="e.g. rajesh_admin"
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#274690]"
                  />
                </div>
              </div>

              {/* Password Generator Box */}
              <div className="bg-slate-100 dark:bg-slate-950 p-4 rounded-xl border border-slate-300 dark:border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-[#274690] dark:text-[#5b83e0]" />
                    Temporary Password
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newPwd = generateSecurePassword();
                      setFormData({ ...formData, temporaryPassword: newPwd });
                      showToast("Generated new secure temporary password", "info");
                    }}
                    className="h-7 text-xs border-[#274690]/40 text-[#274690] dark:text-[#5b83e0] hover:bg-[#274690]/10 gap-1.5"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Generate Random Password
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={formData.temporaryPassword}
                    onChange={(e) => setFormData({ ...formData, temporaryPassword: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2 text-sm font-mono text-[#274690] dark:text-indigo-300 font-bold focus:outline-none"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(formData.temporaryPassword);
                      setCopiedPassword(true);
                      setTimeout(() => setCopiedPassword(false), 2000);
                    }}
                    className="h-9 px-3 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 shrink-0"
                  >
                    {copiedPassword ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>

                {/* Checkbox Controls */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={formData.forcePasswordChange}
                      onChange={(e) => setFormData({ ...formData, forcePasswordChange: e.target.checked })}
                      className="rounded border-slate-400 dark:border-slate-700 text-[#274690] focus:ring-0"
                    />
                    <span>
                      <strong className="text-slate-900 dark:text-white">Force Password Change on First Login</strong> (Recommended for zero-trust compliance)
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={formData.sendWelcomeEmail}
                      onChange={(e) => setFormData({ ...formData, sendWelcomeEmail: e.target.checked })}
                      className="rounded border-slate-400 dark:border-slate-700 text-[#274690] focus:ring-0"
                    />
                    <span className="flex items-center gap-1.5">
                      <strong className="text-slate-900 dark:text-white">Send Welcome Email with Credentials</strong>
                      <Badge className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 text-[10px] py-0 px-1.5">
                        Brevo HTTPS Port 443
                      </Badge>
                    </span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* SECTION 4: SUBSCRIPTION PLAN & AUTOMATIC LIMITS               */}
          {/* ───────────────────────────────────────────────────────────── */}
          <Card className="bg-white dark:bg-[#0f172a] border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#274690]/15 border border-[#274690]/30 text-[#274690] dark:text-[#5b83e0] text-xs font-bold font-mono">
                  4
                </span>
                <CardTitle className="text-lg text-slate-900 dark:text-white">Subscription & Plan Limits</CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Plan selection automatically binds tenant quotas (Users, Storage, AI Credits, OCR Pages) directly from the database.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1.5">
                    Subscription Plan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.subscriptionPlan}
                    onChange={(e) => {
                      const selectedName = e.target.value;
                      const matched = availablePlans.find((p) => p.planName === selectedName || p.name === selectedName);
                      setFormData({
                        ...formData,
                        subscriptionPlan: selectedName,
                        planId: matched?.id || "",
                      });
                    }}
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  >
                    {availablePlans.map((p) => (
                      <option key={p.id} value={p.planName || p.name}>
                        {p.planName || p.name} Plan
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Subscription Status</label>
                  <select
                    value={formData.subscriptionStatus}
                    onChange={(e) => setFormData({ ...formData, subscriptionStatus: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  >
                    <option value="ACTIVE">Active (Paid / Assigned)</option>
                    <option value="TRIAL">Trial Period (30 Days)</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1.5">
                    Start Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Renewal / End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  />
                </div>
              </div>

              {/* Automatic Live Limits Cards */}
              <div className="pt-2">
                <p className="text-xs font-semibold text-[#274690] dark:text-[#5b83e0] uppercase tracking-wider mb-2.5">
                  ⚡ Auto-Populated Plan Quotas (From Database)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl">
                    <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 text-xs font-medium">
                      <Users className="w-3.5 h-3.5" />
                      <span>User Seat Limit</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{selectedPlanDetails.userLimit ?? 10} Seats</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Auto-applied to tenant</p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                      <HardDrive className="w-3.5 h-3.5" />
                      <span>Storage Quota</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{selectedPlanDetails.storageLimitGB ?? 50} GB</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Encrypted AWS S3 bucket</p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl">
                    <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 text-xs font-medium">
                      <Bot className="w-3.5 h-3.5" />
                      <span>AI Request Limit</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                      {(selectedPlanDetails.aiCredits ?? 2000).toLocaleString()} req/mo
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Gemini 1.5 Flash tokens</p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-medium">
                      <FileText className="w-3.5 h-3.5" />
                      <span>OCR Page Limit</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                      {(selectedPlanDetails.ocrLimit ?? 1000).toLocaleString()} pages/mo
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Tesseract & Vision OCR</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* SECTION 5: ORGANISATION STATUS & AUTOMATION                   */}
          {/* ───────────────────────────────────────────────────────────── */}
          <Card className="bg-white dark:bg-[#0f172a] border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#274690]/15 border border-[#274690]/30 text-[#274690] dark:text-[#5b83e0] text-xs font-bold font-mono">
                  5
                </span>
                <CardTitle className="text-lg text-slate-900 dark:text-white">Organisation Status & Audit</CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Initial operational status and automated timestamp tracking.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1.5">
                    Initial Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                  >
                    <option value="active">Active (Immediate Login Enabled)</option>
                    <option value="pending">Pending (Awaiting Verification)</option>
                    <option value="suspended">Suspended (Access Blocked)</option>
                  </select>
                </div>

                <div className="bg-slate-100 dark:bg-slate-950 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-800 dark:text-slate-300 block mb-1">Account Created Date</span>
                  <span className="font-mono text-[#274690] dark:text-indigo-300">Automatic (Now: {new Date().toLocaleDateString()})</span>
                </div>

                <div className="bg-slate-100 dark:bg-slate-950 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-800 dark:text-slate-300 block mb-1">Created By</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">Super Admin (Platform Owner)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveTab("all")}
              className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={formSubmitting}
              className="bg-[#274690] hover:bg-[#1f3561] text-white font-semibold px-8 shadow-md shadow-[#274690]/20 gap-2"
            >
              {formSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Provisioning Organisation & Dispatching Email...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Create Organisation & Provision Admin
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VIEW ORGANISATION DETAILS (CRISP LIGHT/DARK MODE DRAWER)            */}
      {/* ========================================================================= */}
      {selectedOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-750 text-slate-900 dark:text-slate-100 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-[#274690]/15 dark:bg-[#274690]/30 border border-[#274690]/30 flex items-center justify-center text-[#274690] dark:text-[#5b83e0] font-bold text-lg">
                  {selectedOrg.name?.charAt(0) || "O"}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                    {selectedOrg.name}
                    <Badge
                      className={`text-xs ${
                        selectedOrg.status === "active"
                          ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                          : "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800"
                      }`}
                    >
                      {selectedOrg.status?.toUpperCase()}
                    </Badge>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Tenant ID: <span className="font-mono text-[#274690] dark:text-indigo-300">{selectedOrg.id}</span> • {selectedOrg.orgType || "Company"} • {selectedOrg.industry || "Technology"}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedOrg(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-2">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-100/50 dark:bg-slate-950/40">
              <button
                onClick={() => setDetailModalTab("overview")}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
                  detailModalTab === "overview"
                    ? "border-[#274690] text-[#274690] dark:text-[#5b83e0]"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Overview & Contact
              </button>
              <button
                onClick={() => setDetailModalTab("limits")}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
                  detailModalTab === "limits"
                    ? "border-[#274690] text-[#274690] dark:text-[#5b83e0]"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Subscription & Quotas
              </button>
              <button
                onClick={() => setDetailModalTab("users")}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
                  detailModalTab === "users"
                    ? "border-[#274690] text-[#274690] dark:text-[#5b83e0]"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Admins & Users
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm bg-white dark:bg-[#0f172a]">
              {detailModalTab === "overview" && (
                <div className="space-y-6">
                  {/* General Info Grid */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">
                      1. Organisation Details
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                      <div>
                        <span className="text-slate-500 block">Legal / Business Name</span>
                        <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block">{selectedOrg.name}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Organisation Type</span>
                        <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block">{selectedOrg.orgType || "Company"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Industry</span>
                        <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block">{selectedOrg.industry || "Technology"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Company Size</span>
                        <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block">{selectedOrg.companySize || "1-10"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Website</span>
                        {selectedOrg.website ? (
                          <a href={selectedOrg.website} target="_blank" rel="noreferrer" className="text-[#274690] dark:text-[#5b83e0] hover:underline flex items-center gap-1 mt-0.5">
                            {selectedOrg.website} <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-400 mt-0.5 block">N/A</span>
                        )}
                      </div>
                      <div>
                        <span className="text-slate-500 block">Registered At</span>
                        <span className="text-slate-700 dark:text-slate-300 mt-0.5 block">
                          {selectedOrg.created_at ? new Date(selectedOrg.created_at).toLocaleString() : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info Grid */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">
                      2. Official Contact & Regional Settings
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                      <div>
                        <span className="text-slate-500 block">Business Email</span>
                        <span className="font-semibold text-[#274690] dark:text-indigo-300 mt-0.5 block">{selectedOrg.email}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Phone</span>
                        <span className="text-slate-700 dark:text-slate-300 mt-0.5 block">{selectedOrg.phone || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Location</span>
                        <span className="text-slate-700 dark:text-slate-300 mt-0.5 block">
                          {selectedOrg.city || "Mumbai"}, {selectedOrg.country || "India"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Address</span>
                        <span className="text-slate-700 dark:text-slate-300 mt-0.5 block">{selectedOrg.address || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Timezone</span>
                        <span className="text-slate-700 dark:text-slate-300 mt-0.5 block">{selectedOrg.timezone || "Asia/Kolkata (IST)"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Currency / Date Format</span>
                        <span className="text-slate-700 dark:text-slate-300 mt-0.5 block">
                          {selectedOrg.currency || "INR"} • {selectedOrg.dateFormat || "DD-MM-YYYY"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {detailModalTab === "limits" && (
                <div className="space-y-6">
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500">Active Subscription Plan</p>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
                        {selectedOrg.plan || selectedOrg.subscription?.planName || "Starter"} Plan
                        <Badge className="bg-[#274690]/15 text-[#274690] dark:text-[#5b83e0] border-[#274690]/30 text-[11px]">
                          {selectedOrg.subscription?.status || "ACTIVE"}
                        </Badge>
                      </h3>
                    </div>
                    <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                      <span>Expires / Renews: </span>
                      <strong className="text-slate-900 dark:text-white">
                        {selectedOrg.subscription?.expiryDate
                          ? new Date(selectedOrg.subscription.expiryDate).toLocaleDateString()
                          : "30 days from registration"}
                      </strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">User Seat Quota</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                        {selectedOrg.stats?.usersCount || 1} / {selectedOrg.subscription?.userLimit || 10}
                      </p>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div
                          className="bg-sky-500 h-full"
                          style={{
                            width: `${Math.min(
                              100,
                              ((selectedOrg.stats?.usersCount || 1) / (selectedOrg.subscription?.userLimit || 10)) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Storage Quota</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                        {selectedOrg.stats?.storageUsedGB || "0.00"} / {selectedOrg.subscription?.storageLimitGB || 50} GB
                      </p>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full"
                          style={{
                            width: `${Math.min(
                              100,
                              ((selectedOrg.stats?.storageUsedGB || 0.1) / (selectedOrg.subscription?.storageLimitGB || 50)) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">AI Token Requests</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                        {(selectedOrg.subscription?.aiCredits || 2000).toLocaleString()} req
                      </p>
                      <span className="text-[10px] text-[#274690] dark:text-[#5b83e0] mt-1 block">Monthly quota</span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">OCR Page Limit</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                        {(selectedOrg.subscription?.ocrLimit || 1000).toLocaleString()} pgs
                      </p>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 block">Monthly quota</span>
                    </div>
                  </div>
                </div>
              )}

              {detailModalTab === "users" && (
                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#274690]/15 border border-[#274690]/30 flex items-center justify-center text-[#274690] dark:text-[#5b83e0] font-bold">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">
                          {selectedOrg.admin?.fullName || selectedOrg.admin?.full_name || selectedOrg.adminName || "Tenant Administrator"}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{selectedOrg.admin?.email || selectedOrg.email}</p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 text-xs">
                      ORGANISATION_ADMIN
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Button
                      size="sm"
                      onClick={() => handleResendWelcomeEmail(selectedOrg.id)}
                      className="bg-[#274690] hover:bg-[#1f3561] text-white gap-2 text-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Resend Login Credentials via Brevo
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setDeleteModalOrg(selectedOrg);
                }}
                className="gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Delete Organisation
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleStatus(selectedOrg)}
                  className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                >
                  {selectedOrg.status === "active" ? "Suspend Organisation" : "Activate Organisation"}
                </Button>
                <Button
                  size="sm"
                  onClick={() => setSelectedOrg(null)}
                  className="bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT ORGANISATION (CRISP LIGHT/DARK)                                */}
      {/* ========================================================================= */}
      {editModalOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 animate-in fade-in duration-150">
          <form
            onSubmit={handleEditSubmit}
            className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#274690] dark:text-[#5b83e0]" />
                Edit Organisation: {editModalOrg.name}
              </h3>
              <button type="button" onClick={() => setEditModalOrg(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Organisation Name</label>
                <input
                  type="text"
                  required
                  value={editModalOrg.name || ""}
                  onChange={(e) => setEditModalOrg({ ...editModalOrg, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Business Email</label>
                <input
                  type="email"
                  required
                  value={editModalOrg.email || ""}
                  onChange={(e) => setEditModalOrg({ ...editModalOrg, email: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Phone Number</label>
                <input
                  type="text"
                  value={editModalOrg.phone || ""}
                  onChange={(e) => setEditModalOrg({ ...editModalOrg, phone: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Status</label>
                <select
                  value={editModalOrg.status || "active"}
                  onChange={(e) => setEditModalOrg({ ...editModalOrg, status: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 mb-1 block">City</label>
                <input
                  type="text"
                  value={editModalOrg.city || ""}
                  onChange={(e) => setEditModalOrg({ ...editModalOrg, city: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Country</label>
                <input
                  type="text"
                  value={editModalOrg.country || ""}
                  onChange={(e) => setEditModalOrg({ ...editModalOrg, country: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#274690]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditModalOrg(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-[#274690] hover:bg-[#1f3561] text-white">
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DELETE CONFIRMATION                                                */}
      {/* ========================================================================= */}
      {deleteModalOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-3 bg-rose-100 dark:bg-rose-500/10 rounded-full border border-rose-300 dark:border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Organisation?</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{deleteModalOrg.name}</strong>? This action will purge tenant resources, users, and documents.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteModalOrg(null)}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDeleteConfirm}>
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
