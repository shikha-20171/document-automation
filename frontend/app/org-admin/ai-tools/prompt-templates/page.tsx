"use client";

import { useState } from "react";
import {
  Terminal,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Copy,
  Trash2,
  CheckCircle2,
  Sparkles,
  Layers,
  FileCode,
  Tag,
  Clock,
  X,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: "HR" | "Legal" | "Finance" | "Operations" | "Customer Support" | "Compliance" | "General";
  status: "Active" | "Draft" | "Archived";
  version: string;
  promptText: string;
  variables: string[];
  updatedAt: string;
}

const initialSampleTemplates: PromptTemplate[] = [
  {
    id: "tmpl-101",
    name: "Executive Contract Risk Analyzer",
    description: "Analyzes vendor Master Service Agreements for financial liability limits and SLA penalties.",
    category: "Legal",
    status: "Active",
    version: "v2.1",
    promptText: "Analyze Section 4 of {{contract_title}} executed between {{company_name}} and {{vendor_name}}. Extract liability caps, indemnity obligations, and penalty percentages.",
    variables: ["contract_title", "company_name", "vendor_name"],
    updatedAt: "Today, 11:20 AM",
  },
  {
    id: "tmpl-102",
    name: "Offer Letter Auto-Generator",
    description: "Generates standardized executive offer letters with annual CTC and probation guidelines.",
    category: "HR",
    status: "Active",
    version: "v1.4",
    promptText: "Draft a formal job offer letter for candidate {{candidate_name}} appointed as {{designation}} at annual CTC of {{annual_ctc}} with a 6-month probation period.",
    variables: ["candidate_name", "designation", "annual_ctc"],
    updatedAt: "Yesterday, 04:45 PM",
  },
  {
    id: "tmpl-103",
    name: "Vendor Invoice Tax & GST Extractor",
    description: "Extracts vendor GSTIN, billing address, tax breakdown, and Net 30 payment due dates.",
    category: "Finance",
    status: "Active",
    version: "v3.0",
    promptText: "Parse document {{invoice_file}} and output GSTIN number, subtotal amount, IGST/CGST rates, and Net {{due_days}} payment deadline.",
    variables: ["invoice_file", "due_days"],
    updatedAt: "Aug 10, 2026",
  },
  {
    id: "tmpl-104",
    name: "SLA Uptime & Incident Summarizer",
    description: "Summarizes monthly cloud infrastructure incident logs into client executive reports.",
    category: "Operations",
    status: "Active",
    version: "v1.0",
    promptText: "Summarize monthly downtime logs for {{client_name}} during period {{reporting_period}}. Calculate net uptime percentage against 99.9% target.",
    variables: ["client_name", "reporting_period"],
    updatedAt: "Aug 08, 2026",
  },
  {
    id: "tmpl-105",
    name: "Customer NDA Compliance Validator",
    description: "Validates incoming non-disclosure agreements against company 3-year confidentiality policy.",
    category: "Compliance",
    status: "Draft",
    version: "v0.9",
    promptText: "Check NDA document {{document_name}} for 3-year confidentiality term, mutual obligations, and exclusions for publicly available knowledge.",
    variables: ["document_name"],
    updatedAt: "Aug 05, 2026",
  },
  {
    id: "tmpl-106",
    name: "Client Support Escalation Response",
    description: "Drafts priority response letters for high-severity client support tickets.",
    category: "Customer Support",
    status: "Active",
    version: "v1.2",
    promptText: "Draft formal resolution update for support ticket {{ticket_id}} logged by {{customer_name}} regarding {{issue_summary}}.",
    variables: ["ticket_id", "customer_name", "issue_summary"],
    updatedAt: "Aug 02, 2026",
  },
];

