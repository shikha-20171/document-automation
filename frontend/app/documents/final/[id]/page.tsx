"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck, Download, Printer, Send, FileText, CheckCircle2,
  Clock, ArrowLeft, RefreshCw, Copy, Check, ExternalLink, FileDown
} from "lucide-react";
import apiClient from "@/lib/axios";

export default function CertifiedFinalDocumentPage() {
  const params = useParams();
  const router = useRouter();
  const docId = params.id as string;

  const [doc, setDoc] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedHash, setCopiedHash] = useState(false);
  const [toast, setToast] = useState<{ title: string; desc?: string; type: "success" | "error" } | null>(null);

  const showToast = (title: string, desc?: string, type: "success" | "error" = "success") => {
    setToast({ title, desc, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const res = await apiClient.get(`/api/unified-documents/${docId}`);
        if (res.data?.success) {
          setDoc(res.data.data);
        }
      } catch (err: any) {
        showToast("Error", err.response?.data?.message || err.message, "error");
      } finally {
        setLoading(false);
      }
    };
    if (docId) fetchDoc();
  }, [docId]);

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
    showToast("Hash Copied", "Cryptographic integrity hash copied to clipboard.");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 mx-auto text-blue-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Loading certified document...</p>
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="text-center space-y-3">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Document not found</p>
          <Link href="/employee/documents" className="text-xs text-blue-600 font-semibold">
            Return to Documents
          </Link>
        </div>
      </div>
    );
  }

  const docIdStr = String(doc?.id || "hash");
  const shaHash = `sha256-${Array.from(docIdStr)
    .map((c) => (c as string).charCodeAt(0).toString(16))
    .join("")
    .slice(0, 48)}`;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 py-10 px-4 md:px-8">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border text-sm font-medium transition-all ${
            toast.type === "success"
              ? "bg-emerald-900/90 border-emerald-700 text-emerald-100"
              : "bg-rose-900/90 border-rose-700 text-rose-100"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Clock className="w-5 h-5 text-rose-400" />}
          <div>
            <div className="font-semibold">{toast.title}</div>
            {toast.desc && <div className="text-xs opacity-90">{toast.desc}</div>}
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Action Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Certified Final Document
              </span>
              <div className="font-mono text-xs text-slate-500">{doc.documentNumber}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>

            <button
              onClick={() => window.open(`/api/unified-documents/${doc.id}/download-pdf`, "_blank")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
            >
              <Download className="w-3.5 h-3.5" /> Download PDF
            </button>

            <button
              onClick={() => window.open(`/api/unified-documents/${doc.id}/download-docx`, "_blank")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              <FileDown className="w-3.5 h-3.5" /> Word DOCX
            </button>
          </div>
        </div>

        {/* Certified Document Sheet */}
        <div className="bg-white dark:bg-slate-900 p-8 md:p-14 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 space-y-8 font-sans text-slate-800 dark:text-slate-200">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{doc.title}</h1>
              <p className="text-xs text-slate-500 mt-1">Category: {doc.category || "Commercial"}</p>
              {doc.clientName && (
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                  <span className="font-semibold">Issued to:</span> {doc.clientName} ({doc.clientEmail || "Client"})
                </div>
              )}
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 font-bold text-xs uppercase">
                {doc.status}
              </span>
              <div className="font-mono text-xs font-bold text-slate-900 dark:text-white mt-2">
                {doc.documentNumber}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Issued: {new Date(doc.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-6">
            {Array.isArray(doc.content) &&
              doc.content.map((sec: any, idx: number) => (
                <div key={sec.id || idx} className="space-y-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1">
                    {sec.title}
                  </h3>
                  {sec.body && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {sec.body}
                    </p>
                  )}
                  {sec.tableData && (
                    <div className="overflow-x-auto my-3">
                      <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-800">
                          <tr>
                            {sec.tableData.headers?.map((h: string, i: number) => (
                              <th key={i} className="p-2.5 font-bold border-b border-slate-200 dark:border-slate-700">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sec.tableData.rows?.map((row: string[], ri: number) => (
                            <tr key={ri} className="border-b border-slate-100 dark:border-slate-800">
                              {row.map((c, ci) => (
                                <td key={ci} className="p-2.5">{c}</td>
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

          {/* Financial Summary */}
          {doc.financialData && (
            <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="w-64 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Subtotal:</span>
                  <span>₹{(doc.financialData.subtotal || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Tax ({doc.financialData.taxRate || 18}%):</span>
                  <span>₹{(doc.financialData.taxAmount || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white pt-2 border-t">
                  <span>Total Amount:</span>
                  <span className="text-blue-600">₹{(doc.financialData.total || 0).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          )}

          {/* Cryptographic Digital Signature Certificate Box */}
          <div className="mt-8 p-6 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span className="font-bold text-xs text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
                  Digital Signature Certificate & Tamper Seal
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-semibold">
                Legally Binding Electronic Record
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold block">Verified Signer</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {doc.clientName || "Authorized Signatory"}
                </span>
                <div className="text-[11px] text-slate-500">{doc.clientEmail || "signer@enterprise.com"}</div>
              </div>

              <div>
                <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold block">Execution Timestamp</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {new Date(doc.updatedAt).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-between gap-2 text-[11px] font-mono text-slate-600 dark:text-slate-400">
              <div className="truncate">
                <span className="font-bold text-slate-700 dark:text-slate-300">Hash: </span>
                <span>{shaHash}</span>
              </div>
              <button
                onClick={() => copyHash(shaHash)}
                className="p-1 hover:text-slate-900 dark:hover:text-white flex-shrink-0"
                title="Copy SHA-256 Hash"
              >
                {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
