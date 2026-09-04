"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  UserCheck,
  FileText,
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Search,
  Bell,
  Sparkles,
  Plus,
  RefreshCw,
  ExternalLink,
  Shield,
  Layers,
  X,
  Mail,
  Send,
  Upload,
  Calendar,
  GitFork,
  Check,
  ChevronRight,
  BarChart3,
  PieChart as PieIcon,
  Activity,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { dashboardApi } from "@/services/dashboardApi";
import { tasksApi } from "@/services/tasksApi";

const defaultTeamMembers = [
  { id: "emp-101", name: "Aakash Verma", email: "aakash.v@docucore.ai", role: "Senior Operations Analyst", tasks: 8, score: 96 },
  { id: "emp-102", name: "Priya Sharma", email: "priya.s@docucore.ai", role: "Legal Compliance Associate", tasks: 6, score: 92 },
  { id: "emp-103", name: "Rohan Das", email: "rohan.d@docucore.ai", role: "Financial Document Specialist", tasks: 10, score: 95 },
  { id: "emp-104", name: "Neha Kapoor", email: "neha.k@docucore.ai", role: "Operations Executive", tasks: 5, score: 89 },
  { id: "emp-105", name: "Vikram Mehta", email: "vikram.m@docucore.ai", role: "Tax & Compliance Auditor", tasks: 7, score: 94 },
  { id: "emp-106", name: "Ananya Roy", email: "ananya.r@docucore.ai", role: "Junior Analyst", tasks: 4, score: 91 },
];

