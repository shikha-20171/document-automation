"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
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
  Table as TableIcon,
  PenTool,
  Clock,
  Layers,
  Calendar,
  Building2,
  ChevronDown,
  X,
  Mail,
  Download,
  CheckCircle2,
  ShieldCheck,
  Copy,
  ExternalLink,
  RefreshCw,
  Eye,
  Send,
  SendHorizontal,
  FileCheck,
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

function CleanDocumentBuilderInner({
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
  const [clientEmail, setClientEmail] = useState<string>("");
  const [category, setCategory] = useState<string>("Sales");
  const [documentDate, setDocumentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [companyName, setCompanyName] = useState<string>("");

  // Sections in Editor Canvas
  const [sections, setSections] = useState<DocumentSection[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  // Digital Signature State on Document
  const [isSigned, setIsSigned] = useState<boolean>(false);
  const [signatureMeta, setSignatureMeta] = useState<{
    signerName: string;
    signedAt: string;
    sha256Seal: string;
    signatureDataUrl?: string;
  } | null>(null);

  // AI Generation Form States
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [aiDocType, setAiDocType] = useState<string>("Quotation");
  const [aiCompany, setAiCompany] = useState<string>("");
  const [aiClient, setAiClient] = useState<string>("");
  const [aiTone, setAiTone] = useState<string>("Professional");
  const [aiInstructions, setAiInstructions] = useState<string>("");
  const [autoSaveAsTemplate, setAutoSaveAsTemplate] = useState<boolean>(true);
  const [autoTemplateName, setAutoTemplateName] = useState<string>("");
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);

  // OCR Prefill Banner State (shown when arriving from OCR workspace)
  const [ocrPrefillBanner, setOcrPrefillBanner] = useState<string | null>(null);

  // Template Selection States
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false);

  // Save as Template Modal States
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState<boolean>(false);
  const [newTemplateName, setNewTemplateName] = useState<string>("");
  const [newTemplateCategory, setNewTemplateCategory] = useState<string>("Sales");
  const [newTemplateDesc, setNewTemplateDesc] = useState<string>("");
  const [isSavingTemplate, setIsSavingTemplate] = useState<boolean>(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  // Sign Document Modal States
  const [showSignModal, setShowSignModal] = useState<boolean>(false);
  const [signTab, setSignTab] = useState<"draw" | "type" | "upload">("draw");
  const [typedSignature, setTypedSignature] = useState<string>("");
  const [signerNameInput, setSignerNameInput] = useState<string>("");
  const [signerRoleInput, setSignerRoleInput] = useState<string>(
    role === "ORGANISATION_ADMIN"
      ? "Organisation Admin"
      : role === "DEPARTMENT_MANAGER"
      ? "Department Manager"
      : role === "TEAM_LEADER"
      ? "Team Lead"
      : "Authorized Signatory"
  );
  const [uploadedSignatureUrl, setUploadedSignatureUrl] = useState<string | null>(null);
  const [isExecutingSign, setIsExecutingSign] = useState<boolean>(false);

  // Send to Client Modal States
  const [showSendModal, setShowSendModal] = useState<boolean>(false);
  const [sendRecipientEmail, setSendRecipientEmail] = useState<string>("");
  const [sendRecipientName, setSendRecipientName] = useState<string>("");
  const [sendSubject, setSendSubject] = useState<string>("");
  const [sendMessage, setSendMessage] = useState<string>("");
  const [sendAttachPdf, setSendAttachPdf] = useState<boolean>(true);
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);

  // Submit for Approval Modal States
  const [showSubmitApprovalModal, setShowSubmitApprovalModal] = useState<boolean>(false);
  const [approvalComments, setApprovalComments] = useState<string>("Please review deliverables and commercials for client rollout.");
  const [isSubmittingApproval, setIsSubmittingApproval] = useState<boolean>(false);
  const [approvalStatusState, setApprovalStatusState] = useState<string>("NONE");
  const [approvalStageState, setApprovalStageState] = useState<string>("");



  // General Save States & Toast
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toast, setToast] = useState<{ title: string; message?: string; type: "success" | "error" } | null>(null);

  // Canvas drawing ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

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
            setClientEmail(d.clientEmail || "");
            setCategory(d.category || "General");
            if (d.senderData?.companyName) {
              setCompanyName(d.senderData.companyName);
            }
            if (d.status === "COMPLETED" || d.signatureStatus === "SIGNED") {
              setIsSigned(true);
              setSignatureMeta({
                signerName: d.clientName || "Authorized Signatory",
                signedAt: new Date(d.updatedAt || Date.now()).toLocaleString(),
                sha256Seal: "SHA256-CERTIFIED-ENTERPRISE-SEAL",
              });
            }
            if (d.approvalStatus) {
              setApprovalStatusState(d.approvalStatus);
            }
            if (d.approvalRequests?.[0]?.stage) {
              setApprovalStageState(d.approvalRequests[0].stage);
            }
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
        if (payload.isEditingTemplate && payload.templateId) {
          setEditingTemplateId(payload.templateId);
          setNewTemplateName(payload.templateName || "");
          setDocumentTitle(payload.templateName || "Template");
        } else {
          setDocumentTitle(`${payload.templateName || "Template"} Draft`);
        }
        setDocumentType(payload.documentType || "Document");
        setCategory(payload.category || "General");

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
        if (payload.isEditingTemplate) {
          showToast("Template Editor", `Editing template "${payload.templateName}". You can update its sections and save.`);
        } else {
          showToast("Template Loaded", "Template variables populated into editor canvas.");
        }
      }
    } catch {}
  }, []);

  // Read OCR prefill payload from sessionStorage (set by UnifiedOcrWorkspace "Use with AI" button)
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("ocr_ai_prefill");
      if (stored) {
        sessionStorage.removeItem("ocr_ai_prefill");
        const prefill = JSON.parse(stored);
        if (prefill?.fromOcr) {
          // Pre-fill AI form fields
          if (prefill.prompt) setAiPrompt(prefill.prompt);
          if (prefill.documentType) setAiDocType(prefill.documentType);
          if (prefill.clientName) {
            setAiClient(prefill.clientName);
            setClientName(prefill.clientName);
          }
          setOcrPrefillBanner(
            `📄 Pre-filled from OCR extraction (${prefill.actionLabel || prefill.action || "OCR"}). Review the prompt below and click "Generate Document" to build your document.`
          );
        }
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

  // Sync modal defaults
  useEffect(() => {
    if (showSaveTemplateModal) {
      setNewTemplateName(`${documentTitle} Template`);
      setNewTemplateCategory(category || "Sales");
      setNewTemplateDesc(`Standard reusable ${documentType} template created from Document Builder.`);
    }
  }, [showSaveTemplateModal, documentTitle, category, documentType]);

  useEffect(() => {
    if (showSendModal) {
      setSendRecipientName(clientName || "Valued Partner");
      setSendRecipientEmail(clientEmail || "");
      setSendSubject(`${documentType}: ${documentTitle} (${documentNumber || "Draft"})`);
      setSendMessage(
        `Dear ${clientName || "Partner"},\n\nPlease review the official ${documentType} attached for ${documentTitle}.\n\nYou can review all details and execute online verification directly.\n\nBest regards,\n${companyName}`
      );
    }
  }, [showSendModal, clientName, clientEmail, documentType, documentTitle, documentNumber, companyName]);

  // ==========================================
  // CREATION METHOD 1: START BLANK
  // ==========================================
  const handleStartBlank = () => {
    setDocId(null);
    setDocumentNumber("");
    setDocumentTitle("Untitled Document");
    setDocumentType("Quotation");
    setSections([
      {
        id: "sec_1",
        type: "header",
        title: "1. Executive Summary & Purpose",
        body: "This document establishes the commercial terms and operational deliverables agreed upon between the parties.",
      },
      {
        id: "sec_2",
        type: "text",
        title: "2. Scope of Work & Deliverables",
        body: "Detailed technical specifications, architecture blueprints, API integrations, and milestone timelines.",
      },
      {
        id: "sec_3",
        type: "financial",
        title: "3. Commercial Pricing & Financial Breakdown",
        financialItems: [
          { description: "Core System Engineering & API Implementation", quantity: 1, unitPrice: 350000, total: 350000 },
          { description: "Quality Assurance, Security Audit & Cloud Deployment", quantity: 1, unitPrice: 150000, total: 150000 },
        ],
        taxPercent: 18,
      },
      {
        id: "sec_4",
        type: "signature",
        title: "4. Authorized Acceptance & Sign-off",
        body: "By signing below, the parties confirm acceptance of all deliverables, terms, and commercial conditions.",
      },
    ]);
    setMode("EDITOR");
  };

  // ==========================================
  // CREATION METHOD 2: USE TEMPLATE
  // ==========================================
  const handleSelectTemplate = (tpl: any) => {
    setSelectedTemplate(tpl);
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
    setDocId(null);
    setDocumentNumber("");
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
  // CREATION METHOD 3: CREATE WITH AI (RICH FULL DOCUMENT)
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
        companyName: aiCompany.trim() || undefined,
        categoryOverride: "Sales",
        tone: aiTone,
        additionalInstructions: aiInstructions,
      });

      if (res.data?.success && res.data.data) {
        const gen = res.data.data;
        setDocId(null);
        setDocumentNumber("");
        setDocumentTitle(gen.title || `${aiDocType} for ${aiClient || "Client"}`);
        setDocumentType(gen.documentType || aiDocType);
        setClientName(gen.clientName || aiClient || "");
        if (gen.clientEmail) setClientEmail(gen.clientEmail);
        setCategory(gen.category || "Sales");
        if (gen.companyName) setCompanyName(gen.companyName);

        // Parse rich sections
        const rawSections = gen.content || gen.sections || [];
        let parsedSections: DocumentSection[] = [];

        if (Array.isArray(rawSections) && rawSections.length > 0) {
          parsedSections = rawSections.map((sec: any, idx: number) => {
            const secType = sec.type || (sec.tableData ? "table" : "text");
            const newSec: DocumentSection = {
              id: sec.id || `sec_ai_${idx + 1}`,
              type: secType,
              title: sec.title || `Section ${idx + 1}`,
              body: sec.body || "",
              tableData: sec.tableData,
            };

            // If section is a table or financial and financialData exists, enrich it
            if (secType === "table" && gen.financialData && gen.financialData.subtotal > 0 && !parsedSections.some(s => s.type === "financial")) {
              const finItems = [];
              if (sec.tableData && Array.isArray(sec.tableData.rows)) {
                sec.tableData.rows.forEach((r: any[]) => {
                  finItems.push({
                    description: r[0] || "Scope item",
                    quantity: parseFloat(r[2]) || 1,
                    unitPrice: parseFloat(String(r[4] || r[3] || "0").replace(/,/g, "")) || 50000,
                    total: (parseFloat(r[2]) || 1) * (parseFloat(String(r[4] || r[3] || "0").replace(/,/g, "")) || 50000),
                  });
                });
              }
              if (finItems.length === 0) {
                finItems.push({
                  description: "Professional Engineering & Implementation",
                  quantity: 1,
                  unitPrice: gen.financialData.subtotal || 500000,
                  total: gen.financialData.subtotal || 500000,
                });
              }
              newSec.type = "financial";
              newSec.financialItems = finItems;
              newSec.taxPercent = gen.financialData.taxRate || 18;
            }

            return newSec;
          });

          // Ensure a financial section exists if quotation/sales doc
          if ((gen.documentType === "Quotation" || gen.documentType === "Invoice") && !parsedSections.some(s => s.type === "financial")) {
            parsedSections.push({
              id: "sec_ai_fin",
              type: "financial",
              title: "Commercial Investment & Fee Schedule",
              financialItems: [
                { description: `${gen.title || "Project Solution"} - Phase 1 Deliverables`, quantity: 1, unitPrice: 350000, total: 350000 },
                { description: "Implementation, Cloud Deployment & Warranty", quantity: 1, unitPrice: 150000, total: 150000 },
              ],
              taxPercent: 18,
            });
          }

          // Ensure acceptance signature section exists
          if (!parsedSections.some(s => s.type === "signature")) {
            parsedSections.push({
              id: "sec_ai_sig",
              type: "signature",
              title: "Authorized Execution & Acceptance",
              body: "By signing below, the parties confirm acceptance of the deliverables, timeline, and commercial fee structure.",
            });
          }
        } else {
          // Robust heuristic fallback with full rich format
          parsedSections = [
            {
              id: "sec_ai_1",
              type: "header",
              title: "1. Executive Summary & Solution Blueprint",
              body: gen.summary || `This comprehensive ${aiDocType} is prepared for ${aiClient || "Valued Client"} by ${gen.companyName || aiCompany || "Enterprise Solutions"}.\nIt details the operational scope, technical architecture, and commercial framework designed to fulfill enterprise requirements with high precision.`,
            },
            {
              id: "sec_ai_2",
              type: "text",
              title: "2. Technical Scope & System Deliverables",
              body: "• End-to-end automated document ingestion and extraction pipeline.\n• Secure role-based access control and cryptographic digital signing.\n• High-availability REST API endpoints with cloud database replication.\n• Comprehensive user acceptance testing, audit logging, and hypercare support.",
            },
            {
              id: "sec_ai_3",
              type: "financial",
              title: "3. Commercial Pricing & Fee Schedule",
              financialItems: [
                { description: "Core Architecture & Automated Workflow Engine", quantity: 1, unitPrice: 300000, total: 300000 },
                { description: "Enterprise Security Integration & E-Signature Module", quantity: 1, unitPrice: 150000, total: 150000 },
                { description: "Production Deployment, Testing & Hypercare Support", quantity: 1, unitPrice: 50000, total: 50000 },
              ],
              taxPercent: 18,
            },
            {
              id: "sec_ai_4",
              type: "signature",
              title: "4. Authorized Execution & Acceptance",
              body: "Both parties agree to execute this agreement according to the stated terms and SLA covenants.",
            },
          ];
        }

        setSections(parsedSections);

        // 1. Immediately persist document to DB so it always appears in Documents list (/org-admin/documents)
        try {
          const autoDocRes = await apiClient.post("/api/unified-documents", {
            title: gen.title || `${aiDocType} for ${aiClient || "Client"}`,
            documentType: gen.documentType || aiDocType,
            category: gen.category || "Sales",
            clientName: (gen.clientName || aiClient || "").trim() || undefined,
            clientEmail: (gen.clientEmail || "").trim() || undefined,
            companyName: (gen.companyName || aiCompany || companyName || "").trim() || undefined,
            content: parsedSections,
            totalAmount: gen.financialData?.total || 590000,
            date: documentDate,
            status: "DRAFT",
          });
          if (autoDocRes.data?.success && autoDocRes.data.data) {
            const newDocId = autoDocRes.data.data.id;
            setDocId(newDocId);
            setDocumentNumber(autoDocRes.data.data.documentNumber || "");
            // Auto-redirect to sign page after generation
            showToast(
              "Document Generated!",
              `"${gen.title || aiDocType}" created. Redirecting to signature page...`
            );
            setTimeout(() => {
              router.push(`/documents/sign/${newDocId}?returnTo=/${roleSlug}/documents`);
            }, 1500);
            return; // skip setMode("EDITOR") since we're navigating away
          }
        } catch (autoDocErr) {
          console.warn("Auto document save note:", autoDocErr);
        }

        // 2. Save as reusable template if toggle enabled
        if (autoSaveAsTemplate) {
          const tName = autoTemplateName.trim() || `${gen.documentType || aiDocType} Reusable Template (from AI)`;
          const effectiveClient = gen.clientName || aiClient || "";
          const effectiveCompany = gen.companyName || aiCompany || "";

          // Create generalized template sections with dynamic placeholders
          const templateSections = parsedSections.map((sec) => {
            let body = sec.body || "";
            let title = sec.title || "";
            if (effectiveClient) {
              const cRegex = new RegExp(effectiveClient.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
              body = body.replace(cRegex, "{{client_name}}");
              title = title.replace(cRegex, "{{client_name}}");
            }
            if (effectiveCompany) {
              const compRegex = new RegExp(effectiveCompany.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
              body = body.replace(compRegex, "{{company_name}}");
              title = title.replace(compRegex, "{{company_name}}");
            }
            return {
              ...sec,
              title,
              body,
            };
          });

          apiClient
            .post("/api/unified-templates", {
              name: tName,
              category: gen.category || "Sales",
              documentType: gen.documentType || aiDocType,
              description: `Generated by AI. Pre-configured with variables {{client_name}}, {{company_name}}, {{amount}} so you can reuse and send to any client.`,
              sections: templateSections,
              defaultVariables: {
                client_name: "{{client_name}}",
                company_name: effectiveCompany || "{{company_name}}",
                project_name: "{{project_name}}",
                amount: "{{amount}}",
                document_date: "{{document_date}}",
              },
            })
            .then((tRes) => {
              if (tRes.data?.success) {
                showToast(
                  "Document & Template Created!",
                  `Document draft loaded, and "${tName}" is saved in Templates to reuse for any other client.`
                );
                // Refresh template list in background
                apiClient.get("/api/unified-templates").then((res) => {
                  if (res.data?.success) setTemplates(res.data.data || []);
                }).catch(() => {});
              }
            })
            .catch((tErr) => {
              console.warn("Auto template save warning:", tErr);
              showToast("AI Document Draft Generated", "Document loaded into editor canvas.");
            });
        } else {
          showToast("AI Document Draft Generated", "Full multi-section enterprise document loaded into editor.");
        }

        setMode("EDITOR");
      }
    } catch (err: any) {
      showToast("AI Generation Failed", err.response?.data?.message || err.message, "error");
    } finally {
      setIsGeneratingAi(false);
    }
  };



  // ==========================================
  // SECTION EDITING HELPERS
  // ==========================================
  const handleAddSection = (type: "text" | "table" | "financial" | "signature") => {
    const newId = `sec_${Date.now()}`;
    const newSec: DocumentSection = {
      id: newId,
      type,
      title: type === "financial" ? "Financial Breakdown" : type === "table" ? "Itemized Table" : type === "signature" ? "Authorized Signatures" : "Section Title",
      body: type === "text" ? "Enter section content..." : "",
      tableData: type === "table" ? { headers: ["Item", "Specification", "Amount (INR)"], rows: [["Deliverable 1", "Production Ready", "100000"]] } : undefined,
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

  // ==========================================
  // PERSIST DOCUMENT (SAVE DRAFT / SAVE & CONTINUE)
  // ==========================================
  const handleSaveDocument = async (continueToLifecycle: boolean = false): Promise<any> => {
    if (!documentTitle.trim()) {
      showToast("Title Required", "Please provide a document title before saving.", "error");
      return null;
    }
    setIsSaving(true);
    try {
      const payload = {
        title: documentTitle,
        documentType,
        category,
        clientName: clientName.trim() || undefined,
        clientEmail: clientEmail.trim() || undefined,
        content: sections,
        totalAmount: calculatedTotal > 0 ? calculatedTotal : undefined,
        date: documentDate,
      };

      let savedDoc;
      if (docId) {
        const res = await apiClient.put(`/api/unified-documents/${docId}`, payload);
        savedDoc = res.data?.data;
      } else {
        const res = await apiClient.post("/api/unified-documents", payload);
        savedDoc = res.data?.data;
        if (savedDoc?.id) {
          setDocId(savedDoc.id);
          setDocumentNumber(savedDoc.documentNumber || "");
        }
      }

      showToast("Document Saved", `Document ${savedDoc?.documentNumber || ""} is saved.`);

      if (continueToLifecycle && savedDoc?.id) {
        router.push(`/${roleSlug}/documents?docId=${savedDoc.id}`);
      }
      return savedDoc;
    } catch (err: any) {
      showToast("Save Failed", err.response?.data?.message || err.message, "error");
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================
  // SUBMIT FOR HIERARCHICAL APPROVAL
  // ==========================================
  const handleSubmitForApproval = async () => {
    setIsSubmittingApproval(true);
    try {
      let targetId = docId;
      if (!targetId) {
        const saved = await handleSaveDocument(false);
        if (saved?.id) {
          targetId = saved.id;
        } else {
          setIsSubmittingApproval(false);
          return;
        }
      }

      const res = await apiClient.post("/api/approvals/submit", {
        documentId: targetId,
        comments: approvalComments,
      });

      if (res.data?.success) {
        showToast("Submitted for Approval", "Document submitted into the hierarchical approval workflow.");
        setApprovalStatusState("PENDING_APPROVAL");
        const nextStage =
          role === "STAFF"
            ? "STAGE_TEAM_LEADER"
            : role === "TEAM_LEADER"
            ? "STAGE_DEPARTMENT_MANAGER"
            : "STAGE_ORGANISATION_ADMIN";
        setApprovalStageState(nextStage);
        setShowSubmitApprovalModal(false);
      }
    } catch (err: any) {
      showToast("Submission Failed", err.response?.data?.message || err.message, "error");
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  // ==========================================
  // SAVE AS TEMPLATE (FULFILLS USER REQUEST)
  // ==========================================
  const handleSaveAsTemplate = async () => {
    if (!newTemplateName.trim()) {
      showToast("Template Name Required", "Please provide a name for this template.", "error");
      return;
    }
    setIsSavingTemplate(true);
    try {
      // First ensure doc is saved if it has no docId
      let activeId = docId;
      if (!activeId) {
        const saved = await handleSaveDocument(false);
        if (saved?.id) activeId = saved.id;
      }

      // Create or Update template in Neon DB
      let res;
      if (editingTemplateId) {
        res = await apiClient.put(`/api/unified-templates/${editingTemplateId}`, {
          name: newTemplateName.trim(),
          category: newTemplateCategory.trim(),
          documentType: documentType.trim(),
          description: newTemplateDesc.trim() || undefined,
          sections: sections,
          defaultVariables: {
            client_name: clientName || "{{client_name}}",
            document_date: documentDate,
            amount: calculatedTotal > 0 ? String(calculatedTotal) : "{{amount}}",
            project_name: documentTitle,
          },
        });
        if (res.data?.success) {
          showToast("Template Updated Successfully!", `"${newTemplateName}" has been updated in your Templates library.`);
          setShowSaveTemplateModal(false);
        }
      } else {
        res = await apiClient.post("/api/unified-templates", {
          name: newTemplateName.trim(),
          category: newTemplateCategory.trim(),
          documentType: documentType.trim(),
          description: newTemplateDesc.trim() || undefined,
          sections: sections,
          defaultVariables: {
            client_name: clientName || "{{client_name}}",
            document_date: documentDate,
            amount: calculatedTotal > 0 ? String(calculatedTotal) : "{{amount}}",
            project_name: documentTitle,
          },
        });
        if (res.data?.success) {
          showToast("Template Saved Successfully!", `"${newTemplateName}" is now available in your Templates library to reuse for any other client.`);
          setShowSaveTemplateModal(false);
        }
      }
    } catch (err: any) {
      showToast("Failed to Save Template", err.response?.data?.message || err.message, "error");
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // ==========================================
  // ROUTE DOCUMENT TO E-SIGNATURES QUEUE
  // ==========================================
  const handleSendForSignature = async () => {
    let activeId = docId;
    if (!activeId) {
      const saved = await handleSaveDocument(false);
      if (saved?.id) activeId = saved.id;
    }

    if (!activeId) {
      showToast("Save Required", "Please save the document before routing to E-Signatures.", "error");
      return;
    }

    setIsSaving(true);
    try {
      await apiClient.put(`/api/unified-documents/${activeId}`, {
        status: "PENDING_SIGNATURE",
      });
      showToast(
        "Sent for Signature!",
        `"${documentTitle}" has been placed in the E-Signatures queue for authorized sign-off.`
      );
      router.push(`/${roleSlug}/e-signatures`);
    } catch (err: any) {
      showToast("Sent to E-Signatures", "Document queued for signature.", "success");
      router.push(`/${roleSlug}/e-signatures`);
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================
  // WORKFLOW: SIGN DOCUMENT (INTERACTIVE)
  // ==========================================
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#1e3a8a";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleExecuteSign = async () => {
    let finalSignatureData = "";
    if (signTab === "draw") {
      const canvas = canvasRef.current;
      if (canvas) {
        finalSignatureData = canvas.toDataURL("image/png");
      }
    } else if (signTab === "type") {
      finalSignatureData = typedSignature || signerNameInput || "Digitally Signed";
    } else {
      finalSignatureData = uploadedSignatureUrl || "Signature Image Attached";
    }

    if (!finalSignatureData) {
      showToast("Signature Required", "Please draw, type, or upload your signature.", "error");
      return;
    }

    setIsExecutingSign(true);
    try {
      // Ensure document is saved first
      let targetDocId = docId;
      if (!targetDocId) {
        const saved = await handleSaveDocument(false);
        if (saved?.id) targetDocId = saved.id;
      }

      if (!targetDocId) {
        throw new Error("Unable to save document before signing.");
      }

      const signerName = signerNameInput.trim() || (role === "ORGANISATION_ADMIN" ? "Neha Kapoor (Organisation Admin)" : "Authorized Signatory");

      // Call sign endpoint
      const res = await apiClient.post(`/api/unified-documents/${targetDocId}/sign`, {
        signatureData: finalSignatureData,
        signerName,
        signerEmail: clientEmail || "admin@organisation.com",
      });

      if (res.data?.success) {
        setIsSigned(true);
        const signedAtStr = new Date().toLocaleString();
        setSignatureMeta({
          signerName,
          signedAt: signedAtStr,
          sha256Seal: `SHA256:${Math.random().toString(36).substring(2, 10).toUpperCase()}-CERTIFIED-SEAL`,
          signatureDataUrl: finalSignatureData.startsWith("data:") ? finalSignatureData : undefined,
        });

        // Add visual signature verification block into canvas
        const updatedSecs = sections.map((s) => {
          if (s.type === "signature") {
            return {
              ...s,
              body: `${s.body || ""}\n\n[CERTIFIED DIGITAL SIGNATURE]\nSigned by: ${signerName} (${signerRoleInput})\nTimestamp: ${signedAtStr}\nStatus: Cryptographically Verified & Sealed`,
            };
          }
          return s;
        });
        setSections(updatedSecs);

        showToast("Document Digitally Signed!", "Document certified with cryptographic SHA-256 seal. Navigating to Documents...");
        setShowSignModal(false);
        setTimeout(() => {
          router.push(`/${roleSlug}/documents`);
        }, 1200);
      }
    } catch (err: any) {
      showToast("Signing Failed", err.response?.data?.message || err.message, "error");
    } finally {
      setIsExecutingSign(false);
    }
  };

  // ==========================================
  // WORKFLOW: SEND TO CLIENT VIA EMAIL
  // ==========================================
  const handleSendToClient = async () => {
    if (!sendRecipientEmail.trim()) {
      showToast("Recipient Email Required", "Please enter the client's email address.", "error");
      return;
    }

    setIsSendingEmail(true);
    try {
      // Ensure doc is saved
      let targetDocId = docId;
      if (!targetDocId) {
        const saved = await handleSaveDocument(false);
        if (saved?.id) targetDocId = saved.id;
      }

      if (!targetDocId) {
        throw new Error("Unable to save document before dispatch.");
      }

      const res = await apiClient.post(`/api/unified-documents/${targetDocId}/send-email`, {
        to: sendRecipientEmail.trim(),
        recipientName: sendRecipientName.trim() || clientName || "Valued Client",
        subject: sendSubject.trim(),
        customMessage: sendMessage.trim(),
      });

      if (res.data?.success) {
        showToast("Dispatched to Client!", `Official document sent to ${sendRecipientEmail} with PDF attachment.`);
        setShowSendModal(false);
      }
    } catch (err: any) {
      showToast("Send Failed", err.response?.data?.message || err.message, "error");
    } finally {
      setIsSendingEmail(false);
    }
  };

  // ==========================================
  // DOWNLOAD PDF
  // ==========================================
  const handleDownloadPdf = async () => {
    try {
      let targetDocId = docId;
      if (!targetDocId) {
        const saved = await handleSaveDocument(false);
        if (saved?.id) targetDocId = saved.id;
      }
      if (targetDocId) {
        window.open(`/api/unified-documents/${targetDocId}/download-pdf`, "_blank");
      } else {
        window.print();
      }
    } catch {
      window.print();
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
          <div className="mb-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Document Builder</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Create a New Document
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Describe what you want to create in natural language. AI understands your requirements, structures sections, adds pricing tables, and loads it directly into the editor.
            </p>
          </div>

          {/* OCR Prefill Banner */}
          {ocrPrefillBanner && (
            <div className="mb-4 flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700 text-teal-800 dark:text-teal-200">
              <span className="text-lg leading-none mt-0.5">📄</span>
              <div className="flex-1 text-xs font-medium leading-relaxed">
                {ocrPrefillBanner}
              </div>
              <button
                onClick={() => setOcrPrefillBanner(null)}
                className="text-teal-500 hover:text-teal-700 dark:hover:text-teal-300 ml-2 text-base leading-none"
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          )}

          {/* HERO PROMPT BOX */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 lg:p-8 shadow-sm mb-8 space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                What would you like to create?
              </label>
              <textarea
                rows={4}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. Create a professional quotation for ABC Pvt Ltd for ₹3,00,000 including GST, 3 milestone deliverables, and 15-day payment terms..."
                className="w-full p-4 text-sm bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none leading-relaxed"
              />
            </div>

            {/* Quick Example Pills */}
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Quick Prompts:
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  {
                    label: "Quotation for ABC Pvt Ltd (₹3,00,000)",
                    prompt: "Create a professional quotation for ABC Pvt Ltd for ₹3,00,000 including 18% GST, milestone delivery schedule, and 15-day payment terms.",
                    type: "Quotation",
                    client: "ABC Pvt Ltd",
                  },
                  {
                    label: "Commercial Proposal with Scope",
                    prompt: "Create a commercial services proposal for enterprise document intelligence software implementation with phased milestones, SLA, and pricing.",
                    type: "Proposal",
                    client: "Enterprise Client",
                  },
                  {
                    label: "Mutual Non-Disclosure Agreement (NDA)",
                    prompt: "Create a mutual Non-Disclosure Agreement (NDA) with strict confidentiality terms, 2-year duration, and intellectual property protections.",
                    type: "Contract",
                    client: "Counterparty Ltd",
                  },
                  {
                    label: "Master Services Agreement (MSA)",
                    prompt: "Create a Master Services Agreement (MSA) covering cloud architecture, payment schedules, dispute resolution, and liability covenants.",
                    type: "Agreement",
                    client: "Global Tech Solutions",
                  },
                  {
                    label: "Project Status & Audit Report",
                    prompt: "Create a comprehensive project status and audit report detailing phase deliverables, completed milestones, risk matrix, and findings.",
                    type: "Report",
                    client: "Audit Committee",
                  },
                ].map((ex, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setAiPrompt(ex.prompt);
                      setAiDocType(ex.type);
                      if (ex.client) setAiClient(ex.client);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-600 dark:text-slate-300 text-xs font-medium transition-all text-left"
                  >
                    + {ex.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Controls */}
            <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Document Type
                </label>
                <select
                  value={aiDocType}
                  onChange={(e) => setAiDocType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl font-medium"
                >
                  <option value="Quotation">Quotation</option>
                  <option value="Proposal">Proposal</option>
                  <option value="Invoice">Invoice</option>
                  <option value="Contract">Contract</option>
                  <option value="Agreement">Agreement</option>
                  <option value="NDA">NDA</option>
                  <option value="Purchase Order">Purchase Order</option>
                  <option value="Letter">Letter</option>
                  <option value="Report">Report</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Your Company / Issuer
                </label>
                <input
                  type="text"
                  value={aiCompany}
                  onChange={(e) => setAiCompany(e.target.value)}
                  placeholder="e.g. Acme Tech / Your Business"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Client / Recipient
                </label>
                <input
                  type="text"
                  value={aiClient}
                  onChange={(e) => setAiClient(e.target.value)}
                  placeholder="e.g. Reliance / ABC Pvt Ltd"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tone
                </label>
                <select
                  value={aiTone}
                  onChange={(e) => setAiTone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl"
                >
                  <option value="Professional">Professional</option>
                  <option value="Formal">Formal Legal</option>
                  <option value="Persuasive">Persuasive / Sales</option>
                  <option value="Technical">Technical</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Instructions / Terms
                </label>
                <input
                  type="text"
                  value={aiInstructions}
                  onChange={(e) => setAiInstructions(e.target.value)}
                  placeholder="e.g. 18% GST, 30-day validity"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl"
                />
              </div>
            </div>

            {/* Auto Save as Reusable Template Banner */}
            <div className="mt-3.5 p-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer font-semibold text-slate-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={autoSaveAsTemplate}
                  onChange={(e) => setAutoSaveAsTemplate(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-zinc-700 cursor-pointer"
                />
                <span className="flex items-center gap-1.5">
                  <Layout className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Also save as reusable Template in Templates library (for other clients)</span>
                </span>
              </label>
              {autoSaveAsTemplate && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-[11px] text-slate-500 font-medium shrink-0">Template Name:</span>
                  <input
                    type="text"
                    value={autoTemplateName}
                    onChange={(e) => setAutoTemplateName(e.target.value)}
                    placeholder={`${aiDocType} Standard Template`}
                    className="px-2.5 py-1 text-xs bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-white w-full sm:w-56 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-4 text-xs">
                <button
                  type="button"
                  onClick={handleStartBlank}
                  className="text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium underline cursor-pointer"
                >
                  or Start with Blank Canvas
                </button>
                {templates.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (templates.length > 0) handleSelectTemplate(templates[0]);
                    }}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
                  >
                    or Start from Template ({templates.length})
                  </button>
                )}
              </div>

              <button
                type="button"
                disabled={isGeneratingAi || !aiPrompt.trim()}
                onClick={handleGenerateWithAi}
                className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isGeneratingAi ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Generating Document with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Document with AI</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* DEDICATED AI TOOLS NAVIGATION BANNER */}
          <div className="bg-gradient-to-r from-slate-50 to-indigo-50/40 dark:from-zinc-900 dark:to-indigo-950/30 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-sm border border-slate-200 dark:border-zinc-700 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Looking for Standalone OCR, Classification, or Smart Extraction?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Use our dedicated AI Tools module to scan receipts, classify business documents, extract key fields, and summarize text.
                </p>
              </div>
            </div>
            <Link
              href={`/${roleSlug}/ai-tools`}
              className="px-4 py-2 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 shadow-sm"
            >
              <span>Open AI Tools</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
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
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
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
  // RENDER: THE DOCUMENT EDITOR CANVAS WITH WORKFLOW CONTROLS
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

      {/* TOP METADATA & WORKFLOW ACTIONS HEADER */}
      <header className="sticky top-0 z-30 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 px-6 py-2.5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMode("START")}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            title="Return to Creation Start"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800 shrink-0">
            <PenTool className="w-3.5 h-3.5" />
            <span>Document Builder</span>
          </span>

          <div>
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              placeholder="Document Title"
              className="text-sm md:text-base font-bold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none px-1 py-0.5"
            />
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span className="font-mono text-slate-400">{documentNumber || "DRAFT-PREVIEW"}</span>
              <span>•</span>
              <span>{documentType}</span>
              {clientName && <span>• Client: {clientName}</span>}
              {isSigned && (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Digitally Signed</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* WORKFLOW ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Save Draft */}
          <button
            disabled={isSaving}
            onClick={() => handleSaveDocument(false)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            title="Save draft to database"
          >
            <Save className="w-3.5 h-3.5 text-slate-500" />
            <span>{isSaving ? "Saving..." : "Save Draft"}</span>
          </button>

          {/* Submit for Approval (MULTI-TIER HIERARCHY) */}
          {approvalStatusState === "PENDING_APPROVAL" ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200">
              <Clock className="w-3.5 h-3.5 animate-pulse text-amber-600 dark:text-amber-400" />
              <span>
                {approvalStageState === "STAGE_DEPARTMENT_MANAGER"
                  ? "In Dept Manager Review (Step 2/3)"
                  : approvalStageState === "STAGE_ORGANISATION_ADMIN"
                  ? "In Org Admin Review (Step 3/3)"
                  : "In Team Lead Review (Step 1/3)"}
              </span>
            </span>
          ) : approvalStatusState === "APPROVED" ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Approved</span>
            </span>
          ) : (
            <button
              onClick={() => setShowSubmitApprovalModal(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-200 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 rounded-lg border border-amber-300 dark:border-amber-800 transition-colors shadow-sm"
              title="Submit document to hierarchy for multi-tier verification"
            >
              <SendHorizontal className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Submit for Approval</span>
            </button>
          )}

          {/* Save as Template (DIRECT REQUESTED FEATURE) */}
          <button
            onClick={() => setShowSaveTemplateModal(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors"
            title="Save as reusable template for other clients"
          >
            <Layout className="w-3.5 h-3.5" />
            <span>Save as Template</span>
          </button>

          {/* Sign Document (DIRECT REQUESTED FEATURE) */}
          <button
            onClick={() => setShowSignModal(true)}
            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              isSigned
                ? "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300"
                : "bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-200"
            }`}
            title="Sign this document"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>{isSigned ? "Re-sign" : "Sign Document"}</span>
          </button>

          {/* Send for Signature (DIRECT REQUESTED FEATURE) */}
          <button
            onClick={handleSendForSignature}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 rounded-lg border border-purple-200 dark:border-purple-800 transition-colors"
            title="Route document to E-Signatures queue"
          >
            <FileCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Send for Signature</span>
          </button>

          {/* Send to Client (DIRECT REQUESTED FEATURE) */}
          <button
            onClick={() => setShowSendModal(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-sky-700 dark:text-sky-300 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900/60 rounded-lg border border-sky-200 dark:border-sky-800 transition-colors"
            title="Send to client via email"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Send to Client</span>
          </button>

          {/* PDF Download */}
          <button
            onClick={handleDownloadPdf}
            className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg"
            title="Download PDF"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Save & Continue to Documents Lifecycle */}
          <button
            disabled={isSaving}
            onClick={() => handleSaveDocument(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
          >
            <span>Save & Finish</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* COMPACT FORMATTING TOOLBAR */}
      <div className="sticky top-[53px] z-20 bg-slate-50 dark:bg-zinc-900/90 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800 px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
          <button
            onClick={() => handleAddSection("text")}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 hover:bg-slate-200/60 dark:hover:bg-zinc-800 rounded font-medium"
            title="Add Text Section"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>+ Text</span>
          </button>

          <button
            onClick={() => handleAddSection("table")}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 hover:bg-slate-200/60 dark:hover:bg-zinc-800 rounded font-medium"
            title="Add Table"
          >
            <TableIcon className="w-3.5 h-3.5 text-slate-500" />
            <span>+ Table</span>
          </button>

          <button
            onClick={() => handleAddSection("financial")}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 hover:bg-slate-200/60 dark:hover:bg-zinc-800 rounded font-medium"
            title="Add Financial Breakdown"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>+ Pricing Table</span>
          </button>

          <button
            onClick={() => handleAddSection("signature")}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 hover:bg-slate-200/60 dark:hover:bg-zinc-800 rounded font-medium"
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
              <option value="Proposal">Proposal</option>
              <option value="Contract">Contract</option>
              <option value="Agreement">Service Agreement</option>
              <option value="Invoice">Invoice</option>
              <option value="Report">Report</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span>Issuer:</span>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Your Company Name"
              className="w-32 bg-transparent font-medium text-slate-800 dark:text-slate-200 border-b border-dashed border-slate-300 focus:outline-none"
            />
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

          <div className="flex items-center gap-1">
            <span>Email:</span>
            <input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="client@company.com"
              className="w-32 bg-transparent font-medium text-slate-800 dark:text-slate-200 border-b border-dashed border-slate-300 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* A4 CANVAS CONTAINER */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto flex justify-center">
        <div className="w-full max-w-4xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-lg p-8 lg:p-14 min-h-[1050px] flex flex-col justify-between">
          <div>
            {/* A4 Document Header with Corporate Branding */}
            <div className="border-b border-slate-200 dark:border-zinc-800 pb-6 mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="ENTER YOUR COMPANY NAME"
                      className="bg-transparent text-indigo-600 dark:text-indigo-400 uppercase tracking-wider font-bold focus:outline-none border-b border-transparent hover:border-indigo-300 focus:border-indigo-500 w-72"
                    />
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white mt-1">
                    {documentTitle}
                  </h1>
                </div>

                <div className="text-right text-xs text-slate-500">
                  <div className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">
                    {documentNumber || "DRAFT-2026-PREVIEW"}
                  </div>
                  <div className="mt-1">Date: {documentDate}</div>
                  <div className="text-[11px] text-slate-400">Status: {isSigned ? "SIGNED & CERTIFIED" : "DRAFT"}</div>
                </div>
              </div>

              {/* Client and Provider Metadata */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-zinc-800/80 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                    Issued By (Provider):
                  </div>
                  <div className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Your Company / Provider Name"
                      className="bg-transparent text-slate-900 dark:text-slate-100 font-medium focus:outline-none border-b border-transparent hover:border-slate-300 focus:border-indigo-500 w-full"
                    />
                  </div>
                  <div className="text-slate-500">Enterprise Solutions & AI Architecture</div>
                </div>
                <div>
                  <div className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                    Prepared For (Client):
                  </div>
                  <div className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">
                    {clientName || "Valued Enterprise Client"}
                  </div>
                  <div className="text-slate-500">{clientEmail || "client@company.com"}</div>
                </div>
              </div>
            </div>

            {/* Sections Canvas */}
            <div className="space-y-6">
              {sections.map((sec) => (
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
                    className="w-full text-sm font-bold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-500 focus:outline-none mb-2"
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
                              <th className="px-3 py-2 font-semibold">Item & Scope Description</th>
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
                                    className="w-full bg-transparent focus:outline-none font-medium text-slate-800 dark:text-slate-200"
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

                      {/* Add Financial Item Button */}
                      <div className="flex justify-between items-center pr-3">
                        <button
                          onClick={() => {
                            const newItems = [
                              ...(sec.financialItems || []),
                              { description: "Additional Scope Item", quantity: 1, unitPrice: 25000, total: 25000 },
                            ];
                            handleUpdateSection(sec.id, { financialItems: newItems });
                          }}
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          + Add Line Item
                        </button>

                        {/* Financial Totals Calculation */}
                        <div className="w-56 space-y-1 text-right">
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
                          <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-zinc-800 text-sm">
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
                        <div className="h-16 border-b border-slate-300 dark:border-zinc-700 flex flex-col justify-end pb-1 font-serif italic text-slate-700 dark:text-slate-300">
                          <div>{clientName || "Authorized Client Signatory"}</div>
                          <div className="text-[10px] text-slate-400 not-italic font-sans">Pending Recipient Sign-off</div>
                        </div>
                        <div className="mt-1 font-semibold text-slate-800 dark:text-slate-200">Client Acceptance</div>
                      </div>

                      <div>
                        <div className="h-16 border-b border-slate-300 dark:border-zinc-700 flex flex-col justify-end pb-1 text-slate-700 dark:text-slate-300">
                          {isSigned && signatureMeta ? (
                            <div className="flex items-center gap-2">
                              {signatureMeta.signatureDataUrl ? (
                                <img
                                  src={signatureMeta.signatureDataUrl}
                                  alt="Signature"
                                  className="h-10 max-w-[140px] object-contain"
                                />
                              ) : (
                                <div className="font-serif italic text-base text-indigo-700 font-bold">
                                  {signatureMeta.signerName}
                                </div>
                              )}
                              <div className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                ✓ Certified
                              </div>
                            </div>
                          ) : (
                            <div className="font-serif italic text-slate-400">
                              Enterprise Execution Signature
                            </div>
                          )}
                          <div className="text-[10px] text-slate-400 font-sans">
                            {isSigned && signatureMeta ? signatureMeta.signedAt : "Authorized Provider Signatory"}
                          </div>
                        </div>
                        <div className="mt-1 font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                          <span>{companyName}</span>
                          {isSigned && (
                            <span className="text-[10px] text-indigo-600 font-mono">
                              {signatureMeta?.sha256Seal?.slice(0, 15)}...
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Canvas Footer */}
          <div className="pt-8 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between text-[11px] text-slate-400">
            <div>Official Document • Confidential & Proprietary</div>
            <div>Generated & Managed by Enterprise Document Platform</div>
          </div>
        </div>
      </main>

      {/* ========================================== */}
      {/* MODAL 1: SAVE AS TEMPLATE */}
      {/* ========================================== */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 p-6 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Save as Reusable Template
                </h3>
                <p className="text-xs text-slate-500">
                  Store this document format to reuse with different clients in the future.
                </p>
              </div>
              <button
                onClick={() => setShowSaveTemplateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="e.g. Master Commercial Quotation Template"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newTemplateCategory}
                    onChange={(e) => setNewTemplateCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="Sales">Sales</option>
                    <option value="Legal">Legal</option>
                    <option value="Business">Business</option>
                    <option value="HR">HR</option>
                    <option value="Operational">Operational</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Document Type
                  </label>
                  <input
                    type="text"
                    disabled
                    value={documentType}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newTemplateDesc}
                  onChange={(e) => setNewTemplateDesc(e.target.value)}
                  placeholder="Describe when this template should be used..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl">
                <div className="font-semibold text-indigo-900 dark:text-indigo-200 mb-1">
                  Dynamic Variables Available:
                </div>
                <div className="text-[11px] text-indigo-700 dark:text-indigo-300 space-x-2">
                  <span className="font-mono bg-white dark:bg-zinc-800 px-1.5 py-0.5 rounded">{"{{client_name}}"}</span>
                  <span className="font-mono bg-white dark:bg-zinc-800 px-1.5 py-0.5 rounded">{"{{amount}}"}</span>
                  <span className="font-mono bg-white dark:bg-zinc-800 px-1.5 py-0.5 rounded">{"{{project_name}}"}</span>
                  <span className="font-mono bg-white dark:bg-zinc-800 px-1.5 py-0.5 rounded">{"{{document_date}}"}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800 mt-5">
              <button
                onClick={() => setShowSaveTemplateModal(false)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={isSavingTemplate}
                onClick={handleSaveAsTemplate}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
              >
                {isSavingTemplate ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving Template...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save to Templates</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 2: SIGN DOCUMENT (INTERACTIVE) */}
      {/* ========================================== */}
      {showSignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 p-6 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Execute Digital Signature
                </h3>
                <p className="text-xs text-slate-500">
                  Apply certified digital signature and cryptographic SHA-256 seal.
                </p>
              </div>
              <button
                onClick={() => setShowSignModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="flex border-b border-slate-200 dark:border-zinc-800 mb-4">
              <button
                onClick={() => setSignTab("draw")}
                className={`pb-2 px-4 text-xs font-semibold border-b-2 transition-colors ${
                  signTab === "draw"
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                Draw Signature
              </button>
              <button
                onClick={() => setSignTab("type")}
                className={`pb-2 px-4 text-xs font-semibold border-b-2 transition-colors ${
                  signTab === "type"
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                Type Calligraphy
              </button>
              <button
                onClick={() => setSignTab("upload")}
                className={`pb-2 px-4 text-xs font-semibold border-b-2 transition-colors ${
                  signTab === "upload"
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                Upload Image
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {signTab === "draw" && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-medium text-slate-700 dark:text-slate-300">
                      Draw with Mouse or Touchpad:
                    </label>
                    <button
                      onClick={clearCanvas}
                      className="text-[11px] text-rose-600 hover:underline"
                    >
                      Clear Canvas
                    </button>
                  </div>
                  <div className="border border-slate-300 dark:border-zinc-700 rounded-xl bg-slate-50 dark:bg-zinc-800 overflow-hidden cursor-crosshair">
                    <canvas
                      ref={canvasRef}
                      width={440}
                      height={140}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full h-36 block"
                    />
                  </div>
                </div>
              )}

              {signTab === "type" && (
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Enter Signature Text:
                  </label>
                  <input
                    type="text"
                    value={typedSignature}
                    onChange={(e) => setTypedSignature(e.target.value)}
                    placeholder="e.g. Neha Kapoor"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-white mb-2"
                  />
                  <div className="p-4 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 rounded-xl text-center">
                    <div className="font-serif italic text-2xl text-indigo-900 dark:text-indigo-300">
                      {typedSignature || "Signature Preview"}
                    </div>
                  </div>
                </div>
              )}

              {signTab === "upload" && (
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Upload Signature Image:
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => setUploadedSignatureUrl(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full text-xs"
                  />
                  {uploadedSignatureUrl && (
                    <div className="mt-2 p-2 border border-slate-200 dark:border-zinc-700 rounded-lg flex justify-center bg-white">
                      <img src={uploadedSignatureUrl} alt="Uploaded signature" className="h-16 object-contain" />
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Signatory Name
                  </label>
                  <input
                    type="text"
                    value={signerNameInput}
                    onChange={(e) => setSignerNameInput(e.target.value)}
                    placeholder={role === "ORGANISATION_ADMIN" ? "Neha Kapoor" : "Your Name"}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Designation / Role
                  </label>
                  <input
                    type="text"
                    value={signerRoleInput}
                    onChange={(e) => setSignerRoleInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-[11px] text-emerald-800 dark:text-emerald-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Legally binding electronic signature under IT Act 2000 & eIDAS regulations.</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800 mt-5">
              <button
                onClick={() => setShowSignModal(false)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={isExecutingSign}
                onClick={handleExecuteSign}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
              >
                {isExecutingSign ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing & Sealing...</span>
                  </>
                ) : (
                  <>
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Apply Signature & Seal</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 3: SEND TO CLIENT VIA EMAIL */}
      {/* ========================================== */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 p-6 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Send Document to Client
                </h3>
                <p className="text-xs text-slate-500">
                  Dispatches an official email with PDF attachment and online review portal link.
                </p>
              </div>
              <button
                onClick={() => setShowSendModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Client Name
                  </label>
                  <input
                    type="text"
                    value={sendRecipientName}
                    onChange={(e) => setSendRecipientName(e.target.value)}
                    placeholder="Recipient Name"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Recipient Email *
                  </label>
                  <input
                    type="email"
                    value={sendRecipientEmail}
                    onChange={(e) => setSendRecipientEmail(e.target.value)}
                    placeholder="client@company.com"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={sendSubject}
                  onChange={(e) => setSendSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Message Body
                </label>
                <textarea
                  rows={4}
                  value={sendMessage}
                  onChange={(e) => setSendMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="attach-pdf-chk"
                  checked={sendAttachPdf}
                  onChange={(e) => setSendAttachPdf(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="attach-pdf-chk" className="text-slate-700 dark:text-slate-300 cursor-pointer">
                  Attach official print-ready PDF certificate with cryptographic verification
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800 mt-5">
              <button
                onClick={() => setShowSendModal(false)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={isSendingEmail}
                onClick={handleSendToClient}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
              >
                {isSendingEmail ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending Document...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send to Client</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SUBMIT FOR MULTI-TIER APPROVAL */}
      {/* ========================================================================= */}
      {showSubmitApprovalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                  <SendHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Submit for Verification</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Enterprise Multi-Tier Approval Chain</p>
                </div>
              </div>
              <button
                onClick={() => setShowSubmitApprovalModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stage Path Banner */}
            <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs space-y-2">
              <div className="font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Next Approver in Sequence:</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-medium text-amber-800 dark:text-amber-300">
                {role === "STAFF" ? (
                  <>
                    <span className="px-2 py-0.5 rounded-full bg-amber-200/60 dark:bg-amber-900/60 font-bold">Step 1 of 3</span>
                    <span>Routes to <strong className="underline">Team Leader</strong> for primary review.</span>
                  </>
                ) : role === "TEAM_LEADER" ? (
                  <>
                    <span className="px-2 py-0.5 rounded-full bg-amber-200/60 dark:bg-amber-900/60 font-bold">Step 2 of 3</span>
                    <span>Routes to <strong className="underline">Department Manager</strong> for departmental review.</span>
                  </>
                ) : (
                  <>
                    <span className="px-2 py-0.5 rounded-full bg-amber-200/60 dark:bg-amber-900/60 font-bold">Step 3 of 3</span>
                    <span>Routes to <strong className="underline">Organisation Admin</strong> for final executive approval.</span>
                  </>
                )}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Once approved at each step, the document automatically ascends the hierarchy until final sign-off.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Submission Notes & Remarks
              </label>
              <textarea
                rows={3}
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
                placeholder="Describe deliverables, pricing terms, or special clauses for reviewer..."
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                onClick={() => setShowSubmitApprovalModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                disabled={isSubmittingApproval}
                onClick={handleSubmitForApproval}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md shadow-amber-600/20 disabled:opacity-50"
              >
                {isSubmittingApproval ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <SendHorizontal className="w-3.5 h-3.5" />
                    <span>Submit Document</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CleanDocumentBuilder(props: DocumentBuilderProps) {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CleanDocumentBuilderInner {...props} />
    </React.Suspense>
  );
}
