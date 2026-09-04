"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  GitFork,
  CheckCircle2,
  AlertCircle,
  Clock,
  Play,
  Check,
  X,
  FileText,
  UserCheck,
  ArrowRight,
  Activity,
  Layers,
  Sparkles,
  Search,
  Filter,
  Bell,
  Eye,
  Download,
  ExternalLink,
  MessageSquare,
  Send,
  AlertTriangle,
  History,
  CornerDownRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { workflowApi } from "@/services/workflowApi";

type WorkflowTab = "ALL" | "MY_PENDING" | "IN_PROGRESS" | "COMPLETED" | "REJECTED" | "OVERDUE";

export default function TeamLeaderWorkflowPage() {
  const [loading, setLoading] = useState(true);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<WorkflowTab>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [summary, setSummary] = useState({
    pending: 12,
    inProgress: 8,
    completed: 45,
    overdue: 3,
  });

  const [error, setError] = useState("");
  const [successToast, setSuccessToast] = useState("");

  // Detailed Modal / Drawer
  const [selectedWorkflow, setSelectedWorkflow] = useState<any | null>(null);
  const [fullDocView, setFullDocView] = useState(false);

  // Actions inside Detail
  const [commentText, setCommentText] = useState("");
  const [actionReason, setActionReason] = useState("");
  const [pendingActionModal, setPendingActionModal] = useState<"APPROVE" | "REJECT" | "REQUEST_CHANGES" | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 4000);
  };

  const fetchWorkflows = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await workflowApi.getWorkflows({ tab: activeTab, search: searchQuery });
      if (res?.data) {
        setWorkflows(res.data);
        if ((res as any).summaryCards) {
          setSummary((res as any).summaryCards);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workflows.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchWorkflows();
  }, [activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void fetchWorkflows();
  };

  const handleExecuteAction = async (action: "APPROVE" | "REJECT" | "REQUEST_CHANGES") => {
    if (!selectedWorkflow) return;
    if ((action === "REJECT" || action === "REQUEST_CHANGES") && !actionReason.trim()) {
      setError("Please provide a reason or comment before proceeding.");
      return;
    }

    try {
      const res = await workflowApi.executeWorkflowStep(selectedWorkflow.id, {
        action,
        comment: actionReason.trim() || undefined,
        notes: actionReason.trim() || undefined,
      });
      showToast(res?.message || `Workflow ${action} executed successfully!`);
      setSelectedWorkflow(res.data);
      setPendingActionModal(null);
      setActionReason("");
      void fetchWorkflows();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute workflow action.");
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkflow || !commentText.trim()) return;
    try {
      const res = await workflowApi.addWorkflowComment(selectedWorkflow.id, commentText.trim());
      showToast("Comment posted!");
      setCommentText("");
      if (!selectedWorkflow.comments) selectedWorkflow.comments = [];
      selectedWorkflow.comments.push(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post comment.");
    }
  };

  const tabs: { key: WorkflowTab; label: string }[] = [
    { key: "ALL", label: "All Workflows" },
    { key: "MY_PENDING", label: "My Pending" },
    { key: "IN_PROGRESS", label: "In Progress" },
    { key: "COMPLETED", label: "Completed" },
    { key: "REJECTED", label: "Rejected" },
    { key: "OVERDUE", label: "Overdue" },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-20 font-sans text-slate-800">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col gap-4 rounded-3xl border border-[#274690]/15 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-[#274690] sm:text-3xl">Workflow</h1>
            <Badge className="bg-[#c96f4a]/10 text-[#c96f4a] border-[#c96f4a]/30 text-xs font-black px-2.5 py-0.5">
              Team Leader Pipeline
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-600 font-semibold">
            Manage and track workflow steps assigned to your team
          </p>
        </div>

        {/* Right side controls: Search, Filter, Notifications */}
        <div className="flex items-center gap-2.5">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workflow or doc..."
              className="pl-9 h-9 w-48 sm:w-64 rounded-xl text-xs font-semibold focus:border-[#274690]"
            />
          </form>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setActiveTab(activeTab === "ALL" ? "MY_PENDING" : "ALL")}
            className="h-9 rounded-xl border-slate-200 text-xs font-bold text-[#274690] hover:bg-[#274690]/5 gap-1.5"
          >
            <Filter size={14} className="text-[#c96f4a]" /> Filter
          </Button>

          <Link href="/team-leader/notifications">
            <button
              type="button"
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs hover:border-[#274690]/40 transition"
              title="Workflow Notifications"
            >
              <Bell size={15} />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#c96f4a] text-[9px] font-black text-white">
                3
              </span>
            </button>
          </Link>
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

      {/* 2. SUMMARY CARDS (4 CARDS: Pending 12, In Progress 8, Completed 45, Overdue 3) */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Pending */}
        <div
          onClick={() => setActiveTab("MY_PENDING")}
          className="cursor-pointer rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm hover:border-[#274690]/40 transition"
        >
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Pending</span>
          <p className="mt-2 text-3xl font-black text-[#274690]">{summary.pending}</p>
          <span className="mt-1 block text-[10px] font-semibold text-slate-400">Assigned Team Steps</span>
        </div>

        {/* In Progress */}
        <div
          onClick={() => setActiveTab("IN_PROGRESS")}
          className="cursor-pointer rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm hover:border-[#c96f4a]/40 transition"
        >
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">In Progress</span>
          <p className="mt-2 text-3xl font-black text-[#c96f4a]">{summary.inProgress}</p>
          <span className="mt-1 block text-[10px] font-semibold text-slate-400">Active Review Lanes</span>
        </div>

        {/* Completed */}
        <div
          onClick={() => setActiveTab("COMPLETED")}
          className="cursor-pointer rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm hover:border-[#274690]/40 transition"
        >
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Completed</span>
          <p className="mt-2 text-3xl font-black text-[#274690]">{summary.completed}</p>
          <span className="mt-1 block text-[10px] font-semibold text-slate-400">Released & Archived</span>
        </div>

        {/* Overdue */}
        <div
          onClick={() => setActiveTab("OVERDUE")}
          className="cursor-pointer rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm hover:border-rose-300 transition"
        >
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Overdue</span>
          <p className="mt-2 text-3xl font-black text-rose-600">{summary.overdue}</p>
          <span className="mt-1 block text-[10px] font-semibold text-slate-400">Past SLA Threshold</span>
        </div>
      </section>

      {/* 3. TABS BAR (6 TABS) */}
      <div className="flex overflow-x-auto space-x-1.5 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xs scrollbar-none">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key)}
            className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-black transition ${
              activeTab === t.key
                ? "bg-[#274690] text-white shadow-xs"
                : "text-slate-600 hover:bg-[#274690]/5 hover:text-[#274690]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 4. WORKFLOW TABLE */}
      <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Workflow</th>
                <th className="px-4 py-3.5">Document</th>
                <th className="px-4 py-3.5">Current Step</th>
                <th className="px-4 py-3.5">Assigned By</th>
                <th className="px-4 py-3.5">Due Date</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {workflows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                    No workflows found under this tab.
                  </td>
                </tr>
              ) : (
                workflows.map((wf) => (
                  <tr key={wf.id} className="transition hover:bg-[#274690]/5">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#274690]/10 text-[#274690] shrink-0">
                          <GitFork size={15} />
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900">{wf.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold">{wf.id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="font-bold text-[#274690] flex items-center gap-1">
                        <FileText size={13} className="text-[#c96f4a]" /> {wf.documentName}
                      </span>
                    </td>

                    <td className="px-4 py-4 font-bold text-slate-800">
                      <span className="rounded-lg bg-slate-100 px-2 py-1 text-[11px]">
                        {wf.currentStep}
                      </span>
                    </td>

                    <td className="px-4 py-4 font-bold text-slate-700">{wf.assignedBy}</td>

                    <td className="px-4 py-4 text-[11px] font-bold text-slate-600">{wf.dueDate}</td>

                    <td className="px-4 py-4">
                      <Badge
                        className={`text-[10px] font-black ${
                          wf.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-800"
                            : wf.status === "IN_PROGRESS"
                            ? "bg-[#274690]/10 text-[#274690] border-[#274690]/20"
                            : wf.status === "OVERDUE"
                            ? "bg-rose-100 text-rose-700"
                            : wf.status === "REJECTED"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-[#c96f4a]/15 text-[#c96f4a] border-[#c96f4a]/30"
                        }`}
                      >
                        {wf.status}
                      </Badge>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          onClick={() => setSelectedWorkflow(wf)}
                          className="h-8 rounded-xl bg-[#274690] text-[11px] font-bold text-white hover:bg-[#1f3561] px-3"
                        >
                          <Eye size={13} className="mr-1" /> View Detail
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. WORKFLOW DETAIL MODAL / DRAWER (ALL 10 SPECIFIED SECTIONS) */}
      {selectedWorkflow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in">
          <div className="w-full max-w-4xl rounded-3xl bg-white p-6 shadow-2xl border border-[#274690]/20 max-h-[92vh] overflow-y-auto space-y-6">
            {/* Detail Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-xl font-black text-[#274690]">{selectedWorkflow.name}</h3>
                  <Badge className="bg-[#c96f4a]/10 text-[#c96f4a] border-[#c96f4a]/30 text-xs font-black">
                    {selectedWorkflow.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  Document: <strong className="text-[#274690]">{selectedWorkflow.documentName}</strong> • Started: {selectedWorkflow.startedDate}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWorkflow(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* Section 5.1: Workflow Information Grid */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-[#274690] mb-3">Workflow Information</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Created By</span>
                  <p className="font-extrabold text-slate-900 mt-0.5">{selectedWorkflow.assignedBy}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Priority</span>
                  <p className="font-extrabold text-[#c96f4a] mt-0.5">{selectedWorkflow.priority || "HIGH"}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Due Date</span>
                  <p className="font-extrabold text-slate-900 mt-0.5">{selectedWorkflow.dueDate}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Progress</span>
                  <p className="font-extrabold text-[#274690] mt-0.5">{selectedWorkflow.progress}%</p>
                </div>
              </div>
            </div>

            {/* Section 5.2: Progress Tracker (Most Important UI) */}
            <div className="rounded-2xl border border-[#274690]/20 bg-white p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#274690]">
                  Progress Tracker & Multi-Stage Route:
                </h4>
                <span className="text-[11px] font-bold text-slate-400">4-Stage Pipeline</span>
              </div>

              {/* Vertical Step Progression */}
              <div className="space-y-3 pt-2">
                {selectedWorkflow.progressTracker?.map((st: any, idx: number) => {
                  const isCompleted = st.status === "COMPLETED";
                  const isCurrent = st.status === "CURRENT";
                  const isChanges = st.status === "CHANGES_REQUESTED" || st.status === "REJECTED";

                  return (
                    <div key={st.id} className="relative flex items-start gap-3.5">
                      {/* Line connector */}
                      {idx < selectedWorkflow.progressTracker.length - 1 && (
                        <div
                          className={`absolute left-4 top-7 bottom-0 w-0.5 ${
                            isCompleted ? "bg-[#274690]" : "bg-slate-200"
                          }`}
                        />
                      )}

                      {/* Icon */}
                      <div
                        className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-xl text-xs font-black ${
                          isCompleted
                            ? "bg-[#274690] text-white"
                            : isCurrent
                            ? "bg-[#c96f4a] text-white ring-4 ring-[#c96f4a]/20 animate-pulse"
                            : isChanges
                            ? "bg-rose-500 text-white"
                            : "bg-slate-100 text-slate-400 border border-slate-200"
                        }`}
                      >
                        {isCompleted ? <Check size={14} /> : isCurrent ? "●" : "○"}
                      </div>

                      {/* Content */}
                      <div className="flex-1 rounded-xl p-2.5 bg-slate-50/70 border border-slate-100 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-black text-slate-900">{st.role}: {st.name}</p>
                            {isCurrent && (
                              <Badge className="bg-[#c96f4a]/15 text-[#c96f4a] border-[#c96f4a]/30 text-[9px] font-black">
                                Current Step
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 font-semibold">{st.subtext}</p>
                        </div>

                        <span
                          className={`text-[10px] font-black uppercase ${
                            isCompleted ? "text-[#274690]" : isCurrent ? "text-[#c96f4a]" : "text-slate-400"
                          }`}
                        >
                          {isCompleted ? "✓ Completed" : isCurrent ? "Active" : "Pending"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 6: Current Step Action Card */}
            <div className="rounded-2xl border border-[#c96f4a]/30 bg-[#c96f4a]/5 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#c96f4a]/20 pb-3">
                <div>
                  <h4 className="text-sm font-black text-[#274690] flex items-center gap-1.5">
                    <Clock size={16} className="text-[#c96f4a]" /> Current Step: Team Leader Review
                  </h4>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">
                    Assigned To: <strong className="text-slate-900">{selectedWorkflow.assignedTo}</strong> • Due Date: {selectedWorkflow.dueDate}
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setFullDocView(!fullDocView)}
                  className="h-8 rounded-xl border-[#274690]/30 text-xs font-bold text-[#274690] hover:bg-[#274690]/5"
                >
                  <Eye size={13} className="mr-1.5 text-[#c96f4a]" /> {fullDocView ? "Hide Preview" : "Open Document Preview"}
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPendingActionModal("REQUEST_CHANGES")}
                    className="h-9 rounded-xl border-[#c96f4a]/40 text-[#c96f4a] text-xs font-bold hover:bg-[#c96f4a]/10"
                  >
                    Request Changes
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPendingActionModal("REJECT")}
                    className="h-9 rounded-xl border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-50"
                  >
                    Reject
                  </Button>
                </div>

                <Button
                  size="sm"
                  onClick={() => setPendingActionModal("APPROVE")}
                  className="h-9 rounded-xl bg-[#274690] text-xs font-black text-white hover:bg-[#1f3561] gap-1.5 shadow-sm"
                >
                  <Check size={14} /> Approve Step
                </Button>
              </div>
            </div>

            {/* Section 7: Document Preview Box */}
            {fullDocView && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-[#274690]" />
                    <span className="text-xs font-black text-slate-900">{selectedWorkflow.documentPreview?.fileName || selectedWorkflow.documentName}</span>
                    <span className="text-[10px] text-slate-400 font-bold">({selectedWorkflow.documentPreview?.fileSize || "1.8 MB"})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => showToast("Downloading document...")}
                      className="h-7 text-[11px] font-bold rounded-lg text-[#274690]"
                    >
                      <Download size={12} className="mr-1" /> Download
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 font-mono text-xs text-slate-700 whitespace-pre-line leading-relaxed min-h-30">
                  {selectedWorkflow.documentPreview?.content || "Document content extracted and validated."}
                </div>
              </div>
            )}

            {/* Section 8 & 9: History & Discussion Comments */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
              {/* Section 8: Workflow History Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#274690] flex items-center gap-1.5">
                  <History size={14} className="text-[#c96f4a]" /> Workflow History
                </h4>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {selectedWorkflow.history?.map((h: any, i: number) => (
                    <div key={i} className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 text-xs">
                      <p className="font-bold text-slate-800">{h.event}</p>
                      <span className="text-[10px] text-slate-400 font-semibold">{h.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 9: Comments / Activity Discussion */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#274690] flex items-center gap-1.5">
                  <MessageSquare size={14} className="text-[#c96f4a]" /> Comments & Activity
                </h4>

                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {selectedWorkflow.comments?.map((c: any) => (
                    <div key={c.id} className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-xs">
                      <div className="flex justify-between font-bold text-[10px]">
                        <span className="text-[#274690]">{c.user} ({c.role}):</span>
                        <span className="text-slate-400">{c.time}</span>
                      </div>
                      <p className="mt-1 text-slate-700 font-semibold">{c.text}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handlePostComment} className="flex gap-2 pt-1">
                  <Input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add team leader note or instruction..."
                    className="h-9 text-xs rounded-xl focus:border-[#274690]"
                  />
                  <Button size="sm" type="submit" className="h-9 bg-[#274690] text-xs font-bold text-white rounded-xl hover:bg-[#1f3561]">
                    <Send size={12} />
                  </Button>
                </form>
              </div>
            </div>

            {/* Footer Close */}
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setSelectedWorkflow(null)} className="rounded-xl">
                Close Detail
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION / MANDATORY COMMENT MODAL FOR REJECT & REQUEST CHANGES */}
      {pendingActionModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-[#274690]/20 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-[#274690]">
                {pendingActionModal === "APPROVE"
                  ? "Confirm Step Approval"
                  : pendingActionModal === "REJECT"
                  ? "Confirm Document Rejection"
                  : "Request Document Changes"}
              </h3>
              <button type="button" onClick={() => setPendingActionModal(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {pendingActionModal === "APPROVE"
                  ? "Are you sure you want to approve this step and forward it to Department Manager?"
                  : "Please provide mandatory instructions or reasons for the team associate:"}
              </p>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-600">
                  {pendingActionModal === "APPROVE" ? "Approval Notes (Optional)" : "Mandatory Reason / Comment *"}
                </label>
                <textarea
                  required={pendingActionModal !== "APPROVE"}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder={
                    pendingActionModal === "APPROVE"
                      ? "Optional sign-off notes..."
                      : "Explain the correction required..."
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-xs font-semibold focus:border-[#274690] focus:outline-none"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button variant="outline" size="sm" onClick={() => setPendingActionModal(null)} className="rounded-xl">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleExecuteAction(pendingActionModal)}
                  className={`rounded-xl text-xs font-black text-white ${
                    pendingActionModal === "APPROVE"
                      ? "bg-[#274690] hover:bg-[#1f3561]"
                      : pendingActionModal === "REJECT"
                      ? "bg-rose-600 hover:bg-rose-700"
                      : "bg-[#c96f4a] hover:bg-[#b05835]"
                  }`}
                >
                  Confirm {pendingActionModal.replace("_", " ")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
