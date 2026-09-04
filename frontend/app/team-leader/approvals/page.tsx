"use client";

import { useEffect, useState, useMemo } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Check,
  X,
  ArrowRight,
  FileText,
  MessageSquare,
  Sparkles,
  GitPullRequest,
  Send,
  Eye,
  Share2,
  Building2,
  ShieldCheck,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { approvalsApi } from "@/services/approvalsApi";

type ApprovalTab = "PENDING" | "APPROVED" | "REJECTED" | "CHANGES_REQUESTED" | "MY_APPROVALS";

const forwardModuleOptions = [
  { id: "Department Manager", label: "Department Manager (Tier 3 Approval)", desc: "Escalate for department head review & executive sign-off" },
  { id: "Organisation Admin", label: "Organisation Admin (Tenant Administrator)", desc: "For organisation-wide executive sign-off & tenant authority" },
  { id: "Finance & Accounts Head", label: "Finance & Accounts Head", desc: "For budget allocation, vendor invoices & payment release" },
  { id: "Legal & Compliance Counsel", label: "Legal & Compliance Counsel", desc: "For contract terms, NDAs & regulatory compliance" },
  { id: "HR & Operations Lead", label: "HR & Operations Lead", desc: "For personnel onboarding, leaves & requisition review" },
];

