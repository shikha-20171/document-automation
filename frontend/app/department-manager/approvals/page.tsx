"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  Search,
  Filter,
  Eye,
  Check,
  X,
  MessageSquare,
  FileText,
  User,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  Download,
  Calendar,
  Layers,
  Send,
  Share2,
  Building2,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { approvalsApi } from "@/services/approvalsApi";

type ApprovalItem = {
  id: string;
  documentId: number;
  documentName: string;
  documentType: string;
  submittedBy: string;
  team: string;
  submittedDate: string;
  dueDate?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CHANGES_REQUESTED" | "FORWARDED" | string;
  priority: "HIGH" | "MEDIUM" | "NORMAL" | "CRITICAL" | string;
  comments?: string;
  history?: Array<{ action: string; user: string; time: string; comment?: string }>;
};

const forwardOptions = [
  { id: "Organisation Admin", label: "Organisation Admin (Tenant Administrator)", desc: "For organisation-wide executive sign-off & tenant authority" },
  { id: "Finance & Accounts Head", label: "Finance & Accounts Head", desc: "For budget allocation, vendor disbursements & payment release" },
  { id: "Legal & Compliance Counsel", label: "Legal & Compliance Counsel", desc: "For contract terms, NDAs & statutory compliance sign-off" },
  { id: "HR & Operations Lead", label: "HR & Operations Lead", desc: "For personnel onboarding, requisitions & company policy" },
];

