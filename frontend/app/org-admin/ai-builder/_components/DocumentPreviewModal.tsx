"use client";

import { Eye, Download, ArrowLeft, Printer, FileCheck, Building, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  documentContent: string;
  onExportPdf: () => void;
}

export default function DocumentPreviewModal({
  isOpen,
  onClose,
  documentTitle,
  documentContent,
  onExportPdf,
}: DocumentPreviewModalProps) {
  if (!isOpen) return null;

  // Replace variable placeholders with generic placeholders if unprovided
  const parsedContent = documentContent
    .replace(/\{\{company_name\}\}/g, "[Organisation Name]")
    .replace(/\{\{employee_name\}\}/g, "[Recipient / Employee Name]")
    .replace(/\{\{designation\}\}/g, "[Designation / Role]")
    .replace(/\{\{joining_date\}\}/g, "[Effective Date]")
    .replace(/\{\{salary\}\}/g, "[Compensation / Amount]")
    .replace(/\{\{address\}\}/g, "[Registered Address]");

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${documentTitle}</title>
          <style>
            body { font-family: Georgia, Cambria, 'Times New Roman', Times, serif; padding: 40px; color: #1e293b; line-height: 1.6; font-size: 13px; }
            h1, h2, h3 { color: #0f172a; margin-top: 24px; margin-bottom: 8px; }
            .header { border-bottom: 2px solid #274690; padding-bottom: 16px; margin-bottom: 24px; }
            .company { font-size: 18px; font-weight: bold; color: #274690; text-transform: uppercase; }
            .footer { margin-top: 48px; border-top: 1px solid #cbd5e1; padding-top: 24px; display: flex; justify-content: space-between; }
            .sign-box { width: 200px; border-top: 1px solid #64748b; margin-top: 40px; padding-top: 8px; font-size: 11px; }
            table { width: 100%; border-collapse: collapse; margin: 16px 0; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
            th { background: #f1f5f9; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company">${documentTitle}</div>
            <div style="font-size: 11px; color: #64748b;">Enterprise Document Automation • Official Certified Copy</div>
          </div>
          <div style="white-space: pre-wrap;">${parsedContent}</div>
          <div class="footer">
            <div>
              <div class="sign-box">Authorized Signatory<br>Organization</div>
            </div>
            <div style="text-align: right;">
              <div class="sign-box" style="margin-left: auto;">Signatory / Recipient<br>Candidate / Employee</div>
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
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 font-sans overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 sm:px-6 py-3.5 bg-slate-50/90 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-blue-100 text-[#274690] flex items-center justify-center shrink-0">
              <Eye size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                {documentTitle || "Document Preview"}
              </h3>
              <p className="text-xs text-slate-500 truncate">Live preview with filled dynamic variables</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={handlePrint}
              variant="outline"
              className="rounded-xl text-xs font-bold h-8 px-3 border-slate-300"
            >
              <Printer size={13} className="mr-1 text-slate-600" /> Print
            </Button>
            <Button
              onClick={onExportPdf}
              className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-xl text-xs h-8 px-3.5 shadow-xs flex items-center gap-1.5"
            >
              <Download size={13} /> Export File
            </Button>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-slate-200/80 text-slate-600 hover:bg-slate-300 font-bold flex items-center justify-center text-xs ml-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Paper Document Preview Body */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-slate-100/70">
          <div className="max-w-2xl mx-auto bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-md space-y-6 text-slate-900 text-xs leading-relaxed">
            {/* Header Letterhead Stamp */}
            <div className="border-b-2 border-[#274690] pb-4 flex justify-between items-start font-sans">
              <div>
                <span className="text-base font-black text-[#274690] tracking-tight uppercase">TechCorp India Ltd</span>
                <p className="text-[10px] text-slate-500 mt-0.5">Corporate HQ • Nariman Point, Mumbai • CIN: U72200MH2022PTC123456</p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0">Official Certified Copy</Badge>
            </div>

            {/* Document Content Rendering */}
            <div className="whitespace-pre-wrap font-sans text-xs text-slate-800 space-y-3 leading-relaxed">
              {parsedContent}
            </div>

            {/* Signature Block */}
            <div className="pt-10 border-t border-slate-200 flex justify-between items-end font-sans">
              <div className="space-y-1">
                <div className="h-10 w-36 border-b border-slate-400" />
                <p className="font-bold text-xs text-slate-800">Authorized Signatory</p>
                <p className="text-[10px] text-slate-500">TechCorp India Ltd</p>
              </div>

              <div className="space-y-1 text-right">
                <div className="h-10 w-36 border-b border-slate-400 ml-auto" />
                <p className="font-bold text-xs text-slate-800">Employee / Signatory</p>
                <p className="text-[10px] text-slate-500">Rahul Sharma</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 px-5 sm:px-6 py-3 bg-slate-50 rounded-b-3xl shrink-0">
          <Button
            onClick={onClose}
            variant="outline"
            className="rounded-xl text-xs font-bold h-8 px-3 flex items-center gap-1.5"
          >
            <ArrowLeft size={13} /> Back to Editor
          </Button>

          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              variant="outline"
              className="rounded-xl text-xs font-bold h-8 px-3 border-slate-300"
            >
              <Printer size={13} className="mr-1 text-slate-600" /> Print Document
            </Button>
            <Button
              onClick={onExportPdf}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs h-8 px-4 flex items-center gap-1.5 shadow-xs"
            >
              <Download size={13} /> Download .TXT File
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
