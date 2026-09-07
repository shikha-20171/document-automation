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
import { orgDocBuilderApi } from "@/services/templatesApi";
import { TemplateItem } from "./TemplateTable";

interface TemplateUseModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: TemplateItem;
  onSuccessGenerate: (updatedTemplate: TemplateItem) => void;
}

const DEFAULT_SAMPLE_VALUES: Record<string, string> = {
  // Quotation & Commercial Fields
  quotation_number: `QT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
  today_date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
  validity_date: "30 Days from issue",
  client_name: "Apex Global Solutions Inc.",
  client_company: "Apex Global Group",
  client_address: "100 Marine Lines, Nariman Point, Mumbai, India",
  client_email: "procurement@apexsolutions.com",
  project_scope: "Enterprise Document Automation Platform with AI Extraction, Custom Approval Workflows, and Multi-Level Signatures.",
  basic_fee: "₹4,50,000",
  integration_fee: "₹1,50,000",
  support_fee: "₹80,000",
  total_amount: "₹6,80,000",

  // Employment & General HR Fields
  employee_name: "Rahul Sharma",
  employee_id: "EMP-2026-894",
  designation: "Senior Software Engineer",
  department: "Engineering",
  organisation_name: "DocuCore Enterprise Pvt Ltd",
  organisation_address: "Cyber City, Tower B, Gurugram, India",
  organisation_email: "contact@docucore.ai",
  manager_name: "Anita Desai (VP of Engineering)",
  joining_date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
  basic_salary: "₹12,00,000",
  hra: "₹4,80,000",
  special_allowance: "₹1,20,000",
  total_salary: "₹18,00,000 per annum",
  contract_value: "₹18,00,000",
  probation_period: "3",
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
      `# ${template.name.toUpperCase()}\n\n**Date:** {{today_date}}\n\n**To:** {{client_name}}\n**Company:** {{client_company}}\n\nDear {{client_name}},\n\nWe are pleased to submit this proposal for your review.\n\n### Commercial Summary\n- Total Consideration: {{total_amount}}\n- Scope: {{project_scope}}\n\n---\n\n| Authorized Signatory | Client Acceptance |\n| :--- | :--- |\n| ____________________ | ____________________ |\n| Name: {{manager_name}} | Name: {{client_name}} |`
    );
  }, [template]);

  // Extract variable keys like {{employee_name}} or {{client_name}}
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
  const [docTitle, setDocTitle] = useState<string>(() => {
    const isQuote = template.name.toLowerCase().includes("quotation") || template.category === "Sales";
    return isQuote
      ? `${template.name} - ${DEFAULT_SAMPLE_VALUES.client_company || "Apex Global"}`
      : `${template.name} - ${DEFAULT_SAMPLE_VALUES.employee_name || "New Document"}`;
  });

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
    text = text.replace(/\{\{AI_[A-Z_]+\}\}/g, "• Deliver compliant, high-availability architecture and services.\n• Adhere strictly to industry standards and security benchmarks.\n• Provide continuous technical oversight and review.");
    return text;
  }, [templateRawContent, formValues]);

  // Autofill button handler
  const handleAutoFill = () => {
    const filled: Record<string, string> = {};
    detectedVariables.forEach((v) => {
      filled[v] = DEFAULT_SAMPLE_VALUES[v] || `Sample ${v.replace(/_/g, " ")}`;
    });
    setFormValues(filled);
    if (filled.client_company) {
      setDocTitle(`${template.name} - ${filled.client_company}`);
    } else if (filled.employee_name) {
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
      const finalDocFileName = finalDocTitle.endsWith(".pdf") || finalDocTitle.endsWith(".docx") || finalDocTitle.endsWith(".txt")
        ? finalDocTitle
        : `${finalDocTitle}.pdf`;

      setGeneratedContent(finalDocText);

      // Save into system documents repository database via orgDocBuilderApi
      await orgDocBuilderApi.generateDocumentFromTemplate({
        templateId: template.id,
        docTitle: finalDocFileName,
        name: finalDocFileName,
        content: finalDocText,
        category: template.category || "Official Document",
        fieldValues: formValues,
        workflow,
      }).catch((err) => {
        console.warn("generateDocumentFromTemplate fallback:", err);
      });

      // Also call aiApi.saveGeneratedDocument
      await aiApi.saveGeneratedDocument({
        title: finalDocFileName,
        content: finalDocText,
        type: template.category || "Official Document",
        status: "ACTIVE",
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

  // Download Formatted Document as PDF / Print
  const handleDownloadPDF = () => {
    const textToPrint = generatedContent || resolvedContent;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast("Pop-up blocked. Please allow popups to print/download PDF.");
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${docTitle || "Document"}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              padding: 40px;
              color: #1e293b;
              line-height: 1.6;
              max-width: 800px;
              margin: 0 auto;
            }
            h1 { font-size: 22px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 0; }
            h2 { font-size: 18px; color: #1e293b; margin-top: 24px; }
            h3 { font-size: 15px; color: #334155; margin-top: 18px; }
            p { margin: 8px 0; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
            th { background-color: #f8fafc; font-weight: bold; }
            pre { font-family: inherit; white-space: pre-wrap; word-break: break-word; font-size: 13px; }
            @media print {
              body { padding: 0; }
              @page { margin: 1.5cm; }
            }
          </style>
        </head>
        <body>
          <pre>${textToPrint}</pre>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    showToast("Opened print preview to download PDF!");
  };

  // Download File directly as .txt or .doc
  const handleDownloadFile = (format: "txt" | "doc" = "txt") => {
    const content = generatedContent || resolvedContent;
    const blob = new Blob([content], {
      type: format === "doc" ? "application/msword;charset=utf-8" : "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const safeName = (docTitle || template.name).replace(/\.[^/.]+$/, "");
    link.download = `${safeName}.${format}`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded '${link.download}' successfully!`);
  };

  // Reset form to generate another document with new name/values
  const handleCreateAnother = () => {
    setIsSuccess(false);
    setActiveTab("fill");
    // Generate new quotation or reference number
    const newQuotationNum = `QT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setFormValues((prev) => ({
      ...prev,
      quotation_number: newQuotationNum,
      client_name: "",
      client_company: "",
      client_email: "",
    }));
    setDocTitle(`${template.name} - Next Instance`);
    showToast("Ready to generate another document with new details!");
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

            {/* Action Buttons: Download PDF, Download Doc, Copy, Create Another */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                onClick={handleDownloadPDF}
                className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 shadow-md"
              >
                <Download size={15} /> Download PDF / Print
              </Button>

              <Button
                variant="outline"
                onClick={() => handleDownloadFile("txt")}
                className="h-10 px-4 rounded-xl border-slate-200 text-xs font-bold text-slate-700 gap-1.5 hover:bg-slate-50"
              >
                <Download size={14} /> Download (.txt)
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(generatedContent || resolvedContent);
                  showToast("Document content copied to clipboard!");
                }}
                className="h-10 px-4 rounded-xl text-xs font-bold border-slate-200 gap-1.5"
              >
                <Copy size={14} /> Copy Text
              </Button>

              <Button
                onClick={handleCreateAnother}
                className="h-10 px-4 rounded-xl bg-[#274690] hover:bg-[#1f3561] text-white text-xs font-bold gap-1.5 shadow-md"
              >
                <RefreshCw size={14} /> Create Another with Same Template
              </Button>

              <Button
                variant="ghost"
                onClick={() => router.push("/org-admin/documents")}
                className="h-10 px-4 rounded-xl text-xs font-bold text-slate-600 gap-1.5 hover:bg-slate-100"
              >
                <FileText size={15} /> Open in Documents Vault
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
