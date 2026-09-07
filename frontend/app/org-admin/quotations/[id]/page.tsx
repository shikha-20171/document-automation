"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Download, Send, Copy, ExternalLink, RefreshCw, CheckCircle2,
  XCircle, Clock, Sparkles, Building2, Layers, Trash2, Edit2, Save,
  AlertCircle, ShieldCheck, Mail, Eye, Calendar, DollarSign, FileText
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

interface QuotationRecipient {
  id: string;
  recipientEmail: string;
  recipientName?: string | null;
  sentAt: string;
  deliveryStatus: string;
  deliveryError?: string | null;
}

interface QuotationStatusHistory {
  id: string;
  previousStatus?: string | null;
  newStatus: string;
  reason?: string | null;
  actorType: string;
  actorName?: string | null;
  createdAt: string;
}

interface QuotationAcceptance {
  id: string;
  decision: "ACCEPTED" | "REJECTED";
  signerName: string;
  signerEmail: string;
  signerDesignation?: string | null;
  clientComments?: string | null;
  signerIp?: string | null;
  acceptedAt: string;
}

interface QuotationDetail {
  id: string;
  quotationNumber: string;
  title: string;
  status: "DRAFT" | "GENERATED" | "SENT" | "VIEWED" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  clientName: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
  clientAddress?: string | null;
  clientContactPerson?: string | null;
  currency: string;
  subtotal: number;
  discountType?: string | null;
  discountValue: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  issueDate: string;
  expiryDate?: string | null;
  notes?: string | null;
  termsAndConditions?: string | null;
  paymentTerms?: string | null;
  bankDetails?: any;
  senderDetails?: any;
  publicShareToken: string;
  createdAt: string;
  items: QuotationItem[];
  recipients: QuotationRecipient[];
  statusHistory: QuotationStatusHistory[];
  acceptance?: QuotationAcceptance | null;
  organisation?: { name: string; branch?: string; city?: string } | null;
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

export default function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const quotationId = resolvedParams.id;
  const router = useRouter();

  const [quotation, setQuotation] = useState<QuotationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"preview" | "audit" | "emails">("preview");
  const [toastMessage, setToastMessage] = useState<{ title: string; desc?: string; type?: "success" | "error" } | null>(null);

