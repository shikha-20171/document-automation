"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  ListTree,
  Search,
  Bot,
  ScanText,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { aiApi } from "@/services/aiApi";
import AiChatComponent from "@/components/ai/AiChatComponent";

type RunItem = {
  id: string;
  tool: string;
  title?: string;
  created_at?: string;
  status?: string;
};

export default function DepartmentManagerAiToolsPage() {
  const [runs, setRuns] = useState<RunItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  const fetchRuns = async () => {
    setLoading(true);
    try {
      const res = await aiApi.getRuns(15);
      if (res?.data) {
        setRuns(res.data);
      }
    } catch {
      setRuns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRuns();
  }, []);

  const tools = [
    {
      id: "generator",
      name: "AI Document Generator",
      description: "Create documents using AI and templates.",
      href: "/department-manager/ai-tools/document-generator",
      icon: FileText,
      badge: "Draft & Templates",
      color: "from-[#274690] to-[#1f3770]",
      toolKey: "AI_DOCUMENT_GENERATOR",
      features: [
        "Prompt-to-document generation",
        "Fill department template blueprints",
        "Draft from structured records",
        "Save to department documents & submit for approval",
      ],
    },
    {
      id: "summarizer",
      name: "AI Document Summarizer",
      description: "Generate summaries and key points.",
      href: "/department-manager/ai-tools/summarizer",
      icon: ListTree,
      badge: "Executive Briefing",
      color: "from-[#274690] to-[#1f3770]",
      toolKey: "AI_DOCUMENT_SUMMARIZER",
      features: [
        "Short, Medium, or Detailed summaries",
        "Key points bullet extraction",
        "Action items checklist with assignees",
        "Select department docs or upload files",
      ],
    },
    {
      id: "extraction",
      name: "AI Data Extraction",
      description: "Extract structured data from documents.",
      href: "/department-manager/ai-tools/data-extraction",
      icon: Search,
      badge: "Structured Data",
      color: "from-[#274690] to-[#1f3770]",
      toolKey: "AI_DATA_EXTRACTION",
      features: [
        "Invoice, Contract & HR form extraction",
        "Custom field schema builder",
        "Confidence rating for every field",
        "Save extracted data to department records",
      ],
    },
    {
      id: "classification",
      name: "AI Document Classification",
      description: "Automatically identify document type and category.",
      href: "/department-manager/ai-tools/classification",
      icon: Bot,
      badge: "Auto-Categorize",
      color: "from-[#274690] to-[#1f3770]",
      toolKey: "AI_DOCUMENT_CLASSIFICATION",
      features: [
        "Identifies document type & category",
        "Recommends department folder path",
        "Detects keywords & metadata tags",
        "Strictly department-scoped isolation",
      ],
    },
    {
      id: "ocr",
      name: "AI OCR",
      description: "Extract text from images and scanned documents.",
      href: "/department-manager/ai-tools/ocr",
      icon: ScanText,
      badge: "Vision Engine",
      color: "from-[#274690] to-[#1f3770]",
      toolKey: "OCR",
      features: [
        "Scanned PDF, JPG, PNG & WEBP support",
        "Side-by-side preview and editable text",
        "One-click transfer to Generator & Summarizer",
        "Real multipart backend extraction",
      ],
    },
  ];

  const getToolRunCount = (toolKey: string) => {
    return runs.filter((r) => r.tool?.toUpperCase().includes(toolKey)).length;
  };

  const getLastUsed = (toolKey: string) => {
    const matched = runs.find((r) => r.tool?.toUpperCase().includes(toolKey));
    if (!matched?.created_at) return "Not used yet";
    const date = new Date(matched.created_at);
    return date.toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 pb-16 font-sans text-slate-800">
      {/* Top Banner Header */}
      <section className="relative overflow-hidden rounded-3xl border border-[#274690]/20 bg-[linear-gradient(135deg,#1b2f5a_0%,#223d78_45%,#274690_85%,#3b61ad_100%)] p-7 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#274690]/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-[#5f86d9]/20 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge className="border border-white/30 bg-white/15 px-3 py-1 text-xs font-black tracking-wide text-white backdrop-blur-md">
                <Sparkles className="mr-1.5 inline-block h-3.5 w-3.5 text-amber-300" />
                DEPARTMENT MANAGER SUITE
              </Badge>
              <Badge className="border border-emerald-400/40 bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-200">
                <ShieldCheck className="mr-1 inline-block h-3 w-3" />
                Department Scoped Only
              </Badge>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              AI Tools
            </h1>
            <p className="max-w-2xl text-xs font-medium leading-relaxed text-blue-100/90 sm:text-sm">
              Use AI to automate your department&apos;s document workflows. Create, analyze, extract, classify, and OCR department documents with enterprise accuracy.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="border-white/30 bg-white/10 text-xs font-bold text-white backdrop-blur-sm hover:bg-white/20"
              onClick={() => void fetchRuns()}
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh Status
            </Button>
          </div>
        </div>

        {/* Quick KPI stats row */}
        <div className="relative z-10 mt-6 grid grid-cols-2 gap-3 border-t border-white/15 pt-4 sm:grid-cols-4">
          <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
            <p className="text-[11px] font-medium text-blue-200">Available AI Tools</p>
            <p className="text-lg font-black text-white">5 Active Engines</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
            <p className="text-[11px] font-medium text-blue-200">Recent AI Runs</p>
            <p className="text-lg font-black text-white">{runs.length} Logged</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
            <p className="text-[11px] font-medium text-blue-200">Department Scope</p>
            <p className="text-lg font-black text-white">Operations & Records</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
            <p className="text-[11px] font-medium text-blue-200">Data Isolation</p>
            <p className="text-lg font-black text-emerald-300">Protected</p>
          </div>
        </div>
      </section>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("all")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "all"
              ? "bg-[#274690] text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Sparkles size={14} /> AI Tools & Workspaces
        </button>
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "chat"
              ? "bg-[#274690] text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Bot size={14} /> Multi-Provider AI Chat
        </button>
      </div>

      {activeTab === "chat" ? (
        <AiChatComponent userRole="Department Manager" defaultDepartment="Operations" />
      ) : (
        /* 5 AI Tools Cards Grid */
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900">Department AI Tool Suite</h2>
            <p className="text-xs text-slate-500">Select any tool below to launch its dedicated workspace.</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool, idx) => {
            const Icon = tool.icon;
            const count = getToolRunCount(tool.toolKey);
            const lastRun = getLastUsed(tool.toolKey);

            return (
              <div
                key={tool.id}
                className="group flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#274690]/40 hover:shadow-lg"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br ${tool.color} text-white shadow-md transition group-hover:scale-105`}>
                      <Icon size={22} />
                    </div>
                    <Badge variant="outline" className="border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-600">
                      0{idx + 1} • {tool.badge}
                    </Badge>
                  </div>

                  {/* Title & Description */}
                  <div className="mt-4">
                    <h3 className="text-base font-black text-slate-900 group-hover:text-[#274690] transition">
                      {tool.name}
                    </h3>
                    <p className="mt-1 text-xs font-normal leading-relaxed text-slate-500">
                      {tool.description}
                    </p>
                  </div>

                  {/* Features bullet list */}
                  <ul className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-[11px] text-slate-600">
                    {tool.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-2">
                        <CheckCircle2 size={13} className="text-[#274690] shrink-0" />
                        <span className="truncate">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Card Footer */}
                <div className="mt-6 border-t border-slate-100 pt-4">
                  <div className="mb-3 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-semibold">Recent Usage:</span>
                    <span className="font-mono font-bold text-slate-700">
                      {count > 0 ? `${count} runs (${lastRun})` : "Ready to use"}
                    </span>
                  </div>

                  <Link href={tool.href} className="block w-full">
                    <Button className="w-full justify-between rounded-xl bg-[#274690] text-xs font-bold text-white transition hover:bg-[#1f3770] shadow-sm">
                      <span>Open Tool</span>
                      <ArrowRight size={14} className="transition group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      )}

      {/* Recent Department AI Processing History */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-base font-black text-slate-900">
              <Clock size={18} className="text-[#274690]" />
              Recent AI Processing History
            </h3>
            <p className="text-xs text-slate-500">Audit trail of AI actions executed within your department.</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void fetchRuns()}
            className="text-xs font-bold text-[#274690]"
          >
            Refresh History
          </Button>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3">Tool</th>
                  <th className="px-4 py-3">Operation / Title</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {runs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                      No AI operations recorded yet. Choose any tool above to get started.
                    </td>
                  </tr>
                )}
                {runs.map((run) => (
                  <tr key={run.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <Badge className="bg-[#274690]/10 text-[#274690] text-[10px] font-bold">
                        {run.tool}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {run.title || "Department Document Operation"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                        <CheckCircle2 size={12} /> COMPLETED
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[11px] text-slate-500">
                      {run.created_at ? new Date(run.created_at).toLocaleString() : "Just now"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}