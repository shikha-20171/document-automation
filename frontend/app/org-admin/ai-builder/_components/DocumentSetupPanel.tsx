"use client";

import { useState, useEffect } from "react";
import { Layers, Sliders, Database, UserCheck, Sparkles, Building2, Globe, Shield, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { orgDocBuilderApi } from "@/services/templatesApi";

export interface SetupState {
  name: string;
  type: string;
  template: string;
  language: string;
  tone: string;
  crmCustomer: string;
}

interface DocumentSetupPanelProps {
  setup: SetupState;
  onUpdateSetup: (updated: Partial<SetupState>) => void;
  onInsertVariable: (varToken: string) => void;
  onSelectBaseTemplate: (templateName: string) => void;
  onSelectCrmCustomer: (customerData: any) => void;
  onProceedToEditor: () => void;
  isDocumentEdited: boolean;
}

const fallbackRecipients: any[] = [];

const variablesList = [
  { token: "{{company_name}}", label: "Company / Employer", description: "Registered entity name" },
  { token: "{{employee_name}}", label: "Signatory / Appointee", description: "Full legal person name" },
  { token: "{{designation}}", label: "Role / Designation", description: "Job title or position" },
  { token: "{{joining_date}}", label: "Effective / Joining Date", description: "Contract commencement date" },
  { token: "{{salary}}", label: "Compensation / CTC", description: "Financial package or value" },
  { token: "{{address}}", label: "Business / Home Address", description: "Primary registered address" },
];

export default function DocumentSetupPanel({
  setup,
  onUpdateSetup,
  onInsertVariable,
  onSelectBaseTemplate,
  onSelectCrmCustomer,
  onProceedToEditor,
  isDocumentEdited,
}: DocumentSetupPanelProps) {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [recipients, setRecipients] = useState<any[]>(fallbackRecipients);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    orgDocBuilderApi
      .getCrmRecipients()
      .then((res) => {
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          setRecipients(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleNameChange = (val: string) => {
    onUpdateSetup({ name: val });
    if (!val.trim()) {
      setNameError("Document name is required.");
    } else if (val.trim().length < 3) {
      setNameError("Document name must be at least 3 characters.");
    } else {
      setNameError(null);
    }
  };

  const handleClassificationChange = (newType: string) => {
    onUpdateSetup({ type: newType });
  };

  const handleTemplateChange = (tmpl: string) => {
    onUpdateSetup({ template: tmpl });
    if (tmpl && tmpl !== "Custom AI Document") {
      onSelectBaseTemplate(tmpl);
    }
  };

  const handleCrmChange = (customerId: string) => {
    const cust = recipients.find((c) => c.id === customerId);
    if (cust) {
      onUpdateSetup({
        crmCustomer: customerId,
        name: `${setup.type || "Agreement"} – ${cust.name}`,
      });
      setNameError(null);
      onSelectCrmCustomer(cust);
    } else {
      onUpdateSetup({ crmCustomer: "" });
    }
  };

  const handleCopyVar = (token: string) => {
    onInsertVariable(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 1200);
  };

  const handleNext = () => {
    if (!setup.name.trim()) {
      setNameError("Please enter a valid document name to proceed.");
      return;
    }
    onProceedToEditor();
  };

  return (
    <div className="space-y-4 font-sans text-xs min-w-0 max-w-full">
      {/* 1. Document Setup Header Card */}
      <Card className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-xs space-y-3.5 min-w-0 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 min-w-0">
          <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1.5 truncate">
            <Sliders size={15} className="text-[#274690] shrink-0" />
            <span className="truncate">Document Setup</span>
          </h3>
          <Badge className="bg-blue-50 text-[#274690] text-[10px] font-bold border border-blue-200 shrink-0">
            Step 1 of 3
          </Badge>
        </div>

        {/* Document Name */}
        <div className="min-w-0">
          <label className="block font-extrabold text-slate-700 mb-1 text-[11px]">
            Document Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={setup.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. Employment Agreement – Rahul Sharma"
            className={`w-full rounded-xl border px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none transition min-w-0 ${
              nameError
                ? "border-rose-300 bg-rose-50/40 focus:border-rose-500"
                : "border-slate-200 bg-slate-50/50 focus:border-[#274690]"
            }`}
          />
          {nameError && (
            <p className="text-[10px] text-rose-600 font-bold mt-1 flex items-center gap-1">
              <AlertCircle size={11} /> {nameError}
            </p>
          )}
        </div>

        {/* Document Classification */}
        <div className="min-w-0">
          <label className="block font-extrabold text-slate-700 mb-1 text-[11px]">
            Document Classification / Category <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            list="classification-suggestions"
            value={setup.type}
            onChange={(e) => handleClassificationChange(e.target.value)}
            placeholder="e.g. Custom Agreement, SOW, NDA, Policy, Proposal..."
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#274690] focus:outline-none min-w-0"
          />
          <datalist id="classification-suggestions">
            <option value="Commercial Contract" />
            <option value="Non-Disclosure Agreement (NDA)" />
            <option value="Statement of Work (SOW)" />
            <option value="Employment Offer & Terms" />
            <option value="Vendor / Supplier SLA" />
            <option value="Company Policy & Compliance" />
            <option value="Project Scope Proposal" />
            <option value="Lease / Rental Agreement" />
            <option value="Consulting Agreement" />
          </datalist>
        </div>

        {/* Optional Starter Blueprint */}
        <div className="min-w-0">
          <label className="block font-extrabold text-slate-700 mb-1 text-[11px]">
            Blueprint Mode (Optional)
          </label>
          <select
            value={setup.template}
            onChange={(e) => handleTemplateChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#274690] focus:outline-none min-w-0 truncate font-medium"
          >
            <option value="Custom AI Document">✨ 100% Pure Custom AI Document (From Prompt)</option>
            <option value="Employment Agreement">Starter Blueprint: Employment Agreement</option>
            <option value="Non-Disclosure Agreement">Starter Blueprint: B2B NDA</option>
            <option value="Client Service Contract">Starter Blueprint: MSA / SOW</option>
            <option value="Official Offer Letter">Starter Blueprint: Offer Letter</option>
            <option value="Consulting Agreement">Starter Blueprint: Consulting Agreement</option>
          </select>
        </div>

        {/* Language & Tone */}
        <div className="grid grid-cols-2 gap-2 min-w-0">
          <div className="min-w-0">
            <label className="block font-bold text-slate-700 mb-1 text-[11px]">Language</label>
            <select
              value={setup.language}
              onChange={(e) => onUpdateSetup({ language: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none min-w-0"
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi (हिंदी)</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="German">German</option>
            </select>
          </div>

          <div className="min-w-0">
            <label className="block font-bold text-slate-700 mb-1 text-[11px]">Tone</label>
            <select
              value={setup.tone}
              onChange={(e) => onUpdateSetup({ tone: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none min-w-0"
            >
              <option value="Professional">Professional</option>
              <option value="Formal Legal">Formal Legal</option>
              <option value="Concise">Concise</option>
              <option value="Friendly">Friendly</option>
            </select>
          </div>
        </div>

        <Button
          onClick={handleNext}
          className="w-full bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-xl text-xs py-2 shadow-xs flex items-center justify-center gap-1.5 mt-2"
        >
          <span>Next: Open Editor</span>
          <ArrowRight size={13} />
        </Button>
      </Card>

      {/* 2. CRM Auto-Fill Sync Card */}
      <Card className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50/40 to-indigo-50/20 p-3.5 sm:p-4 shadow-xs space-y-2.5 min-w-0 overflow-hidden">
        <div className="flex items-center justify-between min-w-0">
          <span className="font-extrabold text-purple-900 text-xs flex items-center gap-1.5 truncate">
            <Database size={14} className="text-purple-600 shrink-0" />
            <span className="truncate">Auto-Fill CRM Data</span>
          </span>
          <Badge className="bg-purple-200 text-purple-800 text-[9px] font-bold shrink-0">Live Sync</Badge>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          Select a customer / employee record to auto-populate tokens across the draft.
        </p>
        <select
          value={setup.crmCustomer}
          onChange={(e) => handleCrmChange(e.target.value)}
          className="w-full rounded-xl border border-purple-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none min-w-0 truncate"
        >
          <option value="">Choose Customer / Employee...</option>
          {recipients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} • {c.company} ({c.salary})
            </option>
          ))}
        </select>
      </Card>

      {/* 3. Document Variables & Dynamic Tokens */}
      <Card className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-xs space-y-2.5 min-w-0 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2 min-w-0">
          <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5 truncate">
            <Layers size={14} className="text-[#274690] shrink-0" />
            <span className="truncate">Dynamic Variables</span>
          </h4>
          <span className="text-[10px] text-slate-400 font-semibold shrink-0">Click to Insert</span>
        </div>

        <div className="space-y-1.5 min-w-0">
          {variablesList.map((v) => (
            <div
              key={v.token}
              onClick={() => handleCopyVar(v.token)}
              className="group flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/60 cursor-pointer transition min-w-0 gap-1.5"
            >
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[10.5px] font-bold text-[#274690] group-hover:text-blue-900 truncate">
                  {v.token}
                </p>
                <p className="text-[10px] text-slate-500 truncate">{v.label}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-1.5 text-[10px] font-bold text-slate-600 group-hover:text-[#274690] shrink-0"
              >
                {copiedToken === v.token ? "✓ Added" : "+ Insert"}
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