export default function OrgAdminPromptTemplatesPage() {
  const [templates, setTemplates] = useState<PromptTemplate[]>(initialSampleTemplates);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [viewModalTemplate, setViewModalTemplate] = useState<PromptTemplate | null>(null);
  const [editModalTemplate, setEditModalTemplate] = useState<PromptTemplate | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Template Form state
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState<PromptTemplate["category"]>("Legal");
  const [newPromptText, setNewPromptText] = useState("");

  const categories = ["All", "HR", "Legal", "Finance", "Operations", "Customer Support", "Compliance", "General"];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered Templates
  const filteredTemplates = templates.filter((t) => {
    const matchesCategory = selectedCategory === "All" || t.category === selectedCategory;
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.promptText.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Action Handlers
  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim() || !newPromptText.trim()) return;

    // Detect variables like {{var}}
    const varMatches = newPromptText.match(/\{\{([^}]+)\}\}/g) || [];
    const extractedVars = varMatches.map((v) => v.replace(/\{\{|\}\}/g, "").trim());

    const created: PromptTemplate = {
      id: `tmpl-${Date.now()}`,
      name: newTemplateName,
      description: newDescription || "Custom organizational prompt template",
      category: newCategory,
      status: "Active",
      version: "v1.0",
      promptText: newPromptText,
      variables: extractedVars,
      updatedAt: "Just now",
    };

    setTemplates((prev) => [created, ...prev]);
    setIsCreateModalOpen(false);
    setNewTemplateName("");
    setNewDescription("");
    setNewPromptText("");
    showToast(`Created template "${created.name}"!`);
  };

  const handleUpdateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalTemplate) return;

    const varMatches = editModalTemplate.promptText.match(/\{\{([^}]+)\}\}/g) || [];
    const extractedVars = varMatches.map((v) => v.replace(/\{\{|\}\}/g, "").trim());

    setTemplates((prev) =>
      prev.map((t) =>
        t.id === editModalTemplate.id
          ? { ...editModalTemplate, variables: extractedVars, updatedAt: "Just now" }
          : t
      )
    );

    setEditModalTemplate(null);
    showToast(`Updated template "${editModalTemplate.name}"!`);
  };

  const handleDuplicateTemplate = (template: PromptTemplate) => {
    const duplicated: PromptTemplate = {
      ...template,
      id: `tmpl-copy-${Date.now()}`,
      name: `${template.name} (Copy)`,
      version: "v1.0",
      status: "Draft",
      updatedAt: "Just now",
    };

    setTemplates((prev) => [duplicated, ...prev]);
    showToast(`Duplicated "${template.name}" as Draft.`);
  };

  const handleDeleteTemplate = (id: string, name: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    showToast(`Deleted template "${name}".`);
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-[#274690] text-white px-5 py-3.5 text-xs font-bold shadow-2xl flex items-center gap-2.5 border border-white/20 animate-in fade-in">
          <CheckCircle2 size={18} className="text-[#ffd9a0]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-[#274690] text-xs font-extrabold">
            <Terminal size={14} className="text-[#274690]" /> AI Automation Engine
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Prompt Templates Library
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage standardized AI prompt templates, dynamic field placeholders (<code className="font-mono text-[#274690]">{"{{variable}}"}</code>), and team execution guidelines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-xl text-xs px-4 py-2.5 shadow-md flex items-center gap-1.5"
          >
            <Plus size={16} className="text-[#ffd9a0]" /> Create Template
          </Button>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        {/* Search Input */}
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates by name, category, or prompt text..."
            className="pl-10 h-10 text-xs rounded-xl bg-slate-50 border-slate-200 focus:bg-white"
          />
        </div>

        {/* View Toggle & Count */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                viewMode === "grid" ? "bg-white text-[#274690] shadow-xs" : "text-slate-500"
              }`}
            >
              Grid View
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                viewMode === "table" ? "bg-white text-[#274690] shadow-xs" : "text-slate-500"
              }`}
            >
              Table View
            </button>
          </div>

          <span className="text-xs font-bold text-slate-500">
            Showing <strong className="text-slate-900">{filteredTemplates.length}</strong> Templates
          </span>
        </div>
      </div>

      {/* Categories Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
          <Filter size={13} /> Filter Category:
        </span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? "bg-[#274690] text-white shadow-md"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* GRID VIEW */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Header & Badges */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-blue-50 text-[#274690] text-[10px] font-extrabold border border-blue-100">
                      {template.category}
                    </Badge>
                    <Badge
                      className={`text-[10px] font-extrabold ${
                        template.status === "Active"
                          ? "bg-emerald-100 text-emerald-800"
                          : template.status === "Draft"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {template.status}
                    </Badge>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-slate-400">{template.version}</span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-snug">{template.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{template.description}</p>

                {/* Prompt Preview Snippet */}
                <div className="mt-3 p-3 bg-slate-900 text-slate-200 rounded-xl text-[11px] font-mono line-clamp-3 leading-relaxed border border-slate-800">
                  {template.promptText}
                </div>

                {/* Variables Pills */}
                {template.variables.length > 0 && (
                  <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Tokens:</span>
                    {template.variables.map((v, idx) => (
                      <span key={idx} className="bg-purple-50 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-purple-100">
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <Button
                    onClick={() => setViewModalTemplate(template)}
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs font-bold border-slate-200 text-slate-700 h-8"
                  >
                    <Eye size={13} className="mr-1 text-slate-500" /> View
                  </Button>

                  <Button
                    onClick={() => setEditModalTemplate(template)}
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs font-bold border-slate-200 text-slate-700 h-8"
                  >
                    <Edit size={13} className="mr-1 text-slate-500" /> Edit
                  </Button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDuplicateTemplate(template)}
                    title="Duplicate Template"
                    className="p-1.5 text-slate-400 hover:text-[#274690] hover:bg-slate-100 rounded-lg transition"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id, template.name)}
                    title="Delete Template"
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TABLE VIEW */}
      {viewMode === "table" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Template Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Version</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Variables</th>
                <th className="py-3.5 px-4">Last Updated</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredTemplates.map((template) => (
                <tr key={template.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-900">{template.name}</p>
                    <p className="text-[11px] text-slate-500 truncate max-w-xs">{template.description}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge className="bg-blue-50 text-[#274690] text-[10px] font-extrabold border border-blue-100">
                      {template.category}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-600">{template.version}</td>
                  <td className="py-3.5 px-4">
                    <Badge
                      className={`text-[10px] font-extrabold ${
                        template.status === "Active"
                          ? "bg-emerald-100 text-emerald-800"
                          : template.status === "Draft"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {template.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-purple-700 font-bold">
                    {template.variables.length > 0 ? template.variables.map((v) => `{{${v}}}`).join(", ") : "None"}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">{template.updatedAt}</td>
                  <td className="py-3.5 px-4 text-right space-x-1">
                    <button
                      onClick={() => setViewModalTemplate(template)}
                      title="View Template"
                      className="p-1.5 text-slate-500 hover:text-[#274690] hover:bg-slate-100 rounded-lg"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => setEditModalTemplate(template)}
                      title="Edit Template"
                      className="p-1.5 text-slate-500 hover:text-[#274690] hover:bg-slate-100 rounded-lg"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDuplicateTemplate(template)}
                      title="Duplicate Template"
                      className="p-1.5 text-slate-500 hover:text-[#274690] hover:bg-slate-100 rounded-lg"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id, template.name)}
                      title="Delete Template"
                      className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL 1: CREATE TEMPLATE */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-xl w-full rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Terminal size={18} className="text-[#274690]" /> Create Prompt Template
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Template Name</label>
                <Input
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="e.g. Master Services Agreement Evaluator"
                  required
                  className="rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full rounded-xl p-2.5 border border-slate-200 bg-white font-medium focus:outline-none"
                  >
                    {categories.filter((c) => c !== "All").map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Initial Status</label>
                  <Input value="Active" readOnly className="rounded-xl bg-slate-50 border-slate-200" />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <Input
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Brief description of what this prompt instructs AI to perform..."
                  className="rounded-xl"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Prompt Instructions & Field Tokens</label>
                  <span className="text-[11px] text-purple-700 font-bold">Use {"{{variable_name}}"} for placeholders</span>
                </div>
                <textarea
                  value={newPromptText}
                  onChange={(e) => setNewPromptText(e.target.value)}
                  required
                  rows={5}
                  placeholder="Analyze document {{document_name}} and extract terms for party {{party_name}}..."
                  className="w-full rounded-xl text-xs p-3 font-mono border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#274690] bg-slate-900 text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-xl px-5">
                  Save & Publish Template
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: VIEW TEMPLATE */}
      {viewModalTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">{viewModalTemplate.name}</h3>
                <p className="text-xs text-slate-500 font-mono">ID: {viewModalTemplate.id} • Version: {viewModalTemplate.version}</p>
              </div>
              <button onClick={() => setViewModalTemplate(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-[#274690] font-bold">{viewModalTemplate.category}</Badge>
                <Badge className="bg-emerald-100 text-emerald-800 font-bold">{viewModalTemplate.status}</Badge>
              </div>

              <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                {viewModalTemplate.description}
              </p>

              <div>
                <p className="font-bold text-slate-800 mb-1">Prompt Instructions:</p>
                <pre className="bg-slate-950 text-emerald-400 p-4 rounded-xl text-[11px] font-mono whitespace-pre-wrap border border-slate-800">
                  {viewModalTemplate.promptText}
                </pre>
              </div>

              {viewModalTemplate.variables.length > 0 && (
                <div>
                  <p className="font-bold text-slate-800 mb-1">Detected Variables / Tokens:</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {viewModalTemplate.variables.map((v, idx) => (
                      <span key={idx} className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-100">
              <Button onClick={() => setViewModalTemplate(null)} className="bg-[#274690] text-white rounded-xl text-xs font-bold">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT TEMPLATE */}
      {editModalTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-xl w-full rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Edit Prompt Template</h3>
              <button onClick={() => setEditModalTemplate(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateTemplate} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Template Name</label>
                <Input
                  value={editModalTemplate.name}
                  onChange={(e) => setEditModalTemplate({ ...editModalTemplate, name: e.target.value })}
                  required
                  className="rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={editModalTemplate.category}
                    onChange={(e) => setEditModalTemplate({ ...editModalTemplate, category: e.target.value as any })}
                    className="w-full rounded-xl p-2.5 border border-slate-200 bg-white"
                  >
                    {categories.filter((c) => c !== "All").map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status</label>
                  <select
                    value={editModalTemplate.status}
                    onChange={(e) => setEditModalTemplate({ ...editModalTemplate, status: e.target.value as any })}
                    className="w-full rounded-xl p-2.5 border border-slate-200 bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Draft">Draft</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <Input
                  value={editModalTemplate.description}
                  onChange={(e) => setEditModalTemplate({ ...editModalTemplate, description: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Prompt Text</label>
                <textarea
                  value={editModalTemplate.promptText}
                  onChange={(e) => setEditModalTemplate({ ...editModalTemplate, promptText: e.target.value })}
                  required
                  rows={5}
                  className="w-full rounded-xl text-xs p-3 font-mono border border-slate-200 bg-slate-900 text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setEditModalTemplate(null)} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-xl">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
