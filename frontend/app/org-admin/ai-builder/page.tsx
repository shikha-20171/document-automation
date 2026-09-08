"use client";

import React, { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Sparkles, Save, Download, Send, Layers, CheckCircle2,
  ArrowLeft, RefreshCw, Plus, Trash2, Edit2, FileText,
  Printer, Check, Wand2, ShieldCheck, Copy, ExternalLink,
  ChevronDown, X
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
    cgstRate?: number;
    cgstAmount?: number;
    sgstRate?: number;
    sgstAmount?: number;
    total?: number;
    amountInWords?: string;
    subtotalInWords?: string;
  } | null;
  variables: Record<string, string>;
  currentVersion: number;
  publicShareToken: string;
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

const DEFAULT_DEZORYN_PROFILE = {
  companyName: "Dezoryn Technology",
  legalName: "Dezoryn Technology Pvt Ltd",
  address: "Level 5, Tech Park One, Airport Road, Yerwada, Pune, Maharashtra 411006",
  email: "contact@dezoryn.com",
  phone: "+91 98765 43210",
  website: "https://www.dezoryn.com",
  gstin: "27AAACD1234E1Z5",
  pan: "AAACD1234E",
  cin: "U72900PN2023PTC123456",
  bankName: "HDFC Bank",
  bankAccount: "50200012345678",
  bankIfsc: "HDFC0000123",
  bankBranch: "Yerwada Branch, Pune",
  signatory: "Aditya Sharma, Director",
};

const PROMPT_SUGGESTIONS = [
  "Create a quotation for ABC Pvt Ltd for ₹5,00,000 for AI Document Automation",
  "Create a professional bid document for XYZ Ltd for our software development project",
  "Create a quotation from Acme Corp for Global Logistics for ₹8,50,000 for Fleet Management System",
  "Create an NDA between Dezoryn Technology and Star Solutions",
];

function UniversalAiDocumentBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const docIdParam = searchParams.get("id");
  const templateIdParam = searchParams.get("templateId");

  // Document Core State
  const [documentId, setDocumentId] = useState<string | null>(docIdParam);
  const [documentNumber, setDocumentNumber] = useState<string>("");
  const [title, setTitle] = useState<string>("Commercial Quotation for ABC Pvt Ltd - AI Document Automation");
  const [documentType, setDocumentType] = useState<string>("Quotation");
  const [category, setCategory] = useState<string>("Sales");
  const [status, setStatus] = useState<string>("DRAFT");
  const [currentVersion, setCurrentVersion] = useState<number>(1);
  const [publicShareToken, setPublicShareToken] = useState<string>("");

  // Issuing Entity (Can be any company, defaults to Dezoryn Technology)
  const [companyName, setCompanyName] = useState<string>(DEFAULT_DEZORYN_PROFILE.companyName);
  const [companyAddress, setCompanyAddress] = useState<string>(DEFAULT_DEZORYN_PROFILE.address);
  const [companyContact, setCompanyContact] = useState<string>(`${DEFAULT_DEZORYN_PROFILE.email} | ${DEFAULT_DEZORYN_PROFILE.phone}`);
  const [companyGstin, setCompanyGstin] = useState<string>(DEFAULT_DEZORYN_PROFILE.gstin);

  // Recipient / Client Entity (Can be any client)
  const [clientName, setClientName] = useState<string>("ABC Pvt Ltd");
  const [clientContactPerson, setClientContactPerson] = useState<string>("Procurement & IT Head");
  const [clientEmail, setClientEmail] = useState<string>("procurement@abcpvtltd.com");
  const [clientPhone, setClientPhone] = useState<string>("+91 98230 11223");
  const [clientAddress, setClientAddress] = useState<string>("Tower B, Commercial IT Park, Bangalore, Karnataka 560100");
  const [clientId, setClientId] = useState<string>("");

  // Dynamic Content Sections
  const [sections, setSections] = useState<DocumentSection[]>([
    {
      id: "sec_overview",
      type: "header",
      title: "Commercial Deliverable Schedule & Overview",
      body: `DOCUMENT: OFFICIAL QUOTATION\nDATE: ${new Date().toLocaleDateString("en-GB")}\nVALIDITY: 30 Calendar Days\n\nISSUED BY: ${companyName}\nISSUED TO: ${clientName}\nSUBJECT: AI Document Automation Solution`,
    },
    {
      id: "sec_scope",
      type: "text",
      title: "1. Scope of Deliverables & Requirements",
      body: "• Implementation of intelligent OCR pipeline and natural-language document drafting engine.\n• Integration of multi-tenant PostgreSQL database, RBAC security matrices, and automated PDF export.\n• Comprehensive UAT testing, cloud infrastructure deployment, and administrator training.",
    },
    {
      id: "sec_table",
      type: "table",
      title: "2. Itemized Deliverables & Pricing",
      tableData: {
        headers: ["Deliverable / Item", "Description", "Qty", "Unit", "Rate (INR)", "Amount (INR)"],
        rows: [
          ["AI Document Engine & Pipeline", "Core cognitive OCR extraction and API integrations", "1", "system", "₹2,50,000.00", "₹2,50,000.00"],
          ["Management Console & Portals", "Responsive web studio, template builder & live preview", "1", "package", "₹1,50,000.00", "₹1,50,000.00"],
          ["QA Hardening & Hypercare Support", "Penetration testing, cloud deployment & 30-day warranty", "1", "service", "₹1,00,000.00", "₹1,00,000.00"],
        ],
      },
    },
    {
      id: "sec_financials",
      type: "terms",
      title: "3. Financial Summary & Statutory Taxes",
      body: "• Subtotal (Taxable Base Amount): ₹5,00,000.00 (Rupees Five Lakh Only)\n• Central GST (CGST @ 9%): ₹45,000.00\n• State GST (SGST @ 9%): ₹45,000.00\n• Total Applicable Tax (GST 18%): ₹90,000.00\n• Grand Total (Tax Inclusive): ₹5,90,000.00\n• Amount in Words: Rupees Five Lakh Ninety Thousand Only",
    },
    {
      id: "sec_terms",
      type: "terms",
      title: "4. Payment Terms & Bank Remittance Details",
      body: `Payment Schedule:\n• 50% Advance on project sign-off, 50% on milestone UAT delivery.\n\nBank Account for Remittance:\nBeneficiary Name: ${companyName}\nBank: ${DEFAULT_DEZORYN_PROFILE.bankName} | Account: ${DEFAULT_DEZORYN_PROFILE.bankAccount} | IFSC: ${DEFAULT_DEZORYN_PROFILE.bankIfsc}`,
    },
    {
      id: "sec_signature",
      type: "signature",
      title: "5. Execution & Acceptance",
      body: `Authorized Signatory for ${companyName}. Accepted and Confirmed by ${clientName}.`,
    },
  ]);

  // Variables & Financials
  const [financialData, setFinancialData] = useState<any>({
    currency: "INR",
    subtotal: 500000,
    cgstAmount: 45000,
    sgstAmount: 45000,
    taxAmount: 90000,
    total: 590000,
    amountInWords: "Rupees Five Lakh Ninety Thousand Only",
    subtotalInWords: "Rupees Five Lakh Only",
  });

  const [variables, setVariables] = useState<Record<string, string>>({
    company_name: DEFAULT_DEZORYN_PROFILE.companyName,
    client_name: "ABC Pvt Ltd",
  });

  // Prompt & Generation State
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [generatingAi, setGeneratingAi] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // Modals
  const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false);
  const [templateSaveName, setTemplateSaveName] = useState<string>("");
  const [templateSaveCategory, setTemplateSaveCategory] = useState<string>("Sales");
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
  const [emailRecipient, setEmailRecipient] = useState<string>("");
  const [emailSubject, setEmailSubject] = useState<string>("");
  const [emailMessage, setEmailMessage] = useState<string>("");
  const [sendingEmail, setSendingEmail] = useState<boolean>(false);

  // Quick Inline AI Refine Popover
  const [refiningSectionId, setRefiningSectionId] = useState<string | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ title: string; desc?: string; type?: "success" | "error" } | null>(null);
  const showToast = (title: string, desc?: string, type: "success" | "error" = "success") => {
    setToastMessage({ title, desc, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load Existing Document
  useEffect(() => {
    if (!docIdParam) return;
    async function loadDoc() {
      try {
        const res = await apiClient.get(`/api/unified-documents/${docIdParam}`);
        if (res.data?.success && res.data.data) {
          const doc = res.data.data;
          setDocumentId(doc.id);
          setDocumentNumber(doc.documentNumber);
          setTitle(doc.title);
          setDocumentType(doc.documentType);
          setCategory(doc.category);
          setStatus(doc.status);
          setCurrentVersion(doc.currentVersion);
          setPublicShareToken(doc.publicShareToken);
          setClientName(doc.clientName || "");
          setClientEmail(doc.clientEmail || "");
          setClientContactPerson(doc.clientContactPerson || "");
          setClientPhone(doc.clientPhone || "");
          setClientAddress(doc.clientAddress || "");
          if (doc.senderData?.companyName) setCompanyName(doc.senderData.companyName);
          if (doc.senderData?.address) setCompanyAddress(doc.senderData.address);
          if (doc.senderData?.gstin) setCompanyGstin(doc.senderData.gstin);
          if (Array.isArray(doc.content)) setSections(doc.content);
          if (doc.financialData) setFinancialData(doc.financialData);
          if (doc.variables) setVariables(doc.variables);
        }
      } catch (err: any) {
        showToast("Load Failed", err.response?.data?.message || err.message, "error");
      }
    }
    loadDoc();
  }, [docIdParam]);

  // Handle Generate with AI
  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) {
      showToast("Empty Prompt", "Please enter what document you want to create.", "error");
      return;
    }

    try {
      setGeneratingAi(true);
      const res = await apiClient.post("/api/unified-documents/ai-generate", {
        prompt: aiPrompt.trim(),
        companyName: companyName.trim(),
        clientContext: clientId ? { id: clientId, name: clientName, email: clientEmail } : null,
      });

      if (res.data?.success && res.data.data) {
        const gen = res.data.data;
        setTitle(gen.title);
        setDocumentType(gen.documentType);
        setCategory(gen.category);
        setStatus("AI GENERATED");

        // Issuing company & Client from prompt
        if (gen.companyName) setCompanyName(gen.companyName);
        if (gen.clientName) setClientName(gen.clientName);
        if (gen.clientEmail) setClientEmail(gen.clientEmail);
        if (gen.clientPhone) setClientPhone(gen.clientPhone);
        if (gen.clientAddress) setClientAddress(gen.clientAddress);
        if (gen.clientContactPerson) setClientContactPerson(gen.clientContactPerson);

        if (Array.isArray(gen.content) && gen.content.length > 0) setSections(gen.content);
        if (gen.financialData) setFinancialData(gen.financialData);
        if (gen.variables) setVariables(gen.variables);

        showToast("Document Generated!", `Created ${gen.documentType} from ${gen.companyName} to ${gen.clientName}.`);
      }
    } catch (err: any) {
      showToast("AI Generation Notice", err.response?.data?.message || err.message, "error");
    } finally {
      setGeneratingAi(false);
    }
  };

  // Section Editing
  const handleUpdateSection = (id: string, field: "title" | "body", value: string) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const handleRemoveSection = (id: string) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
  };

  const handleAddSection = (type: "text" | "table" | "terms") => {
    const newId = `sec_${Date.now()}`;
    const newSec: DocumentSection = {
      id: newId,
      type,
      title: type === "table" ? "Pricing & Deliverables" : type === "terms" ? "Specific Provisions" : "New Section",
      body: type !== "table" ? "Enter section description and clauses here..." : undefined,
    };
    if (type === "table") {
      newSec.tableData = {
        headers: ["Item", "Description", "Qty", "Unit", "Rate (INR)", "Total (INR)"],
        rows: [["Deliverable 1", "Scope detail", "1", "unit", "50,000", "50,000"]],
      };
    }
    setSections([...sections, newSec]);
  };

  // Inline AI Refinement for a specific section
  const handleAiRefineSection = async (secId: string, action: string) => {
    try {
      setGeneratingAi(true);
      const res = await apiClient.post("/api/unified-documents/ai-edit", {
        document: {
          title,
          documentType,
          companyName,
          clientName,
          content: sections,
          financialData,
        },
        sectionId: secId,
        action,
      });

      if (res.data?.success && res.data.data) {
        if (Array.isArray(res.data.data.content)) setSections(res.data.data.content);
        if (res.data.data.financialData) setFinancialData(res.data.data.financialData);
        showToast("Refined with AI", "Section updated with professional corporate wording.");
      }
    } catch (err: any) {
      showToast("Notice", err.response?.data?.message || err.message, "error");
    } finally {
      setGeneratingAi(false);
      setRefiningSectionId(null);
    }
  };

  // Save Document to Database
  const handleSaveDocument = async (overrideStatus?: string) => {
    try {
      setSaving(true);
      const targetStatus = overrideStatus || status;
      const payload = {
        title: title.trim(),
        documentType: documentType.trim(),
        category: category.trim(),
        status: targetStatus,
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        clientPhone: clientPhone.trim(),
        clientAddress: clientAddress.trim(),
        clientContactPerson: clientContactPerson.trim(),
        senderData: {
          companyName,
          address: companyAddress,
          contact: companyContact,
          gstin: companyGstin,
        },
        content: sections,
        financialData,
        variables: {
          ...variables,
          company_name: companyName,
          client_name: clientName,
        },
        aiPrompt,
      };

      let res;
      if (documentId) {
        res = await apiClient.put(`/api/unified-documents/${documentId}`, payload);
      } else {
        res = await apiClient.post("/api/unified-documents", payload);
      }

      if (res.data?.success && res.data.data) {
        const saved = res.data.data;
        setDocumentId(saved.id);
        setDocumentNumber(saved.documentNumber);
        setStatus(saved.status);
        setCurrentVersion(saved.currentVersion);
        setPublicShareToken(saved.publicShareToken);

        // Automatically ensure document is also registered in Template library
        try {
          const autoTplItem = {
            id: `tmpl-${saved.id || Date.now()}`,
            name: `${title.trim()} Template`,
            description: `Generated from ${documentType} for ${clientName}`,
            category: category || "General",
            status: "Active",
            usage: 0,
            createdBy: companyName,
            owner: companyName,
            updated: "Just now",
            department: "All",
            documentType: documentType || "Document",
            tags: [category || "General", "AI Generated"],
            visibility: "Organisation Wide",
            isShared: true,
            content: sections.map((s) => `### ${s.title}\n\n${s.body || ""}`).join("\n\n---\n\n"),
            sections,
            defaultVariables: { company_name: companyName, client_name: clientName },
          };
          if (typeof window !== "undefined") {
            const raw = localStorage.getItem("docucore_custom_templates");
            const existing = raw ? JSON.parse(raw) : [];
            localStorage.setItem(
              "docucore_custom_templates",
              JSON.stringify([autoTplItem, ...existing.filter((t: any) => t.name !== autoTplItem.name)])
            );
          }
          if (saved.id) {
            apiClient.post(`/api/unified-documents/${saved.id}/save-as-template`, {
              name: `${title.trim()} Template`,
              category: category || "General",
            }).catch(() => {});
          }
        } catch {}

        showToast("Saved Successfully", `Document ${saved.documentNumber} is saved and available in Templates.`);
        if (!documentId) {
          router.replace(`/org-admin/ai-builder?id=${saved.id}`);
        }
      }
    } catch (err: any) {
      showToast("Save Failed", err.response?.data?.message || err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // Save as Reusable Template
  const handleSaveAsTemplate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!templateSaveName.trim()) {
      showToast("Template Name Required", "Please enter a name for your template.", "error");
      return;
    }

    try {
      setSaving(true);
      const localTplItem = {
        id: `tmpl-${Date.now()}`,
        name: templateSaveName.trim(),
        description: `Template generated from: ${title}`,
        category: templateSaveCategory,
        status: "Active",
        usage: 0,
        createdBy: companyName,
        owner: companyName,
        updated: "Just now",
        department: "All",
        documentType: documentType || "Document",
        tags: [templateSaveCategory, "AI Generated"],
        visibility: "Organisation Wide",
        isShared: true,
        content: sections.map((s) => `### ${s.title}\n\n${s.body || ""}`).join("\n\n---\n\n"),
        sections,
        defaultVariables: { company_name: companyName, client_name: clientName },
      };

      // Store in local storage for instant availability on /org-admin/templates
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem("docucore_custom_templates");
        const existing = raw ? JSON.parse(raw) : [];
        localStorage.setItem("docucore_custom_templates", JSON.stringify([localTplItem, ...existing.filter((t: any) => t.name !== localTplItem.name)]));
      }

      // Also try backend save
      if (documentId) {
        apiClient.post(`/api/unified-documents/${documentId}/save-as-template`, {
          name: templateSaveName.trim(),
          category: templateSaveCategory,
        }).catch(() => {});
      }

      setShowTemplateModal(false);
      showToast("Template Created!", `"${templateSaveName}" is saved and ready to reuse on the Templates page.`);
    } catch (err: any) {
      showToast("Template Notice", err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // Send Email to Client
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentId) {
      showToast("Save First", "Please save the document before emailing the client.", "error");
      return;
    }
    if (!emailRecipient.trim()) {
      showToast("Email Required", "Please enter the client's email address.", "error");
      return;
    }

    try {
      setSendingEmail(true);
      const res = await apiClient.post(`/api/unified-documents/${documentId}/send-email`, {
        recipientEmail: emailRecipient.trim(),
        recipientName: clientContactPerson || clientName,
        subject: emailSubject.trim() || `${documentType} from ${companyName}: ${title}`,
        customMessage: emailMessage.trim(),
      });
      if (res.data?.success) {
        showToast("Email Sent!", `Document transmitted to ${emailRecipient} with PDF.`);
        setShowEmailModal(false);
        setStatus("SENT");
      }
    } catch (err: any) {
      showToast("Dispatch Notice", err.response?.data?.message || err.message, "error");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!documentId) {
      showToast("Save First", "Please save the document before exporting PDF.", "error");
      return;
    }
    window.open(`/api/unified-documents/${documentId}/download-pdf`, "_blank");
  };

  return (
    <div className="min-h-screen bg-slate-100/70 p-4 md:p-8 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border backdrop-blur-md transition-all ${
            toastMessage.type === "error"
              ? "bg-rose-50/95 text-rose-800 border-rose-200"
              : "bg-emerald-50/95 text-emerald-800 border-emerald-200"
          }`}
        >
          {toastMessage.type === "error" ? <X className="w-5 h-5 text-rose-600" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          <div>
            <div className="font-semibold text-sm">{toastMessage.title}</div>
            {toastMessage.desc && <div className="text-xs opacity-90">{toastMessage.desc}</div>}
          </div>
        </div>
      )}

      {/* Clean Top Action Bar */}
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/org-admin/documents"
            className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            title="Back to Documents"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">AI Document Builder</h1>
              {documentNumber && (
                <span className="font-mono text-xs font-bold text-[#274690] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  {documentNumber}
                </span>
              )}
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {status}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Generated by AI • All fields directly editable • Click text to customize
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {documentId && (
            <>
              <button
                onClick={handleDownloadPdf}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition"
                title="Download PDF"
              >
                <Download className="w-3.5 h-3.5 text-[#274690]" />
                <span>PDF</span>
              </button>

              <button
                onClick={() => {
                  setEmailRecipient(clientEmail || "");
                  setEmailSubject(`${documentType} from ${companyName}: ${title}`);
                  setEmailMessage(`Dear ${clientContactPerson || clientName},\n\nPlease find attached our ${documentType} regarding ${title}.\n\nBest regards,\n${companyName}`);
                  setShowEmailModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send to Client</span>
              </button>
            </>
          )}

          <button
            onClick={() => {
              setTemplateSaveName(`${title} Template`);
              setShowTemplateModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#274690] bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition"
          >
            <Layers className="w-3.5 h-3.5 text-[#274690]" />
            <span>Save as Template</span>
          </button>

          <button
            onClick={() => handleSaveDocument()}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#274690] hover:bg-[#1e3670] rounded-xl shadow-md shadow-blue-900/15 transition disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Document</span>
          </button>
        </div>
      </div>

      {/* Simple, Non-Messy AI Prompt Card */}
      <div className="max-w-5xl mx-auto bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#274690]" />
            <span>Tell the AI what document you need:</span>
          </label>
          <span className="text-[11px] text-slate-400">
            Mention any company, client, amount, or service
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <textarea
            rows={2}
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="e.g. “Create a quotation for ABC Pvt Ltd for ₹5,00,000 for AI Document Automation” or “Create an NDA between Acme Corp and Stark Industries”"
            className="w-full px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 border border-slate-300 focus:border-[#274690] focus:ring-2 focus:ring-[#274690]/10 rounded-xl outline-none resize-none transition"
          />
          <button
            type="button"
            onClick={handleGenerateAI}
            disabled={generatingAi || !aiPrompt.trim()}
            className="sm:self-stretch flex items-center justify-center gap-2 px-6 py-2.5 bg-[#274690] hover:bg-[#1e3670] text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 whitespace-nowrap"
          >
            {generatingAi ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Document</span>
              </>
            )}
          </button>
        </div>

        {/* Neat Prompt Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-semibold text-slate-400">Examples:</span>
          {PROMPT_SUGGESTIONS.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setAiPrompt(s)}
              className="text-[11px] bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-[#274690] px-3 py-1 rounded-lg border border-slate-200 transition truncate max-w-xs"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Clean Interactive Executive Document Canvas */}
      <div className="max-w-5xl mx-auto bg-white p-8 md:p-12 rounded-2xl border border-slate-200 shadow-md space-y-8 text-slate-800">
        {/* Top Header: Issuer (From) vs Recipient (To) */}
        <div className="border-t-4 border-[#274690] pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* FROM: Any Company (Defaults to Dezoryn Technology) */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#274690] tracking-wider">
              ISSUING COMPANY (FROM)
            </span>
            <div>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="font-black text-xl text-[#274690] w-full border-b border-transparent hover:border-slate-300 focus:border-[#274690] outline-none"
                placeholder="Issuing Company Name"
              />
            </div>
            <div>
              <input
                type="text"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                className="text-xs text-slate-500 w-full border-b border-transparent hover:border-slate-300 focus:border-[#274690] outline-none"
                placeholder="Registered Address"
              />
            </div>
            <div>
              <input
                type="text"
                value={companyContact}
                onChange={(e) => setCompanyContact(e.target.value)}
                className="text-xs text-slate-500 w-full border-b border-transparent hover:border-slate-300 focus:border-[#274690] outline-none"
                placeholder="Contact Info"
              />
            </div>
            {companyGstin && (
              <div className="text-[11px] font-mono text-slate-400">
                GSTIN: {companyGstin}
              </div>
            )}
          </div>

          {/* TO: Client / Recipient Entity */}
          <div className="space-y-1 md:text-right bg-slate-50/80 p-4 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              PREPARED FOR / RECIPIENT (TO)
            </span>
            <div>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="font-bold text-base text-slate-900 w-full md:text-right border-b border-transparent hover:border-slate-300 focus:border-[#274690] outline-none bg-transparent"
                placeholder="Client Company Name"
              />
            </div>
            <div>
              <input
                type="text"
                value={clientContactPerson}
                onChange={(e) => setClientContactPerson(e.target.value)}
                className="text-xs text-slate-600 w-full md:text-right border-b border-transparent hover:border-slate-300 focus:border-[#274690] outline-none bg-transparent"
                placeholder="Attention / Contact Person"
              />
            </div>
            <div>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="text-xs text-slate-500 w-full md:text-right border-b border-transparent hover:border-slate-300 focus:border-[#274690] outline-none bg-transparent"
                placeholder="Client Email"
              />
            </div>
            <div>
              <input
                type="text"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                className="text-xs text-slate-400 w-full md:text-right border-b border-transparent hover:border-slate-300 focus:border-[#274690] outline-none bg-transparent"
                placeholder="Client Billing Address"
              />
            </div>
          </div>
        </div>

        <hr className="border-slate-200" />

        {/* Document Title Header */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            DOCUMENT TITLE & PURPOSE
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-lg font-bold text-slate-900 border-l-4 border-[#274690] pl-3 py-1 outline-none hover:bg-slate-50 focus:bg-slate-50 rounded-r-lg"
          />
        </div>

        {/* Document Sections: Clean, Professional, Directly Editable */}
        <div className="space-y-6">
          {sections.map((sec, idx) => (
            <div
              key={sec.id}
              className="group relative p-4 rounded-xl border border-transparent hover:border-slate-200 hover:bg-slate-50/50 transition"
            >
              {/* Subtle Section Toolbar on Hover */}
              <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 z-10">
                <button
                  type="button"
                  onClick={() => setRefiningSectionId(refiningSectionId === sec.id ? null : sec.id)}
                  className="px-2 py-1 bg-white shadow-xs border border-slate-200 text-[#274690] hover:bg-blue-50 text-[11px] font-bold rounded-lg transition flex items-center gap-1"
                >
                  <Wand2 className="w-3 h-3" />
                  <span>AI Refine</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveSection(sec.id)}
                  className="p-1 bg-white shadow-xs border border-slate-200 text-slate-400 hover:text-rose-600 rounded-lg transition"
                  title="Remove Section"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Inline AI Refinement Popover */}
              {refiningSectionId === sec.id && (
                <div className="mb-3 p-3 bg-blue-50/90 border border-blue-200 rounded-xl flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-bold text-[#274690]">AI Actions:</span>
                  <button
                    onClick={() => handleAiRefineSection(sec.id, "make_professional")}
                    className="px-2.5 py-1 bg-white hover:bg-blue-100 text-slate-800 rounded-md border border-blue-200 font-medium"
                  >
                    👔 Make Professional
                  </button>
                  <button
                    onClick={() => handleAiRefineSection(sec.id, "expand")}
                    className="px-2.5 py-1 bg-white hover:bg-blue-100 text-slate-800 rounded-md border border-blue-200 font-medium"
                  >
                    📈 Expand Details
                  </button>
                  <button
                    onClick={() => handleAiRefineSection(sec.id, "shorten")}
                    className="px-2.5 py-1 bg-white hover:bg-blue-100 text-slate-800 rounded-md border border-blue-200 font-medium"
                  >
                    ✂️ Shorten / Concise
                  </button>
                  <button
                    onClick={() => setRefiningSectionId(null)}
                    className="text-slate-400 hover:text-slate-600 ml-auto"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Section Title */}
              {sec.type !== "header" && (
                <input
                  type="text"
                  value={sec.title}
                  onChange={(e) => handleUpdateSection(sec.id, "title", e.target.value)}
                  className="w-full text-sm font-bold text-[#274690] border-b border-transparent hover:border-slate-300 focus:border-[#274690] outline-none pb-1 mb-2 bg-transparent"
                />
              )}

              {/* Section Body */}
              {sec.type !== "table" && (
                <textarea
                  rows={sec.type === "terms" ? 4 : 3}
                  value={sec.body || ""}
                  onChange={(e) => handleUpdateSection(sec.id, "body", e.target.value)}
                  className="w-full text-xs text-slate-700 leading-relaxed border border-transparent hover:border-slate-200 focus:border-[#274690] focus:bg-white rounded-lg p-2 outline-none resize-none bg-transparent"
                />
              )}

              {/* Table rendering with editable cells */}
              {sec.type === "table" && sec.tableData && (
                <div className="overflow-x-auto border border-slate-200 rounded-xl my-2">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#274690] text-white text-[11px]">
                      <tr>
                        {sec.tableData.headers.map((h, hIdx) => (
                          <th key={hIdx} className="py-2.5 px-3 font-semibold">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {sec.tableData.rows.map((row, rIdx) => (
                        <tr key={rIdx} className={rIdx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="p-1">
                              <input
                                type="text"
                                value={cell}
                                onChange={(e) => {
                                  const newRows = [...sec.tableData!.rows];
                                  newRows[rIdx][cIdx] = e.target.value;
                                  setSections((prev) =>
                                    prev.map((s) =>
                                      s.id === sec.id
                                        ? { ...s, tableData: { ...s.tableData!, rows: newRows } }
                                        : s
                                    )
                                  );
                                }}
                                className="w-full px-2 py-1.5 text-xs bg-transparent border border-transparent hover:border-slate-200 focus:border-[#274690] rounded outline-none"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Signature Block */}
              {sec.type === "signature" && (
                <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="border-t-2 border-slate-300 pt-2">
                    <div className="font-bold text-xs text-slate-900">For {companyName}</div>
                    <div className="text-[11px] text-slate-500">Authorized Signatory</div>
                  </div>
                  <div className="border-t-2 border-slate-300 pt-2">
                    <div className="font-bold text-xs text-slate-900">Accepted by {clientName}</div>
                    <div className="text-[11px] text-slate-500">Client Representative</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Clean Add Section Toolbar */}
        <div className="flex items-center justify-center gap-2 pt-4 border-t border-slate-200">
          <span className="text-xs text-slate-400 font-medium">Add Section:</span>
          <button
            type="button"
            onClick={() => handleAddSection("text")}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            + Text Clause
          </button>
          <button
            type="button"
            onClick={() => handleAddSection("table")}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            + Deliverables Table
          </button>
          <button
            type="button"
            onClick={() => handleAddSection("terms")}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            + Terms & Payment
          </button>
        </div>

        {/* Footer info */}
        <div className="text-center text-[10px] text-slate-400 pt-2">
          {companyName} • Confidential Business Document
        </div>
      </div>

      {/* Save as Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#274690]" />
                <h3 className="font-bold text-slate-900">Save as Reusable Template</h3>
              </div>
              <button onClick={() => setShowTemplateModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              Save this document layout as a template. You can re-use it for any other client anytime from your <strong>Document Templates</strong> page.
            </p>

            <form onSubmit={handleSaveAsTemplate} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Template Name</label>
                <input
                  type="text"
                  required
                  value={templateSaveName}
                  onChange={(e) => setTemplateSaveName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-[#274690] outline-none"
                  placeholder="e.g. Standard AI Document Quotation"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={templateSaveCategory}
                  onChange={(e) => setTemplateSaveCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white outline-none"
                >
                  <option value="Sales">Sales & Commercial</option>
                  <option value="Business">Business Proposals</option>
                  <option value="Legal">Legal & Agreements</option>
                  <option value="HR">HR & Recruitment</option>
                  <option value="Operational">Operational</option>
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
                  disabled={saving}
                  className="px-5 py-2 bg-[#274690] hover:bg-[#1e3670] text-white rounded-xl font-bold shadow-md transition disabled:opacity-50"
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
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900">Send Document to Client</h3>
              </div>
              <button onClick={() => setShowEmailModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSendEmail} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Recipient Email</label>
                <input
                  type="email"
                  required
                  value={emailRecipient}
                  onChange={(e) => setEmailRecipient(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl outline-none"
                  placeholder="client@company.com"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Message</label>
                <textarea
                  rows={4}
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl outline-none resize-none"
                />
              </div>

              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-[11px] flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>An official PDF copy will be attached automatically to this email.</span>
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {sendingEmail ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Send to Client</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UniversalAiDocumentBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-[#274690]" />
          <p className="text-xs text-slate-500 font-medium">Loading AI Document Builder...</p>
        </div>
      }
    >
      <UniversalAiDocumentBuilderContent />
    </Suspense>
  );
}
