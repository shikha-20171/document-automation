"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Send,
  MoreHorizontal,
  Clock,
  CheckCircle2,
  AlertCircle,
  PenTool,
  XCircle,
  Archive,
  User,
  Building2,
  Calendar,
  X,
  ArrowRight,
  Share2,
  Users,
  Eye,
  Check,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Edit,
} from "lucide-react";
import apiClient from "@/lib/axios";

export type RoleType = "ORGANISATION_ADMIN" | "DEPARTMENT_MANAGER" | "TEAM_LEADER" | "STAFF";

interface DocumentWorkspaceProps {
  role: RoleType;
  roleDisplayName?: string;
  departmentId?: number | string;
  teamId?: number | string;
}

export type DocumentStatus =
  | "DRAFT"
  | "IN_REVIEW"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "PENDING_SIGNATURE"
  | "COMPLETED"
  | "REJECTED"
  | "ARCHIVED";

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; dotClass: string }
> = {
  DRAFT: {
    label: "Draft",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    dotClass: "bg-slate-400",
  },
  IN_REVIEW: {
    label: "In Review",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
    dotClass: "bg-purple-500",
  },
  PENDING_APPROVAL: {
    label: "Pending Approval",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
    dotClass: "bg-amber-500 animate-pulse",
  },
  UNDER_REVIEW: {
    label: "Pending Approval",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
    dotClass: "bg-amber-500 animate-pulse",
  },
  APPROVED: {
    label: "Approved",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
    dotClass: "bg-emerald-500",
  },
  PENDING_SIGNATURE: {
    label: "Pending Signature",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
    dotClass: "bg-blue-500",
  },
  SIGNATURE_PENDING: {
    label: "Pending Signature",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
    dotClass: "bg-blue-500",
  },
  SIGNED: {
    label: "Signed",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800",
    dotClass: "bg-indigo-500",
  },
  COMPLETED: {
    label: "Completed",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
    dotClass: "bg-emerald-600",
  },
  REJECTED: {
    label: "Rejected",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800",
    dotClass: "bg-rose-500",
  },
  CHANGES_REQUESTED: {
    label: "Changes Requested",
    badgeClass: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
    dotClass: "bg-orange-500",
  },
  ARCHIVED: {
    label: "Archived",
    badgeClass: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
    dotClass: "bg-zinc-400",
  },
};

