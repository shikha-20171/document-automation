"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud, FileText, CheckCircle2, AlertCircle, ArrowRight,
  Sparkles, Layers, Download, Copy, Check, RefreshCw, Eye, Edit3,
  Table, HelpCircle, ShieldCheck, FileCheck, FileCode, ChevronDown
} from "lucide-react";
import apiClient from "@/lib/axios";

export const EXTRACTION_ACTIONS = [
  { id: "extract_invoice", label: "1. Extract Invoice Data", desc: "Invoice #, vendor, client, line items, taxes, totals, bank info" },
  { id: "extract_receipt", label: "2. Extract Receipt Data", desc: "Merchant name, date, itemized list, tax, payment method" },
  { id: "extract_contract", label: "3. Extract Contract Details", desc: "Parties, effective date, terms, obligations, termination clauses" },
  { id: "extract_id_card", label: "4. Extract ID Card", desc: "Passport, National ID, Driver's License fields and verification" },
  { id: "extract_resume", label: "5. Extract Resume / CV", desc: "Candidate info, skills, experience timeline, education" },
  { id: "extract_bank_statement", label: "6. Extract Bank Statement", desc: "Account holder, account #, balance, transactions table" },
  { id: "extract_purchase_order", label: "7. Extract Purchase Order", desc: "PO number, vendor, buyer, items, shipping terms, pricing" },
  { id: "extract_tax_form", label: "8. Extract Tax Form", desc: "TIN/PAN/EIN, tax year, income breakdown, deductions, tax due" },
  { id: "extract_medical_record", label: "9. Extract Medical Record", desc: "Patient details, diagnosis, prescription, vitals, provider info" },
  { id: "extract_shipping_doc", label: "10. Extract Shipping Document", desc: "Bill of Lading, tracking, consignee, carrier, gross weight" },
  { id: "extract_legal_doc", label: "11. Extract Legal Document", desc: "Court case, jurisdiction, parties, ruling / agreement provisions" },
  { id: "extract_form_fields", label: "12. Extract Form Fields", desc: "Intelligent key-value extraction for structured paperwork" },
  { id: "general_ocr", label: "13. General Document OCR", desc: "Full optical character recognition with high-fidelity layout preservation" },
];

