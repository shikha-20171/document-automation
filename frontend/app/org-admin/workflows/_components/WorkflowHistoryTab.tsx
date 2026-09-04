"use client";

import { Fragment, useState, useEffect } from "react";
import { ChevronDown, ChevronRight, CheckCircle2, Circle, Clock, History as HistoryIcon, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { workflowApi } from "@/services/workflowApi";

interface TimelineStep {
  name: string;
  status: "completed" | "current" | "pending";
}

interface WorkflowExecution {
  id: string;
  workflowName: string;
  executionId: string;
  documentName: string;
  dateTime: string;
  status: "In Progress" | "Completed" | "Failed";
  timeline: TimelineStep[];
}

const initialExecutions: WorkflowExecution[] = [
  {
    id: "1",
    workflowName: "Contract Approval Workflow",
    executionId: "#1024",
    documentName: "Employment Contract - Senior Lead",
    dateTime: "12 Aug 2026, 10:30 AM",
    status: "In Progress",
    timeline: [
      { name: "Employee Submission", status: "completed" },
      { name: "Department Manager Approval", status: "completed" },
      { name: "Organisation Admin Sign-off", status: "current" },
      { name: "Final Certification & Storage", status: "pending" },
    ],
  },
  {
    id: "2",
    workflowName: "NDA Review Workflow",
    executionId: "#1023",
    documentName: "NDA - Enterprise Partner",
    dateTime: "11 Aug 2026, 02:15 PM",
    status: "Completed",
    timeline: [
      { name: "Employee Submission", status: "completed" },
      { name: "Legal Compliance Review", status: "completed" },
      { name: "Organisation Admin Approved", status: "completed" },
      { name: "E-Signature Completed", status: "completed" },
    ],
  },
  {
    id: "3",
    workflowName: "Invoice Approval Workflow",
    executionId: "#1022",
    documentName: "Vendor Service Invoice #INV-8891",
    dateTime: "10 Aug 2026, 11:00 AM",
    status: "Completed",
    timeline: [
      { name: "Vendor Submission", status: "completed" },
      { name: "Finance Verification", status: "completed" },
      { name: "Organisation Admin Approved", status: "completed" },
    ],
  },
];

export default function WorkflowHistoryTab() {
  const [executions, setExecutions] = useState<WorkflowExecution[]>(initialExecutions);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await workflowApi.getOrgWorkflowHistory();
      if (res?.data && res.data.length > 0) {
        const mapped: WorkflowExecution[] = res.data.map((h: any, idx: number) => ({
          id: String(h.id || idx),
          workflowName: h.workflowName || "Standard Workflow",
          executionId: `#${h.requestId?.slice(0, 6) || 1025 + idx}`,
          documentName: h.documentName || "Document",
          dateTime: `${h.date || "Recent"}, ${h.time || ""}`,
          status: h.action === "APPROVE" ? "Completed" : h.action === "REJECT" ? "Failed" : "In Progress",
          timeline: [
            { name: "Document Submitted", status: "completed" },
            { name: `${h.role || "Admin"} Action: ${h.action}`, status: h.action === "APPROVE" ? "completed" : "current" },
            { name: "Archive & Notification", status: h.action === "APPROVE" ? "completed" : "pending" },
          ],
        }));
        setExecutions(mapped);
      }
    } catch {
      // Retain fallback executions
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchHistory();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "In Progress":
        return "bg-amber-100 text-amber-800";
      case "Completed":
        return "bg-emerald-100 text-emerald-800";
      case "Failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getStepIcon = (step: TimelineStep) => {
    if (step.status === "completed") {
      return <CheckCircle2 size={16} className="text-emerald-600" />;
    }
    if (step.status === "current") {
      return <Clock size={16} className="text-amber-600 animate-pulse" />;
    }
    return <Circle size={16} className="text-slate-300" />;
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <HistoryIcon size={22} className="text-[#274690]" /> Workflow History
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Track and review all workflow execution history with step-by-step timelines.
        </p>
      </div>

      {/* Table */}
      <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Workflow</th>
                <th className="py-3.5 px-4">Execution ID</th>
                <th className="py-3.5 px-4">Document</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {executions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                    No workflow executions found.
                  </td>
                </tr>
              ) : (
                executions.map((exec) => (
                  <Fragment key={exec.id}>
                    <tr
                      className="hover:bg-slate-50/70 transition cursor-pointer"
                      onClick={() => setExpandedId(expandedId === exec.id ? null : exec.id)}
                    >
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{exec.workflowName}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">{exec.executionId}</td>
                      <td className="py-3.5 px-4 text-slate-600">{exec.documentName}</td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">{exec.dateTime}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <Badge className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${getStatusBadge(exec.status)}`}>
                            {exec.status}
                          </Badge>
                          {expandedId === exec.id ? (
                            <ChevronDown size={14} className="text-slate-400" />
                          ) : (
                            <ChevronRight size={14} className="text-slate-400" />
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedId === exec.id && (
                      <tr>
                        <td colSpan={5} className="p-4 bg-slate-50/60">
                          <div className="space-y-3">
                            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Execution Timeline</p>
                            <div className="flex flex-col gap-2">
                              {exec.timeline.map((step, idx) => (
                                <div key={idx} className="flex items-center gap-3 text-xs">
                                  <div className="shrink-0">{getStepIcon(step)}</div>
                                  <span className={`font-medium ${step.status === "completed" ? "text-slate-800" : step.status === "current" ? "text-amber-700" : "text-slate-400"}`}>
                                    {step.name}
                                  </span>
                                  {step.status === "completed" && (
                                    <span className="text-[10px] text-emerald-600 font-bold">✓ Done</span>
                                  )}
                                  {step.status === "current" && (
                                    <span className="text-[10px] text-amber-600 font-bold">In Progress</span>
                                  )}
                                  {step.status === "pending" && (
                                    <span className="text-[10px] text-slate-400">Pending</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
