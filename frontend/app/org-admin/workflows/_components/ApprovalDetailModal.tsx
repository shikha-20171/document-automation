"use client";

import { useState } from "react";
import { X, CheckCircle2, XCircle, RotateCcw, ChevronRight, ChevronDown } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { workflowApi } from "@/services/workflowApi";

interface ApprovalDetailModalProps {
  request: {
    id: string;
    document: string;
    requestedBy: string;
    approver: string;
    status: "Pending" | "Approved" | "Rejected" | "Changes Requested" | "Overdue";
  };
  onClose: () => void;
  onStatusChange: (status: "Pending" | "Approved" | "Rejected" | "Changes Requested" | "Overdue") => void;
}

interface TimelineStep {
  name: string;
  status: "completed" | "current" | "pending";
}

const timelineSteps: TimelineStep[] = [
  { name: "Document Submitted", status: "completed" },
  { name: "Department Manager Approved", status: "completed" },
  { name: "Finance Verification", status: "completed" },
  { name: "Organisation Admin Sign-off", status: "current" },
  { name: "Digital Certification & Archive", status: "pending" },
];

export default function ApprovalDetailModal({ request, onClose, onStatusChange }: ApprovalDetailModalProps) {
  const [action, setAction] = useState<"approve" | "reject" | "changes" | null>(null);
  const [comment, setComment] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      await workflowApi.processOrgApprovalAction(request.id, { action: "APPROVE", comment });
    } catch {
      // Fallback
    } finally {
      setSubmitting(false);
      onStatusChange("Approved");
      setAction(null);
      setComment("");
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setSubmitting(true);
    try {
      await workflowApi.processOrgApprovalAction(request.id, { action: "REJECT", comment: rejectReason });
    } catch {
      // Fallback
    } finally {
      setSubmitting(false);
      onStatusChange("Rejected");
      setAction(null);
      setRejectReason("");
    }
  };

  const handleRequestChanges = async () => {
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await workflowApi.processOrgApprovalAction(request.id, { action: "REQUEST_CHANGES", comment });
    } catch {
      // Fallback
    } finally {
      setSubmitting(false);
      onStatusChange("Changes Requested");
      setAction(null);
      setComment("");
    }
  };

  const getStepIcon = (status: "completed" | "current" | "pending") => {
    if (status === "completed") return <CheckCircle2 size={16} className="text-emerald-600" />;
    if (status === "current") return <ChevronDown size={16} className="text-amber-600 animate-pulse" />;
    return <ChevronRight size={16} className="text-slate-300" />;
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Approval Details">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-900">{request.document}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                request.status === "Pending" ? "bg-amber-100 text-amber-800" :
                request.status === "Approved" ? "bg-emerald-100 text-emerald-800" :
                request.status === "Rejected" ? "bg-red-100 text-red-800" :
                "bg-blue-100 text-blue-800"
              }`}>
                {request.status}
              </Badge>
              <span className="text-[11px] text-slate-500">Requested by {request.requestedBy}</span>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 font-bold flex items-center justify-center">
            ✕
          </button>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50/50">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Requested By</p>
            <p className="text-xs font-semibold text-slate-800 mt-1">{request.requestedBy}</p>
          </div>
          <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50/50">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Department</p>
            <p className="text-xs font-semibold text-slate-800 mt-1">{request.approver}</p>
          </div>
          <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50/50">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Workflow</p>
            <p className="text-xs font-semibold text-slate-800 mt-1">Standard Approval</p>
          </div>
          <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50/50">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Current Step</p>
            <p className="text-xs font-semibold text-slate-800 mt-1">Admin Review</p>
          </div>
        </div>

        {/* Document Preview */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 text-center">
          <div className="h-32 w-full max-w-md mx-auto rounded-2xl bg-white border border-slate-200 flex items-center justify-center">
            <p className="text-xs font-bold text-slate-400">Document Preview</p>
          </div>
          <p className="text-xs text-slate-500 mt-2">{request.document}</p>
        </div>

        {/* Approval History Timeline */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Approval History</h4>
          <div className="space-y-2">
            {timelineSteps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-3 text-xs">
                <div className="shrink-0">{getStepIcon(step.status)}</div>
                <span className={`font-medium ${step.status === "completed" ? "text-slate-800" : step.status === "current" ? "text-amber-700" : "text-slate-400"}`}>
                  {step.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        {request.status === "Pending" && action === null && (
          <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
            <Button onClick={() => setAction("approve")} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs flex items-center gap-2">
              <CheckCircle2 size={14} /> Approve
            </Button>
            <Button onClick={() => setAction("reject")} className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl text-xs flex items-center gap-2">
              <XCircle size={14} /> Reject
            </Button>
            <Button onClick={() => setAction("changes")} className="bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl text-xs flex items-center gap-2">
              <RotateCcw size={14} /> Request Changes
            </Button>
          </div>
        )}

        {/* Inline Actions */}
        {action === "approve" && (
          <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 space-y-3">
            <p className="text-xs font-bold text-emerald-800">Add a comment (optional)</p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Enter approval comment..."
              rows={2}
              className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-medium focus:outline-none resize-none"
            />
            <div className="flex items-center gap-3">
              <Button onClick={handleApprove} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs">
                Confirm Approval
              </Button>
              <Button onClick={() => setAction(null)} variant="outline" className="text-xs font-bold rounded-xl">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {action === "reject" && (
          <div className="p-4 rounded-2xl border border-red-200 bg-red-50/50 space-y-3">
            <p className="text-xs font-bold text-red-800">Rejection reason (required)</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              rows={2}
              className="w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-medium focus:outline-none resize-none"
            />
            <div className="flex items-center gap-3">
              <Button onClick={handleReject} disabled={!rejectReason.trim()} className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-xs disabled:opacity-50">
                Confirm Rejection
              </Button>
              <Button onClick={() => setAction(null)} variant="outline" className="text-xs font-bold rounded-xl">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {action === "changes" && (
          <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 space-y-3">
            <p className="text-xs font-bold text-amber-800">Requested changes (required)</p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe the changes needed..."
              rows={2}
              className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-medium focus:outline-none resize-none"
            />
            <div className="flex items-center gap-3">
              <Button onClick={handleRequestChanges} disabled={!comment.trim()} className="bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs disabled:opacity-50">
                Submit Request
              </Button>
              <Button onClick={() => setAction(null)} variant="outline" className="text-xs font-bold rounded-xl">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
