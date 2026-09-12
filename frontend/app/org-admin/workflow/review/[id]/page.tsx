"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  FileText,
  User,
  Building2,
  Calendar,
  PenTool,
  Share2,
  Download,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Send,
  ChevronRight,
  Info,
  Check,
  Eye,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import workflowApi from "@/services/workflowApi";

interface StepItem {
  id: string;
  label: string;
  role: string;
  subtitle: string;
  state: "completed" | "current" | "pending" | "rejected" | "changes_requested" | "skipped";
  completedBy?: string | null;
  date?: string | null;
}

interface ReviewPageProps {
  params: Promise<{ id: string }>;
}

export default function DocumentReviewPage({ params }: ReviewPageProps) {
  const resolvedParams = use(params);
  const docId = resolvedParams.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [documentData, setDocumentData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [modalType, setModalType] = useState<"APPROVE" | "REJECT" | "REQUEST_CHANGES" | null>(null);
  const [actionComment, setActionComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Side Tab state
  const [sidebarTab, setSidebarTab] = useState<"details" | "history" | "comments" | "versions">("details");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchDocumentReview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await workflowApi.getDocumentReview(docId);
      if (res.success && res.data) {
        setDocumentData(res.data);
      } else {
        setError(res.message || "Unable to load document review data.");
      }
    } catch (err: any) {
      console.error("Failed to load review data:", err);
      setError(err?.response?.data?.message || err.message || "Failed to load document.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (docId) {
      void fetchDocumentReview();
    }
  }, [docId]);

  const handleActionSubmit = async () => {
    if (!modalType) return;
    setSubmitting(true);
    try {
      if (modalType === "REQUEST_CHANGES") {
        if (!actionComment.trim()) {
          showToast("A reason/comment is required when requesting changes.");
          setSubmitting(false);
          return;
        }
        const res = await workflowApi.requestDocumentChanges(docId, actionComment.trim());
        if (res.success) {
          showToast("Changes requested. Document sent back to creator.");
          setModalType(null);
          setActionComment("");
          await fetchDocumentReview();
        } else {
          showToast(res.message || "Action failed.");
        }
      } else if (modalType === "REJECT") {
        if (!actionComment.trim()) {
          showToast("A rejection reason is required.");
          setSubmitting(false);
          return;
        }
        const res = await workflowApi.rejectDocument(docId, actionComment.trim());
        if (res.success) {
          showToast("Document has been rejected.");
          setModalType(null);
          setActionComment("");
          await fetchDocumentReview();
        } else {
          showToast(res.message || "Action failed.");
        }
      } else if (modalType === "APPROVE") {
        const res = await workflowApi.approveDocument(docId, actionComment.trim());
        if (res.success) {
          setModalType(null);
          setActionComment("");
          const responseData = res as any;
          const targetUrl = responseData.redirectUrl || `/documents/sign/${docId}?returnTo=/org-admin/documents`;
          showToast("Approved! Redirecting automatically to Signature page...");
          setTimeout(() => {
            router.push(targetUrl);
          }, 600);
        } else {
          showToast(res.message || "Approval failed.");
        }
      }
    } catch (err: any) {
      console.error("Action error:", err);
      showToast(err?.response?.data?.message || err.message || "Failed to submit decision.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Loading document review workspace...</p>
      </div>
    );
  }

  if (error || !documentData) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
          <AlertCircle size={28} />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Document Review Unavailable</h2>
        <p className="text-sm text-slate-500">{error || "Could not retrieve document details."}</p>
        <div className="pt-4">
          <Link
            href="/org-admin/workflow"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-xl hover:bg-slate-900 transition"
          >
            <ArrowLeft size={16} /> Back to Workflow Overview
          </Link>
        </div>
      </div>
    );
  }

  const stepper: StepItem[] = documentData.stepper || [];
  const sender = documentData.senderData || {};
  const recipient = documentData.recipientData || {};
  const sections = Array.isArray(documentData.content) ? documentData.content : [];
  const financial = documentData.financialData || {};
  const isFinalApproved = documentData.status === "APPROVED" || documentData.status === "COMPLETED" || documentData.status === "SIGNED";

  const getStatusBadge = (st: string) => {
    const upper = (st || "").toUpperCase();
    if (upper === "APPROVED" || upper === "COMPLETED" || upper === "SIGNED") {
      return { label: upper === "SIGNED" ? "Signed" : "Approved", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    }
    if (upper === "PENDING_APPROVAL" || upper === "IN_REVIEW") {
      return { label: "Pending Approval", bg: "bg-amber-50 text-amber-700 border-amber-200" };
    }
    if (upper === "AWAITING_SIGNATURE" || upper === "PENDING_SIGNATURE") {
      return { label: "Awaiting Signature", bg: "bg-indigo-50 text-indigo-700 border-indigo-200" };
    }
    if (upper === "CHANGES_REQUESTED") {
      return { label: "Changes Requested", bg: "bg-blue-50 text-blue-700 border-blue-200" };
    }
    if (upper === "REJECTED") {
      return { label: "Rejected", bg: "bg-rose-50 text-rose-700 border-rose-200" };
    }
    return { label: st || "Draft", bg: "bg-slate-50 text-slate-700 border-slate-200" };
  };

  const statusBadge = getStatusBadge(documentData.status);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans text-slate-800">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-slate-900 text-white px-5 py-3 text-xs font-semibold shadow-2xl flex items-center gap-2.5 border border-slate-700 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Breadcrumb & Back */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/org-admin/workflow"
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition shadow-xs"
            title="Back to Workflow"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                Workflow Review
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-medium text-slate-500">
                {documentData.documentNumber}
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {documentData.documentName}
            </h1>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-2">
          {!isFinalApproved && (
            <>
              <button
                type="button"
                onClick={() => {
                  setActionComment("");
                  setModalType("REQUEST_CHANGES");
                }}
                className="px-3.5 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition flex items-center gap-1.5 shadow-xs"
              >
                <RotateCcw size={14} />
                <span>Request Changes</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActionComment("");
                  setModalType("REJECT");
                }}
                className="px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition flex items-center gap-1.5 shadow-xs"
              >
                <XCircle size={14} />
                <span>Reject</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActionComment("");
                  setModalType("APPROVE");
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                <Check size={14} />
                <span>Approve & Proceed to Sign</span>
              </button>
            </>
          )}

          {isFinalApproved && (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 size={14} /> Approved & Ready
              </span>
              <Link
                href="/org-admin/documents"
                className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition flex items-center gap-1.5 shadow-xs"
              >
                <ExternalLink size={14} /> Open in Documents
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Document Metadata Strip */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Document Type</p>
          <p className="text-xs font-bold text-slate-800 mt-0.5">{documentData.documentType}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Created By</p>
          <p className="text-xs font-bold text-slate-800 mt-0.5">{documentData.createdBy}</p>
          <p className="text-[10px] text-slate-400 truncate">{documentData.createdByEmail}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Department</p>
          <p className="text-xs font-bold text-slate-800 mt-0.5">{documentData.department}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Branch / Location</p>
          <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">{documentData.branch}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Client</p>
          <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">{documentData.client}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Current Status</p>
          <div className="mt-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${statusBadge.bg}`}>
              {statusBadge.label}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Workflow Progress Indicator */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <ShieldCheck size={15} className="text-indigo-600" />
            Approval Sequence & Stage Tracking
          </h2>
          <span className="text-xs text-slate-400">
            Current Stage: <strong className="text-slate-800">{documentData.currentWorkflowStage}</strong>
          </span>
        </div>

        {/* Stepper Timeline */}
        <div className="relative flex items-center justify-between w-full overflow-x-auto py-2 px-4 scrollbar-none">
          {stepper.map((step, idx) => {
            const isLast = idx === stepper.length - 1;
            const isCompleted = step.state === "completed";
            const isCurrent = step.state === "current";
            const isRejected = step.state === "rejected";
            const isChanges = step.state === "changes_requested";
            const isSkipped = step.state === "skipped";

            return (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center text-center min-w-[110px]">
                  {/* Step Bubble */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-xs ${
                      isCompleted
                        ? "bg-emerald-600 text-white"
                        : isCurrent
                        ? "bg-indigo-600 text-white ring-4 ring-indigo-100 animate-pulse"
                        : isRejected
                        ? "bg-rose-600 text-white"
                        : isChanges
                        ? "bg-amber-600 text-white"
                        : isSkipped
                        ? "bg-slate-100 text-slate-400 border border-dashed border-slate-300"
                        : "bg-slate-100 text-slate-400 border border-slate-200"
                    }`}
                  >
                    {isCompleted ? (
                      <Check size={16} className="stroke-[2.5]" />
                    ) : isRejected ? (
                      <XCircle size={16} />
                    ) : isChanges ? (
                      <RotateCcw size={15} />
                    ) : isCurrent ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-white" />
                    ) : isSkipped ? (
                      <span className="text-[10px]">—</span>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-300" />
                    )}
                  </div>

                  {/* Step Label */}
                  <p
                    className={`text-xs font-bold mt-2 ${
                      isCurrent
                        ? "text-indigo-600"
                        : isCompleted
                        ? "text-slate-800"
                        : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-[10px] text-slate-400 max-w-[100px] truncate">{step.subtitle}</p>
                </div>

                {/* Connecting Line */}
                {!isLast && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      isCompleted ? "bg-emerald-500" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Workspace: Document Preview (Left) + Tabs Inspector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Document Canvas Preview (Left 8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {/* Canvas Header Bar */}
            <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-700">
                <FileText size={15} className="text-indigo-600" />
                <span>Generated Document Preview</span>
              </div>
              <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                <span>Version {documentData.versions?.length ? documentData.versions[0]?.versionNumber : 1}.0</span>
                <span>•</span>
                <span>{documentData.signatureRequired ? "E-Signature Required" : "Signature Optional"}</span>
              </div>
            </div>

            {/* Document Paper Container */}
            <div className="p-8 sm:p-12 space-y-8 bg-white min-h-[680px]">
              {/* Document Letterhead */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-slate-100 pb-8">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-black tracking-wide uppercase">
                    {sender.companyName || "DOCUCORE ENTERPRISE"}
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-3">
                    {documentData.documentName}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Document Ref: <strong className="text-slate-700">{documentData.documentNumber}</strong>
                  </p>
                </div>

                <div className="text-right text-xs text-slate-500 space-y-1">
                  <p className="font-bold text-slate-800">{sender.companyName || "DocuCore Inc."}</p>
                  <p>{sender.address || "100 Innovation Boulevard, Tech Park"}</p>
                  <p>{sender.phone || "+1 (800) 555-DOCU"}</p>
                  <p>{sender.email || "support@docucore.ai"}</p>
                  {sender.taxNumber && <p className="text-slate-400">Tax/GST: {sender.taxNumber}</p>}
                </div>
              </div>

              {/* Client & Metadata Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/70 p-5 rounded-xl border border-slate-100 text-xs">
                <div>
                  <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Prepared For</p>
                  <p className="font-bold text-slate-900 text-sm mt-1">{documentData.client}</p>
                  <p className="text-slate-600 mt-0.5">{documentData.clientEmail}</p>
                  {documentData.clientAddress && (
                    <p className="text-slate-500 mt-0.5">{documentData.clientAddress}</p>
                  )}
                </div>

                <div className="sm:text-right space-y-1">
                  <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Document Info</p>
                  <p className="text-slate-600 mt-1">
                    Issue Date: <span className="font-semibold text-slate-800">{new Date(documentData.createdDate).toLocaleDateString()}</span>
                  </p>
                  <p className="text-slate-600">
                    Category: <span className="font-semibold text-slate-800">{documentData.category || "General"}</span>
                  </p>
                  <p className="text-slate-600">
                    Workflow Stage: <span className="font-semibold text-indigo-600">{documentData.currentWorkflowStage}</span>
                  </p>
                </div>
              </div>

              {/* Document Structured Sections */}
              <div className="space-y-6">
                {sections.length > 0 ? (
                  sections.map((sec: any, idx: number) => (
                    <div key={sec.id || idx} className="space-y-2 border-b border-slate-100 pb-5 last:border-none">
                      {sec.title && (
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                          {sec.title}
                        </h3>
                      )}
                      {sec.body && (
                        <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                          {sec.body}
                        </div>
                      )}
                      {sec.tableData && Array.isArray(sec.tableData) && (
                        <div className="overflow-x-auto rounded-xl border border-slate-200 mt-3">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                              <tr>
                                {Object.keys(sec.tableData[0] || {}).map((col) => (
                                  <th key={col} className="p-2.5 capitalize">{col}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              {sec.tableData.map((row: any, rIdx: number) => (
                                <tr key={rIdx} className="hover:bg-slate-50/50">
                                  {Object.values(row).map((val: any, cIdx: number) => (
                                    <td key={cIdx} className="p-2.5">{String(val)}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <FileText size={24} className="mx-auto text-slate-300 mb-1" />
                    Standard Document Content Preview
                  </div>
                )}
              </div>

              {/* Financial Calculation Summary (if available) */}
              {financial && financial.total !== undefined && (
                <div className="flex justify-end pt-4 border-t border-slate-200">
                  <div className="w-full sm:w-72 space-y-2 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                    {financial.subtotal !== undefined && (
                      <div className="flex justify-between text-slate-600">
                        <span>Subtotal:</span>
                        <span className="font-semibold">{financial.currency || "USD"} {financial.subtotal}</span>
                      </div>
                    )}
                    {financial.tax !== undefined && (
                      <div className="flex justify-between text-slate-600">
                        <span>Tax / GST:</span>
                        <span className="font-semibold">{financial.currency || "USD"} {financial.tax}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                      <span>Total Amount:</span>
                      <span className="text-indigo-600">{financial.currency || "USD"} {financial.total}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Signature Block Preview */}
              <div className="pt-8 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs">
                <div className="space-y-3 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                    Organisation Executive
                  </p>
                  <div className="h-14 border-b border-slate-300 flex items-end pb-1">
                    {isFinalApproved ? (
                      <span className="font-serif italic text-base text-indigo-900">
                        Signed by Organisation Admin
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">
                        Pending Org Admin final approval sign-off
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-bold text-slate-700">Authorized Signature</p>
                </div>

                <div className="space-y-3 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                    Client Signatory
                  </p>
                  <div className="h-14 border-b border-slate-300 flex items-end pb-1">
                    {documentData.signatureRequired ? (
                      <span className="text-slate-400 italic text-[11px]">
                        {documentData.status === "SIGNED" || documentData.status === "COMPLETED"
                          ? "Signed cryptographically via E-Signature"
                          : "Will execute via E-Signature workflow upon Org Admin approval"}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">
                        Signature not required for this document type
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-bold text-slate-700">{documentData.client}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Inspector Side Panel (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {/* Tab Navigation */}
            <div className="flex border-b border-slate-200/80 bg-slate-50/50 p-1.5 gap-1 text-xs">
              <button
                type="button"
                onClick={() => setSidebarTab("details")}
                className={`flex-1 py-1.5 font-bold rounded-lg transition ${
                  sidebarTab === "details"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Details
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab("history")}
                className={`flex-1 py-1.5 font-bold rounded-lg transition ${
                  sidebarTab === "history"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                History ({documentData.history?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab("versions")}
                className={`flex-1 py-1.5 font-bold rounded-lg transition ${
                  sidebarTab === "versions"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Versions ({documentData.versions?.length || 1})
              </button>
            </div>

            {/* Tab Body */}
            <div className="p-5 text-xs space-y-4 max-h-[600px] overflow-y-auto">
              {sidebarTab === "details" && (
                <div className="space-y-3.5">
                  <div>
                    <span className="text-[11px] text-slate-400 font-semibold uppercase">Document ID</span>
                    <p className="font-mono text-xs text-slate-800 break-all">{documentData.id}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-semibold uppercase">Document Number</span>
                    <p className="font-bold text-slate-800">{documentData.documentNumber}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-semibold uppercase">Signature Setting</span>
                    <p className="font-bold text-slate-800">
                      {documentData.signatureRequired ? (
                        <span className="text-indigo-600 font-bold">Mandatory E-Signature</span>
                      ) : (
                        <span className="text-slate-500">Not Required (Auto-complete on approval)</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-semibold uppercase">Client Contact Email</span>
                    <p className="font-semibold text-slate-700">{documentData.clientEmail || "None"}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-semibold uppercase">Submitted Date</span>
                    <p className="font-semibold text-slate-700">
                      {new Date(documentData.createdDate).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-semibold uppercase">Last Updated</span>
                    <p className="font-semibold text-slate-700">
                      {new Date(documentData.updatedDate).toLocaleString()}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <Link
                      href={`/org-admin/ai-builder?id=${documentData.id}`}
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                    >
                      <Sparkles size={14} /> Open in Document Builder
                    </Link>
                  </div>
                </div>
              )}

              {sidebarTab === "history" && (
                <div className="space-y-4">
                  {documentData.history && documentData.history.length > 0 ? (
                    documentData.history.map((h: any, idx: number) => (
                      <div key={idx} className="relative pl-5 border-l-2 border-slate-200 pb-3 last:border-transparent last:pb-0">
                        <span className="absolute -left-1.5 top-0.5 w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-white" />
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">{h.action}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(h.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          By <strong className="text-slate-700">{h.user}</strong> ({h.role})
                        </p>
                        {h.comment && (
                          <div className="mt-1.5 p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-600 italic">
                            "{h.comment}"
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-slate-400 py-4">No audit history recorded yet.</p>
                  )}
                </div>
              )}

              {sidebarTab === "versions" && (
                <div className="space-y-3">
                  {documentData.versions && documentData.versions.length > 0 ? (
                    documentData.versions.map((v: any) => (
                      <div key={v.id} className="p-3 rounded-xl border border-slate-200 hover:border-indigo-200 transition bg-white space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">Version {v.versionNumber}.0</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(v.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">{v.changeSummary || "Document revision"}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                      <span className="font-bold text-slate-800">Version 1.0 (Initial)</span>
                      <p className="text-[11px] text-slate-500">Document generated and submitted for workflow.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Modals */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {modalType === "APPROVE" && (
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Check size={18} />
                  </div>
                )}
                {modalType === "REJECT" && (
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                    <XCircle size={18} />
                  </div>
                )}
                {modalType === "REQUEST_CHANGES" && (
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <RotateCcw size={18} />
                  </div>
                )}
                <h3 className="text-base font-bold text-slate-900">
                  {modalType === "APPROVE" && "Approve Document"}
                  {modalType === "REJECT" && "Reject Document"}
                  {modalType === "REQUEST_CHANGES" && "Request Changes"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Modal Explanatory text */}
            <p className="text-xs text-slate-500">
              {modalType === "APPROVE" &&
                (documentData.signatureRequired
                  ? "Approving this document will complete executive review, create an e-signature envelope, and forward it directly to the Signature workflow."
                  : "Approving this document will mark it as Completed. The final document will immediately appear in the Documents workspace.")}
              {modalType === "REJECT" &&
                "Rejecting will preserve the complete audit history and notify the creator. Please specify the rejection reason below."}
              {modalType === "REQUEST_CHANGES" &&
                "Requesting changes will return the document to the creator/owner for revision. Please specify exact feedback below."}
            </p>

            {/* Comment/Reason Box */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                {modalType === "APPROVE" ? "Notes / Sign-Off Comments (Optional)" : "Reason / Feedback *"}
              </label>
              <textarea
                rows={3}
                value={actionComment}
                onChange={(e) => setActionComment(e.target.value)}
                placeholder={
                  modalType === "REQUEST_CHANGES"
                    ? "e.g. Please correct the quotation amount and update the payment terms."
                    : modalType === "REJECT"
                    ? "e.g. Quotation pricing is not approved."
                    : "e.g. Approved. Terms verified."
                }
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalType(null)}
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleActionSubmit}
                disabled={submitting}
                className={`px-4 py-2 text-xs font-bold text-white rounded-xl transition shadow-xs flex items-center gap-1.5 ${
                  modalType === "APPROVE"
                    ? "bg-indigo-600 hover:bg-indigo-700"
                    : modalType === "REJECT"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                {submitting ? (
                  <span>Processing...</span>
                ) : (
                  <span>
                    {modalType === "APPROVE" && "Approve & Go to Signature"}
                    {modalType === "REJECT" && "Confirm Rejection"}
                    {modalType === "REQUEST_CHANGES" && "Submit Request for Changes"}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