function CleanDocumentWorkspaceInner({
  role,
  roleDisplayName = "User",
}: DocumentWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Role path prefix
  const roleSlug = useMemo(() => {
    switch (role) {
      case "ORGANISATION_ADMIN":
        return "org-admin";
      case "DEPARTMENT_MANAGER":
        return "department-manager";
      case "TEAM_LEADER":
        return "team-leader";
      default:
        return "employee";
    }
  }, [role]);

  // States
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");

  // Selected document for Drawer View
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Action Modals State
  const [approvalModalDoc, setApprovalModalDoc] = useState<any | null>(null);
  const [signatureModalDoc, setSignatureModalDoc] = useState<any | null>(null);
  const [assignModalDoc, setAssignModalDoc] = useState<any | null>(null);
  const [shareModalDoc, setShareModalDoc] = useState<any | null>(null);
  const [sendClientModalDoc, setSendClientModalDoc] = useState<any | null>(null);

  // Forms
  const [approvalForm, setApprovalForm] = useState({
    approverRole: role === "STAFF" ? "TEAM_LEADER" : "DEPARTMENT_MANAGER",
    comments: "",
  });

  const [signatureForm, setSignatureForm] = useState({
    signerName: "",
    signerEmail: "",
    expiresInDays: 7,
    notes: "",
  });

  const [assignForm, setAssignForm] = useState({
    assignedToId: "",
    assignedToName: "",
    assignedToEmail: "",
    priority: "MEDIUM",
    instructions: "",
  });

  const [shareForm, setShareForm] = useState({
    sharedWithEmail: "",
    permission: "VIEW",
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

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  // Fetch Documents
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/unified-documents", {
        params: {
          search: searchTerm.trim() || undefined,
          status: statusFilter !== "ALL" ? statusFilter : undefined,
          documentType: typeFilter !== "ALL" ? typeFilter : undefined,
          department: deptFilter !== "ALL" ? deptFilter : undefined,
          limit: 100,
        },
      });

      if (res.data?.success) {
        setDocuments(res.data.data || []);
      }
    } catch (err: any) {
      console.error("Error loading documents:", err);
      showToast("Failed to load documents", err.response?.data?.message || err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, typeFilter, deptFilter]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Check URL query for auto-opening document details (e.g. ?docId=...)
  useEffect(() => {
    const docId = searchParams.get("docId");
    if (docId && documents.length > 0) {
      const match = documents.find((d) => d.id === docId);
      if (match) {
        setSelectedDoc(match);
      }
    }
  }, [searchParams, documents]);

  // Fetch audit logs when a document is opened in the drawer
  useEffect(() => {
    if (selectedDoc?.id) {
      apiClient
        .get(`/api/unified-documents/${selectedDoc.id}/audit-logs`)
        .then((res) => {
          if (res.data?.success) {
            setAuditLogs(res.data.data || []);
          }
        })
        .catch(() => setAuditLogs([]));
    } else {
      setAuditLogs([]);
    }
  }, [selectedDoc?.id]);

  // Filtered documents (Client-side date filtering)
  const filteredDocuments = useMemo(() => {
    if (dateFilter === "ALL") return documents;
    const now = new Date();
    return documents.filter((doc) => {
      const docDate = new Date(doc.updatedAt || doc.createdAt);
      const diffDays = (now.getTime() - docDate.getTime()) / (1000 * 3600 * 24);
      if (dateFilter === "TODAY") return diffDays <= 1;
      if (dateFilter === "LAST_7_DAYS") return diffDays <= 7;
      if (dateFilter === "THIS_MONTH") return diffDays <= 30;
      return true;
    });
  }, [documents, dateFilter]);

  // Contextual action helpers
  const getValidActions = (doc: any) => {
    const status = (doc.status || "").toUpperCase();
    const isArchived = doc.isArchived;

    if (isArchived) {
      return ["OPEN", "RESTORE"];
    }

    switch (status) {
      case "PENDING_APPROVAL":
      case "UNDER_REVIEW":
        return ["OPEN", "DOWNLOAD"];
      case "APPROVED":
        return ["OPEN", "SEND_FOR_SIGNATURE", "DOWNLOAD", "SHARE"];
      case "PENDING_SIGNATURE":
      case "SIGNATURE_PENDING":
        return ["OPEN", "SIGN", "DOWNLOAD", "SHARE"];
      case "SIGNED":
      case "COMPLETED":
        return ["OPEN", "DOWNLOAD", "SHARE", "SEND_CLIENT", "ARCHIVE"];
      case "REJECTED":
      case "CHANGES_REQUESTED":
        return ["OPEN", "EDIT", "DOWNLOAD", "ARCHIVE"];
      case "DRAFT":
      default:
        return ["OPEN", "EDIT", "SUBMIT_APPROVAL", "ASSIGN", "SHARE", "DOWNLOAD", "ARCHIVE"];
    }
  };

  // Lifecycle Actions
  const handleDownload = async (docId: string, format: "pdf" | "docx") => {
    try {
      showToast("Preparing Download", `Generating ${format.toUpperCase()}...`);
      const endpoint = format === "pdf"
        ? `/api/unified-documents/${docId}/download-pdf`
        : `/api/unified-documents/${docId}/download-docx`;
      
      const response = await apiClient.get(endpoint, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Document-${docId.slice(0, 8)}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast("Download Complete", `${format.toUpperCase()} downloaded successfully.`);
    } catch (err: any) {
      showToast("Download Failed", err.message, "error");
    }
  };

  const handleArchive = async (docId: string) => {
    try {
      await apiClient.post(`/api/unified-documents/${docId}/archive`);
      showToast("Archived", "Document moved to archive.");
      fetchDocuments();
      if (selectedDoc?.id === docId) setSelectedDoc(null);
    } catch (err: any) {
      showToast("Error", err.message, "error");
    }
  };

  const handleRestore = async (docId: string) => {
    try {
      await apiClient.post(`/api/unified-documents/${docId}/restore`);
      showToast("Restored", "Document restored from archive.");
      fetchDocuments();
      if (selectedDoc?.id === docId) setSelectedDoc(null);
    } catch (err: any) {
      showToast("Error", err.message, "error");
    }
  };

  const handleSubmitApproval = async () => {
    if (!approvalModalDoc) return;
    setIsSubmitting(true);
    try {
      await apiClient.post(`/api/unified-documents/${approvalModalDoc.id}/submit-approval`, approvalForm);
      showToast("Submitted for Approval", "Approvers have been notified.");
      setApprovalModalDoc(null);
      fetchDocuments();
      if (selectedDoc?.id === approvalModalDoc.id) {
        setSelectedDoc((prev: any) => ({ ...prev, status: "PENDING_APPROVAL" }));
      }
    } catch (err: any) {
      showToast("Submission Failed", err.response?.data?.message || err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendForSignature = async () => {
    if (!signatureModalDoc) return;
    setIsSubmitting(true);
    try {
      await apiClient.post(`/api/unified-documents/${signatureModalDoc.id}/send-for-signature`, {
        recipients: [
          {
            name: signatureForm.signerName,
            email: signatureForm.signerEmail,
            role: "SIGNER",
            order: 1,
          },
        ],
        notes: signatureForm.notes,
        expiresInDays: signatureForm.expiresInDays,
      });
      showToast("Signature Dispatched", "Signing link delivered to recipient.");
      setSignatureModalDoc(null);
      fetchDocuments();
      if (selectedDoc?.id === signatureModalDoc.id) {
        setSelectedDoc((prev: any) => ({ ...prev, status: "PENDING_SIGNATURE" }));
      }
    } catch (err: any) {
      showToast("Signature Request Failed", err.response?.data?.message || err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssign = async () => {
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

  const handleShare = async () => {
    if (!shareModalDoc) return;
    setIsSubmitting(true);
    try {
      await apiClient.post(`/api/unified-documents/${shareModalDoc.id}/share`, shareForm);
      showToast("Shared Successfully", `Shared with ${shareForm.sharedWithEmail}`);
      setShareModalDoc(null);
      fetchDocuments();
    } catch (err: any) {
      showToast("Share Failed", err.response?.data?.message || err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendClient = async () => {
    if (!sendClientModalDoc) return;
    setIsSubmitting(true);
    try {
      await apiClient.post(`/api/unified-documents/${sendClientModalDoc.id}/send-email`, sendClientForm);
      showToast("Sent to Client", `Delivered to ${sendClientForm.recipientEmail}`);
      setSendClientModalDoc(null);
    } catch (err: any) {
      showToast("Send Failed", err.response?.data?.message || err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    statusFilter !== "ALL" ||
    typeFilter !== "ALL" ||
    deptFilter !== "ALL" ||
    dateFilter !== "ALL";

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-zinc-950 p-6 lg:p-10 font-sans text-slate-900 dark:text-slate-100">
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border text-sm transition-all duration-300 ${
            toast.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950 dark:border-rose-800 dark:text-rose-200"
              : "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200"
          }`}
        >
          {toast.type === "error" ? <AlertCircle className="w-5 h-5 text-rose-600" /> : <Check className="w-5 h-5 text-emerald-600" />}
          <div>
            <div className="font-semibold">{toast.title}</div>
            {toast.message && <div className="text-xs opacity-90">{toast.message}</div>}
          </div>
        </div>
      )}

      {/* TOP SECTION */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Documents
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage, review and track your organisation documents.
          </p>
        </div>

        <Link
          href={`/${roleSlug}/ai-builder`}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm transition-colors duration-150"
        >
          <Plus className="w-4 h-4" />
          <span>New Document</span>
        </Link>
      </div>

      {/* CLEAN FILTER / SEARCH BAR */}
      <div className="max-w-7xl mx-auto mb-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by document name, number, or client..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="PENDING_SIGNATURE">Pending Signature</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          {/* Document Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="ALL">All Types</option>
            <option value="Quotation">Quotation</option>
            <option value="Invoice">Invoice</option>
            <option value="Contract">Contract</option>
            <option value="Agreement">Agreement</option>
            <option value="Proposal">Proposal</option>
            <option value="Report">Report</option>
            <option value="Policy">Policy</option>
            <option value="Memo">Memo</option>
          </select>

          {/* Department Filter */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="ALL">All Departments</option>
            <option value="Operations & Logistics">Operations & Logistics</option>
            <option value="Finance">Finance</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Engineering">Engineering</option>
            <option value="Sales & Marketing">Sales & Marketing</option>
            <option value="Legal">Legal</option>
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="ALL">All Time</option>
            <option value="TODAY">Today</option>
            <option value="LAST_7_DAYS">Last 7 Days</option>
            <option value="THIS_MONTH">This Month</option>
          </select>

          {/* Reset button */}
          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("ALL");
                setTypeFilter("ALL");
                setDeptFilter("ALL");
                setDateFilter("ALL");
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-zinc-800 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* DOCUMENT LIST TABLE */}
      <div className="max-w-7xl mx-auto bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-zinc-800/50 border-b border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Document</th>
                <th className="px-6 py-3.5">Type</th>
                <th className="px-6 py-3.5">Owner</th>
                <th className="px-6 py-3.5">Department</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Updated</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading documents...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center">
                    <div className="max-w-sm mx-auto flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 mb-3">
                        <FileText className="w-6 h-6" />
                      </div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">No documents found</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {hasActiveFilters
                          ? "Try clearing filters to see more results."
                          : "Get started by creating your first document."}
                      </p>
                      {!hasActiveFilters && (
                        <Link
                          href={`/${roleSlug}/ai-builder`}
                          className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Create Document</span>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => {
                  const statusInfo = STATUS_CONFIG[doc.status] || STATUS_CONFIG.DRAFT;
                  const validActions = getValidActions(doc);
                  const isMenuOpen = openMenuId === doc.id;

                  return (
                    <tr
                      key={doc.id}
                      onClick={() => setSelectedDoc(doc)}
                      className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors duration-100 group"
                    >
                      {/* Document Column */}
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {doc.title || "Untitled Document"}
                            </div>
                            <div className="text-xs font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                              {doc.documentNumber}
                              {doc.clientName && (
                                <span className="ml-2 font-sans text-slate-500 dark:text-slate-400">
                                  • {doc.clientName}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Type Column */}
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        <span className="inline-block px-2.5 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300">
                          {doc.documentType || "Document"}
                        </span>
                      </td>

                      {/* Owner Column */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-zinc-700 text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                            {(doc.createdByName || "U")[0].toUpperCase()}
                          </div>
                          <span className="text-slate-700 dark:text-slate-300 text-xs">
                            {doc.createdByName || "User"}
                          </span>
                        </div>
                      </td>

                      {/* Department Column */}
                      <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                        {doc.departmentName || "General"}
                      </td>

                      {/* Status Column */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusInfo.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotClass}`} />
                          <span>{statusInfo.label}</span>
                        </span>
                      </td>

                      {/* Updated Column */}
                      <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(doc.updatedAt || doc.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      {/* Action Column */}
                      <td
                        className="px-6 py-4 text-right relative"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setOpenMenuId(isMenuOpen ? null : doc.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                          aria-label="Actions"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {isMenuOpen && (
                          <div
                            className="absolute right-6 top-12 z-40 w-48 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl py-1 text-xs text-left"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {validActions.includes("OPEN") && (
                              <button
                                onClick={() => {
                                  setSelectedDoc(doc);
                                  setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-zinc-800/80 text-slate-700 dark:text-slate-200"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-400" />
                                <span>Open</span>
                              </button>
                            )}

                            {validActions.includes("EDIT") && (
                              <Link
                                href={`/${roleSlug}/ai-builder?docId=${doc.id}`}
                                className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-zinc-800/80 text-slate-700 dark:text-slate-200"
                              >
                                <Edit className="w-3.5 h-3.5 text-slate-400" />
                                <span>Edit</span>
                              </Link>
                            )}

                            {validActions.includes("SUBMIT_APPROVAL") && (
                              <button
                                onClick={() => {
                                  setApprovalModalDoc(doc);
                                  setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-zinc-800/80 text-amber-700 dark:text-amber-400 font-medium"
                              >
                                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                                <span>Submit for Approval</span>
                              </button>
                            )}

                            {validActions.includes("SEND_FOR_SIGNATURE") && (
                              <button
                                onClick={() => {
                                  setSignatureModalDoc(doc);
                                  setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-zinc-800/80 text-blue-700 dark:text-blue-400 font-medium"
                              >
                                <PenTool className="w-3.5 h-3.5 text-blue-500" />
                                <span>Send for Signature</span>
                              </button>
                            )}

                            {validActions.includes("SIGN") && (
                              <Link
                                href={`/documents/sign/${doc.id}`}
                                className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-zinc-800/80 text-blue-700 dark:text-blue-400 font-medium"
                              >
                                <PenTool className="w-3.5 h-3.5 text-blue-500" />
                                <span>Sign Document</span>
                              </Link>
                            )}

                            {validActions.includes("ASSIGN") && (
                              <button
                                onClick={() => {
                                  setAssignModalDoc(doc);
                                  setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-zinc-800/80 text-slate-700 dark:text-slate-200"
                              >
                                <Users className="w-3.5 h-3.5 text-slate-400" />
                                <span>Assign</span>
                              </button>
                            )}

                            {validActions.includes("SHARE") && (
                              <button
                                onClick={() => {
                                  setShareModalDoc(doc);
                                  setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-zinc-800/80 text-slate-700 dark:text-slate-200"
                              >
                                <Share2 className="w-3.5 h-3.5 text-slate-400" />
                                <span>Share</span>
                              </button>
                            )}

                            {validActions.includes("SEND_CLIENT") && (
                              <button
                                onClick={() => {
                                  setSendClientModalDoc(doc);
                                  setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-zinc-800/80 text-slate-700 dark:text-slate-200"
                              >
                                <Send className="w-3.5 h-3.5 text-slate-400" />
                                <span>Send to Client</span>
                              </button>
                            )}

                            {validActions.includes("DOWNLOAD") && (
                              <div className="border-t border-slate-100 dark:border-zinc-800 my-1 pt-1">
                                <button
                                  onClick={() => handleDownload(doc.id, "pdf")}
                                  className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-zinc-800/80 text-slate-700 dark:text-slate-200"
                                >
                                  <Download className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Download PDF</span>
                                </button>
                                <button
                                  onClick={() => handleDownload(doc.id, "docx")}
                                  className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-zinc-800/80 text-slate-700 dark:text-slate-200"
                                >
                                  <Download className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Download DOCX</span>
                                </button>
                              </div>
                            )}

                            {validActions.includes("ARCHIVE") && (
                              <button
                                onClick={() => handleArchive(doc.id)}
                                className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-zinc-800/80 text-rose-600 dark:text-rose-400 border-t border-slate-100 dark:border-zinc-800"
                              >
                                <Archive className="w-3.5 h-3.5 text-rose-500" />
                                <span>Archive</span>
                              </button>
                            )}

                            {validActions.includes("RESTORE") && (
                              <button
                                onClick={() => handleRestore(doc.id)}
                                className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-zinc-800/80 text-emerald-600 dark:text-emerald-400"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Restore</span>
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DOCUMENT DETAIL DRAWER (Clicking a document opens detail/view) */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-4xl bg-white dark:bg-zinc-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-zinc-800 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/70 dark:bg-zinc-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedDoc.title || "Document Details"}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="font-mono">{selectedDoc.documentNumber}</span>
                    <span>•</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                        STATUS_CONFIG[selectedDoc.status]?.badgeClass || "bg-slate-100"
                      }`}
                    >
                      {STATUS_CONFIG[selectedDoc.status]?.label || selectedDoc.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contextual Primary Action Button in Header */}
              <div className="flex items-center gap-2">
                {selectedDoc.status === "DRAFT" && (
                  <button
                    onClick={() => setApprovalModalDoc(selectedDoc)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Submit for Approval</span>
                  </button>
                )}

                {selectedDoc.status === "APPROVED" && (
                  <button
                    onClick={() => setSignatureModalDoc(selectedDoc)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Send for Signature</span>
                  </button>
                )}

                {(selectedDoc.status === "PENDING_SIGNATURE" || selectedDoc.status === "SIGNATURE_PENDING") && (
                  <Link
                    href={`/documents/sign/${selectedDoc.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Sign Now</span>
                  </Link>
                )}

                {selectedDoc.status === "COMPLETED" && (
                  <Link
                    href={`/documents/final/${selectedDoc.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>View Certified Document</span>
                  </Link>
                )}

                <button
                  onClick={() => setSelectedDoc(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Body: 2-Column Layout */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-zinc-800">
              {/* Main Area: Document Preview (7 cols) */}
              <div className="lg:col-span-8 p-6 overflow-y-auto bg-slate-100/60 dark:bg-zinc-950/60">
                <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-sm p-8 text-sm">
                  {/* Document Header in Preview */}
                  <div className="border-b border-slate-200 dark:border-zinc-800 pb-6 mb-6">
                    <div className="text-xs uppercase font-bold tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
                      {selectedDoc.documentType || "Official Document"}
                    </div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                      {selectedDoc.title}
                    </h1>
                    <div className="grid grid-cols-2 gap-4 mt-4 text-xs text-slate-500">
                      <div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Document No:</span>{" "}
                        {selectedDoc.documentNumber}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Date:</span>{" "}
                        {new Date(selectedDoc.createdAt).toLocaleDateString()}
                      </div>
                      {selectedDoc.clientName && (
                        <div>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Client:</span>{" "}
                          {selectedDoc.clientName}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Document Content / Sections */}
                  {Array.isArray(selectedDoc.content) && selectedDoc.content.length > 0 ? (
                    <div className="space-y-6">
                      {selectedDoc.content.map((sec: any, idx: number) => (
                        <div key={sec.id || idx} className="space-y-2">
                          {sec.title && (
                            <h3 className="font-semibold text-slate-900 dark:text-white text-sm border-b border-slate-100 dark:border-zinc-800 pb-1">
                              {sec.title}
                            </h3>
                          )}
                          <p className="text-slate-700 dark:text-slate-300 text-xs whitespace-pre-line leading-relaxed">
                            {sec.body || sec.content || "—"}
                          </p>

                          {/* Table support if present in section */}
                          {sec.tableData && (
                            <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden mt-3 text-xs">
                              <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-slate-400">
                                  <tr>
                                    {sec.tableData.headers?.map((h: string, i: number) => (
                                      <th key={i} className="px-3 py-2 font-semibold">
                                        {h}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                                  {sec.tableData.rows?.map((row: string[], i: number) => (
                                    <tr key={i}>
                                      {row.map((cell: string, j: number) => (
                                        <td key={j} className="px-3 py-1.5">
                                          {cell}
                                        </td>
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
                    <div className="text-xs text-slate-500 italic py-6 text-center">
                      Document draft body loaded. Open editor to review full section breakdowns.
                    </div>
                  )}

                  {/* Financial Total if present */}
                  {selectedDoc.totalAmount && (
                    <div className="mt-8 pt-4 border-t border-slate-200 dark:border-zinc-800 flex justify-end">
                      <div className="text-right">
                        <span className="text-xs text-slate-500 mr-3">Grand Total:</span>
                        <span className="text-base font-bold text-slate-900 dark:text-white">
                          ₹{Number(selectedDoc.totalAmount).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right-side Information Panel & Activity Timeline (4 cols) */}
              <div className="lg:col-span-4 p-6 space-y-6 overflow-y-auto bg-white dark:bg-zinc-900 text-xs">
                {/* Information Block */}
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-3 text-xs uppercase tracking-wider text-slate-400">
                    Document Information
                  </h3>
                  <div className="space-y-2.5">
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-zinc-800">
                      <span className="text-slate-500">Owner</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {selectedDoc.createdByName || "User"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-zinc-800">
                      <span className="text-slate-500">Department</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {selectedDoc.departmentName || "General"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-zinc-800">
                      <span className="text-slate-500">Team</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {selectedDoc.teamName || "General Team"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-zinc-800">
                      <span className="text-slate-500">Created Date</span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {new Date(selectedDoc.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-zinc-800">
                      <span className="text-slate-500">Last Updated</span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {new Date(selectedDoc.updatedAt || selectedDoc.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-zinc-800">
                      <span className="text-slate-500">Approval Status</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {selectedDoc.approvalStatus || (selectedDoc.status === "APPROVED" ? "Approved" : "None")}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-zinc-800">
                      <span className="text-slate-500">Signature Status</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {selectedDoc.signatureStatus || (selectedDoc.status === "COMPLETED" ? "Signed" : "Unsigned")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 space-y-2">
                  <div className="font-semibold text-slate-400 uppercase tracking-wider text-[11px] mb-2">
                    Actions
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleDownload(selectedDoc.id, "pdf")}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
                    <button
                      onClick={() => handleDownload(selectedDoc.id, "docx")}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>DOCX</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setShareModalDoc(selectedDoc)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share</span>
                    </button>
                    <button
                      onClick={() => setAssignModalDoc(selectedDoc)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium transition-colors"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Assign</span>
                    </button>
                  </div>
                </div>

                {/* Activity Timeline */}
                <div className="pt-4 border-t border-slate-200 dark:border-zinc-800">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-3 text-xs uppercase tracking-wider text-slate-400">
                    Activity Timeline
                  </h3>
                  <div className="relative pl-4 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-zinc-800">
                    <div className="relative">
                      <span className="absolute -left-4 top-1 w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-white dark:ring-zinc-900" />
                      <div className="font-medium text-slate-900 dark:text-white">Created</div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(selectedDoc.createdAt).toLocaleString()} by {selectedDoc.createdByName || "User"}
                      </div>
                    </div>

                    {selectedDoc.assignedToName && (
                      <div className="relative">
                        <span className="absolute -left-4 top-1 w-2 h-2 rounded-full bg-blue-500 ring-4 ring-white dark:ring-zinc-900" />
                        <div className="font-medium text-slate-900 dark:text-white">Assigned</div>
                        <div className="text-[11px] text-slate-400">
                          Assigned to {selectedDoc.assignedToName}
                        </div>
                      </div>
                    )}

                    {(selectedDoc.status === "PENDING_APPROVAL" ||
                      selectedDoc.status === "APPROVED" ||
                      selectedDoc.status === "COMPLETED") && (
                      <div className="relative">
                        <span className="absolute -left-4 top-1 w-2 h-2 rounded-full bg-amber-500 ring-4 ring-white dark:ring-zinc-900" />
                        <div className="font-medium text-slate-900 dark:text-white">Submitted for Approval</div>
                        <div className="text-[11px] text-slate-400">Review requested</div>
                      </div>
                    )}

                    {(selectedDoc.status === "APPROVED" || selectedDoc.status === "COMPLETED") && (
                      <div className="relative">
                        <span className="absolute -left-4 top-1 w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-zinc-900" />
                        <div className="font-medium text-slate-900 dark:text-white">Approved</div>
                        <div className="text-[11px] text-slate-400">Approved by Department Reviewer</div>
                      </div>
                    )}

                    {(selectedDoc.status === "PENDING_SIGNATURE" || selectedDoc.status === "COMPLETED") && (
                      <div className="relative">
                        <span className="absolute -left-4 top-1 w-2 h-2 rounded-full bg-blue-500 ring-4 ring-white dark:ring-zinc-900" />
                        <div className="font-medium text-slate-900 dark:text-white">Signature Requested</div>
                        <div className="text-[11px] text-slate-400">Envelope dispatched</div>
                      </div>
                    )}

                    {selectedDoc.status === "COMPLETED" && (
                      <div className="relative">
                        <span className="absolute -left-4 top-1 w-2 h-2 rounded-full bg-emerald-600 ring-4 ring-white dark:ring-zinc-900" />
                        <div className="font-medium text-slate-900 dark:text-white">Signed & Completed</div>
                        <div className="text-[11px] text-slate-400">Legally executed & sealed with SHA-256</div>
                      </div>
                    )}

                    {/* Additional DB audit logs if available */}
                    {auditLogs.map((log: any) => (
                      <div key={log.id} className="relative">
                        <span className="absolute -left-4 top-1 w-2 h-2 rounded-full bg-slate-400 ring-4 ring-white dark:ring-zinc-900" />
                        <div className="font-medium text-slate-800 dark:text-slate-200">{log.action}</div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(log.createdAt).toLocaleString()} • {log.userName || "System"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SUBMIT FOR APPROVAL */}
      {approvalModalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-slate-200 dark:border-zinc-800 p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Submit for Approval
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Submit &quot;{approvalModalDoc.title}&quot; for department approval.
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Approver Role
                </label>
                <select
                  value={approvalForm.approverRole}
                  onChange={(e) => setApprovalForm({ ...approvalForm, approverRole: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg"
                >
                  <option value="TEAM_LEADER">Team Leader</option>
                  <option value="DEPARTMENT_MANAGER">Department Manager</option>
                  <option value="ORGANISATION_ADMIN">Organisation Admin</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Comments / Notes for Approver
                </label>
                <textarea
                  rows={3}
                  value={approvalForm.comments}
                  onChange={(e) => setApprovalForm({ ...approvalForm, comments: e.target.value })}
                  placeholder="e.g. Please review commercial milestones and pricing structure."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setApprovalModalDoc(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleSubmitApproval}
                className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
              >
                {isSubmitting ? "Submitting..." : "Submit for Approval"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SEND FOR SIGNATURE */}
      {signatureModalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-slate-200 dark:border-zinc-800 p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Send for Signature
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Dispatch &quot;{signatureModalDoc.title}&quot; to recipient for legally binding digital signature.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Signer Full Name
                </label>
                <input
                  type="text"
                  value={signatureForm.signerName}
                  onChange={(e) => setSignatureForm({ ...signatureForm, signerName: e.target.value })}
                  placeholder="e.g. Rajesh Mehra"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Signer Email
                </label>
                <input
                  type="email"
                  value={signatureForm.signerEmail}
                  onChange={(e) => setSignatureForm({ ...signatureForm, signerEmail: e.target.value })}
                  placeholder="signer@clientcorp.com"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Instructions / Message
                </label>
                <textarea
                  rows={2}
                  value={signatureForm.notes}
                  onChange={(e) => setSignatureForm({ ...signatureForm, notes: e.target.value })}
                  placeholder="Please review and sign this agreement."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setSignatureModalDoc(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={isSubmitting || !signatureForm.signerEmail}
                onClick={handleSendForSignature}
                className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
              >
                {isSubmitting ? "Dispatching..." : "Send for Signature"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN DOCUMENT */}
      {assignModalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-slate-200 dark:border-zinc-800 p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Assign Document
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Delegate &quot;{assignModalDoc.title}&quot; to a team member.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Assignee Email
                </label>
                <input
                  type="email"
                  value={assignForm.assignedToEmail}
                  onChange={(e) => setAssignForm({ ...assignForm, assignedToEmail: e.target.value })}
                  placeholder="teammate@company.com"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Priority
                </label>
                <select
                  value={assignForm.priority}
                  onChange={(e) => setAssignForm({ ...assignForm, priority: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Instructions
                </label>
                <textarea
                  rows={2}
                  value={assignForm.instructions}
                  onChange={(e) => setAssignForm({ ...assignForm, instructions: e.target.value })}
                  placeholder="Review line items and attach vendor quotes."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setAssignModalDoc(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={isSubmitting || !assignForm.assignedToEmail}
                onClick={handleAssign}
                className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
              >
                {isSubmitting ? "Assigning..." : "Confirm Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SHARE DOCUMENT */}
      {shareModalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-slate-200 dark:border-zinc-800 p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Share Document
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Grant view or edit access to internal or external collaborators.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Collaborator Email
                </label>
                <input
                  type="email"
                  value={shareForm.sharedWithEmail}
                  onChange={(e) => setShareForm({ ...shareForm, sharedWithEmail: e.target.value })}
                  placeholder="colleague@company.com"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Access Permission
                </label>
                <select
                  value={shareForm.permission}
                  onChange={(e) => setShareForm({ ...shareForm, permission: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg"
                >
                  <option value="VIEW">Can View</option>
                  <option value="COMMENT">Can Comment</option>
                  <option value="EDIT">Can Edit</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShareModalDoc(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={isSubmitting || !shareForm.sharedWithEmail}
                onClick={handleShare}
                className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
              >
                {isSubmitting ? "Sharing..." : "Share Access"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SEND TO CLIENT */}
      {sendClientModalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-slate-200 dark:border-zinc-800 p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Send to Client
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Email completed document directly to the client with PDF attachment.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Client Email Address
                </label>
                <input
                  type="email"
                  value={sendClientForm.recipientEmail}
                  onChange={(e) => setSendClientForm({ ...sendClientForm, recipientEmail: e.target.value })}
                  placeholder="client@clientcorp.com"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={sendClientForm.subject || `Executed Document: ${sendClientModalDoc.title}`}
                  onChange={(e) => setSendClientForm({ ...sendClientForm, subject: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Message
                </label>
                <textarea
                  rows={3}
                  value={sendClientForm.message}
                  onChange={(e) => setSendClientForm({ ...sendClientForm, message: e.target.value })}
                  placeholder="Please find attached the signed and completed document for your records."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setSendClientModalDoc(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={isSubmitting || !sendClientForm.recipientEmail}
                onClick={handleSendClient}
                className="px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50"
              >
                {isSubmitting ? "Sending..." : "Send Document"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CleanDocumentWorkspace(props: DocumentWorkspaceProps) {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-50/50 dark:bg-zinc-950 p-10 flex items-center justify-center">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading documents...</span>
          </div>
        </div>
      }
    >
      <CleanDocumentWorkspaceInner {...props} />
    </React.Suspense>
  );
}
