"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText, Plus, Search, Filter, RefreshCw, Download, Send, Copy,
  ExternalLink, Trash2, Edit2, CheckCircle2, XCircle, Clock,
  Sparkles, Layers, ShieldCheck, ArrowUpRight, MoreVertical,
  Building2, Calendar, FileDown, CheckSquare, Archive
} from "lucide-react";
import apiClient from "@/lib/axios";

interface UnifiedDocument {
  id: string;
  documentNumber: string;
  title: string;
  documentType: string;
  category: string;
  status: string;
  clientName?: string | null;
  clientEmail?: string | null;
  clientContactPerson?: string | null;
  currentVersion: number;
  publicShareToken: string;
  createdAt: string;
  updatedAt: string;
  template?: { name: string; category: string } | null;
  acceptance?: { decision: string; signerName: string; acceptedAt: string } | null;
  _count?: { versions: number; recipients: number };
}

interface DocumentMetrics {
  totalCount: number;
  draftCount: number;
  generatedCount: number;
  sentCount: number;
  viewedCount: number;
  acceptedCount: number;
  rejectedCount: number;
}

const STATUS_BADGE: Record<string, { bg: string; text: string; border: string; icon: any }> = {
  DRAFT: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200", icon: Clock },
  GENERATED: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", icon: Sparkles },
  UNDER_REVIEW: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: Clock },
  FINAL: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", icon: CheckSquare },
  SENT: { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200", icon: Send },
  VIEWED: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", icon: FileText },
  ACCEPTED: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: CheckCircle2 },
  REJECTED: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", icon: XCircle },
  EXPIRED: { bg: "bg-zinc-100", text: "text-zinc-600", border: "border-zinc-300", icon: Clock },
  ARCHIVED: { bg: "bg-stone-100", text: "text-stone-600", border: "border-stone-300", icon: Archive },
};

export default function CentralDocumentsLibraryPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<UnifiedDocument[]>([]);
  const [metrics, setMetrics] = useState<DocumentMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Filters
  const [search, setSearch] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ title: string; desc?: string; type?: "success" | "error" } | null>(null);

  const showToast = (title: string, desc?: string, type: "success" | "error" = "success") => {
    setToastMessage({ title, desc, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadDocuments = useCallback(async () => {
    try {
      setRefreshing(true);
      const [docsRes, metricsRes] = await Promise.all([
        apiClient.get(`/api/unified-documents?category=${categoryFilter}&status=${statusFilter}&search=${encodeURIComponent(search)}`),
        apiClient.get(`/api/unified-documents/metrics`),
      ]);

      if (docsRes.data?.success) {
        setDocuments(docsRes.data.data || []);
      }
      if (metricsRes.data?.success) {
        setMetrics(metricsRes.data.data);
      }
    } catch (err: any) {
      console.error("Failed to load documents:", err);
      showToast("Error", err.response?.data?.message || err.message, "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [categoryFilter, statusFilter, search]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleDuplicate = async (id: string) => {
    try {
      const res = await apiClient.post(`/api/unified-documents/${id}/duplicate`);
      if (res.data?.success) {
        showToast("Duplicated Successfully", `Created ${res.data.data.documentNumber}`);
        loadDocuments();
      }
    } catch (err: any) {
      showToast("Duplicate Failed", err.response?.data?.message || err.message, "error");
    }
  };

  const handleDelete = async (id: string, docNum: string) => {
    if (!confirm(`Are you sure you want to delete ${docNum}?`)) return;
    try {
      await apiClient.delete(`/api/unified-documents/${id}`);
      showToast("Deleted", `Document ${docNum} removed.`);
      loadDocuments();
    } catch (err: any) {
      showToast("Delete Failed", err.response?.data?.message || err.message, "error");
    }
  };

  const handleDownloadPdf = (id: string) => {
    window.open(`/api/unified-documents/${id}/download-pdf`, "_blank");
  };

  const handleDownloadDocx = (id: string) => {
    window.open(`/api/unified-documents/${id}/download-docx`, "_blank");
  };

  const handleCopyLink = (token: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/documents/view/${token}`;
    navigator.clipboard.writeText(url);
    showToast("Link Copied!", "Client portal link copied to clipboard.");
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border backdrop-blur-md transition-all ${
            toastMessage.type === "error"
              ? "bg-rose-50/95 text-rose-800 border-rose-200"
              : "bg-emerald-50/95 text-emerald-800 border-emerald-200"
          }`}
        >
          {toastMessage.type === "error" ? <XCircle className="w-5 h-5 text-rose-600" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          <div>
            <div className="font-semibold text-sm">{toastMessage.title}</div>
            {toastMessage.desc && <div className="text-xs opacity-90">{toastMessage.desc}</div>}
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Documents Library</h1>
              <p className="text-sm text-slate-500">
                Centralized hub for all commercial, legal, HR, operational, and custom AI-generated documents.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadDocuments()}
            disabled={refreshing}
            className="p-2.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition border border-slate-200"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>

          <Link
            href="/org-admin/templates"
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 shadow-sm transition"
          >
            <Layers className="w-4 h-4 text-slate-500" />
            <span>Templates</span>
          </Link>

          <Link
            href="/org-admin/ai-builder"
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 transition group"
          >
            <Sparkles className="w-4 h-4 text-blue-200 group-hover:rotate-12 transition-transform" />
            <span>AI Document Builder</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Total Documents</div>
          <div className="text-2xl font-bold text-slate-900">{metrics?.totalCount || 0}</div>
          <div className="text-xs text-slate-400 mt-1">Across all categories & versions</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">In Draft / Review</div>
          <div className="text-2xl font-bold text-amber-600">{metrics?.draftCount || 0}</div>
          <div className="text-xs text-slate-400 mt-1">Ready for editing and refinement</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Sent & Viewed</div>
          <div className="text-2xl font-bold text-blue-600">{(metrics?.sentCount || 0) + (metrics?.viewedCount || 0)}</div>
          <div className="text-xs text-slate-400 mt-1">Dispatched via secure portals</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Signed Off & Accepted</div>
          <div className="text-2xl font-bold text-emerald-600">{metrics?.acceptedCount || 0}</div>
          <div className="text-xs text-slate-400 mt-1">Official digital counterparty sign-offs</div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            {["All", "Sales", "Business", "Legal", "HR", "Operational", "Custom"].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
                  categoryFilter === cat
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, document #, client..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pt-2 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400 mr-2 uppercase">Status:</span>
          {["ALL", "DRAFT", "GENERATED", "FINAL", "SENT", "VIEWED", "ACCEPTED", "REJECTED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition ${
                statusFilter === st
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Document Library Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-24 text-center">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <div className="text-sm font-semibold text-slate-600">Loading document library...</div>
          </div>
        ) : documents.length === 0 ? (
          <div className="py-20 text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">No Documents Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
              {search || categoryFilter !== "All" || statusFilter !== "ALL"
                ? "No documents match your current filter criteria."
                : "Create your first commercial, legal, or HR document using our Universal AI Builder."}
            </p>
            <Link
              href="/org-admin/ai-builder"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>Launch AI Builder</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Document #</th>
                  <th className="py-3.5 px-4">Title & Type</th>
                  <th className="py-3.5 px-4">Recipient / Client</th>
                  <th className="py-3.5 px-4">Version</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {documents.map((doc) => {
                  const badge = STATUS_BADGE[doc.status] || STATUS_BADGE.DRAFT;
                  const Icon = badge.icon;

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/70 transition group">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Link
                          href={`/org-admin/ai-builder?id=${doc.id}`}
                          className="font-mono font-bold text-blue-600 hover:underline flex items-center gap-1.5"
                        >
                          {doc.documentNumber}
                          <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {doc.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-slate-900 truncate" title={doc.title}>
                          {doc.title}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {doc.documentType}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {doc.clientName ? (
                          <div>
                            <div className="font-semibold text-slate-900">{doc.clientName}</div>
                            {doc.clientContactPerson && (
                              <div className="text-[11px] text-slate-400">Attn: {doc.clientContactPerson}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Internal Document</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[11px]">
                          v{doc.currentVersion}.0
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          <Icon className="w-3 h-3" />
                          {doc.status}
                        </span>
                        {doc.acceptance && (
                          <div className="text-[10px] text-emerald-600 mt-0.5">
                            Signed by {doc.acceptance.signerName}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                        {formatDate(doc.createdAt)}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleDownloadPdf(doc.id)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4 text-blue-600" />
                          </button>

                          <button
                            onClick={() => handleDownloadDocx(doc.id)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                            title="Download DOCX"
                          >
                            <FileDown className="w-4 h-4 text-indigo-600" />
                          </button>

                          <button
                            onClick={() => handleCopyLink(doc.publicShareToken)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Copy Share Link"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          <Link
                            href={`/org-admin/ai-builder?id=${doc.id}`}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                            title="Open in Studio Editor"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>

                          <div className="relative">
                            <button
                              onClick={() => setActiveMenuId(activeMenuId === doc.id ? null : doc.id)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {activeMenuId === doc.id && (
                              <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-20 text-left">
                                <a
                                  href={`/documents/view/${doc.publicShareToken}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Client Portal View</span>
                                </a>

                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    handleDuplicate(doc.id);
                                  }}
                                  className="w-full flex items-center gap-2 px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition"
                                >
                                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Duplicate</span>
                                </button>

                                <div className="border-t border-slate-100 my-1" />

                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    handleDelete(doc.id, doc.documentNumber);
                                  }}
                                  className="w-full flex items-center gap-2 px-3.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
