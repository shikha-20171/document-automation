"use client";

import { useState } from "react";
import { Upload, X, CheckCircle2, AlertTriangle, FileText, Download } from "lucide-react";
import { clientStore } from "./clientStore";

interface ImportClientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (count: number) => void;
}

export default function ImportClientsModal({ isOpen, onClose, onSuccess }: ImportClientsModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{
    total: number;
    successCount: number;
    duplicateCount: number;
    failedCount: number;
    errors: any[];
  } | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setErrorMsg(null);
    setImportResult(null);
    setParsing(true);

    try {
      const text = await f.text();
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        throw new Error("CSV file must have at least a header and 1 data row.");
      }

      // Simple CSV parser
      const headers = lines[0].split(",").map(h => h.trim().replace(/^["']|["']$/g, "").toLowerCase());
      const rows: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        // match commas outside quotes
        const rawCols = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        const cols = rawCols.map(c => c.trim().replace(/^["']|["']$/g, ""));
        const row: any = {};
        headers.forEach((h, idx) => {
          row[h] = cols[idx] || "";
        });

        const name = row.name || row["client name"] || row["company name"] || row.company || "";
        if (name) {
          rows.push({
            name,
            email: row.email || row["primary email"] || "",
            phone: row.phone || row["mobile"] || "",
            contactPerson: row.contact || row["contact person"] || "",
            type: row.type || "Company",
            industry: row.industry || "Other",
            city: row.city || "",
            state: row.state || "",
            country: row.country || "India",
            department: row.department || "General",
            status: row.status || "Active",
            notes: row.notes || "Imported via CSV",
          });
        }
      }

      if (rows.length === 0) {
        throw new Error("No valid client records found. Ensure columns contain 'name' or 'company name'.");
      }

      setParsedRows(rows);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to parse CSV file.");
      setParsedRows([]);
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    if (parsedRows.length === 0) return;
    setImporting(true);
    setErrorMsg(null);

    try {
      const result = await clientStore.importClients(parsedRows);
      setImportResult(result);
      if (result.successCount > 0) {
        onSuccess(result.successCount);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Import request failed.");
    } finally {
      setImporting(false);
    }
  };

  const downloadSampleCsv = () => {
    const csvContent =
      "name,email,phone,contact person,type,industry,city,state,country,department,status\n" +
      "Acme Global Tech,contact@acmetech.com,+91 9876543210,John Doe,Company,IT / Software,Bengaluru,Karnataka,India,Sales,Active\n" +
      "Zenith Retailers,orders@zenith.in,+91 9123456789,Pooja Sharma,Company,Retail,Mumbai,Maharashtra,India,Operations,Active\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "sample_clients_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl flex flex-col max-h-[85vh] border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Upload size={18} className="text-[#274690]" /> Import Clients from CSV
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Upload a CSV file to bulk import clients into CRM</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 transition">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Sample template link */}
          <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
            <div>
              <p className="text-xs font-bold text-slate-700">Need a CSV template?</p>
              <p className="text-[10px] text-slate-500">Download formatted template with required columns</p>
            </div>
            <button
              onClick={downloadSampleCsv}
              className="flex items-center gap-1 text-xs font-bold text-[#274690] hover:underline"
            >
              <Download size={13} /> Sample CSV
            </button>
          </div>

          {/* Upload Box */}
          <div className="rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center hover:border-[#274690] transition bg-slate-50/40">
            <input
              type="file"
              accept=".csv"
              id="crm-csv-input"
              className="hidden"
              onChange={handleFileChange}
            />
            <label htmlFor="crm-csv-input" className="cursor-pointer flex flex-col items-center">
              <Upload size={24} className="text-slate-400 mb-2" />
              <span className="text-xs font-bold text-slate-700">
                {file ? file.name : "Click to select CSV file"}
              </span>
              <span className="text-[10px] text-slate-400 mt-1">Accepts standard .csv files</span>
            </label>
          </div>

          {parsing && (
            <p className="text-xs text-center text-slate-500 animate-pulse font-medium">
              Validating CSV rows...
            </p>
          )}

          {errorMsg && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Preview rows */}
          {parsedRows.length > 0 && !importResult && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Preview ({parsedRows.length} clients found)</span>
                <span className="text-[10px] font-semibold text-emerald-600">Ready to import</span>
              </div>
              <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2 text-[11px] space-y-1">
                {parsedRows.slice(0, 5).map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-1 px-2 bg-white rounded-lg border border-slate-100">
                    <span className="font-bold text-slate-800">{r.name}</span>
                    <span className="text-slate-400">{r.email || r.phone || r.city}</span>
                  </div>
                ))}
                {parsedRows.length > 5 && (
                  <p className="text-[10px] text-slate-400 text-center pt-1">+ {parsedRows.length - 5} more clients</p>
                )}
              </div>
            </div>
          )}

          {/* Result summary */}
          {importResult && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                <CheckCircle2 size={16} /> Import Execution Completed
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-white p-2 rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-400 font-semibold">Imported</p>
                  <p className="text-lg font-black text-emerald-600">{importResult.successCount}</p>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-400 font-semibold">Duplicates</p>
                  <p className="text-lg font-black text-amber-600">{importResult.duplicateCount}</p>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-400 font-semibold">Failed</p>
                  <p className="text-lg font-black text-red-600">{importResult.failedCount}</p>
                </div>
              </div>
              {importResult.errors.length > 0 && (
                <div className="max-h-28 overflow-y-auto space-y-1 text-[10px] text-slate-600 pt-1">
                  {importResult.errors.map((e, idx) => (
                    <p key={idx} className="text-amber-700 bg-amber-50 p-1.5 rounded-lg">
                      Row {e.row}: {e.error}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/40">
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition">
            Close
          </button>
          {parsedRows.length > 0 && !importResult && (
            <button
              onClick={handleImport}
              disabled={importing}
              className="rounded-xl bg-[#274690] px-5 py-2 text-xs font-bold text-white hover:bg-[#1f3561] transition disabled:opacity-50 flex items-center gap-2"
            >
              {importing ? <span className="h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : null}
              Import {parsedRows.length} Clients
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
