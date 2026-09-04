"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  FileText,
  Sparkles,
  ArrowLeft,
  Copy,
  Download,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  UploadCloud,
  FileCode2,
  Check,
  Eye,
  Edit3,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { aiApi } from "@/services/aiApi";
import SaveAiAsDocumentModal from "@/components/ai/SaveAiAsDocumentModal";

type TemplateItem = {
  id: string;
  name: string;
  template_body: string;
  fields: string[];
};

export default function AiDocumentGeneratorPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [successToast, setSuccessToast] = useState("");
  const [copied, setCopied] = useState(false);
  const [previewMode, setPreviewMode] = useState<"edit" | "preview">("edit");

  // Form State
  const [documentTitle, setDocumentTitle] = useState("Vendor Performance Review Note");
  const [documentType, setDocumentType] = useState("Review Note");
  const [tone, setTone] = useState("Formal Executive");
  const [prompt, setPrompt] = useState(
    "Generate a formal department vendor review note for Q3 2026. Highlight contract compliance, payment reconciliation, SLA performance of 94.8%, and recommendation for renewal."
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [templateValues, setTemplateValues] = useState<Record<string, string>>({});
  const [referenceFile, setReferenceFile] = useState<File | null>(null);

  // Templates list
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  
  // Generated Output
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [generationMetadata, setGenerationMetadata] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 4000);
  };

  const loadTemplates = async () => {
    try {
      const res = await aiApi.listTemplates();
      const list = (res?.data || []) as TemplateItem[];
      setTemplates(list);
    } catch {
      setTemplates([]);
    }
  };

  useEffect(() => {
    void loadTemplates();
  }, []);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) {
      setTemplateValues({});
      return;
    }
    const tmpl = templates.find((t) => t.id === templateId);
    if (tmpl && tmpl.fields) {
      const initialValues: Record<string, string> = {};
      tmpl.fields.forEach((f) => {
        initialValues[f] = "";
      });
      setTemplateValues(initialValues);
    }
  };

  const handleGenerate = async () => {
    setError("");
    setLoading(true);
    try {
      const response = await aiApi.generateDocument({
        documentTitle,
        documentType,
        tone,
        prompt,
        templateId: selectedTemplateId || undefined,
        templateValues: Object.keys(templateValues).length ? templateValues : undefined,
        file: referenceFile,
      });

      const content = response?.data?.content || response?.data?.generatedContent || response?.data?.documentContent;
      if (content) {
        setGeneratedContent(content);
        setGenerationMetadata(response.data);
        showToast("Document generated successfully!");
      } else {
        throw new Error("Unable to generate document content from AI engine.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to process this document. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDocument = async (action: "SAVE" | "SAVE_DRAFT" | "SUBMIT_APPROVAL") => {
    if (!generatedContent) {
      setError("No generated document content to save.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const statusMap = {
        SAVE: "ACTIVE",
        SAVE_DRAFT: "DRAFT",
        SUBMIT_APPROVAL: "PENDING_APPROVAL",
      };
      const response = await aiApi.saveGeneratedDocument({
        title: documentTitle,
        content: generatedContent,
        documentType,
        status: statusMap[action],
        action,
      });

      showToast(response?.message || "Document processed successfully.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save document.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    if (!generatedContent) return;
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    showToast("Document copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    if (!generatedContent) return;
    const blob = new Blob([generatedContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${documentTitle.toLowerCase().replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Downloaded document file.");
  };

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-16 font-sans text-slate-800">
      {/* Header with back navigation */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/department-manager/ai-tools">
            <Button variant="outline" size="sm" className="h-9 w-9 p-0 rounded-xl">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-900">AI Document Generator</h1>
              <Badge className="bg-[#5B53BA]/10 text-[#5B53BA] text-[11px] font-bold">Tool 01</Badge>
            </div>
            <p className="text-xs text-slate-500">Generate department-scoped documents from prompts, templates, and reference files.</p>
          </div>
        </div>
      </div>

      {/* Alert Toasts */}
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

      {/* Two Column Layout: Controls on Left, Editor/Preview on Right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Form: Generator Inputs (5 Cols) */}
        <div className="space-y-5 lg:col-span-5">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Document Parameters</h2>

            {/* Document Title */}
            <div>
              <label className="text-[11px] font-black uppercase text-slate-500">Document Title *</label>
              <Input
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                placeholder="e.g. Q3 Vendor Review Note"
                className="mt-1 rounded-xl text-xs font-semibold"
              />
            </div>

            {/* Document Type & Tone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-black uppercase text-slate-500">Document Type</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
                >
                  <option value="Review Note">Review Note / Memo</option>
                  <option value="Vendor Agreement">Vendor Agreement Draft</option>
                  <option value="SOP & Procedure">SOP & Procedure</option>
                  <option value="Purchase Requisition">Purchase Requisition</option>
                  <option value="Policy Notice">Department Policy Notice</option>
                  <option value="NDA">Non-Disclosure Note</option>
                  <option value="Incident Report">Incident Resolution Report</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-500">Tone & Style</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
                >
                  <option value="Formal Executive">Formal Executive</option>
                  <option value="Operational & Detailed">Operational & Detailed</option>
                  <option value="Legal & Compliance Strict">Legal & Strict</option>
                  <option value="Concise Summary">Concise Summary</option>
                </select>
              </div>
            </div>

            {/* Optional Template Selector */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase text-slate-500">Department Template (Optional)</label>
                {selectedTemplateId && (
                  <button
                    type="button"
                    onClick={() => handleTemplateSelect("")}
                    className="text-[10px] font-bold text-rose-600 hover:underline"
                  >
                    Clear Template
                  </button>
                )}
              </div>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
              >
                <option value="">-- Generate without Template --</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Template Dynamic Fields if selected */}
            {selectedTemplate && selectedTemplate.fields && selectedTemplate.fields.length > 0 && (
              <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-3.5 space-y-3">
                <p className="text-xs font-bold text-[#5B53BA]">Fill Template Variables:</p>
                <div className="grid gap-2">
                  {selectedTemplate.fields.map((fieldKey) => (
                    <div key={fieldKey}>
                      <label className="text-[10px] font-bold uppercase text-slate-500">{fieldKey.replace(/_/g, " ")}</label>
                      <Input
                        value={templateValues[fieldKey] || ""}
                        onChange={(e) =>
                          setTemplateValues({ ...templateValues, [fieldKey]: e.target.value })
                        }
                        placeholder={`Enter ${fieldKey}...`}
                        className="mt-0.5 h-8 rounded-lg bg-white text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prompt Textarea */}
            <div>
              <label className="text-[11px] font-black uppercase text-slate-500">Prompt / Custom Instructions</label>
              <textarea
                rows={4}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-800 placeholder-slate-400 focus:border-[#5B53BA] focus:bg-white focus:outline-none"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Specify requirements, key metrics, vendor details, clauses to include..."
              />
            </div>

            {/* Reference Document Upload */}
            <div>
              <label className="text-[11px] font-black uppercase text-slate-500">Optional Reference Document</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.png,.jpg"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 25 * 1024 * 1024) {
                      setError("File size exceeds 25MB limit.");
                      return;
                    }
                    setReferenceFile(file);
                    showToast(`Attached ${file.name}`);
                  }
                }}
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    if (file.size > 25 * 1024 * 1024) {
                      setError("File size exceeds 25MB limit.");
                      return;
                    }
                    setReferenceFile(file);
                    showToast(`Attached ${file.name}`);
                  }
                }}
                className="mt-1 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-4 text-center transition hover:border-[#5B53BA] hover:bg-purple-50/20"
              >
                <UploadCloud size={20} className="text-[#5B53BA]" />
                {referenceFile ? (
                  <div className="mt-1.5 text-xs font-bold text-slate-800">
                    {referenceFile.name} ({(referenceFile.size / 1024).toFixed(0)} KB)
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setReferenceFile(null);
                      }}
                      className="ml-2 text-[10px] text-rose-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="mt-1 text-xs font-bold text-slate-700">Drag & drop or Browse file</p>
                    <p className="text-[10px] text-slate-400">PDF, DOC, DOCX, TXT (Max 25MB)</p>
                  </>
                )}
              </div>
            </div>

            {/* Generate Button */}
            <Button
              disabled={loading}
              onClick={handleGenerate}
              className="w-full rounded-2xl bg-[#5B53BA] py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#4a42a1]"
            >
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Processing document...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Document
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Right Editor & Action Pane (7 Cols) */}
        <div className="space-y-4 lg:col-span-7">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900">Generated Document Workspace</h2>
                <p className="text-xs text-slate-500">Live preview, edit, copy, export, and submit for department approval.</p>
              </div>

              {/* View/Edit toggle */}
              {generatedContent && (
                <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => setPreviewMode("edit")}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                      previewMode === "edit" ? "bg-[#5B53BA] text-white" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Edit3 size={13} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode("preview")}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                      previewMode === "preview" ? "bg-[#5B53BA] text-white" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Eye size={13} /> Preview
                  </button>
                </div>
              )}
            </div>

            {/* Document Content Canvas */}
            <div className="mt-4">
              {loading ? (
                <div className="flex min-h-[380px] flex-col items-center justify-center rounded-2xl border border-purple-100 bg-purple-50/30 p-8 text-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-[#5B53BA]" />
                  <p className="mt-3 text-sm font-bold text-slate-800">Processing document...</p>
                  <p className="mt-1 text-xs text-slate-500">AI is analyzing context, applying tone, and structuring document sections.</p>
                </div>
              ) : generatedContent ? (
                previewMode === "edit" ? (
                  <textarea
                    rows={18}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/40 p-4 font-mono text-xs leading-relaxed text-slate-800 focus:border-[#5B53BA] focus:bg-white focus:outline-none"
                    value={generatedContent}
                    onChange={(e) => setGeneratedContent(e.target.value)}
                  />
                ) : (
                  <div className="min-h-[380px] whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50/30 p-5 text-xs leading-relaxed text-slate-800">
                    {generatedContent}
                  </div>
                )
              ) : (
                <div className="flex min-h-[380px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                  <FileText className="h-10 w-10 text-slate-300" />
                  <p className="mt-3 text-sm font-bold text-slate-700">No document generated yet.</p>
                  <p className="mt-1 text-xs text-slate-400">Configure parameters on the left and click &quot;Generate Document&quot;.</p>
                </div>
              )}
            </div>

            {/* Post Generation Actions Bar */}
            {generatedContent && (
              <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="text-xs font-bold"
                    >
                      {copied ? <Check size={14} className="mr-1 text-emerald-600" /> : <Copy size={14} className="mr-1" />}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownload}
                      className="text-xs font-bold"
                    >
                      <Download size={14} className="mr-1" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerate}
                      disabled={loading}
                      className="text-xs font-bold text-[#5B53BA]"
                    >
                      <RefreshCw size={14} className="mr-1" />
                      Regenerate
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={saving}
                      onClick={() => handleSaveDocument("SAVE_DRAFT")}
                      className="text-xs font-bold text-slate-700"
                    >
                      Save as Draft
                    </Button>
                    <Button
                      size="sm"
                      disabled={saving}
                      onClick={() => setSaveModalOpen(true)}
                      className="bg-[#274690] text-xs font-bold text-white hover:bg-[#1f3770]"
                    >
                      <Save size={14} className="mr-1" />
                      Save as Document
                    </Button>
                    <Button
                      size="sm"
                      disabled={saving}
                      onClick={() => handleSaveDocument("SUBMIT_APPROVAL")}
                      className="bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
                    >
                      <Send size={14} className="mr-1" />
                      Submit for Approval
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <SaveAiAsDocumentModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        content={generatedContent}
        suggestedTitle={documentTitle}
        sourceType="AI Document Generator"
        aiProvider="Google Gemini"
        aiModel="Gemini 3.6 Flash"
        onSaved={(doc) => {
          setSuccessToast(`Document "${doc.name}" saved to vault!`);
        }}
      />
    </div>
  );
}
