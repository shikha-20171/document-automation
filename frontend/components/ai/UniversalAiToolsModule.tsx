"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  FileText,
  FileSearch,
  SearchCheck,
  AlignLeft,
  Wand2,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Download,
  Mail,
  Save,
  RotateCcw,
  Eye,
  Edit3,
  Copy,
  Check,
  User,
  Layout,
  X,
  FileCode,
  Building2,
  FileCheck,
  Loader2,
  Send,
  History,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import apiClient from "@/lib/axios";

export type RoleType = "ORGANISATION_ADMIN" | "DEPARTMENT_MANAGER" | "TEAM_LEADER" | "STAFF";

interface UniversalAiToolsModuleProps {
  userRole: RoleType;
  roleDisplayName?: string;
}

export interface HistoryDocument {
  id: string;
  documentNumber: string;
  title: string;
  documentType: string;
  category: string;
  status: string;
  clientName?: string;
  clientEmail?: string;
  createdByName?: string;
  createdAt: string;
  content?: any;
  financialData?: any;
}

interface CrmClient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  company?: string;
  industry?: string;
}

interface DocTemplate {
  id: string;
  name: string;
  category?: string;
  documentType?: string;
  description?: string;
}

interface GeneratedSection {
  id: string;
  type: "header" | "text" | "table" | "terms" | "signature" | string;
  title: string;
  body?: string;
  tableData?: {
    headers: string[];
    rows: string[][];
  };
}

interface GeneratedDocData {
  id?: string;
  title: string;
  documentType: string;
  category: string;
  clientName?: string;
  clientEmail?: string;
  sections: GeneratedSection[];
  rawMarkdown?: string;
  createdAt?: string;
  financialData?: {
    subtotal?: number;
    taxAmount?: number;
    total?: number;
    currency?: string;
  };
}

const DOCUMENT_TYPES = [
  { id: "Quotation", label: "Quotation", desc: "Pricing estimate & commercial quote" },
  { id: "Invoice", label: "Invoice", desc: "Commercial bill with line items & tax" },
  { id: "Proposal", label: "Proposal", desc: "Business pitch & technical proposal" },
  { id: "Agreement", label: "Agreement / Contract", desc: "Legal binding contract & SLA" },
  { id: "Report", label: "Report", desc: "Status, operational or audit report" },
  { id: "Letter", label: "Official Letter", desc: "Formal communication or notice" },
  { id: "Custom Document", label: "Custom Document", desc: "Tailored document structure" },
];

