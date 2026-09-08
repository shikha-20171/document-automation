"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText, Plus, Search, Filter, RefreshCw, Download, Send, Copy,
  Trash2, Edit2, CheckCircle2, XCircle, Clock, Sparkles, Layers,
  ShieldCheck, ArrowUpRight, MoreVertical, Building2, Calendar,
  FileDown, CheckSquare, Archive, UserCheck, Share2, Users,
  Eye, AlertCircle, MessageSquare, Tag, FileCheck, ArrowRight,
  ExternalLink, ChevronRight, Check, X, ShieldAlert, PenTool
} from "lucide-react";
import apiClient from "@/lib/axios";

export type RoleType = "ORGANISATION_ADMIN" | "DEPARTMENT_MANAGER" | "TEAM_LEADER" | "STAFF";

interface DocumentWorkspaceProps {
  role: RoleType;
  roleDisplayName?: string;
  departmentId?: number | string;
  teamId?: number | string;
}

export type TabKey =
  | "ALL"
  | "MY_DOCUMENTS"
  | "DRAFTS"
  | "ASSIGNED_TO_ME"
  | "PENDING_APPROVAL"
  | "PENDING_SIGNATURE"
  | "COMPLETED"
  | "REJECTED"
  | "SHARED"
  | "ARCHIVED"
  | "TEMPLATES";

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: "ALL", label: "All Documents", icon: Layers },
  { key: "MY_DOCUMENTS", label: "My Documents", icon: UserCheck },
  { key: "DRAFTS", label: "Drafts", icon: Clock },
  { key: "ASSIGNED_TO_ME", label: "Assigned to Me", icon: Users },
  { key: "PENDING_APPROVAL", label: "Pending Approval", icon: AlertCircle },
  { key: "PENDING_SIGNATURE", label: "Pending Signature", icon: PenTool },
  { key: "COMPLETED", label: "Completed / Signed", icon: CheckCircle2 },
  { key: "REJECTED", label: "Changes Requested", icon: XCircle },
  { key: "SHARED", label: "Shared", icon: Share2 },
  { key: "ARCHIVED", label: "Archived", icon: Archive },
  { key: "TEMPLATES", label: "Templates", icon: Sparkles },
];

