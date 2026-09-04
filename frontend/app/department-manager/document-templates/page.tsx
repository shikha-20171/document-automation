"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Layout,
  Plus,
  Search,
  Copy,
  Sparkles,
  FileText,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Eye,
  Trash2,
  Edit,
  Sliders,
  Check,
  Download,
  Calendar,
  Layers,
  ArrowRight,
  Archive,
  Power,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { templatesApi } from "@/services/templatesApi";
import { documentsApi } from "@/services/documentsApi";

type TemplateItem = {
  id: string;
  name: string;
  description?: string;
  documentType: string;
  category: string;
  createdBy: string;
  usageCount: number;
  lastUsed: string;
  status: "ACTIVE" | "ARCHIVED" | "INACTIVE" | string;
  updatedDate: string;
  fields: string[];
  fieldDefinitions?: Array<{ name: string; label: string; type: string; required: boolean }>;
  template_body: string;
};

export default function DepartmentManagerTemplatesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successToast, setSuccessToast] = useState("");

  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUseModalOpen, setIsUseModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);

  // Create / Edit Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState("Memo");
  const [newCategory, setNewCategory] = useState("Finance");
  const [newStatus, setNewStatus] = useState("ACTIVE");
  const [newFields, setNewFields] = useState("vendor_name, invoice_no, total_amount, approver_name");
  const [newBody, setNewBody] = useState(
    "DEPARTMENT APPROVAL MEMO\nVendor: {{vendor_name}}\nInvoice Ref: {{invoice_no}}\nAmount Approved: Rs. {{total_amount}}\nManager Sign-off: {{approver_name}}"
  );

  // Fill & Use Form State
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [generatedDraft, setGeneratedDraft] = useState("");
  const [generationStep, setGenerationStep] = useState<"FILL" | "REVIEW">("FILL");

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 4000);
  };

  const fetchTemplates = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await templatesApi.getTemplates({
        search: searchQuery,
        category: categoryFilter,
        type: typeFilter,
        status: statusFilter,
      }, "/department-manager/templates");
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
  }, [searchQuery, categoryFilter, typeFilter, statusFilter]);

  const handleOpenCreate = (tmpl?: TemplateItem) => {
    if (tmpl) {
      setEditingId(tmpl.id);
      setNewName(tmpl.name);
      setNewDesc(tmpl.description || "");
      setNewType(tmpl.documentType);
      setNewCategory(tmpl.category);
      setNewStatus(tmpl.status);
      setNewFields(tmpl.fields.join(", "));
      setNewBody(tmpl.template_body);
    } else {
      setEditingId(null);
      setNewName("");
      setNewDesc("");
      setNewType("Memo");
      setNewCategory("Finance");
      setNewStatus("ACTIVE");
      setNewFields("vendor_name, invoice_no, total_amount, approver_name");
      setNewBody(
        "DEPARTMENT APPROVAL MEMO\nVendor: {{vendor_name}}\nInvoice Ref: {{invoice_no}}\nAmount: Rs. {{total_amount}}\nSign-off: {{approver_name}}"
      );
    }
    setIsCreateModalOpen(true);
  };

  const handleSaveTemplate = async () => {
    if (!newName.trim() || !newBody.trim()) {
      setError("Template name and body are required.");
      return;
    }
    setError("");
    try {
      const fieldsList = newFields.split(",").map((s) => s.trim()).filter(Boolean);
      if (editingId) {
        await templatesApi.updateTemplate(editingId, {
          name: newName,
          description: newDesc,
          documentType: newType,
          category: newCategory,
          status: newStatus,
          fields: fieldsList,
          templateBody: newBody,
        }, "/department-manager/templates");
        showToast("Template updated successfully!");
      } else {
        await templatesApi.createTemplate({
          name: newName,
          description: newDesc,
          documentType: newType,
          category: newCategory,
          status: newStatus,
          fields: fieldsList,
          templateBody: newBody,
        }, "/department-manager/templates");
        showToast("Template blueprint created!");
      }
      setIsCreateModalOpen(false);
      void fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save template.");
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await templatesApi.duplicateTemplate(id, "/department-manager/templates");
      showToast("Template duplicated successfully!");
      void fetchTemplates();
    } catch {
      setError("Failed to duplicate template.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this department template?")) return;
    try {
      await templatesApi.deleteTemplate(id, "/department-manager/templates");
      showToast("Template deleted.");
      void fetchTemplates();
    } catch {
      setError("Failed to delete template.");
    }
  };

  const handleToggleStatus = async (tmpl: TemplateItem) => {
    const nextStatus = tmpl.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await templatesApi.updateTemplate(tmpl.id, { status: nextStatus }, "/department-manager/templates");
      showToast(`Template set to ${nextStatus}.`);
      void fetchTemplates();
    } catch {
      setError("Failed to update status.");
    }
  };

  const handleOpenUse = (tmpl: TemplateItem) => {
    setSelectedTemplate(tmpl);
    const initial: Record<string, string> = {};
    tmpl.fields.forEach((f) => (initial[f] = ""));
    setFormValues(initial);
    setGenerationStep("FILL");
    setIsUseModalOpen(true);
  };

  const handleGenerateFromTemplate = () => {
    if (!selectedTemplate) return;
    let content = selectedTemplate.template_body;
    Object.entries(formValues).forEach(([key, val]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      content = content.replace(regex, val || `[${key}]`);
    });
    setGeneratedDraft(content);
    setGenerationStep("REVIEW");
  };

  const handleSaveDraftAsDocument = async (submitApproval = false) => {
    if (!selectedTemplate) return;
    try {
      await documentsApi.createDocument({
        name: `${selectedTemplate.name} - ${new Date().toLocaleDateString().replace(/\//g, "-")}.pdf`,
        type: selectedTemplate.documentType,
        category: selectedTemplate.category,
        description: `Generated from template "${selectedTemplate.name}"`,
        content: generatedDraft,
        status: submitApproval ? "SUBMITTED_FOR_APPROVAL" : "CREATED",
        submitApproval,
      }, "/department-manager/documents");
      showToast(submitApproval ? "Document created & submitted for approval!" : "Document created successfully!");
      setIsUseModalOpen(false);
    } catch {
      setError("Failed to create document from template.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-16 font-sans text-slate-800">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Document Templates</h1>
            <Badge className="bg-[#274690]/10 text-[#274690] text-xs font-bold">Blueprints</Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500">Create, customize, and generate repetitive department documents from dynamic blueprints.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/department-manager/ai-tools/document-generator">
            <Button variant="outline" size="sm" className="text-xs font-bold text-[#c96f4a] border-[#c96f4a]/30 hover:bg-orange-50">
              <Sparkles size={14} className="mr-1.5" /> AI Template Fill
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={() => handleOpenCreate()}
            className="bg-[#274690] text-xs font-bold text-white hover:bg-[#1f3770] shadow-sm"
          >
            <Plus size={14} className="mr-1.5" /> Create Template
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {successToast && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 shadow-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-800 shadow-sm">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search & Filters */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-12">
          <div className="relative md:col-span-4">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates by title or variable..."
              className="pl-9 h-10 rounded-xl text-xs font-semibold"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
            >
              <option value="">All Categories</option>
              <option value="Finance">Finance</option>
              <option value="Legal">Legal</option>
              <option value="Operations">Operations</option>
              <option value="Compliance">Compliance</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
            >
              <option value="">All Document Types</option>
              <option value="Memo">Approval Memo</option>
              <option value="Contract">Contract</option>
              <option value="Policy">Policy</option>
              <option value="Invoice">Invoice</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </section>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            <RefreshCw className="mx-auto h-6 w-6 animate-spin text-[#274690]" />
            <p className="mt-2 text-xs font-bold">Loading department templates...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            <Layout size={36} className="mx-auto text-slate-300" />
            <p className="mt-2 text-sm font-bold text-slate-700">No templates found.</p>
            <p className="text-xs text-slate-400">Create your first department blueprint using the button above.</p>
          </div>
        ) : (
          templates.map((tmpl) => (
            <div
              key={tmpl.id}
              className="group flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:border-[#274690]/40 hover:shadow-md"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-black text-slate-900 group-hover:text-[#274690] transition">
                      {tmpl.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">{tmpl.category} • {tmpl.documentType}</p>
                  </div>
                  <Badge className={`text-[10px] font-bold ${
                    tmpl.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                  }`}>
                    {tmpl.status}
                  </Badge>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2">{tmpl.description || "Department blueprint"}</p>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 font-mono text-[11px] leading-relaxed text-slate-700 line-clamp-3">
                  {tmpl.template_body}
                </div>

                {/* Variable Pills */}
                {tmpl.fields && tmpl.fields.length > 0 && (
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400">Variables:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {tmpl.fields.map((f, idx) => (
                        <span
                          key={idx}
                          className="rounded-md bg-blue-50 px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#274690]"
                        >
                          {`{{${f}}}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] text-slate-400 font-mono">
                  <span>Used {tmpl.usageCount} times</span>
                  <span>Last: {tmpl.lastUsed}</span>
                </div>
              </div>

              {/* Template Card Action Buttons */}
              <div className="mt-4 border-t border-slate-100 pt-4 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedTemplate(tmpl);
                      setIsPreviewModalOpen(true);
                    }}
                    className="h-8 w-8 p-0 text-slate-600 hover:text-[#274690]"
                  >
                    <Eye size={13} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenCreate(tmpl)}
                    className="h-8 w-8 p-0 text-slate-600 hover:text-[#274690]"
                  >
                    <Edit size={13} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDuplicate(tmpl.id)}
                    className="h-8 w-8 p-0 text-slate-600 hover:text-[#c96f4a]"
                  >
                    <Copy size={13} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(tmpl)}
                    className="h-8 w-8 p-0 text-slate-600 hover:text-emerald-600"
                  >
                    <Power size={13} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(tmpl.id)}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>

                <Button
                  size="sm"
                  onClick={() => handleOpenUse(tmpl)}
                  className="bg-[#274690] text-xs font-bold text-white hover:bg-[#1f3770]"
                >
                  Use Template
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE / EDIT TEMPLATE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                {editingId ? "Edit Department Template" : "Create New Template Blueprint"}
              </h3>
              <button type="button" onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-black uppercase text-slate-500">Template Title *</label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Employee Induction Agreement"
                  className="mt-1 rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-500">Document Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
                  >
                    <option value="Memo">Approval Memo</option>
                    <option value="Contract">Contract</option>
                    <option value="Policy">Policy</option>
                    <option value="Invoice">Invoice</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-500">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
                  >
                    <option value="Finance">Finance</option>
                    <option value="Legal">Legal</option>
                    <option value="Operations">Operations</option>
                    <option value="Compliance">Compliance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-500">Comma-separated Dynamic Variables</label>
                <Input
                  value={newFields}
                  onChange={(e) => setNewFields(e.target.value)}
                  placeholder="employee_name, joining_date, department, salary"
                  className="mt-1 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-500">Description</label>
                <Input
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Brief description of this blueprint..."
                  className="mt-1 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-500">Template Body (use {"{{variable_name}}"})</label>
                <textarea
                  rows={6}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 font-mono text-xs text-slate-800 focus:border-[#274690] focus:bg-white focus:outline-none"
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)} className="text-xs font-bold">
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveTemplate} className="bg-[#274690] text-xs font-bold text-white hover:bg-[#1f3770]">
                Save Blueprint
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* USE TEMPLATE MODAL (FILL FIELDS → REVIEW → CREATE DOC) */}
      {isUseModalOpen && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Generate from {selectedTemplate.name}</h3>
                <p className="text-xs text-slate-400">Step {generationStep === "FILL" ? "1: Fill Variable Inputs" : "2: Review & Save Document"}</p>
              </div>
              <button type="button" onClick={() => setIsUseModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {generationStep === "FILL" ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">Enter field values to populate this department document blueprint.</p>
                {selectedTemplate.fields.map((f) => (
                  <div key={f}>
                    <label className="text-[11px] font-black uppercase text-slate-500">{f.replace(/_/g, " ")} *</label>
                    <Input
                      value={formValues[f] || ""}
                      onChange={(e) => setFormValues({ ...formValues, [f]: e.target.value })}
                      placeholder={`Enter ${f.replace(/_/g, " ")}...`}
                      className="mt-1 rounded-xl text-xs font-semibold"
                    />
                  </div>
                ))}

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <Button variant="outline" size="sm" onClick={() => setIsUseModalOpen(false)} className="text-xs font-bold">
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleGenerateFromTemplate} className="bg-[#274690] text-xs font-bold text-white hover:bg-[#1f3770]">
                    Generate Document Preview <ArrowRight size={13} className="ml-1" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-500">Live Generated Document Draft</label>
                  <textarea
                    rows={8}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-4 font-mono text-xs text-slate-800 leading-relaxed focus:border-[#274690] focus:bg-white focus:outline-none"
                    value={generatedDraft}
                    onChange={(e) => setGeneratedDraft(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <Button variant="ghost" size="sm" onClick={() => setGenerationStep("FILL")} className="text-xs font-bold">
                    Back to Inputs
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSaveDraftAsDocument(false)}
                      className="text-xs font-bold text-slate-700"
                    >
                      Save as Draft
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleSaveDraftAsDocument(true)}
                      className="bg-[#274690] text-xs font-bold text-white hover:bg-[#1f3770]"
                    >
                      Create & Submit for Approval
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PREVIEW TEMPLATE MODAL */}
      {isPreviewModalOpen && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">{selectedTemplate.name}</h3>
              <button type="button" onClick={() => setIsPreviewModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
              {selectedTemplate.template_body}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" onClick={() => { setIsPreviewModalOpen(false); handleOpenUse(selectedTemplate); }} className="bg-[#274690] text-xs font-bold text-white hover:bg-[#1f3770]">
                Use This Template
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}