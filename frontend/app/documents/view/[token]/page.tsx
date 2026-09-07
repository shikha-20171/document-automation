"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { 
  FileText, CheckCircle2, XCircle, Download, Building2, Calendar, 
  User, ShieldCheck, Mail, AlertCircle, Clock, ChevronRight, Lock
} from "lucide-react";

interface DocumentDetail {
  id: string;
  documentNumber: string;
  title: string;
  category: string;
  type: string;
  status: string;
  currentVersion: number;
  metadata: {
    clientName?: string;
    clientEmail?: string;
    clientContactPerson?: string;
    companyName?: string;
    financialSummary?: {
      currency?: string;
      subtotal?: number;
      taxAmount?: number;
      grandTotal?: number;
    };
    [key: string]: any;
  };
  sections: Array<{
    id: string;
    title: string;
    type: "text" | "table" | "terms" | "signature" | "key_value";
    content?: string;
    tableData?: {
      headers: string[];
      rows: (string | number)[][];
    };
    terms?: string[];
  }>;
  organisation?: {
    name: string;
    email?: string;
    phone?: string;
    website?: string;
  };
  acceptance?: {
    signerName: string;
    signerEmail: string;
    signerDesignation?: string;
    acceptedAt: string;
    notes?: string;
  } | null;
}

