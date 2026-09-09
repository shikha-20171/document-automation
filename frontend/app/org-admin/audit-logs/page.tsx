"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  History,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpDown,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import apiClient from "@/lib/axios";

const ACTION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  UPLOADED: { bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-blue-800" },
  OCR_PROCESSED: { bg: "bg-purple-50 dark:bg-purple-950/40", text: "text-purple-700 dark:text-purple-300", border: "border-purple-200 dark:border-purple-800" },
  AI_GENERATED: { bg: "bg-indigo-50 dark:bg-indigo-950/40", text: "text-indigo-700 dark:text-indigo-300", border: "border-indigo-200 dark:border-indigo-800" },
  REVIEWED: { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800" },
  APPROVED: { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800" },
  REJECTED: { bg: "bg-rose-50 dark:bg-rose-950/40", text: "text-rose-700 dark:text-rose-300", border: "border-rose-200 dark:border-rose-800" },
  SUBMITTED_FOR_APPROVAL: { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800" },
  SIGNED: { bg: "bg-teal-50 dark:bg-teal-950/40", text: "text-teal-700 dark:text-teal-300", border: "border-teal-200 dark:border-teal-800" },
  SIGNATURE_REQUESTED: { bg: "bg-cyan-50 dark:bg-cyan-950/40", text: "text-cyan-700 dark:text-cyan-300", border: "border-cyan-200 dark:border-cyan-800" },
  SENT_TO_CLIENT: { bg: "bg-sky-50 dark:bg-sky-950/40", text: "text-sky-700 dark:text-sky-300", border: "border-sky-200 dark:border-sky-800" },
  DOWNLOADED: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-300", border: "border-slate-200 dark:border-slate-700" },
  ARCHIVED: { bg: "bg-zinc-100 dark:bg-zinc-800", text: "text-zinc-700 dark:text-zinc-300", border: "border-zinc-200 dark:border-zinc-700" },
};

export default function OrgAdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(25);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/unified-documents/audit-logs/all", {
        params: {
          search: search.trim() || undefined,
          action: actionFilter !== "ALL" ? actionFilter : undefined,
          page,
          limit,
        },
      });
      if (res.data?.success && res.data.data) {
        setLogs(res.data.data.logs || []);
        setTotal(res.data.data.total || 0);
      }
    } catch (err) {
      console.warn("Notice loading audit logs:", err);
    } finally {
      setLoading(false);
    }
  }, [search, actionFilter, page, limit]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleExportCsv = () => {
    if (logs.length === 0) return;
    const headers = ["Timestamp", "Action", "Document Title", "Document Number", "User", "Role", "Details"];
    const rows = logs.map((l) => [
      new Date(l.createdAt).toISOString(),
      l.action || "",
      `"${(l.documentTitle || "").replace(/"/g, '""')}"`,
      l.documentNumber || "",
      `"${(l.userName || "").replace(/"/g, '""')}"`,
      l.userRole || "",
      `"${(l.details || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#274690]/10 text-[#274690] text-xs font-bold">
            <ShieldCheck size={14} /> Compliance & Governance
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">Audit Trail & Activity Logs</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable tracking of every document action, OCR extraction, AI generation, review, approval, and delivery event.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchLogs()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs"
          >
            <RefreshCw size={13} className={loading ? "animate-spin text-[#274690]" : ""} /> Refresh
          </button>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-[#274690] hover:bg-[#1f3561] text-white shadow-xs transition"
          >
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by document title, number, user, or action details..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#274690]/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={14} className="text-slate-400 shrink-0" />
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="w-full md:w-48 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 p-2 focus:bg-white focus:outline-none"
          >
            <option value="ALL">All Event Types</option>
            <option value="UPLOADED">Upload & Ingestion</option>
            <option value="OCR_PROCESSED">OCR & Extraction</option>
            <option value="AI_GENERATED">AI Generation</option>
            <option value="REVIEWED">Human Review</option>
            <option value="APPROVED">Approval</option>
            <option value="REJECTED">Rejection</option>
            <option value="SIGNED">E-Signature</option>
            <option value="SENT_TO_CLIENT">Client Delivery</option>
            <option value="DOWNLOADED">Download</option>
            <option value="ARCHIVED">Archival</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Document</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-[#274690]" />
                    Loading audit trail records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <History size={24} className="mx-auto mb-2 text-slate-300" />
                    No audit records matching criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const style = ACTION_COLORS[log.action] || {
                    bg: "bg-slate-50",
                    text: "text-slate-700",
                    border: "border-slate-200",
                  };
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-medium">
                        {new Date(log.createdAt).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${style.bg} ${style.text} ${style.border}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800 line-clamp-1">{log.documentTitle || "Document"}</div>
                        {log.documentNumber && (
                          <div className="text-[10px] font-mono text-slate-400">{log.documentNumber}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-700">{log.userName || "System"}</div>
                        <div className="text-[10px] text-slate-400">{log.userRole || "STAFF"}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 line-clamp-2 max-w-md">{log.details || "-"}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 shadow-2xs"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500">
          <div>
            Showing <span className="font-bold text-slate-700">{logs.length}</span> of{" "}
            <span className="font-bold text-slate-700">{total}</span> total events
          </div>
          <div className="flex items-center gap-1.5">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 rounded-lg border border-slate-200 bg-white disabled:opacity-40 font-bold hover:bg-slate-50"
            >
              Previous
            </button>
            <span className="px-2 font-bold text-slate-700">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 rounded-lg border border-slate-200 bg-white disabled:opacity-40 font-bold hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Inspect Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <History size={18} className="text-[#274690]" /> Audit Event Details
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">Event ID:</span>
                <span className="font-mono text-slate-700">{selectedLog.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">Timestamp:</span>
                <span className="text-slate-700">{new Date(selectedLog.createdAt).toISOString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">Action:</span>
                <span className="font-black text-[#274690]">{selectedLog.action}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">Document:</span>
                <span className="font-bold text-slate-800">{selectedLog.documentTitle || "-"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">User:</span>
                <span className="text-slate-700">{selectedLog.userName} ({selectedLog.userRole})</span>
              </div>
              <div className="py-1">
                <span className="text-slate-500 font-semibold block mb-1">Details:</span>
                <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  {selectedLog.details}
                </p>
              </div>
              {selectedLog.metadata && (
                <div className="py-1">
                  <span className="text-slate-500 font-semibold block mb-1">Metadata:</span>
                  <pre className="text-[11px] font-mono text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200 overflow-x-auto max-h-40">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[#274690] text-white hover:bg-[#1f3561]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
