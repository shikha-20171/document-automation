"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutTemplate,
  Search,
  Filter,
  Plus,
  Sparkles,
  Eye,
  FilePlus,
  Copy,
  Edit3,
  Trash2,
  CheckCircle2,
  X,
  FileText,
  Clock,
  User,
  Building2,
  Calendar,
  Layers,
  ChevronRight,
  ArrowRight,
  Send,
  Save,
  Tag,
  Hash,
  List,
  ListOrdered,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Table as TableIcon,
  CheckSquare,
  PenTool,
  Sliders,
  Check,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { templatesApi } from "@/services/templatesApi";

export default function DocumentTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"MY_TEMPLATES" | "SHARED" | "ALL">("MY_TEMPLATES");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<string[]>([
    "HR",
    "Finance",
    "Legal",
    "Sales",
    "Operations",
    "General",
  ]);
  const [toast, setToast] = useState<string | null>(null);

  // Template Editor Modal State (Create / Edit)
  const [editorOpen, setEditorOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateCategory, setTemplateCategory] = useState("HR");
  const [customCategoryInput, setCustomCategoryInput] = useState("");
  const [templateDesc, setTemplateDesc] = useState("");
  const [templateContent, setTemplateContent] = useState("");
  const [customVarInput, setCustomVarInput] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);

  // AI Generator Modal State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiCategory, setAiCategory] = useState("HR");
  const [aiGenerating, setAiGenerating] = useState(false);

  // Template Preview Modal State
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);

  // Use Template (Document Generator) Modal State
  const [useModalOpen, setUseModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [customDocName, setCustomDocName] = useState("");
  const [generatingDoc, setGeneratingDoc] = useState(false);

  // Pre-set standard variables to quickly insert
  const quickVariables = [
    { label: "Employee Name", key: "employee_name" },
    { label: "Designation", key: "designation" },
    { label: "Department", key: "department" },
    { label: "Joining Date", key: "joining_date" },
    { label: "Organization Name", key: "organization_name" },
    { label: "Manager Name", key: "manager_name" },
    { label: "Annual CTC / Salary", key: "salary_ctc" },
    { label: "Document Number", key: "document_number" },
    { label: "Address", key: "address" },
    { label: "Today's Date", key: "today_date" },
  ];

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await templatesApi.getTemplates({
        tab: activeTab,
        category: categoryFilter,
        search,
      });
      if (res?.data) {
        setTemplates(res.data.templates || []);
        if (res.data.categories && res.data.categories.length > 0) {
          setCategories(res.data.categories);
        }
      }
    } catch (err: any) {
      console.error("Failed to load templates:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTemplates();
  }, [activeTab, categoryFilter, search]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Open Create Template Editor
  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setTemplateName("");
    setTemplateCategory("HR");
    setCustomCategoryInput("");
    setTemplateDesc("");
    setTemplateContent(`EMPLOYEE JOINING LETTER

Employee Name: {{employee_name}}
Designation: {{designation}}
Department: {{department}}
Joining Date: {{joining_date}}

Dear {{employee_name}},

We are pleased to welcome you to {{organization_name}} as a {{designation}} in the {{department}} department.

Your joining date will be {{joining_date}}. You will be reporting directly to {{manager_name}}.

Sincerely,
{{manager_name}}
{{organization_name}}`);
    setEditorOpen(true);
  };

  // Open Edit Template Editor
  const handleOpenEdit = (tmpl: any) => {
    setIsEditing(true);
    setEditingId(tmpl.id);
    setTemplateName(tmpl.name);
    setTemplateCategory(tmpl.category || "General");
    setCustomCategoryInput("");
    setTemplateDesc(tmpl.description || "");
    setTemplateContent(tmpl.contentTemplate || "");
    setEditorOpen(true);
  };

  // Insert Variable into template text
  const handleInsertVariable = (varKey: string) => {
    const formatted = `{{${varKey}}}`;
    setTemplateContent((prev) => prev + " " + formatted);
  };

  // Add custom variable
  const handleAddCustomVar = () => {
    if (!customVarInput.trim()) return;
    const cleanKey = customVarInput.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    handleInsertVariable(cleanKey);
    setCustomVarInput("");
  };

  // Insert formatting block
  const handleInsertBlock = (blockType: string) => {
    let block = "";
    switch (blockType) {
      case "h1":
        block = "\n\n# SECTION TITLE\n";
        break;
      case "h2":
        block = "\n\n## Sub-Section Title\n";
        break;
      case "table":
        block = "\n\n| Item Description | Quantity | Rate (INR) | Total |\n| --- | --- | --- | --- |\n| Service Item 1 | 1 | 50,000 | 50,000 |\n";
        break;
      case "checkbox":
        block = "\n- [ ] Task Requirement Verified\n- [ ] Identity & Credentials Checked\n- [ ] Manager Approval Signed\n";
        break;
      case "signature":
        block = "\n\nAUTHORIZED SIGNATORY:\nName: {{manager_name}}\nDesignation: Department Lead\nSignature: _______________________\nDate: {{today_date}}\n";
        break;
      case "divider":
        block = "\n\n------------------------------------------------------------\n\n";
        break;
    }
    setTemplateContent((prev) => prev + block);
  };

  // Save Template (Create or Update)
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim() || !templateContent.trim()) {
      alert("Please provide both Template Name and Content.");
      return;
    }

    setSavingTemplate(true);
    const finalCategory =
      templateCategory === "CUSTOM" ? customCategoryInput.trim() || "General" : templateCategory;

    try {
      if (isEditing && editingId) {
        await templatesApi.updateTemplate(editingId, {
          name: templateName.trim(),
          category: finalCategory,
          description: templateDesc.trim(),
          contentTemplate: templateContent,
        });
        showToast(`Template '${templateName}' updated with new version!`);
      } else {
        await templatesApi.createTemplate({
          name: templateName.trim(),
          category: finalCategory,
          description: templateDesc.trim(),
          contentTemplate: templateContent,
        });
        showToast(`New template '${templateName}' saved permanently to library!`);
      }
      setEditorOpen(false);
      fetchTemplates();
    } catch (err: any) {
      alert("Failed to save template: " + err.message);
    }
    setSavingTemplate(false);
  };

  // Duplicate Template
  const handleDuplicate = async (tmpl: any) => {
    try {
      await templatesApi.duplicateTemplate(tmpl.id);
      showToast(`Duplicated '${tmpl.name}'! You can now customize your copy.`);
      fetchTemplates();
    } catch (err: any) {
      alert("Failed to duplicate template: " + err.message);
    }
  };

  // Delete Template
  const handleDelete = async (tmpl: any) => {
    if (!confirm(`Are you sure you want to delete template '${tmpl.name}'?`)) return;
    try {
      await templatesApi.deleteTemplate(tmpl.id);
      showToast(`Template '${tmpl.name}' deleted.`);
      fetchTemplates();
    } catch (err: any) {
      alert("Failed to delete template: " + err.message);
    }
  };

  // Run AI Generator
  const handleRunAiGenerator = async () => {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    try {
      const res = await templatesApi.generateAiTemplate({
        prompt: aiPrompt.trim(),
        category: aiCategory,
      });

      if (res?.data) {
        setTemplateName(res.data.name || "AI Generated Template");
        setTemplateCategory(res.data.category || aiCategory);
        setTemplateDesc(res.data.description || `Generated from prompt: ${aiPrompt}`);
        setTemplateContent(res.data.contentTemplate || "");
        setIsEditing(false);
        setEditingId(null);
        setAiModalOpen(false);
        setEditorOpen(true);
        showToast("AI template drafted! Review and customize before saving.");
      }
    } catch (err: any) {
      alert("AI Generation failed: " + err.message);
    }
    setAiGenerating(false);
  };

  // Open "Use Template" Modal
  const handleOpenUseTemplate = (tmpl: any) => {
    setSelectedTemplate(tmpl);

    // Extract placeholders from template text
    const foundVars = (tmpl.contentTemplate.match(/{{([a-zA-Z0-9_]+)}}/g) || []).map((v: string) =>
      v.replace(/[{}]/g, "")
    );
    const uniqueVars: string[] = Array.from(new Set(foundVars));

    const initialValues: Record<string, string> = {};
    uniqueVars.forEach((v) => {
      if (v === "today_date") initialValues[v] = new Date().toISOString().split("T")[0];
      else if (v === "organization_name") initialValues[v] = "DocuCore AI Corp";
      else initialValues[v] = "";
    });

    setFieldValues(initialValues);
    setCustomDocName(`${tmpl.name.replace(/\s+/g, "_")}_${Date.now().toString().slice(-4)}.docx`);
    setUseModalOpen(true);
  };

  // Generate Document Instance from filled variables
  const handleGenerateDocumentInstance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;
    setGeneratingDoc(true);

    try {
      await templatesApi.generateDocumentFromTemplate(
        selectedTemplate.id,
        fieldValues,
        customDocName.trim()
      );
      showToast(`Document instance '${customDocName}' generated & saved to My Documents!`);
      setUseModalOpen(false);
      setTimeout(() => router.push("/employee/documents"), 1200);
    } catch (err: any) {
      alert("Failed to generate document: " + err.message);
    }
    setGeneratingDoc(false);
  };

  // Render live preview of replaced document text
  const getLiveReplacedContent = () => {
    if (!selectedTemplate) return "";
    let content = selectedTemplate.contentTemplate || "";
    Object.keys(fieldValues).forEach((key) => {
      const val = fieldValues[key];
      const regex = new RegExp(`{{${key}}}`, "g");
      content = content.replace(regex, val || `[${key}]`);
    });
    return content;
  };

  // Detected variables in current editor
  const detectedVariablesInEditor = Array.from(
    new Set((templateContent.match(/{{([a-zA-Z0-9_]+)}}/g) || []).map((v) => v.replace(/[{}]/g, "")))
  );

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#274690]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#274690] border border-[#274690]/20">
              Reusable Schema Library
            </span>
            <span className="text-xs text-slate-400">Create, customize & generate documents</span>
          </div>
          <h1 className="mt-1 text-xl font-black text-slate-800 sm:text-2xl">Document Templates</h1>
          <p className="mt-1 text-xs text-slate-500">
            Build reusable template blueprints with dynamic placeholders, generate standardized letters instantly, or draft with AI.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setAiModalOpen(true)}
            className="flex items-center gap-2 rounded-2xl border border-[#c96f4a]/30 bg-[#c96f4a]/10 px-4 py-2.5 text-xs font-bold text-[#c96f4a] shadow-sm hover:bg-[#c96f4a]/20 transition active:scale-95"
          >
            <Sparkles size={15} />
            <span>Generate with AI</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 rounded-2xl bg-[#274690] px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#274690]/25 transition hover:brightness-110 active:scale-95"
          >
            <Plus size={16} />
            <span>Create Template</span>
          </button>
        </div>
      </div>

      {/* Toast Notification Alert */}
      {toast && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      {/* 2. Reusable Blueprint Info Card */}
      <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-md">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#274690]/10 text-[#274690]">
              <LayoutTemplate size={20} />
            </div>
            <div>
              <div className="font-bold text-slate-800">
                Template Workflow: Create Once → Fill Variables → Reuse Anytime
              </div>
              <div className="text-slate-500 text-[11px]">
                Templates maintain original reusable structures (`{`{employee_name}`}`, `{`{joining_date}`}`). Generating creates concrete document instances in My Documents.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">
              {templates.length} Active Templates
            </span>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs, Search & Filters */}
      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200/80 bg-white/80 p-3 shadow-sm backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Tabs (My Templates / Shared / All) */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveTab("MY_TEMPLATES")}
            className={`rounded-2xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "MY_TEMPLATES"
                ? "bg-[#274690] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            My Templates
          </button>
          <button
            onClick={() => setActiveTab("SHARED")}
            className={`rounded-2xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "SHARED"
                ? "bg-[#274690] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Shared Templates
          </button>
          <button
            onClick={() => setActiveTab("ALL")}
            className={`rounded-2xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "ALL"
                ? "bg-[#274690] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            All Templates
          </button>
        </div>

        {/* Right: Search & Category Dropdown */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1 sm:w-64">
            <Search size={15} className="absolute left-3.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-9 pr-3.5 py-1.5 text-xs text-slate-800 outline-none focus:border-[#274690] focus:bg-white"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-[#274690]"
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Template Library Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex items-center gap-3 rounded-2xl bg-white/90 p-6 shadow-xl backdrop-blur-md border border-[#274690]/10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#274690] border-t-transparent" />
            <span className="text-sm font-bold text-slate-700">Loading Templates...</span>
          </div>
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200/80 bg-white/90 p-12 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#274690]/10 text-[#274690]">
            <LayoutTemplate size={28} />
          </div>
          <h3 className="mt-4 text-base font-black text-slate-800">No Templates Found</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            You don't have any templates matching this filter. Start fresh by creating a custom template or drafting with AI.
          </p>
          <div className="mt-5 flex gap-3">
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 rounded-2xl bg-[#274690] px-4 py-2 text-xs font-bold text-white shadow-sm hover:brightness-110"
            >
              <Plus size={15} />
              <span>+ Create Template</span>
            </button>
            <button
              onClick={() => setAiModalOpen(true)}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-[#c96f4a] shadow-sm hover:bg-slate-50"
            >
              <Sparkles size={15} />
              <span>Draft with AI</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((tmpl) => {
            const varList =
              tmpl.variables ||
              (tmpl.contentTemplate?.match(/{{([a-zA-Z0-9_]+)}}/g) || []).map((v: string) =>
                v.replace(/[{}]/g, "")
              );
            const isUserOwned = tmpl.scope === "MY_TEMPLATES" || tmpl.createdBy === "Priya Sharma";

            return (
              <div
                key={tmpl.id}
                className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-sm backdrop-blur-md transition hover:-translate-y-1 hover:shadow-md hover:border-[#274690]/40"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-[#274690]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#274690] border border-[#274690]/20">
                      {tmpl.category || "General"}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        {tmpl.version || "v1.0"}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          tmpl.scope === "MY_TEMPLATES"
                            ? "bg-[#c96f4a]/10 text-[#c96f4a]"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {tmpl.scope === "MY_TEMPLATES" ? "My Template" : "Shared"}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="mt-3 text-sm font-black text-slate-800 group-hover:text-[#274690] transition">
                    {tmpl.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                    {tmpl.description || "Reusable structured document template with dynamic placeholders."}
                  </p>

                  {/* Dynamic Variables Chips */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                      <span>Dynamic Placeholders</span>
                      <span className="text-[#274690] font-black">{varList.length} Fields</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {varList.slice(0, 4).map((v: string, i: number) => (
                        <span
                          key={i}
                          className="rounded-lg bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-700"
                        >
                          {`{{${v}}}`}
                        </span>
                      ))}
                      {varList.length > 4 && (
                        <span className="rounded-lg bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-400">
                          +{varList.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPreviewTemplate(tmpl)}
                      title="Preview Schema"
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => handleDuplicate(tmpl)}
                      title="Duplicate Template"
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    >
                      <Copy size={14} />
                    </button>
                    {isUserOwned && (
                      <>
                        <button
                          onClick={() => handleOpenEdit(tmpl)}
                          title="Edit Template & Version"
                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-[#274690]"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(tmpl)}
                          title="Delete Template"
                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Primary "Use Template" CTA */}
                  <button
                    onClick={() => handleOpenUseTemplate(tmpl)}
                    className="flex items-center gap-1.5 rounded-2xl bg-[#274690] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:brightness-110 transition active:scale-95"
                  >
                    <FilePlus size={14} />
                    <span>Use Template</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. CREATE / EDIT TEMPLATE MODAL (MAIN FEATURE)                           */}
      {/* ========================================================================= */}
      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#274690] text-white">
                  <LayoutTemplate size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">
                    {isEditing ? "Edit Document Template" : "Create New Document Template"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Define reusable document blueprint with dynamic variable placeholders.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditorOpen(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: Form & Editor */}
            <form onSubmit={handleSaveTemplate} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Name & Category Row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700">Template Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Employee Joining Letter, Internship Contract..."
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#274690] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Category</label>
                  <select
                    value={templateCategory}
                    onChange={(e) => setTemplateCategory(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-[#274690]"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="CUSTOM">+ Add Custom Category...</option>
                  </select>
                </div>
              </div>

              {/* Custom Category Input if selected */}
              {templateCategory === "CUSTOM" && (
                <div className="rounded-2xl bg-amber-50/60 border border-amber-200 p-3">
                  <label className="text-xs font-bold text-amber-900">Custom Category Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Compliance, Procurement, Real Estate..."
                    value={customCategoryInput}
                    onChange={(e) => setCustomCategoryInput(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-xs outline-none focus:border-[#274690]"
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-slate-700">Description / Guidelines</label>
                <input
                  type="text"
                  placeholder="Short explanation of when to use this template..."
                  value={templateDesc}
                  onChange={(e) => setTemplateDesc(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#274690] focus:bg-white"
                />
              </div>

              {/* Toolbar: Formatting Blocks & Dynamic Variables */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 space-y-2.5">
                {/* Structural Blocks */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">Insert Blocks:</span>
                  <button
                    type="button"
                    onClick={() => handleInsertBlock("h1")}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                  >
                    <Heading1 size={13} />
                    <span>Heading</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertBlock("h2")}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                  >
                    <Heading2 size={13} />
                    <span>Subheading</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertBlock("table")}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                  >
                    <TableIcon size={13} />
                    <span>Table</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertBlock("checkbox")}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                  >
                    <CheckSquare size={13} />
                    <span>Checklist</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertBlock("signature")}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                  >
                    <PenTool size={13} />
                    <span>Signature Box</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertBlock("divider")}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                  >
                    <span>Divider</span>
                  </button>
                </div>

                {/* Quick Dynamic Variables Chips */}
                <div className="pt-2 border-t border-slate-200/70">
                  <div className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 flex items-center justify-between">
                    <span>Click to Insert Dynamic Placeholder:</span>
                    <span className="text-[#274690]">
                      {detectedVariablesInEditor.length} Placeholders In Content
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {quickVariables.map((v) => (
                      <button
                        key={v.key}
                        type="button"
                        onClick={() => handleInsertVariable(v.key)}
                        className="rounded-lg border border-[#274690]/20 bg-[#274690]/5 px-2 py-1 font-mono text-[11px] font-bold text-[#274690] hover:bg-[#274690] hover:text-white transition"
                      >
                        +{`{{${v.key}}}`}
                      </button>
                    ))}
                  </div>

                  {/* Add Custom Variable Field */}
                  <div className="mt-2.5 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Add custom placeholder name (e.g. project_code, bonus_amount)..."
                      value={customVarInput}
                      onChange={(e) => setCustomVarInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomVar();
                        }
                      }}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-[#274690]"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomVar}
                      className="rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700"
                    >
                      + Insert Custom Variable
                    </button>
                  </div>
                </div>
              </div>

              {/* Template Content Editor Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Template Content *</label>
                  <span className="text-[11px] text-slate-400">
                    Use <span className="font-mono text-[#274690] font-bold">{"{{variable_name}}"}</span> for dynamic fields
                  </span>
                </div>
                <textarea
                  rows={13}
                  required
                  value={templateContent}
                  onChange={(e) => setTemplateContent(e.target.value)}
                  placeholder="Enter template text with {{placeholders}}..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs text-slate-800 leading-relaxed outline-none focus:border-[#274690] focus:bg-white"
                />
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <HelpCircle size={14} className="text-slate-400" />
                  <span>
                    Placeholders will automatically generate fillable form fields when clicking "Use Template".
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setEditorOpen(false)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingTemplate}
                    className="flex items-center gap-2 rounded-2xl bg-[#274690] px-5 py-2 text-xs font-bold text-white shadow-sm hover:brightness-110 disabled:opacity-50"
                  >
                    <Save size={15} />
                    <span>{savingTemplate ? "Saving..." : isEditing ? "Update Template Version" : "Save Template"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. AI TEMPLATE GENERATOR MODAL                                            */}
      {/* ========================================================================= */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#c96f4a]/15 text-[#c96f4a]">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">Generate Template with AI</h3>
                  <p className="text-[11px] text-slate-400">Describe your document structure</p>
                </div>
              </div>
              <button
                onClick={() => setAiModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={17} />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">What template do you need?</label>
              <textarea
                rows={3}
                placeholder="e.g. Employee joining letter with designation, CTC, reporting manager, and probationary guidelines..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 outline-none focus:border-[#274690] focus:bg-white"
              />
            </div>

            {/* Quick Suggestions */}
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Quick Prompt Templates:</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {[
                  "Employee Joining Letter",
                  "Internship Agreement Letter",
                  "Quarterly Performance Review",
                  "Vendor Non-Disclosure Agreement",
                ].map((sugg) => (
                  <button
                    key={sugg}
                    type="button"
                    onClick={() => setAiPrompt(sugg)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    {sugg}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAiModalOpen(false)}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRunAiGenerator}
                disabled={aiGenerating || !aiPrompt.trim()}
                className="flex items-center gap-2 rounded-2xl bg-[#c96f4a] px-4 py-2 text-xs font-bold text-white shadow-sm hover:brightness-110 disabled:opacity-50"
              >
                <Sparkles size={14} />
                <span>{aiGenerating ? "Drafting..." : "Generate & Open in Editor"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. USE TEMPLATE (DYNAMIC DOCUMENT GENERATOR) MODAL                        */}
      {/* ========================================================================= */}
      {useModalOpen && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#274690] text-white">
                  <FilePlus size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-800">
                      Use Template: {selectedTemplate.name}
                    </h3>
                    <span className="rounded-full bg-[#274690]/10 px-2 py-0.5 text-[10px] font-bold text-[#274690]">
                      {selectedTemplate.version || "v1.0"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Fill the template variables below to generate your actual document instance.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUseModalOpen(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: 2 Columns (Form on Left, Live Preview on Right) */}
            <form onSubmit={handleGenerateDocumentInstance} className="flex-1 overflow-hidden flex flex-col md:flex-row">
              {/* LEFT: Fillable Variable Form Fields */}
              <div className="w-full md:w-1/2 p-6 overflow-y-auto space-y-4 border-r border-slate-100">
                <div>
                  <label className="text-xs font-bold text-slate-700">Generated Document Title</label>
                  <input
                    type="text"
                    required
                    value={customDocName}
                    onChange={(e) => setCustomDocName(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#274690] focus:bg-white"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Fill Template Variables ({Object.keys(fieldValues).length})
                  </div>

                  <div className="space-y-3">
                    {Object.keys(fieldValues).map((key) => {
                      const cleanLabel = key
                        .split("_")
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(" ");

                      return (
                        <div key={key}>
                          <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                            <span>{cleanLabel}</span>
                            <span className="font-mono text-[10px] text-slate-400 font-normal">
                              {`{{${key}}}`}
                            </span>
                          </label>
                          <input
                            type="text"
                            placeholder={`Enter ${cleanLabel.toLowerCase()}...`}
                            value={fieldValues[key] || ""}
                            onChange={(e) =>
                              setFieldValues({ ...fieldValues, [key]: e.target.value })
                            }
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-[#274690] focus:bg-white"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* RIGHT: Live Instant Replaced Preview */}
              <div className="w-full md:w-1/2 p-6 bg-slate-50/50 flex flex-col justify-between overflow-hidden">
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-700">Real-Time Document Preview</span>
                    <span className="text-[10px] font-semibold text-slate-400">Updates as you type</span>
                  </div>
                  <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed shadow-inner">
                    {getLiveReplacedContent()}
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-4 mt-4 border-t border-slate-200 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400">
                    Instance will be created in <span className="font-bold text-slate-700">My Documents</span> as a draft.
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setUseModalOpen(false)}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={generatingDoc}
                      className="flex items-center gap-1.5 rounded-2xl bg-[#274690] px-5 py-2 text-xs font-bold text-white shadow-sm hover:brightness-110 disabled:opacity-50"
                    >
                      <Check size={15} />
                      <span>{generatingDoc ? "Generating..." : "Generate Document"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. PREVIEW TEMPLATE SCHEMA MODAL                                          */}
      {/* ========================================================================= */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#274690]/10 text-[#274690]">
                  <LayoutTemplate size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-slate-800">{previewTemplate.name}</h3>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                      {previewTemplate.version || "v1.0"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Category: {previewTemplate.category} • Created by {previewTemplate.createdBy || "Priya Sharma"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={17} />
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs text-slate-800 whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed">
              {previewTemplate.contentTemplate}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-400">
                Usage Count: {previewTemplate.usageCount || 0} times
              </span>
              <button
                type="button"
                onClick={() => {
                  const t = previewTemplate;
                  setPreviewTemplate(null);
                  handleOpenUseTemplate(t);
                }}
                className="flex items-center gap-1.5 rounded-2xl bg-[#274690] px-4 py-2 text-xs font-bold text-white shadow-sm hover:brightness-110"
              >
                <FilePlus size={14} />
                <span>Use This Template</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
