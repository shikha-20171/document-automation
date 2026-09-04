"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
  CheckSquare,
  Clock,
  TrendingUp,
  Layers,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { reportsApi } from "@/services/reportsApi";

export default function TeamLeaderReportsPage() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any>(null);
  const [error, setError] = useState("");
  const [successToast, setSuccessToast] = useState("");

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 4000);
  };

  const fetchReports = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await reportsApi.getTeamReports();
      if (res?.data) {
        setReports(res.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchReports();
  }, []);

  const handleExportCSV = () => {
    const employees = reports?.teamPerformance?.employees || [];
    const csvContent = [
      "Associate Name,Designation,Assigned Tasks,Completed Tasks,Pending Tasks,Score (%)",
      ...employees.map(
        (e: any) => `"${e.name}","${e.role}",${e.assigned},${e.completed},${e.pending},${e.score}`
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `financial_operations_report_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Exported Team Report as CSV.");
  };

  const teamPerf = reports?.teamPerformance || {
    completionRate: 94.5,
    avgCompletionHours: 3.2,
    onTimeDelivery: 98.0,
    totalAssignedTasks: 18,
    completedTasks: 14,
    pendingTasks: 4,
    overdueTasks: 1,
    employees: [],
  };

  const docReports = reports?.documentReports || {
    total: 5,
    approved: 2,
    underReview: 2,
    pendingApproval: 1,
    drafts: 1,
    avgProcessingTimeHours: 4.1,
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-20 font-sans text-slate-800">
      {/* 1. HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-[#274690] sm:text-3xl">Team Reports & Analytics</h1>
            <Badge className="bg-[#c96f4a]/10 text-[#c96f4a] border-[#c96f4a]/30 text-xs font-black px-2.5 py-0.5">
              Financial Operations Scope
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-semibold">
            Operational metrics, associate throughput, and document review speed
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            onClick={handleExportCSV}
            className="h-10 rounded-xl bg-[#274690] px-4 text-xs font-black text-white hover:bg-[#1f3561] shadow-sm gap-1.5"
          >
            <Download size={15} /> Export CSV Report
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {successToast && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 shadow-sm animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-800 shadow-sm animate-in fade-in">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. STATS OVERVIEW */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm hover:border-[#274690]/30 transition">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Team SLA Success</span>
          <p className="mt-2 text-3xl font-black text-emerald-600">{teamPerf.completionRate}%</p>
          <span className="mt-1 block text-[10px] font-semibold text-slate-400">Milestone Accuracy</span>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm hover:border-[#c96f4a]/30 transition">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Avg Document Speed</span>
          <p className="mt-2 text-3xl font-black text-[#c96f4a]">{docReports.avgProcessingTimeHours}h</p>
          <span className="mt-1 block text-[10px] font-semibold text-slate-400">Submission to Release</span>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm hover:border-[#274690]/30 transition">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">On-Time Velocity</span>
          <p className="mt-2 text-3xl font-black text-[#274690]">{teamPerf.onTimeDelivery}%</p>
          <span className="mt-1 block text-[10px] font-semibold text-slate-400">Deadline Compliance</span>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm hover:border-slate-300 transition">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Total Docs Handled</span>
          <p className="mt-2 text-3xl font-black text-slate-900">{docReports.total}</p>
          <span className="mt-1 block text-[10px] font-semibold text-slate-400">Active Files</span>
        </div>
      </div>

      {/* 3. EMPLOYEE THROUGHPUT BREAKDOWN TABLE */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-[#274690]">Associate Throughput & Performance Table</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-black uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Associate</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3 text-center">Assigned Tasks</th>
                <th className="px-4 py-3 text-center">Completed</th>
                <th className="px-4 py-3 text-center">Pending</th>
                <th className="px-4 py-3 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {teamPerf.employees?.map((emp: any, i: number) => (
                <tr key={i} className="hover:bg-[#274690]/5">
                  <td className="px-4 py-3 font-extrabold text-slate-900">{emp.name}</td>
                  <td className="px-4 py-3 text-slate-500">{emp.role}</td>
                  <td className="px-4 py-3 text-center font-bold">{emp.assigned}</td>
                  <td className="px-4 py-3 text-center text-emerald-600 font-bold">{emp.completed}</td>
                  <td className="px-4 py-3 text-center text-[#c96f4a] font-bold">{emp.pending}</td>
                  <td className="px-4 py-3 text-right">
                    <Badge className="bg-[#274690]/10 text-[#274690] font-black text-[10px]">{emp.score}%</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
