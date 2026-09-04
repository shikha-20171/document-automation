"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Check,
  X,
  Zap,
  Sparkles,
  Shield,
  HardDrive,
  Bot,
  ScanText,
  Users,
  ArrowRight,
  HelpCircle,
  Building2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import apiClient from "@/lib/axios";

interface PublicPlan {
  id: string;
  name: string;
  code: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  userLimit: number;
  storageLimitGB: number;
  aiCredits: number;
  ocrLimit: number;
  supportLevel: string;
  badge?: string;
  isMostPopular?: boolean;
  features: Record<string, any>;
  includedList?: string[];
  excludedList?: string[];
}

export default function PublicPricingPage() {
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "ANNUAL">("MONTHLY");

  const resolvePlanFeatures = (p: any) => {
    const code = (p.code || p.name || "").toLowerCase();
    if (code.includes("starter")) {
      return {
        included: [
          "10 Users & 50 GB S3 Storage",
          "2,000 AI Docs/mo & Standard OCR",
          "AI Classification & Data Extraction",
          "AI Summarization & Document Q&A",
          "10 AI Templates & Basic Workflows",
          "Google Workspace & SMTP Email",
          "RBAC, MFA & Basic Audit Logs",
        ],
        excluded: [
          "Slack, Teams & WhatsApp",
          "Batch OCR & Comparison",
          "Multi-Step Workflows",
          "REST API & Webhooks",
          "SSO & IP Whitelisting",
        ],
      };
    }
    if (code.includes("business")) {
      return {
        included: [
          "50 Users & 250 GB S3 Storage",
          "10,000 AI Docs/mo & Advanced OCR",
          "Batch Processing & Comparison",
          "Multi-Step & Conditional Workflows",
          "50 AI Templates & Custom Prompts",
          "Google, Microsoft 365, Slack & Teams",
          "REST API, Webhooks & 1-Yr Audit",
          "Priority Support & Onboarding",
        ],
        excluded: [
          "Custom AI Models & Routing",
          "Unlimited Workflows (999+)",
          "SSO & IP Whitelisting",
          "WhatsApp Business API",
          "7-Year Audit Vault",
        ],
      };
    }
    if (code.includes("enterprise")) {
      return {
        included: [
          "500+ Users & 1 TB+ S3 Storage",
          "50,000+ AI Docs/mo & Batch OCR",
          "Custom AI Models & Dynamic Routing",
          "Unlimited Workflows & Custom Rules",
          "SSO, MFA Enforcement & IP Whitelist",
          "Full Integrations + WhatsApp API",
          "7-Year Audit Vault & Retention",
          "Dedicated Manager & 99.9% SLA",
        ],
        excluded: [],
      };
    }
    return {
      included: [`${p.userLimit || 10} Users`, `${p.storageLimitGB || 50} GB Storage`, "AI Processing & OCR"],
      excluded: ["Enterprise Features"],
    };
  };

  const loadPlans = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/public/subscription-plans");
      if (res.data?.data) {
        const mapped = res.data.data.map((p: any) => {
          const feat = resolvePlanFeatures(p);
          return {
            ...p,
            includedList: feat.included,
            excludedList: feat.excluded,
          };
        });
        setPlans(mapped);
      }
    } catch (err) {
      console.error("Failed to load public plans:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b101e] text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-[#274690]/20">
      {/* Header Navigation */}
      <header className="border-b border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-[#11192e]/70 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#274690] to-indigo-600 flex items-center justify-center text-white shadow-md shadow-[#274690]/20">
              <Bot size={18} />
            </div>
            <span className="font-extrabold text-base tracking-tight">DocuCore AI</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm" className="text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="sm" className="bg-[#274690] hover:bg-[#1f3561] text-white text-xs font-extrabold rounded-xl h-9 cursor-pointer">
                Start Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full space-y-12">
        {/* Title & Toggle */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge className="bg-[#274690]/10 text-[#274690] dark:bg-blue-900/30 dark:text-blue-300 text-xs font-extrabold px-3 py-1 rounded-full border-0">
            TRANSPARENT TIER PRICING & FEATURE ACCESS
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Predictable plans for enterprise document intelligence
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Equip your organization with multi-tier OCR extraction, Google Gemini & Claude generative intelligence, and secure AWS S3 cloud storage.
          </p>

          {/* Monthly / Annual Toggle */}
          <div className="inline-flex items-center gap-2 p-1 rounded-2xl bg-slate-200/70 dark:bg-slate-800 border border-slate-300/50 dark:border-slate-700/50 mt-4 text-xs font-extrabold">
            <button
              onClick={() => setBillingCycle("MONTHLY")}
              className={`px-4 py-1.5 rounded-xl transition cursor-pointer ${
                billingCycle === "MONTHLY"
                  ? "bg-white dark:bg-[#11192e] text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle("ANNUAL")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl transition cursor-pointer ${
                billingCycle === "ANNUAL"
                  ? "bg-white dark:bg-[#11192e] text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>Annual Billing</span>
              <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] px-1.5 py-0.5 rounded font-black">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Dynamic Pricing Cards */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#274690] border-t-transparent animate-spin" />
            <span className="text-xs font-bold text-slate-500">Loading dynamic subscription catalog...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((p) => {
              const isPopular = p.isMostPopular || p.badge?.toLowerCase().includes("popular");
              const price = billingCycle === "ANNUAL" ? Math.round(p.yearlyPrice / 12) : p.monthlyPrice;

              return (
                <Card
                  key={p.id}
                  className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-200 relative ${
                    isPopular
                      ? "bg-white dark:bg-[#11192e] border-2 border-[#274690] shadow-xl shadow-[#274690]/10 scale-[1.02]"
                      : "bg-white/80 dark:bg-[#11192e]/80 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md"
                  }`}
                >
                  {p.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-[#274690] text-white text-[10px] font-black tracking-wider uppercase px-3 py-1 rounded-full shadow-md">
                        {p.badge}
                      </span>
                    </div>
                  )}

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">{p.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{p.description}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100">
                          {p.currency === "INR" ? "₹" : "$"}
                          {price.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-400 font-bold">/ month</span>
                      </div>
                      {billingCycle === "ANNUAL" && (
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                          Billed annually ({p.currency === "INR" ? "₹" : "$"}{p.yearlyPrice.toLocaleString()} / yr)
                        </p>
                      )}
                    </div>

                    {/* Resource Quotas */}
                    <div className="space-y-2.5 text-xs font-bold pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                        <HardDrive size={15} className="text-[#274690] dark:text-blue-400 shrink-0" />
                        <span>{p.storageLimitGB} GB AWS S3 Cloud Storage</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                        <Bot size={15} className="text-purple-600 dark:text-purple-400 shrink-0" />
                        <span>{p.aiCredits.toLocaleString()} AI Docs / month</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                        <ScanText size={15} className="text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>{p.ocrLimit.toLocaleString()} OCR Document Pages</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                        <Users size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Up to {p.userLimit} Team Members</span>
                      </div>
                    </div>

                    {/* 1. INCLUDED FEATURES */}
                    <div className="space-y-2 text-xs pt-4 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                        Included Features ({p.includedList?.length || 0})
                      </span>
                      <div className="space-y-1.5">
                        {(p.includedList || []).map((feat, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-slate-700 dark:text-slate-300 font-semibold text-xs">
                            <Check size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 2. EXCLUDED FEATURES */}
                    {p.excludedList && p.excludedList.length > 0 && (
                      <div className="space-y-2 text-xs pt-4 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                          Not Included ({p.excludedList.length})
                        </span>
                        <div className="space-y-1.5">
                          {p.excludedList.map((feat, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-slate-400 dark:text-slate-500 font-medium text-xs line-through opacity-75">
                              <X size={14} className="text-rose-400 shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                    <Link href="/auth/login" className="block">
                      <Button
                        className={`w-full font-bold rounded-2xl h-11 text-xs gap-2 cursor-pointer ${
                          isPopular
                            ? "bg-[#274690] hover:bg-[#1f3561] text-white shadow-md shadow-[#274690]/20 font-extrabold"
                            : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
                        }`}
                      >
                        <span>Choose {p.name}</span>
                        <ArrowRight size={14} />
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800 py-8 bg-white/40 dark:bg-[#0f172a]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
          DocuCore AI Enterprise Multi-Tenant Document Intelligence Platform © {new Date().getFullYear()}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
