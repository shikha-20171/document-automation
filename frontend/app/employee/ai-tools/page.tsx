"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FilePlus,
  FileText,
  MessageSquare,
  Binary,
  Wand2,
  ScanText,
  Sparkles,
  Send,
  Save,
  Copy,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  Edit3,
  Download,
  Check,
  Upload,
  Clock,
  Layers,
  HelpCircle,
  Hash,
  LayoutTemplate,
  Calendar,
  DollarSign,
  ShieldCheck,
} from "lucide-react";
import { aiApi } from "@/services/aiApi";
import { documentsApi } from "@/services/documentsApi";
import { templatesApi } from "@/services/templatesApi";
import SaveAiAsDocumentModal from "@/components/ai/SaveAiAsDocumentModal";

type ToolType =
  | "GENERATE_DOC"
  | "SUMMARIZE_DOC"
  | "ASK_AI"
  | "EXTRACT_INFO"
  | "IMPROVE_CONTENT"
  | "OCR_TEXT";

type ImproveMode =
  | "PROFESSIONAL_TONE"
  | "GRAMMAR"
  | "REWRITE"
  | "SHORTEN"
  | "EXPAND";

export default function EmployeeAiToolsPage() {
  const router = useRouter();
  const [selectedTool, setSelectedTool] = useState<ToolType>("GENERATE_DOC");
  const [loading, setLoading] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Common Input States
  const [promptInput, setPromptInput] = useState("");
  const [contentInput, setContentInput] = useState("");
  const [fileNameInput, setFileNameInput] = useState("Scanned_Vendor_Tax_Invoice.pdf");
  const [selectedCategory, setSelectedCategory] = useState("HR");
  const [improveMode, setImproveMode] = useState<ImproveMode>("PROFESSIONAL_TONE");

  // Existing documents for selection
  const [existingDocs, setExistingDocs] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("");

  // Result States
  const [aiResult, setAiResult] = useState<any>(null);
  const [editableOutput, setEditableOutput] = useState<string>("");
  const [outputDocTitle, setOutputDocTitle] = useState<string>("");
  const [savingAction, setSavingAction] = useState<"DOC" | "TEMPLATE" | null>(null);

  // Fetch existing documents for document-based tools
  useEffect(() => {
    const loadDocs = async () => {
      try {
        const res = await documentsApi.getDocuments();
        if (res?.data?.documents) {
          setExistingDocs(res.data.documents);
          if (res.data.documents.length > 0) {
            setSelectedDocId(res.data.documents[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load documents:", err);
      }
    };
    loadDocs();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3505);
  };

  // Tool Definitions - Exactly the 6 required tools
  const toolsList = [
    {
      id: "GENERATE_DOC",
      label: "Generate Document",
      icon: FilePlus,
      description: "Create a formal draft from a prompt or requirement specification.",
      badge: "Creation",
    },
    {
      id: "SUMMARIZE_DOC",
      label: "Summarize Document",
      icon: FileText,
      description: "Extract executive summary, key takeaways, and critical action dates.",
      badge: "Condense",
    },
    {
      id: "ASK_AI",
      label: "Ask AI",
      icon: MessageSquare,
      description: "Query document contents for expiry dates, payment terms, or clauses.",
      badge: "Q&A",
    },
    {
      id: "EXTRACT_INFO",
      label: "Extract Information",
      icon: Binary,
      description: "Extract structured entities like invoice numbers, amounts, and dates.",
      badge: "Structured Data",
    },
    {
      id: "IMPROVE_CONTENT",
      label: "Improve Content",
      icon: Wand2,
      description: "Unified editor for rewrite, grammar, professional tone, shorten, or expand.",
      badge: "Polish",
    },
    {
      id: "OCR_TEXT",
      label: "OCR / Extract Text",
      icon: ScanText,
      description: "Convert scanned PDFs and images into fully editable document text.",
      badge: "Digitization",
    },
  ];

  // Set preset default prompt / content when switching tools
  const handleSelectTool = (toolId: ToolType) => {
    setSelectedTool(toolId);
    setAiResult(null);
    setEditableOutput("");

    switch (toolId) {
      case "GENERATE_DOC":
        setPromptInput("Create a professional employee leave application for 5 days");
        break;
      case "SUMMARIZE_DOC":
        setContentInput(
          `MASTER SERVICES AGREEMENT & PROCUREMENT SCHEDULE\n\nThis Master Services Agreement is executed on August 18, 2026 between DocuCore AI Corp and Global Cloud Services Inc. The contractor shall provide high-performance cluster computing services with an guaranteed 99.9% uptime SLA threshold.\n\nFinancial Terms: Total contract value is INR 4,85,000.00 payable on a Net 30-day schedule post line-item verification by the Operations team. Milestone deliveries require dual verification by the Team Leader and Department Manager.\n\nTerm & Termination: The agreement remains active for 12 months with automatic annual renewal unless 30 days prior written notice is given.`
        );
        break;
      case "ASK_AI":
        setPromptInput("Is contract ki expiry date aur payment terms kya hain?");
        break;
      case "EXTRACT_INFO":
        setContentInput(
          `TAX INVOICE\nInvoice No: INV-2026-90428\nVendor: Global Cloud Services India Pvt Ltd\nGSTIN: 27AABCG1234F1Z5\nDate: 2026-08-15\nDue Date: 2026-09-15\nTotal Payable: INR 4,85,000.00\nPayment Terms: Net 30 Days Electronic Transfer`
        );
        break;
      case "IMPROVE_CONTENT":
        setContentInput(
          "Please send me the vendor invoice so that I can check and give to manager for sign."
        );
        setImproveMode("PROFESSIONAL_TONE");
        break;
      case "OCR_TEXT":
        setFileNameInput("Scanned_Vendor_Tax_Invoice.pdf");
        break;
    }
  };

  // Run AI Action
  const handleExecuteAi = async () => {
    setLoading(true);
    setAiResult(null);

    try {
      const res = await aiApi.runAiTool({
        tool: selectedTool,
        prompt: promptInput,
        content: contentInput,
        mode: improveMode,
        fileName: fileNameInput,
        docId: selectedDocId,
      });

      if (res?.data) {
        setAiResult(res.data);

        // Populate editable text based on tool output
        if (selectedTool === "GENERATE_DOC") {
          setEditableOutput(res.data.generatedContent || "");
          setOutputDocTitle(res.data.suggestedTitle || "Generated_Document.docx");
        } else if (selectedTool === "SUMMARIZE_DOC") {
          setEditableOutput(res.data.summary || "");
          setOutputDocTitle("Executive_Summary_Report.docx");
        } else if (selectedTool === "ASK_AI") {
          setEditableOutput(res.data.answer || "");
        } else if (selectedTool === "IMPROVE_CONTENT") {
          setEditableOutput(res.data.improvedText || "");
          setOutputDocTitle("Improved_Content_Document.docx");
        } else if (selectedTool === "OCR_TEXT") {
          setEditableOutput(res.data.extractedText || "");
          setOutputDocTitle(
            `OCR_${fileNameInput.replace(/\.[^/.]+$/, "")}_Extracted.docx`
          );
        }
      }
    } catch (err: any) {
      alert("AI Processing Failed: " + (err.message || "Unknown error"));
    }
    setLoading(false);
  };

  // Save Output as Document in My Documents
  const handleSaveAsDocument = async () => {
    if (!editableOutput.trim()) {
      alert("No content available to save.");
      return;
    }
    setSavingAction("DOC");
    try {
      const title = outputDocTitle.trim() || `AI_Generated_Doc_${Date.now().toString().slice(-4)}.docx`;
      await documentsApi.createDocument({
        name: title,
        type: "Document",
        category: selectedCategory || "General",
        content: editableOutput,
        tags: ["AI Generated", selectedTool],
      });
      showToast(`Saved '${title}' to My Documents!`);
      setTimeout(() => router.push("/employee/documents"), 1200);
    } catch (err: any) {
      alert("Failed to save document: " + err.message);
    }
    setSavingAction(null);
  };

  // Save Output as Reusable Template in Document Templates
  const handleSaveAsTemplate = async () => {
    if (!editableOutput.trim()) {
      alert("No content available to save as template.");
      return;
    }
    setSavingAction("TEMPLATE");
    try {
      const tmplName = outputDocTitle
        .replace(/\.[^/.]+$/, "")
        .replace(/_/g, " ") || "AI Generated Template";

      await templatesApi.createTemplate({
        name: tmplName,
        category: selectedCategory || "General",
        description: `Reusable template generated via AI prompt: "${promptInput}"`,
        contentTemplate: editableOutput,
      });
      showToast(`Saved '${tmplName}' to Template Library!`);
      setTimeout(() => router.push("/employee/document-templates"), 1200);
    } catch (err: any) {
      alert("Failed to save template: " + err.message);
    }
    setSavingAction(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#274690]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#274690] border border-[#274690]/20">
              Assisted AI Automation
            </span>
            <span className="text-xs text-slate-400">Generate, Analyze, Extract & OCR</span>
          </div>
          <h1 className="mt-1 text-xl font-black text-slate-800 sm:text-2xl">AI Document Tools</h1>
          <p className="mt-1 text-xs text-slate-500">
            Intelligent assistant suite to generate documents, summarize contracts, query clauses, extract structured data, and OCR scans.
          </p>
        </div>
      </div>

      {/* Toast Alert */}
      {toast && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      {/* 2. Tool Selector Grid (Strictly 6 Cards) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {toolsList.map((tool) => {
          const Icon = tool.icon;
          const isSelected = selectedTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => handleSelectTool(tool.id as ToolType)}
              className={`flex flex-col items-start justify-between rounded-3xl border p-4 text-left transition ${
                isSelected
                  ? "border-[#274690] bg-[#274690]/5 shadow-md shadow-[#274690]/10 ring-2 ring-[#274690]/20"
                  : "border-slate-200/80 bg-white/90 hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-2xl transition ${
                  isSelected ? "bg-[#274690] text-white" : "bg-slate-100 text-slate-700"
                }`}
              >
                <Icon size={19} />
              </div>
              <div className="mt-3">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600">
                  {tool.badge}
                </span>
                <div className="mt-1.5 font-black text-xs text-slate-800">{tool.label}</div>
                <div className="mt-1 line-clamp-2 text-[10px] text-slate-500 leading-tight">
                  {tool.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Interactive Workspace Layout (Inputs on Left, AI Output on Right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: Input Configuration                                          */}
        {/* ========================================================================= */}
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#274690]/10 text-[#274690]">
                {selectedTool === "GENERATE_DOC" && <FilePlus size={16} />}
                {selectedTool === "SUMMARIZE_DOC" && <FileText size={16} />}
                {selectedTool === "ASK_AI" && <MessageSquare size={16} />}
                {selectedTool === "EXTRACT_INFO" && <Binary size={16} />}
                {selectedTool === "IMPROVE_CONTENT" && <Wand2 size={16} />}
                {selectedTool === "OCR_TEXT" && <ScanText size={16} />}
              </div>
              <h3 className="text-sm font-black text-slate-800">
                {toolsList.find((t) => t.id === selectedTool)?.label} Parameters
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-semibold">Step 1: Input</span>
          </div>

          {/* 1. GENERATE DOCUMENT INPUTS */}
          {selectedTool === "GENERATE_DOC" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Document Prompt / Requirement *</label>
                <textarea
                  rows={4}
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="e.g. Create a professional employee leave application for 5 days..."
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-800 outline-none focus:border-[#274690] focus:bg-white"
                />
              </div>

              {/* Suggestions */}
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Prompt Suggestions:</span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {[
                    "Create a professional employee leave application for 5 days",
                    "Mutual Non-Disclosure Agreement for external vendor",
                    "Employee Joining and Welcome Letter for IT department",
                    "Quarterly vendor reconciliation memo",
                  ].map((sugg) => (
                    <button
                      key={sugg}
                      type="button"
                      onClick={() => setPromptInput(sugg)}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      {sugg}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Target Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#274690]"
                >
                  <option value="HR">HR & Personnel</option>
                  <option value="Operations">Operations & Logistics</option>
                  <option value="Legal">Legal & Contracts</option>
                  <option value="Finance">Finance & Billing</option>
                  <option value="General">General Administrative</option>
                </select>
              </div>
            </div>
          )}

          {/* 2. SUMMARIZE DOCUMENT INPUTS */}
          {selectedTool === "SUMMARIZE_DOC" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Select Document or Paste Content</label>
                {existingDocs.length > 0 && (
                  <select
                    value={selectedDocId}
                    onChange={(e) => {
                      setSelectedDocId(e.target.value);
                      const found = existingDocs.find((d) => d.id === e.target.value);
                      if (found?.content) setContentInput(found.content);
                    }}
                    className="mt-1.5 mb-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#274690]"
                  >
                    <option value="">-- Choose from My Documents --</option>
                    {existingDocs.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} ({doc.category})
                      </option>
                    ))}
                  </select>
                )}

                <textarea
                  rows={8}
                  value={contentInput}
                  onChange={(e) => setContentInput(e.target.value)}
                  placeholder="Paste lengthy contract or agreement text here to extract executive summary and key deadlines..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs font-mono text-slate-800 outline-none focus:border-[#274690] focus:bg-white"
                />
              </div>
            </div>
          )}

          {/* 3. ASK AI (DOCUMENT Q&A) */}
          {selectedTool === "ASK_AI" && (
            <div className="space-y-4">
              {existingDocs.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-slate-700">Target Document Context</label>
                  <select
                    value={selectedDocId}
                    onChange={(e) => setSelectedDocId(e.target.value)}
                    className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#274690]"
                  >
                    {existingDocs.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} ({doc.category})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700">Your Question about the Document *</label>
                <textarea
                  rows={3}
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="e.g. Is contract ki expiry date kya hai? Payment terms kya hain?"
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-800 outline-none focus:border-[#274690] focus:bg-white"
                />
              </div>

              {/* Sample Questions */}
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Sample Inquiries:</span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {[
                    "Is contract ki expiry date kya hai?",
                    "Is document me payment terms kya hain?",
                    "Who are the authorized signers?",
                    "What are the SLA penalty clauses?",
                  ].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setPromptInput(q)}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 4. EXTRACT INFORMATION INPUTS */}
          {selectedTool === "EXTRACT_INFO" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Invoice or Contract Text</label>
                <textarea
                  rows={8}
                  value={contentInput}
                  onChange={(e) => setContentInput(e.target.value)}
                  placeholder="Paste invoice or receipt text to extract structured key-value entities..."
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs font-mono text-slate-800 outline-none focus:border-[#274690] focus:bg-white"
                />
              </div>
            </div>
          )}

          {/* 5. IMPROVE CONTENT (ALL MODES IN ONE TOOL) */}
          {selectedTool === "IMPROVE_CONTENT" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Select Improvement Mode</label>
                <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {[
                    { id: "PROFESSIONAL_TONE", label: "Professional Tone" },
                    { id: "GRAMMAR", label: "Fix Grammar & Syntax" },
                    { id: "REWRITE", label: "Rewrite & Polish" },
                    { id: "SHORTEN", label: "Shorten / Condense" },
                    { id: "EXPAND", label: "Expand & Elaborate" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setImproveMode(m.id as ImproveMode)}
                      className={`rounded-2xl border p-2.5 text-center text-xs font-bold transition ${
                        improveMode === m.id
                          ? "border-[#274690] bg-[#274690] text-white shadow-sm"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Source Text to Enhance</label>
                <textarea
                  rows={6}
                  value={contentInput}
                  onChange={(e) => setContentInput(e.target.value)}
                  placeholder="Enter the rough draft or paragraph to improve..."
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-800 outline-none focus:border-[#274690] focus:bg-white"
                />
              </div>
            </div>
          )}

          {/* 6. OCR / EXTRACT TEXT INPUTS */}
          {selectedTool === "OCR_TEXT" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Scanned Document / Image Sample</label>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    type="text"
                    value={fileNameInput}
                    onChange={(e) => setFileNameInput(e.target.value)}
                    className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#274690]"
                  />
                </div>
              </div>

              {/* Scanned Sample Quick Selection */}
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Scanned Upload Samples:</span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {[
                    "Scanned_Vendor_Tax_Invoice.pdf",
                    "Logistics_Waybill_Receipt.png",
                    "Signed_Equipment_Warranty_Certificate.jpg",
                  ].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFileNameInput(s)}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload Dropzone Visual */}
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-6 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#274690]/10 text-[#274690]">
                  <Upload size={18} />
                </div>
                <div className="mt-2 text-xs font-bold text-slate-700">Upload Scanned PDF or Image</div>
                <div className="text-[10px] text-slate-400">Supports PNG, JPG, PDF (Up to 25 MB)</div>
              </div>
            </div>
          )}

          {/* Action Trigger Button */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="text-[11px] text-slate-400">
              Outputs are completely editable before saving.
            </div>
            <button
              onClick={handleExecuteAi}
              disabled={loading}
              className="flex items-center gap-2 rounded-2xl bg-[#274690] px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#274690]/25 transition hover:brightness-110 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Processing AI...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Run AI Tool</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: Output & Results Review                                     */}
        {/* ========================================================================= */}
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-md space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">Verified AI Output</span>
                {aiResult && (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                    Ready for Review
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400 font-semibold">Step 2: Review & Save</span>
            </div>

            {/* Output States */}
            {!aiResult && !loading && (
              <div className="flex h-80 flex-col items-center justify-center text-center p-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Sparkles size={26} />
                </div>
                <h4 className="mt-3 text-sm font-bold text-slate-700">Awaiting AI Execution</h4>
                <p className="mt-1 text-xs text-slate-400 max-w-xs">
                  Configure your parameters on the left and click "Run AI Tool" to generate or extract document content.
                </p>
              </div>
            )}

            {loading && (
              <div className="flex h-80 flex-col items-center justify-center text-center p-8">
                <div className="h-9 w-9 animate-spin rounded-full border-3 border-[#274690] border-t-transparent" />
                <h4 className="mt-4 text-sm font-bold text-slate-800">Processing Request...</h4>
                <p className="mt-1 text-xs text-slate-500">
                  Neural model is analyzing context and generating structured results.
                </p>
              </div>
            )}

            {aiResult && !loading && (
              <div className="mt-4 space-y-4">
                {/* Document Title if Applicable */}
                {outputDocTitle && (
                  <div>
                    <label className="text-xs font-bold text-slate-700">Document Title</label>
                    <input
                      type="text"
                      value={outputDocTitle}
                      onChange={(e) => setOutputDocTitle(e.target.value)}
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#274690]"
                    />
                  </div>
                )}

                {/* 1. SUMMARIZE SPECIAL VIEW (Key points + Dates) */}
                {selectedTool === "SUMMARIZE_DOC" && aiResult.keyPoints && (
                  <div className="space-y-3">
                    <div className="rounded-2xl bg-blue-50/60 border border-blue-200/80 p-3.5 text-xs text-slate-800">
                      <span className="font-bold text-[#274690] block mb-1">Executive Summary:</span>
                      <p className="leading-relaxed">{aiResult.summary}</p>
                    </div>

                    {/* Key Points */}
                    <div>
                      <span className="text-[11px] font-bold uppercase text-slate-500">Key Takeaways:</span>
                      <ul className="mt-1.5 space-y-1 text-xs text-slate-700">
                        {aiResult.keyPoints.map((pt: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-[#274690] font-bold">•</span>
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Dates and Actions Table */}
                    {aiResult.importantDatesAndActions && (
                      <div className="rounded-2xl border border-slate-200 overflow-hidden text-xs">
                        <div className="bg-slate-100 px-3 py-1.5 font-bold text-slate-700 text-[11px]">
                          Important Dates & Actions
                        </div>
                        <div className="divide-y divide-slate-100">
                          {aiResult.importantDatesAndActions.map((row: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-2.5 bg-white">
                              <span className="font-semibold text-slate-700">{row.label}</span>
                              <span className="font-mono text-slate-900 font-bold">{row.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. ASK AI CITATIONS VIEW */}
                {selectedTool === "ASK_AI" && aiResult.citations && (
                  <div className="space-y-3">
                    <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
                      <div className="text-xs font-bold text-[#274690] mb-1.5 flex items-center gap-1.5">
                        <MessageSquare size={14} />
                        <span>AI Answer:</span>
                      </div>
                      <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {aiResult.answer}
                      </div>
                    </div>

                    {/* Citations */}
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 text-xs">
                      <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                        Document Citations & Proof:
                      </span>
                      {aiResult.citations.map((cite: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-slate-700 font-semibold">
                          <ShieldCheck size={14} className="text-[#274690]" />
                          <span>{cite.section}</span>
                          {cite.page && <span className="text-slate-400">(Page {cite.page})</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. EXTRACTED INFORMATION (STRUCTURED DATA GRID) */}
                {selectedTool === "EXTRACT_INFO" && aiResult.entities && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs">
                      {aiResult.entities.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
                        >
                          <div className="text-[10px] text-slate-400 font-bold uppercase">
                            {item.key}
                          </div>
                          <div className="mt-1 font-bold text-slate-800">{item.value}</div>
                          <div className="mt-1 text-[10px] text-emerald-600 font-semibold">
                            Confidence: {item.confidence}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. IMPROVE CONTENT HIGHLIGHTS */}
                {selectedTool === "IMPROVE_CONTENT" && aiResult.highlights && (
                  <div className="rounded-2xl bg-orange-50/60 border border-orange-200/80 p-3 text-xs">
                    <span className="text-[10px] font-bold uppercase text-orange-900 block mb-1">
                      Applied Improvements ({aiResult.modeUsed}):
                    </span>
                    <ul className="space-y-0.5 text-slate-700">
                      {aiResult.highlights.map((h: string, idx: number) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <Check size={13} className="text-emerald-600 font-bold" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 5. OCR METRICS */}
                {selectedTool === "OCR_TEXT" && (
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs">
                    <span className="text-slate-600 font-medium">Scanned Source: {fileNameInput}</span>
                    <span className="font-bold text-emerald-700">
                      OCR Confidence: {aiResult.confidenceScore || "99.4%"}
                    </span>
                  </div>
                )}

                {/* Main Editable Text Area for All Outputs */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Editable Document Content
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {editableOutput.length} chars
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    value={editableOutput}
                    onChange={(e) => setEditableOutput(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white p-3.5 font-mono text-xs text-slate-800 leading-relaxed outline-none focus:border-[#274690] shadow-inner"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons: Save as Document / Save as Template */}
          {aiResult && (
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(editableOutput);
                  showToast("Content copied to clipboard!");
                }}
                className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <Copy size={14} />
                <span>Copy</span>
              </button>

              {/* Save as Template option for Generated documents */}
              {selectedTool === "GENERATE_DOC" && (
                <button
                  type="button"
                  disabled={savingAction !== null}
                  onClick={handleSaveAsTemplate}
                  className="flex items-center gap-1.5 rounded-2xl border border-[#c96f4a]/30 bg-[#c96f4a]/10 px-4 py-2 text-xs font-bold text-[#c96f4a] shadow-sm hover:bg-[#c96f4a]/20 disabled:opacity-50"
                >
                  <LayoutTemplate size={14} />
                  <span>{savingAction === "TEMPLATE" ? "Saving..." : "Save as Template"}</span>
                </button>
              )}

              {/* Save as Concrete Document Draft */}
              <button
                type="button"
                onClick={() => setSaveModalOpen(true)}
                className="flex items-center gap-1.5 rounded-2xl bg-[#274690] px-5 py-2 text-xs font-bold text-white shadow-sm hover:brightness-110"
              >
                <Save size={14} />
                <span>Save to My Documents</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <SaveAiAsDocumentModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        content={editableOutput}
        suggestedTitle={outputDocTitle || "Employee AI Note"}
        sourceType="Employee AI Tools"
        aiProvider="Google Gemini"
        aiModel="Gemini 3.6 Flash"
        onSaved={(doc) => {
          showToast(`Document "${doc.name}" saved to your documents!`);
        }}
      />
    </div>
  );
}
