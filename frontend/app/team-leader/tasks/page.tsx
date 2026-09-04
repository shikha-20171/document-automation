"use client";

import { useEffect, useState } from "react";
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  AlertTriangle,
  FileText,
  UserCheck,
  User,
  ArrowRight,
  MoreVertical,
  Layers,
  X,
  Send,
  Mail,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { tasksApi } from "@/services/tasksApi";

const defaultEmployees = [
  { id: "emp-101", name: "Aakash Verma", email: "aakash.v@docucore.ai", role: "Senior Operations Analyst" },
  { id: "emp-102", name: "Priya Sharma", email: "priya.s@docucore.ai", role: "Legal Compliance Associate" },
  { id: "emp-103", name: "Rohan Das", email: "rohan.d@docucore.ai", role: "Financial Document Specialist" },
  { id: "emp-104", name: "Neha Kapoor", email: "neha.k@docucore.ai", role: "Operations Executive" },
  { id: "emp-105", name: "Vikram Mehta", email: "vikram.m@docucore.ai", role: "Tax & Compliance Auditor" },
  { id: "emp-106", name: "Ananya Roy", email: "ananya.r@docucore.ai", role: "Junior Analyst" },
];

export default function TeamLeaderTasksPage() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0 });
  const [error, setError] = useState("");
  const [successToast, setSuccessToast] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedPriority, setSelectedPriority] = useState("ALL");

  // Create Task Modal State
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("emp-101");
  const [employeeName, setEmployeeName] = useState("Aakash Verma");
  const [employeeEmail, setEmployeeEmail] = useState("aakash.v@docucore.ai");
  const [sendEmailInvite, setSendEmailInvite] = useState(true);
  const [priority, setPriority] = useState("NORMAL");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");

  // Edit / Status Modal State
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editPriority, setEditPriority] = useState("");

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 4000);
  };

  const fetchTasks = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await tasksApi.getTeamTasks({
        status: selectedStatus,
        priority: selectedPriority,
        search: searchQuery,
      });
      if (res?.data) {
        setTasks(res.data);
        if ((res as any).stats) setStats((res as any).stats);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTasks();
  }, [selectedStatus, selectedPriority]);

  const handleMemberSelect = (empId: string) => {
    setAssigneeId(empId);
    if (empId === "custom") {
      setEmployeeName("");
      setEmployeeEmail("");
    } else {
      const found = defaultEmployees.find((m) => m.id === empId);
      if (found) {
        setEmployeeName(found.name);
        setEmployeeEmail(found.email);
      }
    }
  };

  const handleCreateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const res = await tasksApi.createTask({
        title: title.trim(),
        description: description.trim(),
        assignToId: assigneeId,
        employeeName: employeeName.trim() || "Team Associate",
        employeeEmail: employeeEmail.trim() || undefined,
        sendEmail: sendEmailInvite,
        priority,
        startDate: startDate || new Date().toISOString().split("T")[0],
        dueDate: dueDate || new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
      });
      showToast(res?.message || `Task assigned to ${employeeName}!`);
      setIsCreateTaskOpen(false);
      setTitle("");
      setDescription("");
      void fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task.");
    }
  };

  const handleUpdateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    try {
      const res = await tasksApi.updateTask(selectedTask.id, {
        status: editStatus,
        priority: editPriority,
      });
      showToast(res?.message || "Task updated successfully!");
      setSelectedTask(null);
      void fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-20 font-sans text-slate-800">
      {/* 1. HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-[#274690] sm:text-3xl">Task Management</h1>
            <Badge className="bg-[#c96f4a]/10 text-[#c96f4a] border-[#c96f4a]/30 text-xs font-black px-2.5 py-0.5">
              Work Tracking
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-semibold">
            Manage associate task lifecycle: Pending → In Progress → Submitted → Completed
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            onClick={() => setIsCreateTaskOpen(true)}
            className="h-10 rounded-xl bg-[#274690] px-4 text-xs font-black text-white hover:bg-[#1f3561] shadow-sm gap-1.5"
          >
            <Plus size={15} /> Create Task
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

      {/* 2. COMPACT STATS CARDS (ALL NUMBERS IN CLEAN #274690) */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:border-[#274690]/40 transition">
          <span className="text-[10px] font-black uppercase text-slate-400">Total Tasks</span>
          <p className="mt-1 text-2xl font-black text-[#274690]">{stats.total || tasks.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:border-[#274690]/40 transition">
          <span className="text-[10px] font-black uppercase text-slate-400">Pending</span>
          <p className="mt-1 text-2xl font-black text-[#274690]">{stats.pending}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:border-[#274690]/40 transition">
          <span className="text-[10px] font-black uppercase text-slate-400">In Progress</span>
          <p className="mt-1 text-2xl font-black text-[#274690]">{stats.inProgress}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:border-[#274690]/40 transition">
          <span className="text-[10px] font-black uppercase text-slate-400">Completed</span>
          <p className="mt-1 text-2xl font-black text-[#274690]">{stats.completed}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:border-[#274690]/40 transition">
          <span className="text-[10px] font-black uppercase text-slate-400">Overdue</span>
          <p className="mt-1 text-2xl font-black text-[#274690]">{stats.overdue || 1}</p>
        </div>
      </section>

      {/* 3. FILTERS BAR */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks by title, associate, or notes..."
            className="pl-9 h-9 rounded-xl text-xs font-semibold focus:border-[#274690]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 focus:border-[#274690] focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="SUBMITTED">Submitted for Review</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 focus:border-[#274690] focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
      </div>

      {/* 4. TASK LIST TABLE */}
      <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Task Title & Details</th>
                <th className="px-4 py-3.5">Assigned Associate</th>
                <th className="px-4 py-3.5">Related Doc</th>
                <th className="px-4 py-3.5">Priority</th>
                <th className="px-4 py-3.5">Due Date</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                    No tasks found matching criteria.
                  </td>
                </tr>
              ) : (
                tasks.map((task) => {
                  const assignedName = task.assignedTo || task.assigned_to || "Associate";
                  const assignedEmail = task.assignedEmail || task.assigned_email || "";
                  const docName = task.relatedDocName || task.related_doc_name || "";
                  const dueDate = task.dueDate || task.due_date || "No due date";
                  const priority = task.priority || "NORMAL";
                  const status = task.status || "PENDING";
                  const initial = (assignedName || "A").charAt(0).toUpperCase();

                  return (
                    <tr key={task.id} className="transition hover:bg-[#274690]/5">
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-extrabold text-slate-900">{task.title}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-1">{task.description}</p>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#274690]/10 text-[10px] font-black text-[#274690]">
                            {initial}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 leading-tight">{assignedName}</p>
                            {assignedEmail && <p className="text-[10px] text-slate-400">{assignedEmail}</p>}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        {docName ? (
                          <span className="font-bold text-[#274690] truncate max-w-[150px] inline-block">
                            {docName}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <Badge
                          className={`text-[9px] font-black ${
                            priority === "CRITICAL"
                              ? "bg-rose-100 text-rose-700"
                              : priority === "HIGH"
                              ? "bg-[#c96f4a]/15 text-[#c96f4a] border-[#c96f4a]/30"
                              : "bg-[#274690]/10 text-[#274690] border-[#274690]/20"
                          }`}
                        >
                          {priority}
                        </Badge>
                      </td>

                      <td className="px-4 py-4 text-[11px] font-bold text-slate-600">{dueDate}</td>

                      <td className="px-4 py-4">
                        <Badge
                          className={`text-[9px] font-black ${
                            status === "COMPLETED"
                              ? "bg-emerald-100 text-emerald-800"
                              : status === "IN_PROGRESS"
                              ? "bg-[#274690]/10 text-[#274690]"
                              : status === "SUBMITTED"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {status}
                        </Badge>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedTask(task);
                            setEditStatus(status);
                            setEditPriority(priority);
                          }}
                          className="h-8 rounded-xl text-[11px] font-bold text-[#274690] border-[#274690]/30 hover:bg-[#274690]/5"
                        >
                          Manage
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. CREATE TASK MODAL WITH GMAIL & DIRECT LOGIN LINK DISPATCH */}
      {isCreateTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-[#274690]/20 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-[#274690] flex items-center gap-2">
                <CheckSquare size={18} className="text-[#c96f4a]" /> Assign Task to Team Associate
              </h3>
              <button type="button" onClick={() => setIsCreateTaskOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTaskSubmit} className="space-y-3.5">
              {/* Employee Selection */}
              <div>
                <label className="text-[11px] font-black uppercase text-slate-600">Select Associate / Custom Employee *</label>
                <select
                  value={assigneeId}
                  onChange={(e) => handleMemberSelect(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 focus:border-[#274690]"
                >
                  {defaultEmployees.map((m) => (
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
                    value={employeeName}
                    onChange={(e) => setEmployeeName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="mt-1 h-10 rounded-xl text-xs font-semibold focus:border-[#274690]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-600">Employee Gmail / Email *</label>
                  <Input
                    type="email"
                    required
                    value={employeeEmail}
                    onChange={(e) => setEmployeeEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="mt-1 h-10 rounded-xl text-xs font-semibold focus:border-[#274690]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-600">Task Title *</label>
                <Input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Verify Vendor Invoice Tax Reconciliation"
                  className="mt-1 h-10 rounded-xl text-xs font-semibold focus:border-[#274690]"
                />
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-600">Description & Guidelines</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Specific tasks, line items to audit, and notes..."
                  className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-xs font-semibold focus:border-[#274690] focus:outline-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-600">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-600">Due Date</label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
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

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsCreateTaskOpen(false)} className="rounded-xl">
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

      {/* 6. MANAGE / EDIT TASK MODAL */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-[#274690]/20 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-[#274690]">Manage Task</h3>
              <button type="button" onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateTaskSubmit} className="space-y-3.5">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Title</span>
                <p className="font-extrabold text-slate-900 text-xs mt-0.5">{selectedTask.title}</p>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-600">Change Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 focus:border-[#274690]"
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="SUBMITTED">Submitted for Review</option>
                  <option value="COMPLETED">Completed & Verified</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-600">Change Priority</label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 focus:border-[#274690]"
                >
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setSelectedTask(null)} className="rounded-xl">
                  Cancel
                </Button>
                <Button size="sm" type="submit" className="rounded-xl bg-[#274690] text-xs font-bold text-white hover:bg-[#1f3561]">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
