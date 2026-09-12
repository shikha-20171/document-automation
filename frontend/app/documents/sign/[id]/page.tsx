"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  PenTool, CheckCircle2, ShieldCheck, Download, AlertCircle,
  FileText, ArrowRight, RefreshCw, Type, Image as ImageIcon,
  Check, Lock, ExternalLink
} from "lucide-react";
import apiClient from "@/lib/axios";

export default function DocumentSigningPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const docId = params.id as string;
  const returnTo = searchParams.get("returnTo") || "/org-admin/documents";

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const [documentData, setDocumentData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingMode, setSigningMode] = useState<"draw" | "type" | "upload">("draw");
  const [typedName, setTypedName] = useState("");
  const [typedFont, setTypedFont] = useState("font-serif italic");
  const [uploadedSignature, setUploadedSignature] = useState<string | null>(null);
  const [signerRole, setSignerRole] = useState("Client Authorized Signatory");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [toast, setToast] = useState<{ title: string; desc?: string; type: "success" | "error" } | null>(null);

  const showToast = (title: string, desc?: string, type: "success" | "error" = "success") => {
    setToast({ title, desc, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch Document
  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const res = await apiClient.get(`/api/unified-documents/${docId}`);
        if (res.data?.success) {
          const doc = res.data.data;
          setDocumentData(doc);
          setTypedName(doc.clientName || "");
          if (doc.signatureStatus === "SIGNED" || doc.status === "COMPLETED") {
            setIsCompleted(true);
          }
        }
      } catch (err: any) {
        showToast("Error", err.response?.data?.message || err.message, "error");
      } finally {
        setLoading(false);
      }
    };
    if (docId) fetchDoc();
  }, [docId]);

  // Canvas Drawing Logic
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1e293b";
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // Upload signature image handler
  const handleUploadSignature = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedSignature(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Signature
  const handleSignDocument = async () => {
    if (!agreedToTerms) {
      showToast("Agreement Required", "You must agree to the terms before signing.", "error");
      return;
    }

    let signatureValue = "";
    if (signingMode === "draw") {
      if (!hasDrawn || !canvasRef.current) {
        showToast("Signature Missing", "Please draw your signature.", "error");
        return;
      }
      signatureValue = canvasRef.current.toDataURL("image/png");
    } else if (signingMode === "type") {
      if (!typedName.trim()) {
        showToast("Name Missing", "Please enter your name for the signature.", "error");
        return;
      }
      signatureValue = typedName.trim();
    } else if (signingMode === "upload") {
      if (!uploadedSignature) {
        showToast("Image Missing", "Please upload a signature image.", "error");
        return;
      }
      signatureValue = uploadedSignature;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.post(`/api/unified-documents/${docId}/sign`, {
        signerName: typedName || documentData?.clientName || "Authorized Signer",
        signerEmail: documentData?.clientEmail || "signer@client.com",
        signerRole,
        signatureMode: signingMode,
        signatureData: signatureValue,
      });

      if (res.data?.success) {
        setIsCompleted(true);
        showToast("Document Signed Successfully!", "Cryptographic signature registered. Redirecting to Documents...");
        // Auto-redirect to documents list after 1.5 seconds
        setTimeout(() => {
          router.push(returnTo);
        }, 1500);
      }
    } catch (err: any) {
      showToast("Signing Failed", err.response?.data?.message || err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 mx-auto text-blue-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Loading document for signature...</p>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-9 h-9" />
          </div>

          <div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Cryptographically Verified & Sealed
            </span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              Document Signed Successfully
            </h1>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              This document ({documentData?.documentNumber}) has been signed and permanently secured. A cryptographic SHA-256 seal has been applied.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">Document:</span>
              <span className="font-bold text-slate-900 dark:text-white">{documentData?.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">Signer:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{typedName || documentData?.clientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">Timestamp:</span>
              <span className="font-mono text-slate-600 dark:text-slate-300">{new Date().toLocaleString()}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => router.push(returnTo)}
              className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
            >
              <span>Go to My Documents</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <Link
              href={`/documents/final/${docId}`}
              className="py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5"
            >
              <span>View Certified Final</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={() => window.open(`/api/unified-documents/${docId}/download-pdf`, "_blank")}
              className="py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-400 text-center">Redirecting to your Documents in 2 seconds...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-10">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border text-sm font-medium transition-all ${
            toast.type === "success"
              ? "bg-emerald-900/90 border-emerald-700 text-emerald-100"
              : "bg-rose-900/90 border-rose-700 text-rose-100"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
          <div>
            <div className="font-semibold">{toast.title}</div>
            {toast.desc && <div className="text-xs opacity-90">{toast.desc}</div>}
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-blue-600 dark:text-blue-400 font-semibold">
                {documentData?.documentNumber}
              </span>
              <span className="text-xs text-slate-400">• Digital Signature Gateway</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {documentData?.title || "Sign Enterprise Document"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review terms, provide your signature, and submit legal acceptance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.open(`/api/unified-documents/${docId}/download-pdf`, "_blank")}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              <Download className="w-4 h-4" />
              <span>Preview PDF</span>
            </button>
          </div>
        </div>

        {/* Document Content Review Box */}
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 max-h-[360px] overflow-y-auto">
          <h2 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
            Document Terms & Content
          </h2>
          {Array.isArray(documentData?.content) ? (
            documentData.content.map((sec: any, idx: number) => (
              <div key={sec.id || idx} className="space-y-1">
                <h3 className="font-semibold text-xs text-slate-800 dark:text-slate-200">{sec.title}</h3>
                {sec.body && <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">{sec.body}</p>}
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500">Full commercial document text.</p>
          )}
        </div>

        {/* Signature Box Card */}
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base text-slate-900 dark:text-white">Provide Your Signature</h2>

            {/* Mode Picker */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setSigningMode("draw")}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition ${
                  signingMode === "draw" ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm" : "text-slate-500"
                }`}
              >
                <PenTool className="w-3.5 h-3.5" /> Draw
              </button>
              <button
                onClick={() => setSigningMode("type")}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition ${
                  signingMode === "type" ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm" : "text-slate-500"
                }`}
              >
                <Type className="w-3.5 h-3.5" /> Type
              </button>
              <button
                onClick={() => setSigningMode("upload")}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition ${
                  signingMode === "upload" ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm" : "text-slate-500"
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" /> Upload
              </button>
            </div>
          </div>

          {/* Mode 1: DRAW CANVAS */}
          {signingMode === "draw" && (
            <div className="space-y-2">
              <div className="relative rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={720}
                  height={180}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-[180px] cursor-crosshair touch-none"
                />
                {!hasDrawn && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-xs text-slate-400">
                    Click and drag here to draw your signature
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <button
                  onClick={clearCanvas}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition"
                >
                  Clear Canvas
                </button>
              </div>
            </div>
          )}

          {/* Mode 2: TYPE SIGNATURE */}
          {signingMode === "type" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Your Legal Name</label>
                <input
                  type="text"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">Signature Preview</span>
                <span className={`text-3xl text-slate-900 dark:text-white ${typedFont}`}>
                  {typedName || "Your Signature"}
                </span>
              </div>
            </div>
          )}

          {/* Mode 3: UPLOAD SIGNATURE */}
          {signingMode === "upload" && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                Upload Scanned Signature (PNG/JPG)
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleUploadSignature}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
              {uploadedSignature && (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={uploadedSignature} alt="Uploaded Signature" className="max-h-24 w-auto object-contain" />
                </div>
              )}
            </div>
          )}

          {/* Signer Legal Agreement Checkbox */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                I agree to be legally bound by this document, that my digital signature constitutes an authorized execution, and that a permanent audit log will be maintained.
              </span>
            </label>

            <button
              onClick={handleSignDocument}
              disabled={isSubmitting || !agreedToTerms}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Securing & Registering Signature...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirm & Complete Signature</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
