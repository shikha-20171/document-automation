"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Filter,
  Send,
  AlertCircle,
  FileText,
  UserCheck,
  RotateCcw,
  Eye,
  History,
  X,
  Sparkles,
} from "lucide-react";
import { approvalsApi } from "@/services/approvalsApi";

export default function EmployeeApprovalsPage() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Resubmit Modal
  const [resubmitItem, setResubmitItem] = useState<any>(null);
  const [resubmitNotes, setResubmitNotes] = useState("");
  const [resubmitContent, setResubmitContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fetchApprovals = async () => {
    setLoading(true);
    const res = await approvalsApi.getApprovals({ status: statusFilter });
    if (res?.data) {
      setApprovals(res.data.approvals || []);
      setStats(res.data.stats || {});
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApprovals();
  }, [statusFilter]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleOpenResubmit = (appr: any) => {
    setResubmitItem(appr);
    setResubmitNotes("");
    setResubmitContent(
      `Updated Content for ${appr.documentName}\n\n- Revised line item pricing with 18% GST discount.\n- Attached formal vendor authorization letter.`
    );
  };

  const handleResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resubmitItem) return;
    setSubmitting(true);
    try {
      await approvalsApi.resubmitApproval(resubmitItem.id, {
        content: resubmitContent,
        notes: resubmitNotes,
      });
      showToast("Document corrections submitted! Under review with Team Leader.");
      setResubmitItem(null);
      fetchApprovals();
    } catch {
      showToast("Failed to resubmit. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#274690]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#274690] border border-[#274690]/20">
              Workflow Participation
            </span>
            <span className="text-xs text-slate-400">Employee Approval Lifecycle</span>
          </div>
          <h1 className="mt-1 text-xl font-black text-slate-800 sm:text-2xl">Approvals Tracker</h1>
          <p className="mt-1 text-xs text-slate-500">
            Monitor submissions through review stages, review manager comments, make revisions, and resubmit rejected items.
          </p>
        </div>
      </div>

      {/* Toast Alert */}
      {toast && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      {/* Workflow Stage Visualizer Indicator */}
      <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-md">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Standard Approval Stages</h3>
        <div className="mt-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#274690]/10 text-[#274690] font-black text-xs">
              1
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Submitted</div>
              <div className="text-[10px] text-slate-400">Employee submits document draft</div>
            </div>
          </div>

          <div className="hidden h-0.5 w-12 bg-slate-200 md:block" />

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#c96f4a]/10 text-[#c96f4a] font-black text-xs">
              2
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Under Review</div>
              <div className="text-[10px] text-slate-400">Team Leader / Manager review</div>
            </div>
          </div>

          <div className="hidden h-0.5 w-12 bg-slate-200 md:block" />

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-black text-xs">
              3
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Approved / Rejected</div>
              <div className="text-[10px] text-slate-400">Signed or changes requested</div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter("ALL")}
          className={`rounded-2xl px-4 py-2 text-xs font-bold transition ${
            statusFilter === "ALL"
              ? "bg-[#274690] text-white shadow-sm"
              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          All Requests ({stats.total || 0})
        </button>
        <button
          onClick={() => setStatusFilter("Pending Approval")}
          className={`rounded-2xl px-4 py-2 text-xs font-bold transition ${
            statusFilter === "Pending Approval"
              ? "bg-purple-700 text-white shadow-sm"
              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          Under Review ({stats.pending || 0})
        </button>
        <button
          onClick={() => setStatusFilter("Approved")}
          className={`rounded-2xl px-4 py-2 text-xs font-bold transition ${
            statusFilter === "Approved"
              ? "bg-emerald-700 text-white shadow-sm"
              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          Approved ({stats.approved || 0})
        </button>
        <button
          onClick={() => setStatusFilter("Rejected")}
          className={`rounded-2xl px-4 py-2 text-xs font-bold transition ${
            statusFilter === "Rejected"
              ? "bg-rose-700 text-white shadow-sm"
              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          Changes Requested / Rejected ({stats.rejected || 0})
        </button>
      </div>

      {/* Approvals Cards */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#274690] border-t-transparent" />
        </div>
      ) : approvals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200/80 bg-white/80 p-12 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
            <CheckCircle2 size={28} />
          </div>
          <h3 className="mt-3 text-base font-bold text-slate-800">No Approvals Found</h3>
          <p className="mt-1 text-xs text-slate-500">No items found matching this stage filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md"
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                      item.status === "Approved"
                        ? "bg-emerald-50 text-emerald-600"
                        : item.status === "Rejected"
                        ? "bg-rose-50 text-rose-600"
                        : "bg-purple-50 text-purple-600"
                    }`}
                  >
                    <FileText size={22} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-800">{item.documentName}</h3>
                      <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        {item.category}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-slate-500">
                      Workflow: <span className="font-semibold text-slate-700">{item.workflowName}</span>
                    </p>

                    <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 font-semibold text-slate-600">
                        <UserCheck size={13} />
                        <span>Reviewer: {item.reviewerName} ({item.reviewerRole})</span>
                      </span>
                      <span>•</span>
                      <span>Submitted: {item.submittedAt}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-start">
                  <span
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold border ${
                      item.status === "Approved"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : item.status === "Rejected"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-purple-50 text-purple-700 border-purple-200"
                    }`}
                  >
                    {item.status}
                  </span>

                  {item.status === "Rejected" && (
                    <button
                      onClick={() => handleOpenResubmit(item)}
                      className="flex items-center gap-1 rounded-xl bg-linear-to-r from-[#c96f4a] to-[#e0835d] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:brightness-110"
                    >
                      <RotateCcw size={13} />
                      <span>Correct & Resubmit</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Rejection / Reviewer Comments Callout */}
              {item.rejectionReason && (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertCircle size={15} className="text-rose-600" />
                    <span>Rejection Reason:</span>
                  </div>
                  <p className="mt-1 text-rose-700 leading-relaxed">{item.rejectionReason}</p>
                </div>
              )}

              {/* Reviewer Comments Feed */}
              {item.comments?.length > 0 && (
                <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 text-xs">
                  <span className="font-bold text-slate-700">Reviewer Notes:</span>
                  <div className="mt-1 space-y-1.5">
                    {item.comments.map((c: any, idx: number) => (
                      <div key={idx} className="text-slate-600">
                        <span className="font-semibold text-slate-800">{c.user}: </span>
                        <span>{c.text}</span>
                        <span className="text-[10px] text-slate-400 ml-2">({c.time})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Approval History Timeline */}
              <div className="mt-4 border-t border-slate-100 pt-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Approval Trail</span>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {(item.history || []).map((h: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${
                          h.status === "COMPLETED"
                            ? "bg-emerald-500 text-white"
                            : h.status === "REJECTED"
                            ? "bg-rose-500 text-white"
                            : "bg-purple-500 text-white"
                        }`}
                      >
                        ✓
                      </span>
                      <span className="font-semibold text-slate-700">{h.step}</span>
                      <span className="text-slate-400">({h.time})</span>
                      {idx !== item.history.length - 1 && <span className="text-slate-300">→</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MAKE CORRECTIONS & RESUBMIT MODAL */}
      {resubmitItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="flex h-[85vh] w-full max-w-2xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#c96f4a]">
                  <RotateCcw size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Correct & Resubmit Approval</h3>
                  <p className="text-xs text-slate-500">{resubmitItem.documentName}</p>
                </div>
              </div>
              <button onClick={() => setResubmitItem(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleResubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs">
                <span className="font-bold text-rose-800">Addressing Feedback: </span>
                <span className="text-rose-700">{resubmitItem.rejectionReason}</span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Correction Remarks / Change Notes</label>
                <textarea
                  rows={2}
                  value={resubmitNotes}
                  onChange={(e) => setResubmitNotes(e.target.value)}
                  placeholder="Explain the changes made (e.g. Added vendor discount rate and attached formal PO letter)..."
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 outline-none focus:border-[#274690]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Updated Document Content</label>
                <textarea
                  rows={10}
                  value={resubmitContent}
                  onChange={(e) => setResubmitContent(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-800 outline-none focus:border-[#274690]"
                  required
                />
              </div>
            </form>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 p-4">
              <button
                type="button"
                onClick={() => setResubmitItem(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResubmit}
                disabled={submitting}
                className="flex items-center gap-1.5 rounded-xl bg-linear-to-r from-[#274690] to-[#1e3a8a] px-4 py-2 text-xs font-bold text-white shadow-sm hover:brightness-110 disabled:opacity-50"
              >
                <Send size={14} />
                <span>{submitting ? "Resubmitting..." : "Resubmit for Approval"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