export default function UnifiedOcrWorkspace({ userRole = "STAFF" }: { userRole?: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedAction, setSelectedAction] = useState<string>("extract_invoice");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStage, setProcessingStage] = useState<string>("");
  const [ocrResult, setOcrResult] = useState<any | null>(null);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"fields" | "tables" | "raw" | "json">("fields");
  const [toast, setToast] = useState<{ title: string; desc?: string; type: "success" | "error" } | null>(null);

  const showToast = (title: string, desc?: string, type: "success" | "error" = "success") => {
    setToast({ title, desc, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (selected.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => setFilePreview(reader.result as string);
        reader.readAsDataURL(selected);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      setFile(dropped);
      if (dropped.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => setFilePreview(reader.result as string);
        reader.readAsDataURL(dropped);
      } else {
        setFilePreview(null);
      }
    }
  };

  // Run OCR
  const runOcrProcessing = async () => {
    if (!file) {
      showToast("No File Selected", "Please select a document image or PDF file to process.", "error");
      return;
    }

    setIsProcessing(true);
    setProcessingStage("Uploading document to vision engine...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("action", selectedAction);

      setProcessingStage("Running OCR & intelligent structure parsing...");
      const res = await apiClient.post("/api/ocr/process", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        setOcrResult(res.data.data);
        showToast("Extraction Complete", `Successfully extracted data with ${res.data.data.confidenceScore}% confidence.`);
      } else {
        throw new Error(res.data?.message || "Failed to process OCR");
      }
    } catch (err: any) {
      console.error("OCR Processing Error:", err);
      showToast("Extraction Failed", err.response?.data?.message || err.message, "error");
    } finally {
      setIsProcessing(false);
      setProcessingStage("");
    }
  };

  // Action: Create Document from OCR
  const handleCreateDocument = async () => {
    if (!ocrResult) return;
    setIsProcessing(true);
    setProcessingStage("Creating enterprise document draft...");
    try {
      const res = await apiClient.post("/api/ocr/create-document", {
        jobId: ocrResult.jobId,
        title: `${ocrResult.documentType || "Extracted"} - ${new Date().toISOString().slice(0, 10)}`,
        category: "Finance",
        extractedData: ocrResult,
      });

      if (res.data?.success) {
        showToast("Document Created!", "Redirecting to Document Editor...");
        const docId = res.data.data.id;
        setTimeout(() => {
          router.push(`/documents/editor?id=${docId}`);
        }, 800);
      }
    } catch (err: any) {
      showToast("Creation Failed", err.response?.data?.message || err.message, "error");
    } finally {
      setIsProcessing(false);
      setProcessingStage("");
    }
  };

  // Action: Use with AI Builder
  const handleUseWithAi = () => {
    if (!ocrResult) return;
    const summaryData = JSON.stringify(ocrResult.fields || ocrResult);
    sessionStorage.setItem("ai_builder_context", summaryData);
    router.push(`/documents/editor?fromOcr=true&action=${selectedAction}`);
  };

  // Action: Save as Template
  const handleSaveAsTemplate = async () => {
    if (!ocrResult) return;
    try {
      const sections = [
        {
          id: "header",
          type: "header",
          title: ocrResult.documentType || "Extracted Document",
          body: `Template generated from OCR extraction for ${ocrResult.documentType}.`,
        },
        {
          id: "fields",
          type: "text",
          title: "Extracted Key Fields",
          body: Object.entries(ocrResult.fields || {})
            .map(([k, v]) => `• ${k}: {{${k}}}`)
            .join("\n"),
        },
      ];

      if (ocrResult.tables && ocrResult.tables.length > 0) {
        sections.push({
          id: "table_1",
          type: "table",
          title: "Extracted Data Table",
          body: "",
          ...(ocrResult.tables[0] ? { tableData: ocrResult.tables[0] } : {}),
        });
      }

      await apiClient.post("/api/unified-templates", {
        name: `${ocrResult.documentType || "OCR"} Master Template`,
        category: "Operations",
        documentType: ocrResult.documentType || "Custom Document",
        description: `Reusable template structured from ${selectedAction} OCR.`,
        content: sections,
        variables: ocrResult.fields || {},
      });

      showToast("Template Saved", "Template added to Reusable Templates library.");
    } catch (err: any) {
      showToast("Template Error", err.response?.data?.message || err.message, "error");
    }
  };

  // Copy JSON
  const handleCopyJson = () => {
    if (!ocrResult) return;
    navigator.clipboard.writeText(JSON.stringify(ocrResult, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
    showToast("Copied to Clipboard", "Raw extracted JSON data copied.");
  };

  // Export JSON file
  const handleDownloadJson = () => {
    if (!ocrResult) return;
    const blob = new Blob([JSON.stringify(ocrResult, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ocr_extraction_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
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

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
            Intelligent Document Extraction
          </span>
          <span className="text-xs text-slate-400">• Vision AI Engine</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Unified OCR & Document Extraction Workspace
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Upload any document, select an extraction model, extract structured key-value fields and tables, and seamlessly route into the Document Editor.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input & Controls */}
        <div className="lg:col-span-5 space-y-5">
          {/* Action Selector */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              1. Select Extraction Type
            </label>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {EXTRACTION_ACTIONS.map((act) => (
                <option key={act.id} value={act.id}>
                  {act.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {EXTRACTION_ACTIONS.find((a) => a.id === selectedAction)?.desc}
            </p>
          </div>

          {/* Upload Dropzone */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              2. Upload Source File
            </label>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 rounded-2xl border-2 border-dashed transition cursor-pointer text-center ${
                file
                  ? "border-blue-500 bg-blue-50/30 dark:bg-blue-900/10"
                  : "border-slate-300 dark:border-slate-700 hover:border-blue-400 bg-slate-50/50 dark:bg-slate-800/30"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.tiff,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <UploadCloud className="w-10 h-10 mx-auto text-blue-500 mb-2 opacity-80" />
              {file ? (
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{file.name}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || "Document"}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Click to browse or drag & drop file here
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Supports PDF, PNG, JPG, JPEG, WEBP, TIFF (Max 25MB)
                  </p>
                </div>
              )}
            </div>

            {/* Thumbnail Preview */}
            {filePreview && (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-48 bg-slate-100 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={filePreview} alt="Preview" className="max-h-48 w-auto object-contain" />
              </div>
            )}

            {/* Run Button */}
            <button
              onClick={runOcrProcessing}
              disabled={isProcessing || !file}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-lg shadow-blue-500/20 transition disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{processingStage || "Processing..."}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run Intelligent Extraction</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Extracted Results */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[520px]">
            {/* Results Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="font-bold text-sm text-slate-900 dark:text-white">
                  Extraction Results
                </div>
                {ocrResult && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    <ShieldCheck className="w-3 h-3" />
                    {ocrResult.confidenceScore}% Confidence
                  </span>
                )}
              </div>

              {ocrResult && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopyJson}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs flex items-center gap-1"
                    title="Copy JSON"
                  >
                    {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={handleDownloadJson}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs flex items-center gap-1"
                    title="Export JSON File"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Results Tabs */}
            {ocrResult && (
              <div className="flex items-center gap-2 px-4 pt-3 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold">
                <button
                  onClick={() => setActiveTab("fields")}
                  className={`pb-2.5 border-b-2 transition ${
                    activeTab === "fields"
                      ? "border-blue-600 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  Key-Value Fields ({Object.keys(ocrResult.fields || {}).length})
                </button>
                <button
                  onClick={() => setActiveTab("tables")}
                  className={`pb-2.5 border-b-2 transition ${
                    activeTab === "tables"
                      ? "border-blue-600 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  Extracted Tables ({ocrResult.tables?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab("raw")}
                  className={`pb-2.5 border-b-2 transition ${
                    activeTab === "raw"
                      ? "border-blue-600 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  Detected Raw Text
                </button>
                <button
                  onClick={() => setActiveTab("json")}
                  className={`pb-2.5 border-b-2 transition ${
                    activeTab === "json"
                      ? "border-blue-600 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  Structured JSON
                </button>
              </div>
            )}

            {/* Results Content Area */}
            <div className="p-5 flex-1 overflow-y-auto max-h-[480px]">
              {!ocrResult && !isProcessing && (
                <div className="text-center py-20 text-slate-400 space-y-2">
                  <FileText className="w-10 h-10 mx-auto opacity-40 text-slate-400" />
                  <p className="font-semibold text-sm text-slate-600 dark:text-slate-300">
                    No document processed yet
                  </p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Select an extraction action, upload a document, and click &quot;Run Intelligent Extraction&quot;.
                  </p>
                </div>
              )}

              {isProcessing && (
                <div className="text-center py-20 space-y-3">
                  <RefreshCw className="w-10 h-10 mx-auto text-blue-600 animate-spin" />
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {processingStage}
                  </p>
                  <p className="text-xs text-slate-400">
                    Analyzing optical elements, text streams, and data structures...
                  </p>
                </div>
              )}

              {ocrResult && !isProcessing && (
                <>
                  {/* TAB 1: KEY-VALUE FIELDS */}
                  {activeTab === "fields" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(ocrResult.fields || {}).map(([key, val]: any) => (
                        <div
                          key={key}
                          className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40"
                        >
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                            {key.replace(/_/g, " ")}
                          </span>
                          <span className="text-xs font-semibold text-slate-900 dark:text-white break-words">
                            {typeof val === "object" ? JSON.stringify(val) : String(val || "—")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* TAB 2: EXTRACTED TABLES */}
                  {activeTab === "tables" && (
                    <div className="space-y-4">
                      {ocrResult.tables && ocrResult.tables.length > 0 ? (
                        ocrResult.tables.map((tbl: any, idx: number) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                          >
                            <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                              Table #{idx + 1}
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead>
                                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300">
                                    {tbl.headers?.map((h: string, hi: number) => (
                                      <th key={hi} className="py-2 px-3">{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                                  {tbl.rows?.map((row: string[], ri: number) => (
                                    <tr key={ri} className="hover:bg-slate-50/50">
                                      {row.map((cell, ci) => (
                                        <td key={ci} className="py-2 px-3">{cell}</td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic py-8 text-center">
                          No distinct table structures detected in this document.
                        </p>
                      )}
                    </div>
                  )}

                  {/* TAB 3: RAW DETECTED TEXT */}
                  {activeTab === "raw" && (
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto">
                      {ocrResult.rawText || "No raw text recorded."}
                    </div>
                  )}

                  {/* TAB 4: JSON */}
                  {activeTab === "json" && (
                    <pre className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto max-h-[400px]">
                      {JSON.stringify(ocrResult, null, 2)}
                    </pre>
                  )}
                </>
              )}
            </div>

            {/* Direct Action Buttons Footer */}
            {ocrResult && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveAsTemplate}
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
                  >
                    Save as Template
                  </button>
                  <button
                    onClick={handleUseWithAi}
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-xs font-semibold text-blue-600 dark:text-blue-400 transition"
                  >
                    Use with AI
                  </button>
                </div>

                <button
                  onClick={handleCreateDocument}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition disabled:opacity-50"
                >
                  <span>Create Document in Editor</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
