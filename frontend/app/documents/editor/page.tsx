"use client";

import React, { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Sparkles, Save, Download, Send, Layers, CheckCircle2,
  ArrowLeft, RefreshCw, Plus, Trash2, Edit2, FileText,
  Printer, Check, Wand2, ShieldCheck, Copy, ExternalLink,
  ChevronDown, X, PenTool, AlertCircle, Users, FileDown,
  Building2, Calendar, DollarSign
} from "lucide-react";
import apiClient from "@/lib/axios";

interface DocumentSection {
  id: string;
  type: "header" | "text" | "table" | "terms" | "signature" | string;
  title: string;
  body?: string;
  tableData?: {
    headers: string[];
    rows: string[][];
  };
}

interface FinancialData {
  currency?: string;
  subtotal?: number;
  discountValue?: number;
  discountAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  total?: number;
  amountInWords?: string;
}

interface CrmClient {
  id: string;
  name: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

function UniversalDocumentEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const docIdParam = searchParams.get("id");
  const templateIdParam = searchParams.get("templateId");
  const fromOcrParam = searchParams.get("fromOcr");

  // Core Document State
  const [documentId, setDocumentId] = useState<string | null>(docIdParam);
  const [documentNumber, setDocumentNumber] = useState<string>("DOC-DRAFT");
  const [title, setTitle] = useState<string>("Professional Commercial Document");
  const [documentType, setDocumentType] = useState<string>("Quotation");
  const [category, setCategory] = useState<string>("Commercial");
  const [status, setStatus] = useState<string>("DRAFT");
  const [approvalStatus, setApprovalStatus] = useState<string>("NONE");
  const [signatureStatus, setSignatureStatus] = useState<string>("NONE");

  // Client Details
  const [clientName, setClientName] = useState<string>("");
  const [clientEmail, setClientEmail] = useState<string>("");
  const [clientPhone, setClientPhone] = useState<string>("");
  const [clientAddress, setClientAddress] = useState<string>("");
  const [clientContactPerson, setClientContactPerson] = useState<string>("");
  const [clients, setClients] = useState<CrmClient[]>([]);

  // Sections
  const [sections, setSections] = useState<DocumentSection[]>([
    {
      id: "header",
      type: "header",
      title: "Document Header",
      body: "Welcome to our comprehensive enterprise proposal.",
    },
    {
      id: "scope",
      type: "text",
      title: "Scope of Work & Deliverables",
      body: "We provide end-to-end automated document lifecycle management, intelligent OCR extraction, and multi-tier approval workflows.",
    },
    {
      id: "pricing_table",
      type: "table",
      title: "Commercial Investment",
      tableData: {
        headers: ["Item Description", "Qty", "Unit Price", "Total"],
        rows: [
          ["Enterprise AI Automation Platform Setup", "1", "₹3,50,000", "₹3,50,000"],
          ["Custom OCR Model Tuning & Training", "1", "₹1,50,000", "₹1,50,000"],
        ],
      },
    },
    {
      id: "terms",
      type: "terms",
      title: "Terms & Conditions",
      body: "1. 50% advance on sign-off, remaining on milestone completion.\n2. Standard SLA with 99.9% uptime guarantee.\n3. Validity: 30 days from document issuance.",
    },
    {
      id: "signature",
      type: "signature",
      title: "Signatures & Authorization",
      body: "Signed on behalf of both parties.",
    },
  ]);

  // Financial Data
  const [financialData, setFinancialData] = useState<FinancialData>({
    currency: "INR",
    subtotal: 500000,
    discountValue: 0,
    discountAmount: 0,
    taxRate: 18,
    taxAmount: 90000,
    total: 590000,
    amountInWords: "Five Lakh Ninety Thousand Rupees Only",
  });

  // Dynamic Organisation Profile
  const [orgProfile, setOrgProfile] = useState<any>({
    companyName: "Enterprise Organisation",
    address: "Corporate Headquarters",
    email: "contact@organisation.com",
    phone: "+91 00000 00000",
    signatory: "Authorized Representative",
  });

