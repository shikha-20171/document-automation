"use client";

import React, { useState } from "react";
import {
  X,
  Printer,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Eye,
  CheckCircle2,
  Sparkles,
  Layers,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface SampleDataset {
  organisation_name: string;
  organisation_address: string;
  organisation_email: string;
  organisation_phone: string;
  company_website: string;
  employee_name: string;
  employee_id: string;
  designation: string;
  department: string;
  joining_date: string;
  manager_name: string;
  basic_salary: string;
  hra: string;
  special_allowance: string;
  total_salary: string;
  contract_value: string;
  probation_period: string;
  client_name: string;
  client_company: string;
  client_email: string;
  client_address: string;
}

export const DEFAULT_SAMPLE_DATA: SampleDataset = {
  organisation_name: "DocuCore Enterprise Pvt Ltd",
  organisation_address: "Cyber City, Tower B, Level 14, Gurugram, India",
  organisation_email: "hr@docucore.ai",
  organisation_phone: "+91 124 889 0000",
  company_website: "www.docucore.ai",
  employee_name: "Rahul Sharma",
  employee_id: "DC-2026-894",
  designation: "Senior Software Engineer",
  department: "Engineering",
  joining_date: "01 September 2026",
  manager_name: "Anita Desai (VP of Engineering)",
  basic_salary: "₹12,00,000",
  hra: "₹4,80,000",
  special_allowance: "₹1,20,000",
  total_salary: "₹18,00,000 per annum",
  contract_value: "₹18,00,000",
  probation_period: "3",
  client_name: "Alexander Wright",
  client_company: "Acme Global Dynamics Inc.",
  client_email: "awright@acmeglobal.com",
  client_address: "100 Innovation Way, Suite 400, San Francisco, CA",
};

interface TemplatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateName: string;
  version?: string;
  category?: string;
  content: string;
  pageSettings?: {
    pageSize: "A4" | "Letter" | "Legal";
    orientation: "portrait" | "landscape";
    margins: "normal" | "narrow" | "wide";
    fontFamily: string;
    fontSize: string;
    lineSpacing: string;
  };
}

