"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollText } from "lucide-react";

interface AuditEntry {
  time: string;
  user: string;
  role: string;
  action: "Submitted" | "Approved" | "Rejected" | "Signed" | "Changes Requested";
  comment: string;
  date: string;
}

interface ApprovalHistoryTabProps {
  showToast: (msg: string) => void;
}

const auditEntries: AuditEntry[] = [
  { time: "10:30", user: "Rahul Sharma", role: "Requester", action: "Submitted", comment: "Contract submitted for approval", date: "12 Aug 2026" },
  { time: "10:45", user: "Manager", role: "Manager", action: "Approved", comment: "Terms look good", date: "12 Aug 2026" },
  { time: "11:20", user: "Finance Manager", role: "Finance", action: "Approved", comment: "Budget approved", date: "12 Aug 2026" },
  { time: "11:45", user: "Org Admin", role: "Admin", action: "Approved", comment: "Final approval granted", date: "12 Aug 2026" },
  { time: "12:10", user: "Client", role: "External", action: "Approved", comment: "Client signed off", date: "12 Aug 2026" },
  { time: "12:30", user: "System", role: "System", action: "Signed", comment: "E-signature completed", date: "12 Aug 2026" },
];

const actionBadge = (action: string) => {
  switch (action) {
    case "Submitted":
      return "bg-blue-100 text-blue-800";
    case "Approved":
      return "bg-emerald-100 text-emerald-800";
    case "Rejected":
      return "bg-red-100 text-red-800";
    case "Signed":
      return "bg-purple-100 text-purple-800";
    case "Changes Requested":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

export default function ApprovalHistoryTab({ showToast }: ApprovalHistoryTabProps) {
  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <ScrollText size={22} className="text-[#274690]" /> Approval History
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Complete audit trail of all approval actions and decisions.
        </p>
      </div>

      {/* Table */}
      <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Time</th>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Comment</th>
                <th className="py-3.5 px-4">Date/Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {auditEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    No audit history found.
                  </td>
                </tr>
              ) : (
                auditEntries.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 font-mono">{entry.time}</td>
                    <td className="py-3.5 px-4 text-slate-800 font-semibold">{entry.user}</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        {entry.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${actionBadge(entry.action)}`}>
                        {entry.action}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">{entry.comment}</td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">{entry.date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