export default function TeamLeaderApprovalsPage() {
  const [loading, setLoading] = useState(true);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<ApprovalTab>("PENDING");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [successToast, setSuccessToast] = useState("");

  // Review Modal State
  const [selectedApproval, setSelectedApproval] = useState<any | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [forwardToDeptManager, setForwardToDeptManager] = useState(false);
  const [selectedForwardTarget, setSelectedForwardTarget] = useState("Department Manager");
  const [isForwardMode, setIsForwardMode] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 4000);
  };

  const fetchApprovals = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await approvalsApi.getTeamLeaderApprovals({ tab: activeTab });
      if (res?.data) {
        setApprovals(res.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load approvals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchApprovals();
  }, [activeTab]);

  const handleProcessAction = async (action: "APPROVE" | "REJECT" | "REQUEST_CHANGES" | "FORWARD") => {
    if (!selectedApproval) return;
    setActionLoading(true);
    try {
      const res = await approvalsApi.processApproval(selectedApproval.id, {
        action,
        comment: reviewComment.trim(),
        forwardToManager: forwardToDeptManager || action === "FORWARD",
        forwardToTarget: selectedForwardTarget,
      });
      showToast(
        res?.message ||
          (action === "FORWARD"
            ? `Document forwarded to ${selectedForwardTarget} successfully!`
            : `Approval ${action} processed successfully!`)
      );
      setSelectedApproval(null);
      setReviewComment("");
      setIsForwardMode(false);
      void fetchApprovals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process approval.");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredApprovals = useMemo(() => {
    if (!searchQuery.trim()) return approvals;
    const q = searchQuery.toLowerCase();
    return approvals.filter(
      (a) =>
        (a.documentName && a.documentName.toLowerCase().includes(q)) ||
        (a.submittedBy && a.submittedBy.toLowerCase().includes(q)) ||
        (a.type && a.type.toLowerCase().includes(q)) ||
        (a.department && a.department.toLowerCase().includes(q))
    );
  }, [approvals, searchQuery]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-20 font-sans text-slate-800">
      {/* 1. HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-[#274690] sm:text-3xl">Approvals & Verification</h1>
            <Badge className="bg-[#c96f4a]/10 text-[#c96f4a] border-[#c96f4a]/30 text-xs font-black px-2.5 py-0.5">
              Team Leader Level
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-semibold">
            Stage 2 of Approval Flow: Employee → <strong className="text-[#274690]">Team Leader</strong> → Department Manager / Escalation Modules
          </p>
        </div>
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

      {/* 2. APPROVAL FLOW DIAGRAM BANNER */}
      <div className="rounded-3xl border border-[#274690]/20 bg-linear-to-r from-[#274690]/10 to-[#c96f4a]/10 p-5 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-xs text-[#274690] font-black">
              <GitPullRequest size={16} />
            </span>
            <div>
              <h4 className="text-xs font-black text-[#274690]">Standard Multi-Tier Approval Workflow</h4>
              <p className="text-[11px] font-semibold text-slate-500">
                Team Leader reviews associate documents before sign-off or forwarding to Department Manager, Finance, or Legal.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-black text-slate-700">
            <span className="rounded-xl bg-white px-3 py-1 border border-slate-200">1. Associate</span>
            <ArrowRight size={13} className="text-[#274690]" />
            <span className="rounded-xl bg-[#274690] text-white px-3 py-1 shadow-xs">2. Team Lead</span>
            <ArrowRight size={13} className="text-[#c96f4a]" />
            <span className="rounded-xl bg-white px-3 py-1 border border-slate-200">3. Escalation / Dept Manager</span>
          </div>
        </div>
      </div>

      {/* 3. TABS & SEARCH */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex overflow-x-auto space-x-1.5 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xs">
          {[
            { key: "PENDING", label: "Pending Sign-Off" },
            { key: "APPROVED", label: "Approved" },
            { key: "REJECTED", label: "Rejected" },
            { key: "CHANGES_REQUESTED", label: "Changes Requested" },
            { key: "MY_APPROVALS", label: "All Approvals" },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key as ApprovalTab)}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-black transition ${
                activeTab === t.key
                  ? "bg-[#274690] text-white shadow-xs"
                  : "text-slate-500 hover:bg-[#274690]/5 hover:text-[#274690]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents, associates..."
            className="h-9 rounded-xl pl-9 text-xs font-semibold focus:border-[#274690]"
          />
        </div>
      </div>

      {/* 4. APPROVALS LIST TABLE */}
      <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Document Details</th>
                <th className="px-4 py-3.5">Submitted By</th>
                <th className="px-4 py-3.5">Date & Version</th>
                <th className="px-4 py-3.5">Priority</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Comments & Reviewer</th>
                <th className="px-5 py-3.5 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                    Loading approvals...
                  </td>
                </tr>
              ) : filteredApprovals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                    No approval requests found under this category.
                  </td>
                </tr>
              ) : (
                filteredApprovals.map((appr) => {
                  const docName = appr.documentName || "Document";
                  const submitter = appr.submittedBy || "Employee";
                  const submitDate = appr.submittedDate || appr.submittedAt || "Recent";
                  const priority = appr.priority || "HIGH";
                  const status = appr.status || "PENDING";
                  const docType = appr.documentType || appr.type || "Document";
                  const comments = appr.comments || appr.notes || "Pending verification";

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
                            <p className="text-[10px] text-slate-400 font-bold">{docType}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">{submitter}</p>
                          {appr.submittedEmail && <p className="text-[10px] text-slate-400">{appr.submittedEmail}</p>}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-[11px] text-slate-500">
                        <div>{submitDate}</div>
                        <span className="font-bold text-[#274690]">{appr.version || "v1.0"}</span>
                      </td>

                      <td className="px-4 py-4">
                        <Badge
                          className={`text-[9px] font-black ${
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
                              : status === "CHANGES_REQUESTED"
                              ? "bg-orange-100 text-orange-800"
                              : status === "REJECTED"
                              ? "bg-rose-100 text-rose-800"
                              : status === "FORWARDED"
                              ? "bg-indigo-100 text-indigo-800 border-indigo-200"
                              : "bg-[#c96f4a]/15 text-[#c96f4a] border-[#c96f4a]/30"
                          }`}
                        >
                          {status}
                        </Badge>
                      </td>

                      <td className="px-4 py-4 text-[11px] text-slate-500 max-w-[200px] truncate" title={comments}>
                        {comments}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedApproval(appr);
                            setReviewComment("");
                            setIsForwardMode(false);
                          }}
                          className="h-8 rounded-xl bg-[#274690] text-[11px] font-bold text-white hover:bg-[#1f3561] shadow-xs"
                        >
                          <Eye size={13} className="mr-1" /> Review & Action
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. APPROVAL REVIEW & FORWARD MODAL */}
      {selectedApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl border border-[#274690]/20 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-[#274690]">Review Approval Request</h3>
                <p className="text-xs font-semibold text-[#c96f4a] mt-0.5">{selectedApproval.documentName}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApproval(null)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Document Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Submitted By</span>
                <p className="font-extrabold text-slate-800">{selectedApproval.submittedBy || "Associate"}</p>
                <p className="text-[10px] text-slate-500 truncate">{selectedApproval.submittedEmail || ""}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Document Category</span>
                <p className="font-extrabold text-slate-800">{selectedApproval.documentType || selectedApproval.type || "General"}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Current Status</span>
                <Badge className="bg-[#274690]/10 text-[#274690] text-[10px] font-black mt-0.5">
                  {selectedApproval.status || "PENDING"}
                </Badge>
              </div>
            </div>

            {/* Workflow Steps Preview */}
            <div className="space-y-2 rounded-2xl bg-slate-50 p-4 border border-slate-100">
              <span className="text-[10px] font-black uppercase text-slate-400">Workflow Steps Progress:</span>
              <div className="space-y-1.5">
                {(selectedApproval.workflowSteps || [
                  { step: 1, name: "Employee Submission", by: selectedApproval.submittedBy || "Associate", status: "Submitted" },
                  { step: 2, name: "Team Leader Review", by: "Team Leader", status: "In Review" },
                  { step: 3, name: "Department Manager / Final Escalation", by: "Department Manager", status: "Pending" },
                ]).map((step: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#274690]/10 text-[10px] text-[#274690]">
                        {step.step || idx + 1}
                      </span>
                      <span className="text-slate-800">{step.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-semibold">{step.by} • {step.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Review Comment Input */}
            <div>
              <label className="text-[11px] font-black uppercase text-slate-600">Review Feedback / Decision Notes</label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Add comments, verification findings, or escalation notes..."
                className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-xs font-semibold focus:border-[#274690] focus:outline-none"
                rows={3}
              />
            </div>

            {/* Forward / Escalate to Another Module Accordion */}
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-black text-indigo-900">
                  <Share2 size={15} className="text-indigo-600" />
                  <span>Send / Escalate to Another Module for Approval</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsForwardMode(!isForwardMode)}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline"
                >
                  {isForwardMode ? "Hide Options" : "+ Select Module"}
                </button>
              </div>

              {isForwardMode && (
                <div className="space-y-2 pt-1">
                  <label className="text-[10px] font-black uppercase text-indigo-700">Choose Destination Module:</label>
                  <select
                    value={selectedForwardTarget}
                    onChange={(e) => setSelectedForwardTarget(e.target.value)}
                    className="h-9 w-full rounded-xl border border-indigo-200 bg-white px-3 text-xs font-bold text-slate-800 focus:border-[#274690]"
                  >
                    {forwardModuleOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-indigo-600 font-medium">
                    {forwardModuleOptions.find((m) => m.id === selectedForwardTarget)?.desc}
                  </p>
                  <Button
                    size="sm"
                    disabled={actionLoading}
                    onClick={() => handleProcessAction("FORWARD")}
                    className="w-full h-9 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 gap-1.5 shadow-xs"
                  >
                    <Send size={13} /> Forward to {selectedForwardTarget}
                  </Button>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={actionLoading}
                  onClick={() => handleProcessAction("REQUEST_CHANGES")}
                  className="rounded-xl border-[#c96f4a]/40 text-[#c96f4a] text-xs font-bold hover:bg-[#c96f4a]/10"
                >
                  Request Changes
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={actionLoading}
                  onClick={() => handleProcessAction("REJECT")}
                  className="rounded-xl border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-50"
                >
                  Reject
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  disabled={actionLoading}
                  onClick={() => handleProcessAction("APPROVE")}
                  className="rounded-xl bg-[#274690] text-xs font-black text-white hover:bg-[#1f3561] gap-1.5 shadow-sm"
                >
                  <Check size={14} /> Approve & Sign-Off
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
