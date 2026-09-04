"use client";

import { useState } from "react";
import {
  Sparkles,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Copy,
  CheckCircle2,
  X,
  FileCode,
  Layers,
  Calendar,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export interface PromptTemplateItem {
  id: string;
  name: string;
  description: string;
  category: "Finance" | "Legal" | "HR" | "Operations" | "Sales" | "Compliance" | "General";
  status: "Active" | "Draft" | "Archived";
  version: string;
  promptText: string;
  variables: string[];
  outputFormat: "Text" | "JSON" | "Table";
  createdBy: string;
  updatedAt: string;
}

const DEFAULT_PROMPT_TEMPLATES: PromptTemplateItem[] = [
  {
    id: "tmpl-1",
    name: "Invoice Auditor & Tax Validator",
    description: "Inspect vendor invoices for GST/VAT compliance and calculate line-item totals.",
    category: "Finance",
    status: "Active",
    version: "v1.2",
    promptText: "Analyze {{invoice_document}} for {{vendor_name}}. Verify tax calculations and total amount {{total_amount}}.",
    variables: ["invoice_document", "vendor_name", "total_amount"],
    outputFormat: "Table",
    createdBy: "Org Admin",
    updatedAt: "2 days ago",
  },
  {
    id: "tmpl-2",
    name: "NDA Compliance Redliner",
    description: "Extract covenants, non-solicitation, and jurisdiction clauses.",
    category: "Legal",
    status: "Active",
    version: "v1.0",
    promptText: "Review non-disclosure agreement for {{company_name}} regarding confidentiality term {{confidentiality_years}}.",
    variables: ["company_name", "confidentiality_years"],
    outputFormat: "JSON",
    createdBy: "Legal Lead",
    updatedAt: "Yesterday",
  },
  {
    id: "tmpl-3",
    name: "Candidate Offer Letter Evaluator",
    description: "Check compensation breakdown, notice period, and probationary clauses.",
    category: "HR",
    status: "Active",
    version: "v2.0",
    promptText: "Review offer letter for {{candidate_name}} with role {{job_title}} and salary {{salary_ctc}}.",
    variables: ["candidate_name", "job_title", "salary_ctc"],
    outputFormat: "Text",
    createdBy: "HR Admin",
    updatedAt: "1 day ago",
  },
];

interface PromptTemplatesManagerProps {
  templates?: PromptTemplateItem[];
  onAddTemplate?: (t: PromptTemplateItem) => void;
  onUpdateTemplate?: (t: PromptTemplateItem) => void;
  onDeleteTemplate?: (id: string) => void;
  onShowToast?: (msg: string) => void;
}

export default function PromptTemplatesManager({
  templates: propsTemplates,
  onAddTemplate: propsOnAdd,
  onUpdateTemplate: propsOnUpdate,
  onDeleteTemplate: propsOnDelete,
  onShowToast: propsOnToast,
}: PromptTemplatesManagerProps) {
  const [internalTemplates, setInternalTemplates] = useState<PromptTemplateItem[]>(DEFAULT_PROMPT_TEMPLATES);
  const templates = propsTemplates || internalTemplates;

  const onAddTemplate = propsOnAdd || ((t: PromptTemplateItem) => setInternalTemplates((prev) => [t, ...prev]));
  const onUpdateTemplate = propsOnUpdate || ((t: PromptTemplateItem) => setInternalTemplates((prev) => prev.map((item) => (item.id === t.id ? t : item))));
  const onDeleteTemplate = propsOnDelete || ((id: string) => setInternalTemplates((prev) => prev.filter((item) => item.id !== id)));
  const onShowToast = propsOnToast || ((msg: string) => {});
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Modals
  const [viewModal, setViewModal] = useState<PromptTemplateItem | null>(null);
  const [editModal, setEditModal] = useState<PromptTemplateItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<PromptTemplateItem["category"]>("Finance");
  const [promptText, setPromptText] = useState("Analyze {{document}} for {{company_name}} and provide a summary of {{requirement}}.");
  const [outputFormat, setOutputFormat] = useState<"Text" | "JSON" | "Table">("Text");
  const [status, setStatus] = useState<"Active" | "Draft" | "Archived">("Active");

  const autoDetectedVariables = (promptText.match(/\{\{([^}]+)\}\}/g) || []).map((v) => v.trim());
  const categories = ["All", "HR", "Legal", "Finance", "Operations", "Sales", "Compliance", "General"];

  const filtered = templates.filter((t) => {
    const textMatch = (t.name + t.description + t.promptText).toLowerCase().includes(search.toLowerCase());
    const catMatch = categoryFilter === "All" || t.category === categoryFilter;
    const statMatch = statusFilter === "All" || t.status === statusFilter;
    return textMatch && catMatch && statMatch;
  });

  const handleCreate = () => {
    if (!name.trim()) return;
    const newItem: PromptTemplateItem = {
      id: `tmpl-${Date.now()}`,
      name,
      description,
      category,
      status,
      version: "v1.0",
      promptText,
      variables: autoDetectedVariables.map((v) => v.replace(/[{}]/g, "")),
      outputFormat,
      createdBy: "Org Admin",
      updatedAt: "Just now",
    };
    onAddTemplate(newItem);
    setIsCreateOpen(false);
    onShowToast("Prompt template created successfully!");
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="text-[#274690]" size={20} /> Prompt Blueprint Templates
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Create reusable AI prompt templates with dynamic variables for automated doc processing.
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="h-10 rounded-xl bg-[#274690] px-4 text-xs font-bold text-white shadow-md hover:bg-[#1f3561]"
        >
          <Plus size={15} className="mr-1.5" /> New Prompt Template
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search prompt templates by name, variable, keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-[#274690] focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold text-slate-700 focus:border-[#274690] focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold text-slate-700 focus:border-[#274690] focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Template Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t) => (
          <Card key={t.id} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 line-clamp-1">{t.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Badge variant="outline" className="text-[10px] font-bold text-[#274690] border-[#274690]/30 bg-[#274690]/5">
                      {t.category}
                    </Badge>
                    <span className="text-[10px] font-bold text-slate-400">{t.version}</span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  t.status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                  t.status === "Draft" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                  "bg-slate-100 text-slate-600 border border-slate-200"
                }`}>
                  {t.status}
                </span>
              </div>

              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium">
                {t.description}
              </p>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 font-mono text-[11px] text-slate-700 line-clamp-2">
                {t.promptText}
              </div>

              <div className="flex flex-wrap gap-1">
                {t.variables.map((v) => (
                  <span key={v} className="text-[10px] bg-[#274690]/10 text-[#274690] px-1.5 py-0.5 rounded font-mono font-bold">
                    {"{{" + v + "}}"}
                  </span>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between">
              <div className="text-[10px] text-slate-400 font-semibold">{t.updatedAt}</div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setViewModal(t)}
                  className="h-8 px-2 text-xs font-bold text-[#274690] hover:bg-[#274690]/10 rounded-lg"
                >
                  <Eye size={13} className="mr-1" /> View
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDeleteTemplate(t.id)}
                  className="h-8 w-8 text-slate-400 hover:text-rose-600 rounded-lg"
                >
                  <Trash2 size={13} />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* View Modal */}
      {viewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-black text-slate-900">{viewModal.name}</h2>
                <p className="text-xs text-slate-500 font-medium">{viewModal.category} • {viewModal.version}</p>
              </div>
              <button onClick={() => setViewModal(null)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="font-bold text-slate-700 mb-1">Prompt Text Blueprint</div>
                <div className="p-3 rounded-xl bg-slate-50 font-mono text-slate-800 border border-slate-200 whitespace-pre-wrap">
                  {viewModal.promptText}
                </div>
              </div>

              <div>
                <div className="font-bold text-slate-700 mb-1">Dynamic Variables</div>
                <div className="flex flex-wrap gap-1.5">
                  {viewModal.variables.map((v) => (
                    <span key={v} className="bg-[#274690]/10 text-[#274690] px-2 py-1 rounded-lg font-mono font-bold">
                      {"{{" + v + "}}"}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button size="sm" variant="outline" onClick={() => setViewModal(null)} className="rounded-xl text-xs font-bold">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-black text-slate-900">Create AI Prompt Template</h2>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Template Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Purchase Order Entity Extractor"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-semibold focus:border-[#274690] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-semibold focus:border-[#274690] focus:outline-none"
                >
                  {categories.filter((c) => c !== "All").map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Prompt Text Blueprint (Use {"{{var}}"})</label>
                <textarea
                  rows={4}
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs focus:border-[#274690] focus:outline-none"
                />
              </div>

              {autoDetectedVariables.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase mb-1">Detected Variables ({autoDetectedVariables.length})</div>
                  <div className="flex flex-wrap gap-1.5">
                    {autoDetectedVariables.map((v) => (
                      <span key={v} className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-lg font-mono font-bold text-[11px]">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button size="sm" variant="outline" onClick={() => setIsCreateOpen(false)} className="rounded-xl text-xs font-bold">
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreate} className="rounded-xl bg-[#274690] text-xs font-bold text-white hover:bg-[#1f3561]">
                Save Prompt Blueprint
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
