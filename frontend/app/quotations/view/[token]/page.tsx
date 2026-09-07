"use client";

import { useState, useEffect, useCallback, use } from "react";
import {
  CheckCircle2, XCircle, Download, ShieldCheck, Clock, Building2,
  AlertCircle, FileText, Send, RefreshCw, CheckSquare, PenTool
} from "lucide-react";
import axios from "axios";

interface QuotationItem {
  id: string;
  title: string;
  description?: string | null;
  quantity: number;
  unit?: string | null;
  unitPrice: number;
  amount: number;
}

interface QuotationAcceptance {
  id: string;
  decision: "ACCEPTED" | "REJECTED";
  signerName: string;
  signerEmail: string;
  signerDesignation?: string | null;
  clientComments?: string | null;
  acceptedAt: string;
}

interface PublicQuotation {
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
  items: QuotationItem[];
  acceptance?: QuotationAcceptance | null;
  organisation?: { name: string; branch?: string; city?: string } | null;
}

export default function PublicQuotationViewPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [quotation, setQuotation] = useState<PublicQuotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showSignModal, setShowSignModal] = useState(false);
  const [signDecision, setSignDecision] = useState<"ACCEPTED" | "REJECTED">("ACCEPTED");
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [signerDesignation, setSignerDesignation] = useState("");
  const [clientComments, setClientComments] = useState("");
  const [submittingSign, setSubmittingSign] = useState(false);

  const [toastMessage, setToastMessage] = useState<{ title: string; desc?: string; type?: "success" | "error" } | null>(null);

  const showToast = (title: string, desc?: string, type: "success" | "error" = "success") => {
    setToastMessage({ title, desc, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const loadPublicQuotation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Public route without authorization header
      const res = await axios.get(`/api/public/quotations/${token}`);
      if (res.data?.success && res.data.data) {
        setQuotation(res.data.data);
        if (res.data.data.clientContactPerson) {
          setSignerName(res.data.data.clientContactPerson);
        }
        if (res.data.data.clientEmail) {
          setSignerEmail(res.data.data.clientEmail);
        }
      }
    } catch (err: any) {
      console.error("Failed to load public quotation:", err);
      setError(err.response?.data?.message || "This quotation link may have expired or is invalid.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadPublicQuotation();
  }, [loadPublicQuotation]);

  const handleDownloadPdf = () => {
    window.open(`/api/public/quotations/${token}/download-pdf`, "_blank");
  };

  const handleOpenDecisionModal = (decision: "ACCEPTED" | "REJECTED") => {
    setSignDecision(decision);
    setShowSignModal(true);
  };

  const handleSubmitDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signerName.trim()) {
      showToast("Signer Name Required", "Please enter your full name.", "error");
      return;
    }
    if (!signerEmail.trim()) {
      showToast("Signer Email Required", "Please enter your official email address.", "error");
      return;
    }

    try {
      setSubmittingSign(true);
      const res = await axios.post(`/api/public/quotations/${token}/respond`, {
        decision: signDecision,
        signerName: signerName.trim(),
        signerEmail: signerEmail.trim().toLowerCase(),
        signerDesignation: signerDesignation.trim() || null,
        clientComments: clientComments.trim() || null,
      });

      if (res.data?.success) {
        showToast(
          signDecision === "ACCEPTED" ? "Quotation Accepted!" : "Response Recorded",
          signDecision === "ACCEPTED"
            ? "Your digital acceptance has been recorded. Our team will contact you shortly."
            : "Your feedback has been sent to our team."
        );
        setShowSignModal(false);
        loadPublicQuotation();
      }
    } catch (err: any) {
      showToast("Submission Failed", err.response?.data?.message || err.message, "error");
    } finally {
      setSubmittingSign(false);
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
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />
          <div className="text-sm font-semibold text-slate-700">Loading your commercial quotation...</div>
        </div>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-xl text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-1">Quotation Unavailable</h2>
          <p className="text-xs text-slate-500 mb-4">{error || "This document could not be retrieved."}</p>
          <div className="text-xs text-slate-400">
            If you believe this is an error, please contact the sender directly to request a refreshed link.
          </div>
        </div>
      </div>
    );
  }

  const isAlreadyResolved = quotation.status === "ACCEPTED" || quotation.status === "REJECTED";
  const companyName = quotation.senderDetails?.companyName || quotation.organisation?.name || "Enterprise Solutions";

  return (
    <div className="min-h-screen bg-slate-100/80 py-10 px-4 md:px-8">
      {/* Toast */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border backdrop-blur-md transition-all ${
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

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Floating Action / Decision Bar */}
        <div className="bg-white rounded-2xl p-4 md:p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                COMMERCIAL PROPOSAL
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-mono font-bold text-blue-600">
                {quotation.quotationNumber}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">{quotation.title}</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 shadow-sm transition"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Download PDF</span>
            </button>

            {!isAlreadyResolved && (
              <>
                <button
                  onClick={() => handleOpenDecisionModal("REJECTED")}
                  className="px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition"
                >
                  Decline / Request Changes
                </button>

                <button
                  onClick={() => handleOpenDecisionModal("ACCEPTED")}
                  className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-600/20 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Accept Quotation</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Accepted / Rejected Seal Banner */}
        {quotation.acceptance && (
          <div
            className={`rounded-2xl p-6 border shadow-sm flex items-start gap-4 ${
              quotation.acceptance.decision === "ACCEPTED"
                ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                : "bg-rose-50 border-rose-200 text-rose-950"
            }`}
          >
            {quotation.acceptance.decision === "ACCEPTED" ? (
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0">
                <XCircle className="w-6 h-6" />
              </div>
            )}

            <div className="space-y-1">
              <div className="text-base font-bold">
                {quotation.acceptance.decision === "ACCEPTED"
                  ? "Quotation Officially Accepted & Signed Off"
                  : "Quotation Declined / Revision Requested"}
              </div>
              <div className="text-xs opacity-90">
                Signer: <strong>{quotation.acceptance.signerName}</strong> ({quotation.acceptance.signerEmail})
                {quotation.acceptance.signerDesignation ? ` • ${quotation.acceptance.signerDesignation}` : ""}
                {" • "}Date: {formatDateTime(quotation.acceptance.acceptedAt)}
              </div>
              {quotation.acceptance.clientComments && (
                <div className="text-xs mt-2 italic bg-white/70 p-2.5 rounded-lg border border-black/5">
                  "{quotation.acceptance.clientComments}"
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quotation Document Body */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 md:p-12 space-y-8">
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-slate-200 pb-8">
            <div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">{companyName}</div>
              <div className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
                {quotation.senderDetails?.address || [quotation.organisation?.branch, quotation.organisation?.city].filter(Boolean).join(", ") || "Corporate Headquarters"}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {[quotation.senderDetails?.email, quotation.senderDetails?.phone].filter(Boolean).join(" • ")}
              </div>
            </div>

            <div className="text-right">
              <div className="text-3xl font-extrabold font-mono text-blue-900 tracking-wide">QUOTATION</div>
              <div className="text-sm font-mono font-bold text-slate-700 mt-1">{quotation.quotationNumber}</div>
              <div className="text-xs text-slate-500 mt-2 space-y-0.5">
                <div>Date of Issue: <strong>{formatDate(quotation.issueDate)}</strong></div>
                <div>Valid Until: <strong>{formatDate(quotation.expiryDate)}</strong></div>
              </div>
            </div>
          </div>

          {/* Billed To Box */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-start justify-between gap-4 text-xs">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">PROPOSAL PREPARED FOR</div>
              <div className="text-base font-bold text-slate-900">{quotation.clientName}</div>
              {quotation.clientContactPerson && (
                <div className="text-slate-700 mt-0.5 font-medium">Attn: {quotation.clientContactPerson}</div>
              )}
              {quotation.clientAddress && (
                <div className="text-slate-500 mt-1 leading-relaxed">{quotation.clientAddress}</div>
              )}
            </div>

            <div className="text-slate-600 md:text-right space-y-1">
              {quotation.clientEmail && <div>Email: <span className="font-medium text-slate-800">{quotation.clientEmail}</span></div>}
              {quotation.clientPhone && <div>Phone: <span className="font-medium text-slate-800">{quotation.clientPhone}</span></div>}
            </div>
          </div>

          {/* Scope / Subject */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase">Deliverable Scope</div>
            <div className="text-base font-bold text-slate-900 mt-0.5">{quotation.title}</div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 w-10 text-center">#</th>
                  <th className="py-3.5 px-4">Deliverable / Scope Specification</th>
                  <th className="py-3.5 px-4 text-right w-20">Qty</th>
                  <th className="py-3.5 px-4 text-center w-24">Unit</th>
                  <th className="py-3.5 px-4 text-right w-32">Rate</th>
                  <th className="py-3.5 px-4 text-right w-36">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotation.items.map((item, idx) => (
                  <tr key={item.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                    <td className="py-3.5 px-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{item.title}</div>
                      {item.description && (
                        <div className="text-slate-500 text-[11px] mt-1 leading-relaxed">
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium">{item.quantity}</td>
                    <td className="py-3.5 px-4 text-center text-slate-500">{item.unit || "unit"}</td>
                    <td className="py-3.5 px-4 text-right text-slate-700">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Bank Details */}
          <div className="flex flex-col md:flex-row justify-between gap-8 pt-4">
            {/* Bank Details */}
            {quotation.bankDetails && (
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs text-slate-700 max-w-sm space-y-1.5 flex-1">
                <div className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
                  Official Remittance Bank Details
                </div>
                {quotation.bankDetails.bankName && <div>Bank: <strong>{quotation.bankDetails.bankName}</strong></div>}
                {quotation.bankDetails.accountName && <div>Account Name: {quotation.bankDetails.accountName}</div>}
                {quotation.bankDetails.accountNumber && (
                  <div className="font-mono">Account No: <strong>{quotation.bankDetails.accountNumber}</strong></div>
                )}
                {quotation.bankDetails.ifscCode && (
                  <div className="font-mono">IFSC Code: <strong>{quotation.bankDetails.ifscCode}</strong></div>
                )}
                {quotation.bankDetails.branch && <div>Branch: {quotation.bankDetails.branch}</div>}
                {quotation.bankDetails.upiId && (
                  <div className="font-mono text-blue-600 pt-1">UPI ID: {quotation.bankDetails.upiId}</div>
                )}
              </div>
            )}

            {/* Calculations Table */}
            <div className="w-full md:w-80 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({quotation.items.length} items)</span>
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
                  <span>Applicable GST / Tax ({quotation.taxRate}%)</span>
                  <span className="font-semibold">+ {formatCurrency(quotation.taxAmount)}</span>
                </div>
              )}

              <div className="border-t-2 border-slate-900 pt-3 flex justify-between text-lg font-bold text-slate-900">
                <span>Total Amount</span>
                <span className="text-blue-600">{formatCurrency(quotation.total)}</span>
              </div>
            </div>
          </div>

          {/* Terms & Payment Schedule */}
          {(quotation.paymentTerms || quotation.termsAndConditions || quotation.notes) && (
            <div className="border-t border-slate-200 pt-8 space-y-6 text-xs">
              {quotation.paymentTerms && (
                <div>
                  <div className="font-bold text-slate-900 mb-1 uppercase tracking-wider text-[11px]">
                    Payment Schedule & Milestones
                  </div>
                  <div className="text-slate-600 leading-relaxed">{quotation.paymentTerms}</div>
                </div>
              )}

              {quotation.termsAndConditions && (
                <div>
                  <div className="font-bold text-slate-900 mb-1 uppercase tracking-wider text-[11px]">
                    Terms & Conditions
                  </div>
                  <div className="text-slate-600 whitespace-pre-line leading-relaxed">
                    {quotation.termsAndConditions}
                  </div>
                </div>
              )}

              {quotation.notes && (
                <div>
                  <div className="font-bold text-slate-900 mb-1 uppercase tracking-wider text-[11px]">
                    Additional Notes
                  </div>
                  <div className="text-slate-600 leading-relaxed">{quotation.notes}</div>
                </div>
              )}
            </div>
          )}

          {/* Bottom Call to Action for Client */}
          {!isAlreadyResolved && (
            <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-6 rounded-2xl">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Ready to proceed?</h4>
                <p className="text-xs text-slate-500">
                  Click Accept to submit your digital sign-off. Our team will initiate kickoff immediately.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleOpenDecisionModal("REJECTED")}
                  className="px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition"
                >
                  Decline / Changes
                </button>

                <button
                  onClick={() => handleOpenDecisionModal("ACCEPTED")}
                  className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-600/20 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Accept Quotation</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Decision / Sign-off Modal */}
      {showSignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    signDecision === "ACCEPTED"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-rose-50 text-rose-600"
                  }`}
                >
                  {signDecision === "ACCEPTED" ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {signDecision === "ACCEPTED" ? "Accept & Sign Commercial Quotation" : "Decline Quotation / Request Changes"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {quotation.quotationNumber} • Total: {formatCurrency(quotation.total)}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowSignModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmitDecision} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Your Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Official Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={signerEmail}
                  onChange={(e) => setSignerEmail(e.target.value)}
                  placeholder="john@company.com"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Designation / Role in Company
                </label>
                <input
                  type="text"
                  value={signerDesignation}
                  onChange={(e) => setSignerDesignation(e.target.value)}
                  placeholder="e.g. Chief Technology Officer / Procurement Head"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {signDecision === "ACCEPTED" ? "Notes / PO Reference (Optional)" : "Reason for Decline / Modification Notes"}
                </label>
                <textarea
                  rows={3}
                  value={clientComments}
                  onChange={(e) => setClientComments(e.target.value)}
                  placeholder={
                    signDecision === "ACCEPTED"
                      ? "e.g. Approved under PO-2026-992. Kickoff call next Tuesday."
                      : "e.g. Please revise Milestone 2 to include mobile push notifications..."
                  }
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  Digital sign-off will record your timestamp, IP address, and credentials for contract verification.
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSignModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSign}
                  className={`px-6 py-2 font-bold text-white rounded-xl shadow-md transition ${
                    signDecision === "ACCEPTED"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {submittingSign ? "Recording..." : signDecision === "ACCEPTED" ? "Confirm & Accept" : "Submit Decline"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
