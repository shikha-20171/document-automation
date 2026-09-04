"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  ListTree,
  ArrowLeft,
  UploadCloud,
  FileText,
  Copy,
  Download,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  PlusCircle,
  Check,
  Zap,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { aiApi } from "@/services/aiApi";
import SaveAiAsDocumentModal from "@/components/ai/SaveAiAsDocumentModal";

type DeptDoc = {
  id: number;
  name: string;
  type?: string;
  size?: number;
  uploaded_by?: string;
};

export default function AiDocumentSummarizerPage() {
  const [loading, setLoading] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [successToast, setSuccessToast] = useState("");
  const [copiedSection, setCopiedSection] = useState<string>("");

  // Source selection: 'select' from dept docs or 'upload' or 'text'
  const [inputMode, setInputMode] = useState<"select" | "upload" | "text">("select");
  const [deptDocs, setDeptDocs] = useState<DeptDoc[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState(
    `MASTER SERVICES & VENDOR COMPLIANCE AGREEMENT
This agreement entered into on 1st April 2026 governs the procurement and delivery of IT infrastructure services.
1. Financial terms: All invoices submitted by the Vendor must include valid GST identification and undergo department manager pre-approval. Payment terms remain strictly Net 30 days from approval date.
2. Compliance & Audit: The Vendor agrees to submit monthly SOC-2 compliance reports and certificate of good standing. Failure to furnish reports within 10 calendar days of month-end triggers a 2% monthly withholding penalty.
3. SLA Commitments: Vendor warrants 99.9% service uptime. Downtime exceeding 45 minutes in any billing cycle requires immediate credit note issuance.
4. Confidentiality: Confidentiality obligations survive termination for a period of 36 months.
5. Approvals & Termination: Either party may terminate with 60 days written notice. Department head and Finance head sign-offs are mandatory for any contract modification.`
  );

  // Options
  const [length, setLength] = useState<"Short" | "Medium" | "Detailed">("Medium");
  const [includeKeyPoints, setIncludeKeyPoints] = useState(true);
  const [includeActionItems, setIncludeActionItems] = useState(true);

  // Output
  const [summaryResult, setSummaryResult] = useState<{
    summary: string;
    keyPoints: string[];
    actionItems: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 4000);
  };

  const copyToClipboard = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(section);
      showToast("Copied to clipboard.");
      setTimeout(() => setCopiedSection(""), 2000);
    } catch {
      setError("Failed to copy content.");
    }
  };

  const downloadSummary = () => {
    if (!summaryResult) return;
    const content = [
      `Summary\n\n${summaryResult.summary}`,
      includeKeyPoints && summaryResult.keyPoints?.length
        ? `Key Points\n\n${summaryResult.keyPoints.map((item) => `- ${item}`).join("\n")}`
        : "",
      includeActionItems && summaryResult.actionItems?.length
        ? `Action Items\n\n${summaryResult.actionItems.map((item) => `- ${item}`).join("\n")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `department-summary-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const loadDeptDocs = async () => {
    try {
      const res = await aiApi.listDepartmentDocuments();
      const docs = (res?.data || []) as DeptDoc[];
      setDeptDocs(docs);
      if (docs.length > 0) {
        setSelectedDocId(String(docs[0].id));
      }
    } catch {
      setDeptDocs([]);
    }
  };

  useEffect(() => {
    void loadDeptDocs();
  }, []);

  const handleSummarize = async () => {
    setError("");

    if (inputMode === "select" && !selectedDocId) {
      setError("Please select a department document.");
      return;
    }
    if (inputMode === "upload" && !uploadedFile) {
      setError("Please upload a document file.");
      return;
    }
    if (inputMode === "text" && !rawText.trim()) {
      setError("Please enter document content to summarize.");
      return;
    }

    setLoading(true);
    try {
      let payload: any = {
        length,
        includeKeyPoints,
        includeActionItems,
      };

      if (inputMode === "upload" && uploadedFile) {
        payload.file = uploadedFile;
      } else if (inputMode === "select" && selectedDocId) {
        payload.documentId = selectedDocId;
      } else {
        payload.text = rawText;
      }

      const response = await aiApi.summarize(payload);
      if (response?.data) {
        setSummaryResult({
          summary: response.data.summary || "Summary generated successfully.",
          keyPoints: response.data.keyPoints || [],
          actionItems: response.data.actionItems || [],
        });
        showToast("Summary generated successfully!");
      } else {
        throw new Error("Unable to parse summary response.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to process this document. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    showToast(`Copied ${section} to clipboard!`);
    setTimeout(() => setCopiedSection(""), 2500);
  };

  const handleDownload = () => {
    if (!summaryResult) return;
    const content = [
      `DOCUMENT SUMMARY (${length.toUpperCase()} VERSION)`,
      `Generated on ${new Date().toLocaleString()}`,
      `--------------------------------------------------`,
      `EXECUTIVE SUMMARY:`,
      summaryResult.summary,
      ``,
      `KEY POINTS:`,
      ...summaryResult.keyPoints.map((p, i) => `${i + 1}. ${p}`),
      ``,
      `ACTION ITEMS:`,
      ...summaryResult.actionItems.map((a, i) => `${i + 1}. ${a}`),
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `document_summary_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Downloaded summary file.");
  };

  const handleSaveSummary = async () => {
    if (!summaryResult) return;
    try {
      await aiApi.saveGeneratedDocument({
        title: `AI Summary - ${length} Overview`,
        content: `${summaryResult.summary}\n\nKey Points:\n${summaryResult.keyPoints.join("\n")}`,
        documentType: "Summary Brief",
        status: "ACTIVE",
        action: "SAVE",
      });
      showToast("Summary saved to department documents!");
    } catch {
      setError("Failed to save summary.");
    }
  };

  const handleCreateDocumentFromSummary = async () => {
    if (!summaryResult) return;
    try {
      const fullDoc = [
        `DEPARTMENT EXECUTIVE BRIEFING MEMO`,
        `=====================================================`,
        `Overview:`,
        summaryResult.summary,
        ``,
        `Key Takeaways & Milestones:`,
        ...summaryResult.keyPoints.map((k) => `• ${k}`),
        ``,
        `Required Actions:`,
        ...summaryResult.actionItems.map((a) => `• ${a}`),
      ].join("\n");

      await aiApi.saveGeneratedDocument({
        title: `Executive Briefing Memo`,
        content: fullDoc,
        documentType: "Executive Memo",
        status: "ACTIVE",
        action: "SAVE",
      });
      showToast("Created new department document from summary!");
    } catch {
      setError("Failed to create document.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-16 font-sans text-slate-800">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/department-manager/ai-tools">
            <Button variant="outline" size="sm" className="h-9 w-9 p-0 rounded-xl">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-900">AI Document Summarizer</h1>
              <Badge className="bg-[#274690]/10 text-[#274690] text-[11px] font-bold">Tool 02</Badge>
            </div>
            <p className="text-xs text-slate-500">Generate executive summaries, key points, and action items from department documents.</p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {successToast && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 shadow-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-800 shadow-sm">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Options Pane (5 cols) */}
        <div className="space-y-5 lg:col-span-5">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Document Input Source</h2>

            {/* Source Mode Selector */}
            <div className="grid grid-cols-3 gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setInputMode("select")}
                className={`rounded-xl py-1.5 text-xs font-bold transition ${
                  inputMode === "select" ? "bg-[#274690] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Dept Docs
              </button>
              <button
                type="button"
                onClick={() => setInputMode("upload")}
                className={`rounded-xl py-1.5 text-xs font-bold transition ${
                  inputMode === "upload" ? "bg-[#274690] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setInputMode("text")}
                className={`rounded-xl py-1.5 text-xs font-bold transition ${
                  inputMode === "text" ? "bg-[#274690] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Paste Text
              </button>
            </div>

            {/* Mode 1: Select Department Doc */}
            {inputMode === "select" && (
              <div>
                <label className="text-[11px] font-black uppercase text-slate-500">Choose Department Document</label>
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
                >
                  <option value="">-- Choose from {deptDocs.length} Department Docs --</option>
                  {deptDocs.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} ({doc.type || "Document"})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-slate-400">Only documents in your department scope are shown.</p>
              </div>
            )}

            {/* Mode 2: Upload File */}
            {inputMode === "upload" && (
              <div>
                <label className="text-[11px] font-black uppercase text-slate-500">Upload Document File</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 25 * 1024 * 1024) {
                        setError("File size exceeds 25MB limit.");
                        return;
                      }
                      setUploadedFile(file);
                      showToast(`Selected ${file.name}`);
                    }
                  }}
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      if (file.size > 25 * 1024 * 1024) {
                        setError("File size exceeds 25MB limit.");
                        return;
                      }
                      setUploadedFile(file);
                      showToast(`Selected ${file.name}`);
                    }
                  }}
                  className="mt-1 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-5 text-center transition hover:border-[#274690] hover:bg-blue-50/20"
                >
                  <UploadCloud size={24} className="text-[#274690]" />
                  {uploadedFile ? (
                    <div className="mt-1.5 text-xs font-bold text-slate-800">
                      {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(0)} KB)
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadedFile(null);
                        }}
                        className="ml-2 text-[10px] text-rose-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="mt-1 text-xs font-bold text-slate-700">Drag & drop or Browse file</p>
                      <p className="text-[10px] text-slate-400">PDF, DOC, DOCX, TXT, Scanned Images (Max 25MB)</p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Mode 3: Paste Text */}
            {inputMode === "text" && (
              <div>
                <label className="text-[11px] font-black uppercase text-slate-500">Paste Document Text</label>
                <textarea
                  rows={6}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-800 focus:border-[#274690] focus:bg-white focus:outline-none"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                />
              </div>
            )}

            {/* Options */}
            <div className="border-t border-slate-100 pt-3 space-y-3">
              <div>
                <label className="text-[11px] font-black uppercase text-slate-500">Summary Length</label>
                <div className="mt-1 grid grid-cols-3 gap-2">
                  {(["Short", "Medium", "Detailed"] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLength(l)}
                      className={`rounded-xl py-2 text-xs font-bold border transition ${
                        length === l
                          ? "border-[#274690] bg-[#274690] text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={includeKeyPoints}
                    onChange={(e) => setIncludeKeyPoints(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#274690] focus:ring-[#274690]"
                  />
                  <span>Include Key Points Bullets</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={includeActionItems}
                    onChange={(e) => setIncludeActionItems(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#274690] focus:ring-[#274690]"
                  />
                  <span>Include Action Items Checklist</span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              disabled={loading}
              onClick={handleSummarize}
              className="w-full rounded-2xl bg-[#274690] py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#1f3770]"
            >
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Processing document...
                </>
              ) : (
                <>
                  <ListTree className="mr-2 h-4 w-4" />
                  Generate Summary
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Right Output Results Pane (7 cols) */}
        <div className="space-y-4 lg:col-span-7">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900">Summary & Intelligence Report</h2>
                <p className="text-xs text-slate-500">Key takeaways, compliance observations, and actionable follow-ups.</p>
              </div>
              {summaryResult && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={downloadSummary} className="text-xs font-bold">
                    <Download size={13} className="mr-1" /> Download
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(summaryResult.summary, "summary")} className="text-xs font-bold">
                    <Copy size={13} className="mr-1" /> Copy
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-5 space-y-4">
              {loading ? (
                <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-blue-100 bg-blue-50/30 p-8 text-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-[#274690]" />
                  <p className="mt-3 text-sm font-bold text-slate-800">Processing document...</p>
                  <p className="mt-1 text-xs text-slate-500">Extracting summary, identifying obligations, and assembling checklist.</p>
                </div>
              ) : summaryResult ? (
                <>
                  {/* Executive Summary Card */}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
                    <div className="flex items-center justify-between">
                      <h3 className="flex items-center gap-1.5 text-xs font-black uppercase text-[#274690]">
                        <FileText size={15} /> Executive Summary ({length})
                      </h3>
                      <Badge className="bg-[#274690] text-[10px] text-white">Verified</Badge>
                    </div>
                    <p className="mt-2.5 text-xs leading-relaxed text-slate-800 font-medium">
                      {summaryResult.summary}
                    </p>
                  </div>

                  {/* Key Points */}
                  {summaryResult.keyPoints && summaryResult.keyPoints.length > 0 && (
                    <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-5">
                      <h3 className="flex items-center gap-1.5 text-xs font-black uppercase text-amber-800">
                        <CheckCircle2 size={15} /> Key Points
                      </h3>
                      <ul className="mt-2.5 space-y-2">
                        {summaryResult.keyPoints.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#274690] shrink-0" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Items */}
                  {summaryResult.actionItems && summaryResult.actionItems.length > 0 && (
                    <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-5">
                      <h3 className="flex items-center gap-1.5 text-xs font-black uppercase text-emerald-800">
                        <Zap size={15} /> Action Items Checklist
                      </h3>
                      <div className="mt-2.5 space-y-2">
                        {summaryResult.actionItems.map((action, idx) => (
                          <label
                            key={idx}
                            className="flex items-center gap-2.5 rounded-xl border border-emerald-100 bg-white p-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                            <span>{action}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bottom Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSaveSummary}
                      className="text-xs font-bold text-slate-700"
                    >
                      <Save size={14} className="mr-1" />
                      Save Summary
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => setSaveModalOpen(true)}
                      className="bg-[#274690] text-xs font-bold text-white hover:bg-[#1f3770]"
                    >
                      <PlusCircle size={14} className="mr-1" />
                      Create New Document from Summary
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                  <ListTree className="h-10 w-10 text-slate-300" />
                  <p className="mt-3 text-sm font-bold text-slate-700">No summary generated yet.</p>
                  <p className="mt-1 text-xs text-slate-400">Select a document or upload a file on the left and click &quot;Generate Summary&quot;.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <SaveAiAsDocumentModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        content={`# EXECUTIVE SUMMARY\n\n${summaryResult?.summary || ""}\n\n## KEY HIGHLIGHTS\n${(summaryResult?.keyPoints || []).map((k: string) => `- ${k}`).join("\n")}\n\n## ACTION ITEMS\n${(summaryResult?.actionItems || []).map((a: string) => `[ ] ${a}`).join("\n")}`}
        suggestedTitle="Document Executive Summary"
        sourceType="AI Summarizer"
        aiProvider="Google Gemini"
        aiModel="Gemini 3.6 Flash"
        onSaved={(doc) => {
          setSuccessToast(`Summary saved as "${doc.name}" in vault!`);
        }}
      />
    </div>
  );
}
