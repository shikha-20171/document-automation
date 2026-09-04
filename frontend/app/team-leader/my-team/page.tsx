"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Briefcase,
  Mail,
  Phone,
  ShieldCheck,
  ChevronRight,
  Eye,
  Activity,
  X,
  FileText,
  Plus,
  Send,
  Sparkles,
  BarChart3,
  Calendar,
  CheckSquare,
  MessageSquare,
  FileCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { teamsApi } from "@/services/teamsApi";

export default function TeamLeaderMyTeamPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successToast, setSuccessToast] = useState("");

  const [teamInfo, setTeamInfo] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Detail Profile Drawer
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [employeeProfileData, setEmployeeProfileData] = useState<any | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileTab, setProfileTab] = useState<"BASIC" | "TASKS" | "DOCS" | "PERFORMANCE">("BASIC");

  // Work Assignment Modal
  const [isAssignWorkOpen, setIsAssignWorkOpen] = useState(false);
  const [targetEmployee, setTargetEmployee] = useState<any | null>(null);
  const [workTitle, setWorkTitle] = useState("");
  const [workType, setWorkType] = useState<"TASK" | "DOCUMENT">("TASK");
  const [workPriority, setWorkPriority] = useState("NORMAL");
  const [workInstructions, setWorkInstructions] = useState("");
  const [workDue, setWorkDue] = useState("");

  // Message Modal
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [messageSubject, setMessageSubject] = useState("");
  const [messageText, setMessageText] = useState("");

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 4000);
  };

  const fetchTeam = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await teamsApi.getTeamOverview();
      if (res?.data) {
        setTeamInfo(res.data.teamInfo);
        setEmployees(res.data.employees || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load team overview.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTeam();
  }, []);

  const openEmployeeProfile = async (emp: any) => {
    setSelectedEmployee(emp);
    setProfileTab("BASIC");
    setProfileLoading(true);
    try {
      const res = await teamsApi.getEmployeeProfile(emp.id);
      if (res?.data) {
        setEmployeeProfileData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleOpenAssignWork = (emp: any) => {
    setTargetEmployee(emp);
    setWorkTitle("");
    setWorkInstructions("");
    setWorkPriority("NORMAL");
    setWorkDue(new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0]);
    setIsAssignWorkOpen(true);
  };

  const handleAssignWorkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmployee || !workTitle.trim()) return;
    try {
      const res = await teamsApi.assignWork({
        employeeId: targetEmployee.id,
        employeeName: targetEmployee.name,
        employeeEmail: targetEmployee.email,
        sendEmail: true,
        type: workType,
        title: workTitle.trim(),
        priority: workPriority,
        instructions: workInstructions.trim(),
        dueDate: workDue,
      });
      showToast(res?.message || `Work assigned to ${targetEmployee.name}! Notification email sent to ${targetEmployee.email}`);
      setIsAssignWorkOpen(false);
      void fetchTeam();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign work.");
    }
  };

  const handleOpenMessage = (emp: any) => {
    setTargetEmployee(emp);
    setMessageSubject(`Operational Notice: ${emp.name}`);
    setMessageText("");
    setIsMessageOpen(true);
  };

  const handleSendMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmployee || !messageText.trim()) return;
    try {
      const res = await teamsApi.sendMessage({
        employeeId: targetEmployee.id,
        message: messageText.trim(),
        subject: messageSubject.trim(),
      });
      showToast(res?.message || `Message sent to ${targetEmployee.name}!`);
      setIsMessageOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message.");
    }
  };

  const filteredEmployees = useMemo(() => {
    let list = [...employees];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.designation.toLowerCase().includes(q) ||
          e.employeeId.toLowerCase().includes(q)
      );
    }
    if (selectedStatus !== "ALL") {
      list = list.filter((e) => e.status === selectedStatus);
    }
    return list;
  }, [employees, searchQuery, selectedStatus]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-20 font-sans text-slate-800">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-[#274690] sm:text-3xl">My Team</h1>
            <Badge className="bg-[#c96f4a]/10 text-[#c96f4a] border-[#c96f4a]/30 text-xs font-black px-2.5 py-0.5">
              {teamInfo?.name || "Financial Operations"}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-semibold">
            {teamInfo?.department || "Operations & Logistics"} • Managed by <strong>{teamInfo?.teamLead || "Team Leader"}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-[#274690]/20 bg-[#274690]/5 px-3.5 py-1.5 text-xs font-bold text-[#274690]">
            Staff Creation Managed by <strong className="text-[#c96f4a]">Department Manager / Admin</strong>
          </div>
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

      {/* 2. TEAM OVERVIEW BANNER */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:border-[#274690]/40 transition">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Associates</span>
          <p className="mt-1 text-2xl font-black text-[#274690]">{teamInfo?.totalMembers || employees.length}</p>
          <span className="mt-0.5 block text-[10px] font-semibold text-slate-400">Allocated to Team</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:border-[#274690]/40 transition">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Active Members</span>
          <p className="mt-1 text-2xl font-black text-[#274690]">{teamInfo?.activeMembers || employees.length}</p>
          <span className="mt-0.5 block text-[10px] font-semibold text-slate-400">Online & Operational</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:border-[#274690]/40 transition">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Avg Completion Time</span>
          <p className="mt-1 text-2xl font-black text-[#274690]">{teamInfo?.performance?.avgCompletionHours || "3.2"}h</p>
          <span className="mt-0.5 block text-[10px] font-semibold text-slate-400">Per Task Average</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:border-[#274690]/40 transition">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Team SLA Rate</span>
          <p className="mt-1 text-2xl font-black text-[#274690]">{teamInfo?.performance?.completionRate || "94.5"}%</p>
          <span className="mt-0.5 block text-[10px] font-semibold text-slate-400">On-Time Accuracy</span>
        </div>
      </section>

      {/* 3. SEARCH & FILTERS */}
      <section className="flex flex-col gap-3 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search associates by name, email, designation, or ID..."
            className="pl-10 h-10 rounded-2xl text-xs font-semibold focus:border-[#274690]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 focus:border-[#274690] focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Associates</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </section>

      {/* 4. EMPLOYEE TABLE */}
      <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Employee Name & ID</th>
                <th className="px-4 py-3.5">Designation</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-center">Tasks (Assigned/Pending/Done)</th>
                <th className="px-4 py-3.5 text-center">Documents</th>
                <th className="px-4 py-3.5">Last Activity</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="transition hover:bg-[#274690]/5">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-[#274690] to-[#c96f4a] text-xs font-black text-white shrink-0 shadow-xs">
                        {(emp.name || "E").charAt(0)}
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900">{emp.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{emp.employeeId} • {emp.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-slate-800 font-bold">{emp.designation}</td>

                  <td className="px-4 py-4">
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-black">
                      {emp.status}
                    </Badge>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-[11px]">
                      <span className="rounded-lg bg-[#274690]/10 px-1.5 py-0.5 font-bold text-[#274690]" title="Assigned">{emp.assignedTasks}</span>
                      <span className="text-slate-300">/</span>
                      <span className="rounded-lg bg-[#c96f4a]/10 px-1.5 py-0.5 font-bold text-[#c96f4a]" title="Pending">{emp.pendingTasks}</span>
                      <span className="text-slate-300">/</span>
                      <span className="rounded-lg bg-emerald-50 px-1.5 py-0.5 font-bold text-emerald-700" title="Completed">{emp.completedTasks}</span>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <span className="font-bold text-slate-800">{emp.documentsCount} docs</span>
                  </td>

                  <td className="px-4 py-4 text-[11px] text-slate-500 max-w-50 truncate">
                    {emp.lastActivity}
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEmployeeProfile(emp)}
                        className="h-8 rounded-xl border-slate-200 text-[11px] font-bold text-slate-700 hover:border-[#274690]/40 hover:text-[#274690] px-2.5"
                      >
                        <Eye size={13} className="mr-1 text-[#274690]" /> View
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => handleOpenAssignWork(emp)}
                        className="h-8 rounded-xl bg-[#274690] text-[11px] font-black text-white hover:bg-[#1f3561] px-2.5"
                      >
                        <Plus size={13} className="mr-1" /> Assign Work
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenMessage(emp)}
                        className="h-8 rounded-xl border-slate-200 text-[11px] font-bold text-[#c96f4a] hover:bg-[#c96f4a]/10 px-2"
                        title="Send Message"
                      >
                        <MessageSquare size={13} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. EMPLOYEE PROFILE MODAL / DRAWER */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl border border-[#274690]/20 max-h-[90vh] overflow-y-auto space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-[#274690] to-[#c96f4a] text-lg font-black text-white shadow-md">
                  {(selectedEmployee.name || "E").charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#274690]">{selectedEmployee.name}</h3>
                  <p className="text-xs font-bold text-[#c96f4a]">
                    {selectedEmployee.designation} • {selectedEmployee.employeeId}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEmployee(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            {/* Profile Tabs */}
            <div className="flex border-b border-slate-100 space-x-2">
              <button
                type="button"
                onClick={() => setProfileTab("BASIC")}
                className={`pb-2 px-3 text-xs font-bold transition border-b-2 ${
                  profileTab === "BASIC" ? "border-[#274690] text-[#274690]" : "border-transparent text-slate-400"
                }`}
              >
                Basic & Contact Info
              </button>
              <button
                type="button"
                onClick={() => setProfileTab("TASKS")}
                className={`pb-2 px-3 text-xs font-bold transition border-b-2 ${
                  profileTab === "TASKS" ? "border-[#274690] text-[#274690]" : "border-transparent text-slate-400"
                }`}
              >
                Assigned Tasks ({employeeProfileData?.assignedTasks?.length || selectedEmployee.assignedTasks})
              </button>
              <button
                type="button"
                onClick={() => setProfileTab("DOCS")}
                className={`pb-2 px-3 text-xs font-bold transition border-b-2 ${
                  profileTab === "DOCS" ? "border-[#274690] text-[#274690]" : "border-transparent text-slate-400"
                }`}
              >
                Documents ({employeeProfileData?.documents?.length || selectedEmployee.documentsCount})
              </button>
              <button
                type="button"
                onClick={() => setProfileTab("PERFORMANCE")}
                className={`pb-2 px-3 text-xs font-bold transition border-b-2 ${
                  profileTab === "PERFORMANCE" ? "border-[#274690] text-[#274690]" : "border-transparent text-slate-400"
                }`}
              >
                Performance Score
              </button>
            </div>

            {/* TAB CONTENT */}
            {profileTab === "BASIC" && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Email Address</span>
                    <p className="font-extrabold text-slate-900 mt-0.5">{selectedEmployee.email}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</span>
                    <p className="font-extrabold text-slate-900 mt-0.5">{selectedEmployee.phone}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Department</span>
                    <p className="font-extrabold text-slate-900 mt-0.5">{selectedEmployee.department}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Joined Date</span>
                    <p className="font-extrabold text-slate-900 mt-0.5">{selectedEmployee.joinedDate}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 p-4 space-y-2">
                  <h4 className="font-black text-slate-900 text-xs">Recent Activity Timeline</h4>
                  {employeeProfileData?.activityHistory?.map((act: any, i: number) => (
                    <div key={i} className="flex justify-between text-[11px] py-1 border-b border-slate-50 last:border-none">
                      <span className="font-bold text-slate-700">{act.details}</span>
                      <span className="text-slate-400">{act.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {profileTab === "TASKS" && (
              <div className="space-y-2.5 max-h-64 overflow-y-auto">
                {(employeeProfileData?.assignedTasks?.length ? employeeProfileData.assignedTasks : []).map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 bg-slate-50/60">
                    <div>
                      <p className="text-xs font-black text-slate-900">{t.title}</p>
                      <p className="text-[10px] text-slate-500 font-semibold">Due: {t.dueDate} • Priority: {t.priority}</p>
                    </div>
                    <Badge className="text-[10px] font-bold">{t.status}</Badge>
                  </div>
                ))}
              </div>
            )}

            {profileTab === "DOCS" && (
              <div className="space-y-2.5 max-h-64 overflow-y-auto">
                {(employeeProfileData?.documents?.length ? employeeProfileData.documents : []).map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 bg-slate-50/60">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-[#274690]" />
                      <div>
                        <p className="text-xs font-black text-slate-900">{d.name}</p>
                        <p className="text-[10px] text-slate-500 font-semibold">{d.type} • {d.version}</p>
                      </div>
                    </div>
                    <Badge className="text-[10px] font-bold">{d.status}</Badge>
                  </div>
                ))}
              </div>
            )}

            {profileTab === "PERFORMANCE" && (
              <div className="rounded-2xl bg-[#274690]/5 p-4 border border-[#274690]/15 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#274690]">Overall Accuracy & Speed Rating</span>
                  <span className="text-xl font-black text-[#c96f4a]">{selectedEmployee.performanceScore || 94}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full rounded-full bg-linear-to-r from-[#274690] to-[#c96f4a]" style={{ width: `${selectedEmployee.performanceScore || 94}%` }} />
                </div>
                <p className="text-[11px] text-slate-600 font-medium">
                  {selectedEmployee.name} is consistently meeting SLA milestones with high accuracy on document reviews.
                </p>
              </div>
            )}

            {/* Modal Footer Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setSelectedEmployee(null)} className="rounded-xl">
                Close Profile
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  const emp = selectedEmployee;
                  setSelectedEmployee(null);
                  handleOpenAssignWork(emp);
                }}
                className="rounded-xl bg-[#274690] text-xs font-black text-white hover:bg-[#1f3561]"
              >
                Assign Work
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 6. ASSIGN WORK MODAL */}
      {isAssignWorkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-[#274690]/20 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-[#274690]">Assign Work to {targetEmployee?.name}</h3>
              <button type="button" onClick={() => setIsAssignWorkOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignWorkSubmit} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-black uppercase text-slate-600">Assignment Title *</label>
                <Input
                  required
                  value={workTitle}
                  onChange={(e) => setWorkTitle(e.target.value)}
                  placeholder="e.g. Audit Q3 Master Services Agreement"
                  className="mt-1 h-10 rounded-xl text-xs font-semibold focus:border-[#274690]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-600">Type</label>
                  <select
                    value={workType}
                    onChange={(e) => setWorkType(e.target.value as any)}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold"
                  >
                    <option value="TASK">General Task</option>
                    <option value="DOCUMENT">Document Review</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-600">Priority</label>
                  <select
                    value={workPriority}
                    onChange={(e) => setWorkPriority(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High Priority</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-600">Due Date</label>
                <Input
                  type="date"
                  value={workDue}
                  onChange={(e) => setWorkDue(e.target.value)}
                  className="mt-1 h-10 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-600">Instructions / Notes</label>
                <textarea
                  value={workInstructions}
                  onChange={(e) => setWorkInstructions(e.target.value)}
                  placeholder="Provide detailed instructions for the associate..."
                  className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-xs font-semibold focus:border-[#274690] focus:outline-none"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsAssignWorkOpen(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button size="sm" type="submit" className="rounded-xl bg-[#274690] text-xs font-black text-white hover:bg-[#1f3561]">
                  Assign Work
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MESSAGE MODAL */}
      {isMessageOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-[#274690]/20 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-[#274690]">Send Notification to {targetEmployee?.name}</h3>
              <button type="button" onClick={() => setIsMessageOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendMessageSubmit} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-black uppercase text-slate-600">Subject</label>
                <Input
                  required
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  className="mt-1 h-10 rounded-xl text-xs font-semibold focus:border-[#274690]"
                />
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-600">Message Content *</label>
                <textarea
                  required
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message or instruction here..."
                  className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-xs font-semibold focus:border-[#274690] focus:outline-none"
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsMessageOpen(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button size="sm" type="submit" className="rounded-xl bg-[#c96f4a] text-xs font-black text-white hover:bg-[#b05835]">
                  <Send size={13} className="mr-1.5" /> Dispatch Message
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