export default function DepartmentManagerApprovalsPage() {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [successToast, setSuccessToast] = useState("");

  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, returned: 0, overdue: 0 });

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  // Review Drawer & Action Modal
  const [selectedApproval, setSelectedApproval] = useState<ApprovalItem | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"REJECT" | "REQUEST_CHANGES" | "FORWARD" | null>(null);
  const [actionComment, setActionComment] = useState("");
  const [selectedForwardTarget, setSelectedForwardTarget] = useState("Organisation Admin");
  const [isForwardAccordionOpen, setIsForwardAccordionOpen] = useState(false);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 4000);
  };

  const fetchApprovals = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await approvalsApi.getDepartmentApprovals({
        status: statusFilter,
        type: typeFilter,
        team: teamFilter,
        priority: priorityFilter,
      });
      if (res?.data) {
        setApprovals(res.data.approvals || []);
        setStats(res.data.stats || { pending: 0, approved: 0, rejected: 0, returned: 0, overdue: 0 });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load approvals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchApprovals();
  }, [statusFilter, typeFilter, teamFilter, priorityFilter]);

  const filteredApprovals = approvals.filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      (a.documentName && a.documentName.toLowerCase().includes(q)) ||
      (a.submittedBy && a.submittedBy.toLowerCase().includes(q)) ||
      (a.team && a.team.toLowerCase().includes(q)) ||
      (a.documentType && a.documentType.toLowerCase().includes(q))
    );
  });

  const handleQuickApprove = async (approval: ApprovalItem, forwardToAdmin = false) => {
    setActionLoading(true);
    setError("");
    try {
      const res = await approvalsApi.handleApprovalAction(
        approval.id,
        forwardToAdmin ? "FORWARD" : "APPROVE",
        forwardToAdmin
          ? `Approved by Department Manager and forwarded to Organisation Admin for final executive sign-off.`
          : `Approved by Department Manager.`,
        { forwardToOrgAdmin: forwardToAdmin, forwardToTarget: "Organisation Admin" }
      );
      showToast(
        res?.message ||
          (forwardToAdmin
            ? "Document approved and forwarded to Organisation Admin!"
            : "Document approved successfully!")
      );
      if (selectedApproval?.id === approval.id) {
        setIsReviewOpen(false);
      }
      void fetchApprovals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve document.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenActionModal = (approval: ApprovalItem, action: "REJECT" | "REQUEST_CHANGES" | "FORWARD") => {
    setSelectedApproval(approval);
    setPendingAction(action);
    setActionComment("");
    setIsActionModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedApproval || !pendingAction) return;
    if (pendingAction !== "FORWARD" && !actionComment.trim()) {
      setError("Mandatory instructions/reason required.");
      return;
    }

    setActionLoading(true);
    setError("");
    try {
      const res = await approvalsApi.handleApprovalAction(
        selectedApproval.id,
        pendingAction,
        actionComment.trim() || `Forwarded to ${selectedForwardTarget}`,
        {
          forwardToOrgAdmin: selectedForwardTarget === "Organisation Admin" || pendingAction === "FORWARD",
          forwardToTarget: selectedForwardTarget,
        }
      );
      showToast(
        res?.message ||
          (pendingAction === "FORWARD"
            ? `Document forwarded to ${selectedForwardTarget} successfully!`
            : `Action processed successfully!`)
      );
      setIsActionModalOpen(false);
      setIsReviewOpen(false);
      setActionComment("");
      void fetchApprovals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process approval action.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-16 font-sans text-slate-800">
      {/* 1. Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Department Approvals</h1>
            <Badge className="bg-[#c96f4a]/15 text-[#c96f4a] text-xs font-bold">Tier 3 Review</Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Review Team Leader-verified documents, provide manager sign-off, or forward to <strong className="text-[#274690]">Organisation Admin</strong> for executive approval.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchApprovals} className="text-xs font-bold rounded-xl shadow-xs">
          <RefreshCw size={13} className={`mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh Queue
        </Button>
      </div>

      {/* Alerts */}
      {successToast && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 shadow-sm animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-800 shadow-sm animate-in fade-in">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Overview KPI Cards */}
      <section className="grid grid-cols-2 gap-3.5 sm:grid-cols-5">
        <div className="rounded-3xl border border-orange-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-[#c96f4a]">Pending Review</span>
            <Clock size={15} className="text-[#c96f4a]" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{stats.pending}</p>
          <span className="text-[10px] text-slate-400">Needs Manager sign-off</span>
        </div>

        <div className="rounded-3xl border border-blue-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-[#274690]">Approved</span>
            <CheckCircle2 size={15} className="text-[#274690]" />
          </div>
          <p className="mt-2 text-2xl font-black text-[#274690]">{stats.approved}</p>
          <span className="text-[10px] text-slate-400">Manager signed off</span>
        </div>

        <div className="rounded-3xl border border-rose-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-rose-700">Rejected</span>
            <XCircle size={15} className="text-rose-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-rose-600">{stats.rejected}</p>
          <span className="text-[10px] text-slate-400">Rejected / invalid</span>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-700">Changes Requested</span>
            <RotateCcw size={15} className="text-slate-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-800">{stats.returned}</p>
          <span className="text-[10px] text-slate-400">Returned to staff / lead</span>
        </div>

        <div className="rounded-3xl border border-rose-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-rose-700">Overdue</span>
            <AlertTriangle size={15} className="text-rose-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-rose-700">{stats.overdue}</p>
          <span className="text-[10px] text-slate-400">Passed SLA deadline</span>
        </div>
      </section>

      {/* 3. Filters Bar */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-12">
          <div className="relative md:col-span-6">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search document name, associate, team..."
              className="pl-9 h-10 rounded-xl text-xs font-semibold"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-[#274690]"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="FORWARDED">Forwarded to Org Admin</option>
              <option value="CHANGES_REQUESTED">Changes Requested</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-[#274690]"
            >
              <option value="">All Priorities</option>
              <option value="NORMAL">Normal</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>
      </section>

      {/* 4. Approvals Table */}
      <section className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Document Details</th>
                <th className="px-4 py-3.5">Submitted By</th>
                <th className="px-4 py-3.5">Date & Priority</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Comments & Review Notes</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-bold">
                    Loading department approvals...
                  </td>
                </tr>
              ) : filteredApprovals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-bold">
                    No approval requests found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredApprovals.map((appr) => {
                  const docName = appr.documentName || "Document";
                  const submitter = appr.submittedBy || "Employee";
                  const status = appr.status || "PENDING";
                  const priority = appr.priority || "HIGH";
                  const comments = appr.comments || "Pending review";

                  return (
                    <tr key={appr.id} className="transition hover:bg-[#274690]/5">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#274690]/10 text-[#274690] shrink-0">
                            <FileText size={16} />
                          </div>
                          <div className="max-w-[240px]">
                            <p className="font-extrabold text-slate-900 truncate" title={docName}>
                              {docName}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold">{appr.documentType || "Document"}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <p className="font-bold text-slate-900 leading-tight">{submitter}</p>
                        <p className="text-[10px] text-slate-400">{appr.team}</p>
                      </td>

                      <td className="px-4 py-4 text-[11px] text-slate-500">
                        <div>{new Date(appr.submittedDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                        <Badge
                          className={`text-[9px] font-black mt-0.5 ${
                            priority === "CRITICAL"
                              ? "bg-rose-100 text-rose-700"
                              : priority === "HIGH"
                              ? "bg-[#c96f4a]/15 text-[#c96f4a] border-[#c96f4a]/30"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {priority}
                        </Badge>
                      </td>

                      <td className="px-4 py-4">
                        <Badge
                          className={`text-[10px] font-black ${
                            status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : status === "FORWARDED"
                              ? "bg-indigo-100 text-indigo-800 border-indigo-200"
                              : status === "CHANGES_REQUESTED"
                              ? "bg-orange-100 text-orange-800"
                              : status === "REJECTED"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-[#c96f4a]/15 text-[#c96f4a] border-[#c96f4a]/30"
                          }`}
                        >
                          {status === "FORWARDED" ? "Forwarded to Admin" : status}
                        </Badge>
                      </td>

                      <td className="px-4 py-4 text-[11px] text-slate-500 max-w-[200px] truncate" title={comments}>
                        {comments}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedApproval(appr);
                              setIsForwardAccordionOpen(false);
                              setIsReviewOpen(true);
                            }}
                            className="h-8 rounded-xl bg-[#274690] text-[11px] font-bold text-white hover:bg-[#1f3770] shadow-xs"
                          >
                            <Eye size={13} className="mr-1" /> Review & Action
                          </Button>

                          {status === "PENDING" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleQuickApprove(appr, false)}
                                className="h-8 rounded-xl border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-[11px] font-bold"
                                title="Quick Approve"
                              >
                                <Check size={13} />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenActionModal(appr, "FORWARD")}
                                className="h-8 rounded-xl border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-[11px] font-bold"
                                title="Forward to Organisation Admin"
                              >
                                <Send size={13} />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. TWO-PANEL REVIEW & FORWARD DRAWER */}
      {isReviewOpen && selectedApproval && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-4xl bg-white shadow-2xl flex flex-col h-full overflow-hidden">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="text-base font-black text-slate-900">{selectedApproval.documentName}</h3>
                <p className="text-xs text-slate-500">Submitted by {selectedApproval.submittedBy} ({selectedApproval.team})</p>
              </div>
              <button type="button" onClick={() => setIsReviewOpen(false)} className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>

            {/* Two-Panel Body */}
            <div className="grid grid-cols-1 md:grid-cols-2 flex-1 overflow-y-auto divide-y md:divide-y-0 md:divide-x divide-slate-200">
              {/* LEFT: Document Details & Compliance Preview */}
              <div className="p-6 bg-slate-50/50 space-y-4 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-slate-400">Document Review Summary</span>
                  <Badge variant="outline" className="text-[10px] font-mono">Stage 3 Verification</Badge>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 font-mono text-xs text-slate-800 leading-relaxed whitespace-pre-wrap shadow-2xs">
                  {`DOCUMENT SIGN-OFF REVIEW:\n${selectedApproval.documentName}\nType: ${selectedApproval.documentType}\n\nKey Submission Details:\n• Submitter: ${selectedApproval.submittedBy}\n• Team Unit: ${selectedApproval.team}\n• Date: ${new Date(selectedApproval.submittedDate).toLocaleDateString()}\n• Due Date: ${selectedApproval.dueDate || "N/A"}\n• Current Status: ${selectedApproval.status}\n\nCompliance & Hierarchy:\nThis document was submitted by Associate, verified by Team Leader, and is now at Department Manager stage for approval or escalation to Organisation Admin.`}
                </div>

                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black text-indigo-900">
                    <ShieldCheck size={16} className="text-indigo-600" />
                    <span>Multi-Tier Sign-Off Authority</span>
                  </div>
                  <p className="text-[11px] text-indigo-700 font-medium">
                    Department Managers have sign-off authority for operational documents. High-value contracts or policy items can be forwarded directly to <strong>Organisation Admin</strong>.
                  </p>
                </div>
              </div>

              {/* RIGHT: Workflow History & Decision Controls */}
              <div className="p-6 space-y-4 overflow-y-auto flex flex-col justify-between">
                <div className="space-y-4">
                  <span className="text-[11px] font-black uppercase text-slate-400">Approval Workflow Progress</span>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Priority Level</span>
                      <p className="font-black text-slate-900">{selectedApproval.priority}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Current Status</span>
                      <p className="font-black text-[#c96f4a]">{selectedApproval.status}</p>
                    </div>
                  </div>

                  {/* Previous Approval History Timeline */}
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-500 mb-2">Previous Approval History</h4>
                    <div className="space-y-2">
                      {(selectedApproval.history || [
                        { action: "Submitted by Employee", user: selectedApproval.submittedBy || "Associate", time: selectedApproval.submittedDate, comment: "Document submitted" },
                        { action: "Team Leader Verified", user: "Team Leader", time: new Date().toISOString(), comment: "Reviewed and endorsed for Manager sign-off" },
                      ]).map((h, i) => (
                        <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">{h.action}</span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {new Date(h.time).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">by {h.user}</p>
                          {h.comment && <p className="mt-1 font-medium text-slate-700 italic">&quot;{h.comment}&quot;</p>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Forward to Organisation Admin Option */}
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-black text-indigo-900">
                        <Share2 size={15} className="text-indigo-600" />
                        <span>Forward / Send to Organisation Admin</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsForwardAccordionOpen(!isForwardAccordionOpen)}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline"
                      >
                        {isForwardAccordionOpen ? "Hide Options" : "+ Select Destination"}
                      </button>
                    </div>

                    {isForwardAccordionOpen && (
                      <div className="space-y-2 pt-1">
                        <label className="text-[10px] font-black uppercase text-indigo-700">Choose Target Authority:</label>
                        <select
                          value={selectedForwardTarget}
                          onChange={(e) => setSelectedForwardTarget(e.target.value)}
                          className="h-9 w-full rounded-xl border border-indigo-200 bg-white px-3 text-xs font-bold text-slate-800 focus:border-[#274690]"
                        >
                          {forwardOptions.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <p className="text-[10px] text-indigo-600 font-medium">
                          {forwardOptions.find((m) => m.id === selectedForwardTarget)?.desc}
                        </p>
                        <Button
                          size="sm"
                          disabled={actionLoading}
                          onClick={() => handleOpenActionModal(selectedApproval, "FORWARD")}
                          className="w-full h-9 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 gap-1.5 shadow-xs"
                        >
                          <Send size={13} /> Forward to {selectedForwardTarget}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="border-t border-slate-200 pt-4 space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      size="sm"
                      disabled={actionLoading}
                      onClick={() => handleQuickApprove(selectedApproval, false)}
                      className="bg-[#274690] text-xs font-bold text-white hover:bg-[#1f3770] shadow-xs"
                    >
                      <Check size={14} className="mr-1" /> Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={actionLoading}
                      onClick={() => handleOpenActionModal(selectedApproval, "REQUEST_CHANGES")}
                      className="text-xs font-bold text-[#c96f4a] border-orange-200 hover:bg-orange-50"
                    >
                      Request Changes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={actionLoading}
                      onClick={() => handleOpenActionModal(selectedApproval, "REJECT")}
                      className="text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50"
                    >
                      <X size={14} className="mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL FOR REJECT / CHANGES / FORWARD NOTES */}
      {isActionModalOpen && selectedApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                {pendingAction === "REJECT"
                  ? "Reject Document"
                  : pendingAction === "FORWARD"
                  ? `Forward to ${selectedForwardTarget}`
                  : "Request Changes"}
              </h3>
              <button type="button" onClick={() => setIsActionModalOpen(false)} className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              {pendingAction === "FORWARD"
                ? `Add optional notes for ${selectedForwardTarget} regarding "${selectedApproval.documentName}".`
                : `Provide mandatory instructions/reason for ${pendingAction === "REJECT" ? "rejecting" : "requesting changes on"} "${selectedApproval.documentName}".`}
            </p>

            <div>
              <label className="text-[11px] font-black uppercase text-slate-500">
                {pendingAction === "FORWARD" ? "Notes / Instructions for Admin" : "Mandatory Instructions / Reason *"}
              </label>
              <textarea
                rows={4}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-800 focus:border-[#274690] focus:bg-white focus:outline-none"
                value={actionComment}
                onChange={(e) => setActionComment(e.target.value)}
                placeholder={
                  pendingAction === "FORWARD"
                    ? "Explain why executive / Organisation Admin review is required..."
                    : "Explain what adjustments are required before approval..."
                }
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setIsActionModalOpen(false)} className="text-xs font-bold rounded-xl">
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={actionLoading || (pendingAction !== "FORWARD" && !actionComment.trim())}
                onClick={handleConfirmAction}
                className={`text-xs font-bold text-white rounded-xl ${
                  pendingAction === "REJECT"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : pendingAction === "FORWARD"
                    ? "bg-indigo-600 hover:bg-indigo-700"
                    : "bg-[#274690] hover:bg-[#1f3770]"
                }`}
              >
                {pendingAction === "REJECT"
                  ? "Confirm Rejection"
                  : pendingAction === "FORWARD"
                  ? `Send to ${selectedForwardTarget}`
                  : "Confirm Changes Request"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}