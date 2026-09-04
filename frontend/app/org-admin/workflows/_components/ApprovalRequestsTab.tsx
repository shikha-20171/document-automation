"use client";

import { useEffect, useState } from "react";
import {
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { workflowApi } from "@/services/workflowApi";
import ApprovalDetailModal from "./ApprovalDetailModal";

interface ApprovalRequest {
  id: string;
  document: string;
  requestedBy: string;
  approver: string;
  status: "Pending" | "Approved" | "Rejected" | "Changes Requested" | "Overdue";
}

interface ApprovalRequestsTabProps {
  showToast: (msg: string) => void;
}

type SubTab = "All" | "Pending" | "Approved" | "Rejected" | "Changes Requested";

export default function ApprovalRequestsTab({ showToast }: ApprovalRequestsTabProps) {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<SubTab>("All");
  const [detailId, setDetailId] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await workflowApi.getOrgApprovalRequests();
      if (res?.data) {
        const mapped: ApprovalRequest[] = res.data.map((r: any) => ({
          id: r.id,
          document: r.documentName,
          requestedBy: r.submittedBy,
          approver: r.department ? `${r.department} Lead / Manager` : "Team Leader",
          status: r.status === "APPROVED" ? "Approved" : r.status === "REJECTED" ? "Rejected" : r.status === "CHANGES_REQUESTED" ? "Changes Requested" : "Pending",
        }));
        setRequests(mapped);
      }
    } catch (err) {
      console.error("Failed to load approval requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRequests();
  }, []);

  const stats = {
    Pending: requests.filter((r) => r.status === "Pending").length,
    Approved: requests.filter((r) => r.status === "Approved").length,
    Rejected: requests.filter((r) => r.status === "Rejected").length,
    "Changes Requested": requests.filter((r) => r.status === "Changes Requested").length,
    Overdue: requests.filter((r) => r.status === "Overdue").length,
  };

  const subTabs: { id: SubTab; label: string; count?: number }[] = [
    { id: "All", label: "All" },
    { id: "Pending", label: "Pending", count: stats.Pending },
    { id: "Approved", label: "Approved", count: stats.Approved },
    { id: "Rejected", label: "Rejected", count: stats.Rejected },
    { id: "Changes Requested", label: "Changes Requested", count: stats["Changes Requested"] },
  ];

  const filtered = subTab === "All" ? requests : requests.filter((r) => r.status === subTab);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
      case "Approved":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "Rejected":
        return "bg-red-100 text-red-800 dark:bg-rose-900/30 dark:text-rose-400";
      case "Changes Requested":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "Overdue":
        return "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  const updateStatus = (id: string, newStatus: ApprovalRequest["status"]) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
    showToast(`Request updated to "${newStatus}"`);
    setDetailId(null);
  };

  const selectedRequest = detailId ? requests.find((r) => r.id === detailId) : null;

  return (
    <div className="space-y-6 font-sans">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {Object.entries(stats).map(([key, value]) => (
          <Card key={key} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{key}</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{value}</p>
          </Card>
        ))}
      </div>

      {/* Sub Tabs & Refresh */}
      <div className="flex items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-x-auto">
        <div className="flex items-center gap-1.5 scrollbar-none">
          {subTabs.map((t) => {
            const isActive = subTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSubTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-[#274690] text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <span>{t.label}</span>
                {t.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"}`}>
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => void fetchRequests()}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-[#274690] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 shrink-0 transition"
          title="Refresh requests"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Table */}
      <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Document</th>
                <th className="py-3.5 px-4">Requested By</th>
                <th className="py-3.5 px-4">Approver</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                    <RefreshCw className="h-5 w-5 animate-spin text-[#274690] mx-auto mb-2" />
                    Loading requests from database...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                    No approval requests found for this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">{req.document}</td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{req.requestedBy}</td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{req.approver}</td>
                    <td className="py-3.5 px-4">
                      <Badge className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${getStatusBadge(req.status)}`}>
                        {req.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          onClick={() => setDetailId(req.id)}
                          className="h-8 text-[11px] font-bold bg-[#274690] hover:bg-[#1f3561] text-white rounded-lg"
                        >
                          Review
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Approval Detail Modal */}
      {selectedRequest && (
        <ApprovalDetailModal
          request={selectedRequest}
          onClose={() => setDetailId(null)}
          onStatusChange={(newStatus) => updateStatus(selectedRequest.id, newStatus)}
        />
      )}
    </div>
  );
}
