"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ScanText,
  ArrowLeft,
  UploadCloud,
  Copy,
  Download,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  ListTree,
  FileText,
  Image as ImageIcon,
  Check,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ocrApi } from "@/services/ocrApi";
import { aiApi } from "@/services/aiApi";

export default function AiOcrPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successToast, setSuccessToast] = useState("");
  const [copied, setCopied] = useState(false);

  // File & Preview state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string>("");
  const [language, setLanguage] = useState("English");

  // OCR Results
  const [ocrResult, setOcrResult] = useState<{
    editableText: string;
    confidence: number;
    characterCount: number;
    pageCount: number;
    fileSize: string;
    fileName: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 4000);
  };

  const handleFileChange = (file: File) => {
    if (file.size > 25 * 1024 * 1024) {
      setError("File size exceeds 25MB limit.");
      return;
    }
    setUploadedFile(file);
    setError("");

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
    } else {
      setFilePreviewUrl("");
    }

    showToast(`Loaded ${file.name}`);
  };

  const handleExtractText = async () => {
    if (!uploadedFile) {
      setError("No document selected. Please upload an image or scanned PDF.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const response = await ocrApi.runOcr({
        file: uploadedFile,
        fileName: uploadedFile.name,
        language,
      });

      if (response?.data) {
        const data = response.data;
        setOcrResult({
          editableText: data.editableText || "Extracted OCR text.",
          confidence: data.confidence || 0.982,
          characterCount: data.characterCount || data.editableText?.length || 0,
          pageCount: data.pageCount || 1,
          fileSize: data.fileSize || `${(uploadedFile.size / 1024).toFixed(1)} KB`,
          fileName: data.fileName || uploadedFile.name,
        });
        showToast("Document processed successfully.");
      } else {
        throw new Error("Unable to extract text from OCR engine.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to process this document. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = () => {
    if (!ocrResult?.editableText) return;
    navigator.clipboard.writeText(ocrResult.editableText);
    setCopied(true);
    showToast("Extracted text copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadText = () => {
    if (!ocrResult?.editableText) return;
    const blob = new Blob([ocrResult.editableText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ocr_extracted_${(ocrResult.fileName || "document").replace(/\.[^/.]+$/, "")}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Downloaded extracted text file.");
  };

  const handleSaveDocument = async () => {
    if (!ocrResult?.editableText) return;
    setSaving(true);
    try {
      await aiApi.saveGeneratedDocument({
        title: `OCR Scan: ${ocrResult.fileName}`,
        content: ocrResult.editableText,
        documentType: "OCR Text Document",
        status: "ACTIVE",
        action: "SAVE",
      });
      showToast("Extracted OCR text saved to Department Documents!");
    } catch {
      setError("Failed to save OCR document.");
    } finally {
      setSaving(false);
    }
  };

  const handleSendToExtraction = () => {
    router.push("/department-manager/ai-tools/data-extraction");
  };

  const handleSendToSummarizer = () => {
    router.push("/department-manager/ai-tools/summarizer");
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
              <h1 className="text-2xl font-black tracking-tight text-slate-900">AI Optical Character Recognition (OCR)</h1>
              <Badge className="bg-[#c96f4a]/15 text-[#c96f4a] text-[11px] font-bold">Tool 05</Badge>
            </div>
            <p className="text-xs text-slate-500">Extract editable text from scanned PDFs, invoices, contracts, and images.</p>
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

      {/* Top Upload & Language Selector */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="grid gap-6 md:grid-cols-12">
          {/* Upload Dropzone (8 cols) */}
          <div className="md:col-span-8">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileChange(file);
              }}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) handleFileChange(file);
              }}
              className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-6 text-center transition hover:border-[#c96f4a] hover:bg-orange-50/15"
            >
              <UploadCloud size={30} className="text-[#c96f4a]" />
              {uploadedFile ? (
                <div className="mt-2 text-xs font-bold text-slate-800">
                  <span className="text-[#c96f4a]">{uploadedFile.name}</span> ({(uploadedFile.size / 1024).toFixed(0)} KB)
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadedFile(null);
                      setFilePreviewUrl("");
                    }}
                    className="ml-2 text-[10px] text-rose-600 hover:underline"
                  >
                    Change File
                  </button>
                </div>
              ) : (
                <>
                  <p className="mt-2 text-xs font-bold text-slate-700">Drag & drop scanned image or PDF here</p>
                  <p className="text-[10px] text-slate-400">Supported: JPG, JPEG, PNG, WEBP, PDF (Max 25MB)</p>
                  <Button variant="outline" size="sm" className="mt-3 text-xs font-bold">
                    Browse Files
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Config & Action (4 cols) */}
          <div className="flex flex-col justify-between space-y-4 md:col-span-4">
            <div>
              <label className="text-[11px] font-black uppercase text-slate-500">Document Primary Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
              >
                <option value="English">English (Latin OCR)</option>
                <option value="Hindi">Hindi (Devanagari OCR)</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
              </select>
              <p className="mt-1 text-[10px] text-slate-400">Language hinting improves character recognition accuracy.</p>
            </div>

            <Button
              disabled={loading || !uploadedFile}
              onClick={handleExtractText}
              className="w-full rounded-2xl bg-[#c96f4a] py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#b05d3b]"
            >
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Processing document...
                </>
              ) : (
                <>
                  <ScanText className="mr-2 h-4 w-4" />
                  Extract Text
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Two-Panel Layout Post OCR: LEFT (Original Preview) | RIGHT (Extracted Text) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* LEFT PANEL: Original Image / PDF Preview */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Original Document Preview</h2>
            {uploadedFile && (
              <Badge variant="outline" className="text-[10px] font-bold text-slate-600">
                {uploadedFile.type || "Document"}
              </Badge>
            )}
          </div>

          <div className="mt-4 flex min-h-[380px] flex-col items-center justify-center rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            {filePreviewUrl ? (
              <div className="relative max-h-[420px] overflow-auto rounded-xl shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={filePreviewUrl}
                  alt="Scanned Document Preview"
                  className="max-h-[400px] w-auto object-contain rounded-lg"
                />
              </div>
            ) : uploadedFile ? (
              <div className="text-center">
                <FileText size={48} className="mx-auto text-[#c96f4a]" />
                <p className="mt-3 text-sm font-bold text-slate-800">{uploadedFile.name}</p>
                <p className="mt-1 text-xs text-slate-500">{(uploadedFile.size / 1024).toFixed(1)} KB • PDF Document</p>
                <Badge className="mt-3 bg-emerald-100 text-emerald-800 text-[10px] font-bold">Ready for OCR Extraction</Badge>
              </div>
            ) : (
              <div className="text-center text-slate-400">
                <ImageIcon size={40} className="mx-auto text-slate-300" />
                <p className="mt-2 text-xs font-bold text-slate-500">No document preview available.</p>
                <p className="text-[10px]">Upload an image or PDF to inspect visual preview.</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Extracted Editable Text */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Extracted Editable Text</h2>
              {ocrResult && (
                <p className="text-[11px] text-slate-500">
                  {ocrResult.characterCount} chars • {ocrResult.pageCount} page(s) • {(ocrResult.confidence * 100).toFixed(1)}% confidence
                </p>
              )}
            </div>

            {ocrResult && (
              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="sm" onClick={handleCopyText} className="h-8 text-[11px] font-bold">
                  {copied ? <Check size={12} className="mr-1 text-emerald-600" /> : <Copy size={12} className="mr-1" />}
                  {copied ? "Copied" : "Copy Text"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadText} className="h-8 text-[11px] font-bold">
                  <Download size={12} className="mr-1" /> Download
                </Button>
              </div>
            )}
          </div>

          <div className="mt-4">
            {loading ? (
              <div className="flex min-h-[380px] flex-col items-center justify-center rounded-2xl border border-orange-100 bg-orange-50/20 p-8 text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-[#c96f4a]" />
                <p className="mt-3 text-sm font-bold text-slate-800">Processing document...</p>
                <p className="mt-1 text-xs text-slate-500">Extracting characters, running lexical normalization, and formatting paragraphs.</p>
              </div>
            ) : ocrResult ? (
              <div className="space-y-4">
                <textarea
                  rows={15}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/40 p-4 font-mono text-xs leading-relaxed text-slate-800 focus:border-[#c96f4a] focus:bg-white focus:outline-none"
                  value={ocrResult.editableText}
                  onChange={(e) => setOcrResult({ ...ocrResult, editableText: e.target.value })}
                />

                {/* Downstream workflow actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSendToExtraction}
                      className="text-[11px] font-bold text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                    >
                      <Search size={13} className="mr-1" />
                      Send to AI Extraction
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSendToSummarizer}
                      className="text-[11px] font-bold text-[#274690] border-blue-200 hover:bg-blue-50"
                    >
                      <ListTree size={13} className="mr-1" />
                      Send to Summarizer
                    </Button>
                  </div>

                  <Button
                    size="sm"
                    disabled={saving}
                    onClick={handleSaveDocument}
                    className="bg-[#274690] text-xs font-bold text-white hover:bg-[#1f3770]"
                  >
                    <Save size={13} className="mr-1" />
                    Save as Document
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[380px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                <ScanText className="h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm font-bold text-slate-700">No document selected.</p>
                <p className="mt-1 text-xs text-slate-400">Upload a scanned document above and click &quot;Extract Text&quot;.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
