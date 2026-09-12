"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CheckCircle2, XCircle, Clock, AlertCircle, Eye, ArrowRight,
  RefreshCw, MessageSquare, Send, PenTool, FileText, UserCheck,
  ShieldCheck, ExternalLink, X, ChevronRight, CornerUpRight
} from "lucide-react";
import apiClient from "@/lib/axios";

export type RoleType = "ORGANISATION_ADMIN" | "DEPARTMENT_MANAGER" | "TEAM_LEADER" | "STAFF";

interface ApprovalWorkspaceProps {
  role: RoleType;
  roleDisplayName?: string;
}

export default function ApprovalWorkspace({
  role,
  roleDisplayName = "Approver",
}: ApprovalWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<"PENDING" | "APPROVED" | "REJECTED" | "MY_SUBMISSIONS">("PENDING");
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeRequest, setActiveRequest] = useState<any | null>(null);

  // Action form state inside drawer
  const [actionComment, setActionComment] = useState<string>("");
  const [forwardRole, setForwardRole] = useState<string>(
    role === "DEPARTMENT_MANAGER" ? "ORGANISATION_ADMIN" : "DEPARTMENT_MANAGER"
  );
  const [isSubmittingAction, setIsSubmittingAction] = useState<boolean>(false);

  // Signature Modal right from Approved Document
  const [signatureModalDoc, setSignatureModalDoc] = useState<any | null>(null);
  const [signerName, setSignerName] = useState<string>("");
  const [signerEmail, setSignerEmail] = useState<string>("");
  const [isDispatchingSignature, setIsDispatchingSignature] = useState<boolean>(false);

  const [toast, setToast] = useState<{ title: string; desc?: string; type: "success" | "error" } | null>(null);

  const showToast = (title: string, desc?: string, type: "success" | "error" = "success") => {
    setToast({ title, desc, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/approvals", {
        params: { tab: activeTab },
      });
      if (res.data?.success) {
        setRequests(res.data.data || []);
      }
    } catch (err: any) {
      console.error("Failed to fetch approvals:", err);
      showToast("Error", err.response?.data?.message || err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  // Handle Approver Action (APPROVE, REJECT, REQUEST_CHANGES, FORWARD)
  const handleAction = async (action: "APPROVE" | "REJECT" | "REQUEST_CHANGES" | "FORWARD") => {
    if (!activeRequest) return;
    setIsSubmittingAction(true);
    try {
      const forwardTarget =
        action === "FORWARD"
          ? forwardRole
          : role === "TEAM_LEADER"
          ? "DEPARTMENT_MANAGER"
          : role === "DEPARTMENT_MANAGER"
          ? "ORGANISATION_ADMIN"
          : undefined;

      const res = await apiClient.post(`/approvals/${activeRequest.id}/action`, {
        action,
        comment: actionComment,
        forwardToRole: forwardTarget,
      });

      if (res.data?.success) {
        const updated = res.data.data;
        const msg =
          action === "APPROVE"
            ? role === "TEAM_LEADER"
              ? "Approved & routed to Department Manager review queue"
              : role === "DEPARTMENT_MANAGER"
              ? "Approved & forwarded to Organisation Admin review queue"
              : "Final enterprise approval granted! Ready for e-signature."
            : action === "FORWARD"
            ? `Successfully forwarded to ${forwardRole === "ORGANISATION_ADMIN" ? "Organisation Admin" : "Department Manager"}`
            : `Request marked as ${action.toLowerCase()}`;

        showToast(`Approval ${action}`, msg);
        setActiveRequest(updated);
        fetchApprovals();
        setActionComment("");
      }
    } catch (err: any) {
      showToast("Action Failed", err.response?.data?.message || err.message, "error");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Dispatch Signature directly from Approval Drawer
  const handleSendForSignature = async () => {
    const docId = signatureModalDoc?.unifiedDocumentId || signatureModalDoc?.id;
    if (!docId || !signerEmail) return;

    setIsDispatchingSignature(true);
    try {
      const res = await apiClient.post(`/unified-documents/${docId}/send-for-signature`, {
        signerName,
        signerEmail,
      });

      if (res.data?.success) {
        showToast("Signature Dispatched", `Signature link sent to ${signerEmail}`);
        setSignatureModalDoc(null);
        fetchApprovals();
      }
    } catch (err: any) {
      showToast("Signature Send Failed", err.response?.data?.message || err.message, "error");
    } finally {
      setIsDispatchingSignature(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border text-sm font-medium transition-all ${
            toast.type === "success"
              ? "bg-emerald-900/90 border-emerald-700 text-emerald-100"
              : "bg-rose-900/90 border-rose-700 text-rose-100"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
          <div>
            <div className="font-semibold">{toast.title}</div>
            {toast.desc && <div className="text-xs opacity-90">{toast.desc}</div>}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#274690]/10 dark:bg-[#274690]/25 text-[#274690] dark:text-[#8fb1ec] border border-[#274690]/20">
              {roleDisplayName} Queue
            </span>
            <span className="text-xs text-slate-400 font-medium">• Multi-Tier Document Verification</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">
            Enterprise Approval Workflow
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review document submissions, verify deliverables and commercials, request changes, and route approved documents forward.
          </p>
        </div>

        <button
          onClick={() => fetchApprovals()}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-[#274690]/5 hover:border-[#274690]/40 text-slate-600 dark:text-slate-300 hover:text-[#274690] dark:hover:text-[#8fb1ec] transition flex items-center gap-2 text-xs font-bold"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#274690]" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("PENDING")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "PENDING"
              ? "bg-[#274690] text-white shadow-md shadow-[#274690]/25"
              : "text-slate-600 dark:text-slate-400 hover:text-[#274690] dark:hover:text-[#8fb1ec] hover:bg-[#274690]/5"
          }`}
        >
          Pending Review
        </button>
        <button
          onClick={() => setActiveTab("APPROVED")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "APPROVED"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-[#274690] dark:hover:text-[#8fb1ec] hover:bg-[#274690]/5"
          }`}
        >
          Approved Documents
        </button>
        <button
          onClick={() => setActiveTab("REJECTED")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "REJECTED"
              ? "bg-rose-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-[#274690] dark:hover:text-[#8fb1ec] hover:bg-[#274690]/5"
          }`}
        >
          Rejected / Changes
        </button>
        <button
          onClick={() => setActiveTab("MY_SUBMISSIONS")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "MY_SUBMISSIONS"
              ? "bg-[#1f3561] text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-[#274690] dark:hover:text-[#8fb1ec] hover:bg-[#274690]/5"
          }`}
        >
          My Submissions
        </button>
      </div>

      {/* Requests Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Document</th>
                <th className="py-3 px-3">Submitted By</th>
                <th className="py-3 px-3">Assigned Approver</th>
                <th className="py-3 px-3">Submission Date</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {requests.length === 0 && !loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-400">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="font-medium">No approval requests in this queue</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Everything has been processed or none have been submitted.
                    </p>
                  </td>
                </tr>
              ) : (
                requests.map((req, idx) => {
                  const doc = req.unifiedDocument || req.document;
                  return (
                    <tr key={req.id ? `req-${req.id}` : `req-idx-${idx}`} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-medium">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#274690]/10 dark:bg-[#274690]/25 flex items-center justify-center text-[#274690] dark:text-[#8fb1ec] flex-shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                              {doc?.title || req.documentName || "Enterprise Document"}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {doc?.documentNumber || `REQ-${req.id}`}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {req.requestedBy?.full_name || req.submittedBy || "Employee"}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {req.requestedBy?.email || req.submittedEmail || ""}
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex flex-col gap-1">
                          <span className="px-2.5 py-0.5 rounded-full bg-[#274690]/10 dark:bg-[#274690]/25 text-[#274690] dark:text-[#8fb1ec] border border-[#274690]/20 font-bold text-[11px] inline-flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3 text-[#274690] dark:text-[#8fb1ec]" />
                            <span>
                              {req.status === "APPROVED"
                                ? "Approved (Stage 3/3 Complete)"
                                : req.stage === "STAGE_DEPARTMENT_MANAGER" || req.currentStepOrder === 2
                                ? "Step 2: Dept Manager"
                                : req.stage === "STAGE_ORGANISATION_ADMIN" || req.currentStepOrder === 3
                                ? "Step 3: Org Admin"
                                : "Step 1: Team Leader"}
                            </span>
                          </span>
                          {req.previousApprover && req.previousApprover !== "None" && (
                            <span className="text-[10px] text-slate-400">
                              Reviewed by: {req.previousApprover}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">
                        {new Date(req.submittedDate || req.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            req.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                              : req.status === "REJECTED"
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                              : "bg-[#274690]/10 text-[#274690] dark:bg-[#274690]/25 dark:text-[#8fb1ec] border border-[#274690]/20"
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setActiveRequest(req);
                            setActionComment("");
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#274690] hover:bg-[#1f3561] text-white text-xs font-bold shadow-sm shadow-[#274690]/20 transition"
                        >
                          <span>Review</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* APPROVAL DETAILS DRAWER */}
      {/* ========================================================================= */}
      {activeRequest && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col justify-between overflow-hidden border-l border-slate-200 dark:border-slate-800">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-white via-white to-[#274690]/5 dark:from-slate-900 dark:to-[#274690]/15">
              <div>
                <span className="text-[10px] font-mono text-[#274690] dark:text-[#8fb1ec] font-bold uppercase">
                  Approval Request Review
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {activeRequest.unifiedDocument?.title || activeRequest.documentName || "Document"}
                </h2>
              </div>
              <button
                onClick={() => setActiveRequest(null)}
                className="p-1.5 rounded-lg hover:bg-[#274690]/10 hover:text-[#274690] text-slate-500 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-700 dark:text-slate-300">
              {/* Multi-Tier Workflow Stepper */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-[#274690]/5 dark:from-slate-800/80 dark:to-[#274690]/15 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-[#274690] dark:text-[#8fb1ec] tracking-wider">
                    Hierarchical Approval Workflow
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {activeRequest.status === "APPROVED" ? "All Steps Approved" : `Current: Step ${activeRequest.currentStepOrder || 1} of 3`}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-1 sm:gap-2">
                  {/* Step 1 */}
                  <div
                    className={`flex-1 p-2.5 rounded-xl border text-center transition-all ${
                      (activeRequest.currentStepOrder || 1) > 1 || activeRequest.status === "APPROVED"
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-300 font-bold"
                        : (activeRequest.currentStepOrder || 1) === 1 && activeRequest.status === "PENDING"
                        ? "bg-[#274690]/10 dark:bg-[#274690]/25 border-[#274690] text-[#274690] dark:text-[#8fb1ec] font-black ring-2 ring-[#274690]/30 shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 border-slate-200 text-slate-400"
                    }`}
                  >
                    <div className="text-[10px] uppercase tracking-wider font-bold">Step 1</div>
                    <div className="text-xs font-semibold">Team Leader</div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />

                  {/* Step 2 */}
                  <div
                    className={`flex-1 p-2.5 rounded-xl border text-center transition-all ${
                      (activeRequest.currentStepOrder || 1) > 2 || activeRequest.status === "APPROVED"
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-300 font-bold"
                        : (activeRequest.currentStepOrder || 1) === 2 && activeRequest.status === "PENDING"
                        ? "bg-[#274690]/10 dark:bg-[#274690]/25 border-[#274690] text-[#274690] dark:text-[#8fb1ec] font-black ring-2 ring-[#274690]/30 shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 border-slate-200 text-slate-400"
                    }`}
                  >
                    <div className="text-[10px] uppercase tracking-wider font-bold">Step 2</div>
                    <div className="text-xs font-semibold">Dept Manager</div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />

                  {/* Step 3 */}
                  <div
                    className={`flex-1 p-2.5 rounded-xl border text-center transition-all ${
                      activeRequest.status === "APPROVED"
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-300 font-bold"
                        : (activeRequest.currentStepOrder || 1) === 3 && activeRequest.status === "PENDING"
                        ? "bg-[#274690]/10 dark:bg-[#274690]/25 border-[#274690] text-[#274690] dark:text-[#8fb1ec] font-black ring-2 ring-[#274690]/30 shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 border-slate-200 text-slate-400"
                    }`}
                  >
                    <div className="text-[10px] uppercase tracking-wider font-bold">Step 3</div>
                    <div className="text-xs font-semibold">Org Admin</div>
                  </div>
                </div>
              </div>

              {/* Submission Details Card */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Submitted By</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {activeRequest.requestedBy?.full_name || activeRequest.submittedBy || "Employee Associate"}
                  </span>
                  <div className="text-[11px] text-slate-500">{activeRequest.requestedBy?.email || activeRequest.submittedEmail}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Department & Team</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {activeRequest.department || activeRequest.unifiedDocument?.departmentName || "Operations"}
                  </span>
                  <div className="text-[11px] text-slate-500">
                    {activeRequest.team || activeRequest.unifiedDocument?.teamName || "General Team"}
                  </div>
                </div>
              </div>

              {/* Document Sections Preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Document Content</h3>
                  {activeRequest.unifiedDocumentId && (
                    <Link
                      href={`/documents/editor?id=${activeRequest.unifiedDocumentId}`}
                      className="text-[#274690] hover:text-[#1f3561] dark:text-[#8fb1ec] font-bold flex items-center gap-1 hover:underline"
                    >
                      Open Full Editor <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>

                {activeRequest.unifiedDocument?.content && Array.isArray(activeRequest.unifiedDocument.content) ? (
                  <div className="space-y-3">
                    {activeRequest.unifiedDocument.content.map((sec: any, idx: number) => (
                      <div key={sec.id ? `sec-${sec.id}` : `sec-idx-${idx}`} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <div className="font-semibold text-slate-900 dark:text-white text-xs mb-1">
                          {sec.title}
                        </div>
                        {sec.body && <p className="text-slate-600 dark:text-slate-400 whitespace-pre-line">{sec.body}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">Document text content ready for review.</p>
                )}
              </div>

              {/* Comments / Audit Trail */}
              {activeRequest.actions && activeRequest.actions.length > 0 && (
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">Review History</h3>
                  <div className="space-y-2">
                    {activeRequest.actions.map((act: any, idx: number) => {
                      const actDate = act.createdAt || act.time ? new Date(act.createdAt || act.time) : null;
                      const formattedDate = actDate && !isNaN(actDate.getTime()) ? actDate.toLocaleString() : "Recently";
                      return (
                        <div
                          key={act.id ? `act-${act.id}` : `act-idx-${idx}-${act.action || "step"}`}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px]"
                        >
                          <div className="flex items-center justify-between font-semibold">
                            <span className="text-slate-800 dark:text-slate-200">
                              {act.action}
                              {act.user && <span className="font-normal text-slate-400 ml-1.5">• {act.user}</span>}
                            </span>
                            <span className="text-slate-400">{formattedDate}</span>
                          </div>
                          {act.comment && <p className="mt-1 text-slate-600 dark:text-slate-300">{act.comment}</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Reviewer Action Form (Only if Pending) */}
              {activeRequest.status === "PENDING" && (
                <div className="p-4 rounded-2xl border border-[#274690]/30 dark:border-[#274690]/50 bg-[#274690]/5 dark:bg-[#274690]/10 space-y-3">
                  <h4 className="font-bold text-xs text-[#274690] dark:text-[#8fb1ec] uppercase tracking-wider">
                    Provide Decision & Notes
                  </h4>
                  <textarea
                    rows={3}
                    placeholder="Enter approval feedback or required modifications..."
                    value={actionComment}
                    onChange={(e) => setActionComment(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#274690] focus:border-[#274690]"
                  />

                  {role !== "ORGANISATION_ADMIN" && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Forward Target:</span>
                      <select
                        value={forwardRole}
                        onChange={(e) => setForwardRole(e.target.value)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-[#274690] outline-none"
                      >
                        {role === "TEAM_LEADER" && (
                          <option value="DEPARTMENT_MANAGER">Department Manager (Step 2)</option>
                        )}
                        <option value="ORGANISATION_ADMIN">Organisation Admin (Step 3)</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* IMMEDIATE SEND FOR SIGNATURE PROMPT (When APPROVED) */}
              {activeRequest.status === "APPROVED" && (
                <div className="p-5 rounded-2xl border-2 border-[#274690]/30 dark:border-[#274690]/60 bg-[#274690]/5 dark:bg-[#274690]/15 space-y-3">
                  <div className="flex items-center gap-2 text-[#274690] dark:text-[#8fb1ec] font-bold text-xs uppercase tracking-wider">
                    <PenTool className="w-4 h-4" /> Next Step: E-Signature Routing
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    This document has passed enterprise verification. You can dispatch it directly for digital signature right now.
                  </p>
                  <button
                    onClick={() => {
                      const doc = activeRequest.unifiedDocument || activeRequest;
                      setSignatureModalDoc(doc);
                      setSignerName(doc.clientName || "");
                      setSignerEmail(doc.clientEmail || "");
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#274690] hover:bg-[#1f3561] text-white text-xs font-bold shadow-md shadow-[#274690]/25 flex items-center justify-center gap-2 transition"
                  >
                    <PenTool className="w-4 h-4" />
                    <span>Send for Signature Now</span>
                  </button>
                </div>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
              <button
                onClick={() => setActiveRequest(null)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Close
              </button>

              {activeRequest.status === "PENDING" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAction("REQUEST_CHANGES")}
                    disabled={isSubmittingAction}
                    className="px-3 py-2 rounded-xl bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 text-xs font-semibold hover:bg-orange-200 transition disabled:opacity-50"
                  >
                    Request Changes
                  </button>
                  <button
                    onClick={() => handleAction("REJECT")}
                    disabled={isSubmittingAction}
                    className="px-3 py-2 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs font-semibold hover:bg-rose-200 transition disabled:opacity-50"
                  >
                    Reject
                  </button>
                  {role !== "ORGANISATION_ADMIN" && (
                    <button
                      onClick={() => handleAction("FORWARD")}
                      disabled={isSubmittingAction}
                      className="px-3.5 py-2 rounded-xl bg-[#274690]/10 hover:bg-[#274690]/20 dark:bg-[#274690]/25 dark:hover:bg-[#274690]/35 border border-[#274690]/30 text-[#274690] dark:text-[#8fb1ec] text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <CornerUpRight className="w-3.5 h-3.5" />
                      <span>Forward</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleAction("APPROVE")}
                    disabled={isSubmittingAction}
                    className="px-4 py-2 rounded-xl bg-[#274690] hover:bg-[#1f3561] text-white text-xs font-bold shadow-md shadow-[#274690]/25 transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {role === "TEAM_LEADER"
                        ? "Approve & Send to Dept Manager"
                        : role === "DEPARTMENT_MANAGER"
                        ? "Approve & Send to Org Admin"
                        : "Final Approve Document"}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SIGNATURE MODAL DISPATCHED FROM APPROVAL */}
      {/* ========================================================================= */}
      {signatureModalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 space-y-4 border border-slate-200 dark:border-slate-800">
            <h2 className="font-bold text-base text-slate-900 dark:text-white">Route for Digital Signature</h2>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Signer Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#274690] focus:border-[#274690]"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Signer Email</label>
                <input
                  type="email"
                  placeholder="signer@company.com"
                  value={signerEmail}
                  onChange={(e) => setSignerEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#274690] focus:border-[#274690]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setSignatureModalDoc(null)} className="px-3 py-2 text-xs font-semibold">Cancel</button>
              <button
                onClick={handleSendForSignature}
                disabled={isDispatchingSignature || !signerEmail}
                className="px-4 py-2 bg-[#274690] hover:bg-[#1f3561] text-white text-xs font-bold rounded-xl disabled:opacity-50 shadow-md shadow-[#274690]/25 transition"
              >
                {isDispatchingSignature ? "Dispatching..." : "Send for Signature"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
