"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  CheckSquare,
  CheckCircle2,
  Clock,
  XCircle,
  UploadCloud,
  FilePlus,
  LayoutTemplate,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  AlertCircle,
  Calendar,
  Zap,
  Bot,
  ExternalLink,
  Shield,
  Activity,
  Layers,
  ArrowRight,
} from "lucide-react";
import { dashboardApi } from "@/services/dashboardApi";

export default function EmployeeDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [employeeName, setEmployeeName] = useState("Priya Sharma");

  useEffect(() => {
    // Sync current logged-in employee name
    try {
      const stored = localStorage.getItem("currentUser");
      if (stored) {
        const u = JSON.parse(stored);
        if (u.name || u.full_name) {
          setEmployeeName(u.name || u.full_name);
        }
      }
    } catch {}

    dashboardApi.getEmployeeDashboard().then((res) => {
      if (res?.data) {
        setData(res.data);
        if (res.data.employee?.name) {
          setEmployeeName(res.data.employee.name);
        }
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl bg-white/90 p-6 shadow-xl backdrop-blur-md border border-[#274690]/10">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#274690] border-t-transparent" />
          <span className="text-sm font-bold text-slate-700">Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const employee = data?.employee || {};
  const recentDocs = data?.recentDocuments || [];
  const activities = data?.recentActivity || [];
  const notifs = data?.notifications || [];

  // Scoped employee pending tasks
  const pendingTasksList = [
    {
      id: "task-201",
      title: "Verify Cloud Services Invoice #4890",
      assignedBy: "Ritika Sharma (Team Leader)",
      priority: "CRITICAL",
      dueDate: "Today, 5:00 PM",
      status: "IN_PROGRESS",
    },
    {
      id: "task-202",
      title: "Draft Q3 Vendor SLA Compliance Summary",
      assignedBy: "Vikram Malhotra (Dept Manager)",
      priority: "HIGH",
      dueDate: "Tomorrow, 2:00 PM",
      status: "PENDING",
    },
  ];

  // Scoped employee approval tracker
  const pendingApprovalsList = [
    {
      id: "appr-301",
      documentName: "PO-4890 Reconciliation & Vendor Invoice.pdf",
      currentApprover: "Ritika Sharma (Team Leader)",
      submittedAt: "25 mins ago",
      status: "PENDING",
    },
    {
      id: "appr-302",
      documentName: "Dell Equipment Requisition Request.pdf",
      currentApprover: "Ritika Sharma (Team Leader)",
      submittedAt: "Yesterday",
      status: "REJECTED",
      notes: "Tax exemption certificate missing",
    },
  ];

  const upcomingDeadlines = [
    {
      id: "dl-1",
      title: "PO-4890 Reconciliation Report",
      time: "In 4 hours",
      urgent: true,
      category: "Finance",
    },
    {
      id: "dl-2",
      title: "Q3 Compliance Checklist Review",
      time: "Tomorrow, 5:00 PM",
      urgent: false,
      category: "Operations",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Welcome Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[#274690]/20 bg-[linear-gradient(135deg,#0f172a_0%,#182747_50%,#274690_100%)] p-6 text-white shadow-xl">
        <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#c96f4a]/20 px-3 py-1 text-xs font-bold text-[#f3b092] border border-[#c96f4a]/30">
                Staff Workspace
              </span>
              <span className="text-xs font-medium text-slate-300">
                {employee.date || "August 20, 2026"}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
              Welcome back, {employeeName}! 👋
            </h1>
            <p className="mt-1 text-xs text-slate-300 sm:text-sm">
              Team: <span className="font-bold text-white">{employee.team || "Financial Operations"}</span> • Department:{" "}
              <span className="font-bold text-white">{employee.department || "Operations & Logistics"}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/employee/documents/create"
              className="flex items-center gap-2 rounded-2xl bg-[#c96f4a] px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#c96f4a]/30 transition hover:brightness-110 active:scale-95"
            >
              <FilePlus size={16} />
              <span>Create Document</span>
            </Link>
            <Link
              href="/employee/ai-tools"
              className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-md transition hover:bg-white/20 border border-white/10 active:scale-95"
            >
              <Sparkles size={16} className="text-[#f3b092]" />
              <span>Start AI Tool</span>
            </Link>
          </div>
        </div>

        {/* Decorative background glow accents */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-[#c96f4a]/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-1/3 h-40 w-40 rounded-full bg-[#274690]/40 blur-2xl" />
      </div>

      {/* 2. 5 Primary KPI Cards (Cohesive Theme: Sapphire Blue & Terracotta) */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {/* KPI 1: My Documents */}
        <Link
          href="/employee/documents"
          className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md transition hover:-translate-y-1 hover:shadow-md hover:border-[#274690]/50"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#274690]/10 text-[#274690]">
              <FileText size={19} />
            </div>
            <ArrowUpRight size={15} className="text-slate-400 opacity-0 transition group-hover:opacity-100 group-hover:text-[#274690]" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-slate-800">{stats.myDocuments || 14}</div>
            <div className="text-xs font-bold text-slate-500">My Documents</div>
          </div>
          <div className="mt-2 text-[11px] font-semibold text-slate-600">
            4 drafts active
          </div>
        </Link>

        {/* KPI 2: Pending Tasks */}
        <Link
          href="/employee/tasks?status=PENDING"
          className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md transition hover:-translate-y-1 hover:shadow-md hover:border-[#c96f4a]/50"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#c96f4a]/10 text-[#c96f4a]">
              <CheckSquare size={19} />
            </div>
            <ArrowUpRight size={15} className="text-slate-400 opacity-0 transition group-hover:opacity-100 group-hover:text-[#c96f4a]" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-slate-800">{stats.pendingTasks || 3}</div>
            <div className="text-xs font-bold text-slate-500">Pending Tasks</div>
          </div>
          <div className="mt-2 text-[11px] font-semibold text-slate-600">
            {stats.overdueTasks ? `${stats.overdueTasks} overdue` : "2 due today"}
          </div>
        </Link>

        {/* KPI 3: Pending Approvals */}
        <Link
          href="/employee/approvals?status=PENDING"
          className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md transition hover:-translate-y-1 hover:shadow-md hover:border-[#274690]/50"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#274690]/10 text-[#274690]">
              <Clock size={19} />
            </div>
            <ArrowUpRight size={15} className="text-slate-400 opacity-0 transition group-hover:opacity-100 group-hover:text-[#274690]" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-slate-800">{stats.pendingApprovals || 2}</div>
            <div className="text-xs font-bold text-slate-500">Pending Approvals</div>
          </div>
          <div className="mt-2 text-[11px] font-semibold text-slate-600">Under Review</div>
        </Link>

        {/* KPI 4: Completed Tasks */}
        <Link
          href="/employee/tasks?status=COMPLETED"
          className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md transition hover:-translate-y-1 hover:shadow-md hover:border-[#274690]/50"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <CheckCircle2 size={19} />
            </div>
            <ArrowUpRight size={15} className="text-slate-400 opacity-0 transition group-hover:opacity-100 group-hover:text-[#274690]" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-slate-800">{stats.completedTasks || 8}</div>
            <div className="text-xs font-bold text-slate-500">Completed Tasks</div>
          </div>
          <div className="mt-2 text-[11px] font-semibold text-slate-600">Delivered</div>
        </Link>

        {/* KPI 5: AI Credits / AI Usage */}
        <Link
          href="/employee/ai-tools"
          className="group relative col-span-2 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md transition hover:-translate-y-1 hover:shadow-md hover:border-[#c96f4a]/50 sm:col-span-1"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#c96f4a]/10 text-[#c96f4a]">
              <Bot size={19} />
            </div>
            <span className="rounded-full bg-[#c96f4a]/15 px-2 py-0.5 text-[10px] font-bold text-[#c96f4a]">
              380 Left
            </span>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-800">120</span>
              <span className="text-xs font-bold text-slate-400">/ 500 Used</span>
            </div>
            <div className="text-xs font-bold text-slate-500">AI Credits</div>
          </div>
          {/* Progress bar in brand terracotta */}
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-[#c96f4a]" style={{ width: "24%" }} />
          </div>
        </Link>
      </div>

      {/* 3. Quick Actions Bar (Cohesive Theme: Blue / Terracotta / Slate) */}
      <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-800">Quick Actions</h2>
          <span className="text-xs text-slate-400">Instant workflow shortcuts</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Link
            href="/employee/documents/create"
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 transition hover:bg-white hover:border-[#274690]/40 hover:shadow-sm"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#274690] text-white shadow-sm">
              <FilePlus size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-800 truncate">Create Document</div>
              <div className="text-[10px] text-slate-400">Editor</div>
            </div>
          </Link>

          <Link
            href="/employee/documents?action=upload"
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 transition hover:bg-white hover:border-[#c96f4a]/40 hover:shadow-sm"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#c96f4a] text-white shadow-sm">
              <UploadCloud size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-800 truncate">Upload Document</div>
              <div className="text-[10px] text-slate-400">PDF, Word, Excel</div>
            </div>
          </Link>

          <Link
            href="/employee/document-templates"
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 transition hover:bg-white hover:border-[#274690]/40 hover:shadow-sm"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#274690] text-white shadow-sm">
              <LayoutTemplate size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-800 truncate">Use Template</div>
              <div className="text-[10px] text-slate-400">Library</div>
            </div>
          </Link>

          <Link
            href="/employee/ai-tools"
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 transition hover:bg-white hover:border-[#c96f4a]/40 hover:shadow-sm"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#c96f4a] text-white shadow-sm">
              <Sparkles size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-800 truncate">Start AI Tool</div>
              <div className="text-[10px] text-slate-400">OCR & Analysis</div>
            </div>
          </Link>

          <Link
            href="/employee/tasks"
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 transition hover:bg-white hover:border-slate-400 hover:shadow-sm"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#182747] text-white shadow-sm">
              <CheckSquare size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-800 truncate">View My Tasks</div>
              <div className="text-[10px] text-slate-400">Workload</div>
            </div>
          </Link>
        </div>
      </div>

      {/* 4. Main Widgets Grid: 2 Columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column (2 Cols): Recent Documents & My Pending Tasks */}
        <div className="space-y-6 lg:col-span-2">
          {/* Widget 1: Recent Documents */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Recent Documents</h3>
                <p className="text-[11px] text-slate-500">Your documents modified recently</p>
              </div>
              <Link
                href="/employee/documents"
                className="flex items-center gap-1 text-xs font-bold text-[#274690] hover:underline"
              >
                <span>View All ({stats.myDocuments || 14})</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            <div className="mt-3 divide-y divide-slate-100">
              {recentDocs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No documents found.</div>
              ) : (
                recentDocs.slice(0, 4).map((doc: any) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between py-3 transition hover:bg-slate-50/60 rounded-xl px-2"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#274690]/10 text-[#274690]">
                        <FileText size={17} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-bold text-slate-800">{doc.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {doc.category} • {doc.sizeFormatted || "2.4 MB"} • {doc.version || "v1.0"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                          doc.status === "Approved"
                            ? "bg-slate-100 text-slate-700 border-slate-300"
                            : doc.status === "Pending Approval"
                            ? "bg-[#274690]/10 text-[#274690] border-[#274690]/20"
                            : doc.status === "Rejected"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {doc.status}
                      </span>
                      <Link
                        href={`/employee/documents`}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <ChevronRight size={16} />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Widget 2: My Pending Tasks */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">My Pending Tasks</h3>
                <p className="text-[11px] text-slate-500">Assigned directives from Team Leader</p>
              </div>
              <Link
                href="/employee/tasks"
                className="flex items-center gap-1 text-xs font-bold text-[#c96f4a] hover:underline"
              >
                <span>All Tasks ({stats.pendingTasks || 3})</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            <div className="mt-3 space-y-2.5">
              {pendingTasksList.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 p-3 text-xs transition hover:bg-white hover:shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#c96f4a]/10 text-[#c96f4a]">
                      <CheckSquare size={17} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-800 truncate">{task.title}</div>
                      <div className="text-[10px] text-slate-400">
                        Assigned by {task.assignedBy} • Due {task.dueDate}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold border ${
                        task.priority === "CRITICAL"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-[#c96f4a]/10 text-[#c96f4a] border-[#c96f4a]/20"
                      }`}
                    >
                      {task.priority}
                    </span>
                    <Link
                      href="/employee/tasks"
                      className="rounded-xl bg-[#274690] px-2.5 py-1 text-[10px] font-bold text-white shadow-sm hover:brightness-110"
                    >
                      Action
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Widget 3: My Pending Approvals */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">My Pending Approvals</h3>
                <p className="text-[11px] text-slate-500">Submissions awaiting manager review</p>
              </div>
              <Link
                href="/employee/approvals"
                className="flex items-center gap-1 text-xs font-bold text-[#274690] hover:underline"
              >
                <span>Track Approvals</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            <div className="mt-3 space-y-2.5">
              {pendingApprovalsList.map((appr) => (
                <div
                  key={appr.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 p-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#274690]/10 text-[#274690]">
                      <Clock size={17} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-800 truncate">{appr.documentName}</div>
                      <div className="text-[10px] text-slate-400">
                        Reviewer: {appr.currentApprover} • {appr.submittedAt}
                      </div>
                      {appr.notes && (
                        <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
                          Note: {appr.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold border ${
                        appr.status === "PENDING"
                          ? "bg-[#274690]/10 text-[#274690] border-[#274690]/20"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      {appr.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Deadlines, AI Usage & Recent Activity */}
        <div className="space-y-6">
          {/* Widget 4: Upcoming Deadlines */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-[#c96f4a]" />
                <h3 className="text-sm font-bold text-slate-800">Upcoming Deadlines</h3>
              </div>
              <span className="rounded-full bg-[#c96f4a]/10 px-2 py-0.5 text-[10px] font-bold text-[#c96f4a]">
                2 Urgent
              </span>
            </div>

            <div className="mt-3 space-y-2.5">
              {upcomingDeadlines.map((dl) => (
                <div
                  key={dl.id}
                  className={`flex items-center justify-between rounded-2xl border p-3 text-xs ${
                    dl.urgent ? "border-amber-200 bg-amber-50/40" : "border-slate-100 bg-slate-50/60"
                  }`}
                >
                  <div>
                    <div className="font-bold text-slate-800">{dl.title}</div>
                    <div className="text-[10px] text-slate-400">{dl.category}</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-black ${dl.urgent ? "text-amber-700" : "text-slate-600"}`}>
                      {dl.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Widget 5: AI Credit Usage Telemetry */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Bot size={16} className="text-[#274690]" />
                <h3 className="text-sm font-bold text-slate-800">AI Credits Breakdown</h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400">Monthly Quota</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">OCR Text Extractions</span>
                <span className="font-bold text-slate-700">54 / 200</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-[#274690]" style={{ width: "27%" }} />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500">Summaries & Q&A</span>
                <span className="font-bold text-slate-700">42 / 200</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-[#c96f4a]" style={{ width: "21%" }} />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500">Translations & Rewrites</span>
                <span className="font-bold text-slate-700">24 / 100</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-[#182747]" style={{ width: "24%" }} />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">Total Credits Left</span>
              <span className="font-black text-[#274690]">380 Units</span>
            </div>
          </div>

          {/* Widget 6: Recent Activity Feed */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">Recent Activity</h3>
              <Activity size={15} className="text-slate-400" />
            </div>

            <div className="mt-3 space-y-3">
              {activities.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400">No recent activity.</div>
              ) : (
                activities.slice(0, 4).map((act: any) => (
                  <div key={act.id} className="flex items-start gap-2.5 text-xs">
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#274690]" />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-700">{act.action}</div>
                      <div className="text-[10px] text-slate-400">{act.time}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Widget 7: Notifications Mini-Feed */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
              <Link
                href="/employee/notifications"
                className="text-[11px] font-bold text-[#274690] hover:underline"
              >
                View Center
              </Link>
            </div>

            <div className="mt-3 space-y-2.5">
              {notifs.slice(0, 3).map((n: any) => (
                <div
                  key={n.id}
                  className={`rounded-2xl border p-2.5 text-xs ${
                    n.unread ? "border-blue-100 bg-[#274690]/5" : "border-slate-100 bg-slate-50/50"
                  }`}
                >
                  <div className="font-bold text-slate-800">{n.title}</div>
                  <div className="text-[10px] text-slate-500 line-clamp-1">{n.description}</div>
                  <div className="mt-1 text-[9px] text-slate-400">{n.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
