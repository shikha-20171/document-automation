"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Bot,
  ArrowLeft,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FolderOpen,
  Tag,
  ShieldCheck,
  Save,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { aiApi } from "@/services/aiApi";

type DeptDoc = {
  id: number;
  name: string;
  type?: string;
};

export default function AiDocumentClassificationPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successToast, setSuccessToast] = useState("");

  // Source selection
  const [inputMode, setInputMode] = useState<"select" | "upload" | "text">("upload");
  const [deptDocs, setDeptDocs] = useState<DeptDoc[]>([]);
  const [selectedDocId, setSelectedDocId] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState("nda_vendor_techsolutions_v2.docx");
  const [rawContent, setRawContent] = useState(
    "NON-DISCLOSURE AGREEMENT (NDA)\nThis agreement binds TechSolutions Pvt Ltd and Department Operations regarding proprietary codebases, customer records, and trade secrets for a duration of 36 months. Breach involves statutory liquidated damages."
  );

  // Classification Results
  const [classification, setClassification] = useState<{
    documentType: string;
    category: string;
    departmentScope: string;
    suggestedFolder: string;
    confidence: number;
    detectedKeywords: string[];
  } | null>(null);

  // Editable category state
  const [selectedCategory, setSelectedCategory] = useState("Legal");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 4000);
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

  const handleClassify = async () => {
    setError("");
    setLoading(true);
    try {
      let docName = documentName;
      let payload: any = {};

      if (inputMode === "upload" && uploadedFile) {
        payload.file = uploadedFile;
        docName = uploadedFile.name;
        setDocumentName(uploadedFile.name);
      } else if (inputMode === "select" && selectedDocId) {
        const found = deptDocs.find((d) => String(d.id) === selectedDocId);
        docName = found?.name || "department-doc";
        payload.documentName = docName;
        setDocumentName(docName);
      } else {
        payload.content = rawContent;
        payload.documentName = docName;
      }

      const response = await aiApi.classify(payload);
      if (response?.data) {
        const data = response.data;
        setClassification({
          documentType: data.documentType || "General Document",
          category: data.category || "Operations",
          departmentScope: data.departmentScope || "Operations",
          suggestedFolder: data.suggestedFolder || "Operations/Auto-Classified",
          confidence: data.confidence || 0.95,
          detectedKeywords: data.detectedKeywords || ["department", "operations"],
        });
        setSelectedCategory(data.category || "Operations");
        showToast("Document classified successfully!");
      } else {
        throw new Error("Unable to classify document.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to process this document. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClassification = async () => {
    if (!classification) return;
    setSaving(true);
    try {
      await aiApi.saveGeneratedDocument({
        title: `Classified: ${documentName}`,
        content: `Document Name: ${documentName}\nType: ${classification.documentType}\nCategory: ${selectedCategory}\nDepartment: ${classification.departmentScope}\nFolder: ${classification.suggestedFolder}\nConfidence: ${Math.round(classification.confidence * 100)}%`,
        documentType: classification.documentType,
        status: "ACTIVE",
        action: "SAVE",
      });
      showToast(`Classification confirmed and saved to ${selectedCategory}!`);
    } catch {
      setError("Failed to save classification.");
    } finally {
      setSaving(false);
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
              <h1 className="text-2xl font-black tracking-tight text-slate-900">AI Document Classification</h1>
              <Badge className="bg-indigo-600/10 text-indigo-700 text-[11px] font-bold">Tool 04</Badge>
            </div>
            <p className="text-xs text-slate-500">Automatically identify document type, assign category, and organize within your department.</p>
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
        {/* Left Input Pane (5 cols) */}
        <div className="space-y-5 lg:col-span-5">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Select Document to Classify</h2>

            {/* Source Mode Selector */}
            <div className="grid grid-cols-3 gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setInputMode("upload")}
                className={`rounded-xl py-1.5 text-xs font-bold transition ${
                  inputMode === "upload" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setInputMode("select")}
                className={`rounded-xl py-1.5 text-xs font-bold transition ${
                  inputMode === "select" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Dept Docs
              </button>
              <button
                type="button"
                onClick={() => setInputMode("text")}
                className={`rounded-xl py-1.5 text-xs font-bold transition ${
                  inputMode === "text" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Paste Text
              </button>
            </div>

            {/* Mode 1: Upload File */}
            {inputMode === "upload" && (
              <div>
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
                      setDocumentName(file.name);
                      showToast(`Attached ${file.name}`);
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
                      setDocumentName(file.name);
                      showToast(`Attached ${file.name}`);
                    }
                  }}
                  className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-6 text-center transition hover:border-indigo-500 hover:bg-indigo-50/20"
                >
                  <UploadCloud size={24} className="text-indigo-600" />
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
                      <p className="text-[10px] text-slate-400">PDF, DOC, DOCX, TXT (Max 25MB)</p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Mode 2: Select Dept Doc */}
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
              </div>
            )}

            {/* Mode 3: Paste Text */}
            {inputMode === "text" && (
              <div>
                <label className="text-[11px] font-black uppercase text-slate-500">Document Text Sample</label>
                <textarea
                  rows={6}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none"
                  value={rawContent}
                  onChange={(e) => setRawContent(e.target.value)}
                />
              </div>
            )}

            {/* Submit Button */}
            <Button
              disabled={loading}
              onClick={handleClassify}
              className="w-full rounded-2xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700"
            >
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Processing document...
                </>
              ) : (
                <>
                  <Bot className="mr-2 h-4 w-4" />
                  Classify Document
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Right Results Pane (7 cols) */}
        <div className="space-y-4 lg:col-span-7">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-black text-slate-900">AI Classification Report</h2>
              <p className="text-xs text-slate-500">Predicted document type, category, confidence rating, and department folder path.</p>
            </div>

            <div className="mt-5">
              {loading ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50/30 p-8 text-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
                  <p className="mt-3 text-sm font-bold text-slate-800">Processing document...</p>
                  <p className="mt-1 text-xs text-slate-500">Scanning content semantics, keywords, and metadata patterns.</p>
                </div>
              ) : classification ? (
                <div className="space-y-5">
                  {/* Summary Metric Cards */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Identified Document Type</span>
                      <p className="mt-1 text-lg font-black text-slate-900">{classification.documentType}</p>
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                          {Math.round(classification.confidence * 100)}% Confidence
                        </span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Department Scope</span>
                      <p className="mt-1 text-lg font-black text-[#274690]">{classification.departmentScope}</p>
                      <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                        <ShieldCheck size={14} /> Org-Isolated
                      </div>
                    </div>
                  </div>

                  {/* Category Selection & Override */}
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black uppercase text-indigo-900">
                        Assigned Category (Editable by Manager)
                      </label>
                      <Badge className="bg-indigo-600 text-[10px] text-white">Suggested: {classification.category}</Badge>
                    </div>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="h-10 w-full rounded-xl border border-indigo-200 bg-white px-3 text-xs font-bold text-slate-800"
                    >
                      <option value="Finance">Finance (Invoices, Receipts, Ledgers)</option>
                      <option value="Legal">Legal (Agreements, NDAs, Contracts)</option>
                      <option value="Human Resources">Human Resources (Offers, Forms)</option>
                      <option value="Procurement">Procurement (POs, Requisitions)</option>
                      <option value="Operations">Operations (SOPs, Internal Memos)</option>
                      <option value="Compliance">Compliance (Audit Reports, Policies)</option>
                    </select>
                  </div>

                  {/* Suggested Folder Path */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Recommended Folder Path</span>
                    <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 font-mono text-xs font-bold text-slate-800">
                      <FolderOpen size={16} className="text-indigo-600" />
                      <span>{classification.departmentScope} / {selectedCategory} / Auto-Classified /</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Department Managers can organize within their department scope only.</p>
                  </div>

                  {/* Detected Keywords */}
                  {classification.detectedKeywords && classification.detectedKeywords.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Detected Semantic Keywords</span>
                      <div className="flex flex-wrap gap-1.5">
                        {classification.detectedKeywords.map((kw, i) => (
                          <Badge key={i} variant="outline" className="border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-700">
                            <Tag size={10} className="mr-1 text-indigo-600" />
                            {kw}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions Footer */}
                  <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                    <Button
                      disabled={saving}
                      onClick={handleSaveClassification}
                      className="bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700"
                    >
                      <Save size={14} className="mr-1.5" />
                      Confirm & Save Classification
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex minh-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                  <Bot className="h-10 w-10 text-slate-300" />
                  <p className="mt-3 text-sm font-bold text-slate-700">No document selected.</p>
                  <p className="mt-1 text-xs text-slate-400">Upload or choose a document on the left and click &quot;Classify Document&quot;.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