  // UI States
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);

  // Modals
  const [approvalModalOpen, setApprovalModalOpen] = useState<boolean>(false);
  const [approvalApproverRole, setApprovalApproverRole] = useState<string>("TEAM_LEADER");
  const [approvalComments, setApprovalComments] = useState<string>("");
  const [signatureModalOpen, setSignatureModalOpen] = useState<boolean>(false);
  const [signerName, setSignerName] = useState<string>("");
  const [signerEmail, setSignerEmail] = useState<string>("");
  const [sendEmailModalOpen, setSendEmailModalOpen] = useState<boolean>(false);
  const [sendEmailRecipient, setSendEmailRecipient] = useState<string>("");
  const [sendEmailSubject, setSendEmailSubject] = useState<string>("");
  const [sendEmailMessage, setSendEmailMessage] = useState<string>("");

  const [toast, setToast] = useState<{ title: string; desc?: string; type: "success" | "error" } | null>(null);

  const showToast = (title: string, desc?: string, type: "success" | "error" = "success") => {
    setToast({ title, desc, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Load CRM Clients & Org Profile
  useEffect(() => {
    const initData = async () => {
      try {
        const [clientsRes, orgRes] = await Promise.allSettled([
          apiClient.get("/api/crm/clients"),
          apiClient.get("/api/company/profile"),
        ]);

        if (clientsRes.status === "fulfilled" && clientsRes.value.data?.success) {
          setClients(clientsRes.value.data.data || []);
        }
        if (orgRes.status === "fulfilled" && orgRes.value.data?.data) {
          setOrgProfile(orgRes.value.data.data);
        }
      } catch (err) {
        console.error("Failed to load init data:", err);
      }
    };
    initData();
  }, []);

  // Load Existing Document or Template
  const loadExistingDocument = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/api/unified-documents/${id}`);
      if (res.data?.success) {
        const doc = res.data.data;
        setDocumentId(doc.id);
        setDocumentNumber(doc.documentNumber);
        setTitle(doc.title);
        setDocumentType(doc.documentType);
        setCategory(doc.category);
        setStatus(doc.status);
        setApprovalStatus(doc.approvalStatus || "NONE");
        setSignatureStatus(doc.signatureStatus || "NONE");
        setClientName(doc.clientName || "");
        setClientEmail(doc.clientEmail || "");
        setClientPhone(doc.clientPhone || "");
        setClientAddress(doc.clientAddress || "");
        setClientContactPerson(doc.clientContactPerson || "");
        if (Array.isArray(doc.content) && doc.content.length > 0) {
          setSections(doc.content);
        }
        if (doc.financialData) {
          setFinancialData(doc.financialData);
        }
      }
    } catch (err: any) {
      showToast("Load Error", err.response?.data?.message || err.message, "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadExistingTemplate = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/api/unified-templates/${id}`);
      if (res.data?.success) {
        const tpl = res.data.data;
        setTitle(tpl.name);
        setDocumentType(tpl.documentType || "Quotation");
        setCategory(tpl.category || "Commercial");
        if (Array.isArray(tpl.content) && tpl.content.length > 0) {
          setSections(tpl.content);
        }
        showToast("Template Applied", `Loaded structure from ${tpl.name}`);
      }
    } catch (err: any) {
      showToast("Template Error", err.response?.data?.message || err.message, "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (docIdParam) {
      loadExistingDocument(docIdParam);
    } else if (templateIdParam) {
      loadExistingTemplate(templateIdParam);
    } else if (fromOcrParam) {
      const stored = sessionStorage.getItem("ai_builder_context");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setTitle(`Extracted OCR - ${parsed.documentType || "Document"}`);
          setDocumentType(parsed.documentType || "Invoice");
          if (parsed.tables && parsed.tables.length > 0) {
            setSections((prev) => [
              ...prev,
              {
                id: `table_ocr_${Date.now()}`,
                type: "table",
                title: "Extracted Line Items",
                tableData: parsed.tables[0],
              },
            ]);
          }
          showToast("OCR Data Imported", "Document initialized with extracted data.");
        } catch {
          // ignore
        }
      }
    }
  }, [docIdParam, templateIdParam, fromOcrParam, loadExistingDocument, loadExistingTemplate]);

  // Recalculate Financials
  const updateFinancialField = (field: keyof FinancialData, val: any) => {
    setFinancialData((prev) => {
      const next = { ...prev, [field]: val };
      const sub = Number(next.subtotal) || 0;
      const disc = Number(next.discountAmount) || 0;
      const taxable = Math.max(0, sub - disc);
      const taxR = Number(next.taxRate) || 0;
      const taxA = (taxable * taxR) / 100;
      const tot = taxable + taxA;
      next.taxAmount = taxA;
      next.total = tot;
      return next;
    });
  };

  // Section Management
  const addSection = (type: DocumentSection["type"]) => {
    const newSec: DocumentSection = {
      id: `sec_${Date.now()}`,
      type,
      title: type === "table" ? "Table Section" : "New Section",
      body: type === "table" ? undefined : "Enter section content here...",
      tableData:
        type === "table"
          ? {
              headers: ["Item Description", "Qty", "Rate", "Amount"],
              rows: [["Service / Item 1", "1", "₹10,000", "₹10,000"]],
            }
          : undefined,
    };
    setSections([...sections, newSec]);
  };

  const removeSection = (id: string) => {
    setSections(sections.filter((s) => s.id !== id));
  };

  const updateSection = (id: string, updates: Partial<DocumentSection>) => {
    setSections(sections.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  // Save Document
  const handleSaveDocument = async () => {
    setIsSaving(true);
    try {
      const payload = {
        title,
        documentType,
        category,
        clientName,
        clientEmail,
        clientPhone,
        clientAddress,
        clientContactPerson,
        content: sections,
        financialData,
        status: status || "DRAFT",
      };

      let res;
      if (documentId) {
        res = await apiClient.put(`/api/unified-documents/${documentId}`, payload);
      } else {
        res = await apiClient.post("/api/unified-documents", payload);
      }

      if (res.data?.success) {
        const saved = res.data.data;
        setDocumentId(saved.id);
        setDocumentNumber(saved.documentNumber);
        setStatus(saved.status);
        showToast("Saved Successfully", `Document saved as ${saved.documentNumber}`);
      }
    } catch (err: any) {
      showToast("Save Failed", err.response?.data?.message || err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Submit for Approval
  const handleSubmitApproval = async () => {
    if (!documentId) {
      await handleSaveDocument();
    }
    const currentId = documentId;
    if (!currentId) return;

    try {
      const res = await apiClient.post(`/api/unified-documents/${currentId}/submit-approval`, {
        assignedApproverRole: approvalApproverRole,
        comments: approvalComments,
      });

      if (res.data?.success) {
        setApprovalStatus("PENDING");
        setStatus("IN_REVIEW");
        setApprovalModalOpen(false);
        showToast("Submitted for Approval", "Your document has entered the review workflow.");
      }
    } catch (err: any) {
      showToast("Submission Failed", err.response?.data?.message || err.message, "error");
    }
  };

  // Send for Signature
  const handleSendForSignature = async () => {
    if (!documentId) return;
    try {
      const res = await apiClient.post(`/api/unified-documents/${documentId}/send-for-signature`, {
        signerName: signerName || clientName,
        signerEmail: signerEmail || clientEmail,
      });

      if (res.data?.success) {
        setSignatureStatus("SENT");
        setSignatureModalOpen(false);
        showToast("Sent for Signature", `Signature dispatched to ${signerEmail || clientEmail}`);
      }
    } catch (err: any) {
      showToast("Signature Dispatch Failed", err.response?.data?.message || err.message, "error");
    }
  };

  // Send to Client via Email
  const handleSendToClient = async () => {
    if (!documentId) return;
    try {
      const res = await apiClient.post(`/api/unified-documents/${documentId}/send-email`, {
        recipientEmail: sendEmailRecipient || clientEmail,
        subject: sendEmailSubject || `${title} - ${documentNumber}`,
        message: sendEmailMessage || `Please find attached ${title} for your review.`,
      });

      if (res.data?.success) {
        setSendEmailModalOpen(false);
        showToast("Dispatched", `Document emailed to ${sendEmailRecipient || clientEmail}`);
      }
    } catch (err: any) {
      showToast("Email Failed", err.response?.data?.message || err.message, "error");
    }
  };

  // AI Content Generator / Enhancer
  const handleAiEnhance = async () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingAi(true);
    try {
      const res = await apiClient.post("/api/ai/generate", {
        prompt: `Generate or enhance enterprise document sections for the following request: "${aiPrompt}". Return professional, structured content suitable for an enterprise ${documentType}.`,
      });

      const generated = res.data.data?.text || res.data.data?.content || res.data.text;
      if (generated) {
        setSections((prev) => [
          ...prev,
          {
            id: `sec_ai_${Date.now()}`,
            type: "text",
            title: "AI Generated Deliverable",
            body: generated,
          },
        ]);
        setAiPrompt("");
        showToast("AI Section Added", "New section generated and appended.");
      }
    } catch (err: any) {
      showToast("AI Generation Failed", err.response?.data?.message || err.message, "error");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Save as Template
  const handleSaveAsTemplate = async () => {
    try {
      const res = await apiClient.post("/api/unified-templates", {
        name: `${title} Template`,
        category,
        documentType,
        description: `Template generated from ${documentNumber}.`,
        content: sections,
      });

      if (res.data?.success) {
        showToast("Template Created", "Added to Reusable Templates.");
      }
    } catch (err: any) {
      showToast("Template Save Failed", err.response?.data?.message || err.message, "error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border text-sm font-medium transition-all ${
            toast.type === "success"
              ? "bg-emerald-900/90 border-emerald-700 text-emerald-100"
              : "bg-rose-900/90 border-rose-700 text-rose-100"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
          <div>
            <div className="font-semibold">{toast.title}</div>
            {toast.desc && <div className="text-xs opacity-90">{toast.desc}</div>}
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-blue-600 dark:text-blue-400 font-semibold">
                {documentNumber}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase">
                {status}
              </span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="font-bold text-base text-slate-900 dark:text-white bg-transparent border-none p-0 focus:outline-none focus:ring-0"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center text-xs font-semibold">
            <button
              onClick={() => setActiveTab("edit")}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === "edit" ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm" : "text-slate-500"
              }`}
            >
              Editor
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === "preview" ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm" : "text-slate-500"
              }`}
            >
              A4 Preview
            </button>
          </div>

          <button
            onClick={handleSaveAsTemplate}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Save as Template
          </button>

          {documentId && (
            <>
              <button
                onClick={() => setApprovalModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-sm"
              >
                <AlertCircle className="w-3.5 h-3.5" /> Submit Approval
              </button>

              <button
                onClick={() => {
                  setSignerName(clientName);
                  setSignerEmail(clientEmail);
                  setSignatureModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm"
              >
                <PenTool className="w-3.5 h-3.5" /> Send for Signature
              </button>

              <button
                onClick={() => {
                  setSendEmailRecipient(clientEmail);
                  setSendEmailSubject(`${title} - ${documentNumber}`);
                  setSendEmailMessage(`Dear ${clientName || "Client"},\n\nPlease find attached ${title} for your review.`);
                  setSendEmailModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
              >
                <Send className="w-3.5 h-3.5" /> Send to Client
              </button>

              <button
                onClick={() => window.open(`/api/unified-documents/${documentId}/download-pdf`, "_blank")}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                title="Download PDF"
              >
                <Download className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            onClick={handleSaveDocument}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Document</span>
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-8">
        {activeTab === "edit" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Metadata & AI Generator */}
            <div className="lg:col-span-4 space-y-6">
              {/* Document Setup Card */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Document Setup</h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Document Type</label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="Quotation">Quotation</option>
                    <option value="Invoice">Invoice</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Agreement">Agreement / Contract</option>
                    <option value="Report">Report</option>
                    <option value="Custom Document">Custom Document</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="Commercial">Commercial</option>
                    <option value="Finance">Finance</option>
                    <option value="Legal">Legal</option>
                    <option value="Operations">Operations</option>
                    <option value="HR">HR</option>
                  </select>
                </div>
              </div>

              {/* Client Information Card */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Client Information</h3>
                  {clients.length > 0 && (
                    <select
                      onChange={(e) => {
                        const selected = clients.find((c) => c.id === e.target.value);
                        if (selected) {
                          setClientName(selected.name);
                          setClientEmail(selected.email || "");
                          setClientPhone(selected.phone || "");
                          setClientAddress(selected.address || "");
                          setClientContactPerson(selected.contactPerson || "");
                        }
                      }}
                      className="text-[11px] px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    >
                      <option value="">Pick from CRM...</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Client / Company Name</label>
                  <input
                    type="text"
                    placeholder="Acme Corp Pvt Ltd"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Client Email</label>
                  <input
                    type="email"
                    placeholder="billing@acmecorp.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Financial Calculation Card */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Commercial Summary</h3>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Subtotal (₹)</label>
                    <input
                      type="number"
                      value={financialData.subtotal || 0}
                      onChange={(e) => updateFinancialField("subtotal", Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Tax Rate (%)</label>
                    <input
                      type="number"
                      value={financialData.taxRate || 18}
                      onChange={(e) => updateFinancialField("taxRate", Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between font-bold text-sm">
                  <span>Grand Total:</span>
                  <span className="text-blue-600 dark:text-blue-400">
                    ₹{(financialData.total || 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* AI Assistant Box */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-blue-950/40 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/50 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300">
                  <Sparkles className="w-4 h-4" /> AI Section Generator
                </div>
                <textarea
                  rows={3}
                  placeholder="e.g. Add 3 milestone deliverables with pricing for a cloud infrastructure audit..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
                <button
                  onClick={handleAiEnhance}
                  disabled={isGeneratingAi || !aiPrompt.trim()}
                  className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isGeneratingAi ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                  <span>Generate with AI</span>
                </button>
              </div>
            </div>

            {/* Right Column: Sections Editor */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-sm text-slate-900 dark:text-white">Document Structure & Content</h2>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => addSection("text")}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Text Block
                  </button>
                  <button
                    onClick={() => addSection("table")}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Data Table
                  </button>
                </div>
              </div>

              {sections.map((sec, idx) => (
                <div
                  key={sec.id}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 mr-4">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase font-semibold">
                        {sec.type}
                      </span>
                      <input
                        type="text"
                        value={sec.title}
                        onChange={(e) => updateSection(sec.id, { title: e.target.value })}
                        className="font-bold text-xs text-slate-900 dark:text-white bg-transparent border-none p-0 focus:outline-none flex-1"
                      />
                    </div>
                    <button
                      onClick={() => removeSection(sec.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                      title="Remove Section"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {sec.type !== "table" ? (
                    <textarea
                      rows={sec.type === "header" ? 2 : 4}
                      value={sec.body || ""}
                      onChange={(e) => updateSection(sec.id, { body: e.target.value })}
                      className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 leading-relaxed focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    sec.tableData && (
                      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                              {sec.tableData.headers?.map((h, hi) => (
                                <th key={hi} className="p-2">
                                  <input
                                    type="text"
                                    value={h}
                                    onChange={(e) => {
                                      const newHeaders = [...sec.tableData!.headers];
                                      newHeaders[hi] = e.target.value;
                                      updateSection(sec.id, {
                                        tableData: { ...sec.tableData!, headers: newHeaders },
                                      });
                                    }}
                                    className="bg-transparent font-semibold text-xs border-none p-0 focus:outline-none w-full"
                                  />
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {sec.tableData.rows?.map((row, ri) => (
                              <tr key={ri} className="border-t border-slate-200 dark:border-slate-700">
                                {row.map((cell, ci) => (
                                  <td key={ci} className="p-2">
                                    <input
                                      type="text"
                                      value={cell}
                                      onChange={(e) => {
                                        const newRows = sec.tableData!.rows.map((r, i) =>
                                          i === ri ? r.map((c, j) => (j === ci ? e.target.value : c)) : r
                                        );
                                        updateSection(sec.id, {
                                          tableData: { ...sec.tableData!, rows: newRows },
                                        });
                                      }}
                                      className="bg-transparent text-xs border-none p-0 focus:outline-none w-full"
                                    />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* A4 Live Preview Mode */
          <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 p-12 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 space-y-8 font-sans text-slate-800 dark:text-slate-200">
            {/* Header / Organisation Branding */}
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{orgProfile.companyName}</h1>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">{orgProfile.address}</p>
                <p className="text-xs text-slate-500">{orgProfile.email} • {orgProfile.phone}</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold text-xs uppercase tracking-wider">
                  {documentType}
                </span>
                <div className="font-mono text-sm font-bold text-slate-900 dark:text-white mt-2">{documentNumber}</div>
                <div className="text-xs text-slate-500 mt-0.5">Date: {new Date().toLocaleDateString()}</div>
              </div>
            </div>

            {/* Bill To */}
            {clientName && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Prepared For</span>
                <div className="font-bold text-sm text-slate-900 dark:text-white">{clientName}</div>
                {clientEmail && <div className="text-xs text-slate-500">{clientEmail}</div>}
              </div>
            )}

            {/* Document Content Sections */}
            <div className="space-y-6">
              {sections.map((sec) => (
                <div key={sec.id} className="space-y-2">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1">
                    {sec.title}
                  </h3>
                  {sec.body && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {sec.body}
                    </p>
                  )}
                  {sec.tableData && (
                    <div className="overflow-x-auto my-3">
                      <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-800">
                          <tr>
                            {sec.tableData.headers?.map((h, i) => (
                              <th key={i} className="p-2.5 font-bold border-b border-slate-200 dark:border-slate-700">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sec.tableData.rows?.map((row, ri) => (
                            <tr key={ri} className="border-b border-slate-100 dark:border-slate-800">
                              {row.map((c, ci) => (
                                <td key={ci} className="p-2.5">{c}</td>
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

            {/* Grand Total */}
            <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="w-64 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Subtotal:</span>
                  <span>₹{(financialData.subtotal || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Tax ({financialData.taxRate || 18}%):</span>
                  <span>₹{(financialData.taxAmount || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white pt-2 border-t">
                  <span>Total:</span>
                  <span className="text-blue-600">₹{(financialData.total || 0).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: SUBMIT FOR APPROVAL */}
      {approvalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 space-y-4 border border-slate-200 dark:border-slate-800">
            <h2 className="font-bold text-base text-slate-900 dark:text-white">Submit Document for Approval</h2>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Select Approver Level</label>
                <select
                  value={approvalApproverRole}
                  onChange={(e) => setApprovalApproverRole(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="TEAM_LEADER">Team Leader</option>
                  <option value="DEPARTMENT_MANAGER">Department Manager</option>
                  <option value="ORGANISATION_ADMIN">Organisation Admin</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Review Notes</label>
                <textarea
                  rows={3}
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                  placeholder="Explain the document scope and changes..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setApprovalModalOpen(false)} className="px-3 py-2 text-xs font-semibold">Cancel</button>
              <button onClick={handleSubmitApproval} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl">
                Submit for Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SEND FOR SIGNATURE */}
      {signatureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 space-y-4 border border-slate-200 dark:border-slate-800">
            <h2 className="font-bold text-base text-slate-900 dark:text-white">Send for E-Signature</h2>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Signer Name</label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Signer Email</label>
                <input
                  type="email"
                  value={signerEmail}
                  onChange={(e) => setSignerEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setSignatureModalOpen(false)} className="px-3 py-2 text-xs font-semibold">Cancel</button>
              <button onClick={handleSendForSignature} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl">
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SEND TO CLIENT */}
      {sendEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 space-y-4 border border-slate-200 dark:border-slate-800">
            <h2 className="font-bold text-base text-slate-900 dark:text-white">Send Document to Client</h2>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Recipient Email</label>
                <input
                  type="email"
                  value={sendEmailRecipient}
                  onChange={(e) => setSendEmailRecipient(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Subject</label>
                <input
                  type="text"
                  value={sendEmailSubject}
                  onChange={(e) => setSendEmailSubject(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Message</label>
                <textarea
                  rows={4}
                  value={sendEmailMessage}
                  onChange={(e) => setSendEmailMessage(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setSendEmailModalOpen(false)} className="px-3 py-2 text-xs font-semibold">Cancel</button>
              <button onClick={handleSendToClient} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl">
                Send Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UniversalDocumentEditorPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading Enterprise Document Editor...</div>}>
      <UniversalDocumentEditorContent />
    </Suspense>
  );
}
