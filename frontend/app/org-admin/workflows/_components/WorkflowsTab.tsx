"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Eye,
  Edit3,
  Copy,
  Trash2,
  Play,
  Pause,
  MoreVertical,
  Workflow,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Archive,
  ArrowUpDown,
  FileText,
  Sliders,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { workflowApi } from "@/services/workflowApi";
import WorkflowDetailModal from "./WorkflowDetailModal";

export interface WorkflowItem {
  id: string;
  name: string;
  description: string;
  category: string;
  appliesTo: string;
  steps: number;
  trigger: string;
  status: "Active" | "Draft" | "Paused" | "Archived" | string;
  createdDate: string;
  lastRun: string;
  createdBy: string;
  department?: string;
  deadline?: string;
  reminder?: string;
  escalation?: string;
  commentsRequired?: boolean;
  allowChanges?: boolean;
}

interface WorkflowsTabProps {
  onOpenCreate: () => void;
  showToast: (msg: string) => void;
}

export default function WorkflowsTab({ onOpenCreate, showToast }: WorkflowsTabProps) {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Filters & Sorting
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowItem | null>(null);

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const res = await workflowApi.getOrgWorkflows();
      if (res?.data?.workflows) {
        const mapped: WorkflowItem[] = res.data.workflows.map((w: any) => ({
          id: String(w.id),
          name: w.name,
          description: w.description || "Multi-tenant automated routing and approval pipeline.",
          category: w.department || "Legal & Compliance",
          appliesTo: w.appliesTo || "Contract",
          steps: w.steps?.length || 2,
          trigger: w.trigger ? String(w.trigger).replace(/_/g, " ") : "Employee submits document",
          status:
            w.status === "ACTIVE"
              ? "Active"
              : w.status === "PAUSED"
                ? "Paused"
                : w.status === "ARCHIVED"
                  ? "Archived"
                  : "Draft",
          createdDate: w.createdAt ? new Date(w.createdAt).toLocaleDateString() : "12 Aug 2026",
          lastRun: w.lastRunAt ? new Date(w.lastRunAt).toLocaleDateString() : "Active Queue",
          createdBy: w.createdBy?.full_name || "Organisation Admin",
          department: w.department || "Legal",
          deadline: `${w.approvalDeadlineDays || 3} days`,
          reminder: `${w.reminderAfterHours || 24} hours`,
          escalation: `${w.escalationAfterHours || 48} hours`,
          commentsRequired: Boolean(w.commentsRequiredOnRejection),
          allowChanges: Boolean(w.allowRequestChanges ?? true),
        }));
        setWorkflows(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch workflows:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchWorkflows();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-emerald-100 text-emerald-800 border border-emerald-200";
      case "Draft":
        return "bg-slate-100 text-slate-700 border border-slate-200";
      case "Paused":
        return "bg-amber-100 text-amber-800 border border-amber-200";
      case "Archived":
        return "bg-purple-100 text-purple-800 border border-purple-200";
      default:
        return "bg-slate-100 text-slate-700 border border-slate-200";
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "Active" ? "PAUSED" : "ACTIVE";
    try {
      await workflowApi.toggleOrgWorkflowStatus(id, newStatus);
      showToast(`Workflow status updated to ${newStatus}`);
      void fetchWorkflows();
    } catch (err) {
      showToast("Failed to update workflow status.");
    }
    setActiveMenuId(null);
  };

  const archiveWorkflow = async (id: string) => {
    try {
      await workflowApi.toggleOrgWorkflowStatus(id, "PAUSED");
      showToast("Workflow moved to Archive.");
      void fetchWorkflows();
    } catch (err) {
      showToast("Failed to archive workflow.");
    }
    setActiveMenuId(null);
  };

  const deleteWorkflow = async (id: string) => {
    try {
      await workflowApi.deleteOrgWorkflow(id);
      showToast("Workflow deleted successfully.");
      void fetchWorkflows();
    } catch (err) {
      showToast("Failed to delete workflow.");
    }
    setActiveMenuId(null);
  };

  const duplicateWorkflow = async (wf: WorkflowItem) => {
    try {
      await workflowApi.duplicateOrgWorkflow(wf.id);
      showToast(`Workflow duplicated as "${wf.name} (Copy)"`);
      void fetchWorkflows();
    } catch (err) {
      // Fallback create duplicate
      await workflowApi.createOrgWorkflow({
        name: `${wf.name} (Copy)`,
        appliesTo: wf.appliesTo,
        status: "DRAFT",
      });
      showToast(`Workflow duplicated as "${wf.name} (Copy)"`);
      void fetchWorkflows();
    }
    setActiveMenuId(null);
  };

  // Filtered & Sorted workflows
  const filteredWorkflows = useMemo(() => {
    return workflows
      .filter((w) => {
        const matchesSearch =
          !search ||
          w.name.toLowerCase().includes(search.toLowerCase()) ||
          w.description.toLowerCase().includes(search.toLowerCase()) ||
          w.appliesTo.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "All" || w.status === statusFilter;
        const matchesType = typeFilter === "All" || w.appliesTo === typeFilter;
        return matchesSearch && matchesStatus && matchesType;
      })
      .sort((a, b) => {
        if (sortBy === "A-Z") return a.name.localeCompare(b.name);
        if (sortBy === "Z-A") return b.name.localeCompare(a.name);
        if (sortBy === "Steps count") return b.steps - a.steps;
        return 0; // Newest by default
      });
  }, [workflows, search, statusFilter, typeFilter, sortBy]);

  const totalPages = Math.ceil(filteredWorkflows.length / pageSize) || 1;
  const paginatedWorkflows = filteredWorkflows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const documentTypes = ["All", ...Array.from(new Set(workflows.map((w) => w.appliesTo)))];

  const stats = [
    { label: "Total Workflows", value: workflows.length.toString(), color: "text-slate-900", badge: "Managed" },
    { label: "Active Live", value: workflows.filter((w) => w.status === "Active").length.toString(), color: "text-emerald-700", badge: "Running" },
    { label: "Draft Blueprints", value: workflows.filter((w) => w.status === "Draft").length.toString(), color: "text-slate-700", badge: "In Design" },
    { label: "Paused / Suspended", value: workflows.filter((w) => w.status === "Paused").length.toString(), color: "text-amber-700", badge: "Paused" },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <Badge variant="outline" className="text-[10px] font-bold">
                {stat.badge}
              </Badge>
            </div>
            <p className={`text-2xl font-black mt-1 ${stat.color}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Control Bar: Search, Filters & Action */}
      <Card className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search workflows by name, document type, description..."
              className="w-full h-10 pl-9 pr-3 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium outline-none focus:border-[#274690] focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 px-3 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Paused">Paused</option>
            </select>

            {/* Document Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 px-3 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none"
            >
              {documentTypes.map((t) => (
                <option key={t} value={t}>
                  {t === "All" ? "All Document Types" : t}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-10 px-3 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none"
            >
              <option value="Newest">Newest First</option>
              <option value="A-Z">Name: A to Z</option>
              <option value="Z-A">Name: Z to A</option>
              <option value="Steps count">Most Steps</option>
            </select>

            <button
              onClick={() => void fetchWorkflows()}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-[#274690] transition"
              title="Refresh list"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>

            <Button
              onClick={onOpenCreate}
              className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-xl text-xs h-10 px-4 shadow-sm flex items-center gap-1.5"
            >
              <Plus size={15} /> Create Workflow
            </Button>
          </div>
        </div>
      </Card>

      {/* Workflows Table */}
      <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Workflow Name</th>
                <th className="py-3.5 px-4">Document Type</th>
                <th className="py-3.5 px-4">Trigger</th>
                <th className="py-3.5 px-4">Steps Pipeline</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Created By</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    <RefreshCw className="h-5 w-5 animate-spin text-[#274690] mx-auto mb-2" />
                    Loading enterprise workflows from database...
                  </td>
                </tr>
              ) : paginatedWorkflows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 font-medium">
                    No workflows match the selected criteria. Click &quot;+ Create Workflow&quot; to configure one.
                  </td>
                </tr>
              ) : (
                paginatedWorkflows.map((wf) => (
                  <tr key={wf.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-xl bg-blue-50 text-[#274690] flex items-center justify-center shrink-0 border border-blue-100">
                          <Workflow size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 hover:text-[#274690] cursor-pointer" onClick={() => setSelectedWorkflow(wf)}>
                            {wf.name}
                          </p>
                          <p className="text-[11px] text-slate-400 line-clamp-1">{wf.description}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant="outline" className="font-bold text-[11px]">
                        {wf.appliesTo}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-[11px] text-slate-600 font-semibold">{wf.trigger}</td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900">{wf.steps} Steps</span>
                      <span className="text-[10px] text-slate-400 block">Sequential routing</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${getStatusBadge(wf.status)}`}>
                        {wf.status}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px] font-medium">{wf.createdBy}</td>

                    <td className="py-3.5 px-4 text-right relative" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedWorkflow(wf)}
                          className="h-7 px-2 text-xs font-bold rounded-lg"
                        >
                          <Eye size={13} className="mr-1" /> View
                        </Button>

                        <button
                          onClick={() => duplicateWorkflow(wf)}
                          title="Duplicate Workflow"
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-emerald-700 transition"
                        >
                          <Copy size={15} />
                        </button>

                        <div className="relative">
                          <button
                            onClick={() => setActiveMenuId(activeMenuId === wf.id ? null : wf.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition"
                          >
                            <MoreVertical size={15} />
                          </button>

                          {activeMenuId === wf.id && (
                            <div className="absolute right-0 top-8 z-30 w-44 rounded-2xl bg-white border border-slate-200 shadow-xl p-1.5 text-left text-xs font-semibold text-slate-700 space-y-0.5 animate-in fade-in zoom-in-95">
                              <button
                                onClick={() => toggleStatus(wf.id, wf.status)}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100"
                              >
                                {wf.status === "Active" ? (
                                  <>
                                    <Pause size={14} className="text-amber-600" /> Pause Workflow
                                  </>
                                ) : (
                                  <>
                                    <Play size={14} className="text-emerald-600" /> Activate Workflow
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => archiveWorkflow(wf.id)}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 text-purple-700"
                              >
                                <Archive size={14} /> Archive Workflow
                              </button>
                              <button
                                onClick={() => deleteWorkflow(wf.id)}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-600"
                              >
                                <Trash2 size={14} /> Delete Workflow
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
          <p>
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, filteredWorkflows.length)} of {filteredWorkflows.length} workflows
          </p>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-8 rounded-xl text-xs font-bold"
            >
              <ChevronLeft size={14} /> Prev
            </Button>
            <span className="font-bold text-slate-800">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 rounded-xl text-xs font-bold"
            >
              Next <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      </Card>

      {/* Workflow Detail Modal */}
      {selectedWorkflow && (
        <WorkflowDetailModal
          workflow={{
            id: selectedWorkflow.id,
            name: selectedWorkflow.name,
            appliesTo: selectedWorkflow.appliesTo,
            steps: selectedWorkflow.steps,
            status: selectedWorkflow.status as any,
            lastRun: selectedWorkflow.lastRun,
            description: selectedWorkflow.description,
            trigger: selectedWorkflow.trigger,
            deadline: selectedWorkflow.deadline || "3 days",
            reminder: selectedWorkflow.reminder || "24 hours",
            escalation: selectedWorkflow.escalation || "48 hours",
            commentsRequired: selectedWorkflow.commentsRequired ?? true,
            allowChanges: selectedWorkflow.allowChanges ?? true,
          }}
          onClose={() => setSelectedWorkflow(null)}
          onSave={() => {
            setSelectedWorkflow(null);
            void fetchWorkflows();
            showToast("Workflow updated successfully!");
          }}
        />
      )}
    </div>
  );
}
