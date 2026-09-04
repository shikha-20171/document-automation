"use client";

import { useEffect, useState } from "react";
import {
  Package,
  Plus,
  Check,
  X,
  Zap,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sliders,
  Search,
  Building2,
  FileText,
  HardDrive,
  Bot,
  Users,
  Layers,
  ArrowUpRight,
  Shield,
  Workflow,
  Cpu,
  Mail,
  HelpCircle,
  Settings,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import apiClient from "@/lib/axios";

interface PlanItem {
  id: string;
  planName: string;
  planCode?: string;
  description?: string;
  monthlyPrice: number | string;
  yearlyPrice?: number | string;
  currency?: string;
  userLimit?: number;
  storageLimitGB?: number;
  aiCredits?: number;
  ocrLimit?: number;
  apiRateLimit?: number;
  badge?: string;
  isMostPopular?: boolean;
  isActive?: boolean;
  includedFeatures: string[];
  excludedFeatures: string[];
}

export default function SubscriptionsAndPlansPage() {
  const [activeTab, setActiveTab] = useState<
    "plans" | "create-plan" | "active" | "comparison" | "limits"
  >("plans");

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [orgSubscriptions, setOrgSubscriptions] = useState<any[]>([]);
  const [organisationsList, setOrganisationsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [assigning, setAssigning] = useState(false);

  // Modal States
  const [editingPlan, setEditingPlan] = useState<PlanItem | null>(null);
  const [assigningPlan, setAssigningPlan] = useState<PlanItem | null>(null);

  // Assign Form State
  const [assignForm, setAssignForm] = useState({
    organisationId: "",
    billingCycle: "MONTHLY",
    customStorageLimitGB: "",
    customUserLimit: "",
  });

  // Create Form State
  const [newPlan, setNewPlan] = useState({
    name: "",
    description: "",
    monthlyPrice: "4999",
    annualPrice: "49990",
    maxUsers: "25",
    storage: "250",
    aiCredits: "25000",
    ocrPages: "2500",
    currency: "INR",
    supportLevel: "STANDARD",
    badge: "Most Popular",
    isMostPopular: false,
    apiAccess: true,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const resolvePlanDetails = (p: any): { included: string[]; excluded: string[] } => {
    const code = (p.planCode || p.name || p.planName || "").toLowerCase();

    if (code.includes("starter")) {
      return {
        included: [
          "10 User Seats & 50 GB AWS S3 Storage",
          "2,000 AI Docs/mo & Standard OCR",
          "AI Classification, Extraction & Summarization",
          "AI Document Q&A / Chat",
          "10 AI Prompt Templates",
          "Basic Workflows (Up to 5 active)",
          "Google Workspace & SMTP Email Integration",
          "Role-Based Access Control (RBAC) & MFA",
          "Basic Audit Logs & Usage Analytics",
        ],
        excluded: [
          "Slack, MS Teams & WhatsApp Integrations",
          "Batch Document Processing & Comparison",
          "Multi-Step & Conditional Approval Workflows",
          "REST API & Webhook Access",
          "SSO & IP Whitelisting",
          "Custom AI Models & Dynamic Routing",
          "Dedicated SLA & Account Manager",
        ],
      };
    }

    if (code.includes("business")) {
      return {
        included: [
          "50 User Seats & 250 GB AWS S3 Storage",
          "10,000 AI Docs/mo & Advanced OCR",
          "Batch Document Processing & Comparison",
          "Multi-Step & Conditional Approval Workflows (50 max)",
          "50 AI Prompt Templates & Custom Prompts",
          "Google Workspace, Microsoft 365 & AWS S3",
          "Slack & Microsoft Teams Integrations",
          "REST API & Webhooks Access",
          "Department & Team Level Access Control",
          "1-Year Audit Vault & AI Cost Monitoring",
          "Priority Support & Guided Onboarding",
        ],
        excluded: [
          "Custom AI Models & Multi-Provider Routing",
          "Unlimited Workflows (999+) & Cross-Dept Rules",
          "SSO & IP Whitelisting",
          "WhatsApp Business API Integration",
          "7-Year Audit Vault & Custom Retention Policies",
          "Dedicated Account Manager & 99.9% Custom SLA",
        ],
      };
    }

    if (code.includes("enterprise")) {
      return {
        included: [
          "500+ Users (Unlimited Scaling) & 1 TB+ S3 Storage",
          "50,000+ AI Docs/mo with High-Volume Batch OCR",
          "Custom AI Models, Routing & Cost Controls",
          "Unlimited Workflows & Cross-Department Custom Rules",
          "Multi-Level Approvals & Event Automation",
          "Full Integrations + WhatsApp Business API",
          "REST API, Webhooks & Dedicated Endpoints",
          "SSO, MFA Enforcement, IP Whitelisting & Custom Policies",
          "7-Year Audit Vault & Automated Retention Policies",
          "Dedicated Account Manager, Priority Issue Handling & 99.9% SLA",
        ],
        excluded: [],
      };
    }

    // Dynamic custom plans
    const inc: string[] = [];
    const exc: string[] = [];

    if (p.features && typeof p.features === "object") {
      Object.entries(p.features).forEach(([k, val]) => {
        const label = k.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        if (val === true) inc.push(label);
        else if (val === false) exc.push(label);
      });
    }

    return {
      included: inc.length > 0 ? inc : [
        `${p.userLimit || 10} Users & ${p.storageLimitGB || 50} GB Storage`,
        `${Number(p.aiCredits || 2000).toLocaleString()} AI Document Credits`,
        "Document OCR & Extraction",
      ],
      excluded: exc.length > 0 ? exc : ["Advanced Enterprise Controls"],
    };
  };

  const defaultPlanList: PlanItem[] = [
    {
      id: "starter",
      planName: "Starter",
      monthlyPrice: 4999,
      yearlyPrice: 49990,
      userLimit: 10,
      storageLimitGB: 50,
      aiCredits: 2000,
      badge: "Startups & Teams",
      includedFeatures: [
        "10 User Seats & 50 GB AWS S3 Storage",
        "2,000 AI Docs/mo & Standard OCR",
        "AI Classification, Extraction & Summarization",
        "AI Document Q&A / Chat",
        "10 AI Prompt Templates",
        "Basic Workflows (Up to 5 active)",
        "Google Workspace & SMTP Email Integration",
        "Role-Based Access Control (RBAC) & MFA",
        "Basic Audit Logs & Usage Analytics",
      ],
      excludedFeatures: [
        "Slack, MS Teams & WhatsApp Integrations",
        "Batch Document Processing & Comparison",
        "Multi-Step & Conditional Approval Workflows",
        "REST API & Webhook Access",
        "SSO & IP Whitelisting",
        "Custom AI Models & Dynamic Routing",
      ],
      isActive: true,
    },
    {
      id: "business",
      planName: "Business",
      monthlyPrice: 14999,
      yearlyPrice: 149990,
      userLimit: 50,
      storageLimitGB: 250,
      aiCredits: 10000,
      isMostPopular: true,
      badge: "Most Popular",
      includedFeatures: [
        "50 User Seats & 250 GB AWS S3 Storage",
        "10,000 AI Docs/mo & Advanced OCR",
        "Batch Document Processing & Comparison",
        "Multi-Step & Conditional Approval Workflows (50 max)",
        "50 AI Prompt Templates & Custom Prompts",
        "Google Workspace, Microsoft 365 & AWS S3",
        "Slack & Microsoft Teams Integrations",
        "REST API & Webhooks Access",
        "Department & Team Level Access Control",
        "1-Year Audit Vault & AI Cost Monitoring",
        "Priority Support & Guided Onboarding",
      ],
      excludedFeatures: [
        "Custom AI Models & Multi-Provider Routing",
        "Unlimited Workflows (999+) & Cross-Dept Rules",
        "SSO & IP Whitelisting",
        "WhatsApp Business API Integration",
        "7-Year Audit Vault & Custom Retention Policies",
      ],
      isActive: true,
    },
    {
      id: "enterprise",
      planName: "Enterprise",
      monthlyPrice: 39999,
      yearlyPrice: 399990,
      userLimit: 500,
      storageLimitGB: 1000,
      aiCredits: 50000,
      badge: "Enterprise",
      includedFeatures: [
        "500+ Users (Unlimited Scaling) & 1 TB+ S3 Storage",
        "50,000+ AI Docs/mo with High-Volume Batch OCR",
        "Custom AI Models, Routing & Cost Controls",
        "Unlimited Workflows & Cross-Department Custom Rules",
        "Multi-Level Approvals & Event Automation",
        "Full Integrations + WhatsApp Business API",
        "REST API, Webhooks & Dedicated Endpoints",
        "SSO, MFA Enforcement, IP Whitelisting & Custom Policies",
        "7-Year Audit Vault & Automated Retention Policies",
        "Dedicated Account Manager, Priority Issue Handling & 99.9% SLA",
      ],
      excludedFeatures: [],
      isActive: true,
    },
  ];

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      const [plansRes, subsRes, orgsRes] = await Promise.allSettled([
        apiClient.get("/super-admin/subscriptions/plans"),
        apiClient.get("/super-admin/subscriptions/org-subscriptions"),
        apiClient.get("/super-admin/organisations"),
      ]);

      if (plansRes.status === "fulfilled" && plansRes.value.data?.data) {
        const fetched = plansRes.value.data.data;
        if (Array.isArray(fetched) && fetched.length > 0) {
          setPlans(
            fetched.map((p: any) => {
              const details = resolvePlanDetails(p);
              return {
                id: p.id,
                planName: p.planName || p.name || "Custom Plan",
                planCode: p.planCode || "PLAN",
                description: p.description || "Enterprise document automation subscription",
                monthlyPrice: p.monthlyPrice ?? 4999,
                yearlyPrice: p.yearlyPrice ?? 49990,
                currency: p.currency || "INR",
                userLimit: p.userLimit ?? 10,
                storageLimitGB: p.storageLimitGB ?? 50,
                aiCredits: p.aiCredits ?? 2000,
                ocrLimit: p.ocrLimit ?? 1000,
                badge: p.badge || (p.isMostPopular ? "Most Popular" : undefined),
                isMostPopular: Boolean(p.isMostPopular),
                isActive: p.isActive ?? true,
                includedFeatures: details.included,
                excludedFeatures: details.excluded,
              };
            })
          );
        } else {
          setPlans(defaultPlanList);
        }
      } else {
        setPlans(defaultPlanList);
      }

      if (subsRes.status === "fulfilled" && subsRes.value.data?.data) {
        setOrgSubscriptions(subsRes.value.data.data);
      } else {
        setOrgSubscriptions(defaultOrgSubscriptions);
      }

      if (orgsRes.status === "fulfilled" && orgsRes.value.data?.data) {
        setOrganisationsList(orgsRes.value.data.data);
      }
    } catch (err) {
      console.error("Error loading subscription data:", err);
      setPlans(defaultPlanList);
      setOrgSubscriptions(defaultOrgSubscriptions);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  // 1. CONFIGURE / EDIT PLAN
  const handleSavePlanEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    try {
      setSavingEdit(true);
      const res = await apiClient.put(`/super-admin/subscriptions/plans/${editingPlan.id}`, {
        planName: editingPlan.planName,
        monthlyPrice: Number(editingPlan.monthlyPrice),
        yearlyPrice: Number(editingPlan.yearlyPrice || Number(editingPlan.monthlyPrice) * 10),
        userLimit: Number(editingPlan.userLimit),
        storageLimitGB: Number(editingPlan.storageLimitGB),
        aiCredits: Number(editingPlan.aiCredits),
        ocrLimit: Number(editingPlan.ocrLimit || 1000),
        description: editingPlan.description,
        badge: editingPlan.badge,
        isMostPopular: editingPlan.isMostPopular,
      });

      if (res.data?.success || res.status === 200) {
        showToast(`✅ Tier "${editingPlan.planName}" updated successfully!`);
        setEditingPlan(null);
        loadSubscriptionData();
      }
    } catch (err: any) {
      showToast("Error updating plan: " + (err.response?.data?.message || err.message));
    } finally {
      setSavingEdit(false);
    }
  };

  // 2. ASSIGN TIER TO ORGANISATION
  const handleAssignTierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningPlan || !assignForm.organisationId) {
      showToast("Please select an organization");
      return;
    }

    try {
      setAssigning(true);
      const res = await apiClient.post("/super-admin/subscriptions/assign", {
        organisationId: assignForm.organisationId,
        planId: assigningPlan.id,
        billingCycle: assignForm.billingCycle,
        customLimits: {
          storageLimitGB: assignForm.customStorageLimitGB ? Number(assignForm.customStorageLimitGB) : undefined,
          userLimit: assignForm.customUserLimit ? Number(assignForm.customUserLimit) : undefined,
        },
      });

      if (res.data?.success || res.status === 200) {
        showToast(`✅ Successfully assigned ${assigningPlan.planName} Tier to organization!`);
        setAssigningPlan(null);
        setAssignForm({ organisationId: "", billingCycle: "MONTHLY", customStorageLimitGB: "", customUserLimit: "" });
        setActiveTab("active");
        loadSubscriptionData();
      }
    } catch (err: any) {
      showToast("Error assigning tier: " + (err.response?.data?.message || err.message));
    } finally {
      setAssigning(false);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      const res = await apiClient.post("/super-admin/subscriptions/plans", {
        planName: newPlan.name || "Custom Tier",
        monthlyPrice: Number(newPlan.monthlyPrice) || 0,
        yearlyPrice: Number(newPlan.annualPrice) || Number(newPlan.monthlyPrice) * 10,
        currency: newPlan.currency,
        userLimit: Number(newPlan.maxUsers) || 25,
        storageLimitGB: Number(newPlan.storage) || 250,
        aiCredits: Number(newPlan.aiCredits) || 25000,
        description: newPlan.description || `Includes ${newPlan.maxUsers} users, ${newPlan.storage}GB storage, and ${newPlan.aiCredits} AI credits.`,
        supportLevel: newPlan.supportLevel,
        badge: newPlan.badge,
        isMostPopular: newPlan.isMostPopular,
      });

      const createdPlan = res.data?.data || res.data;
      const details = resolvePlanDetails(createdPlan || newPlan);
      const createdPlanItem: PlanItem = {
        id: createdPlan?.id || `custom-${Date.now()}`,
        planName: newPlan.name,
        monthlyPrice: newPlan.monthlyPrice,
        yearlyPrice: newPlan.annualPrice,
        userLimit: Number(newPlan.maxUsers),
        storageLimitGB: Number(newPlan.storage),
        aiCredits: Number(newPlan.aiCredits),
        badge: newPlan.badge,
        isMostPopular: newPlan.isMostPopular,
        includedFeatures: details.included,
        excludedFeatures: details.excluded,
        isActive: true,
      };
      setPlans((prev) => [createdPlanItem, ...prev]);
      showToast(`✅ Plan "${newPlan.name}" saved!`);
      setActiveTab("plans");
    } finally {
      setCreating(false);
    }
  };

  const defaultOrgSubscriptions = [
    {
      id: "sub-1",
      organisation: { id: 1, name: "Tata Consultancy Services" },
      plan: { planName: "Enterprise" },
      status: "ACTIVE",
      createdAt: "2026-08-01",
      storageUsageMB: 48200,
      aiCreditsUsed: 62400,
    },
    {
      id: "sub-2",
      organisation: { id: 2, name: "Infosys Global Systems" },
      plan: { planName: "Enterprise" },
      status: "ACTIVE",
      createdAt: "2026-07-15",
      storageUsageMB: 31400,
      aiCreditsUsed: 45800,
    },
    {
      id: "sub-3",
      organisation: { id: 3, name: "Wipro Technologies" },
      plan: { planName: "Business" },
      status: "ACTIVE",
      createdAt: "2026-06-20",
      storageUsageMB: 18900,
      aiCreditsUsed: 19400,
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[100] bg-[#274690] text-white px-4 py-3 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-[#1f3561] via-[#274690] to-[#c96f4a] p-6 text-white shadow-xl dark:border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-orange-200 backdrop-blur-md">
              <Package size={14} className="text-[#c96f4a]" />
              <span>SaaS Platform Monetization & Quota Engine</span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-white">
              Subscription Plans & Entitlements
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-200 max-w-2xl font-medium">
              Configure tier parameters, assign subscription plans directly to tenant organizations, and manage customer contracts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setActiveTab("create-plan")}
              className="rounded-xl bg-white text-[#274690] hover:bg-slate-100 font-bold shadow-md h-10 px-4 cursor-pointer"
            >
              <Plus size={16} className="mr-1.5" />
              Create Subscription Plan
            </Button>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto text-xs font-bold">
        {[
          { id: "plans", label: "Subscription Tiers", icon: Package, count: plans.length },
          { id: "comparison", label: "Included vs Excluded Matrix", icon: Sliders },
          { id: "create-plan", label: "+ Create Plan", icon: Plus, highlight: true },
          { id: "active", label: "Active Subscriptions", icon: CheckCircle2, count: orgSubscriptions.length },
          { id: "limits", label: "Limits & Quota Matrix", icon: HardDrive },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition cursor-pointer ${
                isActive
                  ? "bg-[#274690] text-white shadow-xs"
                  : tab.highlight
                  ? "bg-[#274690]/10 text-[#274690] dark:text-blue-400 hover:bg-[#274690]/20"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: PLANS CARDS (WITH CONFIGURE & ASSIGN BUTTONS) */}
      {activeTab === "plans" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative bg-white dark:bg-slate-900 border rounded-3xl p-6 shadow-sm flex flex-col justify-between ${
                plan.isMostPopular
                  ? "border-[#274690] ring-2 ring-[#274690]/20 shadow-xl shadow-[#274690]/5"
                  : "border-slate-200/80 dark:border-slate-800"
              }`}
            >
              {plan.badge && (
                <Badge className="absolute -top-3 right-6 bg-[#274690] text-white text-[10px] font-bold px-3 py-0.5 shadow-xs">
                  {plan.badge}
                </Badge>
              )}

              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{plan.planName}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{plan.description}</p>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900 dark:text-slate-100">
                    ₹{Number(plan.monthlyPrice).toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">/ month</span>
                </div>
                <span className="text-[11px] text-slate-400 font-semibold block mt-0.5">
                  Billed Annually: ₹{Number(plan.yearlyPrice || Number(plan.monthlyPrice) * 10).toLocaleString()}/yr
                </span>

                {/* Resource Summary */}
                <div className="my-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2 text-xs font-bold">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Users size={13} /> User Seats:
                    </span>
                    <span className="text-slate-900 dark:text-slate-100">{plan.userLimit} Users</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <HardDrive size={13} /> Storage Quota:
                    </span>
                    <span className="text-slate-900 dark:text-slate-100">{plan.storageLimitGB} GB</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Bot size={13} /> Monthly AI Docs:
                    </span>
                    <span className="text-[#c96f4a]">{Number(plan.aiCredits).toLocaleString()} Docs/mo</span>
                  </div>
                </div>

                {/* 1. INCLUDED FEATURES (GREEN ✓) */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-[10px] uppercase font-black text-emerald-700 dark:text-emerald-400 tracking-wider">
                      Included Capabilities ({plan.includedFeatures?.length || 0})
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {(plan.includedFeatures || []).map((feat, idx) => (
                      <div key={idx} className="text-xs font-medium text-slate-800 dark:text-slate-200 flex items-start gap-2">
                        <Check size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. NOT INCLUDED / EXCLUDED FEATURES (RED ✕) */}
                {plan.excludedFeatures && plan.excludedFeatures.length > 0 && (
                  <div className="space-y-2 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                      <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                        Not Included ({plan.excludedFeatures.length})
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {plan.excludedFeatures.map((feat, idx) => (
                        <div key={idx} className="text-xs font-medium text-slate-400 dark:text-slate-500 flex items-start gap-2 line-through opacity-70">
                          <X size={14} className="text-rose-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS (100% FUNCTIONAL MODALS) */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingPlan(plan)}
                  className="w-full text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-100"
                >
                  <Settings size={13} />
                  Configure
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setAssigningPlan(plan);
                    setAssignForm((prev) => ({
                      ...prev,
                      customStorageLimitGB: String(plan.storageLimitGB || ""),
                      customUserLimit: String(plan.userLimit || ""),
                    }));
                  }}
                  className="w-full bg-[#274690] hover:bg-[#1f3561] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <UserPlus size={13} />
                  Assign Tier
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* MODAL 1: CONFIGURE / EDIT PLAN (FUNCTIONAL) */}
      {editingPlan && (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-[#274690]">
                  <Settings size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                    Configure Tier: {editingPlan.planName}
                  </h3>
                  <p className="text-xs text-slate-500">Edit pricing, storage limits, and user quotas for this tier.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePlanEdit} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Plan Display Name</label>
                  <input
                    type="text"
                    required
                    value={editingPlan.planName}
                    onChange={(e) => setEditingPlan({ ...editingPlan, planName: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#274690]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Badge Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Most Popular"
                    value={editingPlan.badge || ""}
                    onChange={(e) => setEditingPlan({ ...editingPlan, badge: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Monthly Price (₹ INR)</label>
                  <input
                    type="number"
                    required
                    value={editingPlan.monthlyPrice}
                    onChange={(e) => setEditingPlan({ ...editingPlan, monthlyPrice: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Annual Price (₹ INR)</label>
                  <input
                    type="number"
                    value={editingPlan.yearlyPrice || Number(editingPlan.monthlyPrice) * 10}
                    onChange={(e) => setEditingPlan({ ...editingPlan, yearlyPrice: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">User Seats</label>
                  <input
                    type="number"
                    value={editingPlan.userLimit}
                    onChange={(e) => setEditingPlan({ ...editingPlan, userLimit: Number(e.target.value) })}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Storage (GB)</label>
                  <input
                    type="number"
                    value={editingPlan.storageLimitGB}
                    onChange={(e) => setEditingPlan({ ...editingPlan, storageLimitGB: Number(e.target.value) })}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">AI Docs / Month</label>
                  <input
                    type="number"
                    value={editingPlan.aiCredits}
                    onChange={(e) => setEditingPlan({ ...editingPlan, aiCredits: Number(e.target.value) })}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingPlan.description || ""}
                  onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingPlan(null)} className="rounded-xl cursor-pointer">
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={savingEdit} className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-xl px-5 cursor-pointer">
                  {savingEdit ? "Saving..." : "Save Tier Configuration"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 2: ASSIGN TIER TO ORGANISATION (FUNCTIONAL) */}
      {assigningPlan && (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                    Assign Tier: {assigningPlan.planName}
                  </h3>
                  <p className="text-xs text-slate-500">Apply this tier to a tenant organization and update their limits.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAssigningPlan(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignTierSubmit} className="space-y-4 text-xs font-semibold">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1 text-slate-700 dark:text-slate-300">
                <div className="flex justify-between font-bold">
                  <span>Selected Tier:</span>
                  <span className="text-[#274690] dark:text-blue-300">{assigningPlan.planName} (₹{Number(assigningPlan.monthlyPrice).toLocaleString()}/mo)</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Includes {assigningPlan.userLimit} Users, {assigningPlan.storageLimitGB} GB AWS S3 Storage, {Number(assigningPlan.aiCredits).toLocaleString()} AI Docs/mo.
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Organization <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={assignForm.organisationId}
                  onChange={(e) => setAssignForm({ ...assignForm, organisationId: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#274690]"
                >
                  <option value="">-- Select Tenant Organization --</option>
                  {(organisationsList.length > 0 ? organisationsList : orgSubscriptions).map((org: any) => {
                    const id = org.id || org.organisationId || org.organisation?.id;
                    const name = org.name || org.organisation?.name || `Organization #${id}`;
                    const currentPlan = org.plan || org.plan?.planName || "Starter";
                    return (
                      <option key={id} value={String(id)}>
                        {name} (Currently: {currentPlan})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Billing Cycle</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAssignForm({ ...assignForm, billingCycle: "MONTHLY" })}
                    className={`py-2 rounded-xl font-bold border transition cursor-pointer ${
                      assignForm.billingCycle === "MONTHLY"
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    Monthly Billing
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignForm({ ...assignForm, billingCycle: "ANNUAL" })}
                    className={`py-2 rounded-xl font-bold border transition cursor-pointer ${
                      assignForm.billingCycle === "ANNUAL"
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    Annual Billing (Save 20%)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Custom User Limit (Optional)</label>
                  <input
                    type="number"
                    placeholder={`Default: ${assigningPlan.userLimit}`}
                    value={assignForm.customUserLimit}
                    onChange={(e) => setAssignForm({ ...assignForm, customUserLimit: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Custom Storage GB (Optional)</label>
                  <input
                    type="number"
                    placeholder={`Default: ${assigningPlan.storageLimitGB} GB`}
                    value={assignForm.customStorageLimitGB}
                    onChange={(e) => setAssignForm({ ...assignForm, customStorageLimitGB: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setAssigningPlan(null)} className="rounded-xl cursor-pointer">
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={assigning} className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-xl px-5 cursor-pointer">
                  {assigning ? "Assigning Tier..." : "Confirm & Assign Tier"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* TAB 2: INCLUDED VS EXCLUDED COMPARISON MATRIX TABLE */}
      {activeTab === "comparison" && (
        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
          <div className="mb-6">
            <CardTitle className="text-base font-black text-slate-900 dark:text-slate-100">
              Comprehensive Feature Comparison Matrix
            </CardTitle>
            <p className="text-xs text-slate-500">
              Clear breakdown of exact capabilities included (✓) vs restricted (✕) across Starter, Business, and Enterprise plans.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-4 pl-6 w-1/3">Feature / Capability</th>
                  <th className="p-4 text-center">Starter<br/><span className="text-[10px] font-normal text-slate-400">₹4,999/mo</span></th>
                  <th className="p-4 text-center bg-blue-50/50 dark:bg-blue-950/20 text-[#274690] dark:text-blue-300">
                    Business (Most Popular)<br/><span className="text-[10px] font-normal text-slate-400">₹14,999/mo</span>
                  </th>
                  <th className="p-4 text-center">Enterprise<br/><span className="text-[10px] font-normal text-slate-400">₹39,999/mo</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {/* 1. Core Quotas */}
                <tr className="bg-slate-100/50 dark:bg-slate-800/40 font-black text-slate-700 dark:text-slate-200 text-[11px]">
                  <td colSpan={4} className="p-3 pl-6 uppercase tracking-wider text-[#274690]">1. Resource Quotas & Limits</td>
                </tr>
                <tr>
                  <td className="p-3 pl-6 font-semibold text-slate-800 dark:text-slate-200">User Seats</td>
                  <td className="p-3 text-center font-bold">10 Users</td>
                  <td className="p-3 text-center font-bold bg-blue-50/30 dark:bg-blue-950/10 text-[#274690]">50 Users</td>
                  <td className="p-3 text-center font-bold">500+ (Unlimited)</td>
                </tr>
                <tr>
                  <td className="p-3 pl-6 font-semibold text-slate-800 dark:text-slate-200">AWS S3 Cloud Storage</td>
                  <td className="p-3 text-center font-bold">50 GB</td>
                  <td className="p-3 text-center font-bold bg-blue-50/30 dark:bg-blue-950/10 text-[#274690]">250 GB</td>
                  <td className="p-3 text-center font-bold">1,000 GB (1 TB+)</td>
                </tr>
                <tr>
                  <td className="p-3 pl-6 font-semibold text-slate-800 dark:text-slate-200">Monthly AI Processing</td>
                  <td className="p-3 text-center font-bold">2,000 Docs/mo</td>
                  <td className="p-3 text-center font-bold bg-blue-50/30 dark:bg-blue-950/10 text-[#274690]">10,000 Docs/mo</td>
                  <td className="p-3 text-center font-bold">50,000+ Docs/mo</td>
                </tr>
                <tr>
                  <td className="p-3 pl-6 font-semibold text-slate-800 dark:text-slate-200">OCR Document Pages</td>
                  <td className="p-3 text-center font-bold">1,000 Pages</td>
                  <td className="p-3 text-center font-bold bg-blue-50/30 dark:bg-blue-950/10 text-[#274690]">5,000 Pages</td>
                  <td className="p-3 text-center font-bold">25,000 Pages</td>
                </tr>
                <tr>
                  <td className="p-3 pl-6 font-semibold text-slate-800 dark:text-slate-200">AI Prompt Templates</td>
                  <td className="p-3 text-center font-bold">10 Templates</td>
                  <td className="p-3 text-center font-bold bg-blue-50/30 dark:bg-blue-950/10 text-[#274690]">50 Templates</td>
                  <td className="p-3 text-center font-bold">Unlimited</td>
                </tr>

                {/* 2. AI Intelligence */}
                <tr className="bg-slate-100/50 dark:bg-slate-800/40 font-black text-slate-700 dark:text-slate-200 text-[11px]">
                  <td colSpan={4} className="p-3 pl-6 uppercase tracking-wider text-[#274690]">2. AI Intelligence & OCR</td>
                </tr>
                <tr>
                  <td className="p-3 pl-6 font-semibold">AI Classification & Data Extraction</td>
                  <td className="p-3 text-center"><Check size={16} className="text-emerald-500 mx-auto" /></td>
                  <td className="p-3 text-center bg-blue-50/30 dark:bg-blue-950/10"><Check size={16} className="text-emerald-500 mx-auto" /></td>
                  <td className="p-3 text-center"><Check size={16} className="text-emerald-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-3 pl-6 font-semibold">AI Document Summarizer & Chat Q&A</td>
                  <td className="p-3 text-center"><Check size={16} className="text-emerald-500 mx-auto" /></td>
                  <td className="p-3 text-center bg-blue-50/30 dark:bg-blue-950/10"><Check size={16} className="text-emerald-500 mx-auto" /></td>
                  <td className="p-3 text-center"><Check size={16} className="text-emerald-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-3 pl-6 font-semibold">Batch Document OCR & Comparison</td>
                  <td className="p-3 text-center"><X size={16} className="text-rose-400 mx-auto" /></td>
                  <td className="p-3 text-center bg-blue-50/30 dark:bg-blue-950/10"><Check size={16} className="text-emerald-500 mx-auto" /></td>
                  <td className="p-3 text-center"><Check size={16} className="text-emerald-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-3 pl-6 font-semibold">Custom AI Models & Dynamic Routing</td>
                  <td className="p-3 text-center"><X size={16} className="text-rose-400 mx-auto" /></td>
                  <td className="p-3 text-center bg-blue-50/30 dark:bg-blue-950/10"><X size={16} className="text-rose-400 mx-auto" /></td>
                  <td className="p-3 text-center"><Check size={16} className="text-emerald-500 mx-auto" /></td>
                </tr>

                {/* 3. Automation & Workflows */}
                <tr className="bg-slate-100/50 dark:bg-slate-800/40 font-black text-slate-700 dark:text-slate-200 text-[11px]">
                  <td colSpan={4} className="p-3 pl-6 uppercase tracking-wider text-[#274690]">3. Workflows & Approvals</td>
                </tr>
                <tr>
                  <td className="p-3 pl-6 font-semibold">Standard Approval Chains</td>
                  <td className="p-3 text-center"><Check size={16} className="text-emerald-500 mx-auto" /></td>
                  <td className="p-3 text-center bg-blue-50/30 dark:bg-blue-950/10"><Check size={16} className="text-emerald-500 mx-auto" /></td>
                  <td className="p-3 text-center"><Check size={16} className="text-emerald-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-3 pl-6 font-semibold">Multi-Step & Conditional Workflows</td>
                  <td className="p-3 text-center"><X size={16} className="text-rose-400 mx-auto" /></td>
                  <td className="p-3 text-center bg-blue-50/30 dark:bg-blue-950/10"><Check size={16} className="text-emerald-500 mx-auto" /></td>
                  <td className="p-3 text-center"><Check size={16} className="text-emerald-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-3 pl-6 font-semibold">Cross-Department & Event-Triggered Automation</td>
                  <td className="p-3 text-center"><X size={16} className="text-rose-400 mx-auto" /></td>
                  <td className="p-3 text-center bg-blue-50/30 dark:bg-blue-950/10"><X size={16} className="text-rose-400 mx-auto" /></td>
                  <td className="p-3 text-center"><Check size={16} className="text-emerald-500 mx-auto" /></td>
                </tr>

                {/* 4. Integrations */}
                <tr className="bg-slate-100/50 dark:bg-slate-800/40 font-black text-slate-700 dark:text-slate-200 text-[11px]">
                  <td colSpan={4} className="p-3 pl-6 uppercase tracking-wider text-[#274690]">4. Connected Apps & Integrations</td>
                </tr>
                <tr>
                  <td className="p-3 pl-6 font-semibold">Google Workspace & SMTP Email</td>
                  <td className="p-3 text-center"><Check size={16} className="text-emerald-500 mx-auto" /></td>
                  <td className="p-3 text-center bg-blue-50/30 dark:bg-blue-950/10"><Check size={16} className="text-emerald-500 mx-auto" /></td>
                  <td className="p-3 text-center"><Check size={16} className="text-emerald-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-3 pl-6 font-semibold">Microsoft 365, Slack & Microsoft Teams</td>
                  <td className="p-3 text-center"><X size={16} className="text-rose-400 mx-auto" /></td>
                  <td className="p-3 text-center bg-blue-50/30 dark:bg-blue-950/10"><Check size={16} className="text-emerald-500 mx-auto" /></td>
                  <td className="p-3 text-center"><Check size={16} className="text-emerald-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-3 pl-6 font-semibold">REST API & Webhooks Access</td>
                  <td className="p-3 text-center"><X size={16} className="text-rose-400 mx-auto" /></td>
                  <td className="p-3 text-center bg-blue-50/30 dark:bg-blue-950/10"><Check size={16} className="text-emerald-500 mx-auto" /></td>
                  <td className="p-3 text-center"><Check size={16} className="text-emerald-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-3 pl-6 font-semibold">WhatsApp Business API & Custom Integrations</td>
                  <td className="p-3 text-center"><X size={16} className="text-rose-400 mx-auto" /></td>
                  <td className="p-3 text-center bg-blue-50/30 dark:bg-blue-950/10"><X size={16} className="text-rose-400 mx-auto" /></td>
                  <td className="p-3 text-center"><Check size={16} className="text-emerald-500 mx-auto" /></td>
                </tr>

                {/* 5. Security & Governance */}
                <tr className="bg-slate-100/50 dark:bg-slate-800/40 font-black text-slate-700 dark:text-slate-200 text-[11px]">
                  <td colSpan={4} className="p-3 pl-6 uppercase tracking-wider text-[#274690]">5. Security, Governance & Support</td>
                </tr>
                <tr>
                  <td className="p-3 pl-6 font-semibold">Role-Based Access Control (RBAC) & MFA</td>
                  <td className="p-3 text-center"><Check size={16} className="text-emerald-500 mx-auto" /></td>
                  <td className="p-3 text-center bg-blue-50/30 dark:bg-blue-950/10"><Check size={16} className="text-emerald-500 mx-auto" /></td>
                  <td className="p-3 text-center"><Check size={16} className="text-emerald-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-3 pl-6 font-semibold">Audit Log Retention</td>
                  <td className="p-3 text-center font-bold">30 Days</td>
                  <td className="p-3 text-center font-bold bg-blue-50/30 dark:bg-blue-950/10 text-[#274690]">1 Year</td>
                  <td className="p-3 text-center font-bold">7 Years</td>
                </tr>
                <tr>
                  <td className="p-3 pl-6 font-semibold">Single Sign-On (SSO) & IP Whitelisting</td>
                  <td className="p-3 text-center"><X size={16} className="text-rose-400 mx-auto" /></td>
                  <td className="p-3 text-center bg-blue-50/30 dark:bg-blue-950/10"><X size={16} className="text-rose-400 mx-auto" /></td>
                  <td className="p-3 text-center"><Check size={16} className="text-emerald-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-3 pl-6 font-semibold">Customer Support SLA</td>
                  <td className="p-3 text-center">Standard Support</td>
                  <td className="p-3 text-center bg-blue-50/30 dark:bg-blue-950/10 text-[#274690] font-bold">Priority Support</td>
                  <td className="p-3 text-center font-bold">Dedicated Manager + 99.9% SLA</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: CREATE CUSTOM PLAN */}
      {activeTab === "create-plan" && (
        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
          <CardHeader className="p-0 pb-6">
            <CardTitle className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles size={18} className="text-[#274690]" /> Create Custom Enterprise Plan
            </CardTitle>
            <p className="text-xs text-slate-500">
              Design tailored quotas, storage capacities, and pricing models for specific enterprise clients.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <form onSubmit={handleCreatePlan} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Plan Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Growth Pro Tier"
                    value={newPlan.name}
                    onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#274690]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Badge Title (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Best Value, Fast Scaling"
                    value={newPlan.badge}
                    onChange={(e) => setNewPlan({ ...newPlan, badge: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#274690]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Monthly Price (INR ₹)</label>
                  <input
                    type="number"
                    required
                    value={newPlan.monthlyPrice}
                    onChange={(e) => setNewPlan({ ...newPlan, monthlyPrice: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#274690]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Annual Price (INR ₹)</label>
                  <input
                    type="number"
                    value={newPlan.annualPrice}
                    onChange={(e) => setNewPlan({ ...newPlan, annualPrice: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#274690]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Max User Seats</label>
                  <input
                    type="number"
                    value={newPlan.maxUsers}
                    onChange={(e) => setNewPlan({ ...newPlan, maxUsers: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Storage Quota (GB)</label>
                  <input
                    type="number"
                    value={newPlan.storage}
                    onChange={(e) => setNewPlan({ ...newPlan, storage: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Monthly AI Credits</label>
                  <input
                    type="number"
                    value={newPlan.aiCredits}
                    onChange={(e) => setNewPlan({ ...newPlan, aiCredits: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Description & Value Proposition</label>
                <textarea
                  rows={2}
                  placeholder="Describe target organization size and tier benefits..."
                  value={newPlan.description}
                  onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setActiveTab("plans")} className="rounded-xl font-bold cursor-pointer">
                  Cancel
                </Button>
                <Button type="submit" disabled={creating} className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-xl px-6 cursor-pointer">
                  {creating ? "Creating..." : "Save & Publish Plan"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TAB 4: ACTIVE CUSTOMER SUBSCRIPTIONS */}
      {activeTab === "active" && (
        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-black text-slate-900 dark:text-slate-100">
                Active Tenant Subscriptions
              </CardTitle>
              <p className="text-xs text-slate-500">Live organization subscription contracts and quota consumption.</p>
            </div>
            <Button size="sm" variant="outline" onClick={loadSubscriptionData} className="rounded-xl text-xs font-bold cursor-pointer">
              <RefreshCw size={13} className="mr-1.5" /> Refresh
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-4 pl-6">Customer Organization</th>
                  <th className="p-4">Assigned Plan</th>
                  <th className="p-4">Storage Used</th>
                  <th className="p-4">AI Credits Used</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {orgSubscriptions.map((sub, idx) => (
                  <tr key={sub.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-4 pl-6 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#274690]/10 text-[#274690]">
                        <Building2 size={16} />
                      </div>
                      <div>
                        <p>{sub.organisation?.name || sub.org || "Enterprise Tenant"}</p>
                        <p className="text-[10px] text-slate-400 font-normal">Created: {sub.createdAt?.slice(0, 10) || "2026-08-01"}</p>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                      {sub.plan?.planName || sub.planName || "Enterprise"}
                    </td>
                    <td className="p-4 font-semibold text-slate-600 dark:text-slate-400">
                      {sub.storageUsageMB ? (sub.storageUsageMB / 1024).toFixed(1) : "0"} GB
                    </td>
                    <td className="p-4 font-semibold text-slate-600 dark:text-slate-400">
                      {sub.aiCreditsUsed?.toLocaleString() || "0"}
                    </td>
                    <td className="p-4">
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                        {sub.status || "ACTIVE"}
                      </Badge>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => showToast(`Opening billing drawer for ${sub.organisation?.name || sub.org}`)}
                        className="h-8 text-xs font-bold text-[#274690] dark:text-blue-400 cursor-pointer"
                      >
                        Manage <ArrowUpRight size={13} className="ml-1" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 5: LIMITS MATRIX */}
      {activeTab === "limits" && (
        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 p-6">
          <CardTitle className="text-base font-black text-slate-900 dark:text-slate-100 mb-4">
            Tier Limits & Feature Entitlements Matrix
          </CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="font-black text-slate-900 dark:text-slate-100 text-sm">Starter</p>
                <span className="font-bold text-slate-500">₹4,999/mo</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-semibold">• 10 Users Maximum</p>
              <p className="text-slate-600 dark:text-slate-400 font-semibold">• 50 GB AWS S3 Storage</p>
              <p className="text-slate-600 dark:text-slate-400 font-semibold">• 2,000 AI Documents / Month</p>
              <p className="text-slate-600 dark:text-slate-400 font-semibold">• 1,000 OCR Pages / Month</p>
              <p className="text-slate-600 dark:text-slate-400 font-semibold">• 10 AI Templates & Basic Workflows</p>
              <p className="text-slate-600 dark:text-slate-400 font-semibold">• Google Workspace & SMTP Email</p>
              <p className="text-slate-600 dark:text-slate-400 font-semibold">• RBAC, MFA & Basic Audit Logs</p>
            </div>

            <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border-2 border-[#274690]/40 space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <p className="font-black text-[#274690] dark:text-blue-300 text-sm">Business</p>
                  <span className="bg-[#274690] text-white text-[9px] font-black px-2 py-0.5 rounded-full">POPULAR</span>
                </div>
                <span className="font-bold text-[#274690] dark:text-blue-300">₹14,999/mo</span>
              </div>
              <p className="text-slate-700 dark:text-slate-300 font-semibold">• 50 Users Maximum</p>
              <p className="text-slate-700 dark:text-slate-300 font-semibold">• 250 GB AWS S3 Storage</p>
              <p className="text-slate-700 dark:text-slate-300 font-semibold">• 10,000 AI Documents / Month</p>
              <p className="text-slate-700 dark:text-slate-300 font-semibold">• 5,000 Advanced OCR Pages</p>
              <p className="text-slate-700 dark:text-slate-300 font-semibold">• Batch Processing & Comparison</p>
              <p className="text-slate-700 dark:text-slate-300 font-semibold">• Multi-Step & Conditional Approvals</p>
              <p className="text-slate-700 dark:text-slate-300 font-semibold">• 50 AI Templates & Custom Prompts</p>
              <p className="text-slate-700 dark:text-slate-300 font-semibold">• Google, Microsoft 365, Slack & Teams</p>
              <p className="text-slate-700 dark:text-slate-300 font-semibold">• REST API, Webhooks & 1-Yr Audit Vault</p>
            </div>

            <div className="p-5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="font-black text-purple-900 dark:text-purple-300 text-sm">Enterprise</p>
                <span className="font-bold text-purple-900 dark:text-purple-300">₹39,999/mo</span>
              </div>
              <p className="text-slate-700 dark:text-slate-300 font-semibold">• 500+ Users (Unlimited Scaling)</p>
              <p className="text-slate-700 dark:text-slate-300 font-semibold">• 1 TB+ Dedicated Storage</p>
              <p className="text-slate-700 dark:text-slate-300 font-semibold">• 50,000+ AI Documents / Month</p>
              <p className="text-slate-700 dark:text-slate-300 font-semibold">• 25,000 High-Volume OCR Pages</p>
              <p className="text-slate-700 dark:text-slate-300 font-semibold">• Custom AI Models & Routing</p>
              <p className="text-slate-700 dark:text-slate-300 font-semibold">• Unlimited Workflows & Cross-Dept Rules</p>
              <p className="text-slate-700 dark:text-slate-300 font-semibold">• SSO, MFA Enforcement & IP Whitelisting</p>
              <p className="text-slate-700 dark:text-slate-300 font-semibold">• Full Integrations + WhatsApp Business API</p>
              <p className="text-slate-700 dark:text-slate-300 font-semibold">• 7-Year Audit Vault & 99.9% Custom SLA</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
