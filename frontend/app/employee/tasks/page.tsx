"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  CheckSquare,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  MessageSquare,
  Send,
  ExternalLink,
  ChevronRight,
  X,
  FileText,
  UserCheck,
  Calendar,
  AlertTriangle,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  Download,
  UploadCloud,
  CornerDownRight,
  History,
  ShieldAlert,
  ArrowUpRight,
  SlidersHorizontal,
  Eye,
  Check,
  RefreshCw,
  Info,
  Lock,
} from "lucide-react";
import { tasksApi } from "@/services/tasksApi";

interface TaskAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedAt: string;
}

interface TaskCommentReply {
  id: string;
  user: string;
  role: string;
  text: string;
  time: string;
}

interface TaskComment {
  id: string;
  user: string;
  role: string;
  text: string;
  time: string;
  replies?: TaskCommentReply[];
}

interface TaskActivity {
  id: string;
  action: string;
  user: string;
  time: string;
  details: string;
}

interface TaskItem {
  id: string;
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  dueDate: string;
  createdDate: string;
  assignedBy: string;
  assignedByRole?: string;
  relatedDocId?: string | null;
  relatedDocName?: string | null;
  instructions?: string;
  comments: TaskComment[];
  attachments: TaskAttachment[];
  activity?: TaskActivity[];
}

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [stats, setStats] = useState({
    total: 12,
    pending: 4,
    inProgress: 3,
    completed: 4,
    overdue: 1,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"list" | "table">("list");

  // Active Task Detail Drawer / Modal
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "comments" | "attachments" | "activity">("details");

  // Comment & Reply State
  const [newComment, setNewComment] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  // Complete Task with Deliverable Modal
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [completionComment, setCompletionComment] = useState("");
  const [completionFiles, setCompletionFiles] = useState<File[]>([]);
  const [submittingComplete, setSubmittingComplete] = useState(false);

  // Document Viewer Preview Modal
  const [previewDoc, setPreviewDoc] = useState<{ name: string; id?: string } | null>(null);

  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const completionFileInputRef = useRef<HTMLInputElement>(null);

  // Toast Alert
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "warning" } | null>(null);

  const showToast = (message: string, type: "success" | "info" | "warning" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await tasksApi.getTasks({
        status: statusFilter,
        priority: priorityFilter,
        search,
      });
      if (res?.data) {
        setTasks(res.data.tasks || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
        // Refresh selected task if open
        if (selectedTask) {
          const found = res.data.tasks?.find((t: TaskItem) => t.id === selectedTask.id);
          if (found) setSelectedTask(found);
        }
      }
    } catch (err: any) {
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, priorityFilter, search]);

  // Deadline & Remaining Time Calculator
  const getDeadlineInfo = (dueDateStr: string, status: string) => {
    if (!dueDateStr) return { label: "No Deadline", isOverdue: false, urgency: "normal" };

    const todayStr = "2026-08-20";
    const today = new Date(todayStr);
    const due = new Date(dueDateStr);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (status === "COMPLETED") {
      return { label: "Completed", isOverdue: false, urgency: "completed" };
    }

    if (diffDays < 0) {
      const overdueDays = Math.abs(diffDays);
      return {
        label: `Overdue by ${overdueDays} day${overdueDays > 1 ? "s" : ""}`,
        isOverdue: true,
        urgency: "critical",
      };
    } else if (diffDays === 0) {
      return { label: "Due Today (5:00 PM)", isOverdue: false, urgency: "warning" };
    } else if (diffDays === 1) {
      return { label: "Due Tomorrow", isOverdue: false, urgency: "warning" };
    } else {
      return { label: `${diffDays} days left`, isOverdue: false, urgency: "normal" };
    }
  };

  // Status Change Handler
  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    if (newStatus === "COMPLETED") {
      // Open completion dialog to allow attaching proof & remark
      setCompleteModalOpen(true);
      return;
    }

    try {
      await tasksApi.updateTaskStatus(taskId, newStatus);
      showToast(`Task status updated to ${newStatus.replace("_", " ")}`);
      fetchTasks();
    } catch (err: any) {
      showToast(err.message || "Failed to update status", "warning");
    }
  };

  // Submit Completed Task with Proof
  const handleConfirmCompletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    setSubmittingComplete(true);
    try {
      const uploadedAttachments = completionFiles.map((file) => ({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        type: file.name.split(".").pop()?.toUpperCase() || "FILE",
      }));

      await tasksApi.updateTaskStatus(selectedTask.id, "COMPLETED", {
        comment: completionComment.trim() || "Marked as completed with submitted deliverables.",
        attachments: uploadedAttachments,
      });

      showToast("Task successfully marked as Completed! Deliverable recorded.", "success");
      setCompleteModalOpen(false);
      setCompletionComment("");
      setCompletionFiles([]);
      fetchTasks();
    } catch (err: any) {
      showToast(err.message || "Failed to submit completion", "warning");
    } finally {
      setSubmittingComplete(false);
    }
  };

  // Add Comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !newComment.trim()) return;

    try {
      await tasksApi.addTaskComment(selectedTask.id, { text: newComment.trim() });
      setNewComment("");
      showToast("Comment posted to task conversation.");
      fetchTasks();
    } catch (err: any) {
      showToast("Failed to post comment", "warning");
    }
  };

  // Reply to Comment
  const handleAddReply = async (commentId: string) => {
    if (!selectedTask || !replyText.trim()) return;

    try {
      await tasksApi.addTaskComment(selectedTask.id, {
        text: replyText.trim(),
        replyToId: commentId,
      });
      setReplyText("");
      setReplyingToId(null);
      showToast("Reply posted successfully!");
      fetchTasks();
    } catch (err: any) {
      showToast("Failed to reply", "warning");
    }
  };

  // Attach File to Task
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedTask || !e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const newAtt = {
      name: file.name,
      size: `${(file.size / (1024 * 1024) > 0.1 ? (file.size / (1024 * 1024)).toFixed(1) + " MB" : (file.size / 1024).toFixed(0) + " KB")}`,
      type: file.name.split(".").pop()?.toUpperCase() || "FILE",
    };

    try {
      await tasksApi.addTaskAttachment(selectedTask.id, newAtt);
      showToast(`Attached file: ${file.name}`);
      fetchTasks();
    } catch (err: any) {
      showToast("Failed to upload attachment", "warning");
    }
  };

  // Helper for File Type Icons
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return <FileText className="text-rose-600" size={18} />;
    if (["xlsx", "xls", "csv"].includes(ext || "")) return <FileSpreadsheet className="text-emerald-600" size={18} />;
    if (["docx", "doc"].includes(ext || "")) return <FileCode className="text-blue-600" size={18} />;
    if (["png", "jpg", "jpeg", "svg"].includes(ext || "")) return <ImageIcon className="text-purple-600" size={18} />;
    return <Paperclip className="text-slate-500" size={18} />;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ─── Top Header Section ─── */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-[#274690] border border-blue-200">
              Employee Workspace
            </span>
            <span className="text-xs text-slate-400">Assigned Operational Workload</span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-800 sm:text-3xl">My Tasks</h1>
          <p className="mt-1 text-xs text-slate-500 max-w-2xl">
            Manage your daily tasks, collaborate with Team Leads & Managers, review connected documents, and submit deliverable proofs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTasks}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-[#274690]"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-[#274690]" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ─── Toast Alert ─── */}
      {toast && (
        <div
          className={`flex items-center gap-2.5 rounded-2xl border p-4 text-xs font-bold shadow-md transition-all animate-in fade-in slide-in-from-top-2 ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50/90 text-emerald-800"
              : toast.type === "warning"
              ? "border-amber-200 bg-amber-50/90 text-amber-800"
              : "border-blue-200 bg-blue-50/90 text-blue-800"
          }`}
        >
          {toast.type === "success" && <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />}
          {toast.type === "warning" && <AlertTriangle size={18} className="text-amber-600 shrink-0" />}
          {toast.type === "info" && <Info size={18} className="text-blue-600 shrink-0" />}
          <span className="flex-1">{toast.message}</span>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ─── 1. Task Overview Summary Cards (All, Pending, In Progress, Completed, Overdue) ─── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {/* All Tasks */}
        <button
          onClick={() => setStatusFilter("ALL")}
          className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border p-4 text-left transition-all duration-200 hover:shadow-md ${
            statusFilter === "ALL"
              ? "border-[#274690] bg-[#274690]/5 shadow-sm ring-2 ring-[#274690]/20"
              : "border-slate-200/80 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">All Tasks</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <CheckSquare size={14} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-800">{stats.total}</span>
            <span className="text-[11px] font-semibold text-slate-400">Total</span>
          </div>
        </button>

        {/* Pending */}
        <button
          onClick={() => setStatusFilter("PENDING")}
          className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border p-4 text-left transition-all duration-200 hover:shadow-md ${
            statusFilter === "PENDING"
              ? "border-amber-500 bg-amber-500/10 shadow-sm ring-2 ring-amber-500/20"
              : "border-slate-200/80 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700">Pending</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Clock size={14} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-800">{stats.pending}</span>
            <span className="text-[11px] font-semibold text-amber-600">To Start</span>
          </div>
        </button>

        {/* In Progress */}
        <button
          onClick={() => setStatusFilter("IN_PROGRESS")}
          className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border p-4 text-left transition-all duration-200 hover:shadow-md ${
            statusFilter === "IN_PROGRESS"
              ? "border-blue-500 bg-blue-500/10 shadow-sm ring-2 ring-blue-500/20"
              : "border-slate-200/80 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700">In Progress</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-100 text-[#274690]">
              <SlidersHorizontal size={14} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-blue-800">{stats.inProgress}</span>
            <span className="text-[11px] font-semibold text-blue-600">Active</span>
          </div>
        </button>

        {/* Completed */}
        <button
          onClick={() => setStatusFilter("COMPLETED")}
          className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border p-4 text-left transition-all duration-200 hover:shadow-md ${
            statusFilter === "COMPLETED"
              ? "border-emerald-500 bg-emerald-500/10 shadow-sm ring-2 ring-emerald-500/20"
              : "border-slate-200/80 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700">Completed</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-800">{stats.completed}</span>
            <span className="text-[11px] font-semibold text-emerald-600">Done</span>
          </div>
        </button>

        {/* Overdue */}
        <button
          onClick={() => setStatusFilter("OVERDUE")}
          className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border p-4 text-left transition-all duration-200 hover:shadow-md ${
            statusFilter === "OVERDUE"
              ? "border-rose-500 bg-rose-500/10 shadow-sm ring-2 ring-rose-500/20"
              : "border-slate-200/80 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700">Overdue</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
              <AlertCircle size={14} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-800">{stats.overdue}</span>
            <span className="text-[11px] font-semibold text-rose-600">Urgent</span>
          </div>
        </button>
      </div>

      {/* ─── Search and Filter Toolbar ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-md">
        <div className="relative min-w-[260px] flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by task title, description, assigned by, or related doc..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 py-2.5 pl-10 pr-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#274690] focus:bg-white focus:ring-2 focus:ring-[#274690]/10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Priority Filter */}
          <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-1.5">
            <Filter size={13} className="text-slate-400" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex rounded-2xl border border-slate-200 bg-slate-50/80 p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`rounded-xl px-2.5 py-1 text-xs font-bold transition ${
                viewMode === "list" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`rounded-xl px-2.5 py-1 text-xs font-bold transition ${
                viewMode === "table" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {/* ─── 2. Task List Display ─── */}
      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-slate-200/80 bg-white/60">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#274690] border-t-transparent" />
          <p className="text-xs font-medium text-slate-500">Loading your tasks...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200/80 bg-white/80 p-12 text-center shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-[#274690]">
            <CheckSquare size={32} />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-800">No Tasks Matching Filter</h3>
          <p className="mt-1 max-w-sm text-xs text-slate-500">
            There are currently no tasks in this view. Check back later or adjust your search / status filters.
          </p>
          {(statusFilter !== "ALL" || priorityFilter !== "ALL" || search) && (
            <button
              onClick={() => {
                setStatusFilter("ALL");
                setPriorityFilter("ALL");
                setSearch("");
              }}
              className="mt-4 rounded-xl bg-[#274690] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#1f3773]"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : viewMode === "table" ? (
        /* ─── Table View (Task Title, Assigned By, Priority, Due Date, Status, Related Document, Created Date) ─── */
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 pl-6 pr-4">Task Details</th>
                  <th className="px-4 py-3.5">Assigned By</th>
                  <th className="px-4 py-3.5">Priority</th>
                  <th className="px-4 py-3.5">Due Date & Time</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Related Document</th>
                  <th className="px-4 py-3.5">Created Date</th>
                  <th className="py-3.5 pl-4 pr-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {tasks.map((task) => {
                  const deadline = getDeadlineInfo(task.dueDate, task.status);
                  const isCompleted = task.status === "COMPLETED";

                  return (
                    <tr
                      key={task.id}
                      className={`transition hover:bg-slate-50/80 ${isCompleted ? "bg-slate-50/40 opacity-75" : ""}`}
                    >
                      <td className="py-4 pl-6 pr-4">
                        <div className="font-bold text-slate-800">{task.title}</div>
                        <div className="line-clamp-1 mt-0.5 text-[11px] text-slate-500 max-w-xs">{task.description}</div>
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                          <UserCheck size={13} className="text-[#274690]" />
                          <span>{task.assignedBy}</span>
                        </div>
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                            task.priority === "CRITICAL"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : task.priority === "HIGH"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : task.priority === "MEDIUM"
                              ? "bg-blue-50 text-[#274690] border-blue-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {task.priority}
                        </span>
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 font-medium text-slate-700">
                          <Calendar size={13} className="text-slate-400" />
                          <span>{task.dueDate}</span>
                        </div>
                        <div
                          className={`mt-0.5 text-[10px] font-bold ${
                            deadline.isOverdue
                              ? "text-rose-600 font-extrabold flex items-center gap-1"
                              : deadline.urgency === "warning"
                              ? "text-amber-600"
                              : "text-slate-400"
                          }`}
                        >
                          {deadline.isOverdue && <AlertTriangle size={10} />}
                          {deadline.label}
                        </div>
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-bold border ${
                            task.status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : task.status === "IN_PROGRESS"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : deadline.isOverdue
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {task.status === "COMPLETED" ? (
                            <CheckCircle2 size={12} />
                          ) : task.status === "IN_PROGRESS" ? (
                            <Clock size={12} />
                          ) : (
                            <AlertCircle size={12} />
                          )}
                          {(task.status || "PENDING").toString().replace("_", " ")}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        {task.relatedDocName ? (
                          <button
                            onClick={() => setPreviewDoc({ name: task.relatedDocName!, id: task.relatedDocId || undefined })}
                            className="flex items-center gap-1.5 text-xs font-bold text-[#274690] hover:underline max-w-[200px] truncate"
                          >
                            <FileText size={14} className="shrink-0" />
                            <span className="truncate">{task.relatedDocName}</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">None</span>
                        )}
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap text-slate-500 text-[11px]">
                        {task.createdDate || "18 Aug 2026"}
                      </td>

                      <td className="py-4 pl-4 pr-6 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedTask(task);
                            setActiveTab("details");
                          }}
                          className="rounded-xl bg-slate-800 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-700"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ─── Card / List View ─── */
        <div className="space-y-3.5">
          {tasks.map((task) => {
            const deadline = getDeadlineInfo(task.dueDate, task.status);
            const isCompleted = task.status === "COMPLETED";

            return (
              <div
                key={task.id}
                className={`group relative flex flex-col justify-between gap-4 rounded-3xl border p-5 shadow-sm backdrop-blur-md transition-all hover:border-slate-300 hover:shadow-md sm:flex-row sm:items-center ${
                  isCompleted
                    ? "border-slate-200 bg-slate-50/50 opacity-85"
                    : deadline.isOverdue
                    ? "border-rose-200 bg-rose-50/20"
                    : "border-slate-200/80 bg-white"
                }`}
              >
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  {/* Task Icon / Priority Indicator */}
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                      task.priority === "CRITICAL"
                        ? "bg-rose-50 text-rose-600"
                        : task.priority === "HIGH"
                        ? "bg-amber-50 text-amber-600"
                        : task.priority === "MEDIUM"
                        ? "bg-blue-50 text-[#274690]"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 size={24} className="text-emerald-600" /> : <CheckSquare size={24} />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-800 group-hover:text-[#274690] transition">
                        {task.title}
                      </h3>

                      {/* Priority Tag */}
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                          task.priority === "CRITICAL"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : task.priority === "HIGH"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : task.priority === "MEDIUM"
                            ? "bg-blue-50 text-[#274690] border-blue-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {task.priority}
                      </span>

                      {/* Overdue Banner if overdue */}
                      {deadline.isOverdue && (
                        <span className="flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black text-rose-800 border border-rose-300">
                          <AlertTriangle size={11} />
                          <span>OVERDUE</span>
                        </span>
                      )}
                    </div>

                    <p className="mt-1 line-clamp-2 text-xs text-slate-600 leading-relaxed">
                      {task.description}
                    </p>

                    {/* Metadata Badges: Assigned By, Due Date, Remaining Time, Related Doc, Comments, Attachments */}
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      {/* Assigned By */}
                      <span className="flex items-center gap-1 font-semibold text-slate-700 bg-slate-100/80 px-2 py-0.5 rounded-lg">
                        <UserCheck size={13} className="text-[#274690]" />
                        <span>By {task.assignedBy}</span>
                      </span>

                      {/* Due Date & Remaining Time */}
                      <span
                        className={`flex items-center gap-1 font-semibold px-2 py-0.5 rounded-lg ${
                          deadline.isOverdue
                            ? "bg-rose-100/80 text-rose-800"
                            : deadline.urgency === "warning"
                            ? "bg-amber-100/80 text-amber-800"
                            : "bg-slate-100/80 text-slate-700"
                        }`}
                      >
                        <Calendar size={13} />
                        <span>Due: {task.dueDate}</span>
                        <span>•</span>
                        <span className="font-bold">{deadline.label}</span>
                      </span>

                      {/* Related Document */}
                      {task.relatedDocName && (
                        <button
                          onClick={() => setPreviewDoc({ name: task.relatedDocName!, id: task.relatedDocId || undefined })}
                          className="flex items-center gap-1 font-bold text-[#274690] bg-blue-50/80 px-2 py-0.5 rounded-lg border border-blue-100 hover:bg-blue-100 transition"
                        >
                          <FileText size={13} />
                          <span className="truncate max-w-[180px]">{task.relatedDocName}</span>
                          <ArrowUpRight size={11} />
                        </button>
                      )}

                      {/* Created Date */}
                      <span className="text-slate-400 text-[10px]">
                        Created: {task.createdDate || "18 Aug"}
                      </span>

                      {/* Comments count */}
                      {task.comments?.length > 0 && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <MessageSquare size={13} />
                          <span>{task.comments.length}</span>
                        </span>
                      )}

                      {/* Attachments count */}
                      {task.attachments?.length > 0 && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <Paperclip size={13} />
                          <span>{task.attachments.length}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action: Status Pill & Manage Button */}
                <div className="flex items-center gap-2.5 self-end sm:self-center">
                  <span
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold border ${
                      task.status === "COMPLETED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : task.status === "IN_PROGRESS"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : deadline.isOverdue
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {(task.status || "PENDING").toString().replace("_", " ")}
                  </span>

                  <button
                    onClick={() => {
                      setSelectedTask(task);
                      setActiveTab("details");
                    }}
                    className="flex items-center gap-1 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-slate-700"
                  >
                    <span>View & Manage</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── 3. TASK DETAILS MODAL / DRAWER (Complete with all 8 requirements) ─── */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="flex h-[92vh] w-full max-w-3xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 bg-slate-50/50 p-5">
              <div className="flex items-start gap-3.5">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                    selectedTask.priority === "CRITICAL"
                      ? "bg-rose-50 text-rose-600"
                      : selectedTask.priority === "HIGH"
                      ? "bg-amber-50 text-amber-600"
                      : selectedTask.priority === "MEDIUM"
                      ? "bg-blue-50 text-[#274690]"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  <CheckSquare size={22} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                        selectedTask.priority === "CRITICAL"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : selectedTask.priority === "HIGH"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-blue-50 text-[#274690] border-blue-200"
                      }`}
                    >
                      {selectedTask.priority} Priority
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-semibold text-slate-500">
                      Assigned by <strong className="text-slate-800">{selectedTask.assignedBy}</strong>
                    </span>
                  </div>
                  <h2 className="mt-1 text-base font-black text-slate-800">{selectedTask.title}</h2>
                </div>
              </div>

              <button
                onClick={() => setSelectedTask(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Subnav Tabs */}
            <div className="flex border-b border-slate-100 px-6 bg-white gap-2">
              <button
                onClick={() => setActiveTab("details")}
                className={`border-b-2 py-3 px-3 text-xs font-bold transition ${
                  activeTab === "details"
                    ? "border-[#274690] text-[#274690]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Overview & Instructions
              </button>
              <button
                onClick={() => setActiveTab("comments")}
                className={`border-b-2 py-3 px-3 text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === "comments"
                    ? "border-[#274690] text-[#274690]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <MessageSquare size={13} />
                <span>Comments</span>
                {selectedTask.comments?.length > 0 && (
                  <span className="rounded-full bg-blue-100 px-1.5 py-0.2 text-[10px] text-[#274690]">
                    {selectedTask.comments.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("attachments")}
                className={`border-b-2 py-3 px-3 text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === "attachments"
                    ? "border-[#274690] text-[#274690]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Paperclip size={13} />
                <span>Attachments</span>
                {selectedTask.attachments?.length > 0 && (
                  <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] text-slate-700">
                    {selectedTask.attachments.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("activity")}
                className={`border-b-2 py-3 px-3 text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === "activity"
                    ? "border-[#274690] text-[#274690]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <History size={13} />
                <span>Activity Log</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* TAB 1: DETAILS & OVERVIEW */}
              {activeTab === "details" && (
                <div className="space-y-6">
                  {/* Status Progression Stepper (4. Task Status Update: Pending -> In Progress -> Completed) */}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Task Status Progress</h4>
                      <span className="text-[11px] font-semibold text-slate-500">
                        Current: <strong className="text-[#274690]">{(selectedTask.status || "PENDING").toString().replace("_", " ")}</strong>
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {/* Step 1: Pending */}
                      <button
                        onClick={() => handleUpdateStatus(selectedTask.id, "PENDING")}
                        className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition ${
                          selectedTask.status === "PENDING"
                            ? "border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-500/20"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-xs font-bold">1. Pending</span>
                        <span className="text-[10px] text-slate-400">Waiting to Start</span>
                      </button>

                      {/* Step 2: In Progress */}
                      <button
                        onClick={() => handleUpdateStatus(selectedTask.id, "IN_PROGRESS")}
                        className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition ${
                          selectedTask.status === "IN_PROGRESS"
                            ? "border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-500/20"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-xs font-bold">2. In Progress</span>
                        <span className="text-[10px] text-slate-400">Actively Working</span>
                      </button>

                      {/* Step 3: Completed */}
                      <button
                        onClick={() => handleUpdateStatus(selectedTask.id, "COMPLETED")}
                        className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition ${
                          selectedTask.status === "COMPLETED"
                            ? "border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-xs font-bold">3. Completed</span>
                        <span className="text-[10px] text-slate-400">Submit Proof & Finish</span>
                      </button>
                    </div>
                  </div>

                  {/* Metadata Grid (Assigned By, Created Date, Due Date, Priority Notice) */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assigned By</span>
                      <p className="mt-1 text-xs font-bold text-slate-800">{selectedTask.assignedBy}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Created Date</span>
                      <p className="mt-1 text-xs font-bold text-slate-800">{selectedTask.createdDate || "18 Aug 2026"}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Due Date</span>
                      <p className="mt-1 text-xs font-bold text-slate-800">{selectedTask.dueDate}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Deadline Status</span>
                      <p
                        className={`mt-1 text-xs font-bold ${
                          getDeadlineInfo(selectedTask.dueDate, selectedTask.status).isOverdue
                            ? "text-rose-600 font-black"
                            : "text-slate-800"
                        }`}
                      >
                        {getDeadlineInfo(selectedTask.dueDate, selectedTask.status).label}
                      </p>
                    </div>
                  </div>

                  {/* Employee Permission Notice (Employee cannot change Priority / Due Date) */}
                  <div className="flex items-center gap-2 rounded-2xl border border-amber-200/80 bg-amber-50/60 p-3 text-xs text-amber-800">
                    <Lock size={14} className="text-amber-700 shrink-0" />
                    <span>
                      <strong>Note for Employee:</strong> Task priority (<strong>{selectedTask.priority}</strong>) and due date (<strong>{selectedTask.dueDate}</strong>) are locked by management. Contact your assigner for timeline revisions.
                    </span>
                  </div>

                  {/* Full Description & Instructions */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Task Summary</h4>
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
                      {selectedTask.description}
                    </p>
                  </div>

                  {/* Detailed Instructions */}
                  {selectedTask.instructions && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Manager Directives & Instructions</h4>
                      <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {selectedTask.instructions}
                      </div>
                    </div>
                  )}

                  {/* 5. Related Document Card */}
                  {selectedTask.relatedDocName && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">5. Connected Document</h4>
                      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/75 p-3.5 transition hover:bg-slate-100/80">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-[#274690]">
                            <FileText size={20} />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800">{selectedTask.relatedDocName}</div>
                            <div className="text-[10px] text-slate-400">Directly linked to this assignment</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPreviewDoc({ name: selectedTask.relatedDocName!, id: selectedTask.relatedDocId || undefined })}
                            className="flex items-center gap-1 rounded-xl bg-[#274690] px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#1f3773]"
                          >
                            <Eye size={13} />
                            <span>Open Document</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: 6. COMMENTS (Add comment, Reply, View previous comments) */}
              {activeTab === "comments" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Collaborative Discussion with {selectedTask.assignedBy}
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      {selectedTask.comments?.length || 0} conversation entries
                    </span>
                  </div>

                  {/* Conversation List */}
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {(!selectedTask.comments || selectedTask.comments.length === 0) ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                        No comments yet. Start a discussion or request clarification below!
                      </div>
                    ) : (
                      selectedTask.comments.map((comment) => (
                        <div key={comment.id} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 space-y-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800">{comment.user}</span>
                              <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[9px] font-bold text-slate-600">
                                {comment.role || "Team"}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400">{comment.time}</span>
                          </div>

                          <p className="text-xs text-slate-700 leading-relaxed">{comment.text}</p>

                          {/* Nested Replies */}
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="mt-2 space-y-2 pl-4 border-l-2 border-blue-200">
                              {comment.replies.map((reply) => (
                                <div key={reply.id} className="rounded-xl bg-white p-2.5 text-xs shadow-xs border border-slate-100">
                                  <div className="flex items-center justify-between text-[11px]">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-[#274690]">{reply.user}</span>
                                      <span className="rounded-full bg-blue-50 px-1.5 py-0.2 text-[9px] font-semibold text-[#274690]">
                                        {reply.role}
                                      </span>
                                    </div>
                                    <span className="text-[9px] text-slate-400">{reply.time}</span>
                                  </div>
                                  <p className="mt-1 text-slate-600">{reply.text}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Reply Toggle / Input */}
                          <div className="pt-1">
                            {replyingToId === comment.id ? (
                              <div className="flex items-center gap-2 mt-2">
                                <input
                                  type="text"
                                  placeholder="Write a reply..."
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-[#274690]"
                                />
                                <button
                                  onClick={() => handleAddReply(comment.id)}
                                  className="rounded-xl bg-[#274690] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1f3773]"
                                >
                                  Reply
                                </button>
                                <button
                                  onClick={() => {
                                    setReplyingToId(null);
                                    setReplyText("");
                                  }}
                                  className="text-xs text-slate-400 hover:text-slate-600"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setReplyingToId(comment.id)}
                                className="flex items-center gap-1 text-[11px] font-bold text-[#274690] hover:underline"
                              >
                                <CornerDownRight size={12} />
                                <span>Reply to comment</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add New Top-Level Comment Form */}
                  <form onSubmit={handleAddComment} className="pt-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder='e.g., "I need clarification regarding the payment section."'
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-[#274690] focus:bg-white"
                      />
                      <button
                        type="submit"
                        disabled={!newComment.trim()}
                        className="flex items-center gap-1.5 rounded-2xl bg-[#274690] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#1f3773] disabled:opacity-50"
                      >
                        <Send size={14} />
                        <span>Send</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 3: 7. ATTACHMENTS (PDF, DOCX, XLSX, Images etc.) */}
              {activeTab === "attachments" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Deliverables & Supporting Files
                      </h4>
                      <p className="text-[11px] text-slate-400">PDF, DOCX, XLSX, Images, and CSV spreadsheets</p>
                    </div>

                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.png,.jpg,.jpeg"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 rounded-xl bg-[#274690] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#1f3773]"
                      >
                        <UploadCloud size={14} />
                        <span>Attach File</span>
                      </button>
                    </div>
                  </div>

                  {/* Attachment Items List */}
                  <div className="space-y-2">
                    {(!selectedTask.attachments || selectedTask.attachments.length === 0) ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                        No files attached yet. Click &quot;Attach File&quot; to upload deliverables.
                      </div>
                    ) : (
                      selectedTask.attachments.map((att) => (
                        <div
                          key={att.id || att.name}
                          className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/90 p-3 text-xs transition hover:bg-slate-100/90"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-xs">
                              {getFileIcon(att.name)}
                            </div>
                            <div>
                              <span className="font-bold text-slate-800">{att.name}</span>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                <span>{att.size}</span>
                                <span>•</span>
                                <span>{att.uploadedAt || "Attached"}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                showToast(`Downloading ${att.name}...`);
                              }}
                              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              <Download size={12} />
                              <span>Download</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: ACTIVITY & HISTORY */}
              {activeTab === "activity" && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Task Audit Trail & Progression History
                  </h4>

                  <div className="space-y-3 pl-2">
                    {(selectedTask.activity || []).map((act) => (
                      <div key={act.id} className="relative pl-6 border-l-2 border-slate-200 pb-3 last:border-transparent">
                        <div className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-[#274690] ring-4 ring-blue-50" />
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">{act.action}</span>
                          <span className="text-[10px] text-slate-400">{act.time}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">{act.details}</p>
                        <div className="mt-1 text-[10px] font-semibold text-slate-400">By {act.user}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer with Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 p-4">
              <div className="flex items-center gap-2">
                {selectedTask.status !== "COMPLETED" ? (
                  <button
                    onClick={() => setCompleteModalOpen(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
                  >
                    <CheckCircle2 size={14} />
                    <span>Submit & Mark as Completed</span>
                  </button>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-700">
                    <CheckCircle2 size={15} />
                    <span>Task Completed</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedTask(null)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 4. COMPLETE TASK MODAL (Proof / Attach file, Add remark, Mark Completed) ─── */}
      {completeModalOpen && selectedTask && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Complete Task Submission</h3>
                  <p className="text-[11px] text-slate-500">Provide proof, deliverables, and completion remarks.</p>
                </div>
              </div>
              <button onClick={() => setCompleteModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmCompletion} className="mt-4 space-y-4">
              {/* Task Title preview */}
              <div className="rounded-xl bg-slate-50 p-3 text-xs border border-slate-100">
                <span className="font-bold text-slate-700">Task: </span>
                <span className="text-slate-800">{selectedTask.title}</span>
              </div>

              {/* Attach Proof Files */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Attach Deliverable / Proof Files (PDF, DOCX, XLSX, PNG)
                </label>
                <input
                  type="file"
                  ref={completionFileInputRef}
                  onChange={(e) => {
                    if (e.target.files) {
                      setCompletionFiles(Array.from(e.target.files));
                    }
                  }}
                  multiple
                  className="hidden"
                  accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.png,.jpg,.jpeg"
                />
                <button
                  type="button"
                  onClick={() => completionFileInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4 text-xs font-semibold text-slate-600 hover:bg-slate-100/70 transition"
                >
                  <UploadCloud size={16} className="text-[#274690]" />
                  <span>Click to browse and upload completion files</span>
                </button>

                {completionFiles.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {completionFiles.map((f, i) => (
                      <div key={i} className="flex items-center justify-between rounded-xl bg-slate-100 px-3 py-1.5 text-xs text-slate-700">
                        <span className="truncate max-w-[300px]">{f.name}</span>
                        <span className="text-[10px] text-slate-400">{(f.size / (1024 * 1024)).toFixed(1)} MB</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Completion Comment */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Completion Notes / Remarks
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the action taken or verification outcome for your team leader..."
                  value={completionComment}
                  onChange={(e) => setCompletionComment(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCompleteModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingComplete}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submittingComplete ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                  <span>Mark as Completed</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 5. RELATED DOCUMENT VIEWER MODAL ─── */}
      {previewDoc && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="flex h-[85vh] w-full max-w-4xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-[#274690]">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">{previewDoc.name}</h3>
                  <p className="text-[10px] text-slate-400">Document Automation Integrated Viewer</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/employee/documents"
                  className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <ExternalLink size={12} />
                  <span>Open in My Documents</span>
                </Link>
                <button onClick={() => setPreviewDoc(null)} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/60">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Document Content Simulation */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
              <div className="max-w-2xl mx-auto rounded-2xl border border-slate-200 bg-white p-8 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-4">
                  <span className="text-[10px] font-bold text-[#274690] uppercase tracking-wider">Enterprise Document Reference</span>
                  <h2 className="text-lg font-black text-slate-800 mt-1">{previewDoc.name}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Version 1.2 • Confirmed Valid • Internal Use Only</p>
                </div>

                <div className="text-xs text-slate-700 space-y-3 leading-relaxed">
                  <p>
                    <strong>1. PURPOSE & SCOPE:</strong> This document constitutes the operational reference for active employee assignments, tasks, and reconciliation items.
                  </p>
                  <p>
                    <strong>2. TERMS & COMPLIANCE:</strong> All deliverables uploaded against this document must be reviewed by the assigned Team Leader or Department Manager before final archival.
                  </p>
                  <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 text-[11px] text-slate-600 font-mono">
                    [DOCUMENT_CHECKSUM_SHA256: 4e8f9b201a3cd7e...]
                    <br />
                    STATUS: ACTIVE_VERIFIED
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-100 bg-slate-50 p-3.5">
              <button
                onClick={() => setPreviewDoc(null)}
                className="rounded-xl bg-slate-800 px-4 py-1.5 text-xs font-bold text-white"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
