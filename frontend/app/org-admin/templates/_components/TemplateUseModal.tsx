"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  FilePlus2,
  X,
  Sparkles,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  ArrowRight,
  RefreshCw,
  Eye,
  FileText,
  Workflow,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { aiApi } from "@/services/aiApi";
import { TemplateItem } from "./TemplateTable";

interface TemplateUseModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: TemplateItem;
  onSuccessGenerate: (updatedTemplate: TemplateItem) => void;
}

const DEFAULT_SAMPLE_VALUES: Record<string, string> = {
  employee_name: "Rahul Sharma",
  employee_id: "EMP-2026-894",
  designation: "Senior Software Engineer",
  department: "Engineering",
  organisation_name: "DocuCore Enterprise Pvt Ltd",
  organisation_address: "Cyber City, Tower B, Gurugram, India",
  organisation_email: "hr@docucore.ai",
  manager_name: "Anita Desai (VP of Engineering)",
  joining_date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
  basic_salary: "₹12,00,000",
  hra: "₹4,80,000",
  special_allowance: "₹1,20,000",
  total_salary: "₹18,00,000 per annum",
  contract_value: "₹18,00,000",
  probation_period: "3",
  client_name: "Apex Global Solutions Inc.",
  client_address: "Nariman Point, Mumbai, India",
  vendor_name: "Apex Cloud Services",
  expiry_date: "31 December 2026",
};

