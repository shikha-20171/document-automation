"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Sparkles, Save, Eye, CheckCircle2, History, Plus, Trash2,
  Download, Send, Building2, Layers, AlertCircle, RefreshCw,
  FileText, ArrowLeft, MoreVertical, FileCode, Check, Copy,
  ExternalLink, ArrowUpRight, ShieldCheck, ChevronDown, PenTool
} from "lucide-react";
import apiClient from "@/lib/axios";

interface DocumentSection {
  id: string;
  type: "header" | "text" | "table" | "terms" | "signature";
  title: string;
  body?: string;
  tableData?: {
    headers: string[];
    rows: string[][];
  };
  metadata?: Record<string, any>;
}

interface DocumentVersion {
  id: string;
  versionNumber: number;
  title: string;
  changeSummary?: string | null;
  createdByName?: string | null;
  createdAt: string;
}

interface UnifiedDocument {
  id: string;
  documentNumber: string;
  title: string;
  documentType: string;
  category: string;
  status: string;
  clientName?: string | null;
  clientEmail?: string | null;
  clientPhone?: string | null;
  clientAddress?: string | null;
  clientContactPerson?: string | null;
  clientId?: string | null;
  content: DocumentSection[];
  financialData?: {
    currency?: string;
    subtotal?: number;
    discountValue?: number;
    discountAmount?: number;
    taxRate?: number;
    taxAmount?: number;
    total?: number;
  } | null;
  variables: Record<string, string>;
  templateId?: string | null;
  currentVersion: number;
  publicShareToken: string;
  createdAt: string;
  updatedAt: string;
  versions?: DocumentVersion[];
}

interface CrmClient {
  id: string;
  name: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
}

interface TemplateOption {
  id: string;
  name: string;
  category: string;
  documentType: string;
  description?: string | null;
  sections?: DocumentSection[] | null;
  defaultVariables?: Record<string, string> | null;
}

const PROMPT_SUGGESTIONS = [
  "Create a professional quotation for ABC Technologies for ₹3,00,000 website development.",
  "Create an invoice for ABC Technologies for website development worth ₹3,00,000.",
  "Create a professional business proposal for an e-commerce website project.",
  "Create a service agreement between my company and ABC Technologies.",
  "Create an employment offer letter for a frontend developer.",
  "Create an NDA between my company and XYZ Pvt Ltd.",
  "Create a project completion certificate.",
  "Create a purchase order for 50 laptops.",
  "Create a sales contract for software development services.",
  "Create a custom document explaining our company's software development services, pricing model, implementation process and support.",
];