  // Send Email Modal
  const [showSendModal, setShowSendModal] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  // Save as Template Modal
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateCategory, setTemplateCategory] = useState("Software");
  const [savingTemplate, setSavingTemplate] = useState(false);

  const showToast = (title: string, desc?: string, type: "success" | "error" = "success") => {
    setToastMessage({ title, desc, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadQuotation = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/api/quotations/${quotationId}`);
      if (res.data?.success && res.data.data) {
        setQuotation(res.data.data);
        setRecipientEmail(res.data.data.clientEmail || "");
        setRecipientName(res.data.data.clientContactPerson || res.data.data.clientName || "");
        setTemplateName(`${res.data.data.title} Template`);
      }
    } catch (err: any) {
      showToast("Load Failed", err.response?.data?.message || err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [quotationId]);

  useEffect(() => {
    loadQuotation();
  }, [loadQuotation]);

  const handleCopyLink = () => {
    if (!quotation) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/quotations/view/${quotation.publicShareToken}`;
    navigator.clipboard.writeText(url);
    showToast("Link Copied!", "Client portal link copied to clipboard.");
  };

  const handleDownloadPdf = () => {
    window.open(`/api/quotations/${quotationId}/download-pdf`, "_blank");
  };

  const handleDispatchEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotation || !recipientEmail.trim()) return;

    try {
      setSendingEmail(true);
      const res = await apiClient.post(`/api/quotations/${quotationId}/send-email`, {
        recipientEmail: recipientEmail.trim(),
        recipientName: recipientName.trim(),
        customMessage: customMessage.trim(),
      });

      if (res.data?.success) {
        showToast("Email Dispatched!", `Quotation dispatched to ${recipientEmail}`);
        setShowSendModal(false);
        loadQuotation();
      }
    } catch (err: any) {
      showToast("Dispatch Failed", err.response?.data?.message || err.message, "error");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSaveAsTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) return;

    try {
      setSavingTemplate(true);
      const res = await apiClient.post(`/api/quotations/${quotationId}/save-as-template`, {
        name: templateName.trim(),
        category: templateCategory,
      });

      if (res.data?.success) {
        showToast("Template Created!", `Saved reusable template "${templateName}"`);
        setShowTemplateModal(false);
      }
    } catch (err: any) {
      showToast("Failed to Create Template", err.response?.data?.message || err.message, "error");
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDuplicate = async () => {
    try {
      const res = await apiClient.post(`/api/quotations/${quotationId}/duplicate`);
      if (res.data?.success) {
        showToast("Duplicated!", `Created ${res.data.data.quotationNumber}`);
        router.push(`/org-admin/quotations/${res.data.data.id}`);
      }
    } catch (err: any) {
      showToast("Duplicate Failed", err.response?.data?.message || err.message, "error");
    }
  };

  const handleDelete = async () => {
    if (!quotation) return;
    if (!confirm(`Are you sure you want to delete quotation ${quotation.quotationNumber}?`)) return;
    try {
      await apiClient.delete(`/api/quotations/${quotationId}`);
      showToast("Deleted", "Quotation removed.");
      router.push("/org-admin/quotations");
    } catch (err: any) {
      showToast("Delete Failed", err.response?.data?.message || err.message, "error");
    }
  };

  const formatCurrency = (val: number, curr = quotation?.currency || "INR") => {
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

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <div className="text-sm font-semibold text-slate-700">Loading quotation details...</div>
        </div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-1">Quotation Not Found</h2>
          <p className="text-xs text-slate-500 mb-4">
            The requested quotation could not be located or you don't have access permissions.
          </p>
          <Link
            href="/org-admin/quotations"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  const badge = STATUS_BADGE[quotation.status] || STATUS_BADGE.DRAFT;
  const Icon = badge.icon;

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 space-y-6">
      {/* Toast */}
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

      {/* Top Action & Status Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/org-admin/quotations"
            className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-mono text-slate-900">{quotation.quotationNumber}</h1>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
              >
                <Icon className="w-3 h-3" />
                {quotation.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Client: <strong className="text-slate-700">{quotation.clientName}</strong> • Issued: {formatDate(quotation.issueDate)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition"
          >
            <Copy className="w-3.5 h-3.5 text-blue-600" />
            <span>Copy View Link</span>
          </button>

          <a
            href={`/quotations/view/${quotation.publicShareToken}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Client View</span>
          </a>

          <button
            onClick={() => setShowSendModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Dispatch via Email</span>
          </button>

          <button
            onClick={() => setShowTemplateModal(true)}
            className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            title="Save as Reusable Template"
          >
            <Layers className="w-4 h-4" />
          </button>

          <button
            onClick={handleDuplicate}
            className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            title="Duplicate Quotation"
          >
            <Copy className="w-4 h-4" />
          </button>

          <button
            onClick={handleDelete}
            className="p-2 text-slate-500 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-xl transition"
            title="Delete Quotation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Acceptance Banner if Accepted */}
      {quotation.acceptance && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-emerald-950">
                Official Digital Sign-off Completed
              </div>
              <div className="text-xs text-emerald-700">
                Signed by <strong>{quotation.acceptance.signerName}</strong> ({quotation.acceptance.signerEmail})
                {quotation.acceptance.signerDesignation ? ` • ${quotation.acceptance.signerDesignation}` : ""}
                {" • "}{formatDateTime(quotation.acceptance.acceptedAt)}
              </div>
            </div>
          </div>
          {quotation.acceptance.clientComments && (
            <div className="bg-white/80 px-4 py-2 rounded-xl border border-emerald-200 text-xs text-emerald-800 max-w-md">
              <span className="font-semibold">Client Remarks:</span> "{quotation.acceptance.clientComments}"
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {[
          { id: "preview", label: "Quotation Document", icon: FileText },
          { id: "audit", label: `Timeline & Audit Trail (${quotation.statusHistory.length})`, icon: Clock },
          { id: "emails", label: `Dispatched Emails (${quotation.recipients.length})`, icon: Mail },
        ].map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <TabIcon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: PREVIEW */}
      {activeTab === "preview" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-4xl mx-auto space-y-8">
          {/* Document Header */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-slate-200 pb-8">
            <div>
              <div className="text-2xl font-bold text-slate-900">
                {quotation.senderDetails?.companyName || quotation.organisation?.name || "Enterprise Solutions"}
              </div>
              <div className="text-xs text-slate-500 mt-1 max-w-sm">
                {quotation.senderDetails?.address || [quotation.organisation?.branch, quotation.organisation?.city].filter(Boolean).join(", ") || "Corporate Headquarters"}
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold font-mono text-blue-600">QUOTATION</div>
              <div className="text-xs font-mono font-bold text-slate-700 mt-1">{quotation.quotationNumber}</div>
              <div className="text-xs text-slate-500 mt-2">
                <div>Date: {formatDate(quotation.issueDate)}</div>
                <div>Valid Till: {formatDate(quotation.expiryDate)}</div>
              </div>
            </div>
          </div>

          {/* Billed To Box */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-start justify-between gap-4 text-xs">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">BILLED TO</div>
              <div className="text-sm font-bold text-slate-900">{quotation.clientName}</div>
              {quotation.clientContactPerson && (
                <div className="text-slate-600 mt-0.5">Attn: {quotation.clientContactPerson}</div>
              )}
              {quotation.clientAddress && (
                <div className="text-slate-500 mt-1">{quotation.clientAddress}</div>
              )}
            </div>

            <div className="text-slate-600 md:text-right space-y-0.5">
              {quotation.clientEmail && <div>Email: {quotation.clientEmail}</div>}
              {quotation.clientPhone && <div>Phone: {quotation.clientPhone}</div>}
            </div>
          </div>

          {/* Subject */}
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase">Subject</div>
            <div className="text-base font-bold text-slate-900 mt-0.5">{quotation.title}</div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-10 text-center">#</th>
                  <th className="py-3 px-4">Item & Scope Description</th>
                  <th className="py-3 px-4 text-right w-20">Qty</th>
                  <th className="py-3 px-4 text-center w-24">Unit</th>
                  <th className="py-3 px-4 text-right w-28">Rate</th>
                  <th className="py-3 px-4 text-right w-32">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotation.items.map((item, idx) => (
                  <tr key={item.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                    <td className="py-3 px-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{item.title}</div>
                      {item.description && (
                        <div className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">{item.quantity}</td>
                    <td className="py-3 px-4 text-center text-slate-500">{item.unit || "unit"}</td>
                    <td className="py-3 px-4 text-right text-slate-700">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Totals Block */}
          <div className="flex flex-col md:flex-row justify-between gap-6 pt-4">
            {/* Bank Details */}
            {quotation.bankDetails && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 max-w-sm space-y-1">
                <div className="font-bold text-slate-900 text-xs mb-2">Remittance Bank Details</div>
                {quotation.bankDetails.bankName && <div>Bank: <strong>{quotation.bankDetails.bankName}</strong></div>}
                {quotation.bankDetails.accountName && <div>A/C Name: {quotation.bankDetails.accountName}</div>}
                {quotation.bankDetails.accountNumber && (
                  <div className="font-mono">A/C No: <strong>{quotation.bankDetails.accountNumber}</strong></div>
                )}
                {quotation.bankDetails.ifscCode && (
                  <div className="font-mono">IFSC: <strong>{quotation.bankDetails.ifscCode}</strong></div>
                )}
                {quotation.bankDetails.upiId && (
                  <div className="font-mono text-blue-600">UPI: {quotation.bankDetails.upiId}</div>
                )}
              </div>
            )}

            {/* Calculations Table */}
            <div className="w-full md:w-80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">{formatCurrency(quotation.subtotal)}</span>
              </div>

              {quotation.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount ({quotation.discountValue}%)</span>
                  <span className="font-semibold">- {formatCurrency(quotation.discountAmount)}</span>
                </div>
              )}

              {quotation.taxAmount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>GST / Tax ({quotation.taxRate}%)</span>
                  <span className="font-semibold">+ {formatCurrency(quotation.taxAmount)}</span>
                </div>
              )}

              <div className="border-t border-slate-200 pt-2 flex justify-between text-base font-bold text-slate-900">
                <span>Grand Total</span>
                <span className="text-blue-600">{formatCurrency(quotation.total)}</span>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          {(quotation.paymentTerms || quotation.termsAndConditions || quotation.notes) && (
            <div className="border-t border-slate-200 pt-6 space-y-4 text-xs">
              {quotation.paymentTerms && (
                <div>
                  <div className="font-bold text-slate-900 mb-1">Payment Schedule</div>
                  <div className="text-slate-600 leading-relaxed">{quotation.paymentTerms}</div>
                </div>
              )}
              {quotation.termsAndConditions && (
                <div>
                  <div className="font-bold text-slate-900 mb-1">Terms & Conditions</div>
                  <div className="text-slate-600 whitespace-pre-line leading-relaxed">
                    {quotation.termsAndConditions}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: AUDIT TIMELINE */}
      {activeTab === "audit" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <h3 className="text-sm font-bold text-slate-900">Lifecycle & Status Audit Trail</h3>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {quotation.statusHistory.map((h) => {
              const hBadge = STATUS_BADGE[h.newStatus] || STATUS_BADGE.DRAFT;
              const HIcon = hBadge.icon;

              return (
                <div key={h.id} className="relative flex items-start gap-4">
                  <div className={`w-5 h-5 rounded-full ${hBadge.bg} ${hBadge.border} border flex items-center justify-center -ml-[31px] bg-white`}>
                    <HIcon className={`w-3 h-3 ${hBadge.text}`} />
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex-1 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`font-bold px-2 py-0.5 rounded text-[10px] border ${hBadge.bg} ${hBadge.text} ${hBadge.border}`}>
                        {h.newStatus}
                      </span>
                      <span className="text-slate-400">{formatDateTime(h.createdAt)}</span>
                    </div>
                    <div className="text-slate-700 font-medium">{h.reason}</div>
                    <div className="text-slate-400 text-[11px]">
                      By {h.actorName || "System"} ({h.actorType})
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: EMAILS */}
      {activeTab === "emails" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Dispatched Email History</h3>
            <button
              onClick={() => setShowSendModal(true)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg"
            >
              Send New Email
            </button>
          </div>

          {quotation.recipients.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No emails have been dispatched for this quotation yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {quotation.recipients.map((rec) => (
                <div key={rec.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-900">
                      {rec.recipientName} &lt;{rec.recipientEmail}&gt;
                    </div>
                    <div className="text-slate-400 text-[11px]">Sent on {formatDateTime(rec.sentAt)}</div>
                  </div>
                  <div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        rec.deliveryStatus === "SENT"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {rec.deliveryStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Send Email Modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Dispatch Quotation PDF</h3>
                  <p className="text-xs text-slate-500">{quotation.quotationNumber} • {quotation.clientName}</p>
                </div>
              </div>
              <button onClick={() => setShowSendModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleDispatchEmail} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipient Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipient Name
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Personal Message
                </label>
                <textarea
                  rows={3}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Optional custom greeting or note..."
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSendModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
                >
                  {sendingEmail ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>{sendingEmail ? "Dispatching..." : "Send Email"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Save as Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Save as Reusable Template</h3>
                  <p className="text-xs text-slate-500">Strips client info & saves items, terms & rates</p>
                </div>
              </div>
              <button onClick={() => setShowTemplateModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveAsTemplate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Template Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={templateCategory}
                  onChange={(e) => setTemplateCategory(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                >
                  <option value="Software">Software & Web Development</option>
                  <option value="Consulting">Strategic Consulting</option>
                  <option value="Marketing">Growth & Digital Marketing</option>
                  <option value="General">General Deliverables</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTemplate}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl"
                >
                  {savingTemplate ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{savingTemplate ? "Saving..." : "Save Template"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