const STATUS_BADGE: Record<string, { bg: string; text: string; border: string }> = {
  DRAFT: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-300", border: "border-slate-200 dark:border-slate-700" },
  GENERATED: { bg: "bg-blue-50 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-blue-800" },
  UNDER_REVIEW: { bg: "bg-amber-50 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800" },
  IN_REVIEW: { bg: "bg-amber-50 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800" },
  APPROVED: { bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800" },
  SIGNED: { bg: "bg-indigo-50 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-300", border: "border-indigo-200 dark:border-indigo-800" },
  COMPLETED: { bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800" },
  REJECTED: { bg: "bg-rose-50 dark:bg-rose-900/30", text: "text-rose-700 dark:text-rose-300", border: "border-rose-200 dark:border-rose-800" },
  CHANGES_REQUESTED: { bg: "bg-orange-50 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300", border: "border-orange-200 dark:border-orange-800" },
  ARCHIVED: { bg: "bg-zinc-100 dark:bg-zinc-800", text: "text-zinc-600 dark:text-zinc-400", border: "border-zinc-200 dark:border-zinc-700" },
};

export default function DocumentWorkspace({
  role,
  roleDisplayName = "User",
  departmentId,
  teamId,
}: DocumentWorkspaceProps) {
  const router = useRouter();

  // State
  const [activeTab, setActiveTab] = useState<TabKey>("ALL");
  const [documents, setDocuments] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [activeActionId, setActiveActionId] = useState<string | null>(null);

  // Modals state
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [assignModalDoc, setAssignModalDoc] = useState<any | null>(null);
  const [shareModalDoc, setShareModalDoc] = useState<any | null>(null);
  const [approvalModalDoc, setApprovalModalDoc] = useState<any | null>(null);
  const [signatureModalDoc, setSignatureModalDoc] = useState<any | null>(null);
  const [sendClientModalDoc, setSendClientModalDoc] = useState<any | null>(null);

  // Form states for modals
  const [assignForm, setAssignForm] = useState({
    assignedToId: "",
    assignedToName: "",
    assignedToEmail: "",
    departmentName: "",
    teamName: "",
    priority: "MEDIUM",
    dueDate: "",
    instructions: "",
  });

  const [shareForm, setShareForm] = useState({
    sharedWithEmail: "",
    permission: "VIEW",
    canSign: false,
    notes: "",
  });

  const [approvalForm, setApprovalForm] = useState({
    assignedApproverRole: role === "STAFF" ? "TEAM_LEADER" : "DEPARTMENT_MANAGER",
    comments: "",
    dueDate: "",
  });

  const [signatureForm, setSignatureForm] = useState({
    signerName: "",
    signerEmail: "",
    expiresInDays: 7,
    notes: "",
  });

  const [sendClientForm, setSendClientForm] = useState({
    recipientEmail: "",
    subject: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ title: string; message?: string; type: "success" | "error" } | null>(null);

  const showToast = (title: string, message?: string, type: "success" | "error" = "success") => {
    setToast({ title, message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch Documents
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "TEMPLATES") {
        const res = await apiClient.get("/api/unified-templates");
        if (res.data?.success) {
          setTemplates(res.data.data || []);
        }
      } else {
        const params: Record<string, any> = {
          tab: activeTab,
          search: search.trim() || undefined,
          category: categoryFilter !== "All" ? categoryFilter : undefined,
        };
        const [docsSettled, metricsSettled] = await Promise.allSettled([
          apiClient.get("/api/unified-documents", { params }),
          apiClient.get("/api/unified-documents/metrics"),
        ]);

        if (docsSettled.status === "fulfilled" && docsSettled.value.data?.success) {
          setDocuments(docsSettled.value.data.data || []);
        } else if (docsSettled.status === "rejected") {
          throw docsSettled.reason;
        }

        if (metricsSettled.status === "fulfilled" && metricsSettled.value.data?.success) {
          setMetrics(metricsSettled.value.data.data);
        }
      }
    } catch (err: any) {
      console.error("Failed to load documents:", err);
      showToast("Fetch Error", err.response?.data?.message || err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [activeTab, search, categoryFilter]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Action Handlers
  const handleDuplicate = async (id: string) => {
    try {
      const res = await apiClient.post(`/api/unified-documents/${id}/duplicate`);
      if (res.data?.success) {
        showToast("Duplicated", `Document duplicated as ${res.data.data.documentNumber}`);
        fetchDocuments();
      }
    } catch (err: any) {
      showToast("Failed to Duplicate", err.response?.data?.message || err.message, "error");
    }
  };

  const handleArchiveToggle = async (id: string, isArchived: boolean) => {
    try {
      const endpoint = isArchived ? `/api/unified-documents/${id}/restore` : `/api/unified-documents/${id}/archive`;
      const res = await apiClient.post(endpoint);
      if (res.data?.success) {
        showToast(isArchived ? "Document Restored" : "Document Archived");
        fetchDocuments();
      }
    } catch (err: any) {
      showToast("Archive Error", err.response?.data?.message || err.message, "error");
    }
  };

  const handleDelete = async (id: string, docNumber: string) => {
    if (!confirm(`Are you sure you want to delete ${docNumber}? This cannot be undone.`)) return;
    try {
      await apiClient.delete(`/api/unified-documents/${id}`);
      showToast("Deleted", `Document ${docNumber} removed.`);
      fetchDocuments();
    } catch (err: any) {
      showToast("Delete Failed", err.response?.data?.message || err.message, "error");
    }
  };

  // Submit Assign Modal
  const submitAssign = async () => {
    if (!assignModalDoc) return;
    setIsSubmitting(true);
    try {
      await apiClient.post(`/api/unified-documents/${assignModalDoc.id}/assign`, assignForm);
      showToast("Document Assigned", `Assigned to ${assignForm.assignedToName || assignForm.assignedToEmail}`);
      setAssignModalDoc(null);
      fetchDocuments();
    } catch (err: any) {
      showToast("Assignment Failed", err.response?.data?.message || err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Share Modal
  const submitShare = async () => {
    if (!shareModalDoc || !shareForm.sharedWithEmail) return;
    setIsSubmitting(true);
    try {
      await apiClient.post(`/api/unified-documents/${shareModalDoc.id}/share`, shareForm);
      showToast("Document Shared", `Shared with ${shareForm.sharedWithEmail}`);
      setShareModalDoc(null);
      fetchDocuments();
    } catch (err: any) {
      showToast("Share Failed", err.response?.data?.message || err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Approval Modal
  const submitApproval = async () => {
    if (!approvalModalDoc) return;
    setIsSubmitting(true);
    try {
      await apiClient.post(`/api/unified-documents/${approvalModalDoc.id}/submit-approval`, approvalForm);
      showToast("Submitted for Approval", "Your document has entered the approval workflow.");
      setApprovalModalDoc(null);
      fetchDocuments();
    } catch (err: any) {
      showToast("Approval Submission Failed", err.response?.data?.message || err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Signature Modal
  const submitSignature = async () => {
    if (!signatureModalDoc || !signatureForm.signerEmail) return;
    setIsSubmitting(true);
    try {
      await apiClient.post(`/api/unified-documents/${signatureModalDoc.id}/send-for-signature`, signatureForm);
      showToast("Sent for Signature", `Signature request dispatched to ${signatureForm.signerEmail}`);
      setSignatureModalDoc(null);
      fetchDocuments();
    } catch (err: any) {
      showToast("Signature Send Failed", err.response?.data?.message || err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Client Email Modal
  const submitSendClient = async () => {
    if (!sendClientModalDoc || !sendClientForm.recipientEmail) return;
    setIsSubmitting(true);
    try {
      await apiClient.post(`/api/unified-documents/${sendClientModalDoc.id}/send-email`, sendClientForm);
      showToast("Document Sent", `Document sent to ${sendClientForm.recipientEmail}`);
      setSendClientModalDoc(null);
      fetchDocuments();
    } catch (err: any) {
      showToast("Send Failed", err.response?.data?.message || err.message, "error");
    } finally {
      setIsSubmitting(false);
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
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <ShieldAlert className="w-5 h-5 text-rose-400" />}
          <div>
            <div className="font-semibold">{toast.title}</div>
            {toast.message && <div className="text-xs opacity-90">{toast.message}</div>}
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
              {roleDisplayName} Workspace
            </span>
            <span className="text-xs text-slate-500">• Unified Lifecycle System</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Enterprise Document Library
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage, collaborate, approve, and track all documents across their entire lifecycle.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => fetchDocuments()}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
            title="Refresh Library"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
          </button>

          <Link
            href="/documents/editor"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-md shadow-blue-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            Create Document
          </Link>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Documents</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{metrics.totalCount || 0}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="text-xs font-medium text-amber-600 dark:text-amber-400">Under Review</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{metrics.underReviewCount || 0}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Pending Sign</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{metrics.pendingSignatureCount || 0}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Completed / Signed</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{metrics.completedCount || 0}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="text-xs font-medium text-blue-600 dark:text-blue-400">Drafts</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{metrics.draftCount || 0}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="text-xs font-medium text-rose-600 dark:text-rose-400">Rejected</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{metrics.rejectedCount || 0}</div>
          </div>
        </div>
      )}

      {/* 11 Connected Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                isActive
                  ? "bg-slate-900 dark:bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, number, client, assignee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Categories</option>
            <option value="Commercial">Commercial / Quotation</option>
            <option value="Finance">Finance / Invoice</option>
            <option value="Legal">Legal & Contracts</option>
            <option value="Operations">Operations</option>
            <option value="HR">HR & Personnel</option>
          </select>
        </div>
      </div>

      {/* Document Content Table */}
      {activeTab === "TEMPLATES" ? (
        // Templates View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.length === 0 && !loading ? (
            <div className="col-span-full text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-500">
              <Sparkles className="w-8 h-8 mx-auto text-blue-500 mb-2 opacity-50" />
              <p className="text-sm font-medium">No templates found</p>
              <p className="text-xs text-slate-400 mt-1">Save any document as a reusable template from the editor.</p>
            </div>
          ) : (
            templates.map((tpl) => (
              <div
                key={tpl.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-blue-400 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      {tpl.category || "General"}
                    </span>
                    <span className="text-xs text-slate-400">{tpl.documentType}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">{tpl.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {tpl.description || "Reusable enterprise document template with pre-configured sections and variables."}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Used {tpl.usageCount || 0} times</span>
                  <Link
                    href={`/documents/editor?templateId=${tpl.id}`}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Use Template <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        // Standard Document Table
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Document</th>
                  <th className="py-3 px-3">Type & Category</th>
                  <th className="py-3 px-3">Owner / Submitter</th>
                  <th className="py-3 px-3">Dept & Team</th>
                  <th className="py-3 px-3">Assignee</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Approval</th>
                  <th className="py-3 px-3">Signature</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs">
                {documents.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={10} className="text-center py-16 text-slate-400">
                      <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      <p className="font-medium">No documents in this view</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Create a new document or change your search filter.
                      </p>
                    </td>
                  </tr>
                ) : (
                  documents.map((doc) => {
                    const badge = STATUS_BADGE[doc.status] || STATUS_BADGE.DRAFT;
                    return (
                      <tr key={doc.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                        {/* Name & Number */}
                        <td className="py-3.5 px-4 font-medium">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 max-w-[200px]">
                              <div
                                onClick={() => setPreviewDoc(doc)}
                                className="font-semibold text-slate-900 dark:text-white hover:text-blue-600 cursor-pointer truncate"
                                title={doc.title}
                              >
                                {doc.title}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                {doc.documentNumber}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Type & Category */}
                        <td className="py-3.5 px-3">
                          <span className="font-medium text-slate-700 dark:text-slate-300">{doc.documentType}</span>
                          <div className="text-[11px] text-slate-400">{doc.category || "General"}</div>
                        </td>

                        {/* Owner */}
                        <td className="py-3.5 px-3">
                          <span className="text-slate-800 dark:text-slate-200 font-medium">
                            {doc.ownerName || doc.clientName || "Me"}
                          </span>
                          <div className="text-[11px] text-slate-400">
                            {doc.clientEmail || ""}
                          </div>
                        </td>

                        {/* Dept & Team */}
                        <td className="py-3.5 px-3">
                          <div className="text-slate-700 dark:text-slate-300">
                            {doc.departmentName || "General Dept"}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {doc.teamName || "General Team"}
                          </div>
                        </td>

                        {/* Assignee */}
                        <td className="py-3.5 px-3">
                          {doc.assignedToName || doc.assignedToEmail ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                              <UserCheck className="w-3 h-3 text-blue-500" />
                              {doc.assignedToName || doc.assignedToEmail}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Unassigned</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            {doc.status}
                          </span>
                        </td>

                        {/* Approval Status */}
                        <td className="py-3.5 px-3">
                          {doc.approvalStatus && doc.approvalStatus !== "NONE" ? (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                doc.approvalStatus === "APPROVED"
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                  : doc.approvalStatus === "PENDING"
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                                  : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                              }`}
                            >
                              {doc.approvalStatus}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Not Required</span>
                          )}
                        </td>

                        {/* Signature Status */}
                        <td className="py-3.5 px-3">
                          {doc.signatureStatus && doc.signatureStatus !== "NONE" ? (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                doc.signatureStatus === "SIGNED"
                                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                                  : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                              }`}
                            >
                              {doc.signatureStatus}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Not Sent</span>
                          )}
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {new Date(doc.createdAt).toLocaleDateString()}
                          {doc.dueDate && (
                            <div className="text-[10px] text-amber-600 dark:text-amber-400">
                              Due: {new Date(doc.dueDate).toLocaleDateString()}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="relative inline-flex items-center gap-1">
                            <button
                              onClick={() => setPreviewDoc(doc)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700"
                              title="Quick View"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <Link
                              href={`/documents/editor?id=${doc.id}`}
                              className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/40 text-blue-600"
                              title="Edit in Document Editor"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Link>

                            <button
                              onClick={() => setActiveActionId(activeActionId === doc.id ? null : doc.id)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            {/* Dropdown Menu */}
                            {activeActionId === doc.id && (
                              <div
                                className="absolute right-0 top-8 z-40 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 text-left"
                                onMouseLeave={() => setActiveActionId(null)}
                              >
                                {role !== "STAFF" && (
                                  <button
                                    onClick={() => {
                                      setActiveActionId(null);
                                      setAssignModalDoc(doc);
                                      setAssignForm((prev) => ({
                                        ...prev,
                                        assignedToName: doc.assignedToName || "",
                                        assignedToEmail: doc.assignedToEmail || "",
                                        departmentName: doc.departmentName || "",
                                        teamName: doc.teamName || "",
                                        priority: doc.priority || "MEDIUM",
                                      }));
                                    }}
                                    className="w-full px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                                  >
                                    <Users className="w-3.5 h-3.5 text-blue-500" />
                                    Assign Document
                                  </button>
                                )}

                                <button
                                  onClick={() => {
                                    setActiveActionId(null);
                                    setShareModalDoc(doc);
                                  }}
                                  className="w-full px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                                >
                                  <Share2 className="w-3.5 h-3.5 text-purple-500" />
                                  Share with User
                                </button>

                                {doc.status !== "APPROVED" && doc.status !== "COMPLETED" && (
                                  <button
                                    onClick={() => {
                                      setActiveActionId(null);
                                      setApprovalModalDoc(doc);
                                    }}
                                    className="w-full px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                                  >
                                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                                    Submit for Approval
                                  </button>
                                )}

                                <button
                                  onClick={() => {
                                    setActiveActionId(null);
                                    setSignatureModalDoc(doc);
                                    setSignatureForm((prev) => ({
                                      ...prev,
                                      signerName: doc.clientName || "",
                                      signerEmail: doc.clientEmail || "",
                                    }));
                                  }}
                                  className="w-full px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                                >
                                  <PenTool className="w-3.5 h-3.5 text-indigo-500" />
                                  Send for Signature
                                </button>

                                <button
                                  onClick={() => {
                                    setActiveActionId(null);
                                    setSendClientModalDoc(doc);
                                    setSendClientForm({
                                      recipientEmail: doc.clientEmail || "",
                                      subject: `${doc.title} - ${doc.documentNumber}`,
                                      message: `Dear ${doc.clientName || "Client"},\n\nPlease find attached ${doc.title} (${doc.documentNumber}) for your review.`,
                                    });
                                  }}
                                  className="w-full px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                                >
                                  <Send className="w-3.5 h-3.5 text-emerald-500" />
                                  Send to Client
                                </button>

                                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                                <button
                                  onClick={() => {
                                    setActiveActionId(null);
                                    window.open(`/api/unified-documents/${doc.id}/download-pdf`, "_blank");
                                  }}
                                  className="w-full px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                                >
                                  <Download className="w-3.5 h-3.5 text-slate-400" />
                                  Download PDF
                                </button>

                                <button
                                  onClick={() => {
                                    setActiveActionId(null);
                                    window.open(`/api/unified-documents/${doc.id}/download-docx`, "_blank");
                                  }}
                                  className="w-full px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                                >
                                  <FileDown className="w-3.5 h-3.5 text-slate-400" />
                                  Download DOCX
                                </button>

                                <button
                                  onClick={() => {
                                    setActiveActionId(null);
                                    handleDuplicate(doc.id);
                                  }}
                                  className="w-full px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                                >
                                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                                  Duplicate
                                </button>

                                <button
                                  onClick={() => {
                                    setActiveActionId(null);
                                    handleArchiveToggle(doc.id, !!doc.isArchived);
                                  }}
                                  className="w-full px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                                >
                                  <Archive className="w-3.5 h-3.5 text-amber-500" />
                                  {doc.isArchived ? "Restore Document" : "Archive Document"}
                                </button>

                                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                                <button
                                  onClick={() => {
                                    setActiveActionId(null);
                                    handleDelete(doc.id, doc.documentNumber);
                                  }}
                                  className="w-full px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 flex items-center gap-2"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Delete
                                </button>
                              </div>
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: PREVIEW SLIDE-OVER / DRAWER */}
      {/* ========================================================================= */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col justify-between overflow-hidden border-l border-slate-200 dark:border-slate-800">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400">{previewDoc.documentNumber}</span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{previewDoc.title}</h2>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/documents/editor?id=${previewDoc.id}`}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
                >
                  Open in Editor
                </Link>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-700 dark:text-slate-300">
              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Status</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{previewDoc.status}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Approval Status</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{previewDoc.approvalStatus || "None"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Client / Recipient</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{previewDoc.clientName || "Internal Document"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Assigned To</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{previewDoc.assignedToName || previewDoc.assignedToEmail || "Unassigned"}</span>
                </div>
              </div>

              {/* Sections list */}
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-3">Document Sections</h3>
                {Array.isArray(previewDoc.content) && previewDoc.content.length > 0 ? (
                  <div className="space-y-4">
                    {previewDoc.content.map((sec: any, idx: number) => (
                      <div key={sec.id || idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <div className="font-semibold text-slate-900 dark:text-white text-xs mb-1.5 flex items-center justify-between">
                          <span>{sec.title || `Section ${idx + 1}`}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">{sec.type}</span>
                        </div>
                        {sec.body && <p className="text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed">{sec.body}</p>}
                        {sec.tableData && (
                          <div className="mt-2 overflow-x-auto">
                            <table className="w-full text-left text-[11px]">
                              <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300">
                                  {sec.tableData.headers?.map((h: string, i: number) => (
                                    <th key={i} className="py-1 px-2">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {sec.tableData.rows?.map((r: string[], ri: number) => (
                                  <tr key={ri} className="border-b border-slate-100 dark:border-slate-800">
                                    {r.map((c, ci) => (
                                      <td key={ci} className="py-1 px-2">{c}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No structured sections available.</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
              <button
                onClick={() => window.open(`/api/unified-documents/${previewDoc.id}/download-pdf`, "_blank")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition"
              >
                <Download className="w-3.5 h-3.5" /> Download PDF
              </button>

              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ASSIGN DOCUMENT */}
      {/* ========================================================================= */}
      {assignModalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Assign Document</h2>
              <button onClick={() => setAssignModalDoc(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Assign <span className="font-semibold text-slate-800 dark:text-slate-200">{assignModalDoc.title}</span> to a team member or department.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Assignee Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={assignForm.assignedToName}
                  onChange={(e) => setAssignForm({ ...assignForm, assignedToName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Assignee Email</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={assignForm.assignedToEmail}
                  onChange={(e) => setAssignForm({ ...assignForm, assignedToEmail: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Priority</label>
                  <select
                    value={assignForm.priority}
                    onChange={(e) => setAssignForm({ ...assignForm, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Due Date</label>
                  <input
                    type="date"
                    value={assignForm.dueDate}
                    onChange={(e) => setAssignForm({ ...assignForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Instructions / Note</label>
                <textarea
                  rows={3}
                  placeholder="Specific guidelines for reviewing or completing this document..."
                  value={assignForm.instructions}
                  onChange={(e) => setAssignForm({ ...assignForm, instructions: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setAssignModalDoc(null)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400"
              >
                Cancel
              </button>
              <button
                onClick={submitAssign}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition disabled:opacity-50"
              >
                {isSubmitting ? "Assigning..." : "Confirm Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: SHARE DOCUMENT */}
      {/* ========================================================================= */}
      {shareModalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Share Document</h2>
              <button onClick={() => setShareModalDoc(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Grant collaborate or view access for <span className="font-semibold text-slate-800 dark:text-slate-200">{shareModalDoc.title}</span>.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">User or Client Email</label>
                <input
                  type="email"
                  placeholder="collaborator@company.com"
                  value={shareForm.sharedWithEmail}
                  onChange={(e) => setShareForm({ ...shareForm, sharedWithEmail: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Access Level</label>
                <select
                  value={shareForm.permission}
                  onChange={(e) => setShareForm({ ...shareForm, permission: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="VIEW">View Only (Read-Only Preview)</option>
                  <option value="EDIT">Edit Access (Full Section Editing)</option>
                  <option value="SIGN">Signature Access (Sign & Complete)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Collaborator Note</label>
                <textarea
                  rows={2}
                  placeholder="Optional message to collaborator..."
                  value={shareForm.notes}
                  onChange={(e) => setShareForm({ ...shareForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShareModalDoc(null)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400"
              >
                Cancel
              </button>
              <button
                onClick={submitShare}
                disabled={isSubmitting || !shareForm.sharedWithEmail}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition disabled:opacity-50"
              >
                {isSubmitting ? "Sharing..." : "Share Access"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: SUBMIT FOR APPROVAL */}
      {/* ========================================================================= */}
      {approvalModalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Submit for Approval</h2>
              <button onClick={() => setApprovalModalDoc(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Route <span className="font-semibold text-slate-800 dark:text-slate-200">{approvalModalDoc.title}</span> to your designated reviewer for approval.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Approver Level</label>
                <select
                  value={approvalForm.assignedApproverRole}
                  onChange={(e) => setApprovalForm({ ...approvalForm, assignedApproverRole: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="TEAM_LEADER">Team Leader</option>
                  <option value="DEPARTMENT_MANAGER">Department Manager</option>
                  <option value="ORGANISATION_ADMIN">Organisation Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Approval Notes</label>
                <textarea
                  rows={3}
                  placeholder="Explain the changes made and any critical terms to check..."
                  value={approvalForm.comments}
                  onChange={(e) => setApprovalForm({ ...approvalForm, comments: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setApprovalModalDoc(null)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400"
              >
                Cancel
              </button>
              <button
                onClick={submitApproval}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit for Review"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: SEND FOR SIGNATURE */}
      {/* ========================================================================= */}
      {signatureModalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Send for Signature</h2>
              <button onClick={() => setSignatureModalDoc(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Dispatch an interactive digital signature link for <span className="font-semibold text-slate-800 dark:text-slate-200">{signatureModalDoc.title}</span>.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Signer Full Name</label>
                <input
                  type="text"
                  placeholder="Jane Smith"
                  value={signatureForm.signerName}
                  onChange={(e) => setSignatureForm({ ...signatureForm, signerName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Signer Email</label>
                <input
                  type="email"
                  placeholder="signer@client.com"
                  value={signatureForm.signerEmail}
                  onChange={(e) => setSignatureForm({ ...signatureForm, signerEmail: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Message for Signer</label>
                <textarea
                  rows={2}
                  placeholder="Please review and provide your e-signature..."
                  value={signatureForm.notes}
                  onChange={(e) => setSignatureForm({ ...signatureForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSignatureModalDoc(null)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400"
              >
                Cancel
              </button>
              <button
                onClick={submitSignature}
                disabled={isSubmitting || !signatureForm.signerEmail}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition disabled:opacity-50"
              >
                {isSubmitting ? "Dispatching..." : "Send Signature Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: SEND TO CLIENT */}
      {/* ========================================================================= */}
      {sendClientModalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Send to Client</h2>
              <button onClick={() => setSendClientModalDoc(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Email the document with PDF attachment and client portal view link.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Recipient Email</label>
                <input
                  type="email"
                  value={sendClientForm.recipientEmail}
                  onChange={(e) => setSendClientForm({ ...sendClientForm, recipientEmail: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Subject</label>
                <input
                  type="text"
                  value={sendClientForm.subject}
                  onChange={(e) => setSendClientForm({ ...sendClientForm, subject: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Email Body</label>
                <textarea
                  rows={4}
                  value={sendClientForm.message}
                  onChange={(e) => setSendClientForm({ ...sendClientForm, message: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSendClientModalDoc(null)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400"
              >
                Cancel
              </button>
              <button
                onClick={submitSendClient}
                disabled={isSubmitting || !sendClientForm.recipientEmail}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition disabled:opacity-50"
              >
                {isSubmitting ? "Sending..." : "Dispatch Document"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
