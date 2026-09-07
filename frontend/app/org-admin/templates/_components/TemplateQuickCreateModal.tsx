"use client";

import React, { useState } from "react";
import { X, Plus, Sparkles, FilePlus2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TemplateItem } from "./TemplateTable";

interface TemplateQuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (template: Partial<TemplateItem>) => void;
}

const PRESET_TEMPLATES = [
  {
    name: "Quotation & Commercial Estimate",
    category: "Sales",
    description: "Standard sales quotation with client details, itemized fees, payment schedule, and signature block.",
    content: `# COMMERCIAL PROPOSAL & QUOTATION\n\n**Quotation Reference:** {{quotation_number}}\n**Date:** {{today_date}}\n**Validity:** 30 Days from issue\n\n### Prepared For:\n**Client Name:** {{client_name}}\n**Company:** {{client_company}}\n**Billing Address:** {{client_address}}\n**Contact Email:** {{client_email}}\n\n### Service Provider Details:\n**Organisation:** {{organisation_name}}\n**Address:** {{organisation_address}}\n**Representative:** {{manager_name}}\n**Official Email:** {{organisation_email}}\n\n---\n\n### 1. Scope of Work & Deliverables\n{{project_scope}}\n\n### 2. Commercial Investment Breakdown\n| Item / Milestone Description | Qty | Rate (INR) | Total (INR) |\n| :--- | :--- | :--- | :--- |\n| Core Technology Platform License | 1 | {{basic_fee}} | {{basic_fee}} |\n| Custom Module Engineering & Setup | 1 | {{integration_fee}} | {{integration_fee}} |\n| Annual Technical Support & Maintenance | 1 | {{support_fee}} | {{support_fee}} |\n| **Total Investment Payable (Excl. Taxes)** | | | **{{total_amount}}** |\n\n### 3. Payment Terms & Schedule\n- 50% advance on commercial contract acceptance.\n- 40% upon completion of User Acceptance Testing (UAT).\n- 10% on live production handover.\n\n### 4. Client Sign-Off & Acceptance\nKindly confirm your acceptance of this quotation by returning a signed duplicate copy.\n\n---\n\n| For {{organisation_name}} (Authorized) | Client Acceptance Signature |\n| :--- | :--- |\n| _____________________________________ | _____________________________________ |\n| **Name:** {{manager_name}} | **Name:** {{client_name}} |\n| **Title:** Commercial Director | **Title:** Authorized Client Signatory |\n| **Date:** {{today_date}} | **Date:** __________________________ |`,
  },
  {
    name: "Standard Non-Disclosure Agreement (NDA)",
    category: "Legal",
    description: "Mutual confidentiality agreement covering proprietary technical architectures and business data.",
    content: `# MUTUAL NON-DISCLOSURE AGREEMENT\n\n**Effective Date:** {{today_date}}\n\n**Disclosing Party:** {{organisation_name}}\n**Receiving Party:** {{client_name}} ({{client_company}})\n\n### 1. Purpose & Confidential Information\nThe parties intend to discuss commercial collaboration and service provision. Both parties agree to protect proprietary technical architectures, source codes, and business data.\n\n### 2. Non-Disclosure Obligations\nThe Receiving Party shall hold all Confidential Information in strict confidence for a period of 3 (three) years from the Effective Date.\n\n---\n\n| Disclosing Party Signature | Receiving Party Signature |\n| :--- | :--- |\n| __________________________ | __________________________ |\n| Name: {{manager_name}} | Name: {{client_name}} |`,
  },
  {
    name: "Employee Offer Letter",
    category: "HR",
    description: "Employment offer letter with CTC breakdown, joining date, reporting manager, and terms.",
    content: `# EMPLOYMENT OFFER LETTER\n\n**Date:** {{today_date}}\n\n**To:** {{employee_name}}\n**Employee ID:** {{employee_id}}\n**Address:** {{client_address}}\n\nDear {{employee_name}},\n\nWe are pleased to formally extend an offer of employment for the position of **{{designation}}** in the **{{department}}** department at **{{organisation_name}}**.\n\n### 1. Position & Reporting\nYou will report directly to **{{manager_name}}** commencing on **{{joining_date}}**.\n\n### 2. Compensation & Benefits\nYour annual Gross CTC will be **{{total_salary}}**, structured as follows:\n- Basic Salary: {{basic_salary}}\n- House Rent Allowance: {{hra}}\n- Special Allowance: {{special_allowance}}\n- Total CTC: {{total_salary}}\n\n### 3. Key Responsibilities\n• Deliver high-quality engineering and technical solutions.\n• Collaborate cross-functionally with internal business leaders.\n• Comply with corporate code of ethics and confidentiality.\n\n---\n\n| For Employer Signatory | Employee Acceptance |\n| :--- | :--- |\n| _______________________ | _______________________ |\n| Name: {{manager_name}} | Name: {{employee_name}} |`,
  },
  {
    name: "Blank Custom Document",
    category: "Operations",
    description: "Start with a clean blank template.",
    content: `# DOCUMENT TITLE\n\n**Date:** {{today_date}}\n**Party Name:** {{client_name}}\n**Reference:** {{quotation_number}}\n\n### 1. Overview\nEnter description and custom details here.\n\n---\n\nAuthorized Signature: __________________________`,
  },
];

