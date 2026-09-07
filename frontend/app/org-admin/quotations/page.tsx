"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus, Search, Filter, RefreshCw, Receipt, FileText, Send, Eye,
  CheckCircle2, XCircle, Clock, AlertCircle, Sparkles, Copy,
  Download, MoreVertical, Trash2, ArrowUpRight, TrendingUp,
  DollarSign, CheckSquare, Layers, ExternalLink
} from "lucide-react";
import apiClient from "@/lib/axios";

interface QuotationItem {
  id: string;
  title: string;
  description?: string | null;
  quantity: number;
  unit?: string | null;
  unitPrice: number;
  amount: number;
}

interface Quotation {
  id: string;
  quotationNumber: string;
  title: string;
  status: "DRAFT" | "GENERATED" | "SENT" | "VIEWED" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  clientName: string;
  clientEmail?: string | null;
  clientContactPerson?: string | null;
  currency: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  issueDate: string;
  expiryDate?: string | null;
  publicShareToken: string;
  createdAt: string;
  items: QuotationItem[];
  template?: { name: string; category: string } | null;
  acceptance?: { decision: string; signerName: string; acceptedAt: string } | null;
  _count?: { recipients: number; views: number };
}

interface QuotationMetrics {
  totalCount: number;
  draftCount: number;
  sentCount: number;
  viewedCount: number;
  acceptedCount: number;
  rejectedCount: number;
  totalPipelineValue: number;
  acceptedRevenue: number;
  conversionRate: number;
}

const STATUS_BADGE: Record<string, { bg: string; text: string; border: string; icon: any }> = {
  DRAFT: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200", icon: Clock },
  GENERATED: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", icon: Sparkles },
  SENT: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", icon: Send },
  VIEWED: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: Eye },
  ACCEPTED: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: CheckCircle2 },
  REJECTED: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", icon: XCircle },
  EXPIRED: { bg: "bg-zinc-100", text: "text-zinc-600", border: "border-zinc-300", icon: AlertCircle },
};