export default function UniversalAiToolsModule({
  userRole,
  roleDisplayName = "Organisation User",
}: UniversalAiToolsModuleProps) {
  // Active Action Card Tool
  const [activeTool, setActiveTool] = useState<"create" | "extract" | "analyze" | "summarize" | "custom">("create");

  // Create Document States
  const [selectedDocType, setSelectedDocType] = useState<string>("Quotation");
  const [clients, setClients] = useState<CrmClient[]>([]);
  const [selectedClient, setSelectedClient] = useState<CrmClient | null>(null);
  const [templates, setTemplates] = useState<DocTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<DocTemplate | null>(null);
  const [promptText, setPromptText] = useState<string>("");
  const [sourceFile, setSourceFile] = useState<File | null>(null);

  // General Processing States
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStage, setProcessingStage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Result States for Create Document
  const [generatedDoc, setGeneratedDoc] = useState<GeneratedDocData | null>(null);
  const [savedDocId, setSavedDocId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"preview" | "edit">("preview");
  const [editableContent, setEditableContent] = useState<string>("");

  // Result States for Extract / Analyze / Summarize / Custom
  const [toolResultText, setToolResultText] = useState<string | null>(null);
  const [structuredExtract, setStructuredExtract] = useState<any | null>(null);
  const [copiedResult, setCopiedResult] = useState<boolean>(false);

  // Other Tools Upload & Input
  const [toolFile, setToolFile] = useState<File | null>(null);
  const [toolTextInput, setToolTextInput] = useState<string>("");
  const [analysisFocus, setAnalysisFocus] = useState<string>("Key Clauses & Risks");
  const [summaryFormat, setSummaryFormat] = useState<string>("bullets");

  // Send to Client Modal
  const [showSendModal, setShowSendModal] = useState<boolean>(false);
  const [recipientEmail, setRecipientEmail] = useState<string>("");
  const [emailSubject, setEmailSubject] = useState<string>("");
  const [emailMessage, setEmailMessage] = useState<string>("");
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [emailSentStatus, setEmailSentStatus] = useState<string | null>(null);

  // Permitted Document History States
  const [historyDocs, setHistoryDocs] = useState<HistoryDocument[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const toolFileInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch CRM Clients, Templates & Permitted Document History on load
  async function refreshHistory() {
    setLoadingHistory(true);
    try {
      const docsRes = await apiClient.get("/api/unified-documents?limit=15");
      if (docsRes.data?.data) {
        setHistoryDocs(docsRes.data.data);
      }
    } catch (err) {
      console.warn("Notice: Permitted documents history loading:", err);
    } finally {
      setLoadingHistory(false);
    }
  }

  useEffect(() => {
    async function loadData() {
      try {
        setLoadingHistory(true);
        const [clientsRes, templatesRes, docsRes] = await Promise.allSettled([
          apiClient.get("/api/crm/clients"),
          apiClient.get("/api/unified-templates"),
          apiClient.get("/api/unified-documents?limit=15"),
        ]);

        if (clientsRes.status === "fulfilled" && clientsRes.value.data) {
          const clientList = clientsRes.value.data.clients || clientsRes.value.data.data || [];
          setClients(clientList);
        }

        if (templatesRes.status === "fulfilled" && templatesRes.value.data) {
          const templateList = templatesRes.value.data.templates || templatesRes.value.data.data || [];
          setTemplates(templateList);
        }

        if (docsRes.status === "fulfilled" && docsRes.value.data) {
          const docList = docsRes.value.data.data || [];
          setHistoryDocs(docList);
        }
      } catch (err) {
        console.warn("Notice: Context data loading:", err);
      } finally {
        setLoadingHistory(false);
      }
    }
    loadData();
  }, []);

  function handlePreviewHistoryDoc(doc: HistoryDocument) {
    const sections: GeneratedSection[] = Array.isArray(doc.content)
      ? doc.content
      : [
          {
            id: "sec_1",
            type: "header",
            title: doc.title || `${doc.documentType}`,
            body: typeof doc.content === "string" ? doc.content : JSON.stringify(doc.content, null, 2),
          },
        ];

    const formattedMarkdown = sections
      .map((s) => {
        let str = `## ${s.title}\n\n`;
        if (s.body) str += `${s.body}\n\n`;
        if (s.tableData && s.tableData.headers && s.tableData.rows) {
          str += `| ${s.tableData.headers.join(" | ")} |\n`;
          str += `| ${s.tableData.headers.map(() => "---").join(" | ")} |\n`;
          s.tableData.rows.forEach((row) => {
            str += `| ${row.join(" | ")} |\n`;
          });
          str += "\n";
        }
        return str;
      })
      .join("\n");

    setGeneratedDoc({
      id: doc.id,
      title: doc.title,
      documentType: doc.documentType,
      category: doc.category,
      clientName: doc.clientName,
      clientEmail: doc.clientEmail,
      sections,
      rawMarkdown: formattedMarkdown,
      financialData: doc.financialData,
      createdAt: new Date(doc.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    });
    setSavedDocId(doc.id);
    setEditableContent(formattedMarkdown);
    setActiveTool("create");
    window.scrollTo({ top: 320, behavior: "smooth" });
  }

  // Update recipient email when client changes
  useEffect(() => {
    if (selectedClient?.email) {
      setRecipientEmail(selectedClient.email);
    }
  }, [selectedClient]);

  // Handle OCR helper: Upload file and extract text automatically
  async function performAutomaticOCR(file: File): Promise<string> {
    setProcessingStage("Extracting information from document...");
    const formData = new FormData();
    formData.append("file", file);

    const ocrRes = await apiClient.post("/api/ai/ocr", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return (
      ocrRes.data?.extractedText ||
      ocrRes.data?.data?.extractedText ||
      ocrRes.data?.text ||
      ocrRes.data?.data?.text ||
      ""
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // BUILD DOCUMENT (Primary Workflow)
  // ──────────────────────────────────────────────────────────────────────────
  async function handleBuildDocument(e: React.FormEvent) {
    e.preventDefault();
    if (!promptText.trim() && !selectedTemplate && !sourceFile) {
      setErrorMessage("Please enter document instructions, choose a template, or upload a source document.");
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsProcessing(true);
    setProcessingStage("Preparing document...");

    try {
      let extractedSourceText = "";
      if (sourceFile) {
        extractedSourceText = await performAutomaticOCR(sourceFile);
      }

      setProcessingStage("Understanding content & requirements...");
      await new Promise((r) => setTimeout(r, 400));

      setProcessingStage("Generating document...");

      // Prepare Unified AI Payload
      const combinedPrompt = [
        promptText.trim(),
        extractedSourceText ? `\n\nReference Material from Uploaded Document:\n${extractedSourceText.slice(0, 3000)}` : "",
        selectedClient ? `\nTarget Client: ${selectedClient.name} (${selectedClient.company || ""})` : "",
      ].filter(Boolean).join("\n");

      const payload: any = {
        prompt: combinedPrompt || `Generate a professional ${selectedDocType} for ${selectedClient?.name || "the client"}`,
        documentTypeOverride: selectedDocType,
      };

      if (selectedClient) {
        payload.clientContext = {
          name: selectedClient.name,
          email: selectedClient.email,
          phone: selectedClient.phone,
          address: selectedClient.address,
          company: selectedClient.company,
        };
      }

      if (selectedTemplate) {
        payload.templateContext = {
          id: selectedTemplate.id,
          name: selectedTemplate.name,
          description: selectedTemplate.description,
        };
      }

      const res = await apiClient.post("/api/unified-documents/ai-generate", payload);
      const data = res.data.data;

      setProcessingStage("Saving document draft...");
      await new Promise((r) => setTimeout(r, 300));

      // Parse structured sections into Markdown for viewer
      const sections: GeneratedSection[] = Array.isArray(data.content)
        ? data.content
        : [
            {
              id: "sec_1",
              type: "header",
              title: data.title || `${selectedDocType}`,
              body: typeof data.content === "string" ? data.content : JSON.stringify(data.content, null, 2),
            },
          ];

      const formattedMarkdown = sections
        .map((s) => {
          let str = `## ${s.title}\n\n`;
          if (s.body) str += `${s.body}\n\n`;
          if (s.tableData && s.tableData.headers && s.tableData.rows) {
            str += `| ${s.tableData.headers.join(" | ")} |\n`;
            str += `| ${s.tableData.headers.map(() => "---").join(" | ")} |\n`;
            s.tableData.rows.forEach((row) => {
              str += `| ${row.join(" | ")} |\n`;
            });
            str += "\n";
          }
          return str;
        })
        .join("\n");

      const docObj: GeneratedDocData = {
        title: data.title || `${selectedDocType} - ${selectedClient?.name || "Official Document"}`,
        documentType: data.documentType || selectedDocType,
        category: data.category || "General",
        clientName: data.clientName || selectedClient?.name,
        clientEmail: data.clientEmail || selectedClient?.email,
        sections,
        rawMarkdown: formattedMarkdown,
        financialData: data.financialData,
        createdAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      };

      setGeneratedDoc(docObj);
      setEditableContent(formattedMarkdown);
      setProcessingStage("Document ready");
      setSuccessMessage("Document successfully built and ready for review.");

      // Setup default email subject
      setEmailSubject(`${docObj.title}`);
      setEmailMessage(
        `Dear ${docObj.clientName || "Valued Client"},\n\nPlease find attached the official ${docObj.documentType} generated for your review.\n\nBest regards,\n${roleDisplayName}`
      );
    } catch (err: any) {
      console.error("Build Document Error:", err);
      setErrorMessage(err.response?.data?.message || err.message || "Failed to generate document. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SAVE DOCUMENT TO VAULT (Database Persistence)
  // ──────────────────────────────────────────────────────────────────────────
  async function handleSaveDocument() {
    if (!generatedDoc) return;
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const payload = {
        title: generatedDoc.title,
        documentType: generatedDoc.documentType,
        category: generatedDoc.category,
        clientId: selectedClient?.id || null,
        clientName: generatedDoc.clientName || "Direct Recipient",
        clientEmail: generatedDoc.clientEmail || null,
        content: generatedDoc.sections,
        financialData: generatedDoc.financialData,
        status: "GENERATED",
      };

      const res = await apiClient.post("/api/unified-documents", payload);
      const saved = res.data.data;
      setSavedDocId(saved.id);
      setSuccessMessage(`Document saved to Vault successfully (Ref: ${saved.documentNumber || saved.id})`);
      await refreshHistory();
    } catch (err: any) {
      console.error("Save Document Error:", err);
      setErrorMessage(err.response?.data?.message || err.message || "Failed to save document.");
    } finally {
      setIsSaving(false);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // DOWNLOAD PDF
  // ──────────────────────────────────────────────────────────────────────────
  async function handleDownloadPdf() {
    if (!generatedDoc) return;
    try {
      if (savedDocId) {
        window.open(`/api/unified-documents/${savedDocId}/download-pdf`, "_blank");
      } else {
        // First auto-save if not yet saved
        await handleSaveDocument();
      }
    } catch (err: any) {
      setErrorMessage("Could not download document PDF.");
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SEND TO CLIENT VIA EMAIL
  // ──────────────────────────────────────────────────────────────────────────
  async function handleSendEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!recipientEmail || !recipientEmail.trim()) {
      setEmailSentStatus("Recipient email address is required.");
      return;
    }

    setIsSendingEmail(true);
    setEmailSentStatus(null);

    try {
      // Ensure document is saved first
      let targetDocId = savedDocId;
      if (!targetDocId && generatedDoc) {
        const payload = {
          title: generatedDoc.title,
          documentType: generatedDoc.documentType,
          category: generatedDoc.category,
          clientId: selectedClient?.id || null,
          clientName: generatedDoc.clientName || "Direct Recipient",
          clientEmail: recipientEmail.trim(),
          content: generatedDoc.sections,
          financialData: generatedDoc.financialData,
          status: "GENERATED",
        };
        const createRes = await apiClient.post("/api/unified-documents", payload);
        targetDocId = createRes.data.data.id;
        setSavedDocId(targetDocId);
      }

      if (!targetDocId) throw new Error("Document ID not available for delivery.");

      await apiClient.post(`/api/unified-documents/${targetDocId}/send-email`, {
        recipientEmail: recipientEmail.trim(),
        recipientName: selectedClient?.name || "Client",
        subject: emailSubject.trim() || generatedDoc?.title || "Your Official Document",
        message: emailMessage.trim(),
      });

      setEmailSentStatus("Document successfully delivered to recipient email via Brevo.");
      setTimeout(() => {
        setShowSendModal(false);
        setEmailSentStatus(null);
      }, 2000);
    } catch (err: any) {
      console.error("Send Email Error:", err);
      setEmailSentStatus(`Delivery failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsSendingEmail(false);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // EXTRACT / ANALYZE / SUMMARIZE / CUSTOM EXECUTION
  // ──────────────────────────────────────────────────────────────────────────
  async function handleRunSecondaryTool(e: React.FormEvent) {
    e.preventDefault();
    if (!toolFile && !toolTextInput.trim()) {
      setErrorMessage("Please upload a document or enter document text to process.");
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setToolResultText(null);
    setStructuredExtract(null);
    setIsProcessing(true);
    setProcessingStage("Reading document content...");

    try {
      let rawText = toolTextInput.trim();
      if (toolFile) {
        rawText = await performAutomaticOCR(toolFile);
      }

      if (!rawText.trim()) {
        throw new Error("No readable text found in document.");
      }

      setProcessingStage("Processing with AI...");

      if (activeTool === "extract") {
        const res = await apiClient.post("/api/org-admin/ai-tools/extract", {
          text: rawText,
          fields: ["Document Number", "Invoice Date", "Parties Involved", "Financial Amounts / Subtotal / Tax", "Key Deliverables", "Due Dates"],
        });
        const extracted = res.data.data?.fields || res.data.data?.extractedFields || res.data.data;
        setStructuredExtract(extracted);
        setToolResultText(typeof extracted === "string" ? extracted : JSON.stringify(extracted, null, 2));
      } else if (activeTool === "analyze") {
        const res = await apiClient.post("/api/ai/generate", {
          prompt: `Perform an in-depth professional ${analysisFocus} analysis of the following document. Structure into clear sections with Executive Summary, Obligations, Critical Risks, and Recommendations:\n\n${rawText.slice(0, 4500)}`,
        });
        const text = res.data.data?.text || res.data.data?.content || res.data.text;
        setToolResultText(text);
      } else if (activeTool === "summarize") {
        const res = await apiClient.post("/api/org-admin/ai-tools/summarize", {
          text: rawText,
          format: summaryFormat,
        });
        const summary = res.data.data?.summary || res.data.data;
        setToolResultText(typeof summary === "string" ? summary : JSON.stringify(summary, null, 2));
      } else if (activeTool === "custom") {
        const res = await apiClient.post("/api/ai/generate", {
          prompt: `${promptText || "Analyze and process the following document"}:\n\n${rawText.slice(0, 4500)}`,
        });
        const text = res.data.data?.text || res.data.data?.content || res.data.text;
        setToolResultText(text);
      }

      setProcessingStage("Processing complete");
      setSuccessMessage("AI processing completed successfully.");
    } catch (err: any) {
      console.error("Secondary Tool Error:", err);
      setErrorMessage(err.response?.data?.message || err.message || "Failed to process document.");
    } finally {
      setIsProcessing(false);
    }
  }

  // Copy result text to clipboard
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedResult(true);
    setTimeout(() => setCopiedResult(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-slate-800">
      {/* ── HEADER ── */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-50/70 via-indigo-50/30 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#274690] text-white flex items-center justify-center shadow-xs">
                <Sparkles size={20} className="text-amber-300" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">AI Tools</h1>
                <p className="text-sm font-medium text-slate-500">Create, extract and automate documents using AI.</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              <User size={12} className="text-[#274690]" />
              {roleDisplayName} Scope
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 size={12} />
              AI & OCR Ready
            </span>
          </div>
        </div>
      </div>

      {/* ── ACTION CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {[
          {
            id: "create",
            title: "Create Document",
            desc: "Create a professional document from a description, client information or template.",
            icon: Sparkles,
          },
          {
            id: "extract",
            title: "Extract Data",
            desc: "Extract structured information from an uploaded document.",
            icon: FileSearch,
          },
          {
            id: "analyze",
            title: "Analyze Document",
            desc: "Understand and analyze an uploaded document.",
            icon: SearchCheck,
          },
          {
            id: "summarize",
            title: "Summarize Document",
            desc: "Generate a concise summary of an uploaded document.",
            icon: AlignLeft,
          },
          {
            id: "custom",
            title: "Custom Request",
            desc: "Describe what you want the system to do with your document.",
            icon: Wand2,
          },
        ].map((card) => {
          const Icon = card.icon;
          const isActive = activeTool === card.id;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => {
                setActiveTool(card.id as any);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`text-left p-4 sm:p-5 rounded-2xl border transition-all relative cursor-pointer ${
                isActive
                  ? "bg-white border-[#274690] shadow-md ring-2 ring-[#274690]/20"
                  : "bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                  isActive ? "bg-[#274690] text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                <Icon size={18} className={isActive ? "text-amber-300" : ""} />
              </div>
              <h3 className="font-bold text-sm text-slate-900 mb-1">{card.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{card.desc}</p>
              {isActive && <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-[#274690] rounded-t-full" />}
            </button>
          );
        })}
      </div>

      {/* ── ALERTS / STATUS ── */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3">
          <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600" />
          <div className="flex-1">{errorMessage}</div>
          <button type="button" onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-700">
            <X size={16} />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
          <div className="flex-1 font-medium">{successMessage}</div>
          <button type="button" onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700">
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── PROCESSING OVERLAY / PROGRESS BAR ── */}
      {isProcessing && (
        <div className="bg-white rounded-2xl p-6 border border-blue-200 shadow-sm flex flex-col items-center justify-center text-center space-y-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-[#274690] animate-spin" />
            <Sparkles size={16} className="absolute inset-0 m-auto text-[#274690]" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 text-base">{processingStage || "Processing..."}</h4>
            <p className="text-xs text-slate-500 mt-1">Automatically extracting content and generating output.</p>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 1. CREATE DOCUMENT TAB CONTENT */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTool === "create" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Builder Form (Left Column) */}
          <div className="lg:col-span-6 space-y-6">
            <form onSubmit={handleBuildDocument} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900">What do you want to create?</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select a document type and describe your requirements. The system takes care of the rest.
                </p>
              </div>

              {/* Document Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Document Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {DOCUMENT_TYPES.map((dt) => (
                    <button
                      key={dt.id}
                      type="button"
                      onClick={() => setSelectedDocType(dt.id)}
                      className={`p-2.5 rounded-xl border text-left transition text-xs font-semibold cursor-pointer ${
                        selectedDocType === dt.id
                          ? "bg-[#274690] text-white border-[#274690] shadow-xs"
                          : "bg-slate-50/50 hover:bg-slate-100/70 border-slate-200 text-slate-700"
                      }`}
                    >
                      <div>{dt.label}</div>
                      <div className={`text-[10px] font-normal truncate ${selectedDocType === dt.id ? "text-blue-100" : "text-slate-400"}`}>
                        {dt.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Client Selector (CRM Integration) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Client <span className="text-slate-400 font-normal lowercase">(optional CRM link)</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedClient?.id || ""}
                    onChange={(e) => {
                      const found = clients.find((c) => c.id === e.target.value);
                      setSelectedClient(found || null);
                    }}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#274690] focus:ring-1 focus:ring-[#274690]"
                  >
                    <option value="">-- No Client Attached / Ad-hoc --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.company ? `(${c.company})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Auto-filled CRM chip */}
                {selectedClient && (
                  <div className="mt-2 p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Building2 size={13} className="text-[#274690]" />
                        {selectedClient.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedClient(null)}
                        className="text-slate-400 hover:text-slate-600 text-[11px]"
                      >
                        Clear
                      </button>
                    </div>
                    {selectedClient.email && <div className="text-slate-500">Email: {selectedClient.email}</div>}
                    {selectedClient.address && <div className="text-slate-500">Address: {selectedClient.address}</div>}
                  </div>
                )}
              </div>

              {/* Template Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Template <span className="text-slate-400 font-normal lowercase">(optional)</span>
                </label>
                <select
                  value={selectedTemplate?.id || ""}
                  onChange={(e) => {
                    const found = templates.find((t) => t.id === e.target.value);
                    setSelectedTemplate(found || null);
                  }}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#274690] focus:ring-1 focus:ring-[#274690]"
                >
                  <option value="">-- Standard AI Generated Structure --</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.category ? `[${t.category}]` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Source Document Upload (Automatic OCR) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Reference / Scanned Document <span className="text-slate-400 font-normal lowercase">(optional OCR)</span>
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-[#274690] rounded-xl p-3.5 text-center cursor-pointer transition bg-slate-50/30 hover:bg-blue-50/20"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.docx,.txt"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSourceFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                  {sourceFile ? (
                    <div className="flex items-center justify-between text-xs px-2 text-slate-700">
                      <span className="font-semibold truncate flex items-center gap-1.5 text-emerald-700">
                        <FileCheck size={14} />
                        {sourceFile.name} ({(sourceFile.size / 1024).toFixed(1)} KB)
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSourceFile(null);
                        }}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                      <UploadCloud size={16} className="text-[#274690]" />
                      <span>Upload scanned document, PDF or image for automatic data extraction</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Describe requirement (Textarea) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Describe what you need <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="e.g. Create a quotation for Acme Corp for Cloud Integration Services valuing ₹3,00,000 including 18% GST with 30-day payment terms..."
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-[#274690] focus:ring-1 focus:ring-[#274690] leading-relaxed resize-y"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 rounded-xl bg-[#274690] hover:bg-[#1f3773] text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>{processingStage || "Building Document..."}</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} className="text-amber-300" />
                    <span>Build Document</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Generated Document View / Editor (Right Column) */}
          <div className="lg:col-span-6 space-y-4">
            {generatedDoc ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                {/* Ready Banner & Metadata */}
                <div className="border-b border-slate-100 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-700">Document Ready</h3>
                    </div>

                    {/* Preview / Edit Toggle */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setViewMode("preview")}
                        className={`px-3 py-1 rounded-lg transition ${
                          viewMode === "preview" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <Eye size={12} className="inline mr-1" />
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode("edit")}
                        className={`px-3 py-1 rounded-lg transition ${
                          viewMode === "edit" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <Edit3 size={12} className="inline mr-1" />
                        Edit
                      </button>
                    </div>
                  </div>

                  {/* Useful Metadata Grid */}
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-50/80 rounded-xl border border-slate-200/60 text-[11px]">
                    <div>
                      <span className="text-slate-400 block font-medium">Document Name</span>
                      <span className="font-bold text-slate-800 truncate block" title={generatedDoc.title}>
                        {generatedDoc.title}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Document Type</span>
                      <span className="font-bold text-slate-800 block">{generatedDoc.documentType}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Client</span>
                      <span className="font-bold text-slate-800 block truncate" title={generatedDoc.clientName || "Direct / Internal"}>
                        {generatedDoc.clientName || "Direct / Internal"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Created By</span>
                      <span className="font-bold text-slate-800 block">{roleDisplayName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Created Date</span>
                      <span className="font-bold text-slate-800 block">{generatedDoc.createdAt}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Status</span>
                      <span className={`font-bold block ${savedDocId ? "text-emerald-700" : "text-blue-700"}`}>
                        {savedDocId ? "Saved to Vault" : "Ready (Draft)"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content Area */}
                <div className="max-h-[480px] overflow-y-auto border border-slate-100 rounded-xl p-4 bg-slate-50/40 text-xs text-slate-700 leading-relaxed font-sans">
                  {viewMode === "preview" ? (
                    <div className="space-y-4">
                      {generatedDoc.sections.map((sec, idx) => (
                        <div key={sec.id || idx} className="border-b border-slate-200/50 pb-3 last:border-b-0">
                          <h4 className="font-bold text-slate-900 text-xs mb-1.5 uppercase tracking-wide">{sec.title}</h4>
                          {sec.body && <p className="whitespace-pre-line text-slate-600 leading-relaxed">{sec.body}</p>}
                          {sec.tableData && sec.tableData.headers && (
                            <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200">
                              <table className="min-w-full divide-y divide-slate-200 text-[11px]">
                                <thead className="bg-slate-100 text-slate-700 font-semibold">
                                  <tr>
                                    {sec.tableData.headers.map((h, i) => (
                                      <th key={i} className="px-3 py-2 text-left">
                                        {h}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                  {sec.tableData.rows.map((r, ri) => (
                                    <tr key={ri}>
                                      {r.map((cell, ci) => (
                                        <td key={ci} className="px-3 py-2 text-slate-600">
                                          {cell}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <textarea
                      rows={18}
                      value={editableContent}
                      onChange={(e) => setEditableContent(e.target.value)}
                      className="w-full bg-transparent border-0 focus:outline-none font-mono text-xs text-slate-800 resize-none leading-relaxed"
                    />
                  )}
                </div>

                {/* Action Buttons Toolbar */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveDocument}
                    disabled={isSaving}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    <span>Save to Vault</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download size={14} />
                    <span>Download PDF</span>
                  </button>

                  {userRole === "ORGANISATION_ADMIN" && (
                    <button
                      type="button"
                      onClick={() => setShowSendModal(true)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Mail size={14} />
                      <span>Send to Client</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setGeneratedDoc(null);
                      setSavedDocId(null);
                      setPromptText("");
                      setSourceFile(null);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                    title="Create Another Document"
                  >
                    <RotateCcw size={14} />
                    <span>Create Another</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[380px] bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-300 shadow-2xs">
                  <FileText size={24} />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-700">Document Output Preview</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Configure your requirements on the left and click "Build Document". Your finished document will appear here.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 2. EXTRACT / ANALYZE / SUMMARIZE / CUSTOM TAB CONTENT */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTool !== "create" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Input Form (Left) */}
          <div className="lg:col-span-6 space-y-6">
            <form onSubmit={handleRunSecondaryTool} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900">
                  {activeTool === "extract" && "Extract Structured Data"}
                  {activeTool === "analyze" && "Analyze Document"}
                  {activeTool === "summarize" && "Summarize Document"}
                  {activeTool === "custom" && "Custom AI Request"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload a scanned PDF, image, or paste text. Optical character recognition and parsing are completely automated.
                </p>
              </div>

              {/* Upload Document / OCR */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Upload Document <span className="text-slate-400 font-normal lowercase">(PDF, PNG, JPG, DOCX)</span>
                </label>
                <div
                  onClick={() => toolFileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-[#274690] rounded-xl p-4 text-center cursor-pointer transition bg-slate-50/40 hover:bg-blue-50/20"
                >
                  <input
                    ref={toolFileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.docx,.txt"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setToolFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                  {toolFile ? (
                    <div className="flex items-center justify-between text-xs px-2 text-slate-700">
                      <span className="font-semibold truncate flex items-center gap-1.5 text-emerald-700">
                        <FileCheck size={14} />
                        {toolFile.name} ({(toolFile.size / 1024).toFixed(1)} KB)
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setToolFile(null);
                        }}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-xs text-slate-500">
                      <UploadCloud size={20} className="text-[#274690]" />
                      <span className="font-medium">Click to select document or image file</span>
                      <span className="text-[10px] text-slate-400">Automatic OCR extraction applied</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Or Paste Raw Text */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Or Paste Document Text
                </label>
                <textarea
                  rows={toolFile ? 3 : 5}
                  value={toolTextInput}
                  onChange={(e) => setToolTextInput(e.target.value)}
                  placeholder="Paste document clauses, invoice content, contract terms..."
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-[#274690] focus:ring-1 focus:ring-[#274690] leading-relaxed resize-y"
                />
              </div>

              {/* Tool Specific Options */}
              {activeTool === "analyze" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Analysis Focus
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Key Clauses & Risks", "Obligations & Deadlines", "Financial Terms & Penalties", "Regulatory Compliance"].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setAnalysisFocus(opt)}
                        className={`p-2 rounded-xl border text-xs font-medium transition text-left ${
                          analysisFocus === opt ? "bg-[#274690] text-white border-[#274690]" : "bg-slate-50 text-slate-700 border-slate-200"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTool === "summarize" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Summary Length & Format
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "bullets", label: "Bullet Points" },
                      { id: "executive", label: "Executive Brief" },
                      { id: "detailed", label: "Comprehensive" },
                    ].map((fmt) => (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => setSummaryFormat(fmt.id)}
                        className={`p-2 rounded-xl border text-xs font-medium transition text-center ${
                          summaryFormat === fmt.id ? "bg-[#274690] text-white border-[#274690]" : "bg-slate-50 text-slate-700 border-slate-200"
                        }`}
                      >
                        {fmt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTool === "custom" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Custom Prompt / Request <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="Describe what you want the system to do with this document (e.g. rewrite for formal arbitration, translate to Hindi, verify compliance against GDPR...)"
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-[#274690] focus:ring-1 focus:ring-[#274690] leading-relaxed"
                  />
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 rounded-xl bg-[#274690] hover:bg-[#1f3773] text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>{processingStage || "Processing..."}</span>
                  </>
                ) : (
                  <>
                    <Wand2 size={16} className="text-amber-300" />
                    <span>Run AI Processing</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results Area (Right Column) */}
          <div className="lg:col-span-6 space-y-4">
            {toolResultText ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Processing Results</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Automated extraction and synthesis ready</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(toolResultText)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedResult ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    <span>{copiedResult ? "Copied" : "Copy"}</span>
                  </button>
                </div>

                {structuredExtract && typeof structuredExtract === "object" ? (
                  <div className="max-h-[460px] overflow-y-auto space-y-3">
                    <div className="rounded-xl border border-slate-200 overflow-hidden">
                      <table className="min-w-full divide-y divide-slate-200 text-xs">
                        <thead className="bg-slate-50 text-slate-700 font-semibold">
                          <tr>
                            <th className="px-3 py-2 text-left">Extracted Field</th>
                            <th className="px-3 py-2 text-left">Detected Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {Object.entries(structuredExtract).map(([k, v], idx) => (
                            <tr key={idx}>
                              <td className="px-3 py-2 font-medium text-slate-800 capitalize bg-slate-50/40 w-1/3">
                                {k.replace(/_/g, " ")}
                              </td>
                              <td className="px-3 py-2 text-slate-600">
                                {typeof v === "object" ? JSON.stringify(v) : String(v)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="max-h-[460px] overflow-y-auto p-4 rounded-xl bg-slate-50 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-sans border border-slate-100">
                    {toolResultText}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full min-h-[380px] bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-300 shadow-2xs">
                  <FileCode size={24} />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-700">Ready for Document Analysis</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Upload your document on the left and click "Run AI Processing". Output will render here.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PERMITTED DOCUMENT HISTORY ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-[#274690] flex items-center justify-center">
              <History size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Permitted Document History</h3>
              <p className="text-xs text-slate-500">Access, preview, and download documents within your {roleDisplayName} scope.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={refreshHistory}
            disabled={loadingHistory}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
          >
            <RefreshCw size={12} className={loadingHistory ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>

        {loadingHistory && historyDocs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading permitted documents...</div>
        ) : historyDocs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No generated documents found yet. Build your first document using the tool cards above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200/70">
                <tr>
                  <th className="px-3 py-2.5">Document #</th>
                  <th className="px-3 py-2.5">Title</th>
                  <th className="px-3 py-2.5">Type</th>
                  <th className="px-3 py-2.5">Client</th>
                  <th className="px-3 py-2.5">Created By</th>
                  <th className="px-3 py-2.5">Date</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {historyDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-3 py-2.5 font-mono font-bold text-[#274690]">
                      {doc.documentNumber}
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-slate-800 max-w-[180px] truncate" title={doc.title}>
                      {doc.title}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[10px]">
                        {doc.documentType}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 truncate max-w-[120px]">
                      {doc.clientName || "Direct"}
                    </td>
                    <td className="px-3 py-2.5 text-slate-500">
                      {doc.createdByName || "User"}
                    </td>
                    <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">
                      {new Date(doc.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={10} />
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right space-x-1 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handlePreviewHistoryDoc(doc)}
                        className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-[#274690] hover:text-white text-slate-700 font-semibold text-[11px] transition cursor-pointer"
                        title="Preview & Edit in Document Builder"
                      >
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => window.open(`/api/unified-documents/${doc.id}/download-pdf`, "_blank")}
                        className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition cursor-pointer"
                        title="Download PDF"
                      >
                        PDF
                      </button>
                      {userRole === "ORGANISATION_ADMIN" && (
                        <button
                          type="button"
                          onClick={() => {
                            setSavedDocId(doc.id);
                            setRecipientEmail(doc.clientEmail || "");
                            setEmailSubject(doc.title);
                            setEmailMessage(`Dear ${doc.clientName || "Client"},\n\nPlease find attached ${doc.title} for your reference.`);
                            setShowSendModal(true);
                          }}
                          className="px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-200 font-semibold text-[11px] transition cursor-pointer"
                          title="Send to Client"
                        >
                          Send
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── SEND TO CLIENT MODAL ── */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Mail size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Send Document to Client</h3>
                  <p className="text-xs text-slate-500">Delivered via official transactional email relay</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSendModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendEmailSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Recipient Email Address *</label>
                <input
                  type="email"
                  required
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="client@company.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#274690]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#274690]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Message Body</label>
                <textarea
                  rows={4}
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-[#274690] resize-y"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600 flex items-center gap-2">
                <FileCheck size={16} className="text-emerald-600 shrink-0" />
                <span>Generated PDF document will be attached to the message.</span>
              </div>

              {emailSentStatus && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium ${
                    emailSentStatus.includes("successfully")
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  {emailSentStatus}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSendModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingEmail}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSendingEmail ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  <span>Send Document</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