export default function TemplateQuickCreateModal({
  isOpen,
  onClose,
  onCreate,
}: TemplateQuickCreateModalProps) {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [name, setName] = useState(PRESET_TEMPLATES[0].name);
  const [category, setCategory] = useState(PRESET_TEMPLATES[0].category);
  const [description, setDescription] = useState(PRESET_TEMPLATES[0].description);
  const [content, setContent] = useState(PRESET_TEMPLATES[0].content);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSelectPreset = (idx: number) => {
    setSelectedPresetIndex(idx);
    const p = PRESET_TEMPLATES[idx];
    setName(p.name);
    setCategory(p.category);
    setDescription(p.description);
    setContent(p.content);
  };

  const handleInsertTag = (tag: string) => {
    setContent((prev) => prev + (prev.endsWith("\n") ? "" : " ") + tag + " ");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreate({
        name: name.trim(),
        category,
        description: description.trim(),
        documentType: name.trim(),
        status: "Active",
        content,
        department: "All",
        visibility: "Organisation Wide",
        tags: [category.toLowerCase(), "custom"],
      });
      onClose();
    } catch (err) {
      console.error("Create template error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 md:p-6 overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#274690]">
              <FilePlus2 size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Create New Document Template</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Pick a starter blueprint or build your own. Once created, you can use it repeatedly for different clients.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Preset Selector */}
        <div className="px-6 py-3 bg-slate-100/70 border-b border-slate-200/80 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-bold text-slate-600 shrink-0">Quick Starters:</span>
          {PRESET_TEMPLATES.map((p, idx) => (
            <button
              key={p.name}
              type="button"
              onClick={() => handleSelectPreset(idx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedPresetIndex === idx
                  ? "bg-[#274690] text-white shadow-xs"
                  : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-900 focus:bg-white focus:border-[#274690] focus:outline-none transition"
                  placeholder="e.g. B2B Sales Quotation"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#274690] focus:outline-none transition"
                >
                  <option value="Sales">Sales & Quotations</option>
                  <option value="Finance">Finance & Invoices</option>
                  <option value="HR">HR & Employment</option>
                  <option value="Legal">Legal & Agreements</option>
                  <option value="Procurement">Procurement & Orders</option>
                  <option value="Operations">Operations</option>
                  <option value="Compliance">Compliance</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description / Purpose
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of what this template is used for..."
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 focus:bg-white focus:border-[#274690] focus:outline-none transition"
              />
            </div>

            {/* Quick Variable Tags Picker */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-700">Dynamic Variable Tags:</span>
                <span className="text-[11px] text-slate-400">Click to insert into content</span>
              </div>
              <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-2xl border border-slate-200">
                {[
                  "{{client_name}}",
                  "{{client_company}}",
                  "{{client_email}}",
                  "{{total_amount}}",
                  "{{today_date}}",
                  "{{quotation_number}}",
                  "{{project_scope}}",
                  "{{employee_name}}",
                  "{{designation}}",
                  "{{manager_name}}",
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleInsertTag(tag)}
                    className="text-[11px] font-mono font-bold bg-white text-[#274690] hover:bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg transition"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Editor */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Template Content & Clauses *
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {content.length} characters
                </span>
              </div>
              <textarea
                required
                rows={12}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50/50 font-mono text-xs leading-relaxed text-slate-900 focus:bg-white focus:border-[#274690] focus:outline-none transition resize-y"
              />
            </div>
          </div>

          {/* Footer Bar */}
          <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="h-10 px-4 rounded-xl text-xs font-bold text-slate-600"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="h-10 px-6 rounded-xl bg-[#274690] hover:bg-[#1f3561] text-white text-xs font-bold shadow-md flex items-center gap-2"
            >
              <Plus size={15} />
              <span>{isSubmitting ? "Creating..." : "Create & Add to Templates"}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