export default function QuotationsDashboardPage() {
  const router = useRouter();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [metrics, setMetrics] = useState<QuotationMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ title: string; desc?: string; type?: "success" | "error" } | null>(null);

  // Send Email Modal State
  const [sendModalQuote, setSendModalQuote] = useState<Quotation | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  const showToast = (title: string, desc?: string, type: "success" | "error" = "success") => {
    setToastMessage({ title, desc, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [listRes, metricsRes] = await Promise.all([
        apiClient.get(`/api/quotations?status=${statusFilter}&search=${encodeURIComponent(search)}`),
        apiClient.get(`/api/quotations/metrics`),
      ]);

      if (listRes.data?.success) {
        setQuotations(listRes.data.data || []);
      }
      if (metricsRes.data?.success) {
        setMetrics(metricsRes.data.data);
      }
    } catch (err: any) {
      console.error("Failed to load quotations:", err);
      showToast("Error", err.response?.data?.message || err.message, "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDuplicate = async (id: string) => {
    try {
      const res = await apiClient.post(`/api/quotations/${id}/duplicate`);
      if (res.data?.success) {
        showToast("Duplicated Successfully", `Created ${res.data.data.quotationNumber}`);
        loadData();
      }
    } catch (err: any) {
      showToast("Duplicate Failed", err.response?.data?.message || err.message, "error");
    }
  };

  const handleDelete = async (id: string, quoteNum: string) => {
    if (!confirm(`Are you sure you want to delete quotation ${quoteNum}?`)) return;
    try {
      await apiClient.delete(`/api/quotations/${id}`);
      showToast("Deleted", `Quotation ${quoteNum} removed.`);
      loadData();
    } catch (err: any) {
      showToast("Delete Failed", err.response?.data?.message || err.message, "error");
    }
  };

  const handleCopyLink = (token: string, quoteNum: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/quotations/view/${token}`;
    navigator.clipboard.writeText(url);
    showToast("Link Copied!", `Client portal link for ${quoteNum} copied to clipboard.`);
  };

  const handleDownloadPdf = (id: string, quoteNum: string) => {
    window.open(`/api/quotations/${id}/download-pdf`, "_blank");
  };

  const openSendModal = (quote: Quotation) => {
    setSendModalQuote(quote);
    setRecipientEmail(quote.clientEmail || "");
    setRecipientName(quote.clientContactPerson || quote.clientName || "");
    setCustomMessage(`Please find attached quotation ${quote.quotationNumber} for ${quote.title}. You can review and approve it directly via our client portal.`);
  };

  const handleDispatchEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendModalQuote) return;
    if (!recipientEmail.trim()) {
      showToast("Missing Email", "Recipient email is required.", "error");
      return;
    }

    try {
      setSendingEmail(true);
      const res = await apiClient.post(`/api/quotations/${sendModalQuote.id}/send-email`, {
        recipientEmail: recipientEmail.trim(),
        recipientName: recipientName.trim(),
        customMessage: customMessage.trim(),
      });

      if (res.data?.success) {
        showToast("Email Dispatched!", `Quotation sent successfully to ${recipientEmail}`);
        setSendModalQuote(null);
        loadData();
      }
    } catch (err: any) {
      showToast("Dispatch Failed", err.response?.data?.message || err.message, "error");
    } finally {
      setSendingEmail(false);
    }
  };

  const formatCurrency = (val: number, curr = "INR") => {
    const sym = curr === "INR" ? "₹" : curr === "USD" ? "$" : `${curr} `;
    return `${sym}${Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md transition-all ${
            toastMessage.type === "error"
              ? "bg-rose-50/95 text-rose-800 border-rose-200"
              : "bg-emerald-50/95 text-emerald-800 border-emerald-200"
          }`}
        >
          {toastMessage.type === "error" ? <AlertCircle className="w-5 h-5 text-rose-600" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
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
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Quotations & Proposals</h1>
              <p className="text-sm text-slate-500">
                Generate high-converting proposals with AI, manage reusable templates, and dispatch vector PDFs with digital acceptance.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData()}
            disabled={refreshing}
            className="p-2.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition border border-slate-200"
            title="Refresh Quotations"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>

          <Link
            href="/org-admin/quotations/templates"
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 shadow-sm transition"
          >
            <Layers className="w-4 h-4 text-slate-500" />
            <span>Templates</span>
          </Link>

          <Link
            href="/org-admin/quotations/new"
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 transition group"
          >
            <Sparkles className="w-4 h-4 text-blue-200 group-hover:rotate-12 transition-transform" />
            <span>Create Quotation</span>
          </Link>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Pipeline</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatCurrency(metrics?.totalPipelineValue || 0)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Across {metrics?.totalCount || 0} active quotation proposals
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Accepted Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {formatCurrency(metrics?.acceptedRevenue || 0)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {metrics?.acceptedCount || 0} deals won & signed off
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Win / Conversion Rate</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {metrics?.conversionRate || 0}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {metrics?.sentCount || 0} sent • {metrics?.viewedCount || 0} viewed
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">In Progress & Drafts</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {metrics?.draftCount || 0} Drafts
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {metrics?.rejectedCount || 0} declined proposals
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "ALL", label: "All" },
            { id: "DRAFT", label: "Drafts" },
            { id: "SENT", label: "Sent" },
            { id: "VIEWED", label: "Viewed" },
            { id: "ACCEPTED", label: "Accepted" },
            { id: "REJECTED", label: "Declined" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition ${
                statusFilter === tab.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {tab.label}
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
            placeholder="Search by quote #, client, title..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* Quotations List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-24 text-center">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <div className="text-sm font-medium text-slate-600">Loading quotations...</div>
          </div>
        ) : quotations.length === 0 ? (
          <div className="py-20 text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">No Quotations Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
              {search || statusFilter !== "ALL"
                ? "No quotations match your current search or status filter criteria."
                : "Create your first AI-assisted quotation or pick from our ready-made enterprise templates."}
            </p>
            <Link
              href="/org-admin/quotations/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create New Quotation</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Quotation #</th>
                  <th className="py-3.5 px-4">Client & Contact</th>
                  <th className="py-3.5 px-4">Subject / Deliverables</th>
                  <th className="py-3.5 px-4 text-right">Total Amount</th>
                  <th className="py-3.5 px-4">Dates</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {quotations.map((q) => {
                  const badge = STATUS_BADGE[q.status] || STATUS_BADGE.DRAFT;
                  const Icon = badge.icon;

                  return (
                    <tr key={q.id} className="hover:bg-slate-50/70 transition group">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Link
                          href={`/org-admin/quotations/${q.id}`}
                          className="font-mono font-bold text-blue-600 hover:underline flex items-center gap-1.5"
                        >
                          {q.quotationNumber}
                          <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                        {q.template && (
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <span>Tpl: {q.template.name}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{q.clientName}</div>
                        <div className="text-[11px] text-slate-400">
                          {[q.clientContactPerson, q.clientEmail].filter(Boolean).join(" • ") || "No contact info"}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-medium text-slate-800 truncate" title={q.title}>
                          {q.title}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {q.items.length} line {q.items.length === 1 ? "item" : "items"}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="font-bold text-slate-900">
                          {formatCurrency(q.total, q.currency)}
                        </div>
                        {q.discountAmount > 0 && (
                          <div className="text-[10px] text-emerald-600 font-medium">
                            Disc: -{formatCurrency(q.discountAmount, q.currency)}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-[11px]">
                        <div>Issued: {formatDate(q.issueDate)}</div>
                        <div className="text-slate-400">Valid: {formatDate(q.expiryDate)}</div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          <Icon className="w-3 h-3" />
                          {q.status}
                        </span>
                        {q.acceptance && (
                          <div className="text-[10px] text-emerald-600 mt-0.5">
                            By {q.acceptance.signerName}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleDownloadPdf(q.id, q.quotationNumber)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleCopyLink(q.publicShareToken, q.quotationNumber)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Copy Client Portal Link"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => openSendModal(q)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            title="Send Email to Client"
                          >
                            <Send className="w-4 h-4" />
                          </button>

                          <div className="relative">
                            <button
                              onClick={() => setActiveMenuId(activeMenuId === q.id ? null : q.id)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {activeMenuId === q.id && (
                              <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-20 text-left">
                                <Link
                                  href={`/org-admin/quotations/${q.id}`}
                                  className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                                  <span>View / Edit</span>
                                </Link>

                                <a
                                  href={`/quotations/view/${q.publicShareToken}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Open Client View</span>
                                </a>

                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    handleDuplicate(q.id);
                                  }}
                                  className="w-full flex items-center gap-2 px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition"
                                >
                                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Duplicate Quote</span>
                                </button>

                                <div className="border-t border-slate-100 my-1" />

                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    handleDelete(q.id, q.quotationNumber);
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

      {/* Send Email Modal */}
      {sendModalQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Dispatch Quotation via Email
                  </h3>
                  <p className="text-xs text-slate-500">
                    {sendModalQuote.quotationNumber} • {sendModalQuote.clientName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSendModalQuote(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDispatchEmail} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipient Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="client@company.com"
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipient Name / Contact Person
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Custom Message to Client
                </label>
                <textarea
                  rows={3}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="font-semibold text-slate-800">What the client will receive:</div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  Print-ready vector PDF attachment ({sendModalQuote.quotationNumber}.pdf)
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  Instant access link to your branded online acceptance portal
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSendModalQuote(null)}
                  disabled={sendingEmail}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 transition disabled:opacity-50"
                >
                  {sendingEmail ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending PDF via SMTP...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Quotation Email</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
