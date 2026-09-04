"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Search,
  ArrowLeft,
  UploadCloud,
  Copy,
  Download,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Trash2,
  FileCheck,
  Edit3,
  Layers,
  Database,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { aiApi } from "@/services/aiApi";

type DeptDoc = {
  id: number;
  name: string;
  type?: string;
  size?: number;
};

type ExtractedRow = {
  field: string;
  value: string;
  confidence: number;
};

export default function AiDataExtractionPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successToast, setSuccessToast] = useState("");

  // Input source
  const [inputMode, setInputMode] = useState<"select" | "upload" | "text">("upload");
  const [deptDocs, setDeptDocs] = useState<DeptDoc[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState(
    `TAX INVOICE: INV-2034\nDate of Issue: 2026-08-10\nVendor Name: TechSolutions Private Limited\nGST Number: 27AABCT3524K1Z8\nDepartment: Operations & Technology\nBilling Address: 4th Floor, Alpha Tower, Tech Park\nItem 1: Cloud Storage Infrastructure - Rs. 1,80,000\nItem 2: Managed Security Support - Rs. 65,000\nSubtotal: Rs. 2,45,000\nGST (18%): Rs. 44,100\nTotal Payable Amount: Rs. 2,89,100\nPayment Due Date: 2026-09-10\nBank Details: HDFC Bank - A/C 50200049281920 - IFSC HDFC0001284`
  );

  // Extraction Type
  const [extractionType, setExtractionType] = useState("Invoice");
  const [customFields, setCustomFields] = useState<string[]>([
    "Invoice Number",
    "Vendor Name",
    "Date",
    "Total Amount",
    "Tax / GST",
    "Due Date",
  ]);
  const [newFieldName, setNewFieldName] = useState("");

  // Extracted Results Table
  const [extractedRows, setExtractedRows] = useState<ExtractedRow[]>([]);
  const [lastRunId, setLastRunId] = useState("");
  const [documentName, setDocumentName] = useState("vendor_invoice_inv2034.pdf");
  const [saveTarget, setSaveTarget] = useState("FINANCIAL_RECORDS");

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

  const handleAddCustomField = () => {
    if (!newFieldName.trim()) return;
    if (customFields.includes(newFieldName.trim())) {
      setError("Field name already in list.");
      return;
    }
    setCustomFields([...customFields, newFieldName.trim()]);
    setNewFieldName("");
  };

  const handleRemoveCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const handleExtract = async () => {
    setError("");
    setLoading(true);
    try {
      let docName = documentName;
      let payload: any = {
        extractionType,
        customFields: extractionType === "Custom Fields" ? customFields : undefined,
      };

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
        payload.content = rawText;
        payload.documentName = docName;
      }

      const response = await aiApi.extractData(payload);
      if (response?.data) {
        const rows: ExtractedRow[] = response.data.structuredData || [];
        setExtractedRows(rows);
        setLastRunId(response.data.run?.id || "");
        showToast("Data extracted successfully!");
      } else {
        throw new Error("Unable to extract data fields.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to process this document. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRowValueChange = (index: number, newValue: string) => {
    const updated = [...extractedRows];
    updated[index].value = newValue;
    setExtractedRows(updated);
  };

  const handleCopyJSON = () => {
    if (!extractedRows.length) return;
    const obj: Record<string, string> = {};
    extractedRows.forEach((r) => {
      obj[r.field] = r.value;
    });
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
    showToast("Copied extracted data as JSON!");
  };

  const handleExportCSV = () => {
    if (!extractedRows.length) return;
    const csvContent = [
      "Field,Extracted Value,Confidence",
      ...extractedRows.map((r) => `"${r.field}","${r.value.replace(/"/g, '""')}","${r.confidence}%"`),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `extracted_data_${documentName.replace(/\.[^/.]+$/, "")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Exported CSV file.");
  };

  const handleSaveData = async () => {
    if (!extractedRows.length) return;
    setSaving(true);
    try {
      const obj: Record<string, string> = {};
      extractedRows.forEach((r) => {
        obj[r.field] = r.value;
      });

      await aiApi.saveExtractedData({
        runId: lastRunId || undefined,
        documentName,
        data: JSON.stringify(obj),
        saveTarget,
      });

      showToast(`Saved extracted data to ${saveTarget.replace(/_/g, " ")}!`);
    } catch {
      setError("Failed to save extracted data.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRecordDocument = async () => {
    if (!extractedRows.length) return;
    try {
      const content = [
        `STRUCTURED DATA RECORD - ${documentName.toUpperCase()}`,
        `Extraction Type: ${extractionType} | Date: ${new Date().toLocaleDateString()}`,
        `================================================================`,
        ...extractedRows.map((r) => `${r.field.padEnd(25, " ")} : ${r.value} (Confidence: ${r.confidence}%)`),
        `================================================================`,
        `Audited by: Department Manager`,
      ].join("\n");

      await aiApi.saveGeneratedDocument({
        title: `Structured Record - ${documentName}`,
        content,
        documentType: "Structured Record",
        status: "ACTIVE",
        action: "SAVE",
      });

      showToast("Created document record in Department Documents!");
    } catch {
      setError("Failed to create document record.");
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
              <h1 className="text-2xl font-black tracking-tight text-slate-900">AI Data Extraction</h1>
              <Badge className="bg-emerald-600/10 text-emerald-700 text-[11px] font-bold">Tool 03</Badge>
            </div>
            <p className="text-xs text-slate-500">Extract structured key-value data with confidence scores from department documents.</p>
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
        {/* Left Form: Extraction Schema & Source (5 cols) */}
        <div className="space-y-5 lg:col-span-5">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Extraction Configuration</h2>

            {/* Extraction Type Selector */}
            <div>
              <label className="text-[11px] font-black uppercase text-slate-500">Extraction Schema Type</label>
              <select
                value={extractionType}
                onChange={(e) => setExtractionType(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
              >
                <option value="Invoice">Invoice (Numbers, Vendor, GST, Totals)</option>
                <option value="Contract">Commercial Contract / NDA</option>
                <option value="Employee Document">Employee & HR Document</option>
                <option value="Purchase Order">Purchase Order / Requisition</option>
                <option value="General Document">General Document Fields</option>
                <option value="Custom Fields">Custom Fields (User Defined)</option>
              </select>
            </div>

            {/* Custom Fields Builder if Custom Fields selected */}
            {extractionType === "Custom Fields" && (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3.5 space-y-2.5">
                <p className="text-xs font-bold text-emerald-800">Define Target Fields to Extract:</p>
                <div className="flex gap-2">
                  <Input
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCustomField())}
                    placeholder="e.g. Due Date, GST Number..."
                    className="h-8 rounded-lg text-xs"
                  />
                  <Button
                    size="sm"
                    onClick={handleAddCustomField}
                    className="h-8 bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    <Plus size={14} /> Add
                  </Button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {customFields.map((f, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2 py-1 text-[11px] font-semibold text-emerald-900 shadow-2xs"
                    >
                      <span>{f}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomField(i)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Source Mode Selector */}
            <div>
              <label className="text-[11px] font-black uppercase text-slate-500">Document Input Mode</label>
              <div className="mt-1 grid grid-cols-3 gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setInputMode("upload")}
                  className={`rounded-xl py-1.5 text-xs font-bold transition ${
                    inputMode === "upload" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("select")}
                  className={`rounded-xl py-1.5 text-xs font-bold transition ${
                    inputMode === "select" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Dept Docs
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("text")}
                  className={`rounded-xl py-1.5 text-xs font-bold transition ${
                    inputMode === "text" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Paste Text
                </button>
              </div>
            </div>

            {/* File Upload Mode */}
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
                      setDocumentName(file.name);
                      showToast(`Selected ${file.name}`);
                    }
                  }}
                  className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-5 text-center transition hover:border-emerald-500 hover:bg-emerald-50/20"
                >
                  <UploadCloud size={24} className="text-emerald-600" />
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
                      <p className="mt-1 text-xs font-bold text-slate-700">Drag & drop or Browse document</p>
                      <p className="text-[10px] text-slate-400">PDF, Invoices, Contracts, Scans (Max 25MB)</p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Select Dept Doc Mode */}
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
                      {doc.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Paste Text Mode */}
            {inputMode === "text" && (
              <div>
                <label className="text-[11px] font-black uppercase text-slate-500">Document Text Payload</label>
                <textarea
                  rows={5}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 font-mono text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                />
              </div>
            )}

            {/* Save Target Destination Selector */}
            <div>
              <label className="text-[11px] font-black uppercase text-slate-500">Save Target Destination</label>
              <select
                value={saveTarget}
                onChange={(e) => setSaveTarget(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
              >
                <option value="FINANCIAL_RECORDS">Department Financial Records</option>
                <option value="VENDOR_DIRECTORY">Vendor Master Directory</option>
                <option value="DOCUMENT">Document Archive Record</option>
                <option value="COMPLIANCE_VAULT">Compliance Vault</option>
              </select>
            </div>

            {/* Submit Button */}
            <Button
              disabled={loading}
              onClick={handleExtract}
              className="w-full rounded-2xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700"
            >
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Processing document...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Extract Data
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Right Output Table (7 cols) */}
        <div className="space-y-4 lg:col-span-7">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900">Extracted Structured Table</h2>
                <p className="text-xs text-slate-500">
                  {extractedRows.length > 0
                    ? `${extractedRows.length} fields extracted with verified confidence scores.`
                    : "Review, edit values, and save to department database."}
                </p>
              </div>

              {extractedRows.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopyJSON} className="text-xs font-bold">
                    <Copy size={13} className="mr-1" /> Copy JSON
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportCSV} className="text-xs font-bold">
                    <Download size={13} className="mr-1" /> Export CSV
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-5">
              {loading ? (
                <div className="flex min-h-[380px] flex-col items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50/30 p-8 text-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
                  <p className="mt-3 text-sm font-bold text-slate-800">Processing document...</p>
                  <p className="mt-1 text-xs text-slate-500">Detecting fields, validating schema, and computing confidence scores.</p>
                </div>
              ) : extractedRows.length > 0 ? (
                <div className="space-y-4">
                  {/* Editable Table */}
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase text-slate-600">
                        <tr>
                          <th className="px-4 py-3">Field Name</th>
                          <th className="px-4 py-3">Extracted Value (Editable)</th>
                          <th className="px-4 py-3 text-right">Confidence</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {extractedRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/70 transition">
                            <td className="px-4 py-2.5 font-mono font-bold text-[#274690]">
                              {row.field}
                            </td>
                            <td className="px-4 py-2.5">
                              <Input
                                value={row.value}
                                onChange={(e) => handleRowValueChange(idx, e.target.value)}
                                className="h-8 rounded-lg text-xs bg-slate-50/70 border-slate-200 focus:bg-white"
                              />
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                                  row.confidence >= 90
                                    ? "bg-emerald-100 text-emerald-800"
                                    : row.confidence >= 75
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-rose-100 text-rose-800"
                                }`}
                              >
                                {row.confidence}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCreateRecordDocument}
                      className="text-xs font-bold text-slate-700"
                    >
                      <FileCheck size={14} className="mr-1" />
                      Create Document from Data
                    </Button>

                    <Button
                      size="sm"
                      disabled={saving}
                      onClick={handleSaveData}
                      className="bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
                    >
                      <Save size={14} className="mr-1" />
                      Save Extracted Data
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[380px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                  <Search className="h-10 w-10 text-slate-300" />
                  <p className="mt-3 text-sm font-bold text-slate-700">No document selected.</p>
                  <p className="mt-1 text-xs text-slate-400">Choose an extraction schema and provide a document to extract structured fields.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
