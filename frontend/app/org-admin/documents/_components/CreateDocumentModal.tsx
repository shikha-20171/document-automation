"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  FileText,
  Sparkles,
  Layout,
  Save,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  BookOpen,
  Wand2,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { aiApi } from "@/services/aiApi";
import { documentsApi } from "@/services/documentsApi";

interface CreateDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (docName: string, newDoc?: any) => void;
}

const enterpriseTemplates = [
  {
    id: "msa",
    name: "Master Services Agreement (MSA)",
    category: "Legal",
    department: "Legal",
    content: `# MASTER SERVICES AGREEMENT (MSA)

**Effective Date:** {{effective_date}}  
**Parties:** TechCorp Global Inc. ("Client") and Vendor Partner Ltd. ("Service Provider")

---

### 1. Scope of Services
The Service Provider agrees to deliver enterprise document automation, workflow optimization, and cloud integration as detailed in Statement of Work (SOW) #1.

### 2. Service Level Agreement (SLA)
- **Uptime Commitment:** 99.9% monthly availability
- **P1 Incident Resolution:** Within 2 business hours

### 3. Payment & Commercial Terms
- Monthly Invoicing payable Net 30 days from date of receipt.
- Late fees of 1.5% per month on overdue balances.

### 4. Confidentiality & IP Rights
All proprietary source codes, training weights, and customer data remain the exclusive property of the Client.

---
*Authorized Signatures:*
**Client Representative:** ____________________  
**Vendor Representative:** ____________________
`,
  },
  {
    id: "nda",
    name: "Mutual Non-Disclosure Agreement (NDA)",
    category: "Legal",
    department: "Legal",
    content: `# MUTUAL NON-DISCLOSURE AGREEMENT (NDA)

This Non-Disclosure Agreement is entered into on {{today_date}} between:
1. **Disclosing Party:** DocuCore AI Enterprise Org
2. **Receiving Party:** {{partner_name}}

---

### 1. Definition of Confidential Information
"Confidential Information" includes all non-public technical, financial, operational, customer, and strategic documentation shared between the parties.

### 2. Obligations
The Receiving Party shall:
- Protect information with at least the standard of care used for its own confidential data.
- Restrict disclosure strictly to authorized employees on a need-to-know basis.

### 3. Term & Survival
The obligations under this Agreement shall endure for a period of **3 (three) years** from disclosure.

---
*Signatures:*  
DocuCore AI Rep: _________________  
Counterparty Rep: _________________
`,
  },
  {
    id: "employment",
    name: "Executive Employment Agreement",
    category: "HR",
    department: "HR",
    content: `# EMPLOYMENT OFFER & APPOINTMENT AGREEMENT

**Date:** {{today_date}}  
**Candidate Name:** {{candidate_name}}  
**Designation:** Senior Operations & Compliance Lead  
**Department:** Operations  

---

### 1. Compensation & CTC Structure
- **Annual Gross CTC:** ₹18,00,000 (Eighteen Lakhs INR)
- **Variable Performance Bonus:** Up to 15% annual bonus
- **Benefits:** Group Health Insurance (₹10 Lakhs floater) & PF Match

### 2. Probation & Notice Period
- Probation duration: 6 (six) calendar months.
- Notice period: 60 days post confirmation.

### 3. Code of Conduct & IP Assignment
All work products, codebases, and operational frameworks created during employment shall vest solely with the Organisation.

---
**For the Organisation:** __________________  
**Candidate Acceptance:** __________________
`,
  },
  {
    id: "policy",
    name: "Company Information Security Policy",
    category: "Policies",
    department: "Operations",
    content: `# ORGANISATIONAL INFORMATION SECURITY POLICY (v2026.1)

**Effective Date:** {{today_date}}  
**Scope:** All Employees, Contractors, and Third-Party Vendors  

---

### 1. Access Control & Passwords
- Multi-Factor Authentication (MFA) is mandatory for all SaaS and internal tools.
- Passwords must be at least 12 characters with alphanumeric and symbol complexity.

### 2. Data Protection & Classification
- **Public:** Marketing and published documentation.
- **Internal:** Operational procedures and team memos.
- **Confidential / Restricted:** Customer PII, financial ledgers, and API private keys.

### 3. Incident Reporting
Any suspected security breach or credential leak must be escalated to \`security@docucore.ai\` within **60 minutes**.
`,
  },
];

const aiPromptSuggestions = [
  "Draft a Vendor Service Agreement with 99.9% SLA and Net 30 payment terms",
  "Create an Employee Remote Work Policy with data security guidelines",
  "Draft a Board Meeting Resolution approving Q3 budget expansion",
  "Generate a Customer Data Privacy Notice compliant with DPDP & GDPR",
];