export default function UniversalAiDocumentBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const docIdParam = searchParams.get("id");
  const templateIdParam = searchParams.get("templateId");

  // Document State
  const [documentId, setDocumentId] = useState<string | null>(docIdParam);
  const [documentNumber, setDocumentNumber] = useState<string>("");
  const [title, setTitle] = useState<string>("Professional Business Document");
  const [documentType, setDocumentType] = useState<string>("Business Proposal");
  const [category, setCategory] = useState<string>("Business");
  const [status, setStatus] = useState<string>("DRAFT");
  const [currentVersion, setCurrentVersion] = useState<number>(1);
  const [publicShareToken, setPublicShareToken] = useState<string>("");

  // Client Details
  const [clientId, setClientId] = useState<string>("");
  const [clientName, setClientName] = useState<string>("");
  const [clientContactPerson, setClientContactPerson] = useState<string>("");
  const [clientEmail, setClientEmail] = useState<string>("");
  const [clientPhone, setClientPhone] = useState<string>("");
  const [clientAddress, setClientAddress] = useState<string>("");

  // Content Sections
  const [sections, setSections] = useState<DocumentSection[]>([
    {
      id: "sec_1",
      type: "header",
      title: "Document Heading & Overview",
      body: "This document outlines the commercial objectives, scope of deliverables, and service level commitments.",
    },
    {
      id: "sec_2",
      type: "text",
      title: "1. Scope of Deliverables & Requirements",
      body: "• Implementation of scalable cloud architectures and authenticated API endpoints.\n• Responsive user interface engineering adhering to design tokens.\n• Quality assurance, end-to-end testing, and production deployment pipeline.",
    },
    {
      id: "sec_3",
      type: "table",
      title: "2. Deliverable Milestones & Investment",
      tableData: {
        headers: ["Milestone / Item", "Scope Description", "Qty", "Unit", "Rate (INR)", "Amount (INR)"],
        rows: [
          ["Sprint 1: Architecture & Prototyping", "Design tokens, Figma system & DB schema", "1", "milestone", "50000", "50000"],
          ["Sprint 2: Full-Stack Engineering", "Core microservices and frontend application", "1", "milestone", "150000", "150000"],
          ["Sprint 3: QA & Cloud Go-Live", "Penetration testing and production launch", "1", "milestone", "50000", "50000"],
        ],
      },
    },
    {
      id: "sec_4",
      type: "terms",
      title: "3. Terms, Payment Schedule & IP Ownership",
      body: "• Payment Terms: 50% advance on execution, 50% upon final production handover.\n• Validity: Valid for 30 calendar days from the date of issuance.\n• Complete intellectual property and source code transferred upon final invoice settlement.",
    },
    {
      id: "sec_5",
      type: "signature",
      title: "4. Execution & Authorization",
      body: "Signed by authorized representatives of both parties.",
    },
  ]);

  // Variables & Financials
  const [variables, setVariables] = useState<Record<string, string>>({
    company_name: "Enterprise Solutions Tech Pvt Ltd",
    client_name: "ABC Technologies",
  });
  const [financialData, setFinancialData] = useState<any>({
    currency: "INR",
    subtotal: 250000,
    taxRate: 18,
    taxAmount: 45000,
    total: 295000,
  });

  // AI & Detection State
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [detectedType, setDetectedType] = useState<{ type: string; category: string; confidence: number } | null>(null);
  const [generatingAi, setGeneratingAi] = useState<boolean>(false);

  // CRM & Template Data
  const [crmClients, setCrmClients] = useState<CrmClient[]>([]);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);

  // UI Modes
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");
  const [saving, setSaving] = useState<boolean>(false);
  const [showVersionsDrawer, setShowVersionsDrawer] = useState<boolean>(false);
  const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false);
  const [templateSaveName, setTemplateSaveName] = useState<string>("");
  const [templateSaveCategory, setTemplateSaveCategory] = useState<string>("General");
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
  const [emailRecipient, setEmailRecipient] = useState<string>("");
  const [emailMessage, setEmailMessage] = useState<string>("");
  const [sendingEmail, setSendingEmail] = useState<boolean>(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ title: string; desc?: string; type?: "success" | "error" } | null>(null);

  const showToast = (title: string, desc?: string, type: "success" | "error" = "success") => {
    setToastMessage({ title, desc, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Load CRM Clients & Templates
  useEffect(() => {
    async function fetchCatalogs() {
      try {
        const [clientRes, tplRes] = await Promise.all([
          apiClient.get("/api/crm/clients").catch(() => ({ data: { data: [] } })),
          apiClient.get("/api/unified-templates").catch(() => ({ data: { data: [] } })),
        ]);
        if (clientRes.data?.data) setCrmClients(clientRes.data.data);
        if (tplRes.data?.data) {
          setTemplates(tplRes.data.data);
          if (templateIdParam) {
            const found = tplRes.data.data.find((t: TemplateOption) => t.id === templateIdParam);
            if (found) applyTemplate(found);
          }
        }
      } catch (err) {
        console.warn("Catalog fetch error:", err);
      }
    }
    fetchCatalogs();
  }, [templateIdParam]);

  // Load Existing Document if docIdParam present
  useEffect(() => {
    if (!docIdParam) return;
    async function loadDoc() {
      try {
        const res = await apiClient.get(`/api/unified-documents/${docIdParam}`);
        if (res.data?.success && res.data.data) {
          populateDocument(res.data.data);
        }
      } catch (err: any) {
        showToast("Load Failed", err.response?.data?.message || err.message, "error");
      }
    }
    loadDoc();
  }, [docIdParam]);

  const populateDocument = (doc: UnifiedDocument) => {
    setDocumentId(doc.id);
    setDocumentNumber(doc.documentNumber);
    setTitle(doc.title);
    setDocumentType(doc.documentType);
    setCategory(doc.category);
    setStatus(doc.status);
    setCurrentVersion(doc.currentVersion);
    setPublicShareToken(doc.publicShareToken);
    setClientId(doc.clientId || "");
    setClientName(doc.clientName || "");
    setClientContactPerson(doc.clientContactPerson || "");
    setClientEmail(doc.clientEmail || "");
    setClientPhone(doc.clientPhone || "");
    setClientAddress(doc.clientAddress || "");
    if (Array.isArray(doc.content)) setSections(doc.content);
    if (doc.financialData) setFinancialData(doc.financialData);
    if (doc.variables) setVariables(doc.variables);
    if (Array.isArray(doc.versions)) setVersions(doc.versions);
  };

  // Real-time intent detection on typing
  useEffect(() => {
    if (!aiPrompt.trim() || aiPrompt.length < 5) {
      setDetectedType(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await apiClient.post("/api/unified-documents/detect-intent", { prompt: aiPrompt });
        if (res.data?.success && res.data.data) {
          setDetectedType({
            type: res.data.data.documentType,
            category: res.data.data.category,
            confidence: res.data.data.confidence,
          });
        }
      } catch {
        // quiet fallback
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [aiPrompt]);

  // Handle Client Selection
  const handleSelectClient = (cId: string) => {
    setClientId(cId);
    const client = crmClients.find((c) => c.id === cId);
    if (client) {
      setClientName(client.name);
      if (client.contactPerson) setClientContactPerson(client.contactPerson);
      if (client.email) setClientEmail(client.email);
      if (client.phone) setClientPhone(client.phone);
      if (client.address || client.city) {
        setClientAddress([client.address, client.city].filter(Boolean).join(", "));
      }
      setVariables((prev) => ({
        ...prev,
        client_name: client.name,
        client_address: client.address || client.city || "",
      }));
    }
  };

  // Apply Template
  const applyTemplate = (tpl: TemplateOption) => {
    setDocumentType(tpl.documentType);
    setCategory(tpl.category);
    setTitle(`${tpl.documentType} - ${clientName || "Valued Client"}`);
    if (Array.isArray(tpl.sections) && tpl.sections.length > 0) {
      setSections(tpl.sections);
    }
    if (tpl.defaultVariables) {
      setVariables((prev) => ({ ...tpl.defaultVariables, ...prev }));
    }
    showToast("Template Applied", `Loaded structure from "${tpl.name}"`);
  };

  // Generate with AI
  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) {
      showToast("Empty Prompt", "Please describe the document you want to generate.", "error");
      return;
    }

    try {
      setGeneratingAi(true);
      const res = await apiClient.post("/api/unified-documents/ai-generate", {
        prompt: aiPrompt.trim(),
        clientContext: clientId ? crmClients.find((c) => c.id === clientId) : null,
        documentTypeOverride: detectedType?.type || documentType,
        categoryOverride: detectedType?.category || category,
      });

      if (res.data?.success && res.data.data) {
        const gen = res.data.data;
        setTitle(gen.title);
        setDocumentType(gen.documentType);
        setCategory(gen.category);
        if (gen.clientName && !clientName) setClientName(gen.clientName);
        if (gen.clientEmail && !clientEmail) setClientEmail(gen.clientEmail);
        if (gen.clientContactPerson && !clientContactPerson) setClientContactPerson(gen.clientContactPerson);
        if (Array.isArray(gen.content) && gen.content.length > 0) setSections(gen.content);
        if (gen.financialData) setFinancialData(gen.financialData);
        if (gen.variables) setVariables((prev) => ({ ...prev, ...gen.variables }));

        showToast("Document Generated!", `AI structured a ${gen.documentType} with ${gen.content.length} sections.`);
      }
    } catch (err: any) {
      showToast("AI Generation Failed", err.response?.data?.message || err.message, "error");
    } finally {
      setGeneratingAi(false);
    }
  };

  // Section Manipulation
  const handleAddSection = (type: "text" | "table" | "terms" | "signature") => {
    const newId = `sec_${Date.now()}`;
    let newSec: DocumentSection = {
      id: newId,
      type,
      title: type === "table" ? "Deliverables / Breakdown" : type === "terms" ? "Terms & Conditions" : "New Section",
      body: type !== "table" ? "Enter section content here..." : undefined,
    };

    if (type === "table") {
      newSec.tableData = {
        headers: ["Item", "Specification", "Qty", "Amount"],
        rows: [["Component A", "Standard scope", "1", "10000"]],
      };
    }

    setSections([...sections, newSec]);
  };

  const handleUpdateSection = (id: string, field: keyof DocumentSection, val: any) => {
    setSections(sections.map((s) => (s.id === id ? { ...s, [field]: val } : s)));
  };

  const handleRemoveSection = (id: string) => {
    if (sections.length <= 1) {
      showToast("Notice", "Document must maintain at least one section.", "error");
      return;
    }
    setSections(sections.filter((s) => s.id !== id));
  };

  // Table Row Add/Remove
  const handleAddTableRow = (secId: string) => {
    setSections(
      sections.map((s) => {
        if (s.id !== secId || !s.tableData) return s;
        const colCount = s.tableData.headers.length;
        const newRow = Array(colCount).fill("New item");
        return {
          ...s,
          tableData: {
            ...s.tableData,
            rows: [...s.tableData.rows, newRow],
          },
        };
      })
    );
  };

  const handleUpdateTableCell = (secId: string, rowIdx: number, colIdx: number, val: string) => {
    setSections(
      sections.map((s) => {
        if (s.id !== secId || !s.tableData) return s;
        const newRows = [...s.tableData.rows];
        const updatedRow = [...newRows[rowIdx]];
        updatedRow[colIdx] = val;
        newRows[rowIdx] = updatedRow;
        return {
          ...s,
          tableData: {
            ...s.tableData,
            rows: newRows,
          },
        };
      })
    );
  };

  const handleRemoveTableRow = (secId: string, rowIdx: number) => {
    setSections(
      sections.map((s) => {
        if (s.id !== secId || !s.tableData) return s;
        if (s.tableData.rows.length <= 1) return s;
        return {
          ...s,
          tableData: {
            ...s.tableData,
            rows: s.tableData.rows.filter((_, i) => i !== rowIdx),
          },
        };
      })
    );
  };

  // Save / Versioning
  const handleSave = async (targetStatus: string = "DRAFT") => {
    if (!title.trim()) {
      showToast("Missing Title", "Please provide a document title.", "error");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: title.trim(),
        documentType,
        category,
        clientId: clientId || null,
        clientName: clientName?.trim() || null,
        clientEmail: clientEmail?.trim() || null,
        clientPhone: clientPhone?.trim() || null,
        clientAddress: clientAddress?.trim() || null,
        clientContactPerson: clientContactPerson?.trim() || null,
        content: sections,
        financialData,
        variables,
        status: targetStatus,
        aiPrompt: aiPrompt || null,
      };

      let res;
      if (documentId) {
        res = await apiClient.put(`/api/unified-documents/${documentId}`, payload);
      } else {
        res = await apiClient.post("/api/unified-documents", payload);
      }

      if (res.data?.success && res.data.data) {
        populateDocument(res.data.data);
        showToast("Document Saved!", `Version ${res.data.data.currentVersion} saved successfully.`);
        if (!documentId) {
          router.replace(`/org-admin/ai-builder?id=${res.data.data.id}`);
        }
      }
    } catch (err: any) {
      showToast("Save Failed", err.response?.data?.message || err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // Restore Version
  const handleRestoreVersion = async (versionNum: number) => {
    if (!documentId) return;
    try {
      setSaving(true);
      const res = await apiClient.post(`/api/unified-documents/${documentId}/restore-version/${versionNum}`);
      if (res.data?.success && res.data.data) {
        populateDocument(res.data.data);
        setShowVersionsDrawer(false);
        showToast("Version Restored", `Document restored to version ${versionNum}. Now at version ${res.data.data.currentVersion}.`);
      }
    } catch (err: any) {
      showToast("Restore Failed", err.response?.data?.message || err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // Save as Template
  const handleSaveAsTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentId) {
      showToast("Notice", "Please save the document first before saving it as a template.", "error");
      return;
    }
    if (!templateSaveName.trim()) return;

    try {
      const res = await apiClient.post(`/api/unified-documents/${documentId}/save-as-template`, {
        name: templateSaveName.trim(),
        category: templateSaveCategory,
      });
      if (res.data?.success) {
        showToast("Template Created!", `Saved reusable template "${templateSaveName}"`);
        setShowTemplateModal(false);
      }
    } catch (err: any) {
      showToast("Template Save Failed", err.response?.data?.message || err.message, "error");
    }
  };

  // Email Dispatch
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentId || !emailRecipient.trim()) return;

    try {
      setSendingEmail(true);
      const res = await apiClient.post(`/api/unified-documents/${documentId}/send-email`, {
        recipientEmail: emailRecipient.trim(),
        recipientName: clientContactPerson || clientName,
        customMessage: emailMessage.trim(),
      });
      if (res.data?.success) {
        showToast("Email Dispatched!", `Document sent successfully to ${emailRecipient}`);
        setShowEmailModal(false);
        setStatus("SENT");
      }
    } catch (err: any) {
      showToast("Dispatch Failed", err.response?.data?.message || err.message, "error");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!documentId) {
      showToast("Save First", "Please save the document before downloading PDF.", "error");
      return;
    }
    window.open(`/api/unified-documents/${documentId}/download-pdf`, "_blank");
  };

  const handleDownloadDocx = () => {
    if (!documentId) {
      showToast("Save First", "Please save the document before downloading DOCX.", "error");
      return;
    }
    window.open(`/api/unified-documents/${documentId}/download-docx`, "_blank");
  };

  const handleCopyLink = () => {
    if (!publicShareToken) {
      showToast("Save First", "Save document to generate secure share link.", "error");
      return;
    }
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/documents/view/${publicShareToken}`;
    navigator.clipboard.writeText(url);
    showToast("Link Copied!", "Client portal view link copied to clipboard.");
  };

  return (
    <div className="min-h-screen bg-slate-50/60 p-6 space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border backdrop-blur-md transition-all ${
            toastMessage.type === "error"
              ? "bg-rose-50/95 text-rose-800 border-rose-200"
              : "bg-emerald-50/95 text-emerald-800 border-emerald-200"
          }`}
        >
          {toastMessage.type === "error" ? <AlertCircle className="w-5 h-5 text-rose-600" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          <div>
            <div className="font-semibold text-sm">{toastMessage.title}</div>
            {toastMessage.desc && <div className="text-xs opacity-90">{toastMessage.desc}</div>}
          </div>
        </div>
      )}

      {/* Top Navigation & Action Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/org-admin/documents"
            className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">AI Document Builder Studio</h1>
              {documentNumber && (
                <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  {documentNumber}
                </span>
              )}
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                v{currentVersion}.0
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Natural language generation • Multi-category document structuring • Reusable template engine
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {documentId && (
            <>
              <button
                onClick={() => setShowVersionsDrawer(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                <History className="w-3.5 h-3.5" />
                <span>Versions ({versions.length || 1})</span>
              </button>

              <button
                onClick={handleDownloadPdf}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>PDF</span>
              </button>

              <button
                onClick={handleDownloadDocx}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition"
              >
                <Download className="w-3.5 h-3.5 text-indigo-600" />
                <span>DOCX</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Share Link</span>
              </button>

              <button
                onClick={() => {
                  setEmailRecipient(clientEmail || "");
                  setEmailMessage(`Please find attached your document for ${title}.`);
                  setShowEmailModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition"
              >
                <Send className="w-3.5 h-3.5 text-emerald-600" />
                <span>Send</span>
              </button>

              <button
                onClick={() => {
                  setTemplateSaveName(`${title} Template`);
                  setShowTemplateModal(true);
                }}
                className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                title="Save as Reusable Template"
              >
                <Layers className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            onClick={() => handleSave("DRAFT")}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Draft</span>
          </button>

          <button
            onClick={() => handleSave("FINAL")}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 transition disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            <span>Finalize Document</span>
          </button>
        </div>
      </div>

      {/* AI Assistant Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>AI Universal Document Architect</span>
          </div>

          {detectedType && (
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs border border-white/10">
              <span className="text-blue-300 font-semibold">Detected Intent:</span>
              <strong className="text-white">{detectedType.type}</strong>
              <span className="text-blue-200/70">({detectedType.category})</span>
            </div>
          )}
        </div>

        <h2 className="text-lg font-bold mb-1">Generate Any Commercial, Legal, HR, or Operational Document</h2>
        <p className="text-xs text-blue-200/80 mb-4 max-w-2xl">
          Enter what you need in plain English. The AI will classify intent, structure deliverables or legal clauses, calculate values, and apply dynamic templates.
        </p>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <textarea
              rows={2}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. Create an NDA between my company and XYZ Pvt Ltd with a 3-year term..."
              className="w-full px-4 py-2.5 bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 focus:border-blue-400 rounded-xl text-xs text-white placeholder-blue-200/50 focus:outline-none transition resize-none"
            />
          </div>
          <button
            type="button"
            onClick={handleGenerateAI}
            disabled={generatingAi || !aiPrompt.trim()}
            className="md:self-start flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/30 transition disabled:opacity-50 whitespace-nowrap"
          >
            {generatingAi ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Structuring Document...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate with AI</span>
              </>
            )}
          </button>
        </div>

        {/* Suggestion Chips */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[10px] text-blue-300/80 uppercase font-semibold">Try Prompts:</span>
          {PROMPT_SUGGESTIONS.slice(0, 4).map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setAiPrompt(s)}
              className="text-[11px] bg-white/10 hover:bg-white/20 text-blue-100 px-3 py-1 rounded-lg border border-white/10 transition truncate max-w-xs"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Editor / Preview Switcher for Small Screens */}
      <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("editor")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === "editor" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Structure & Section Editor
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === "preview" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Live Document Preview
          </button>
        </div>

        <div className="text-xs text-slate-500">
          Template Independence Active: <span className="text-emerald-600 font-semibold">Immutable Snapshot Guaranteed</span>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Metadata & Config (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Metadata Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Document Properties
            </h3>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Document Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Document Type
              </label>
              <input
                type="text"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="Sales">Sales & Commercial</option>
                <option value="Business">Business Documents</option>
                <option value="Legal">Legal & Agreements</option>
                <option value="HR">HR Documents</option>
                <option value="Operational">Operational Documents</option>
                <option value="Custom">Custom Document</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Lifecycle Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-semibold text-slate-800"
              >
                <option value="DRAFT">Draft</option>
                <option value="GENERATED">Generated</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="FINAL">Final</option>
                <option value="SENT">Sent</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          {/* CRM Client Picker */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center justify-between">
              <span>Recipient / Counterparty</span>
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
            </h3>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Load from CRM Directory
              </label>
              <select
                value={clientId}
                onChange={(e) => handleSelectClient(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="">-- Manual Entry or Select Client --</option>
                {crmClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.contactPerson ? `(${c.contactPerson})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Client / Counterparty Name
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. ABC Technologies"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Contact Person
              </label>
              <input
                type="text"
                value={clientContactPerson}
                onChange={(e) => setClientContactPerson(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="client@company.com"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* Template Quick Loader */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center justify-between">
              <span>Apply Template</span>
              <Layers className="w-3.5 h-3.5 text-blue-600" />
            </h3>

            <select
              onChange={(e) => {
                const found = templates.find((t) => t.id === e.target.value);
                if (found) applyTemplate(found);
              }}
              defaultValue=""
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="" disabled>
                -- Choose from Template Catalog --
              </option>
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name} ({tpl.category})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center/Right: Active View (Editor or Preview) (9 cols) */}
        <div className="lg:col-span-9 space-y-6">
          {activeTab === "editor" ? (
            /* SECTION EDITOR */
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Document Sections & Clauses</h3>
                  <p className="text-xs text-slate-500">Add, edit, or customize any structural component.</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddSection("text")}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Text Clause</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddSection("table")}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Data Table</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddSection("terms")}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Terms Box</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddSection("signature")}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Signatures</span>
                  </button>
                </div>
              </div>

              {sections.map((sec, idx) => (
                <div
                  key={sec.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:border-blue-200 transition"
                >
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={sec.title}
                        onChange={(e) => handleUpdateSection(sec.id, "title", e.target.value)}
                        className="font-bold text-slate-900 text-xs border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none px-1"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {sec.type}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSection(sec.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Remove Section"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Body for Text / Terms / Header */}
                  {sec.type !== "table" && (
                    <textarea
                      rows={sec.type === "terms" ? 4 : 3}
                      value={sec.body || ""}
                      onChange={(e) => handleUpdateSection(sec.id, "body", e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
                    />
                  )}

                  {/* Table Component Editor */}
                  {sec.type === "table" && sec.tableData && (
                    <div className="space-y-2">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleAddTableRow(sec.id)}
                          className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Add Row
                        </button>
                      </div>

                      <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-900 text-white uppercase text-[10px]">
                            <tr>
                              {sec.tableData.headers.map((h, hIdx) => (
                                <th key={hIdx} className="py-2.5 px-3">
                                  {h}
                                </th>
                              ))}
                              <th className="py-2.5 px-2 w-10 text-center">✕</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {sec.tableData.rows.map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-slate-50">
                                {row.map((cell, cIdx) => (
                                  <td key={cIdx} className="p-1.5">
                                    <input
                                      type="text"
                                      value={cell}
                                      onChange={(e) =>
                                        handleUpdateTableCell(sec.id, rIdx, cIdx, e.target.value)
                                      }
                                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white"
                                    />
                                  </td>
                                ))}
                                <td className="p-1.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTableRow(sec.id, rIdx)}
                                    className="text-slate-400 hover:text-rose-600"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* LIVE DOCUMENT PREVIEW */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 md:p-12 space-y-8 max-w-4xl mx-auto">
              <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                <div>
                  <div className="text-2xl font-bold text-slate-900">Enterprise Solutions Tech Pvt Ltd</div>
                  <div className="text-xs text-slate-500 mt-0.5">Corporate Headquarters • Technology Division</div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold font-mono text-blue-600">
                    {documentType.toUpperCase()}
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-700 mt-1">
                    {documentNumber || "DOC-DRAFT"}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    v{currentVersion}.0 • Status: {status}
                  </div>
                </div>
              </div>

              {clientName && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">PREPARED FOR</div>
                  <div className="text-sm font-bold text-slate-900">{clientName}</div>
                  {clientContactPerson && <div className="text-slate-600">Attn: {clientContactPerson}</div>}
                  {clientEmail && <div className="text-slate-400">{clientEmail}</div>}
                </div>
              )}

              <div>
                <div className="text-base font-bold text-slate-900">{title}</div>
              </div>

              {/* Render Sections */}
              {sections.map((sec) => (
                <div key={sec.id} className="space-y-2 text-xs">
                  {sec.title && sec.type !== "header" && (
                    <h4 className="font-bold text-slate-900 text-sm text-blue-900">{sec.title}</h4>
                  )}

                  {sec.body && (
                    <div
                      className={`leading-relaxed ${
                        sec.type === "terms"
                          ? "bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-600 whitespace-pre-line"
                          : "text-slate-700 whitespace-pre-line"
                      }`}
                    >
                      {sec.body}
                    </div>
                  )}

                  {sec.type === "table" && sec.tableData && (
                    <div className="overflow-x-auto border border-slate-200 rounded-xl my-3">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900 text-white uppercase text-[10px]">
                          <tr>
                            {sec.tableData.headers.map((h, i) => (
                              <th key={i} className="py-2.5 px-3">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {sec.tableData.rows.map((row, rI) => (
                            <tr key={rI} className={rI % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                              {row.map((cell, cI) => (
                                <td key={cI} className="py-2.5 px-3 text-slate-700">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {sec.type === "signature" && (
                    <div className="pt-6 grid grid-cols-2 gap-8">
                      <div className="border-t border-slate-300 pt-2">
                        <div className="font-bold text-slate-900">For Enterprise Solutions</div>
                        <div className="text-slate-400 text-[11px]">Authorized Signatory</div>
                      </div>
                      <div className="border-t border-slate-300 pt-2">
                        <div className="font-bold text-slate-900">
                          Accepted by: {clientName || "Counterparty"}
                        </div>
                        <div className="text-slate-400 text-[11px]">Authorized Signatory</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Version History Drawer / Modal */}
      {showVersionsDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md h-full p-6 shadow-2xl overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900">Version History</h3>
              </div>
              <button onClick={() => setShowVersionsDrawer(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="divide-y divide-slate-100">
              {versions.map((ver) => (
                <div key={ver.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <span>v{ver.versionNumber}.0</span>
                      {ver.versionNumber === currentVersion && (
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="text-slate-500 mt-0.5">{ver.changeSummary || "Update saved"}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(ver.createdAt).toLocaleString("en-GB")}
                    </div>
                  </div>

                  {ver.versionNumber !== currentVersion && (
                    <button
                      onClick={() => handleRestoreVersion(ver.versionNumber)}
                      className="px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                    >
                      Restore
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Save as Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Save as Reusable Template</h3>
              <button onClick={() => setShowTemplateModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveAsTemplate} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Template Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={templateSaveName}
                  onChange={(e) => setTemplateSaveName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={templateSaveCategory}
                  onChange={(e) => setTemplateSaveCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                >
                  <option value="Sales">Sales & Commercial</option>
                  <option value="Business">Business Documents</option>
                  <option value="Legal">Legal & Agreements</option>
                  <option value="HR">HR Documents</option>
                  <option value="Operational">Operational Documents</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Dispatch Document via Email</h3>
              <button onClick={() => setShowEmailModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSendEmail} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Recipient Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={emailRecipient}
                  onChange={(e) => setEmailRecipient(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Custom Message</label>
                <textarea
                  rows={3}
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-500 text-[11px]">
                Attaches official print-ready PDF and includes direct client portal review link.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm"
                >
                  {sendingEmail ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>{sendingEmail ? "Sending..." : "Dispatch Email"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
