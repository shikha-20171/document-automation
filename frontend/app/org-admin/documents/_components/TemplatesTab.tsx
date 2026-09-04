"use client";

import { useState } from "react";
import { Layout, Plus, FileText, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface TemplateItem {
  id: string;
  title: string;
  cat: "HR" | "Finance" | "Legal" | "Sales" | "Compliance" | "General";
  desc: string;
  fields: string[];
}

const companyTemplates: TemplateItem[] = [
  { id: "1", title: "Standard Employment Agreement", cat: "HR", desc: "Comprehensive employment terms, IP assignment, salary, and notice period.", fields: ["Employee Name", "Designation", "Joining Date", "Annual CTC"] },
  { id: "2", title: "Official Offer Letter", cat: "HR", desc: "Formal job offer letter for new organization hires.", fields: ["Candidate Name", "Role", "Department", "Joining Date", "Base Salary"] },
  { id: "3", title: "Standard B2B Tax Invoice", cat: "Finance", desc: "GST compliant tax invoice with automatic calculation fields.", fields: ["Client Name", "GSTIN", "Invoice Date", "Line Items", "Tax Rate %"] },
  { id: "4", title: "Mutual Non-Disclosure Agreement (NDA)", cat: "Legal", desc: "Protects proprietary business information between two entities.", fields: ["Party B Name", "Effective Date", "Jurisdiction City", "Term Years"] },
  { id: "5", title: "Corporate Purchase Order (PO)", cat: "Finance", desc: "Official purchase order for vendor procurement.", fields: ["Vendor Name", "PO Number", "Delivery Due Date", "Total Order Value"] },
  { id: "6", title: "Company Security & IT Policy", cat: "Compliance", desc: "Master IT security, device usage, and data confidentiality policy.", fields: ["Revision Year", "Enforcement Date", "Compliance Officer"] },
  { id: "7", title: "Master Client Services Contract", cat: "Sales", desc: "B2B client engagement contract with scope of work and milestones.", fields: ["Client Company", "Contract Value", "Project Start Date", "Scope Overview"] },
  { id: "8", title: "General Memorandum / Memo", cat: "General", desc: "Standard internal organization memo template.", fields: ["Target Audience", "Subject", "Body Content", "Issued By"] },
];

export default function TemplatesTab() {
  const [selectedCat, setSelectedCat] = useState<string>("All");
  const [activeTemplate, setActiveTemplate] = useState<TemplateItem | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [generatedSuccess, setGeneratedSuccess] = useState<string | null>(null);

  const filtered = selectedCat === "All" ? companyTemplates : companyTemplates.filter(t => t.cat === selectedCat);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTemplate) return;
    setGeneratedSuccess(`Generated document "${activeTemplate.title}" successfully! Saved to All Documents.`);
    setActiveTemplate(null);
    setFormData({});
    setTimeout(() => setGeneratedSuccess(null), 4000);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Toast */}
      {generatedSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1f3561] text-white px-5 py-3.5 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2 border border-white/20 animate-in fade-in">
          <Sparkles size={18} className="text-[#ffd9a0]" />
          <span>{generatedSuccess}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Layout size={22} className="text-[#274690]" /> Company Document Templates
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pre-approved reusable company templates for HR, Finance, Legal, Sales, Compliance, and General usage.
          </p>
        </div>
      </div>

      {/* Categories Filter Pills */}
      <div className="flex items-center gap-2 flex-wrap border-b border-slate-200 pb-2">
        {["All", "HR", "Finance", "Legal", "Sales", "Compliance", "General"].map((c) => (
          <button
            key={c}
            onClick={() => setSelectedCat(c)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
              selectedCat === c ? "bg-[#274690] text-white shadow-xs" : "text-slate-600 bg-white border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Template Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((t) => (
          <Card key={t.id} className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-md hover:border-[#274690]/40 transition duration-200 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge className="bg-blue-50 text-[#274690] text-[10px] font-bold border border-blue-200">{t.cat}</Badge>
                <Sparkles size={16} className="text-amber-500 opacity-0 group-hover:opacity-100 transition" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-[#274690] transition">{t.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{t.desc}</p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-400">{t.fields.length} Fillable Fields</span>
              <Button onClick={() => setActiveTemplate(t)} size="sm" className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-xl text-xs h-8 px-3">
                Use Template <ArrowRight size={13} className="ml-1" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Template Generator Modal */}
      {activeTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-500" /> Generate from: {activeTemplate.title}
                </h3>
                <p className="text-xs text-slate-500">Fill template variables to automatically produce document</p>
              </div>
              <button onClick={() => setActiveTemplate(null)} className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center">
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerate} className="space-y-3 text-xs">
              {activeTemplate.fields.map((f) => (
                <div key={f}>
                  <label className="block font-bold text-slate-700 mb-1">{f}</label>
                  <input
                    type="text"
                    required
                    placeholder={`Enter ${f}...`}
                    value={formData[f] || ""}
                    onChange={(e) => setFormData({ ...formData, [f]: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#274690] focus:outline-none"
                  />
                </div>
              ))}

              <div className="flex justify-end gap-2 pt-3">
                <Button type="button" onClick={() => setActiveTemplate(null)} variant="outline" className="rounded-xl font-bold">
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-xl">
                  Generate Document
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