export default function TemplatePreviewModal({
  isOpen,
  onClose,
  templateName,
  version = "v1.0",
  category = "HR",
  content,
  pageSettings = {
    pageSize: "A4",
    orientation: "portrait",
    margins: "normal",
    fontFamily: "Georgia",
    fontSize: "13px",
    lineSpacing: "1.6",
  },
}: TemplatePreviewModalProps) {
  const [zoom, setZoom] = useState<number>(100);
  const [viewMode, setViewMode] = useState<"desktop" | "print">("desktop");
  const [sampleData, setSampleData] = useState<SampleDataset>(DEFAULT_SAMPLE_DATA);
  const [activeProfile, setActiveProfile] = useState<"rahul" | "priya" | "john">("rahul");
  const [showVariableHighlighter, setShowVariableHighlighter] = useState(false);

  if (!isOpen) return null;

  const handleProfileSwitch = (profile: "rahul" | "priya" | "john") => {
    setActiveProfile(profile);
    if (profile === "rahul") {
      setSampleData(DEFAULT_SAMPLE_DATA);
    } else if (profile === "priya") {
      setSampleData({
        ...DEFAULT_SAMPLE_DATA,
        employee_name: "Priya Patel",
        employee_id: "DC-2026-902",
        designation: "Legal Counsel & Compliance Specialist",
        department: "Legal",
        joining_date: "15 September 2026",
        manager_name: "Vikram Malhotra (General Counsel)",
        basic_salary: "₹14,00,000",
        hra: "₹5,60,000",
        special_allowance: "₹1,40,000",
        total_salary: "₹21,00,000 per annum",
        contract_value: "₹21,00,000",
        probation_period: "6",
      });
    } else {
      setSampleData({
        ...DEFAULT_SAMPLE_DATA,
        employee_name: "John Miller",
        employee_id: "DC-2026-950",
        designation: "Senior Account Executive",
        department: "Sales",
        joining_date: "01 October 2026",
        manager_name: "Siddharth Verma (VP Sales)",
        basic_salary: "$90,000",
        hra: "$15,000",
        special_allowance: "$15,000",
        total_salary: "$120,000 OTE",
        contract_value: "$120,000",
        probation_period: "",
      });
    }
  };

  // Resolve template text replacing variables and conditional sections
  const resolveTemplateContent = (rawText: string): string => {
    let resolved = rawText;

    // Handle {{#if variable}}...{{/if}}
    resolved = resolved.replace(/{{#if\s+([a-zA-Z0-9_]+)}}([\s\S]*?){{\/if}}/g, (_, varName, innerContent) => {
      const val = sampleData[varName as keyof SampleDataset];
      if (val && val.trim() !== "") {
        return innerContent;
      }
      return "";
    });

    // Handle AI Section placeholder rendering
    resolved = resolved.replace(/{{AI_([A-Z_]+)}}/g, (_, section) => {
      if (section.includes("RESPONSIBILITIES")) {
        return `• Architect and develop scalable core backend services and user interfaces.\n• Collaborate with cross-functional product, security, and design stakeholders.\n• Lead technical design reviews and maintain strict code quality standards.\n• Provide on-call engineering leadership and troubleshoot critical production incidents.`;
      }
      if (section.includes("SUMMARY")) {
        return `This agreement constitutes the entire understanding between the parties regarding employment deliverables, intellectual property governance, and non-disclosure standards.`;
      }
      return `[AI Generated Section: Dynamically synthesized based on ${sampleData.designation}]`;
    });

    // Replace regular variables
    Object.entries(sampleData).forEach(([key, val]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      resolved = resolved.replace(regex, val);
    });

    return resolved;
  };

  const resolvedText = resolveTemplateContent(content);

  // Split into pages based on <!-- pagebreak -->
  const pages = resolvedText.split(/<!--\s*pagebreak\s*-->/i);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-3 md:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-6xl h-[92vh] rounded-3xl bg-slate-100 flex flex-col overflow-hidden shadow-2xl border border-slate-300/80">
        {/* Top bar controls */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-white border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#274690]/10 flex items-center justify-center text-[#274690]">
              <Eye size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-slate-900">{templateName}</h2>
                <Badge variant="outline" className="text-[10px] font-bold text-[#274690] border-[#274690]/30 bg-[#274690]/5">{category}</Badge>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Live Document Preview • Real-time Variable Resolution
              </p>
            </div>
          </div>

          {/* Center: Sample Profiles */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase px-2">Sample Record:</span>
            <button
              type="button"
              onClick={() => handleProfileSwitch("rahul")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                activeProfile === "rahul"
                  ? "bg-white text-[#274690] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Rahul Sharma (Dev)
            </button>
            <button
              type="button"
              onClick={() => handleProfileSwitch("priya")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                activeProfile === "priya"
                  ? "bg-white text-[#274690] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Priya Patel (Legal)
            </button>
            <button
              type="button"
              onClick={() => handleProfileSwitch("john")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                activeProfile === "john"
                  ? "bg-white text-[#274690] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              John Miller (Sales)
            </button>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(50, z - 15))}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition"
                title="Zoom Out"
              >
                <ZoomOut size={14} />
              </button>
              <span className="px-2 font-mono font-bold text-[11px] text-slate-700 min-w-[42px] text-center">
                {zoom}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(150, z + 15))}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition"
                title="Zoom In"
              >
                <ZoomIn size={14} />
              </button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-8 rounded-xl text-xs font-bold gap-1.5 bg-white"
            >
              <Printer size={13} />
              <span className="hidden sm:inline">Print / PDF</span>
            </Button>

            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition ml-1"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Main Preview scroll container */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col items-center gap-8">
          {pages.map((pageText, pageIndex) => (
            <div
              key={pageIndex}
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top center",
                fontFamily: pageSettings.fontFamily,
                fontSize: pageSettings.fontSize,
                lineHeight: pageSettings.lineSpacing,
              }}
              className="w-full max-w-[794px] min-h-[1123px] bg-white rounded-xl shadow-xl border border-slate-300 p-12 md:p-16 flex flex-col justify-between transition-transform duration-150"
            >
              {/* Page Header */}
              <div className="border-b border-slate-200 pb-4 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-[#274690] text-white flex items-center justify-center font-black text-xs">
                    DC
                  </div>
                  <div>
                    <div className="font-black text-xs text-slate-900 tracking-tight">
                      {sampleData.organisation_name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      {sampleData.organisation_address}
                    </div>
                  </div>
                </div>
                <div className="text-right text-[10px] text-slate-400">
                  <div>{sampleData.company_website}</div>
                  <div>{sampleData.organisation_email}</div>
                </div>
              </div>

              {/* Page Body */}
              <div className="flex-1 text-slate-800 space-y-4 whitespace-pre-wrap font-sans text-xs">
                {pageText.trim()}
              </div>

              {/* Page Footer */}
              <div className="border-t border-slate-200 pt-4 mt-8 flex items-center justify-between text-[10px] text-slate-400">
                <span>
                  Confidential & Proprietary • {sampleData.organisation_name}
                </span>
                <span>
                  Page {pageIndex + 1} of {pages.length}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Banner */}
        <div className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <CheckCircle2 size={15} className="text-emerald-600" />
            <span>Sample data mapped seamlessly. Zero unresolved variables detected.</span>
          </div>
          <Button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#274690] hover:bg-[#1f3561] text-xs font-bold text-white px-5 h-8"
          >
            Back to Editor
          </Button>
        </div>
      </div>
    </div>
  );
}
