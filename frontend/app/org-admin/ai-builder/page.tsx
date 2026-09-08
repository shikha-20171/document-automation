"use client";

import React, { Suspense, useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Sparkles, Save, Eye, CheckCircle2, History, Plus, Trash2,
  Download, Send, Building2, Layers, AlertCircle, RefreshCw,
  FileText, ArrowLeft, MoreVertical, FileCode, Check, Copy,
  ExternalLink, ArrowUpRight, ShieldCheck, ChevronDown, PenTool,
  Printer, Wand2, DollarSign, Edit3, UserCheck, Clock, CheckCircle
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
    cgstRate?: number;
    cgstAmount?: number;
    sgstRate?: number;
    sgstAmount?: number;
    total?: number;
    amountInWords?: string;
    subtotalInWords?: string;
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

// Master corporate profile for Dezoryn Technology
const DEZORYN_PROFILE = {
  companyName: "Dezoryn Technology",
  legalName: "Dezoryn Technology Pvt Ltd",
  address: "Level 5, Tech Park One, Airport Road, Yerwada, Pune, Maharashtra 411006",
  city: "Pune",
  state: "Maharashtra",
  country: "India",
  postalCode: "411006",
  email: "contact@dezoryn.com",
  phone: "+91 98765 43210",
  website: "https://www.dezoryn.com",
  gstin: "27AAACD1234E1Z5",
  pan: "AAACD1234E",
  cin: "U72900PN2023PTC123456",
  signatory: "Aditya Sharma, Director & VP Enterprise Solutions",
  bankName: "HDFC Bank",
  bankAccount: "50200012345678",
  bankIfsc: "HDFC0000123",
  bankBranch: "Yerwada Branch, Pune",
};

const PROMPT_SUGGESTIONS = [
  "Create a quotation for ABC Pvt Ltd for ₹5,00,000 for AI Document Automation",
  "Create a professional bid document for XYZ Ltd for our software development project",
  "Create a commercial proposal for Reliance Retail for Cloud Modernization worth ₹12 lakh",
  "Create an NDA between Dezoryn Technology and Global Tech Partners",
  "Create an invoice for ABC Pvt Ltd for AI Document Automation worth ₹5,00,000",
  "Create a Statement of Work (SOW) for XYZ Ltd for enterprise workflow automation",
];

function UniversalAiDocumentBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const docIdParam = searchParams.get("id");
  const templateIdParam = searchParams.get("templateId");

  // Document State
  const [documentId, setDocumentId] = useState<string | null>(docIdParam);
  const [documentNumber, setDocumentNumber] = useState<string>("");
  const [title, setTitle] = useState<string>("Quotation for ABC Pvt Ltd - AI Document Automation Solution");
  const [documentType, setDocumentType] = useState<string>("Quotation");
  const [category, setCategory] = useState<string>("Sales");
  const [status, setStatus] = useState<string>("AI GENERATED");
  const [currentVersion, setCurrentVersion] = useState<number>(1);
  const [publicShareToken, setPublicShareToken] = useState<string>("");

  // Issuing Company: Locked to Dezoryn Technology
  const companyName = DEZORYN_PROFILE.companyName;
  const legalName = DEZORYN_PROFILE.legalName;

  // Client Details
  const [clientId, setClientId] = useState<string>("");
  const [clientName, setClientName] = useState<string>("ABC Pvt Ltd");
  const [clientContactPerson, setClientContactPerson] = useState<string>("Procurement & IT Head");
  const [clientEmail, setClientEmail] = useState<string>("procurement@abcpvtltd.com");
  const [clientPhone, setClientPhone] = useState<string>("+91 98230 11223");
  const [clientAddress, setClientAddress] = useState<string>("Tower B, Commercial IT Park, Bangalore, Karnataka 560100");

  // Content Sections
  const [sections, setSections] = useState<DocumentSection[]>([
    {
      id: "sec_overview",
      type: "header",
      title: "Official Quotation & Commercial Estimate",
      body: `QUOTATION NUMBER: DT-QT-${new Date().getFullYear()}-1042\nDATE OF ISSUE: ${new Date().toLocaleDateString('en-GB')}\nVALIDITY: 30 Calendar Days\n\nISSUED BY (SERVICE PROVIDER):\nDezoryn Technology (Dezoryn Technology Pvt Ltd)\n${DEZORYN_PROFILE.address}\nGSTIN: ${DEZORYN_PROFILE.gstin} | PAN: ${DEZORYN_PROFILE.pan} | CIN: ${DEZORYN_PROFILE.cin}\nEmail: ${DEZORYN_PROFILE.email} | Web: ${DEZORYN_PROFILE.website}\n\nISSUED TO (CLIENT):\nABC Pvt Ltd\nAttention: Procurement & IT Head\nSubject: Commercial Quotation for AI Document Automation Solution`,
    },
    {
      id: "sec_scope",
      type: "text",
      title: "1. Project Scope & Technical Capabilities",
      body: "• Implementation of intelligent OCR pipeline and natural-language document drafting engine.\n• Integration of multi-tenant PostgreSQL database, RBAC security matrices, and automated PDF export.\n• Comprehensive UAT testing, cloud infrastructure deployment, and administrator training.",
    },
    {
      id: "sec_table",
      type: "table",
      title: "2. Itemized Pricing & Deliverables Schedule",
      tableData: {
        headers: ["Deliverable / Item", "Scope Description", "Qty", "Unit", "Unit Rate (INR)", "Total Amount (INR)"],
        rows: [
          ["AI Document Automation - Core Engine", "Cognitive extraction, OCR orchestration & API endpoints", "1", "system", "₹2,50,000.00", "₹2,50,000.00"],
          ["Management Console & Workflow Portals", "Responsive web editor, template builders & live preview", "1", "package", "₹1,50,000.00", "₹1,50,000.00"],
          ["QA Hardening, Cloud Deployment & Hypercare", "Security compliance, production rollout & 30-day warranty", "1", "service", "₹1,00,000.00", "₹1,00,000.00"],
        ],
      },
    },
    {
      id: "sec_financial_summary",
      type: "terms",
      title: "3. Financial Summary & Statutory Taxes",
      body: "• Base Project Value (Taxable Amount): ₹5,00,000.00 (Rupees Five Lakh Only)\n• Central GST (CGST @ 9%): ₹45,000.00\n• State GST (SGST @ 9%): ₹45,000.00\n• Total Applicable Tax (GST 18%): ₹90,000.00\n• Grand Total (Tax Inclusive): ₹5,90,000.00\n• Amount in Words: Rupees Five Lakh Ninety Thousand Only",
    },
    {
      id: "sec_payment_terms",
      type: "terms",
      title: "4. Payment Schedule & Bank Information",
      body: `Payment Schedule:\n• 50% Advance upon quotation acceptance and project kickoff.\n• 50% upon milestone completion, UAT approval, and delivery.\n\nBank Account Details for Remittance:\nAccount Name: Dezoryn Technology Pvt Ltd\nBank: HDFC Bank\nAccount Number: ${DEZORYN_PROFILE.bankAccount}\nIFSC Code: ${DEZORYN_PROFILE.bankIfsc}\nBranch: ${DEZORYN_PROFILE.bankBranch}`,
    },
    {
      id: "sec_signature",
      type: "signature",
      title: "5. Authorized Signatures & Client Acceptance",
      body: "Issued by Dezoryn Technology Pvt Ltd (Authorized Signatory: Aditya Sharma, Director). Accepted by ABC Pvt Ltd.",
    },
  ]);

  // Variables & Financials
  const [variables, setVariables] = useState<Record<string, string>>({
    company_name: "Dezoryn Technology",
    legal_name: "Dezoryn Technology Pvt Ltd",
    client_name: "ABC Pvt Ltd",
    project_name: "AI Document Automation Solution",
    amount: "₹5,90,000.00",
    subtotal: "₹5,00,000.00",
    amount_in_words: "Rupees Five Lakh Ninety Thousand Only",
  });

  const [financialData, setFinancialData] = useState<any>({
    currency: "INR",
    subtotal: 500000,
    discountValue: 0,
    discountAmount: 0,
    taxRate: 18,
    taxAmount: 90000,
    cgstRate: 9,
    cgstAmount: 45000,
    sgstRate: 9,
    sgstAmount: 45000,
    total: 590000,
    amountInWords: "Rupees Five Lakh Ninety Thousand Only",
    subtotalInWords: "Rupees Five Lakh Only",
  });

  // AI & Detection State
  const [aiPrompt, setAiPrompt] = useState<string>("Create a quotation for ABC Pvt Ltd for ₹5,00,000 for AI Document Automation");
  const [detectedType, setDetectedType] = useState<{ type: string; category: string; confidence: number } | null>({
    type: "Quotation",
    category: "Sales",
    confidence: 0.95,
  });
  const [generatingAi, setGeneratingAi] = useState<boolean>(false);
  const [customAiInstruction, setCustomAiInstruction] = useState<string>("");
  const [showAiToolbar, setShowAiToolbar] = useState<boolean>(false);

  // CRM & Template Data
  const [crmClients, setCrmClients] = useState<CrmClient[]>([]);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);

  // UI Modes
  const [activeTab, setActiveTab] = useState<"preview" | "editor">("preview");
  const [saving, setSaving] = useState<boolean>(false);
  const [showVersionsDrawer, setShowVersionsDrawer] = useState<boolean>(false);
  const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false);
  const [templateSaveName, setTemplateSaveName] = useState<string>("");
  const [templateSaveCategory, setTemplateSaveCategory] = useState<string>("Sales");
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
  const [emailRecipient, setEmailRecipient] = useState<string>("");
  const [emailSubject, setEmailSubject] = useState<string>("");
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
    }, 350);
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
    setTitle(`${tpl.documentType} for ${clientName || "Valued Client"}`);
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
        companyName: DEZORYN_PROFILE.companyName,
        clientContext: clientId ? crmClients.find((c) => c.id === clientId) : null,
        documentTypeOverride: detectedType?.type || null,
        categoryOverride: detectedType?.category || null,
      });

      if (res.data?.success && res.data.data) {
        const gen = res.data.data;
        setTitle(gen.title);
        setDocumentType(gen.documentType);
        setCategory(gen.category);
        setStatus("AI GENERATED");

        // Issuing company is ALWAYS Dezoryn Technology
        const resolvedClient = gen.clientName || gen.variables?.client_name || clientName;
        setClientName(resolvedClient);

        if (gen.clientEmail) setClientEmail(gen.clientEmail);
        if (gen.clientContactPerson) setClientContactPerson(gen.clientContactPerson);
        if (gen.clientPhone) setClientPhone(gen.clientPhone);
        if (gen.clientAddress) setClientAddress(gen.clientAddress);
        if (Array.isArray(gen.content) && gen.content.length > 0) setSections(gen.content);
        if (gen.financialData) setFinancialData(gen.financialData);
        if (gen.variables) {
          setVariables((prev) => ({
            ...prev,
            ...gen.variables,
            company_name: DEZORYN_PROFILE.companyName,
            client_name: resolvedClient,
          }));
        }

        // Switch to Live Preview immediately for client-ready view
        setActiveTab("preview");

        showToast(
          "Document Generated!",
          `AI created complete ${gen.documentType} from Dezoryn Technology to ${resolvedClient}.`
        );
      }
    } catch (err: any) {
      showToast("AI Generation Notice", err.response?.data?.message || err.message, "error");
    } finally {
      setGeneratingAi(false);
    }
  };

  // AI Refinement & Editing Engine
  const handleAiEdit = async (action: string, instruction?: string, sectionId?: string) => {
    try {
      setGeneratingAi(true);
      const docData = {
        title,
        documentType,
        category,
        companyName: DEZORYN_PROFILE.companyName,
        clientName,
        clientEmail,
        clientPhone,
        clientAddress,
        clientContactPerson,
        variables,
        financialData,
        content: sections,
      };

      const res = await apiClient.post("/api/unified-documents/ai-edit", {
        document: docData,
        instruction: instruction || action,
        sectionId: sectionId || null,
        action,
      });

      if (res.data?.success && res.data.data) {
        const updated = res.data.data;
        if (Array.isArray(updated.content)) setSections(updated.content);
        if (updated.financialData) setFinancialData(updated.financialData);
        if (updated.variables) setVariables(updated.variables);
        if (updated.title) setTitle(updated.title);
        showToast("AI Refined!", `Applied ${action.replace('_', ' ')} successfully.`);
      }
    } catch (err: any) {
      showToast("AI Edit Notice", err.response?.data?.message || err.message, "error");
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
        headers: ["Item / Milestone", "Description", "Qty", "Unit", "Rate", "Amount"],
        rows: [["Deliverable 1", "Implementation details", "1", "unit", "50000", "50000"]],
      };
    }

    setSections([...sections, newSec]);
    showToast("Section Added", `Added new ${type} block to the document.`);
  };

  const handleUpdateSection = (id: string, field: "title" | "body", value: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleRemoveSection = (id: string) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
  };

  // Save Document to Database
  const handleSave = async (statusOverride?: string) => {
    try {
      setSaving(true);
      const targetStatus = statusOverride || status;
      const payload = {
        title: title.trim(),
        documentType: documentType.trim(),
        category: category.trim(),
        status: targetStatus,
        clientId: clientId || null,
        clientName: clientName?.trim() || null,
        clientEmail: clientEmail?.trim() || null,
        clientPhone: clientPhone?.trim() || null,
        clientAddress: clientAddress?.trim() || null,
        clientContactPerson: clientContactPerson?.trim() || null,
        senderData: {
          companyName: DEZORYN_PROFILE.companyName,
          legalName: DEZORYN_PROFILE.legalName,
          address: DEZORYN_PROFILE.address,
          email: DEZORYN_PROFILE.email,
          phone: DEZORYN_PROFILE.phone,
          website: DEZORYN_PROFILE.website,
          gstin: DEZORYN_PROFILE.gstin,
          pan: DEZORYN_PROFILE.pan,
          cin: DEZORYN_PROFILE.cin,
          signatory: DEZORYN_PROFILE.signatory,
          bankDetails: {
            bankName: DEZORYN_PROFILE.bankName,
            accountNumber: DEZORYN_PROFILE.bankAccount,
            ifsc: DEZORYN_PROFILE.bankIfsc,
            branch: DEZORYN_PROFILE.bankBranch,
          },
        },
        content: sections,
        financialData,
        variables: {
          ...variables,
          company_name: DEZORYN_PROFILE.companyName,
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
        populateDocument(res.data.data);
        showToast("Document Saved!", `Document ${res.data.data.documentNumber} saved as ${targetStatus}.`);
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
        showToast("Version Restored", `Document restored to version ${versionNum}.`);
      }
    } catch (err: any) {
      showToast("Restore Failed", err.response?.data?.message || err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // Save as Template
  const handleSaveAsTemplate = async (e?: React.FormEvent, redirectToTemplates: boolean = false) => {
    if (e) e.preventDefault();
    if (!templateSaveName.trim()) {
      showToast("Missing Name", "Please provide a name for this template.", "error");
      return;
    }

    try {
      setSaving(true);
      let createdTemplateId: string | null = null;
      const formattedContent = sections
        .map((s) => {
          let str = `### ${s.title}\n\n${s.body || ""}`;
          if (s.tableData?.headers && s.tableData?.rows) {
            str += `\n\n| ${s.tableData.headers.join(" | ")} |\n| ${s.tableData.headers.map(() => ":---").join(" | ")} |\n`;
            s.tableData.rows.forEach((r) => {
              str += `| ${r.join(" | ")} |\n`;
            });
          }
          return str;
        })
        .join("\n\n---\n\n");

      if (documentId) {
        try {
          const res = await apiClient.post(`/api/unified-documents/${documentId}/save-as-template`, {
            name: templateSaveName.trim(),
            category: templateSaveCategory,
            description: `Generated template from: ${title}`,
          });
          if (res.data?.success && res.data.data) {
            createdTemplateId = res.data.data.id;
          }
        } catch {}
      }

      if (!createdTemplateId) {
        try {
          const res = await apiClient.post("/api/unified-templates", {
            name: templateSaveName.trim(),
            category: templateSaveCategory,
            documentType: documentType || "Custom Document",
            description: `Created in AI Document Builder from prompt: "${aiPrompt.slice(0, 100)}"`,
            sections: sections,
            defaultVariables: variables,
            layoutConfig: { primaryColor: "#274690", theme: "modern" },
          });
          if (res.data?.success && res.data.data) {
            createdTemplateId = res.data.data.id;
          }
        } catch {}
      }

      // Persist in local storage for instant template page visibility
      const localTplItem = {
        id: createdTemplateId || `tmpl-${Date.now()}`,
        name: templateSaveName.trim(),
        description: `Created from AI Document Builder: ${title}`,
        category: templateSaveCategory,
        status: "Active",
        usage: 0,
        createdBy: "Dezoryn Technology",
        owner: "Dezoryn Technology",
        updated: "Just now",
        department: "All",
        documentType: documentType || "Document",
        tags: [templateSaveCategory, "AI Generated"],
        visibility: "Organisation Wide",
        isShared: true,
        content: formattedContent,
        sections: sections,
        defaultVariables: { ...variables, company_name: DEZORYN_PROFILE.companyName, client_name: clientName },
      };

      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("docucore_custom_templates");
          const existing = raw ? JSON.parse(raw) : [];
          localStorage.setItem(
            "docucore_custom_templates",
            JSON.stringify([localTplItem, ...existing.filter((t: any) => t.name !== localTplItem.name)])
          );
        } catch {}
      }

      setShowTemplateModal(false);
      showToast("Template Created!", `"${templateSaveName}" is now available on your Templates page.`);

      if (redirectToTemplates) {
        setTimeout(() => {
          router.push("/org-admin/templates");
        }, 500);
      }
    } catch (err: any) {
      showToast("Template Saved", `"${templateSaveName}" saved for your organisation.`, "success");
      setShowTemplateModal(false);
      if (redirectToTemplates) {
        setTimeout(() => {
          router.push("/org-admin/templates");
        }, 500);
      }
    } finally {
      setSaving(false);
    }
  };

  // Email Dispatch
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentId) {
      showToast("Save First", "Please save the document before sending to the client.", "error");
      return;
    }
    if (!emailRecipient.trim()) {
      showToast("Recipient Required", "Please provide the recipient's email address.", "error");
      return;
    }

    try {
      setSendingEmail(true);
      const res = await apiClient.post(`/api/unified-documents/${documentId}/send-email`, {
        recipientEmail: emailRecipient.trim(),
        recipientName: clientContactPerson || clientName,
        subject: emailSubject.trim() || `${documentType} from Dezoryn Technology: ${title}`,
        customMessage: emailMessage.trim(),
      });
      if (res.data?.success) {
        showToast("Document Sent!", `Successfully transmitted to ${emailRecipient} with PDF attachment.`);
        setShowEmailModal(false);
        setStatus("SENT TO CLIENT");
      }
    } catch (err: any) {
      showToast("Dispatch Notice", err.response?.data?.message || err.message, "error");
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

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (!publicShareToken) {
      showToast("Save First", "Save document to generate secure client portal link.", "error");
      return;
    }
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/documents/view/${publicShareToken}`;
    navigator.clipboard.writeText(url);
    showToast("Link Copied!", "Client portal link copied to clipboard.");
  };

  return (
    <div className="min-h-screen bg-slate-50/70 p-4 md:p-6 space-y-6">
      {/* Toast Notification */}
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

      {/* Top Corporate Identity & Action Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Link
            href="/org-admin/documents"
            className="p-2.5 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">AI Document Builder</h1>
              {documentNumber && (
                <span className="font-mono text-xs font-bold text-[#274690] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  {documentNumber}
                </span>
              )}
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                status === "APPROVED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                status === "SENT TO CLIENT" ? "bg-blue-50 text-blue-700 border-blue-200" :
                "bg-amber-50 text-amber-700 border-amber-200"
              }`}>
                {status}
              </span>
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                v{currentVersion}.0
              </span>
            </div>
            {/* Locked Issuing Party Indicator */}
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className="text-slate-500">Issuer:</span>
              <span className="font-bold text-[#274690] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {DEZORYN_PROFILE.companyName}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500">To Client:</span>
              <span className="font-semibold text-slate-800">{clientName || "Recipient Client"}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
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
                title="Export Official PDF"
              >
                <Download className="w-3.5 h-3.5 text-[#274690]" />
                <span>PDF</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition"
                title="Print Preview"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Print</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>

              <button
                onClick={() => {
                  setEmailRecipient(clientEmail || "");
                  setEmailSubject(`${documentType} from Dezoryn Technology: ${title}`);
                  setEmailMessage(`Dear ${clientContactPerson || clientName},\n\nPlease find attached the official ${documentType} from Dezoryn Technology regarding ${variables.project_name || title}.\n\nBest regards,\nAditya Sharma\nDezoryn Technology Pvt Ltd`);
                  setShowEmailModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send to Client</span>
              </button>
            </>
          )}

          {status !== "APPROVED" && (
            <button
              onClick={() => {
                setStatus("APPROVED");
                handleSave("APPROVED");
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-300 transition"
              title="Approve document for client transmission"
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Approve</span>
            </button>
          )}

          <button
            onClick={() => {
              setTemplateSaveName(`${title} Template`);
              setShowTemplateModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#274690] bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition"
          >
            <Layers className="w-3.5 h-3.5 text-[#274690]" />
            <span>Save as Template</span>
          </button>

          <button
            onClick={() => handleSave("DRAFT")}
            disabled={saving}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Draft</span>
          </button>

          <button
            onClick={() => handleSave("FINAL")}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#274690] hover:bg-[#1f3561] rounded-xl shadow-md shadow-blue-900/20 transition disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            <span>Finalize</span>
          </button>
        </div>
      </div>

      {/* Hero Natural-Language AI Prompt Box */}
      <div className="bg-gradient-to-br from-[#001b2e] via-[#102a43] to-[#274690] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-blue-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-500/20 rounded-lg text-blue-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
              Organisation Natural-Language Builder
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs bg-white/10 px-3 py-1 rounded-full border border-white/15">
            <span className="text-blue-300">Issuer Identity:</span>
            <strong className="text-white">Dezoryn Technology</strong>
            {detectedType && (
              <>
                <span className="text-blue-300/50">•</span>
                <span className="text-amber-300 font-semibold">{detectedType.type}</span>
              </>
            )}
          </div>
        </div>

        <p className="text-xs text-blue-100/80 mb-3">
          Enter a simple request in plain English. The AI understands intent, populates client & CRM data, enforces Dezoryn Technology branding, calculates taxes and line items, and generates client-ready documents automatically.
        </p>

        {/* Large Prominent Prompt Input Box */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <textarea
              rows={2}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. “Create a quotation for ABC Pvt Ltd for ₹5,00,000 for AI Document Automation” or “Create a professional bid document for XYZ Ltd for our software development project”"
              className="w-full px-4 py-3 bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/25 focus:border-blue-400 rounded-xl text-sm text-white placeholder-blue-200/50 focus:outline-none transition resize-none leading-relaxed shadow-inner"
            />
          </div>
          <button
            type="button"
            onClick={handleGenerateAI}
            disabled={generatingAi || !aiPrompt.trim()}
            className="sm:self-stretch flex items-center justify-center gap-2 px-7 py-3 bg-blue-500 hover:bg-blue-400 active:scale-[0.99] text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/30 transition disabled:opacity-50 whitespace-nowrap"
          >
            {generatingAi ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating Document...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Document</span>
              </>
            )}
          </button>
        </div>

        {/* Example Prompt Chips */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-blue-200/70 font-semibold">Quick Prompts:</span>
          {PROMPT_SUGGESTIONS.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setAiPrompt(s);
              }}
              className="text-[11px] bg-white/10 hover:bg-white/20 active:bg-white/25 text-blue-100 px-3 py-1 rounded-lg border border-white/10 transition truncate max-w-sm"
              title={s}
            >
              ⚡ {s}
            </button>
          ))}
        </div>
      </div>

      {/* Post-Generation AI Refinement Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-[#274690]" />
          <span className="text-xs font-bold text-slate-800">AI Document Assistant:</span>
          <span className="text-xs text-slate-500">Refine generated content without destroying existing sections</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleAiEdit("make_professional")}
            disabled={generatingAi}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition disabled:opacity-50"
          >
            👔 Make More Professional
          </button>

          <button
            onClick={() => handleAiEdit("expand")}
            disabled={generatingAi}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition disabled:opacity-50"
          >
            📈 Expand Scope & Details
          </button>

          <button
            onClick={() => handleAiEdit("shorten")}
            disabled={generatingAi}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition disabled:opacity-50"
          >
            ✂️ Shorten / Concise
          </button>

          <button
            onClick={() => {
              const amountPrompt = prompt("Enter new base amount in INR (e.g. 500000 or 750000):", "500000");
              if (amountPrompt) {
                handleAiEdit("update_pricing", `Update base price to ₹${amountPrompt}`);
              }
            }}
            disabled={generatingAi}
            className="px-3 py-1.5 text-xs font-semibold text-[#274690] bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition disabled:opacity-50"
          >
            💰 Recalculate Pricing
          </button>

          <button
            onClick={() => {
              const titlePrompt = prompt("Enter section title to add:", "Project Governance & Review Cadence");
              if (titlePrompt) {
                handleAiEdit("add_section", `Add section ${titlePrompt}`);
              }
            }}
            disabled={generatingAi}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition disabled:opacity-50"
          >
            ➕ Add Section
          </button>

          <button
            onClick={handleGenerateAI}
            disabled={generatingAi}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition disabled:opacity-50"
          >
            🔄 Regenerate
          </button>
        </div>
      </div>

      {/* Tab Switcher: Preview (Default) vs Interactive Editor */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab("preview")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === "preview"
                ? "bg-[#274690] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Client Live Preview</span>
          </button>

          <button
            onClick={() => setActiveTab("editor")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === "editor"
                ? "bg-[#274690] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Section Content Editor</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          {sections.length} document sections • All fields 100% editable
        </div>
      </div>

      {/* Main Workspace: Live Preview OR Structured Editor */}
      {activeTab === "preview" ? (
        /* LIVE CLIENT PREVIEW - HIGH FIDELITY OFFICIAL DOCUMENT */
        <div className="bg-white p-8 md:p-12 rounded-2xl border border-slate-200 shadow-md max-w-5xl mx-auto space-y-8 text-slate-800">
          {/* Corporate Header Bar */}
          <div className="border-t-4 border-[#274690] pt-6 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div>
              <div className="text-2xl font-black text-[#274690] tracking-tight">
                {DEZORYN_PROFILE.companyName}
              </div>
              <div className="text-xs font-semibold text-slate-600 mt-0.5">
                {DEZORYN_PROFILE.legalName}
              </div>
              <div className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
                {DEZORYN_PROFILE.address}
              </div>
              <div className="text-[11px] font-mono text-slate-500 mt-2 space-x-2">
                <span>GSTIN: <strong>{DEZORYN_PROFILE.gstin}</strong></span>
                <span>•</span>
                <span>PAN: <strong>{DEZORYN_PROFILE.pan}</strong></span>
                <span>•</span>
                <span>CIN: <strong>{DEZORYN_PROFILE.cin}</strong></span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Email: {DEZORYN_PROFILE.email} | Web: {DEZORYN_PROFILE.website}
              </div>
            </div>

            <div className="sm:text-right">
              <span className="text-xs font-bold uppercase tracking-widest text-[#274690] bg-blue-50 px-3 py-1 rounded-lg border border-blue-200 inline-block">
                {documentType.toUpperCase()}
              </span>
              <div className="text-lg font-mono font-bold text-slate-900 mt-2">
                {documentNumber || `DT-${documentType.slice(0, 3).toUpperCase()}-DRAFT`}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Date: <strong>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
              </div>
              <div className="text-xs text-slate-500">
                Validity: <strong>30 Calendar Days</strong>
              </div>
              <div className="text-xs text-slate-500">
                Status: <span className="font-semibold text-emerald-600">{status}</span>
              </div>
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* Client Recipient Card */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
              PREPARED FOR / RECIPIENT
            </div>
            <div className="text-base font-bold text-slate-900">{clientName || "Valued Client"}</div>
            {clientContactPerson && (
              <div className="text-slate-600 mt-0.5">Attn: <strong>{clientContactPerson}</strong></div>
            )}
            <div className="text-slate-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
              {clientEmail && <span>Email: {clientEmail}</span>}
              {clientPhone && <span>Phone: {clientPhone}</span>}
            </div>
            {clientAddress && <div className="text-slate-500 mt-1">Address: {clientAddress}</div>}
          </div>

          {/* Document Title */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 border-l-4 border-[#274690] pl-3">
              {title}
            </h2>
          </div>

          {/* Dynamic Content Sections */}
          {sections.map((sec, idx) => (
            <div key={sec.id} className="space-y-3 text-xs">
              {sec.title && sec.type !== "header" && (
                <h3 className="text-sm font-bold text-[#274690] border-b border-slate-100 pb-1">
                  {sec.title}
                </h3>
              )}

              {sec.body && (
                <div
                  className={`leading-relaxed whitespace-pre-line ${
                    sec.type === "terms"
                      ? "bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-600 font-sans"
                      : "text-slate-700 text-[13px]"
                  }`}
                >
                  {sec.body}
                </div>
              )}

              {/* Table rendering with rich headers & rows */}
              {sec.type === "table" && sec.tableData && (
                <div className="overflow-x-auto border border-slate-200 rounded-xl my-4">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#274690] text-white uppercase text-[10px] tracking-wider">
                      <tr>
                        {sec.tableData.headers.map((h, i) => (
                          <th key={i} className="py-3 px-4 font-bold">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {sec.tableData.rows.map((row, rI) => (
                        <tr key={rI} className={rI % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                          {row.map((cell, cI) => (
                            <td key={cI} className={`py-3 px-4 ${cI >= row.length - 2 ? "font-semibold" : ""}`}>
                              {cell}
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
                <div className="pt-8 grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="border-t-2 border-slate-300 pt-3">
                    <div className="font-bold text-slate-900">
                      For {DEZORYN_PROFILE.companyName} ({DEZORYN_PROFILE.legalName})
                    </div>
                    <div className="text-slate-600 text-xs font-semibold mt-0.5">{DEZORYN_PROFILE.signatory}</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">Authorised Signatory</div>
                  </div>

                  <div className="border-t-2 border-slate-300 pt-3">
                    <div className="font-bold text-slate-900">
                      Accepted by: {clientName || "Recipient Client"}
                    </div>
                    <div className="text-slate-600 text-xs font-semibold mt-0.5">
                      {clientContactPerson || "Authorized Representative"}
                    </div>
                    <div className="text-slate-400 text-[11px] mt-0.5">Signature & Seal</div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Official Bank Remittance Block */}
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200/80 text-xs text-slate-700 space-y-1">
            <div className="font-bold text-[#274690]">NEFT / RTGS Bank Remittance Details:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div>Beneficiary: <strong>{DEZORYN_PROFILE.legalName}</strong></div>
              <div>Bank: <strong>{DEZORYN_PROFILE.bankName}</strong></div>
              <div>Account No: <strong>{DEZORYN_PROFILE.bankAccount}</strong></div>
              <div>IFSC Code: <strong>{DEZORYN_PROFILE.bankIfsc}</strong> ({DEZORYN_PROFILE.bankBranch})</div>
            </div>
          </div>

          {/* Footer watermark */}
          <div className="border-t border-slate-200 pt-4 text-center text-[10px] text-slate-400">
            {documentNumber || "DOC-DRAFT"} • Issued by {DEZORYN_PROFILE.legalName} • Confidential Business Document
          </div>
        </div>
      ) : (
        /* INTERACTIVE EDITOR VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Metadata & Client Information */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#274690]" />
              <span>Document & Client Metadata</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Document Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#274690]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Document Type</label>
                <input
                  type="text"
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                >
                  <option value="Sales">Sales</option>
                  <option value="Business">Business</option>
                  <option value="Legal">Legal</option>
                  <option value="HR">HR</option>
                  <option value="Operational">Operational</option>
                </select>
              </div>
            </div>

            {/* Issuing Organisation (Locked) */}
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-1">
              <div className="text-[10px] uppercase font-bold text-[#274690]">Issuing Organisation (Fixed)</div>
              <div className="font-bold text-slate-900">{DEZORYN_PROFILE.companyName}</div>
              <div className="text-[11px] text-slate-600">{DEZORYN_PROFILE.address}</div>
              <div className="text-[10px] font-mono text-slate-500">GSTIN: {DEZORYN_PROFILE.gstin}</div>
            </div>

            {/* Client CRM Selection & Fields */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900">Client / Recipient</label>
                {crmClients.length > 0 && (
                  <select
                    value={clientId}
                    onChange={(e) => handleSelectClient(e.target.value)}
                    className="text-[11px] text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1"
                  >
                    <option value="">Choose from CRM...</option>
                    {crmClients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">Company Name</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  placeholder="e.g. ABC Pvt Ltd"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">Contact Person</label>
                <input
                  type="text"
                  value={clientContactPerson}
                  onChange={(e) => setClientContactPerson(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  placeholder="e.g. Rahul Verma"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">Client Email</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  placeholder="client@example.com"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">Client Address</label>
                <input
                  type="text"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  placeholder="City, State"
                />
              </div>
            </div>

            {/* Quick Add Section Buttons */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <label className="block text-xs font-bold text-slate-900">Add Content Block</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleAddSection("text")}
                  className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-medium text-slate-700 text-left"
                >
                  + Text Section
                </button>
                <button
                  type="button"
                  onClick={() => handleAddSection("table")}
                  className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-medium text-slate-700 text-left"
                >
                  + Pricing Table
                </button>
                <button
                  type="button"
                  onClick={() => handleAddSection("terms")}
                  className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-medium text-slate-700 text-left"
                >
                  + Terms Box
                </button>
                <button
                  type="button"
                  onClick={() => handleAddSection("signature")}
                  className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-medium text-slate-700 text-left"
                >
                  + Signatures
                </button>
              </div>
            </div>
          </div>

          {/* Right Columns: Structured Sections Editor */}
          <div className="lg:col-span-2 space-y-4">
            {sections.map((sec, idx) => (
              <div key={sec.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                    <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      {sec.type}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAiEdit("rewrite_section", undefined, sec.id)}
                      className="text-[11px] text-[#274690] hover:underline font-semibold"
                    >
                      Refine with AI
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveSection(sec.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    value={sec.title}
                    onChange={(e) => handleUpdateSection(sec.id, "title", e.target.value)}
                    className="w-full font-bold text-sm text-slate-900 border-b border-transparent focus:border-blue-500 pb-1 focus:outline-none"
                    placeholder="Section Title"
                  />
                </div>

                {sec.type !== "table" && (
                  <div>
                    <textarea
                      rows={sec.type === "terms" ? 4 : 3}
                      value={sec.body || ""}
                      onChange={(e) => handleUpdateSection(sec.id, "body", e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#274690]"
                      placeholder="Section content..."
                    />
                  </div>
                )}

                {sec.type === "table" && sec.tableData && (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-100 text-slate-700">
                        <tr>
                          {sec.tableData.headers.map((h, hIdx) => (
                            <th key={hIdx} className="p-2 text-left font-semibold">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sec.tableData.rows.map((row, rIdx) => (
                          <tr key={rIdx}>
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="p-2">
                                <input
                                  type="text"
                                  value={cell}
                                  onChange={(e) => {
                                    const updatedRows = [...sec.tableData!.rows];
                                    updatedRows[rIdx][cIdx] = e.target.value;
                                    setSections((prev) =>
                                      prev.map((s) =>
                                        s.id === sec.id
                                          ? { ...s, tableData: { ...s.tableData!, rows: updatedRows } }
                                          : s
                                      )
                                    );
                                  }}
                                  className="w-full px-1.5 py-1 text-xs border border-transparent hover:border-slate-200 focus:border-blue-500 rounded"
                                />
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
        </div>
      )}

      {/* Version History Drawer */}
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
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-blue-50 text-[#274690] flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Save as Reusable Template</h3>
                  <p className="text-[11px] text-slate-500">Add to organization template blueprints</p>
                </div>
              </div>
              <button onClick={() => setShowTemplateModal(false)} className="text-slate-400 hover:text-slate-600 font-bold p-1">✕</button>
            </div>

            <div className="mt-3 p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-[11px] text-slate-600 leading-relaxed">
              ✨ <strong>Reuse anytime:</strong> Once saved, this template will show up on your <strong>Document Templates</strong> page. You can generate custom versions for any client simply by editing their details.
            </div>

            <form onSubmit={(e) => handleSaveAsTemplate(e, false)} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Template Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={templateSaveName}
                  onChange={(e) => setTemplateSaveName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-[#274690]"
                  placeholder="e.g. AI Automation Quotation Template"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={templateSaveCategory}
                  onChange={(e) => setTemplateSaveCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-[#274690]"
                >
                  <option value="Sales">Sales & Commercial</option>
                  <option value="Business">Business Proposals</option>
                  <option value="Legal">Legal & Agreements</option>
                  <option value="HR">HR & Recruitment</option>
                  <option value="Operational">Operational Documents</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition disabled:opacity-50 order-1 sm:order-2"
                >
                  Save Template
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveAsTemplate(undefined, true)}
                  className="px-4 py-2 bg-[#274690] hover:bg-[#1f3561] text-white rounded-xl font-bold shadow-md transition disabled:opacity-50 flex items-center justify-center gap-1.5 order-3"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Save & Go to Templates</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Email Modal with Client CRM auto-fill */}
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
                <label className="block font-semibold text-slate-700 mb-1">
                  Recipient Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={emailRecipient}
                  onChange={(e) => setEmailRecipient(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  placeholder="client@company.com"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Subject</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cover Note / Message</label>
                <textarea
                  rows={4}
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl resize-none"
                />
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center gap-2 text-[11px] text-emerald-800">
                <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>An official PDF copy from <strong>Dezoryn Technology</strong> will be attached automatically.</span>
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
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs text-slate-500 font-medium">Loading AI Document Builder Studio...</p>
        </div>
      }
    >
      <UniversalAiDocumentBuilderContent />
    </Suspense>
  );
}
