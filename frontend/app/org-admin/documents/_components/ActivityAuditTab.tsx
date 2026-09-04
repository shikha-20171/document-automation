"use client";

import { useState } from "react";
import { History, User, FileText, Globe, Search, Filter, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface AuditLogItem {
  id: string;
  user: string;
  action: "Created" | "Uploaded" | "Viewed" | "Edited" | "Downloaded" | "Shared" | "Approved" | "Rejected" | "Archived" | "Deleted" | "Restored";
  document: string;
  dateTime: string;
  ip: string;
}

const auditLogs: AuditLogItem[] = [
  { id: "1", user: "Rajesh Kumar", action: "Uploaded", document: "Employment Contract.pdf", dateTime: "10 Aug 2026, 02:30 PM", ip: "192.168.1.45" },
  { id: "2", user: "Shikha Gour", action: "Approved", document: "Vendor_Invoice_TechCorp_Q3.pdf", dateTime: "10 Aug 2026, 01:20 PM", ip: "192.168.1.10" },
  { id: "3", user: "Priya Sharma", action: "Created", document: "Master_Service_Agreement_2026.docx", dateTime: "09 Aug 2026, 05:45 PM", ip: "192.168.1.88" },
  { id: "4", user: "Amit Patel", action: "Downloaded", document: "Q3_Financial_Audit_Report.xlsx", dateTime: "09 Aug 2026, 11:20 AM", ip: "192.168.1.102" },
  { id: "5", user: "Shikha Gour", action: "Edited", document: "Company_Security_Policy_v4.pdf", dateTime: "08 Aug 2026, 04:10 PM", ip: "192.168.1.10" },
  { id: "6", user: "Rajesh Kumar", action: "Shared", document: "Client_NDA_TechCorp.pdf", dateTime: "07 Aug 2026, 03:15 PM", ip: "192.168.1.45" },
  { id: "7", user: "Priya Sharma", action: "Viewed", document: "Employment_Agreement_Rajesh.pdf", dateTime: "06 Aug 2026, 10:00 AM", ip: "192.168.1.88" },
  { id: "8", user: "Shikha Gour", action: "Restored", document: "2019_Tax_Return_Filing_Master.pdf", dateTime: "05 Aug 2026, 02:10 PM", ip: "192.168.1.10" },
  { id: "9", user: "Vikas Malhotra", action: "Rejected", document: "Unapproved_Expense_Claim.xlsx", dateTime: "03 Aug 2026, 11:45 AM", ip: "192.168.1.66" },
  { id: "10", user: "Amit Patel", action: "Archived", document: "Legacy_Marketing_Deck_2018.pptx", dateTime: "01 Aug 2026, 09:30 AM", ip: "192.168.1.102" },
];

export default function ActivityAuditTab() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All");

  const filtered = auditLogs.filter(log => {
    const matchesSearch = log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.document.toLowerCase().includes(search.toLowerCase()) ||
      log.ip.includes(search);
    const matchesAction = actionFilter === "All" || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <History size={22} className="text-[#274690]" /> Organisation Activity & Audit Log
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable document security trail logging all user actions, document edits, views, downloads, and IP addresses.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user, document, or IP address..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-[#274690]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <label className="text-xs font-bold text-slate-500 whitespace-nowrap">Filter Action:</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:outline-none bg-white"
          >
            <option value="All">All Actions</option>
            <option value="Created">Created</option>
            <option value="Uploaded">Uploaded</option>
            <option value="Viewed">Viewed</option>
            <option value="Edited">Edited</option>
            <option value="Downloaded">Downloaded</option>
            <option value="Shared">Shared</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Archived">Archived</option>
            <option value="Deleted">Deleted</option>
            <option value="Restored">Restored</option>
          </select>
        </div>
      </Card>

      {/* Audit Log Table */}
      <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Document</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <User size={15} className="text-[#274690]" />
                    {log.user}
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge className={`text-[10px] font-extrabold ${
                      log.action === "Created" || log.action === "Uploaded" ? "bg-blue-100 text-blue-800" :
                      log.action === "Approved" || log.action === "Restored" ? "bg-emerald-100 text-emerald-800" :
                      log.action === "Edited" || log.action === "Shared" ? "bg-purple-100 text-purple-800" :
                      log.action === "Downloaded" || log.action === "Viewed" ? "bg-cyan-100 text-cyan-800" :
                      "bg-rose-100 text-rose-800"
                    }`}>
                      {log.action}
                    </Badge>
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-slate-800">
                    <div className="flex items-center gap-1.5">
                      <FileText size={14} className="text-slate-400" />
                      <span>{log.document}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                    {log.dateTime}
                  </td>

                  <td className="py-3.5 px-4 text-slate-500 text-[11px] font-mono">
                    <div className="flex items-center gap-1">
                      <Globe size={13} className="text-slate-400" />
                      <span>{log.ip}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