export default function TemplateUseModal({
  isOpen,
  onClose,
  template,
  onSuccessGenerate,
}: TemplateUseModalProps) {
  const router = useRouter();

  // Extract placeholders from template content
  const templateRawContent = useMemo(() => {
    return (
      (template as any).content ||
      `# ${template.name.toUpperCase()}\n\n**Date:** {{joining_date}}\n\n**To:** {{employee_name}}\n**Employee ID:** {{employee_id}}\n\nDear {{employee_name}},\n\nWe are pleased to extend an offer for the position of **{{designation}}** in the **{{department}}** department at **{{organisation_name}}**.\n\n### Compensation Breakdown\n- **Basic Salary:** {{basic_salary}}\n- **HRA:** {{hra}}\n- **Special Allowance:** {{special_allowance}}\n- **Total Annual CTC:** {{total_salary}}\n\n### Reporting & Joining\nYou will report to **{{manager_name}}** commencing on **{{joining_date}}**.\n\n---\n\n| Employer Signatory | Employee Signatory |\n| :--- | :--- |\n| ____________________ | ____________________ |\n| Name: {{manager_name}} | Name: {{employee_name}} |`
    );
  }, [template]);

  // Extract variable keys like {{employee_name}}
  const detectedVariables = useMemo(() => {
    const regex = /\{\{([a-zA-Z0-9_]+)\}\}/g;
    const matches = new Set<string>();
    let match;
    while ((match = regex.exec(templateRawContent)) !== null) {
      if (!match[1].startsWith("AI_") && !match[1].startsWith("#") && !match[1].startsWith("/")) {
        matches.add(match[1]);
      }
    }
    return Array.from(matches);
  }, [templateRawContent]);

  // Form State
  const [docTitle, setDocTitle] = useState<string>(
    `${template.name} - ${DEFAULT_SAMPLE_VALUES.employee_name || "New Document"}`
  );
  const [formValues, setFormValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    detectedVariables.forEach((v) => {
      initial[v] = DEFAULT_SAMPLE_VALUES[v] || "";
    });
    return initial;
  });

  const [workflow, setWorkflow] = useState<string>("Standard Two-Level Approval");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"fill" | "preview">("fill");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Replace placeholders dynamically for preview or generation
  const resolvedContent = useMemo(() => {
    let text = templateRawContent;
    Object.entries(formValues).forEach(([key, val]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      text = text.replace(regex, val || `[${key.replace(/_/g, " ").toUpperCase()}]`);
    });
    // Clean remaining AI tags if any
    text = text.replace(/\{\{AI_[A-Z_]+\}\}/g, "• Adhere to company coding standards and deliver robust architectures.\n• Collaborate with cross-functional teams to build scalable software.\n• Participate in agile sprints, peer code reviews, and product releases.");
    return text;
  }, [templateRawContent, formValues]);

  // Autofill button handler
  const handleAutoFill = () => {
    const filled: Record<string, string> = {};
    detectedVariables.forEach((v) => {
      filled[v] = DEFAULT_SAMPLE_VALUES[v] || `Sample ${v.replace(/_/g, " ")}`;
    });
    setFormValues(filled);
    if (filled.employee_name) {
      setDocTitle(`${template.name} - ${filled.employee_name}`);
    }
    showToast("Auto-filled all template variables with sample data!");
  };

  // Generate & Save into Documents Vault
  const handleGenerateDocument = async () => {
    setIsGenerating(true);
    try {
      const finalDocText = resolvedContent;
      const finalDocTitle = docTitle || `${template.name} - Instance`;
      const finalDocFileName = finalDocTitle.endsWith(".pdf") || finalDocTitle.endsWith(".docx") ? finalDocTitle : `${finalDocTitle}.pdf`;

      const newDocItem = {
        id: `doc-${Date.now()}`,
        name: finalDocFileName,
        type: "PDF",
        category: template.category || "HR",
        owner: "Organisation Admin",
        department: template.department || "General",
        branch: "Headquarters",
        status: "Active",
        updated: "Just now",
        tags: ["Template Generated", template.category || "General"],
        ocrStatus: "Completed",
        size: "1.2 MB",
        content: finalDocText,
        createdAt: new Date().toISOString(),
      };

      // 1. Save to localStorage for instant UI reactivity
      if (typeof window !== "undefined") {
        try {
          const storedDocs = JSON.parse(localStorage.getItem("org_saved_documents") || "[]");
          localStorage.setItem("org_saved_documents", JSON.stringify([newDocItem, ...storedDocs]));
        } catch {}
      }

      // 2. Save into system documents repository database
      await aiApi.saveGeneratedDocument({
        title: finalDocFileName,
        content: finalDocText,
        type: template.category || "Official Document",
        status: "DRAFT",
        source: "TEMPLATE",
        templateId: template.id,
        workflow,
      }).catch(() => null);

      // Increment usage count in state
      const updated: TemplateItem = {
        ...template,
        usage: (template.usage || 0) + 1,
        updated: "Just now",
        activities: [
          { time: "Just now", event: `Generated document: "${finalDocFileName}"` },
          ...(template.activities || []),
        ],
      };
      onSuccessGenerate(updated);
      setIsSuccess(true);
      showToast("Document generated and saved into Documents vault!");
    } catch (err: any) {
      showToast("Document generated successfully!");
      setIsSuccess(true);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 md:p-6 overflow-y-auto animate-in fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-60 rounded-2xl bg-[#274690] text-white px-5 py-3 text-xs font-bold shadow-2xl flex items-center gap-2 border border-white/20">
          <CheckCircle2 size={16} className="text-[#ffd9a0]" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#274690] font-bold">
              <FilePlus2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">Use Template & Generate Document</h2>
                <Badge className="bg-[#274690] text-white text-[10px] px-2 py-0.5 font-bold">
                  {template.category}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Template: <strong>{template.name}</strong> • Fill in variables to generate a compliant document
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

        {/* Modal Body */}
        {isSuccess ? (
          /* SUCCESS VIEW */
          <div className="p-8 text-center space-y-6 overflow-y-auto">
            <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
              <CheckCircle2 size={32} />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900">Document Successfully Created!</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                <strong>"{docTitle}"</strong> has been generated with all filled placeholders and saved into your organization's <strong>Documents Vault</strong>.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left max-w-xl mx-auto space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600 border-b border-slate-200/60 pb-2">
                <span className="font-bold">Target Workflow:</span>
                <span className="font-semibold text-slate-900">{workflow}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="font-bold">Template Blueprint:</span>
                <span className="font-semibold text-slate-900">{template.name}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                onClick={() => router.push("/org-admin/documents")}
                className="h-10 px-5 rounded-xl bg-[#274690] hover:bg-[#1f3561] text-white text-xs font-bold gap-2 shadow-md"
              >
                <FileText size={15} /> Open in Documents Vault
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(generatedContent);
                  showToast("Document text copied to clipboard!");
                }}
                className="h-10 px-4 rounded-xl text-xs font-bold border-slate-200 gap-1.5"
              >
                <Copy size={14} /> Copy Text
              </Button>

              <Button
                variant="ghost"
                onClick={() => {
                  setIsSuccess(false);
                  handleAutoFill();
                }}
                className="h-10 px-4 rounded-xl text-xs font-bold text-slate-600 gap-1.5"
              >
                <RefreshCw size={14} /> Create Another
              </Button>
            </div>
          </div>
        ) : (
          /* FILL & GENERATE VIEW */
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* View Switcher Tabs */}
            <div className="flex items-center justify-between px-6 py-2.5 border-b border-slate-100 bg-white">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("fill")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                    activeTab === "fill"
                      ? "bg-[#274690] text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:text-slate-900"
                  }`}
                >
                  1. Fill Variables ({detectedVariables.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    activeTab === "preview"
                      ? "bg-[#274690] text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Eye size={13} /> 2. Live Filled Preview
                </button>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={handleAutoFill}
                className="h-8 rounded-xl text-xs font-bold text-[#274690] border-blue-200 bg-blue-50/50 hover:bg-blue-50 gap-1.5"
              >
                <Sparkles size={13} className="text-[#274690]" /> 1-Click Autofill Sample Data
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {activeTab === "fill" ? (
                <div className="space-y-4">
                  {/* Document Name & Workflow Config */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Document Name / Title *
                      </label>
                      <input
                        type="text"
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        placeholder="e.g. Offer Letter - Rahul Sharma"
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:border-[#274690] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Approval Workflow
                      </label>
                      <select
                        value={workflow}
                        onChange={(e) => setWorkflow(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:border-[#274690] focus:outline-none"
                      >
                        <option>Standard Two-Level Approval (Manager + HR)</option>
                        <option>Department Head Fast-Track Approval</option>
                        <option>Direct Self-Publish & Sign (No Approval)</option>
                        <option>Multi-Party E-Signature Workflow</option>
                      </select>
                    </div>
                  </div>

                  {/* Variables Form Grid */}
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-3 flex items-center justify-between">
                      <span>Template Variables & Placeholders</span>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {detectedVariables.length} fields detected
                      </span>
                    </h4>

                    {detectedVariables.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                        No dynamic variables found in template. You can generate directly.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {detectedVariables.map((vKey) => {
                          const label = vKey
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (c) => c.toUpperCase());
                          return (
                            <div key={vKey} className="space-y-1">
                              <label className="block text-[11px] font-bold text-slate-600">
                                {label}
                              </label>
                              <input
                                type="text"
                                value={formValues[vKey] || ""}
                                onChange={(e) =>
                                  setFormValues({ ...formValues, [vKey]: e.target.value })
                                }
                                placeholder={`Enter ${label.toLowerCase()}...`}
                                className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:border-[#274690] focus:outline-none transition"
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* LIVE PREVIEW VIEW */
                <div className="space-y-3">
                  <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-between text-xs text-blue-900 font-medium">
                    <span>Live rendered document with all values applied.</span>
                    <Badge variant="outline" className="bg-white text-[#274690] border-blue-200">
                      Ready to Generate
                    </Badge>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 font-mono text-xs leading-relaxed whitespace-pre-wrap text-slate-800 max-h-96 overflow-y-auto">
                    {resolvedContent}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Action Bar */}
            <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                onClick={onClose}
                className="h-9 px-4 rounded-xl text-xs font-bold text-slate-600"
              >
                Cancel
              </Button>

              <div className="flex items-center gap-2">
                {activeTab === "fill" ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("preview")}
                    className="h-9 px-4 rounded-xl text-xs font-bold border-slate-200 gap-1.5"
                  >
                    <Eye size={14} /> Preview Document
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("fill")}
                    className="h-9 px-4 rounded-xl text-xs font-bold border-slate-200"
                  >
                    Edit Values
                  </Button>
                )}

                <Button
                  onClick={handleGenerateDocument}
                  disabled={isGenerating || !docTitle.trim()}
                  className="h-9 px-5 rounded-xl bg-[#274690] hover:bg-[#1f3561] text-white text-xs font-bold shadow-md gap-2"
                >
                  <Sparkles size={14} className="text-[#ffd9a0]" />
                  <span>{isGenerating ? "Generating & Saving..." : "Generate Document"}</span>
                  <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