export default function TeamLeaderDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successToast, setSuccessToast] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Assign Task Modal State
  const [isAssignTaskOpen, setIsAssignTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskAssigneeId, setTaskAssigneeId] = useState("emp-101");
  const [taskEmployeeName, setTaskEmployeeName] = useState("Aakash Verma");
  const [taskEmployeeEmail, setTaskEmployeeEmail] = useState("aakash.v@docucore.ai");
  const [sendEmailInvite, setSendEmailInvite] = useState(true);
  const [taskPriority, setTaskPriority] = useState("NORMAL");
  const [taskDue, setTaskDue] = useState("");

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 4000);
  };

  const fetchDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await dashboardApi.getTeamLeaderDashboard();
      if (res?.data) {
        setData(res.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Team Leader dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDashboard();
  }, []);

  const handleMemberSelect = (empId: string) => {
    setTaskAssigneeId(empId);
    if (empId === "custom") {
      setTaskEmployeeName("");
      setTaskEmployeeEmail("");
    } else {
      const found = defaultTeamMembers.find((m) => m.id === empId);
      if (found) {
        setTaskEmployeeName(found.name);
        setTaskEmployeeEmail(found.email);
      }
    }
  };

  const handleQuickAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    try {
      const res = await tasksApi.createTask({
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        assignToId: taskAssigneeId,
        employeeName: taskEmployeeName.trim() || "Team Associate",
        employeeEmail: taskEmployeeEmail.trim() || undefined,
        sendEmail: sendEmailInvite,
        priority: taskPriority,
        dueDate: taskDue || new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0],
      });
      showToast(res?.message || `Task assigned to ${taskEmployeeName || "Associate"} successfully!`);
      setIsAssignTaskOpen(false);
      setTaskTitle("");
      setTaskDesc("");
      void fetchDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task.");
    }
  };

  // Weekly Task Throughput Data for Graph
  const weeklyTaskData = [
    { day: "Mon", completed: 8, pending: 2, height: 60 },
    { day: "Tue", completed: 12, pending: 3, height: 85 },
    { day: "Wed", completed: 10, pending: 1, height: 72 },
    { day: "Thu", completed: 15, pending: 4, height: 95 },
    { day: "Fri", completed: 11, pending: 2, height: 78 },
    { day: "Sat", completed: 5, pending: 0, height: 35 },
  ];

  // Document status totals
  const docStats = {
    total: 48,
    approved: 34,
    review: 6,
    draft: 6,
    rejected: 2,
  };

  const upcomingDeadlines = [
    { id: "dl-1", task: "Review Master Service Agreement v2.1", employee: "Priya Sharma", due: "Today, 5:00 PM", priority: "CRITICAL" },
    { id: "dl-2", task: "Cloud Server Compute Line Item Audit", employee: "Rohan Das", due: "Tomorrow, 12:00 PM", priority: "HIGH" },
    { id: "dl-3", task: "Statutory Tax Filing Cross-Verification", employee: "Vikram Mehta", due: "Aug 21, 2026", priority: "NORMAL" },
    { id: "dl-4", task: "Mutual NDA Clause Verification", employee: "Neha Kapoor", due: "Aug 22, 2026", priority: "NORMAL" },
  ];

  const activities = [
    { id: "act-1", title: "Document Uploaded", text: "Priya Sharma uploaded MSA_Amendment_v2.pdf", time: "10m ago" },
    { id: "act-2", title: "Task Completed", text: "Rohan Das finished Cloud Services Invoice Verification", time: "45m ago" },
    { id: "act-3", title: "Approval Submitted", text: "Dell Server PO-9921 submitted for sign-off", time: "2h ago" },
    { id: "act-4", title: "Workflow Progressed", text: "Fast-Track Requisition passed to Step 2", time: "3h ago" },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-20 font-sans text-slate-800">
      {/* 1. TOP HEADER (Welcome, Search, Notifications, Profile) */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#274690]/15 bg-white px-5 py-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black tracking-tight text-[#274690] sm:text-2xl">
              Welcome, Team Leader
            </h1>
            <Badge className="bg-[#c96f4a]/10 text-[#c96f4a] border-[#c96f4a]/30 text-[11px] font-black px-2.5 py-0.5">
              Financial Operations
            </Badge>
          </div>
          <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
            Operational Dashboard • Tuesday, Aug 18, 2026
          </p>
        </div>

        {/* Right Controls: Search, Notification Bell, Profile */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks, docs..."
              className="pl-8 h-8 w-44 sm:w-56 rounded-xl text-xs font-semibold focus:border-[#274690]"
            />
          </div>

          <Link href="/team-leader/notifications">
            <button
              type="button"
              className="relative flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs hover:border-[#274690]/40 transition"
              title="Notifications"
            >
              <Bell size={14} />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#c96f4a] text-[8px] font-black text-white">
                4
              </span>
            </button>
          </Link>

          <Link href="/team-leader/profile">
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 cursor-pointer">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#274690] text-xs font-black text-white shadow-xs">
                TL
              </div>
              <span className="hidden sm:inline text-xs font-black text-slate-800">Profile</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Alerts */}
      {successToast && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800 shadow-xs animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-800 shadow-xs animate-in fade-in">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. TOP METRICS SUMMARY BAR (Compact & Integrated) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs">
          <span className="text-[10px] font-black uppercase text-slate-400">Team Members</span>
          <p className="text-xl font-black text-[#274690] mt-0.5">12</p>
          <span className="text-[10px] text-slate-500 font-semibold">11 Online</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs">
          <span className="text-[10px] font-black uppercase text-slate-400">Total Docs</span>
          <p className="text-xl font-black text-[#274690] mt-0.5">48</p>
          <span className="text-[10px] text-slate-500 font-semibold">Active Pool</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs">
          <span className="text-[10px] font-black uppercase text-slate-400">Pending Tasks</span>
          <p className="text-xl font-black text-[#274690] mt-0.5">8</p>
          <span className="text-[10px] text-[#c96f4a] font-bold">In Queue</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs">
          <span className="text-[10px] font-black uppercase text-slate-400">Overdue Tasks</span>
          <p className="text-xl font-black text-[#274690] mt-0.5">3</p>
          <span className="text-[10px] text-rose-600 font-bold">Past SLA</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs">
          <span className="text-[10px] font-black uppercase text-slate-400">Approvals</span>
          <p className="text-xl font-black text-[#274690] mt-0.5">4</p>
          <span className="text-[10px] text-slate-500 font-semibold">Need Sign-off</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs">
          <span className="text-[10px] font-black uppercase text-slate-400">Workflows</span>
          <p className="text-xl font-black text-[#274690] mt-0.5">7</p>
          <span className="text-[10px] text-slate-500 font-semibold">In Progress</span>
        </div>
      </div>

      {/* 3. VISUAL ANALYTICS SECTION: WEEKLY VELOCITY GRAPH + DOCUMENT DISTRIBUTION CHART */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left (7 cols): Weekly Task Velocity Bar Graph */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-[#274690] flex items-center gap-1.5">
                <BarChart3 size={16} className="text-[#c96f4a]" /> Weekly Task Velocity & Throughput
              </h3>
              <p className="text-[11px] font-semibold text-slate-400">Completed vs Pending Tasks (Last 6 Days)</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold">
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-[#274690]" /> Completed</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-[#c96f4a]" /> Pending</span>
            </div>
          </div>

          {/* SVG Visual Bar Chart */}
          <div className="pt-2">
            <div className="flex items-end justify-between h-44 gap-3 px-2 border-b border-slate-100 pb-2">
              {weeklyTaskData.map((bar, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <div className="w-full flex items-end justify-center gap-1 h-full">
                    {/* Completed Bar */}
                    <div
                      style={{ height: `${bar.height}%` }}
                      className="w-full max-w-[20px] rounded-t-md bg-gradient-to-t from-[#1f3561] to-[#274690] transition-all duration-300 group-hover:opacity-90 relative"
                    >
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-black text-[#274690] opacity-0 group-hover:opacity-100 transition">
                        {bar.completed}
                      </span>
                    </div>

                    {/* Pending Bar */}
                    <div
                      style={{ height: `${Math.max(bar.pending * 12, 10)}%` }}
                      className="w-full max-w-[12px] rounded-t-md bg-[#c96f4a] transition-all duration-300 opacity-85 group-hover:opacity-100 relative"
                    >
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-black text-[#c96f4a] opacity-0 group-hover:opacity-100 transition">
                        {bar.pending}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold text-slate-500">{bar.day}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pt-3">
              <span>Weekly Completion Target: <strong className="text-[#274690]">94.5% SLA</strong></span>
              <span className="text-emerald-700 font-extrabold">↑ 12% vs last week</span>
            </div>
          </div>
        </div>

        {/* Right (5 cols): Document Status Distribution Chart & Gauges */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-[#274690] flex items-center gap-1.5">
                <PieIcon size={16} className="text-[#c96f4a]" /> Document Status Analytics
              </h3>
              <p className="text-[11px] font-semibold text-slate-400">Distribution across 48 active files</p>
            </div>
            <span className="text-xs font-black text-[#274690]">{docStats.total} Total</span>
          </div>

          {/* Distribution Progress Bars & Status Breakdown */}
          <div className="space-y-3 pt-1">
            {/* Multi-segment Bar */}
            <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden flex">
              <div style={{ width: `${(docStats.approved / docStats.total) * 100}%` }} className="bg-[#274690]" title="Approved" />
              <div style={{ width: `${(docStats.review / docStats.total) * 100}%` }} className="bg-[#c96f4a]" title="Review" />
              <div style={{ width: `${(docStats.draft / docStats.total) * 100}%` }} className="bg-slate-400" title="Draft" />
              <div style={{ width: `${(docStats.rejected / docStats.total) * 100}%` }} className="bg-rose-500" title="Rejected" />
            </div>

            {/* Status Breakdown Grid */}
            <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#274690]" />
                  <span className="font-bold text-slate-700">Approved</span>
                </div>
                <strong className="text-[#274690] font-black">{docStats.approved} ({Math.round((docStats.approved / docStats.total) * 100)}%)</strong>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#c96f4a]" />
                  <span className="font-bold text-slate-700">Under Review</span>
                </div>
                <strong className="text-[#c96f4a] font-black">{docStats.review} ({Math.round((docStats.review / docStats.total) * 100)}%)</strong>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-slate-400" />
                  <span className="font-bold text-slate-700">Draft</span>
                </div>
                <strong className="text-slate-700 font-black">{docStats.draft}</strong>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  <span className="font-bold text-slate-700">Rejected</span>
                </div>
                <strong className="text-rose-600 font-black">{docStats.rejected}</strong>
              </div>
            </div>

            <div className="pt-2">
              <Link href="/team-leader/documents">
                <Button size="sm" variant="outline" className="w-full h-8 text-xs font-bold text-[#274690] border-[#274690]/30 hover:bg-[#274690]/5">
                  Inspect All Documents in Document Center →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 4. WORKFLOW PIPELINE PROGRESS STEPPER + PENDING ACTION TILES */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Left: Workflow Execution Pipeline */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-sm font-black text-[#274690] flex items-center gap-1.5">
              <GitFork size={15} className="text-[#c96f4a]" /> Active Workflow Pipeline
            </h3>
            <Link href="/team-leader/workflow" className="text-[11px] font-bold text-[#274690] hover:underline">
              View All 7 →
            </Link>
          </div>

          <div className="space-y-2.5 pt-1">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-black text-slate-900">Employee Onboarding ID Proof</span>
                <Badge className="bg-[#c96f4a]/10 text-[#c96f4a] border-[#c96f4a]/20 text-[9px] font-black">Step 2: Team Lead</Badge>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full bg-[#274690] w-[50%]" />
              </div>
              <p className="text-[10px] text-slate-500 font-semibold">Assigned: Rahul Sharma • Due: Aug 20</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-black text-slate-900">Invoice Fast-Track Batch #4890</span>
                <Badge className="bg-[#274690]/10 text-[#274690] text-[9px] font-black">Step 2: Amount Audit</Badge>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full bg-[#274690] w-[66%]" />
              </div>
              <p className="text-[10px] text-slate-500 font-semibold">Assigned: Rahul Sharma • Due: Aug 19</p>
            </div>
          </div>
        </div>

        {/* Right: Team Performance & SLA Meters */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-sm font-black text-[#274690] flex items-center gap-1.5">
              <TrendingUp size={15} className="text-[#c96f4a]" /> Team Performance Metrics
            </h3>
            <span className="text-[11px] font-bold text-slate-400">Target: 95%</span>
          </div>

          <div className="space-y-3 pt-1">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Task SLA Completion Rate</span>
                <span className="text-[#274690]">94.5%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#274690] to-[#c96f4a] w-[94.5%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Average Task Processing Time</span>
                <span className="text-[#274690]">3.2 hrs</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-[#274690] w-[80%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Document Approval Velocity</span>
                <span className="text-[#274690]">1.8 hrs avg</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-emerald-600 w-[90%]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. ROW 3 SPLIT: UPCOMING DEADLINES & RECENT TEAM ACTIVITY */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Upcoming Deadlines */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-sm font-black text-[#274690]">Upcoming Deadlines</h3>
            <Link href="/team-leader/tasks" className="text-[11px] font-bold text-[#274690] hover:underline">
              All Tasks →
            </Link>
          </div>

          <div className="space-y-2">
            {upcomingDeadlines.map((dl) => (
              <div key={dl.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/60 border border-slate-100 text-xs">
                <div className="min-w-0 flex-1 pr-2">
                  <p className="font-extrabold text-slate-900 truncate">{dl.task}</p>
                  <p className="text-[10px] text-slate-400 font-bold">{dl.employee}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[11px] font-bold text-[#274690] block">{dl.due}</span>
                  <span className="text-[9px] font-black text-slate-400 uppercase">{dl.priority}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Team Activity */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-sm font-black text-[#274690]">Recent Team Activity</h3>
            <Link href="/team-leader/notifications" className="text-[11px] font-bold text-[#274690] hover:underline">
              Activity Stream →
            </Link>
          </div>

          <div className="space-y-2.5">
            {activities.map((act) => (
              <div key={act.id} className="flex items-start gap-2.5 text-xs">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#274690]/10 text-[#274690] shrink-0 font-bold text-[10px] mt-0.5">
                  ✓
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-slate-900 truncate">{act.title}</p>
                    <span className="text-[10px] text-slate-400">{act.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">{act.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. TEAM ASSOCIATE THROUGHPUT MINI-ROSTER */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div>
            <h3 className="text-sm font-black text-[#274690]">Team Associate Efficiency Roster</h3>
            <p className="text-[11px] font-semibold text-slate-400">Individual task loads and accuracy scores</p>
          </div>
          <Link href="/team-leader/my-team">
            <Button size="sm" variant="outline" className="h-7 text-[11px] font-bold rounded-lg border-[#274690]/30 text-[#274690]">
              Full Team Directory →
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {defaultTeamMembers.map((m) => (
            <div key={m.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-center">
              <div className="flex h-8 w-8 mx-auto items-center justify-center rounded-full bg-[#274690]/10 text-xs font-black text-[#274690]">
                {(m.name || "M").charAt(0)}
              </div>
              <p className="text-xs font-black text-slate-900 truncate">{m.name}</p>
              <p className="text-[10px] text-slate-400 font-semibold truncate">{m.role}</p>
              <Badge className="bg-[#274690]/10 text-[#274690] text-[9px] font-black">
                {m.score}% SLA
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* 7. QUICK ACTIONS BAR (+ Task | Upload | Approvals | Workflow | My Team) */}
      <div className="rounded-2xl border border-[#274690]/20 bg-white p-4 shadow-xs space-y-2.5">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Quick Actions Hub</h3>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsAssignTaskOpen(true)}
            className="h-9 rounded-xl bg-[#274690] px-4 text-xs font-black text-white hover:bg-[#1f3561] shadow-xs gap-1.5"
          >
            <Plus size={14} /> Create Task
          </Button>

          <Link href="/team-leader/documents">
            <Button size="sm" variant="outline" className="h-9 rounded-xl border-slate-200 text-xs font-bold text-slate-700 hover:border-[#274690]/40 hover:text-[#274690] gap-1.5">
              <Upload size={14} className="text-[#274690]" /> Upload Document
            </Button>
          </Link>

          <Link href="/team-leader/approvals">
            <Button size="sm" variant="outline" className="h-9 rounded-xl border-slate-200 text-xs font-bold text-slate-700 hover:border-[#274690]/40 hover:text-[#274690] gap-1.5">
              <Clock size={14} className="text-[#274690]" /> Approvals
            </Button>
          </Link>

          <Link href="/team-leader/workflow">
            <Button size="sm" variant="outline" className="h-9 rounded-xl border-slate-200 text-xs font-bold text-slate-700 hover:border-[#274690]/40 hover:text-[#274690] gap-1.5">
              <GitFork size={14} className="text-[#274690]" /> Workflow
            </Button>
          </Link>

          <Link href="/team-leader/my-team">
            <Button size="sm" variant="outline" className="h-9 rounded-xl border-slate-200 text-xs font-bold text-slate-700 hover:border-[#274690]/40 hover:text-[#274690] gap-1.5">
              <Users size={14} className="text-[#274690]" /> My Team
            </Button>
          </Link>
        </div>
      </div>

      {/* QUICK ASSIGN TASK MODAL WITH EMPLOYEE NAME, GMAIL & DIRECT LOGIN ACCESS LINK */}
      {isAssignTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-[#274690]/20 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-[#274690] flex items-center gap-2">
                <CheckSquare size={18} className="text-[#c96f4a]" /> Assign Work to Employee
              </h3>
              <button type="button" onClick={() => setIsAssignTaskOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleQuickAssignTask} className="space-y-3.5">
              {/* Employee Selection */}
              <div>
                <label className="text-[11px] font-black uppercase text-slate-600">Select Team Member / Custom Employee *</label>
                <select
                  value={taskAssigneeId}
                  onChange={(e) => handleMemberSelect(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 focus:border-[#274690]"
                >
                  {defaultTeamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role}) — {m.email}
                    </option>
                  ))}
                  <option value="custom">+ Enter Custom Employee / Gmail...</option>
                </select>
              </div>

              {/* Editable Employee Name & Gmail */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-600">Employee Name *</label>
                  <Input
                    required
                    value={taskEmployeeName}
                    onChange={(e) => setTaskEmployeeName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="mt-1 h-10 rounded-xl text-xs font-semibold focus:border-[#274690]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-600">Employee Gmail / Email *</label>
                  <Input
                    type="email"
                    required
                    value={taskEmployeeEmail}
                    onChange={(e) => setTaskEmployeeEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="mt-1 h-10 rounded-xl text-xs font-semibold focus:border-[#274690]"
                  />
                </div>
              </div>

              {/* Task Title */}
              <div>
                <label className="text-[11px] font-black uppercase text-slate-600">Task Title *</label>
                <Input
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Audit Q3 Vendor Invoices & GL Reconciliation"
                  className="mt-1 h-10 rounded-xl text-xs font-semibold focus:border-[#274690]"
                />
              </div>

              {/* Instructions */}
              <div>
                <label className="text-[11px] font-black uppercase text-slate-600">Instructions / Description</label>
                <textarea
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Specific guidelines or document links for the associate..."
                  className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-xs font-semibold focus:border-[#274690] focus:outline-none"
                  rows={3}
                />
              </div>

              {/* Priority & Due Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-600">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High Priority</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-600">Due Date</label>
                  <Input
                    type="date"
                    value={taskDue}
                    onChange={(e) => setTaskDue(e.target.value)}
                    className="mt-1 h-10 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Send Gmail Notification Option */}
              <div className="rounded-2xl bg-[#274690]/5 border border-[#274690]/15 p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Mail size={16} className="text-[#274690]" />
                  <div>
                    <p className="text-xs font-black text-slate-900">Send Email with Login Link</p>
                    <p className="text-[10px] text-slate-500 font-semibold">
                      Employee receives task notification & direct login link on their Gmail.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={sendEmailInvite}
                  onChange={(e) => setSendEmailInvite(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#274690] focus:ring-[#274690]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsAssignTaskOpen(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button size="sm" type="submit" className="rounded-xl bg-[#274690] text-xs font-black text-white hover:bg-[#1f3561] gap-1.5">
                  <Send size={13} /> Assign & Send Email
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
