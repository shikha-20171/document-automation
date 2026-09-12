"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Clock,
  Eye,
  FileText,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  PenTool,
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Sliders,
  History,
  Check,
  ChevronRight,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
} from "lucide-react";
import workflowApi from "@/services/workflowApi";

interface WorkflowDoc {
  id: string;
  documentNumber: string;
  documentName: string;
  documentType: string;
  category?: string;
  createdBy: string;
  createdByEmail?: string;
  department: string;
  branch: string;
  client: string;
  currentStage: string;
  rawStage: string;
  submittedDate: string;
  status: string;
  rawStatus: string;
  signatureRequired: boolean;
  financialTotal?: number | null;
  financialCurrency?: string;
}

interface OverviewStats {
  pendingApproval: number;
  inReview: number;
  changesRequested: number;
  rejected: number;
  approved: number;
  awaitingSignature: number;
  completed: number;
  total: number;
}

interface WorkflowConfigRule {
  documentType: string;
  requireTeamLead: boolean;
  requireDepartmentManager: boolean;
  requireOrgAdmin: boolean;
  signatureRequired: boolean;
  description?: string;
}

function WorkflowPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams?.get("tab") || "queue";

  // Data state
  const [stats, setStats] = useState<OverviewStats>({
    pendingApproval: 0,
    inReview: 0,
    changesRequested: 0,
    rejected: 0,
    approved: 0,
    awaitingSignature: 0,
    completed: 0,
    total: 0,
  });
  const [documents, setDocuments] = useState<WorkflowDoc[]>([]);
  const [configs, setConfigs] = useState<WorkflowConfigRule[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, docsRes, configRes, auditRes] = await Promise.all([
        workflowApi.getOverviewStats().catch(() => ({ data: null })),
        workflowApi.getPendingDocuments({
          search: searchQuery,
          documentType: selectedType !== "ALL" ? selectedType : undefined,
          status: selectedStatus !== "ALL" ? selectedStatus : undefined,
        }).catch(() => ({ data: [] })),
        workflowApi.getWorkflowConfig().catch(() => ({ data: [] })),
        workflowApi.getWorkflowAuditHistory().catch(() => ({ data: [] })),
      ]);

      if (statsRes?.data) setStats(statsRes.data);
      if (docsRes?.data) setDocuments(docsRes.data);
      if (configRes?.data) setConfigs(configRes.data);
      if (auditRes?.data) setAuditLogs(auditRes.data);
    } catch (err) {
      console.error("Failed to load workflow page data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [selectedType, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void loadData();
  };

  const handleConfigToggle = (index: number, field: keyof WorkflowConfigRule) => {
    setConfigs((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: !copy[index][field],
      };
      return copy;
    });
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      const res = await workflowApi.updateWorkflowConfig(configs);
      if (res.success) {
        showToast("Workflow approval hierarchy configuration saved successfully!");
      } else {
        showToast(res.message || "Failed to save configuration.");
      }
    } catch (err: any) {
      showToast(err?.message || "Error saving configuration.");
    } finally {
      setSavingConfig(false);
    }
  };

  const getStatusBadge = (st: string) => {
    const s = (st || "").toLowerCase();
    if (s.includes("approved")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (s.includes("signature")) {
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    }
    if (s.includes("changes")) {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }
    if (s.includes("reject")) {
      return "bg-rose-50 text-rose-700 border-rose-200";
    }
    if (s.includes("review")) {
      return "bg-purple-50 text-purple-700 border-purple-200";
    }
    if (s.includes("completed")) {
      return "bg-teal-50 text-teal-700 border-teal-200";
    }
    return "bg-amber-50 text-amber-700 border-amber-200";
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans text-slate-800">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-slate-900 text-white px-5 py-3 text-xs font-semibold shadow-2xl flex items-center gap-2.5 border border-slate-700 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
            <ShieldCheck size={14} /> Organization Admin Workflow
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Workflows & Document Approvals
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Document-centric multi-tier approval hierarchy, conditional e-signatures, and real-time execution oversight.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => void loadData()}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition shadow-xs"
            title="Refresh Data"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>

          <Link
            href="/org-admin/ai-builder"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
          >
            <Plus size={15} />
            <span>Generate Document</span>
          </Link>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
        <button
          type="button"
          onClick={() => router.push("/org-admin/workflow?tab=queue")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "queue"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Layers size={14} />
          <span>Pending Approvals & Overview</span>
        </button>

        <button
          type="button"
          onClick={() => router.push("/org-admin/workflow?tab=config")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "config"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Sliders size={14} />
          <span>Workflow Configuration</span>
        </button>

        <button
          type="button"
          onClick={() => router.push("/org-admin/workflow?tab=history")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "history"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <History size={14} />
          <span>Audit History</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & PENDING QUEUE */}
      {activeTab === "queue" && (
        <div className="space-y-6">
          {/* Summary Cards (7 KPIs exactly as required) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {/* 1. Pending Approval */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Pending Approval
                </span>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{stats.pendingApproval}</p>
              <p className="text-[10px] text-amber-600 font-semibold mt-0.5">Needs Review</p>
            </div>

            {/* 2. In Review */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  In Review
                </span>
                <span className="w-2 h-2 rounded-full bg-purple-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{stats.inReview}</p>
              <p className="text-[10px] text-purple-600 font-semibold mt-0.5">Mid-Stage Check</p>
            </div>

            {/* 3. Changes Requested */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Changes Req.
                </span>
                <span className="w-2 h-2 rounded-full bg-blue-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{stats.changesRequested}</p>
              <p className="text-[10px] text-blue-600 font-semibold mt-0.5">Creator Revision</p>
            </div>

            {/* 4. Rejected */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Rejected
                </span>
                <span className="w-2 h-2 rounded-full bg-rose-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{stats.rejected}</p>
              <p className="text-[10px] text-rose-600 font-semibold mt-0.5">Declined</p>
            </div>

            {/* 5. Approved */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Approved
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{stats.approved}</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Sign-Off Granted</p>
            </div>

            {/* 6. Awaiting Signature */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Awaiting Sign
                </span>
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{stats.awaitingSignature}</p>
              <p className="text-[10px] text-indigo-600 font-semibold mt-0.5">E-Sign Queue</p>
            </div>

            {/* 7. Completed */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Completed
                </span>
                <span className="w-2 h-2 rounded-full bg-teal-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{stats.completed}</p>
              <p className="text-[10px] text-teal-600 font-semibold mt-0.5">Ready for Client</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search document name, client, ref..."
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </form>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none"
              >
                <option value="ALL">All Document Types</option>
                <option value="Quotation">Quotation</option>
                <option value="Contract">Contract</option>
                <option value="Invoice">Invoice</option>
                <option value="Business Proposal">Business Proposal</option>
                <option value="Non-Disclosure Agreement (NDA)">NDA</option>
                <option value="Internal Report">Internal Report</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="CHANGES_REQUESTED">Changes Requested</option>
                <option value="APPROVED">Approved</option>
                <option value="AWAITING_SIGNATURE">Awaiting Signature</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          {/* Pending Approval Documents Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Pending Approval Documents</h2>
                <p className="text-[11px] text-slate-500">
                  Documents awaiting hierarchical sign-off from Team Lead, Department Manager, or Organization Admin.
                </p>
              </div>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                {documents.length} Records
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400">Loading documents in workflow...</div>
            ) : documents.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <FileText size={32} className="mx-auto text-slate-300" />
                <p className="text-sm font-bold text-slate-700">No Documents Found</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  There are currently no documents in this workflow status queue.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
                    <tr>
                      <th className="py-3 px-6">Document Name</th>
                      <th className="py-3 px-4">Document Type</th>
                      <th className="py-3 px-4">Created By</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Current Stage</th>
                      <th className="py-3 px-4">Submitted Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50/70 transition">
                        {/* Document Name */}
                        <td className="py-3.5 px-6">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="hover:text-indigo-600 transition">{doc.documentName}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {doc.documentNumber} • <span className="font-sans text-slate-600 font-medium">{doc.client}</span>
                          </div>
                        </td>

                        {/* Document Type */}
                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                          {doc.documentType}
                        </td>

                        {/* Created By */}
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-800">{doc.createdBy}</p>
                          <p className="text-[10px] text-slate-400">{doc.createdByEmail || "Team Member"}</p>
                        </td>

                        {/* Department */}
                        <td className="py-3.5 px-4 text-slate-600">
                          {doc.department}
                        </td>

                        {/* Current Stage */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50/70 text-indigo-700 font-bold text-[11px] border border-indigo-100">
                            {doc.currentStage}
                          </span>
                        </td>

                        {/* Submitted Date */}
                        <td className="py-3.5 px-4 text-slate-500">
                          {new Date(doc.submittedDate).toLocaleDateString()}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${getStatusBadge(doc.status)}`}>
                            {doc.status}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-6 text-right">
                          <Link
                            href={`/org-admin/workflow/review/${doc.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition"
                          >
                            <Eye size={13} />
                            <span>Review</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: WORKFLOW CONFIGURATION */}
      {activeTab === "config" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Document Approval Rules & Hierarchy</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure required approvers and signature thresholds by document type for your organization.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={savingConfig}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5"
              >
                <Check size={14} />
                <span>{savingConfig ? "Saving..." : "Save Workflow Rules"}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
                  <tr>
                    <th className="py-3 px-4">Document Type</th>
                    <th className="py-3 px-4 text-center">Team Lead Approval</th>
                    <th className="py-3 px-4 text-center">Dept Manager Approval</th>
                    <th className="py-3 px-4 text-center">Org Admin Approval</th>
                    <th className="py-3 px-4 text-center">Requires E-Signature</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {configs.map((rule, idx) => (
                    <tr key={rule.documentType} className="hover:bg-slate-50/50">
                      <td className="py-4 px-4">
                        <p className="font-bold text-slate-900 text-sm">{rule.documentType}</p>
                        {rule.description && (
                          <p className="text-[11px] text-slate-400 mt-0.5">{rule.description}</p>
                        )}
                      </td>

                      {/* Team Lead Toggle */}
                      <td className="py-4 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleConfigToggle(idx, "requireTeamLead")}
                          className={`w-10 h-6 inline-flex items-center rounded-full p-1 transition-colors ${
                            rule.requireTeamLead ? "bg-indigo-600" : "bg-slate-200"
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-full bg-white transition-transform ${
                              rule.requireTeamLead ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </td>

                      {/* Department Manager Toggle */}
                      <td className="py-4 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleConfigToggle(idx, "requireDepartmentManager")}
                          className={`w-10 h-6 inline-flex items-center rounded-full p-1 transition-colors ${
                            rule.requireDepartmentManager ? "bg-indigo-600" : "bg-slate-200"
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-full bg-white transition-transform ${
                              rule.requireDepartmentManager ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </td>

                      {/* Organization Admin Toggle */}
                      <td className="py-4 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleConfigToggle(idx, "requireOrgAdmin")}
                          className={`w-10 h-6 inline-flex items-center rounded-full p-1 transition-colors ${
                            rule.requireOrgAdmin ? "bg-indigo-600" : "bg-slate-200"
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-full bg-white transition-transform ${
                              rule.requireOrgAdmin ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </td>

                      {/* Signature Toggle */}
                      <td className="py-4 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleConfigToggle(idx, "signatureRequired")}
                          className={`w-10 h-6 inline-flex items-center rounded-full p-1 transition-colors ${
                            rule.signatureRequired ? "bg-indigo-600" : "bg-slate-200"
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-full bg-white transition-transform ${
                              rule.signatureRequired ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT HISTORY */}
      {activeTab === "history" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Workflow Execution & Audit Logs</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Immutable record of every submission, approval action, change request, rejection, and signature seal.
            </p>
          </div>

          {auditLogs.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">No workflow audit items found.</p>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {auditLogs.map((log) => (
                <div key={log.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{log.action}</span>
                      <span className="text-slate-300">•</span>
                      <span className="font-medium text-slate-600">{log.documentName}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Performed by <strong className="text-slate-700">{log.user}</strong> ({log.role})
                    </p>
                    {log.comment && (
                      <p className="text-[11px] text-slate-600 italic bg-slate-50 p-1.5 rounded-lg border border-slate-100 mt-1">
                        "{log.comment}"
                      </p>
                    )}
                  </div>

                  <div className="text-right text-[11px] text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OrgAdminWorkflowPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center text-xs text-slate-400">
          Loading Workflow Workspace...
        </div>
      }
    >
      <WorkflowPageContent />
    </Suspense>
  );
}
