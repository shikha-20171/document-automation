"use client";

import { useState } from "react";
import { Workflow, Play, CheckCircle2, ArrowRight, Clock, Plus, AlertCircle, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface WorkflowPipeline {
  id: string;
  title: string;
  status: "Active Workflows" | "Drafts" | "Completed" | "Failed";
  trigger: string;
  steps: string[];
  lastRun: string;
}

const companyWorkflows: WorkflowPipeline[] = [
  {
    id: "1",
    title: "Employee Document Onboarding Workflow",
    status: "Active Workflows",
    trigger: "New Employee Upload",
    steps: ["Upload", "OCR Scan", "Validation", "Manager Review", "Admin Approval", "Archive"],
    lastRun: "10 Aug 2026, 02:30 PM"
  },
  {
    id: "2",
    title: "Vendor Invoice Automated Processing Workflow",
    status: "Active Workflows",
    trigger: "Invoice Received via Mail/Upload",
    steps: ["Upload", "OCR AI Parse", "Extract Invoice Data", "Finance Review", "Admin Approval", "Accounting CRM Action"],
    lastRun: "10 Aug 2026, 01:15 PM"
  },
  {
    id: "3",
    title: "Legal Contract Expiration & Renewal Pipeline",
    status: "Drafts",
    trigger: "30 Days Before Contract Expiry",
    steps: ["Expiry Alert", "Legal Review", "Draft Renewal", "Signature Request", "Archive"],
    lastRun: "Draft - Never run"
  },
  {
    id: "4",
    title: "Annual Tax Filing Batch Archival",
    status: "Completed",
    trigger: "Scheduled Cron",
    steps: ["Extract Docs", "Zip Archive", "Retention Tag", "Secure Backup"],
    lastRun: "01 Aug 2026"
  }
];

export default function WorkflowsTab() {
  const [workflows] = useState<WorkflowPipeline[]>(companyWorkflows);
  const [activeTab, setActiveTab] = useState<"Active Workflows" | "Drafts" | "Completed" | "Failed">("Active Workflows");
  const [selectedFlow, setSelectedFlow] = useState<WorkflowPipeline | null>(null);

  const filtered = workflows.filter(w => w.status === activeTab);

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Workflow size={22} className="text-[#274690]" /> Automated Document Workflows
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure multi-step document pipelines from upload, AI extraction, multi-level review, to CRM archival.
          </p>
        </div>
        <Button className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-2xl text-xs px-4 py-2.5 shadow-md flex items-center gap-2">
          <Plus size={16} /> + New Workflow Pipeline
        </Button>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {(["Active Workflows", "Drafts", "Completed", "Failed"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
              activeTab === tab ? "bg-[#274690] text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab} ({workflows.filter(w => w.status === tab).length})
          </button>
        ))}
      </div>

      {/* Workflow Pipeline Cards */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-slate-200/80 text-slate-400 font-medium text-xs">
            No workflows in {activeTab}.
          </div>
        ) : (
          filtered.map((flow) => (
            <Card key={flow.id} className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{flow.title}</h3>
                  <p className="text-xs text-slate-500">Trigger: <strong>{flow.trigger}</strong> • Last run: {flow.lastRun}</p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 text-xs font-bold w-fit">{flow.status}</Badge>
              </div>

              {/* Visual Pipeline Nodes */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Automated Pipeline Steps:</p>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {flow.steps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 shadow-xs">
                        <span className="h-5 w-5 rounded-full bg-[#274690] text-white text-[10px] flex items-center justify-center font-black">
                          {idx + 1}
                        </span>
                        <span>{step}</span>
                      </div>
                      {idx < flow.steps.length - 1 && (
                        <ArrowRight size={14} className="text-slate-400 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button size="sm" variant="outline" className="rounded-xl text-xs font-bold text-[#274690]">
                  Edit Steps
                </Button>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs">
                  <Play size={13} className="mr-1" /> Run Manual Trigger
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