export default function PublicDocumentPortalPage() {
  const params = useParams();
  const token = params?.token as string;

  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sign-off modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionType, setActionType] = useState<"ACCEPT" | "REJECT">("ACCEPT");
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [signerDesignation, setSignerDesignation] = useState("");
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    loadDocument();
  }, [token]);

  const loadDocument = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/documents/${token}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Document not found or link has expired.");
      }
      const data = await res.json();
      setDocument(data.data);
      if (data.data.metadata?.clientContactPerson) {
        setSignerName(data.data.metadata.clientContactPerson);
      }
      if (data.data.metadata?.clientEmail) {
        setSignerEmail(data.data.metadata.clientEmail);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load document");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (format: "pdf" | "docx") => {
    window.open(`/api/public/documents/${token}/download?format=${format}`, "_blank");
  };

  const handleSignOffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signerName.trim() || !signerEmail.trim()) {
      alert("Please provide both your name and email address to record authorization.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/public/documents/${token}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionType,
          signerName,
          signerEmail,
          signerDesignation,
          comments,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to submit response");
      }

      setSubmitSuccess(
        actionType === "ACCEPT" 
          ? "Thank you! This document has been formally accepted." 
          : "Your feedback and document decline have been recorded."
      );
      setIsModalOpen(false);
      loadDocument();
    } catch (err: any) {
      alert(err.message || "Error submitting response");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-medium text-slate-400">Loading verified document preview...</p>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Unable to Access Document</h1>
          <p className="text-sm text-slate-400 mb-6">{error || "This document link is invalid or has expired."}</p>
          <div className="text-xs text-slate-500 flex items-center justify-center gap-2">
            <Lock className="w-3.5 h-3.5" />
            <span>End-to-End Encrypted Verification Portal</span>
          </div>
        </div>
      </div>
    );
  }

  const isAccepted = document.status === "ACCEPTED" || !!document.acceptance;
  const isDeclined = document.status === "REJECTED";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Banner Header */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold">
                  {document.documentNumber}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  v{document.currentVersion}.0
                </span>
                {isAccepted ? (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Accepted & Signed
                  </span>
                ) : isDeclined ? (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                    <XCircle className="w-3.5 h-3.5" /> Declined
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                    <Clock className="w-3.5 h-3.5" /> Awaiting Review
                  </span>
                )}
              </div>
              <h1 className="text-base font-bold text-white tracking-tight">{document.title}</h1>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => handleDownload("pdf")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition shadow-sm"
              title="Download vector PDF"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              <span>PDF</span>
            </button>
            <button
              onClick={() => handleDownload("docx")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition shadow-sm"
              title="Download editable Microsoft Word DOCX"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span>Word DOCX</span>
            </button>

            {!isAccepted && !isDeclined && (
              <>
                <button
                  onClick={() => {
                    setActionType("REJECT");
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Decline</span>
                </button>
                <button
                  onClick={() => {
                    setActionType("ACCEPT");
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-lg shadow-emerald-600/30"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Accept & Sign</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Document Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {submitSuccess && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{submitSuccess}</span>
          </div>
        )}

        {/* Accepted Badge Callout */}
        {isAccepted && document.acceptance && (
          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-300">Formally Accepted & Digitally Verified</p>
                <p className="text-xs text-emerald-400/80">
                  Signed by <span className="font-semibold text-white">{document.acceptance.signerName}</span> ({document.acceptance.signerEmail})
                  {document.acceptance.signerDesignation ? ` • ${document.acceptance.signerDesignation}` : ""} on {new Date(document.acceptance.acceptedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-900/60 text-emerald-200 border border-emerald-500/20">
              AUDIT COMPLIANT
            </span>
          </div>
        )}

        {/* Document Sheet Card */}
        <div className="bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
          {/* Top Brand Banner */}
          <div className="bg-slate-950 text-white p-8 sm:p-10 border-b-4 border-indigo-600">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
              <div>
                <span className="text-xs uppercase tracking-widest text-indigo-400 font-bold">
                  {document.category} • {document.type}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white">
                  {document.title}
                </h2>
                <p className="text-xs text-slate-400 mt-1">Ref: {document.documentNumber}</p>
              </div>

              <div className="text-left sm:text-right">
                <p className="text-base font-bold text-slate-100">{document.organisation?.name || "Issuing Organisation"}</p>
                {document.organisation?.email && (
                  <p className="text-xs text-slate-400 mt-0.5">{document.organisation.email}</p>
                )}
                {document.organisation?.website && (
                  <p className="text-xs text-indigo-400 mt-0.5">{document.organisation.website}</p>
                )}
              </div>
            </div>

            {/* Recipient & Meta Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-1">Prepared For</span>
                <p className="text-sm font-bold text-white">{document.metadata?.clientName || "Client"}</p>
                {document.metadata?.clientContactPerson && (
                  <p className="text-slate-300 mt-0.5">{document.metadata.clientContactPerson}</p>
                )}
                {document.metadata?.clientEmail && (
                  <p className="text-indigo-400 mt-0.5">{document.metadata.clientEmail}</p>
                )}
              </div>
              <div className="sm:text-right">
                <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-1">Document Status</span>
                <p className="text-sm font-bold text-white">{document.status}</p>
                <p className="text-slate-300 mt-0.5">Version {document.currentVersion}.0</p>
                <p className="text-slate-400 mt-0.5">Date: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Document Dynamic Sections */}
          <div className="p-8 sm:p-12 space-y-10">
            {document.sections?.map((sec, idx) => (
              <section key={sec.id || idx} className="space-y-4">
                <h3 className="text-base font-bold text-slate-900 border-b pb-2 border-slate-200 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  {sec.title}
                </h3>

                {sec.type === "text" && (
                  <div className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                    {sec.content}
                  </div>
                )}

                {sec.type === "table" && sec.tableData && (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                        <tr>
                          {sec.tableData.headers.map((h, hIdx) => (
                            <th key={hIdx} className="px-4 py-3 border-b border-slate-200">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {sec.tableData.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-50">
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="px-4 py-3 font-medium">
                                {typeof cell === "number" ? cell.toLocaleString() : cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {sec.type === "terms" && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2">
                    {sec.terms?.map((term, tIdx) => (
                      <div key={tIdx} className="text-xs text-slate-700 flex items-start gap-2">
                        <span className="text-indigo-600 font-bold shrink-0">•</span>
                        <span>{term}</span>
                      </div>
                    ))}
                  </div>
                )}

                {sec.type === "signature" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6">
                    <div className="border border-slate-200 rounded-xl p-5 bg-slate-50">
                      <p className="text-xs uppercase text-slate-500 font-semibold mb-6">Authorized Signatory</p>
                      <div className="h-10 border-b-2 border-slate-300 mb-2" />
                      <p className="text-xs font-bold text-slate-900">{document.organisation?.name || "Issuer"}</p>
                      <p className="text-xs text-slate-500">Representative</p>
                    </div>

                    <div className="border border-slate-200 rounded-xl p-5 bg-slate-50">
                      <p className="text-xs uppercase text-slate-500 font-semibold mb-6">Client Acceptance</p>
                      {document.acceptance ? (
                        <div>
                          <p className="text-xs font-bold text-emerald-600">Digitally Verified & Signed</p>
                          <p className="text-xs font-semibold text-slate-900 mt-1">{document.acceptance.signerName}</p>
                          <p className="text-xs text-slate-500">{document.acceptance.signerEmail}</p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {new Date(document.acceptance.acceptedAt).toLocaleString()}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <div className="h-10 border-b-2 border-dashed border-slate-300 mb-2" />
                          <p className="text-xs font-bold text-slate-900">{document.metadata?.clientName || "Client Representative"}</p>
                          <p className="text-xs text-slate-500">Pending Signature</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </section>
            ))}

            {/* Financial Summary Box if applicable */}
            {document.metadata?.financialSummary?.grandTotal !== undefined && (
              <div className="border-t-2 border-slate-900 pt-6 flex justify-end">
                <div className="w-72 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-slate-900">
                      {document.metadata.financialSummary.currency || "₹"} {document.metadata.financialSummary.subtotal?.toLocaleString()}
                    </span>
                  </div>
                  {document.metadata.financialSummary.taxAmount !== undefined && (
                    <div className="flex justify-between text-slate-600">
                      <span>Tax / GST:</span>
                      <span className="font-semibold text-slate-900">
                        {document.metadata.financialSummary.currency || "₹"} {document.metadata.financialSummary.taxAmount?.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-slate-900 border-t pt-2">
                    <span>Grand Total:</span>
                    <span className="text-indigo-600">
                      {document.metadata.financialSummary.currency || "₹"} {document.metadata.financialSummary.grandTotal?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="bg-slate-50 border-t border-slate-200 p-6 text-center text-xs text-slate-500">
            This document is securely issued and digitally verified by Document Automation SaaS.
          </div>
        </div>
      </main>

      {/* Digital Sign-off Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                {actionType === "ACCEPT" ? (
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <XCircle className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-white">
                    {actionType === "ACCEPT" ? "Accept & Sign Document" : "Decline Document"}
                  </h3>
                  <p className="text-xs text-slate-400">Ref: {document.documentNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSignOffSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Legal Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Signatory Work Email <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  value={signerEmail}
                  onChange={(e) => setSignerEmail(e.target.value)}
                  placeholder="e.g. rahul@abctech.com"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Title / Designation (Optional)
                </label>
                <input
                  type="text"
                  value={signerDesignation}
                  onChange={(e) => setSignerDesignation(e.target.value)}
                  placeholder="e.g. Managing Director / CTO"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Comments or Feedback
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder={actionType === "ACCEPT" ? "e.g. Approved and confirmed." : "Please specify reason for decline..."}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  By clicking {actionType === "ACCEPT" ? "Confirm & Accept" : "Confirm Decline"}, your timestamp, IP address, and identity will be securely logged in the audit trail.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-5 py-2 text-xs font-bold rounded-xl text-white transition shadow-lg ${
                    actionType === "ACCEPT"
                      ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30"
                      : "bg-rose-600 hover:bg-rose-500 shadow-rose-600/30"
                  } disabled:opacity-50`}
                >
                  {submitting ? "Processing..." : actionType === "ACCEPT" ? "Confirm & Accept" : "Confirm Decline"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
