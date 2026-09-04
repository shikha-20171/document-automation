"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Copy,
  Search,
  Plus,
  FileText,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sparkles,
  Layers,
  Check,
  X,
  Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { templatesApi } from "@/services/templatesApi";

export default function TeamLeaderDocumentTemplatesPage() {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [successToast, setSuccessToast] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Use Template Modal
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [docName, setDocName] = useState("");
  const [fieldInputs, setFieldInputs] = useState<Record<string, string>>({});
  const [assignTarget, setAssignTarget] = useState("Team Leader");

  // Create Team Template Modal
  const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false);
  const [newTmplName, setNewTmplName] = useState("");
  const [newTmplType, setNewTmplType] = useState("LEGAL_CONTRACT");
  const [newTmplDesc, setNewTmplDesc] = useState("");
  const [newTmplFields, setNewTmplFields] = useState("Client Name, Effective Date, Total Value, Payment Terms");

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 4000);
  };

  const fetchTemplates = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await templatesApi.getTemplates({ search: searchQuery }, "/team-leader/templates");
      if (res?.data) {
        setTemplates(res.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load templates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTemplates();
  }, []);

  const handleOpenUseTemplate = (tmpl: any) => {
    setSelectedTemplate(tmpl);
    setDocName(`${tmpl.name} - ${new Date().toISOString().split("T")[0]}`);
    const initialFields: Record<string, string> = {};
    (tmpl.fields || []).forEach((f: string) => {
      initialFields[f] = "";
    });
    setFieldInputs(initialFields);
  };

  const handleUseTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate || !docName.trim()) return;
    try {
      const res = await templatesApi.createDocFromTemplate({
        templateId: selectedTemplate.id,
        documentName: docName.trim(),
        fieldValues: fieldInputs,
        assignedTo: assignTarget,
      });
      showToast(res?.message || `Document created from ${selectedTemplate.name}!`);
      setSelectedTemplate(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate document.");
    }
  };

  const handleCreateTeamTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTmplName.trim()) return;
    try {
      const fields = newTmplFields.split(",").map((f) => f.trim()).filter(Boolean);
      const res = await templatesApi.createTemplate({
        name: newTmplName.trim(),
        type: newTmplType,
        description: newTmplDesc.trim(),
        fields,
      }, "/team-leader/templates");
      showToast(res?.message || "Team template created!");
      setIsCreateTemplateOpen(false);
      setNewTmplName("");
      setNewTmplDesc("");
      void fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create team template.");
    }
  };

  const filteredTemplates = useMemo(() => {
    let list = [...templates];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }
    if (typeFilter !== "ALL") {
      list = list.filter((t) => t.type === typeFilter);
    }
    return list;
  }, [templates, searchQuery, typeFilter]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-20 font-sans text-slate-800">
      {/* 1. HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-[#274690] sm:text-3xl">Document Templates</h1>
            <Badge className="bg-[#c96f4a]/10 text-[#c96f4a] border-[#c96f4a]/30 text-xs font-black px-2.5 py-0.5">
              Team & Standard Library
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-semibold">
            Use standard organization blueprints or create custom team-level operational templates
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            onClick={() => setIsCreateTemplateOpen(true)}
            className="h-10 rounded-xl bg-[#274690] px-4 text-xs font-black text-white hover:bg-[#1f3561] shadow-sm gap-1.5"
          >
            <Plus size={15} /> Create Team Template
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {successToast && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 shadow-sm animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-800 shadow-sm animate-in fade-in">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. SEARCH & FILTER */}
      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates by title or keywords..."
            className="pl-10 h-10 rounded-2xl text-xs font-semibold focus:border-[#274690]"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 focus:border-[#274690] focus:outline-none"
        >
          <option value="ALL">All Types</option>
          <option value="LEGAL_CONTRACT">Legal Contracts</option>
          <option value="INVOICE">Invoices & Finance</option>
          <option value="PURCHASE_ORDER">Purchase Orders</option>
        </select>
      </div>

      {/* 3. TEMPLATES GRID */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-2">
        {filteredTemplates.map((tmpl) => (
          <div
            key={tmpl.id}
            className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:border-[#c96f4a]/40 hover:shadow-md space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#274690]/10 text-[#274690] font-bold">
                    <Copy size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">{tmpl.name}</h3>
                    <p className="text-[10px] font-bold text-slate-400">{tmpl.category} • {tmpl.type}</p>
                  </div>
                </div>
                <Badge
                  className={`text-[9px] font-black ${
                    tmpl.scope === "ORGANISATION"
                      ? "bg-[#274690]/10 text-[#274690] border-[#274690]/20"
                      : "bg-[#c96f4a]/10 text-[#c96f4a] border-[#c96f4a]/30"
                  }`}
                >
                  {tmpl.scope === "ORGANISATION" ? "Org Standard" : "Team Template"}
                </Badge>
              </div>

              <p className="text-xs text-slate-600 font-medium leading-relaxed">{tmpl.description}</p>

              {/* Required Template Fields */}
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Configured Fields:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(tmpl.fields || []).map((f: string, i: number) => (
                    <span key={i} className="rounded-lg bg-[#274690]/5 px-2 py-0.5 text-[10px] font-bold text-[#274690]">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold text-slate-500">
              <span>Used {tmpl.usageCount} times</span>
              <Button
                size="sm"
                onClick={() => handleOpenUseTemplate(tmpl)}
                className="h-9 rounded-xl bg-[#c96f4a] text-xs font-black text-white hover:bg-[#b05835] gap-1.5"
              >
                <Sparkles size={13} className="text-amber-200" /> Use Template
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* 4. USE TEMPLATE MODAL */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-[#274690]/20 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-[#274690]">Generate Document from Template</h3>
                <p className="text-xs font-semibold text-[#c96f4a]">{selectedTemplate.name}</p>
              </div>
              <button type="button" onClick={() => setSelectedTemplate(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUseTemplateSubmit} className="space-y-3.5 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label className="text-[11px] font-black uppercase text-slate-600">Document Name *</label>
                <Input
                  required
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="mt-1 h-10 rounded-xl text-xs font-semibold focus:border-[#274690]"
                />
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-600">Assign Initial Reviewer</label>
                <select
                  value={assignTarget}
                  onChange={(e) => setAssignTarget(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800"
                >
                  <option value="Team Leader">Team Leader (Me)</option>
                  <option value="Aakash Verma">Aakash Verma (Senior Analyst)</option>
                  <option value="Priya Sharma">Priya Sharma (Legal Associate)</option>
                  <option value="Rohan Das">Rohan Das (Doc Specialist)</option>
                  <option value="Neha Kapoor">Neha Kapoor (Ops Executive)</option>
                </select>
              </div>

              {/* Dynamic Field Inputs */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <h4 className="text-[11px] font-black uppercase text-slate-400">Template Dynamic Parameters:</h4>
                {(selectedTemplate.fields || []).map((f: string) => (
                  <div key={f}>
                    <label className="text-[10px] font-bold text-slate-600">{f}</label>
                    <Input
                      value={fieldInputs[f] || ""}
                      onChange={(e) => setFieldInputs({ ...fieldInputs, [f]: e.target.value })}
                      placeholder={`Enter ${f}...`}
                      className="mt-0.5 h-9 rounded-xl text-xs font-semibold focus:border-[#274690]"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setSelectedTemplate(null)} className="rounded-xl">
                  Cancel
                </Button>
                <Button size="sm" type="submit" className="rounded-xl bg-[#274690] text-xs font-black text-white hover:bg-[#1f3561]">
                  Create Document
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. CREATE TEAM TEMPLATE MODAL */}
      {isCreateTemplateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-[#274690]/20 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-[#274690]">Create Team-Level Template</h3>
              <button type="button" onClick={() => setIsCreateTemplateOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTeamTemplateSubmit} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-black uppercase text-slate-600">Template Title *</label>
                <Input
                  required
                  value={newTmplName}
                  onChange={(e) => setNewTmplName(e.target.value)}
                  placeholder="e.g. Weekly Vendor Ledger Verification Sheet"
                  className="mt-1 h-10 rounded-xl text-xs font-semibold focus:border-[#274690]"
                />
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-600">Document Type</label>
                <select
                  value={newTmplType}
                  onChange={(e) => setNewTmplType(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold"
                >
                  <option value="LEGAL_CONTRACT">Legal Contract</option>
                  <option value="INVOICE">Invoice Reconciliation</option>
                  <option value="PURCHASE_ORDER">Purchase Order</option>
                  <option value="FINANCIAL_REPORT">Financial Report</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-600">Description</label>
                <textarea
                  value={newTmplDesc}
                  onChange={(e) => setNewTmplDesc(e.target.value)}
                  placeholder="Explain the purpose and routine usage of this template..."
                  className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-xs font-semibold focus:border-[#274690] focus:outline-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-600">Template Fields (comma-separated)</label>
                <Input
                  value={newTmplFields}
                  onChange={(e) => setNewTmplFields(e.target.value)}
                  placeholder="Field 1, Field 2, Field 3"
                  className="mt-1 h-10 rounded-xl text-xs font-semibold focus:border-[#274690]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsCreateTemplateOpen(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button size="sm" type="submit" className="rounded-xl bg-[#274690] text-xs font-black text-white hover:bg-[#1f3561]">
                  Save Template
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
