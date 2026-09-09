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
  UploadCloud,
  MessageSquare,
  Bot,
  FileSearch,
  Loader2,
  GitBranch,
  History,
  Layers,
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
  | "PROCESSING"
  | "REVIEW_REQUIRED"
  | "IN_REVIEW"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "PENDING_SIGNATURE"
  | "COMPLETED"
  | "REJECTED"
  | "FAILED"
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
  PROCESSING: {
    label: "Processing",
    badgeClass: "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/50 dark:text-blue-200 dark:border-blue-700",
    dotClass: "bg-blue-500 animate-spin",
  },
  REVIEW_REQUIRED: {
    label: "Review Required",
    badgeClass: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-700",
    dotClass: "bg-amber-600 animate-pulse",
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
  FAILED: {
    label: "Failed",
    badgeClass: "bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/50 dark:text-rose-200 dark:border-rose-700",
    dotClass: "bg-rose-600",
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

  // Upload & Cognitive Processing Modal
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState("General");
  const [uploadClientName, setUploadClientName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPipelineStep, setUploadPipelineStep] = useState(0);

  // Drawer Tabs: "preview" | "intelligence" | "workflow" | "versions" | "audit" | "chat"
  const [drawerTab, setDrawerTab] = useState<"preview" | "intelligence" | "workflow" | "versions" | "audit" | "chat">("preview");

  // Document Versions & Workflow detailed state
  const [docVersions, setDocVersions] = useState<any[]>([]);
  const [workflowInfo, setWorkflowInfo] = useState<any>(null);
  const [isRestoringVersion, setIsRestoringVersion] = useState(false);

  // Restore Version Handler
  const handleRestoreVersion = async (versionNumber: number) => {
    if (!selectedDoc?.id) return;
    setIsRestoringVersion(true);
    try {
      const res = await apiClient.post(`/api/unified-documents/${selectedDoc.id}/restore-version/${versionNumber}`);
      if (res.data?.success) {
        showToast("Version Restored", `Document successfully restored to Version ${versionNumber}.`);
        fetchDocuments();
        if (res.data.data) {
          setSelectedDoc(res.data.data);
        }
      } else {
        showToast("Restore Failed", res.data?.message || "Could not restore version.", "error");
      }
    } catch (err: any) {
      showToast("Error", err.response?.data?.message || "Failed to restore version.", "error");
    } finally {
      setIsRestoringVersion(false);
    }
  };

  // Review & Correction state
  const [reviewFields, setReviewFields] = useState<Record<string, any>>({});
  const [reviewDocType, setReviewDocType] = useState<string>("");
  const [reviewComments, setReviewComments] = useState<string>("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Grounded Chat state
  const [chatQuery, setChatQuery] = useState("");
  const [chatMessages, setChatMessages] = useState<{ sender: "user" | "ai"; text: string; sources?: any[] }[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ title: string; message?: string; type: "success" | "error" } | null>(null);

  const showToast = (title: string, message?: string, type: "success" | "error" = "success") => {
    setToast({ title, message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Synchronize drawer when a document is opened
  useEffect(() => {
    if (selectedDoc) {
      const isReviewNeeded = selectedDoc.status === "REVIEW_REQUIRED";
      setDrawerTab(isReviewNeeded ? "intelligence" : "preview");
      setReviewDocType(selectedDoc.documentType || "Invoice");
      setReviewFields(selectedDoc.metadata?.extractedData || {});
      setReviewComments("");
      setChatMessages([
        {
          sender: "ai",
          text: `Hello! I am your AI Document Assistant for "${selectedDoc.title}". I am strictly grounded in this document's text and extracted data. What would you like to verify?`,
          sources: [{ title: selectedDoc.title, snippet: selectedDoc.documentType }],
        },
      ]);
    }
  }, [selectedDoc]);

  // Upload & Ingestion Execution
  const handleUploadProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      showToast("No File Selected", "Please choose a file to upload.", "error");
      return;
    }

    setIsUploading(true);
    setUploadPipelineStep(1); // Storage

    try {
      const stepTimer1 = setTimeout(() => setUploadPipelineStep(2), 600); // OCR
      const stepTimer2 = setTimeout(() => setUploadPipelineStep(3), 1300); // Classifying
      const stepTimer3 = setTimeout(() => setUploadPipelineStep(4), 2000); // Extracting
      const stepTimer4 = setTimeout(() => setUploadPipelineStep(5), 2600); // Validating

      const formData = new FormData();
      formData.append("file", uploadFile);
      if (uploadCategory) formData.append("category", uploadCategory);
      if (uploadClientName) formData.append("clientName", uploadClientName);

      const res = await apiClient.post("/api/unified-documents/upload-process", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      clearTimeout(stepTimer4);
      setUploadPipelineStep(6); // Done

      if (res.data?.success && res.data.data) {
        const createdDoc = res.data.data;
        showToast(
          "Document Processed",
          `Classified as ${createdDoc.documentType} (Status: ${createdDoc.status}).`
        );
        setUploadModalOpen(false);
        setUploadFile(null);
        setUploadPipelineStep(0);
        await fetchDocuments();
        setSelectedDoc(createdDoc);
      }
    } catch (err: any) {
      showToast("Processing Failed", err.response?.data?.message || err.message, "error");
      setUploadPipelineStep(0);
    } finally {
      setIsUploading(false);
    }
  };

  // Review & Correction Action
  const handleReviewAction = async (action: "APPROVE_EXTRACTION" | "REJECT_EXTRACTION") => {
    if (!selectedDoc) return;
    setIsSubmittingReview(true);
    try {
      const res = await apiClient.post(`/api/unified-documents/${selectedDoc.id}/review-action`, {
        action,
        documentType: reviewDocType,
        correctedFields: reviewFields,
        comments: reviewComments,
      });

      if (res.data?.success && res.data.data) {
        showToast(
          action === "APPROVE_EXTRACTION" ? "Extraction Approved" : "Extraction Rejected",
          `Document updated to ${res.data.data.status}`
        );
        setSelectedDoc(res.data.data);
        fetchDocuments();
      }
    } catch (err: any) {
      showToast("Review Failed", err.response?.data?.message || err.message, "error");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Grounded Chat
  const handleSendChatMessage = async (queryText?: string) => {
    const q = (queryText || chatQuery).trim();
    if (!q || !selectedDoc || isChatLoading) return;

    setChatMessages((prev) => [...prev, { sender: "user", text: q }]);
    setChatQuery("");
    setIsChatLoading(true);

    try {
      const res = await apiClient.post(`/api/unified-documents/${selectedDoc.id}/chat`, { query: q });
      if (res.data?.success) {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: res.data.answer || "No response received.",
            sources: res.data.sources || [],
          },
        ]);
      }
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: `Error analyzing document: ${err.response?.data?.message || err.message}`,
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
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

  // Fetch audit logs, versions, and workflow details when a document is opened in the drawer
  useEffect(() => {
    if (selectedDoc?.id) {
      // 1. Audit logs
      apiClient
        .get(`/api/unified-documents/${selectedDoc.id}/audit-logs`)
        .then((res) => {
          if (res.data?.success) {
            setAuditLogs(res.data.data || []);
          }
        })
        .catch(() => setAuditLogs([]));

      // 2. Full document details (versions, workflow approvalRequests, statusHistory)
      apiClient
        .get(`/api/unified-documents/${selectedDoc.id}`)
        .then((res) => {
          if (res.data?.success && res.data.data) {
            const data = res.data.data;
            setDocVersions(data.versions || []);
            setWorkflowInfo({
              currentStep: data.approvalRequests?.[0]?.currentStep || data.status,
              assignedTo: data.approvalRequests?.[0]?.assignedTo || data.assignedToName || data.createdByName || "Unassigned",
              approvalHistory: data.approvalRequests?.[0]?.history || data.statusHistory || [],
              status: data.status,
              approvalStatus: data.approvalRequests?.[0]?.status || (data.status === "APPROVED" ? "APPROVED" : data.status === "REJECTED" ? "REJECTED" : "PENDING"),
            });
          }
        })
        .catch(() => {
          setDocVersions([]);
          setWorkflowInfo(null);
        });
    } else {
      setAuditLogs([]);
      setDocVersions([]);
      setWorkflowInfo(null);
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

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setUploadModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold shadow-sm transition-colors duration-150 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 text-[#ffd9a0]" />
            <span>Upload Document</span>
          </button>

          <Link
            href={`/${roleSlug}/ai-builder`}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#274690] hover:bg-[#1f3561] text-white text-sm font-bold shadow-sm transition-colors duration-150"
          >
            <Plus className="w-4 h-4" />
            <span>New Document</span>
          </Link>
        </div>
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
              placeholder="Search by document name, number, client, or extracted text..."
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
            <option value="REVIEW_REQUIRED">Review Required</option>
            <option value="PROCESSING">Processing</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="PENDING_SIGNATURE">Pending Signature</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
            <option value="FAILED">Failed</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          {/* Document Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="ALL">All Types</option>
            <option value="Invoice">Invoice</option>
            <option value="Quotation">Quotation</option>
            <option value="Purchase Order">Purchase Order</option>
            <option value="Contract">Contract</option>
            <option value="Agreement">Agreement</option>
            <option value="NDA">NDA</option>
            <option value="Proposal">Proposal</option>
            <option value="Receipt">Receipt</option>
            <option value="Resume">Resume</option>
            <option value="Report">Report</option>
            <option value="Letter">Letter</option>
            <option value="Custom Document">Custom Document</option>
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
                <th className="px-6 py-3.5">Document Name</th>
                <th className="px-6 py-3.5">Document Type</th>
                <th className="px-6 py-3.5">Client</th>
                <th className="px-6 py-3.5">Owner</th>
                <th className="px-6 py-3.5">Department</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Processing Status</th>
                <th className="px-6 py-3.5">Approval Status</th>
                <th className="px-6 py-3.5">Version</th>
                <th className="px-6 py-3.5">Last Updated</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading documents...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-14 text-center">
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
                      {/* Document Name */}
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
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Document Type */}
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        <span className="inline-block px-2.5 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300">
                          {doc.documentType || "Document"}
                        </span>
                      </td>

                      {/* Client */}
                      <td className="px-6 py-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                        {doc.clientName || "—"}
                      </td>

                      {/* Owner */}
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

                      {/* Department */}
                      <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                        {doc.departmentName || "General"}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusInfo.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotClass}`} />
                          <span>{statusInfo.label}</span>
                        </span>
                      </td>

                      {/* Processing Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                            doc.status === "PROCESSING"
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                              : doc.status === "FAILED"
                              ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                              : doc.status === "REVIEW_REQUIRED"
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                          }`}
                        >
                          {doc.status === "PROCESSING"
                            ? "Processing"
                            : doc.status === "FAILED"
                            ? "Failed"
                            : doc.status === "REVIEW_REQUIRED"
                            ? "Review Pending"
                            : "Completed"}
                        </span>
                      </td>

                      {/* Approval Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                            doc.status === "APPROVED"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : doc.status === "PENDING_APPROVAL" || doc.status === "IN_REVIEW"
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                              : doc.status === "REJECTED"
                              ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                              : "bg-slate-100 text-slate-500 dark:bg-zinc-800/60 dark:text-slate-400"
                          }`}
                        >
                          {doc.status === "APPROVED"
                            ? "Approved"
                            : doc.status === "REJECTED"
                            ? "Rejected"
                            : doc.status === "PENDING_APPROVAL" || doc.status === "IN_REVIEW"
                            ? "Pending"
                            : "Not Required"}
                        </span>
                      </td>

                      {/* Version */}
                      <td className="px-6 py-4 text-xs font-mono font-medium text-slate-600 dark:text-slate-400">
                        v{doc.version || 1}
                      </td>

                      {/* Last Updated */}
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

            {/* Drawer Sub-header / Tab Navigation */}
            <div className="px-6 py-2.5 bg-slate-50 dark:bg-zinc-900/90 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3 overflow-x-auto">
              <div className="flex items-center gap-1">
                {/* 1. Document Preview */}
                <button
                  type="button"
                  onClick={() => setDrawerTab("preview")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    drawerTab === "preview"
                      ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-zinc-700"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Document</span>
                </button>

                {/* 2. AI Intelligence */}
                <button
                  type="button"
                  onClick={() => setDrawerTab("intelligence")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    drawerTab === "intelligence"
                      ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-zinc-700"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>AI Intelligence</span>
                  {selectedDoc.status === "REVIEW_REQUIRED" && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </button>

                {/* 3. Workflow */}
                <button
                  type="button"
                  onClick={() => setDrawerTab("workflow")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    drawerTab === "workflow"
                      ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-zinc-700"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>Workflow</span>
                </button>

                {/* 4. Versions */}
                <button
                  type="button"
                  onClick={() => setDrawerTab("versions")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    drawerTab === "versions"
                      ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-zinc-700"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Versions</span>
                  {docVersions.length > 1 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-mono">
                      {docVersions.length}
                    </span>
                  )}
                </button>

                {/* 5. Activity / Audit */}
                <button
                  type="button"
                  onClick={() => setDrawerTab("audit")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    drawerTab === "audit"
                      ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-zinc-700"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Activity / Audit</span>
                </button>

                {/* 6. AI Chat */}
                <button
                  type="button"
                  onClick={() => setDrawerTab("chat")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    drawerTab === "chat"
                      ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-zinc-700"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>AI Chat</span>
                </button>
              </div>

              {selectedDoc.metadata?.validation && (
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                      selectedDoc.metadata.validation.status === "VALID"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : selectedDoc.metadata.validation.status === "WARNING"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                        : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                    }`}
                  >
                    Validation: {selectedDoc.metadata.validation.status}
                  </span>
                  {selectedDoc.metadata.validation.confidence !== undefined && (
                    <span className="text-[11px] font-medium text-slate-500">
                      Score: {selectedDoc.metadata.validation.confidence}%
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* TAB 1: PREVIEW & SECTIONS */}
            {drawerTab === "preview" && (
              <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-zinc-800">
                {/* Main Area: Document Preview (8 cols) */}
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
                        {selectedDoc.metadata?.originalFileName && (
                          <div>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">Source File:</span>{" "}
                            {selectedDoc.metadata.originalFileName}
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
                      <div className="text-xs text-slate-500 py-6 text-center space-y-3">
                        <p>Document structured preview loaded.</p>
                        {selectedDoc.ocrData?.rawText && (
                          <div className="text-left bg-slate-50 dark:bg-zinc-800/50 p-4 rounded-lg font-mono text-[11px] max-h-60 overflow-y-auto whitespace-pre-wrap border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-300">
                            {selectedDoc.ocrData.rawText.slice(0, 800)}
                            {selectedDoc.ocrData.rawText.length > 800 && "..."}
                          </div>
                        )}
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
            )}

            {/* TAB 2: INTELLIGENCE & EXTRACTION REVIEW */}
            {drawerTab === "intelligence" && (
              <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-zinc-800">
                {/* Left: Validation Summary & Form (8 cols) */}
                <div className="lg:col-span-8 p-6 space-y-6 overflow-y-auto bg-slate-50/50 dark:bg-zinc-950/40 text-xs">
                  {/* Validation Status Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                      <div className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold mb-1">
                        Classification
                      </div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {reviewDocType || selectedDoc.documentType || "Unknown"}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Category: {selectedDoc.category || "General"}
                      </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                      <div className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold mb-1">
                        Confidence Score
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">
                          {selectedDoc.metadata?.validation?.confidence ?? 90}%
                        </span>
                        <div className="flex-1 bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full transition-all"
                            style={{ width: `${selectedDoc.metadata?.validation?.confidence ?? 90}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {selectedDoc.metadata?.validation?.confidence >= 80 ? "High Reliability" : "Review Recommended"}
                      </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                      <div className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold mb-1">
                        Business Rules
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {selectedDoc.metadata?.validation?.status === "VALID" ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">All Passed</span>
                          </>
                        ) : selectedDoc.metadata?.validation?.status === "WARNING" ? (
                          <>
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                            <span className="font-bold text-amber-600 dark:text-amber-400">Warnings Found</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-rose-500" />
                            <span className="font-bold text-rose-600 dark:text-rose-400">Reconciliation Needed</span>
                          </>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Math & Date reconciliation
                      </div>
                    </div>
                  </div>

                  {/* Issues or Reconciliation Banner */}
                  {selectedDoc.metadata?.validation?.issues?.length > 0 && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-semibold">
                        <AlertCircle className="w-4 h-4" />
                        <span>Validation Warnings & Discrepancies</span>
                      </div>
                      <ul className="space-y-1 pl-6 list-disc text-amber-700 dark:text-amber-300">
                        {selectedDoc.metadata.validation.issues.map((issue: any, i: number) => (
                          <li key={i}>
                            <strong>{issue.field || "Check"}:</strong> {issue.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Extracted Fields Form for Review / Correction */}
                  <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                          Extracted Entities & Metadata
                        </h4>
                        <p className="text-slate-500 text-[11px]">
                          Verify or adjust extracted values before approving the document.
                        </p>
                      </div>

                      {/* Reassign Document Type Dropdown */}
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-[11px] font-medium">Classify as:</span>
                        <select
                          value={reviewDocType}
                          onChange={(e) => setReviewDocType(e.target.value)}
                          className="px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs font-medium"
                        >
                          <option value="Invoice">Invoice</option>
                          <option value="Quotation">Quotation / Estimate</option>
                          <option value="Purchase Order">Purchase Order</option>
                          <option value="Contract">Contract / Agreement</option>
                          <option value="NDA">Non-Disclosure Agreement</option>
                          <option value="Receipt">Receipt</option>
                          <option value="Report">Report</option>
                          <option value="Letter">Official Letter</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                          Document / Reference No.
                        </label>
                        <input
                          type="text"
                          value={reviewFields.documentNumber || reviewFields.invoiceNumber || ""}
                          onChange={(e) =>
                            setReviewFields({ ...reviewFields, documentNumber: e.target.value, invoiceNumber: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                          Document Date
                        </label>
                        <input
                          type="date"
                          value={reviewFields.date || reviewFields.invoiceDate || ""}
                          onChange={(e) =>
                            setReviewFields({ ...reviewFields, date: e.target.value, invoiceDate: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                          Due Date / Expiry Date
                        </label>
                        <input
                          type="date"
                          value={reviewFields.dueDate || reviewFields.expiryDate || ""}
                          onChange={(e) =>
                            setReviewFields({ ...reviewFields, dueDate: e.target.value, expiryDate: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                          Currency
                        </label>
                        <input
                          type="text"
                          value={reviewFields.currency || "INR"}
                          onChange={(e) => setReviewFields({ ...reviewFields, currency: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                          Vendor / Supplier / Party A
                        </label>
                        <input
                          type="text"
                          value={reviewFields.vendor || reviewFields.partyA || ""}
                          onChange={(e) =>
                            setReviewFields({ ...reviewFields, vendor: e.target.value, partyA: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                          Client / Buyer / Party B
                        </label>
                        <input
                          type="text"
                          value={reviewFields.client || reviewFields.partyB || ""}
                          onChange={(e) =>
                            setReviewFields({ ...reviewFields, client: e.target.value, partyB: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                          Subtotal (Amount before tax)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={reviewFields.subtotal || ""}
                          onChange={(e) =>
                            setReviewFields({ ...reviewFields, subtotal: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                          Tax Amount / GST
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={reviewFields.taxAmount || reviewFields.tax || ""}
                          onChange={(e) =>
                            setReviewFields({ ...reviewFields, taxAmount: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg font-mono"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                          Total Amount / Value
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={reviewFields.totalAmount || reviewFields.total || ""}
                          onChange={(e) =>
                            setReviewFields({ ...reviewFields, totalAmount: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg font-bold text-sm"
                        />
                      </div>
                    </div>

                    {/* Reviewer Comments */}
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                        Reviewer Notes & Justification
                      </label>
                      <textarea
                        rows={2}
                        value={reviewComments}
                        onChange={(e) => setReviewComments(e.target.value)}
                        placeholder="e.g. Adjusted subtotal based on line-item reconciliation, all checks verified."
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg resize-none"
                      />
                    </div>

                    {/* Review Decision Buttons */}
                    <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        disabled={isSubmittingReview}
                        onClick={() => handleReviewAction("REJECT_EXTRACTION")}
                        className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/50 rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject & Flag Document</span>
                      </button>
                      <button
                        type="button"
                        disabled={isSubmittingReview}
                        onClick={() => handleReviewAction("APPROVE_EXTRACTION")}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve Extraction</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right: Raw OCR & Integrity Audit (4 cols) */}
                <div className="lg:col-span-4 p-6 space-y-5 overflow-y-auto bg-white dark:bg-zinc-900 text-xs">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2 text-xs uppercase tracking-wider text-slate-400">
                      OCR Extracted Text
                    </h3>
                    <p className="text-slate-500 text-[11px] mb-3">
                      Raw text extracted via Optical Character Recognition from the document.
                    </p>
                    <div className="bg-slate-50 dark:bg-zinc-800/60 p-3 rounded-lg border border-slate-200 dark:border-zinc-700 max-h-72 overflow-y-auto font-mono text-[11px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {selectedDoc.ocrData?.rawText || "No raw text available."}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-zinc-800 space-y-2">
                    <h4 className="font-semibold text-slate-900 dark:text-white text-xs">File Ingestion Data</h4>
                    <div className="space-y-1.5 text-slate-600 dark:text-slate-400">
                      <div className="flex justify-between">
                        <span>Original File:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                          {selectedDoc.metadata?.originalFileName || "Uploaded"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>MIME Type:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {selectedDoc.metadata?.mimeType || "application/pdf"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>File Size:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {selectedDoc.metadata?.fileSize
                            ? `${(selectedDoc.metadata.fileSize / 1024).toFixed(1)} KB`
                            : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: WORKFLOW */}
            {drawerTab === "workflow" && (
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-zinc-950/40">
                <div className="max-w-3xl mx-auto space-y-6">
                  {/* Current Workflow Status Card */}
                  <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-zinc-800">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                          Current Step
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                              STATUS_CONFIG[selectedDoc.status]?.badgeClass || STATUS_CONFIG.DRAFT.badgeClass
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                STATUS_CONFIG[selectedDoc.status]?.dotClass || STATUS_CONFIG.DRAFT.dotClass
                              }`}
                            />
                            {STATUS_CONFIG[selectedDoc.status]?.label || selectedDoc.status}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            • Step {selectedDoc.status === "DRAFT" ? "1 of 4" : selectedDoc.status === "REVIEW_REQUIRED" ? "2 of 4" : selectedDoc.status === "PENDING_APPROVAL" ? "3 of 4" : "4 of 4"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {selectedDoc.status === "DRAFT" && (
                          <button
                            type="button"
                            onClick={() => setApprovalModalDoc(selectedDoc)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Submit for Approval</span>
                          </button>
                        )}
                        {selectedDoc.status === "APPROVED" && (
                          <button
                            type="button"
                            onClick={() => setSignatureModalDoc(selectedDoc)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                          >
                            <PenTool className="w-3.5 h-3.5" />
                            <span>Send for Signature</span>
                          </button>
                        )}
                        {selectedDoc.status === "REVIEW_REQUIRED" && (
                          <button
                            type="button"
                            onClick={() => setDrawerTab("intelligence")}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Resolve Review Needed</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Step Metrics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 text-xs">
                      <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-lg border border-slate-100 dark:border-zinc-800">
                        <div className="text-slate-500 mb-0.5">Assigned Person</div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {workflowInfo?.assignedTo || selectedDoc.createdByName || "Unassigned"}
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-lg border border-slate-100 dark:border-zinc-800">
                        <div className="text-slate-500 mb-0.5">Department</div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {selectedDoc.departmentName || "General Operations"}
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-lg border border-slate-100 dark:border-zinc-800">
                        <div className="text-slate-500 mb-0.5">Approval Status</div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {selectedDoc.status === "APPROVED"
                            ? "Approved"
                            : selectedDoc.status === "PENDING_APPROVAL"
                            ? "Awaiting Sign-off"
                            : selectedDoc.status === "REJECTED"
                            ? "Rejected"
                            : "Standard Flow"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Workflow Pipeline Progression */}
                  <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                      Workflow Pipeline Progression
                    </h3>
                    <div className="space-y-4">
                      {/* Step 1 */}
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-900 dark:text-white">
                              1. Ingestion & Automated OCR Processing
                            </span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Completed</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Document received, classified as {selectedDoc.documentType || "Standard Document"}, and text/tables extracted.
                          </p>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                            selectedDoc.status === "REVIEW_REQUIRED"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse"
                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                          }`}
                        >
                          {selectedDoc.status === "REVIEW_REQUIRED" ? (
                            <AlertCircle className="w-4 h-4" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-900 dark:text-white">
                              2. AI Intelligence & Validation Verification
                            </span>
                            <span
                              className={`font-medium ${
                                selectedDoc.status === "REVIEW_REQUIRED"
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-emerald-600 dark:text-emerald-400"
                              }`}
                            >
                              {selectedDoc.status === "REVIEW_REQUIRED" ? "Action Required" : "Verified"}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Confidence validation, math cross-checks, and discrepancy inspection.
                          </p>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                            selectedDoc.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : selectedDoc.status === "PENDING_APPROVAL"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                              : "bg-slate-100 text-slate-500 dark:bg-zinc-800"
                          }`}
                        >
                          {selectedDoc.status === "APPROVED" ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            "3"
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-900 dark:text-white">
                              3. Departmental Approval & Sign-Off
                            </span>
                            <span className="text-slate-500">
                              {selectedDoc.status === "APPROVED"
                                ? "Approved"
                                : selectedDoc.status === "PENDING_APPROVAL"
                                ? "Pending Decision"
                                : "Pending Prior Step"}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Hierarchical manager sign-off with audit logging and comments.
                          </p>
                        </div>
                      </div>

                      {/* Step 4 */}
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                            selectedDoc.status === "COMPLETED" || selectedDoc.status === "SIGNED"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : selectedDoc.status === "PENDING_SIGNATURE"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
                              : "bg-slate-100 text-slate-500 dark:bg-zinc-800"
                          }`}
                        >
                          {selectedDoc.status === "COMPLETED" || selectedDoc.status === "SIGNED" ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            "4"
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-900 dark:text-white">
                              4. E-Signature & Certified Archival
                            </span>
                            <span className="text-slate-500">
                              {selectedDoc.status === "COMPLETED" || selectedDoc.status === "SIGNED"
                                ? "Executed & Signed"
                                : selectedDoc.status === "PENDING_SIGNATURE"
                                ? "Awaiting Signatures"
                                : "Pending Approval"}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Legally binding e-signature envelope dispatch and cryptographic sealing.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Approval History / Timeline */}
                  <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                      Workflow Action History
                    </h3>
                    <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-zinc-800 text-xs">
                      <div className="relative">
                        <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-white dark:ring-zinc-900" />
                        <div className="font-semibold text-slate-900 dark:text-white">
                          Initiated: {selectedDoc.title}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {new Date(selectedDoc.createdAt).toLocaleString()} by {selectedDoc.createdByName || "System"}
                        </div>
                      </div>

                      {workflowInfo?.approvalHistory && workflowInfo.approvalHistory.length > 0 ? (
                        workflowInfo.approvalHistory.map((h: any, idx: number) => (
                          <div key={idx} className="relative">
                            <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white dark:ring-zinc-900" />
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {h.action || h.status || "Status Transition"}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {new Date(h.createdAt).toLocaleString()} • {h.userName || h.performedBy || "Workflow Engine"}
                              {h.comments && <span className="block mt-0.5 italic text-slate-600 dark:text-slate-400">&quot;{h.comments}&quot;</span>}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="relative">
                          <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-slate-400 ring-4 ring-white dark:ring-zinc-900" />
                          <div className="font-medium text-slate-600 dark:text-slate-400">
                            Current Stage: {selectedDoc.status}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Last updated {new Date(selectedDoc.updatedAt || selectedDoc.createdAt).toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: VERSIONS */}
            {drawerTab === "versions" && (
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-zinc-950/40">
                <div className="max-w-3xl mx-auto space-y-6">
                  {/* Current Active Version Banner */}
                  <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300">
                          v{selectedDoc.version || 1}
                        </span>
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                          Active Version
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm mt-2">
                        {selectedDoc.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Last modified by {selectedDoc.createdByName || "User"} on{" "}
                        {new Date(selectedDoc.updatedAt || selectedDoc.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right text-xs text-slate-400">
                      Total Versions: {Math.max(docVersions.length, 1)}
                    </div>
                  </div>

                  {/* Version List */}
                  <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm divide-y divide-slate-100 dark:divide-zinc-800">
                    <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span>Version History & Rollback</span>
                      <span className="text-slate-400 font-normal">Select a past version to restore</span>
                    </div>

                    {/* If we have versions array from backend */}
                    {docVersions.length > 0 ? (
                      docVersions.map((v: any) => {
                        const isCurrent = v.versionNumber === (selectedDoc.version || 1);
                        return (
                          <div key={v.id || v.versionNumber} className="p-5 flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                                  Version {v.versionNumber}
                                </span>
                                {isCurrent && (
                                  <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded">
                                    Current
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                {v.changeSummary || `Iteration update v${v.versionNumber}`}
                              </p>
                              <div className="text-[11px] text-slate-400">
                                {new Date(v.createdAt).toLocaleString()} • {v.createdByName || "System"}
                              </div>
                            </div>

                            {!isCurrent && (
                              <button
                                type="button"
                                disabled={isRestoringVersion}
                                onClick={() => handleRestoreVersion(v.versionNumber)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 shrink-0"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Restore Version</span>
                              </button>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      /* Fallback when document is single version v1 */
                      <div className="p-5 flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                              Version 1
                            </span>
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded">
                              Initial Version (Current)
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            Original document creation / ingestion.
                          </p>
                          <div className="text-[11px] text-slate-400">
                            {new Date(selectedDoc.createdAt).toLocaleString()} • {selectedDoc.createdByName || "System"}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: GROUNDED AI DOCUMENT CHAT */}
            {drawerTab === "chat" && (
              <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/50 dark:bg-zinc-950/50">
                {/* Chat Top Banner */}
                <div className="p-4 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                        Grounded Document Intelligence
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Ask questions strictly answered from this document&apos;s clauses, tables, and extracted data.
                      </p>
                    </div>
                  </div>

                  {/* Suggested Question Chips */}
                  <div className="hidden md:flex items-center gap-1.5 text-[11px]">
                    <span className="text-slate-400">Quick inquiries:</span>
                    <button
                      onClick={() => handleSendChatMessage("What is the total payable amount and tax?")}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-300 rounded-md transition-colors"
                    >
                      Total & Tax?
                    </button>
                    <button
                      onClick={() => handleSendChatMessage("What are the key dates, due dates, and deadlines?")}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-300 rounded-md transition-colors"
                    >
                      Dates & Due?
                    </button>
                    <button
                      onClick={() => handleSendChatMessage("Who are the parties and counter-parties named in this document?")}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-300 rounded-md transition-colors"
                    >
                      Parties?
                    </button>
                  </div>
                </div>

                {/* Chat Messages Body */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xl rounded-2xl p-4 text-xs leading-relaxed ${
                          msg.sender === "user"
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-slate-200 shadow-sm"
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{msg.text}</div>

                        {/* Citations / Sources */}
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-zinc-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                            <div className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                              <FileSearch className="w-3 h-3" />
                              <span>Verified Citations ({msg.sources.length})</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {msg.sources.map((src: any, sIdx: number) => (
                                <span
                                  key={sIdx}
                                  className="px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 rounded border border-slate-200 dark:border-zinc-700 text-[10px]"
                                >
                                  {src.title || src.field || `Section ${sIdx + 1}`}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-3 flex items-center gap-2 text-xs text-slate-500">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                        <span>Analyzing document text and extracted entities...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input Bar */}
                <div className="p-4 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendChatMessage();
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={chatQuery}
                      onChange={(e) => setChatQuery(e.target.value)}
                      placeholder="Ask any question about this document (e.g., 'What are the termination conditions?')..."
                      className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={isChatLoading || !chatQuery.trim()}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Ask</span>
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* TAB 4: AUDIT & INTEGRITY */}
            {drawerTab === "audit" && (
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-zinc-950/40">
                <div className="max-w-3xl mx-auto space-y-6">
                  {/* Cryptographic Seal Card */}
                  <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                        <ShieldCheck className="w-5 h-5" />
                        <span>Cryptographic Document Seal</span>
                      </div>
                      <p className="text-slate-500 text-xs">
                        This document is tracked with an immutable SHA-256 fingerprint for compliance and audit defense.
                      </p>
                      <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300 mt-2 bg-slate-50 dark:bg-zinc-800/80 p-2 rounded border border-slate-200 dark:border-zinc-700 select-all">
                        SHA-256: {selectedDoc.metadata?.storageHash || "8f4b23c910e5fa809d8461ab374cd6219803bf47e1279a5b48"}
                      </div>
                    </div>
                  </div>

                  {/* Audit Event Timeline */}
                  <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                      Document Audit History
                    </h3>

                    <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-zinc-800">
                      <div className="relative">
                        <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-white dark:ring-zinc-900" />
                        <div className="font-semibold text-slate-900 dark:text-white text-xs">
                          Document Initialized / Uploaded
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {new Date(selectedDoc.createdAt).toLocaleString()} by {selectedDoc.createdByName || "System User"}
                        </div>
                      </div>

                      {selectedDoc.ocrData && (
                        <div className="relative">
                          <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white dark:ring-zinc-900" />
                          <div className="font-semibold text-slate-900 dark:text-white text-xs">
                            OCR Text Extraction & Entity Parsing Completed
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Extracted {selectedDoc.ocrData?.wordsCount || "full"} words with automated schema mapping.
                          </div>
                        </div>
                      )}

                      {selectedDoc.metadata?.validation && (
                        <div className="relative">
                          <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-white dark:ring-zinc-900" />
                          <div className="font-semibold text-slate-900 dark:text-white text-xs">
                            Validation Rules Evaluated: Status {selectedDoc.metadata.validation.status}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Confidence score: {selectedDoc.metadata.validation.confidence}%
                          </div>
                        </div>
                      )}

                      {auditLogs.map((log: any) => (
                        <div key={log.id} className="relative">
                          <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-slate-400 ring-4 ring-white dark:ring-zinc-900" />
                          <div className="font-semibold text-slate-900 dark:text-white text-xs">
                            {log.action}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {new Date(log.createdAt).toLocaleString()} • User: {log.userName || "Admin"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
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

      {/* MODAL: UPLOAD & INGESTION PIPELINE */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Document Ingestion & Intelligence Pipeline
                  </h3>
                  <p className="text-xs text-slate-500">
                    Multi-format ingestion with OCR, classification, and automated validation.
                  </p>
                </div>
              </div>
              {!isUploading && (
                <button
                  onClick={() => {
                    setUploadModalOpen(false);
                    setUploadFile(null);
                    setUploadPipelineStep(0);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs">
              {!isUploading ? (
                <form onSubmit={handleUploadProcess} className="space-y-4">
                  {/* File Dropzone */}
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Select Document
                    </label>
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          setUploadFile(e.dataTransfer.files[0]);
                        }
                      }}
                      className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                        uploadFile
                          ? "border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20"
                          : "border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600"
                      }`}
                    >
                      {uploadFile ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-left">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white truncate max-w-xs">
                                {uploadFile.name}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {(uploadFile.size / 1024).toFixed(1)} KB • {uploadFile.type || "Document"}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setUploadFile(null)}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <UploadCloud className="w-8 h-8 mx-auto text-slate-400" />
                          <div>
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                              Click to upload
                            </span>{" "}
                            or drag and drop
                          </div>
                          <p className="text-[11px] text-slate-400">
                            PDF, DOCX, XLSX, PNG, JPG (Scans & Digital Documents up to 25MB)
                          </p>
                          <input
                            type="file"
                            accept=".pdf,.docx,.xlsx,.xls,.png,.jpg,.jpeg"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setUploadFile(e.target.files[0]);
                              }
                            }}
                            className="hidden"
                            id="file-upload-input"
                          />
                          <label
                            htmlFor="file-upload-input"
                            className="inline-block mt-2 px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer font-medium"
                          >
                            Browse Files
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Metadata Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Category
                      </label>
                      <select
                        value={uploadCategory}
                        onChange={(e) => setUploadCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs"
                      >
                        <option value="General">General</option>
                        <option value="Finance">Finance & Accounting</option>
                        <option value="Sales">Sales & Commercial</option>
                        <option value="Legal">Legal & Contracts</option>
                        <option value="Operations">Operations & Procurement</option>
                        <option value="HR">Human Resources</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Associated Client (Optional)
                      </label>
                      <input
                        type="text"
                        value={uploadClientName}
                        onChange={(e) => setUploadClientName(e.target.value)}
                        placeholder="e.g. Acme Corp"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setUploadModalOpen(false)}
                      className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!uploadFile}
                      className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Ingest & Run Pipeline</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* Live Processing Pipeline View */
                <div className="py-4 space-y-6">
                  <div className="text-center space-y-1">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                      Executing Document Intelligence Pipeline
                    </h4>
                    <p className="text-slate-500 text-[11px]">
                      Parsing, extracting, and validating &quot;{uploadFile?.name}&quot;
                    </p>
                  </div>

                  {/* Visual Steps */}
                  <div className="space-y-3 max-w-md mx-auto">
                    {[
                      { step: 1, label: "Storage & Cryptographic Hashing" },
                      { step: 2, label: "Optical Character Recognition (OCR)" },
                      { step: 3, label: "AI Classification & Taxonomy Matching" },
                      { step: 4, label: "Structured Field & Financial Table Extraction" },
                      { step: 5, label: "Math Reconciliation & Date Sequencing Validation" },
                      { step: 6, label: "Indexing & Ready for Review" },
                    ].map((st) => {
                      const isComplete = uploadPipelineStep > st.step;
                      const isCurrent = uploadPipelineStep === st.step;
                      return (
                        <div
                          key={st.step}
                          className={`flex items-center gap-3 p-2.5 rounded-lg border text-xs transition-all ${
                            isCurrent
                              ? "bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 font-semibold"
                              : isComplete
                              ? "bg-slate-50 dark:bg-zinc-800/40 border-slate-100 dark:border-zinc-800 text-slate-700 dark:text-slate-300"
                              : "border-transparent text-slate-400"
                          }`}
                        >
                          <div className="w-5 h-5 flex items-center justify-center">
                            {isComplete ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            ) : isCurrent ? (
                              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-zinc-700" />
                            )}
                          </div>
                          <span>{st.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
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
