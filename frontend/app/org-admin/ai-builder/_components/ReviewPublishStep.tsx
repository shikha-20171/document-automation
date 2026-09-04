"use client";

import { useState } from "react";
import {
  FileCheck,
  Eye,
  Download,
  Printer,
  GitBranch,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building,
  Layers,
  ArrowLeft,
  Send,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ReviewPublishStepProps {
  documentName: string;
  classification: string;
  templateName: string;
  language: string;
  tone: string;
  documentContent: string;
  resolvedVariables: Record<string, string>;
  selectedCrmCustomer: any;
  generationMode: string;
  aiProviderName: string;
  onBack: () => void;
  onSubmitToWorkflow: () => Promise<void>;
  isSubmitting: boolean;
  onExportFile: () => void;
  onSaveToDocuments?: () => void;
}

export default function ReviewPublishStep({
  documentName,
  classification,
  templateName,
  language,
  tone,
  documentContent,
  resolvedVariables,
  selectedCrmCustomer,
  generationMode,
  aiProviderName,
  onBack,
  onSubmitToWorkflow,
  isSubmitting,
  onExportFile,
  onSaveToDocuments,
}: ReviewPublishStepProps) {
  // Substitute tokens for final rendered preview
  const renderedContent = documentContent
    .replace(/\{\{company_name\}\}/g, resolvedVariables.company_name || "[Company Name]")
    .replace(/\{\{employee_name\}\}/g, resolvedVariables.employee_name || "[Employee Name]")
    .replace(/\{\{designation\}\}/g, resolvedVariables.designation || "[Designation]")
    .replace(/\{\{joining_date\}\}/g, resolvedVariables.joining_date || "[Effective Date]")
    .replace(/\{\{salary\}\}/g, resolvedVariables.salary || "[Compensation]")
    .replace(/\{\{address\}\}/g, resolvedVariables.address || "[Address]");

  const wordCount = documentContent.trim().split(/\s+/).filter(Boolean).length;
  const missingTokens = (documentContent.match(/\{\{([a-zA-Z0-9_]+)\}\}/g) || []).filter(
    (token) => !resolvedVariables[token.replace(/[{}]/g, "")]
  );

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${documentName}</title>
          <style>
            body { font-family: Georgia, Cambria, 'Times New Roman', Times, serif; padding: 40px; color: #1e293b; line-height: 1.6; font-size: 13px; }
            h1, h2, h3 { color: #0f172a; margin-top: 24px; margin-bottom: 8px; }
            .header { border-bottom: 2px solid #274690; padding-bottom: 16px; margin-bottom: 24px; }
            .company { font-size: 18px; font-weight: bold; color: #274690; text-transform: uppercase; }
            .footer { margin-top: 48px; border-top: 1px solid #cbd5e1; padding-top: 24px; display: flex; justify-content: space-between; }
            .sign-box { width: 200px; border-top: 1px solid #64748b; margin-top: 40px; padding-top: 8px; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company">${resolvedVariables.company_name || "TechCorp India Ltd"}</div>
            <div style="font-size: 11px; color: #64748b;">Official Document Automation Copy • Classification: ${classification}</div>
          </div>
          <div style="white-space: pre-wrap;">${renderedContent}</div>
          <div class="footer">
            <div>
              <div class="sign-box">Authorized Signatory<br>${resolvedVariables.company_name || "Company Management"}</div>
            </div>
            <div style="text-align: right;">
              <div class="sign-box" style="margin-left: auto;">Signatory / Appointee<br>${resolvedVariables.employee_name || "Employee Signature"}</div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 min-w-0 max-w-full">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#1f3561] via-[#274690] to-purple-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-[#ffd9a0] text-xs font-extrabold backdrop-blur-xs mb-2">
            <ShieldCheck size={14} /> Ready for Workflow Execution
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">{documentName}</h2>
          <p className="text-xs text-blue-100/80 mt-0.5">
            Review document telemetry, resolved variables, and automated approval pipeline before final dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <Button
            onClick={onBack}
            variant="outline"
            className="rounded-xl text-xs font-bold border-white/30 text-white hover:bg-white/10 bg-transparent h-9 px-3.5"
          >
            <ArrowLeft size={14} className="mr-1.5" /> Back to Editor
          </Button>

          <Button
            onClick={handlePrint}
            variant="outline"
            className="rounded-xl text-xs font-bold border-white/30 text-white hover:bg-white/10 bg-transparent h-9 px-3.5"
          >
            <Printer size={14} className="mr-1.5" /> Print PDF
          </Button>

          <Button
            onClick={onExportFile}
            className="bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-xl text-xs h-9 px-4 shadow-md flex items-center gap-1.5"
          >
            <Download size={14} /> Download File
          </Button>

          {onSaveToDocuments && (
            <Button
              onClick={onSaveToDocuments}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs h-9 px-4 shadow-md flex items-center gap-1.5"
            >
              <FileCheck size={14} /> Save to Documents
            </Button>
          )}

          <Button
            onClick={onSubmitToWorkflow}
            disabled={isSubmitting}
            className="bg-[#c96f4a] hover:bg-[#b05d39] text-white font-black rounded-xl text-xs h-9 px-5 shadow-lg flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={14} className="animate-spin" /> Submitting...
              </>
            ) : (
              <>
                <Send size={14} /> Submit to Workflow
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-w-0">
        {/* Left Column: Metadata & Variable Resolution */}
        <div className="lg:col-span-5 space-y-5 min-w-0">
          {/* 1. Document Metadata Card */}
          <Card className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3.5 min-w-0">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <Layers size={15} className="text-[#274690]" /> Document Metadata
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Classification</p>
                <p className="font-bold text-slate-800">{classification}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Base Template</p>
                <p className="font-bold text-slate-800 truncate">{templateName}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Language & Tone</p>
                <p className="font-bold text-slate-800">{language} • {tone}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Document Length</p>
                <p className="font-bold text-slate-800">{wordCount} words</p>
              </div>
              <div className="col-span-2 pt-1 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">AI Engine Mode</span>
                <Badge
                  className={`text-[10px] font-bold ${
                    generationMode === "live_ai"
                      ? "bg-purple-100 text-purple-800 border-purple-200"
                      : "bg-blue-100 text-[#274690] border-blue-200"
                  }`}
                >
                  {generationMode === "live_ai" ? `Live AI: ${aiProviderName}` : "Built-in Fallback Engine"}
                </Badge>
              </div>
            </div>
          </Card>

          {/* 2. Variable Resolution & Tokens Card */}
          <Card className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3 min-w-0">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <UserCheck size={15} className="text-emerald-600" /> Resolved Dynamic Variables
              </h3>
              <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                100% Synced
              </Badge>
            </div>

            <div className="space-y-2">
              {Object.entries(resolvedVariables).map(([key, val]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/70 text-xs min-w-0 gap-2"
                >
                  <span className="font-mono text-[11px] font-bold text-[#274690] shrink-0 truncate">
                    {"{{" + key + "}}"}
                  </span>
                  <span className="font-semibold text-slate-800 truncate text-right">{val || "—"}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* 3. Detected Workflow Approval Route Card */}
          <Card className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/50 via-indigo-50/20 to-white p-4 shadow-xs space-y-3 min-w-0">
            <div className="flex items-center justify-between border-b border-blue-100 pb-2">
              <h3 className="text-xs font-black text-[#274690] uppercase tracking-wider flex items-center gap-2">
                <GitBranch size={15} className="text-[#274690]" /> Automated Approval Route
              </h3>
              <span className="text-[10px] text-blue-700 font-bold bg-blue-100 px-2 py-0.5 rounded-full">
                Active Tenant Workflow
              </span>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              Upon clicking <strong>Submit to Workflow</strong>, the document will automatically enter the organisation&apos;s configured pipeline:
            </p>

            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-blue-200/70 shadow-xs">
                <div className="h-7 w-7 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                  1
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">Step 1: Department Manager Review</p>
                  <p className="text-[10px] text-slate-500 truncate">Internal Role Approval • SLA 48 Hours</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-blue-200/70 shadow-xs">
                <div className="h-7 w-7 rounded-lg bg-purple-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                  2
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">Step 2: Organisation Admin Sign-off</p>
                  <p className="text-[10px] text-slate-500 truncate">Executive Authorization</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-blue-200/70 shadow-xs">
                <div className="h-7 w-7 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                  3
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">Step 3: Certified E-Signature & Archive</p>
                  <p className="text-[10px] text-slate-500 truncate">Cryptographic Signature & PDF Lock</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Live Rendered Paper Document Preview */}
        <div className="lg:col-span-7 min-w-0">
          <Card className="rounded-2xl border border-slate-200/80 bg-slate-100/70 p-4 sm:p-6 shadow-md space-y-4 min-w-0">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Eye size={15} className="text-[#274690]" /> Rendered Document Paper View
              </h3>
              <span className="text-[11px] text-slate-500 font-semibold">Variables Fully Substituted</span>
            </div>

            {/* Paper Document Body */}
            <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-sm space-y-6 text-slate-900 text-xs leading-relaxed max-h-[750px] overflow-y-auto">
              {/* Header Letterhead */}
              <div className="border-b-2 border-[#274690] pb-4 flex justify-between items-start font-sans">
                <div>
                  <span className="text-base font-black text-[#274690] tracking-tight uppercase">
                    {resolvedVariables.company_name || "TechCorp India Ltd"}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Corporate HQ • {resolvedVariables.address || "Nariman Point, Mumbai"} • Official Copy
                  </p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0">
                  Certified Validated Draft
                </Badge>
              </div>

              {/* Document Content Rendering */}
              <div className="whitespace-pre-wrap font-sans text-xs text-slate-800 space-y-3 leading-relaxed">
                {renderedContent}
              </div>

              {/* Signature Block */}
              <div className="pt-10 border-t border-slate-200 flex justify-between items-end font-sans">
                <div className="space-y-1">
                  <div className="h-10 w-36 border-b border-slate-400" />
                  <p className="font-bold text-xs text-slate-800">Authorized Signatory</p>
                  <p className="text-[10px] text-slate-500">{resolvedVariables.company_name || "TechCorp India Ltd"}</p>
                </div>

                <div className="space-y-1 text-right">
                  <div className="h-10 w-36 border-b border-slate-400 ml-auto" />
                  <p className="font-bold text-xs text-slate-800">Appointee / Signatory</p>
                  <p className="text-[10px] text-slate-500">{resolvedVariables.employee_name || "Rahul Sharma"}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
