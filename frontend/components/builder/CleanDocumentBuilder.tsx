"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FileText,
  Sparkles,
  Layout,
  UploadCloud,
  ArrowRight,
  ArrowLeft,
  Save,
  Check,
  AlertCircle,
  Plus,
  Trash2,
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Table as TableIcon,
  PenTool,
  Clock,
  Layers,
  Calendar,
  Building2,
  ChevronDown,
  X,
} from "lucide-react";
import apiClient from "@/lib/axios";

export type RoleType = "ORGANISATION_ADMIN" | "DEPARTMENT_MANAGER" | "TEAM_LEADER" | "STAFF";

interface DocumentBuilderProps {
  role: RoleType;
  roleDisplayName?: string;
  initialDocId?: string;
}

export type BuilderMode = "START" | "EDITOR";

export interface DocumentSection {
  id: string;
  type: "header" | "text" | "table" | "financial" | "signature";
  title: string;
  body?: string;
  tableData?: {
    headers: string[];
    rows: string[][];
  };
  financialItems?: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  taxPercent?: number;
}

export default function CleanDocumentBuilder({
  role,
  initialDocId,
}: DocumentBuilderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const roleSlug = useMemo(() => {
    switch (role) {
      case "ORGANISATION_ADMIN":
        return "org-admin";
      case "DEPARTMENT_MANAGER":
        return "department-manager";
      case "TEAM_LEADER":
        return "team-leader";
      default:
        return "employee";
    }
  }, [role]);

  // Screen Mode: "START" or "EDITOR"
  const [mode, setMode] = useState<BuilderMode>("START");

  // Document Metadata
  const [docId, setDocId] = useState<string | null>(initialDocId || null);
  const [documentNumber, setDocumentNumber] = useState<string>("");
  const [documentTitle, setDocumentTitle] = useState<string>("Untitled Document");
  const [documentType, setDocumentType] = useState<string>("Quotation");
  const [clientName, setClientName] = useState<string>("");
  const [category, setCategory] = useState<string>("Sales");
  const [documentDate, setDocumentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Sections in Editor Canvas
  const [sections, setSections] = useState<DocumentSection[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  // AI Generation Form States
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [aiDocType, setAiDocType] = useState<string>("Quotation");
  const [aiClient, setAiClient] = useState<string>("");
  const [aiTone, setAiTone] = useState<string>("Professional");
  const [aiInstructions, setAiInstructions] = useState<string>("");
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);

  // Template Selection States
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false);

  // OCR Upload States
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [isProcessingOcr, setIsProcessingOcr] = useState<boolean>(false);
  const [ocrExtractedData, setOcrExtractedData] = useState<any | null>(null);

  // Save States
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toast, setToast] = useState<{ title: string; message?: string; type: "success" | "error" } | null>(null);

  const showToast = (title: string, message?: string, type: "success" | "error" = "success") => {
    setToast({ title, message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Load existing document if docId is passed in URL query or props
  useEffect(() => {
    const qDocId = searchParams.get("docId") || initialDocId;
    if (qDocId) {
      setDocId(qDocId);
      apiClient
        .get(`/api/unified-documents/${qDocId}`)
        .then((res) => {
          if (res.data?.success && res.data.data) {
            const d = res.data.data;
            setDocumentTitle(d.title || "Untitled Document");
            setDocumentNumber(d.documentNumber || "");
            setDocumentType(d.documentType || "Document");
            setClientName(d.clientName || "");
            setCategory(d.category || "General");
            if (Array.isArray(d.content) && d.content.length > 0) {
              setSections(d.content);
            } else {
              setSections([
                {
                  id: "sec_1",
                  type: "text",
                  title: "Document Content",
                  body: typeof d.content === "string" ? d.content : "Draft body",
                },
              ]);
            }
            setMode("EDITOR");
          }
        })
        .catch(() => {});
    }
  }, [searchParams, initialDocId]);

  // Check if template payload was passed via sessionStorage (from Templates page "Use Template")
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("active_template_payload");
      if (stored) {
        sessionStorage.removeItem("active_template_payload");
        const payload = JSON.parse(stored);
        setDocumentTitle(`${payload.templateName} Draft`);
        setDocumentType(payload.documentType || "Document");
        setCategory(payload.category || "General");
        
        // Replace variables in sections
        let appliedSections = payload.sections || [];
        if (payload.variables && typeof payload.variables === "object") {
          const varEntries = Object.entries(payload.variables);
          appliedSections = appliedSections.map((sec: any) => {
            let bodyStr = sec.body || "";
            let titleStr = sec.title || "";
            varEntries.forEach(([k, v]) => {
              const regex = new RegExp(`\\{\\{${k}\\}\\}`, "g");
              bodyStr = bodyStr.replace(regex, String(v));
              titleStr = titleStr.replace(regex, String(v));
            });
            return { ...sec, body: bodyStr, title: titleStr };
          });
          if (payload.variables.client_name) {
            setClientName(payload.variables.client_name);
          }
        }
        setSections(appliedSections);
        setMode("EDITOR");
      }
    } catch {}
  }, []);

  // Fetch templates for "Use Template" option
  useEffect(() => {
    apiClient
      .get("/api/unified-templates")
      .then((res) => {
        if (res.data?.success) {
          setTemplates(res.data.data || []);
        }
      })
      .catch(() => {});
  }, []);

  // ==========================================
  // CREATION METHOD 1: START BLANK
  // ==========================================
  const handleStartBlank = () => {
    setDocumentTitle("Untitled Document");
    setDocumentType("General Document");
    setSections([
      {
        id: "sec_1",
        type: "header",
        title: "Introduction",
        body: "Enter the introduction and purpose of this document...",
      },
      {
        id: "sec_2",
        type: "text",
        title: "Scope & Deliverables",
        body: "Detail the specific deliverables, milestones, and project scope here.",
      },
      {
        id: "sec_3",
        type: "signature",
        title: "Sign-Off & Acceptance",
        body: "Authorized Signatory:\nDate: " + new Date().toLocaleDateString(),
      },
    ]);
    setMode("EDITOR");
  };

  // ==========================================
  // CREATION METHOD 2: USE TEMPLATE
  // ==========================================
  const handleSelectTemplate = (tpl: any) => {
    setSelectedTemplate(tpl);
    // Parse variables
    const vars: Record<string, string> = {};
    if (tpl.defaultVariables && typeof tpl.defaultVariables === "object") {
      Object.keys(tpl.defaultVariables).forEach((k) => (vars[k] = ""));
    }
    if (Array.isArray(tpl.sections)) {
      const regex = /\{\{([a-zA-Z0-9_-]+)\}\}/g;
      tpl.sections.forEach((sec: any) => {
        const text = `${sec.title || ""} ${sec.body || ""}`;
        let m;
        while ((m = regex.exec(text)) !== null) {
          vars[m[1]] = "";
        }
      });
    }
    setTemplateVariables(vars);
    setShowTemplateModal(true);
  };

  const handleApplyTemplate = () => {
    if (!selectedTemplate) return;
    setDocumentTitle(`${selectedTemplate.name} Draft`);
    setDocumentType(selectedTemplate.documentType || "Document");
    setCategory(selectedTemplate.category || "General");

    let applied = selectedTemplate.sections || [];
    const entries = Object.entries(templateVariables);
    applied = applied.map((sec: any) => {
      let bodyStr = sec.body || "";
      let titleStr = sec.title || "";
      entries.forEach(([k, v]) => {
        if (v) {
          const reg = new RegExp(`\\{\\{${k}\\}\\}`, "g");
          bodyStr = bodyStr.replace(reg, v);
          titleStr = titleStr.replace(reg, v);
        }
      });
      return { ...sec, body: bodyStr, title: titleStr };
    });

    if (templateVariables.client_name) {
      setClientName(templateVariables.client_name);
    }

    setSections(applied);
    setShowTemplateModal(false);
    setMode("EDITOR");
  };

  // ==========================================
  // CREATION METHOD 3: CREATE WITH AI
  // ==========================================
  const handleGenerateWithAi = async () => {
    if (!aiPrompt.trim()) {
      showToast("Prompt Required", "Please describe the document you want to create.", "error");
      return;
    }
    setIsGeneratingAi(true);
    try {
      const res = await apiClient.post("/api/unified-documents/ai-generate", {
        prompt: aiPrompt,
        documentTypeOverride: aiDocType,
        clientContext: aiClient ? { name: aiClient } : undefined,
        categoryOverride: "Sales",
      });

      if (res.data?.success && res.data.data) {
        const gen = res.data.data;
        setDocumentTitle(gen.title || `${aiDocType} for ${aiClient || "Client"}`);
        setDocumentType(gen.documentType || aiDocType);
        setClientName(gen.clientName || aiClient);
        setCategory(gen.category || "Sales");

        if (Array.isArray(gen.sections) && gen.sections.length > 0) {
          setSections(gen.sections);
        } else {
          setSections([
            {
              id: "sec_ai_1",
              type: "header",
              title: "Executive Summary",
              body: gen.summary || gen.description || "Generated by AI.",
            },
            {
              id: "sec_ai_2",
              type: "text",
              title: "Project Scope & Terms",
              body: gen.rawText || "Scope details.",
            },
          ]);
        }
        showToast("AI Draft Generated", "Document structure loaded into editor.");
        setMode("EDITOR");
      }
    } catch (err: any) {
      showToast("AI Generation Failed", err.response?.data?.message || err.message, "error");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // ==========================================
  // CREATION METHOD 4: OCR FROM EXISTING FILE
  // ==========================================
  const handleProcessOcr = async (file: File) => {
    setIsProcessingOcr(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("action", "extract_invoice");

    try {
      const res = await apiClient.post("/api/ocr/process", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        setOcrExtractedData(res.data);
        showToast("File Extracted", "Data extracted with high confidence.");
      }
    } catch (err: any) {
      showToast("OCR Extraction Failed", err.response?.data?.message || err.message, "error");
    } finally {
      setIsProcessingOcr(false);
    }
  };

  const handleContinueFromOcr = () => {
    if (!ocrExtractedData) return;
    setDocumentTitle(ocrExtractedData.fileName?.replace(/\.[^/.]+$/, "") || "Extracted Document");
    setDocumentType("Invoice");

    const newSections: DocumentSection[] = [
      {
        id: "ocr_sec_1",
        type: "header",
        title: "Extracted Document Particulars",
        body: `Processed from: ${ocrExtractedData.fileName}\nConfidence: ${ocrExtractedData.confidenceScore || 98}%`,
      },
    ];

    if (ocrExtractedData.extractedText) {
      newSections.push({
        id: "ocr_sec_2",
        type: "text",
        title: "Extracted Text & Details",
        body: ocrExtractedData.extractedText.slice(0, 3000),
      });
    }

    if (ocrExtractedData.tables && ocrExtractedData.tables.length > 0) {
      const t = ocrExtractedData.tables[0];
      newSections.push({
        id: "ocr_sec_3",
        type: "table",
        title: "Extracted Line Items",
        tableData: {
          headers: t.headers || ["Item", "Qty", "Price", "Total"],
          rows: t.rows || [],
        },
      });
    }

    setSections(newSections);
    setMode("EDITOR");
  };

  // ==========================================
  // EDITOR ACTIONS & SAVE
  // ==========================================
  const handleAddSection = (type: "text" | "table" | "financial" | "signature") => {
    const newId = `sec_${Date.now()}`;
    const newSec: DocumentSection = {
      id: newId,
      type,
      title: type === "financial" ? "Financial Breakdown" : type === "table" ? "Table Section" : type === "signature" ? "Authorized Signatures" : "Section Title",
      body: type === "text" ? "Enter section content..." : "",
      tableData: type === "table" ? { headers: ["Item", "Description", "Value"], rows: [["A", "Details", "100"]] } : undefined,
      financialItems: type === "financial" ? [{ description: "Base Service Fee", quantity: 1, unitPrice: 50000, total: 50000 }] : undefined,
      taxPercent: type === "financial" ? 18 : undefined,
    };
    setSections([...sections, newSec]);
    setActiveSectionId(newId);
  };

  const handleUpdateSection = (id: string, updates: Partial<DocumentSection>) => {
    setSections(sections.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const handleDeleteSection = (id: string) => {
    setSections(sections.filter((s) => s.id !== id));
  };

  // Calculate total amount from financial items if present
  const calculatedTotal = useMemo(() => {
    let sum = 0;
    sections.forEach((sec) => {
      if (sec.type === "financial" && sec.financialItems) {
        const subtotal = sec.financialItems.reduce((acc, item) => acc + (item.total || 0), 0);
        const tax = sec.taxPercent ? (subtotal * sec.taxPercent) / 100 : 0;
        sum += subtotal + tax;
      }
    });
    return sum;
  }, [sections]);

  // Persist Document (Save Draft or Save & Continue)
  const handleSaveDocument = async (continueToLifecycle: boolean) => {
    if (!documentTitle.trim()) {
      showToast("Title Required", "Please provide a document title before saving.", "error");
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        title: documentTitle,
        documentType,
        category,
        clientName: clientName.trim() || undefined,
        content: sections,
        totalAmount: calculatedTotal > 0 ? calculatedTotal : undefined,
        date: documentDate,
      };

      let savedDoc;
      if (docId) {
        // Update existing document
        const res = await apiClient.put(`/api/unified-documents/${docId}`, payload);
        savedDoc = res.data?.data;
      } else {
        // Create new document
        const res = await apiClient.post("/api/unified-documents", payload);
        savedDoc = res.data?.data;
        if (savedDoc?.id) {
          setDocId(savedDoc.id);
          setDocumentNumber(savedDoc.documentNumber || "");
        }
      }

      showToast("Saved Successfully", `Document ${savedDoc?.documentNumber || ""} is saved.`);

      if (continueToLifecycle && savedDoc?.id) {
        // Navigate straight to Documents workspace with document active in view
        router.push(`/${roleSlug}/documents?docId=${savedDoc.id}`);
      }
    } catch (err: any) {
      showToast("Save Failed", err.response?.data?.message || err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================
  // RENDER: START SCREEN
  // ==========================================
  if (mode === "START") {
    return (
      <div className="min-h-screen bg-slate-50/50 dark:bg-zinc-950 p-6 lg:p-10 font-sans text-slate-900 dark:text-slate-100">
        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border text-sm bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200">
            <Check className="w-5 h-5 text-emerald-600" />
            <div>
              <div className="font-semibold">{toast.title}</div>
              {toast.message && <div className="text-xs opacity-90">{toast.message}</div>}
            </div>
          </div>
        )}

        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-10 text-center md:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Create Document
            </h1>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              Create a new document using AI, a template, or your own content.
            </p>
          </div>

          {/* 3 CLEAN PRIMARY CREATION OPTIONS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* OPTION 1: START BLANK */}
            <div
              onClick={handleStartBlank}
              className="group bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-4 group-hover:scale-105 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:group-hover:bg-indigo-950 dark:group-hover:text-indigo-400 transition-all">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  1. Start Blank
                </h3>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Create a document from scratch using our structured section canvas.
                </p>
              </div>

              <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                <span>Start with Canvas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* OPTION 2: USE TEMPLATE */}
            <div
              onClick={() => {
                if (templates.length > 0) {
                  handleSelectTemplate(templates[0]);
                } else {
                  showToast("No Templates", "No templates available. You can start blank.", "error");
                }
              }}
              className="group bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-4 group-hover:scale-105 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:group-hover:bg-indigo-950 dark:group-hover:text-indigo-400 transition-all">
                  <Layout className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  2. Use Template
                </h3>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Select an existing standard template and fill in required variables.
                </p>
              </div>

              <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                <span>Choose Template</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* OPTION 3: CREATE WITH AI */}
            <div
              onClick={() => {
                const aiEl = document.getElementById("ai-prompt-box");
                if (aiEl) aiEl.scrollIntoView({ behavior: "smooth" });
              }}
              className="group bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-indigo-400 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-sm">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  3. Create with AI
                </h3>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Describe what you need in natural language and let AI generate the draft.
                </p>
              </div>

              <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                <span>Prompt & Generate</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* AI GENERATION FORM SECTION */}
          <div
            id="ai-prompt-box"
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 lg:p-8 shadow-sm mb-10"
          >
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Describe your document
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <textarea
                  rows={3}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. Create a professional commercial quotation for Tata Consultancy Services for ₹4,50,000 covering cloud infrastructure and AI integration milestones..."
                  className="w-full p-4 text-sm bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Document Type
                  </label>
                  <select
                    value={aiDocType}
                    onChange={(e) => setAiDocType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="Quotation">Quotation</option>
                    <option value="Invoice">Invoice</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Agreement">Agreement</option>
                    <option value="Contract">Contract</option>
                    <option value="Report">Report</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Client Name
                  </label>
                  <input
                    type="text"
                    value={aiClient}
                    onChange={(e) => setAiClient(e.target.value)}
                    placeholder="e.g. Apex Retailers"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Tone
                  </label>
                  <select
                    value={aiTone}
                    onChange={(e) => setAiTone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="Professional">Professional</option>
                    <option value="Formal">Formal</option>
                    <option value="Persuasive">Persuasive</option>
                    <option value="Technical">Technical</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Additional Instructions
                  </label>
                  <input
                    type="text"
                    value={aiInstructions}
                    onChange={(e) => setAiInstructions(e.target.value)}
                    placeholder="e.g. Include 18% GST"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  disabled={isGeneratingAi || !aiPrompt.trim()}
                  onClick={handleGenerateWithAi}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium shadow-sm transition-all"
                >
                  {isGeneratingAi ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Generating with AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Document</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* SECONDARY INPUT OPTION: OCR FROM EXISTING FILE */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 lg:p-8 shadow-sm">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                <UploadCloud className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Create from Existing File (OCR)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mb-5">
              Upload a scanned PDF or invoice image to automatically extract text and line items into the editor.
            </p>

            <div className="border-2 border-dashed border-slate-200 dark:border-zinc-700 rounded-xl p-6 text-center hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors">
              <input
                type="file"
                id="ocr-file-input"
                accept=".pdf,.png,.jpg,.jpeg,.txt"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setOcrFile(file);
                    handleProcessOcr(file);
                  }
                }}
                className="hidden"
              />
              <label
                htmlFor="ocr-file-input"
                className="cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {ocrFile ? ocrFile.name : "Click to upload or drag and drop"}
                </div>
                <div className="text-[11px] text-slate-400">PDF, JPG, PNG or TXT up to 25MB</div>
              </label>

              {isProcessingOcr && (
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-indigo-600 dark:text-indigo-400">
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <span>Processing OCR and extracting tables...</span>
                </div>
              )}

              {ocrExtractedData && !isProcessingOcr && (
                <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
                  <span>
                    ✓ Extracted with {ocrExtractedData.confidenceScore || 98}% confidence score.
                  </span>
                  <button
                    onClick={handleContinueFromOcr}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium text-xs transition-colors"
                  >
                    <span>Continue to Editor</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MODAL: SELECT TEMPLATE & FILL VARIABLES */}
        {showTemplateModal && selectedTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 p-6 max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800 mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedTemplate.name}
                  </h3>
                  <p className="text-xs text-slate-500">Provide variable values to initialize draft.</p>
                </div>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3.5 py-1 text-xs">
                {/* Template Selector Dropdown if user wants to switch */}
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Select Template
                  </label>
                  <select
                    value={selectedTemplate.id}
                    onChange={(e) => {
                      const match = templates.find((t) => t.id === e.target.value);
                      if (match) handleSelectTemplate(match);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.documentType})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Variable fields */}
                {Object.keys(templateVariables).map((key) => {
                  const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
                  return (
                    <div key={key}>
                      <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {label} <span className="text-slate-400 font-mono text-[10px]">({`{{${key}}}`})</span>
                      </label>
                      <input
                        type={key.toLowerCase().includes("date") ? "date" : "text"}
                        value={templateVariables[key] || ""}
                        onChange={(e) =>
                          setTemplateVariables({ ...templateVariables, [key]: e.target.value })
                        }
                        placeholder={`Enter ${label.toLowerCase()}...`}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800 mt-4">
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyTemplate}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                >
                  <span>Apply & Open Editor</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // RENDER: THE DOCUMENT EDITOR CANVAS
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-zinc-950 font-sans text-slate-900 dark:text-slate-100 flex flex-col">
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border text-sm transition-all duration-300 ${
            toast.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950 dark:border-rose-800 dark:text-rose-200"
              : "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200"
          }`}
        >
          {toast.type === "error" ? <AlertCircle className="w-5 h-5 text-rose-600" /> : <Check className="w-5 h-5 text-emerald-600" />}
          <div>
            <div className="font-semibold">{toast.title}</div>
            {toast.message && <div className="text-xs opacity-90">{toast.message}</div>}
          </div>
        </div>
      )}

      {/* TOP METADATA & ACTIONS HEADER */}
      <header className="sticky top-0 z-30 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 px-6 py-3 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMode("START")}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            title="Return to Creation Start"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              placeholder="Document Title"
              className="text-base font-bold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none px-1 py-0.5"
            />
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span className="font-mono text-slate-400">{documentNumber || "DRAFT-PREVIEW"}</span>
              <span>•</span>
              <span>{documentType}</span>
              {clientName && <span>• Client: {clientName}</span>}
            </div>
          </div>
        </div>

        {/* Top-Right Builder Actions: [ Save Draft ] and [ Save & Continue ] */}
        <div className="flex items-center gap-2.5">
          <button
            disabled={isSaving}
            onClick={() => handleSaveDocument(false)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <Save className="w-3.5 h-3.5 text-slate-500" />
            <span>{isSaving ? "Saving..." : "Save Draft"}</span>
          </button>

          <button
            disabled={isSaving}
            onClick={() => handleSaveDocument(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
          >
            <span>Save & Continue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* COMPACT FORMATTING TOOLBAR */}
      <div className="sticky top-[57px] z-20 bg-slate-50 dark:bg-zinc-900/90 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800 px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
          <button
            onClick={() => handleAddSection("text")}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 hover:bg-slate-200/60 dark:hover:bg-zinc-800 rounded"
            title="Add Text Section"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>+ Text</span>
          </button>

          <button
            onClick={() => handleAddSection("table")}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 hover:bg-slate-200/60 dark:hover:bg-zinc-800 rounded"
            title="Add Table"
          >
            <TableIcon className="w-3.5 h-3.5 text-slate-500" />
            <span>+ Table</span>
          </button>

          <button
            onClick={() => handleAddSection("financial")}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 hover:bg-slate-200/60 dark:hover:bg-zinc-800 rounded"
            title="Add Financial Breakdown"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>+ Financials</span>
          </button>

          <button
            onClick={() => handleAddSection("signature")}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 hover:bg-slate-200/60 dark:hover:bg-zinc-800 rounded"
            title="Add Signature Block"
          >
            <PenTool className="w-3.5 h-3.5 text-slate-500" />
            <span>+ Signature</span>
          </button>
        </div>

        {/* Small metadata settings */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <span>Type:</span>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="bg-transparent font-medium text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="Quotation">Quotation</option>
              <option value="Invoice">Invoice</option>
              <option value="Proposal">Proposal</option>
              <option value="Agreement">Agreement</option>
              <option value="Contract">Contract</option>
              <option value="Report">Report</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span>Client:</span>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Client Name"
              className="w-28 bg-transparent font-medium text-slate-800 dark:text-slate-200 border-b border-dashed border-slate-300 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* A4 CANVAS CONTAINER */}
      <main className="flex-1 p-6 lg:p-12 overflow-y-auto flex justify-center">
        <div className="w-full max-w-4xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-lg p-10 lg:p-14 min-h-[1050px] flex flex-col justify-between">
          <div>
            {/* A4 Document Header */}
            <div className="border-b border-slate-200 dark:border-zinc-800 pb-8 mb-8">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    {documentType}
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white mt-1">
                    {documentTitle}
                  </h1>
                </div>

                <div className="text-right text-xs text-slate-500">
                  <div className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {documentNumber || "DRAFT-2026-PREVIEW"}
                  </div>
                  <div className="mt-1">Date: {documentDate}</div>
                </div>
              </div>

              {clientName && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800/80 text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Prepared for:</span>{" "}
                  {clientName}
                </div>
              )}
            </div>

            {/* Sections Canvas */}
            <div className="space-y-8">
              {sections.map((sec, idx) => (
                <div
                  key={sec.id}
                  onClick={() => setActiveSectionId(sec.id)}
                  className={`group relative p-4 rounded-xl transition-all ${
                    activeSectionId === sec.id
                      ? "ring-2 ring-indigo-500/40 bg-indigo-50/10"
                      : "hover:bg-slate-50 dark:hover:bg-zinc-800/30"
                  }`}
                >
                  {/* Delete Section Button on Hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSection(sec.id);
                    }}
                    className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 p-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 hover:bg-rose-200 transition-all"
                    title="Remove Section"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  {/* Section Title */}
                  <input
                    type="text"
                    value={sec.title}
                    onChange={(e) => handleUpdateSection(sec.id, { title: e.target.value })}
                    className="w-full text-base font-bold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-500 focus:outline-none mb-2"
                  />

                  {/* Section Body based on Type */}
                  {sec.type === "text" || sec.type === "header" ? (
                    <textarea
                      rows={4}
                      value={sec.body || ""}
                      onChange={(e) => handleUpdateSection(sec.id, { body: e.target.value })}
                      placeholder="Write your section content here..."
                      className="w-full text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-transparent border border-transparent hover:border-slate-200 focus:border-indigo-500 rounded-lg p-2 focus:outline-none resize-y"
                    />
                  ) : null}

                  {/* Section Type: Table */}
                  {sec.type === "table" && sec.tableData && (
                    <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden text-xs mt-2">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-slate-400">
                          <tr>
                            {sec.tableData.headers.map((h, hIdx) => (
                              <th key={hIdx} className="px-3 py-2 font-semibold">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                          {sec.tableData.rows.map((row, rIdx) => (
                            <tr key={rIdx}>
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="px-3 py-2">
                                  <input
                                    type="text"
                                    value={cell}
                                    onChange={(e) => {
                                      const newRows = [...sec.tableData!.rows];
                                      newRows[rIdx][cIdx] = e.target.value;
                                      handleUpdateSection(sec.id, {
                                        tableData: { ...sec.tableData!, rows: newRows },
                                      });
                                    }}
                                    className="w-full bg-transparent focus:outline-none"
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Section Type: Financial Breakdown */}
                  {sec.type === "financial" && sec.financialItems && (
                    <div className="space-y-3 mt-2 text-xs">
                      <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-slate-400">
                            <tr>
                              <th className="px-3 py-2 font-semibold">Description</th>
                              <th className="px-3 py-2 font-semibold w-16">Qty</th>
                              <th className="px-3 py-2 font-semibold w-28">Rate (₹)</th>
                              <th className="px-3 py-2 font-semibold w-28 text-right">Total (₹)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                            {sec.financialItems.map((item, fIdx) => (
                              <tr key={fIdx}>
                                <td className="px-3 py-2">
                                  <input
                                    type="text"
                                    value={item.description}
                                    onChange={(e) => {
                                      const newItems = [...sec.financialItems!];
                                      newItems[fIdx].description = e.target.value;
                                      handleUpdateSection(sec.id, { financialItems: newItems });
                                    }}
                                    className="w-full bg-transparent focus:outline-none"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => {
                                      const newItems = [...sec.financialItems!];
                                      const qty = Number(e.target.value) || 0;
                                      newItems[fIdx].quantity = qty;
                                      newItems[fIdx].total = qty * newItems[fIdx].unitPrice;
                                      handleUpdateSection(sec.id, { financialItems: newItems });
                                    }}
                                    className="w-full bg-transparent focus:outline-none"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    value={item.unitPrice}
                                    onChange={(e) => {
                                      const newItems = [...sec.financialItems!];
                                      const rate = Number(e.target.value) || 0;
                                      newItems[fIdx].unitPrice = rate;
                                      newItems[fIdx].total = newItems[fIdx].quantity * rate;
                                      handleUpdateSection(sec.id, { financialItems: newItems });
                                    }}
                                    className="w-full bg-transparent focus:outline-none"
                                  />
                                </td>
                                <td className="px-3 py-2 text-right font-medium">
                                  ₹{item.total.toLocaleString("en-IN")}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Financial Totals Calculation */}
                      <div className="flex justify-end pr-3">
                        <div className="w-52 space-y-1 text-right">
                          <div className="flex justify-between text-slate-500">
                            <span>Subtotal:</span>
                            <span>
                              ₹
                              {sec.financialItems
                                .reduce((acc, i) => acc + i.total, 0)
                                .toLocaleString("en-IN")}
                            </span>
                          </div>
                          {sec.taxPercent !== undefined && (
                            <div className="flex justify-between text-slate-500">
                              <span>GST ({sec.taxPercent}%):</span>
                              <span>
                                ₹
                                {(
                                  (sec.financialItems.reduce((acc, i) => acc + i.total, 0) *
                                    sec.taxPercent) /
                                  100
                                ).toLocaleString("en-IN")}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-zinc-800">
                            <span>Grand Total:</span>
                            <span>
                              ₹
                              {(
                                sec.financialItems.reduce((acc, i) => acc + i.total, 0) *
                                (1 + (sec.taxPercent || 0) / 100)
                              ).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Section Type: Signature */}
                  {sec.type === "signature" && (
                    <div className="mt-4 pt-6 border-t border-dashed border-slate-200 dark:border-zinc-800 grid grid-cols-2 gap-8 text-xs text-slate-500">
                      <div>
                        <div className="h-14 border-b border-slate-300 dark:border-zinc-700 flex items-end pb-1 font-serif italic text-slate-700 dark:text-slate-300">
                          {clientName || "Authorized Client Signatory"}
                        </div>
                        <div className="mt-1 font-medium">Client Acceptance</div>
                      </div>
                      <div>
                        <div className="h-14 border-b border-slate-300 dark:border-zinc-700 flex items-end pb-1 font-serif italic text-slate-700 dark:text-slate-300">
                          Enterprise Authorized Signature
                        </div>
                        <div className="mt-1 font-medium">Service Provider Execution</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Canvas Footer */}
          <div className="pt-8 border-t border-slate-200 dark:border-zinc-800 text-center text-[11px] text-slate-400">
            Official Document • Confidential & Proprietary
          </div>
        </div>
      </main>
    </div>
  );
}