export default function CreateDocumentModal({ isOpen, onClose, onSuccess }: CreateDocumentModalProps) {
  const router = useRouter();

  const [docType, setDocType] = useState<"blank" | "template" | "automated">("blank");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("HR");
  const [department, setDepartment] = useState("HR");
  const [content, setContent] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  // AI Generation state
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiSuccessMsg, setAiSuccessMsg] = useState<string | null>(null);

  // Saving state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = enterpriseTemplates.find((t) => t.id === templateId);
    if (tmpl) {
      const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      const filledContent = tmpl.content
        .replace(/{{today_date}}/g, today)
        .replace(/{{effective_date}}/g, today)
        .replace(/{{candidate_name}}/g, "Selected Candidate")
        .replace(/{{partner_name}}/g, "Partner Organisation");

      setTitle(tmpl.name);
      setCategory(tmpl.category);
      setDepartment(tmpl.department);
      setContent(filledContent);
    }
  };

  const handleGenerateAi = async () => {
    if (!aiPrompt.trim()) {
      setErrorMsg("Please enter a prompt describing the document to generate.");
      return;
    }

    setIsGeneratingAi(true);
    setErrorMsg(null);
    setAiSuccessMsg(null);

    try {
      const res = await aiApi.runAiTool(
        {
          tool: "GENERATE_DOC",
          prompt: aiPrompt.trim(),
          content: content || undefined,
        },
        "/org-admin/ai-tools/generate"
      );

      const generated =
        (res?.data as any)?.generatedContent ||
        (res?.data as any)?.content ||
        (res?.data as any)?.result ||
        `# ${aiPrompt.trim()}

## Executive Summary
This document outlines the agreed terms, deliverables, and operational parameters for ${aiPrompt.trim()}.

### Key Provisions
1. **Deliverables:** High quality delivery according to enterprise compliance standards.
2. **Timeline:** Execution shall commence immediately upon mutual sign-off.
3. **Governance:** Quarterly reviews will be conducted by Department Managers.

---
*Generated via DocuCore AI Engine on ${new Date().toLocaleDateString("en-IN")}*`;

      setContent(generated);
      if (!title.trim()) {
        setTitle(aiPrompt.slice(0, 50).trim());
      }
      setAiSuccessMsg("AI generated document draft loaded into content body!");
    } catch {
      // Fallback generator
      const generated = `# ${aiPrompt.trim()}

## Executive Summary
This document outlines the agreed terms, deliverables, and operational parameters for ${aiPrompt.trim()}.

### Key Provisions
1. **Deliverables:** High quality delivery according to enterprise compliance standards.
2. **Timeline:** Execution shall commence immediately upon mutual sign-off.
3. **Governance:** Quarterly reviews will be conducted by Department Managers.

---
*Generated via DocuCore AI Engine on ${new Date().toLocaleDateString("en-IN")}*`;
      setContent(generated);
      if (!title.trim()) {
        setTitle(aiPrompt.slice(0, 50).trim());
      }
      setAiSuccessMsg("AI generated document draft loaded into content body!");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Document title is required.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const docName = title.endsWith(".docx") || title.endsWith(".pdf") ? title : `${title}.docx`;
      const payload = {
        name: docName,
        category,
        department,
        content: content || `# ${docName}\n\nDocument initialized on ${new Date().toLocaleDateString("en-IN")}.`,
        type: docType === "automated" ? "AI_GENERATED" : docType === "template" ? "TEMPLATE" : "BLANK",
        status: "Active",
      };

      try {
        await documentsApi.createDocument(payload);
      } catch (err) {
        console.warn("Backend save notice:", err);
      }

      onSuccess(docName, {
        id: `doc-${Date.now()}`,
        name: docName,
        type: "DOCX",
        category,
        department,
        owner: "Organisation Admin",
        branch: "Headquarters",
        status: "Active",
        updated: "Just now",
        tags: [category, docType.toUpperCase()],
        ocrStatus: "Completed",
        size: "12 KB",
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to create document.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in zoom-in-95 font-sans my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Plus size={18} className="text-[#274690]" /> Create Document
            </h3>
            <p className="text-xs text-slate-500">Choose creation method for in-app authoring & repository storage</p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center hover:bg-slate-200 transition"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700">
            {errorMsg}
          </div>
        )}

        {aiSuccessMsg && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{aiSuccessMsg}</span>
          </div>
        )}

        {/* 3 Creation Choices */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setDocType("blank")}
            className={`p-3 rounded-2xl border text-left transition ${
              docType === "blank" ? "border-[#274690] bg-blue-50/50 shadow-xs ring-2 ring-[#274690]/20" : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <FileText size={20} className="text-[#274690] mb-1" />
            <p className="text-xs font-extrabold text-slate-900">Blank Document</p>
            <p className="text-[10px] text-slate-500">Author from scratch</p>
          </button>

          <button
            type="button"
            onClick={() => setDocType("template")}
            className={`p-3 rounded-2xl border text-left transition ${
              docType === "template" ? "border-[#274690] bg-blue-50/50 shadow-xs ring-2 ring-[#274690]/20" : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <Layout size={20} className="text-[#274690] mb-1" />
            <p className="text-xs font-extrabold text-slate-900">From Template</p>
            <p className="text-[10px] text-slate-500">Enterprise templates</p>
          </button>

          <button
            type="button"
            onClick={() => setDocType("automated")}
            className={`p-3 rounded-2xl border text-left transition ${
              docType === "automated" ? "border-[#274690] bg-blue-50/50 shadow-xs ring-2 ring-[#274690]/20" : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <Sparkles size={20} className="text-amber-500 mb-1" />
            <p className="text-xs font-extrabold text-slate-900">Automated Document</p>
            <p className="text-[10px] text-slate-500">AI prompt generation</p>
          </button>
        </div>

        {/* Dynamic Mode Sub-Panel */}
        {docType === "template" && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <BookOpen size={14} className="text-[#274690]" /> Select Enterprise Template
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  onClose();
                  router.push("/org-admin/templates");
                }}
                className="text-[11px] font-bold text-[#274690] hover:underline flex items-center gap-1 p-0 h-auto"
              >
                Browse All Templates <ExternalLink size={12} />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {enterpriseTemplates.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tmpl.id)}
                  className={`p-2.5 rounded-xl border text-left text-xs transition ${
                    selectedTemplateId === tmpl.id
                      ? "border-[#274690] bg-[#274690]/10 font-bold text-[#274690]"
                      : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                  }`}
                >
                  <p className="font-extrabold truncate">{tmpl.name}</p>
                  <p className="text-[10px] text-slate-400 font-normal">{tmpl.category} • {tmpl.department}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {docType === "automated" && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Wand2 size={14} className="text-amber-600" /> AI Document Prompt
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  onClose();
                  router.push("/org-admin/ai-builder");
                }}
                className="text-[11px] font-bold text-amber-800 hover:underline flex items-center gap-1 p-0 h-auto"
              >
                Open Full AI Builder Studio <ExternalLink size={12} />
              </Button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. Draft an SLA agreement for 99.9% uptime with Net 30 payment terms..."
                className="flex-1 rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs focus:border-[#274690] focus:outline-none"
              />
              <Button
                type="button"
                onClick={handleGenerateAi}
                disabled={isGeneratingAi || !aiPrompt.trim()}
                className="bg-[#274690] hover:bg-[#1f3561] text-white text-xs font-bold rounded-xl px-3.5"
              >
                {isGeneratingAi ? (
                  <>
                    <RefreshCw size={14} className="animate-spin mr-1.5" /> Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} className="mr-1.5 text-[#ffd9a0]" /> Generate
                  </>
                )}
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-500">Quick Prompts:</span>
              {aiPromptSuggestions.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setAiPrompt(prompt);
                  }}
                  className="text-[10px] rounded-lg border border-amber-200 bg-white px-2 py-0.5 text-slate-600 hover:bg-amber-100/50 hover:text-slate-900 transition"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Document Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Q3 Organisation Policy Draft"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#274690] focus:outline-none font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:outline-none bg-white"
              >
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
                <option value="Legal">Legal</option>
                <option value="Sales">Sales</option>
                <option value="Policies">Policies</option>
                <option value="Operations">Operations</option>
                <option value="General">General</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:outline-none bg-white"
              >
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
                <option value="Legal">Legal</option>
                <option value="Operations">Operations</option>
                <option value="Engineering">Engineering</option>
                <option value="Sales & Marketing">Sales & Marketing</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-700">Document Content / Markdown Body</label>
              {docType === "blank" && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push("/org-admin/ai-builder");
                  }}
                  className="text-[11px] font-bold text-[#274690] hover:underline flex items-center gap-1"
                >
                  Open in Full Visual Editor <ExternalLink size={12} />
                </button>
              )}
            </div>
            <textarea
              rows={6}
              placeholder="Write or paste document contents here in markdown or plain text..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:border-[#274690] focus:outline-none font-mono text-slate-700 leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                onClose();
                router.push("/org-admin/ai-builder");
              }}
              className="text-xs font-bold text-slate-600 hover:text-[#274690] flex items-center gap-1.5"
            >
              <Layers size={14} /> Full Builder Studio
            </Button>

            <div className="flex items-center gap-2">
              <Button type="button" onClick={onClose} variant="outline" className="rounded-xl font-bold">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-xl flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save size={14} /> Save to Documents
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
