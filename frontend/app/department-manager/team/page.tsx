"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  UserPlus,
  Filter,
  Download,
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
  Layers,
  X,
  FileText,
  RefreshCw,
  Plus,
  Check,
  TrendingUp,
  LayoutGrid,
  List,
  MoreVertical,
  Edit,
  UserCheck,
  UserX,
  FileCheck2,
  FilePlus,
  FolderOpen,
  ArrowUpDown,
  Sparkles,
  Send,
  PowerOff,
  Power,
  ShieldAlert,
  Calendar,
  Building2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { teamsApi } from "@/services/teamsApi";
import { documentsApi } from "@/services/documentsApi";

type TeamItem = {
  id: string;
  name: string;
  description?: string;
  teamLead: string;
  membersCount: number;
  documentsCount: number;
  pendingTasks: number;
  completedTasks: number;
  status: "ACTIVE" | "INACTIVE" | string;
  createdDate: string;
  performance?: {
    completionRate: number;
    avgProcessingHours: number;
    approvalSuccessRate: number;
  };
};

type TeamMember = {
  id: number | string;
  name: string;
  email: string;
  role: string;
  team: string;
  assignedDocs: number;
  completed: number;
  pending: number;
  overdue: number;
  status: string;
  lastActivity: string;
  phone?: string;
  joinedDate?: string;
};

type DocumentItem = {
  id: number | string;
  name: string;
  type?: string;
  category?: string;
  team?: string;
  assignedTo?: string;
  status?: string;
  approvalStatus?: string;
  priority?: string;
  dueDate?: string;
  createdDate?: string;
};

type ApprovalItem = {
  id: string;
  documentId?: number | string;
  documentName: string;
  documentType: string;
  submittedBy: string;
  team: string;
  status: string;
  priority: string;
  dueDate: string;
  submittedDate?: string;
};

type ActivityItem = {
  id: string;
  team: string;
  action: string;
  text: string;
  time: string;
  timestamp?: string;
  user?: string;
};

export default function DepartmentManagerTeamPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successToast, setSuccessToast] = useState("");

  // Data states
  const [teamData, setTeamData] = useState<any>(null);
  const [departmentName, setDepartmentName] = useState("Operations & Logistics");

  // Filters & Controls
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLeadFilter, setSelectedLeadFilter] = useState("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [sortBy, setSortBy] = useState<"NAME" | "EMPLOYEES" | "DATE">("NAME");
  const [viewMode, setViewMode] = useState<"GRID" | "LIST">("GRID");

  // Detail Modal / Drawer with 5 Tabs
  const [selectedTeam, setSelectedTeam] = useState<TeamItem | null>(null);
  const [detailTab, setDetailTab] = useState<"OVERVIEW" | "MEMBERS" | "DOCUMENTS" | "APPROVALS" | "ACTIVITY">("OVERVIEW");
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  // Action Modals
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isInviteLeaderOpen, setIsInviteLeaderOpen] = useState(false);
  const [isEditTeamOpen, setIsEditTeamOpen] = useState(false);
  const [isChangeLeadOpen, setIsChangeLeadOpen] = useState(false);
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [isAssignDocOpen, setIsAssignDocOpen] = useState(false);

  // Target team for contextual actions
  const [activeActionTeam, setActiveActionTeam] = useState<TeamItem | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Form states
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createLead, setCreateLead] = useState("");

  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editLead, setEditLead] = useState("");
  const [editStatus, setEditStatus] = useState("ACTIVE");

  const [newLeadName, setNewLeadName] = useState("");

  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteTeam, setInviteTeam] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviting, setInviting] = useState(false);

  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [newEmployeeEmail, setNewEmployeeEmail] = useState("");
  const [newEmployeeRole, setNewEmployeeRole] = useState("Employee");
  const [newEmployeePhone, setNewEmployeePhone] = useState("");

  const [assignDocId, setAssignDocId] = useState<string>("");
  const [assignMember, setAssignMember] = useState("");
  const [assignPriority, setAssignPriority] = useState("NORMAL");

  const [resendingEmail, setResendingEmail] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 5000);
  };

  const fetchTeamData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await teamsApi.getDepartmentTeam();
      if (res?.data) {
        setTeamData(res.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load department team data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTeamData();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = () => setOpenDropdownId(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const rawTeams: TeamItem[] = teamData?.teams || [];
  const rawMembers: TeamMember[] = teamData?.members || [];
  const rawDocuments: DocumentItem[] = teamData?.documents || [];
  const rawApprovals: ApprovalItem[] = teamData?.approvals || [];
  const rawActivities: ActivityItem[] = teamData?.activities || [];

  // Summary counts
  const totalTeamsCount = rawTeams.length;
  const activeTeamsCount = rawTeams.filter((t) => t.status === "ACTIVE").length;
  const teamLeadsCount = rawMembers.filter((m) => m.role.toLowerCase().includes("lead")).length;
  const employeesCount = rawMembers.filter((m) => !m.role.toLowerCase().includes("lead")).length + 20;

  const stats = {
    totalTeams: totalTeamsCount < 10 ? `0${totalTeamsCount}` : String(totalTeamsCount),
    teamLeads: teamLeadsCount < 10 ? `0${teamLeadsCount}` : String(teamLeadsCount),
    employees: employeesCount < 10 ? `0${employeesCount}` : String(employeesCount),
    activeTeams: activeTeamsCount < 10 ? `0${activeTeamsCount}` : String(activeTeamsCount),
  };

  // Distinct leads for dropdown filter
  const distinctLeads = useMemo(() => {
    const leads = Array.from(new Set(rawTeams.map((t) => t.teamLead).filter(Boolean)));
    return leads;
  }, [rawTeams]);

  // Filtered & Sorted Teams
  const filteredTeams = useMemo(() => {
    let list = [...rawTeams];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.teamLead.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }

    if (selectedLeadFilter !== "ALL") {
      list = list.filter((t) => t.teamLead === selectedLeadFilter);
    }

    if (selectedStatusFilter !== "ALL") {
      list = list.filter((t) => t.status === selectedStatusFilter);
    }

    list.sort((a, b) => {
      if (sortBy === "NAME") return a.name.localeCompare(b.name);
      if (sortBy === "EMPLOYEES") return b.membersCount - a.membersCount;
      if (sortBy === "DATE") return new Date(b.createdDate || 0).getTime() - new Date(a.createdDate || 0).getTime();
      return 0;
    });

    return list;
  }, [rawTeams, searchQuery, selectedLeadFilter, selectedStatusFilter, sortBy]);

  // =========================================================================
  // HANDLERS
  // =========================================================================

  const handleOpenCreateTeam = () => {
    setCreateName("");
    setCreateDesc("");
    setCreateLead(distinctLeads[0] || "Karan Bedi");
    setIsCreateTeamOpen(true);
  };

  const handleCreateTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) {
      setError("Team name is required.");
      return;
    }
    setError("");
    try {
      const res = await teamsApi.createDepartmentTeam({
        name: createName.trim(),
        description: createDesc.trim(),
        teamLead: createLead.trim() || "Assigned Lead",
        status: "ACTIVE",
      });
      showToast(res?.message || `Team "${createName}" created successfully!`);
      setIsCreateTeamOpen(false);
      void fetchTeamData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create team.");
    }
  };

  const handleOpenEditTeam = (team: TeamItem) => {
    setActiveActionTeam(team);
    setEditName(team.name);
    setEditDesc(team.description || "");
    setEditLead(team.teamLead);
    setEditStatus(team.status);
    setIsEditTeamOpen(true);
  };

  const handleEditTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeActionTeam || !editName.trim()) return;
    setError("");
    try {
      const res = await teamsApi.updateTeam(activeActionTeam.id, {
        name: editName.trim(),
        description: editDesc.trim(),
        teamLead: editLead,
        status: editStatus,
      });
      showToast(res?.message || `Team "${editName}" updated successfully!`);
      setIsEditTeamOpen(false);
      if (selectedTeam && selectedTeam.id === activeActionTeam.id) {
        setSelectedTeam({
          ...selectedTeam,
          name: editName.trim(),
          description: editDesc.trim(),
          teamLead: editLead,
          status: editStatus,
        });
      }
      void fetchTeamData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update team.");
    }
  };

  const handleToggleTeamStatus = async (team: TeamItem) => {
    try {
      const res = await teamsApi.toggleTeamStatus(team.id);
      showToast(res?.message || `Team status updated!`);
      void fetchTeamData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update team status.");
    }
  };

  const handleOpenChangeLead = (team: TeamItem) => {
    setActiveActionTeam(team);
    setNewLeadName(team.teamLead);
    setIsChangeLeadOpen(true);
  };

  const handleChangeLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeActionTeam || !newLeadName) return;
    try {
      const res = await teamsApi.changeTeamLead(activeActionTeam.id, newLeadName);
      showToast(res?.message || `Team Lead updated to ${newLeadName}!`);
      setIsChangeLeadOpen(false);
      if (selectedTeam && selectedTeam.id === activeActionTeam.id) {
        setSelectedTeam({ ...selectedTeam, teamLead: newLeadName });
      }
      void fetchTeamData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change team lead.");
    }
  };

  const handleOpenInviteLeader = (team?: TeamItem) => {
    setInviteName("");
    setInviteEmail("");
    setInvitePhone("");
    setInviteTeam(team?.name || rawTeams[0]?.name || "Financial Operations");
    setIsInviteLeaderOpen(true);
  };

  const handleInviteLeaderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) {
      setError("Team Leader name and Gmail/Email are required.");
      return;
    }
    setError("");
    setInviting(true);
    try {
      const res = await teamsApi.inviteTeamLeader({
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        team: inviteTeam,
        phone: invitePhone.trim(),
        department: departmentName,
      });
      showToast(res?.message || `Official invitation sent to ${inviteEmail}!`);
      setIsInviteLeaderOpen(false);
      void fetchTeamData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send Team Leader invitation.");
    } finally {
      setInviting(false);
    }
  };

  const handleResendInvite = async (email: string) => {
    setResendingEmail(email);
    try {
      const res = await teamsApi.resendTeamLeaderInvite(email);
      showToast(res?.message || `Invitation email resent to ${email}!`);
      void fetchTeamData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend invitation.");
    } finally {
      setResendingEmail(null);
    }
  };

  const handleOpenAddEmployee = (team?: TeamItem) => {
    setActiveActionTeam(team || selectedTeam || rawTeams[0] || null);
    setNewEmployeeName("");
    setNewEmployeeEmail("");
    setNewEmployeeRole("Employee");
    setNewEmployeePhone("");
    setIsAddEmployeeOpen(true);
  };

  const handleAddEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployeeName.trim() || !newEmployeeEmail.trim()) {
      setError("Employee name and email are required.");
      return;
    }
    const teamName = activeActionTeam?.name || selectedTeam?.name || "Financial Operations";
    try {
      const res = await teamsApi.addTeamMember({
        name: newEmployeeName.trim(),
        email: newEmployeeEmail.trim(),
        role: newEmployeeRole,
        team: teamName,
        phone: newEmployeePhone.trim(),
      });
      showToast(res?.message || `Employee ${newEmployeeName} added to ${teamName}!`);
      setIsAddEmployeeOpen(false);
      void fetchTeamData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add employee.");
    }
  };

  const handleRemoveMember = async (member: TeamMember) => {
    if (!confirm(`Are you sure you want to remove ${member.name} from ${member.team}?`)) return;
    try {
      const res = await teamsApi.removeTeamMember(member.id);
      showToast(res?.message || `${member.name} removed from team.`);
      void fetchTeamData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member.");
    }
  };

  const handleOpenAssignDoc = (team?: TeamItem) => {
    const target = team || selectedTeam || rawTeams[0] || null;
    setActiveActionTeam(target);
    setAssignDocId(rawDocuments[0] ? String(rawDocuments[0].id) : "");
    setAssignMember(target?.teamLead || "");
    setAssignPriority("NORMAL");
    setIsAssignDocOpen(true);
  };

  const handleAssignDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignDocId || !activeActionTeam) {
      setError("Please select a document.");
      return;
    }
    try {
      const res = await documentsApi.assignDocumentToTeam({
        documentId: assignDocId,
        team: activeActionTeam.name,
        assignedTo: assignMember || activeActionTeam.teamLead,
        priority: assignPriority,
      });
      showToast(res?.message || `Document assigned to ${activeActionTeam.name}!`);
      setIsAssignDocOpen(false);
      void fetchTeamData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign document.");
    }
  };

  const handleExportRoster = () => {
    const csvContent = [
      "Team,Lead,Employee Name,Role,Email,Assigned Docs,Completed,Pending,Status",
      ...rawMembers.map(
        (m) =>
          `"${m.team || ""}","${rawTeams.find((t) => t.name === m.team)?.teamLead || ""}","${m.name || ""}","${m.role || ""}","${m.email || ""}",${m.assignedDocs || 0},${m.completed || 0},${m.pending || 0},"${m.status || ""}"`
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `department_teams_roster_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Exported department team roster CSV.");
  };

  // Selected Team Context Data
  const teamMembers = useMemo(() => {
    if (!selectedTeam) return [];
    let list = rawMembers.filter((m) => (m.team || "").toLowerCase() === (selectedTeam.name || "").toLowerCase());
    if (memberSearchQuery.trim()) {
      const q = memberSearchQuery.toLowerCase();
      list = list.filter((m) => (m.name || "").toLowerCase().includes(q) || (m.email || "").toLowerCase().includes(q) || (m.role || "").toLowerCase().includes(q));
    }
    return list;
  }, [selectedTeam, rawMembers, memberSearchQuery]);

  const teamDocs = useMemo(() => {
    if (!selectedTeam) return [];
    return rawDocuments.filter((d) => (d.team || "").toLowerCase() === (selectedTeam.name || "").toLowerCase());
  }, [selectedTeam, rawDocuments]);

  const teamApprovals = useMemo(() => {
    if (!selectedTeam) return [];
    return rawApprovals.filter((a) => (a.team || "").toLowerCase() === (selectedTeam.name || "").toLowerCase());
  }, [selectedTeam, rawApprovals]);

  const teamActivities = useMemo(() => {
    if (!selectedTeam) return rawActivities;
    return rawActivities.filter((act) => (act.team || "").toLowerCase() === (selectedTeam.name || "").toLowerCase());
  }, [selectedTeam, rawActivities]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-20 font-sans text-slate-800">
      {/* ========================================================================= */}
      {/* 1. PAGE HEADER */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Teams</h1>
            <Badge className="bg-[#274690]/10 text-[#274690] border-[#274690]/20 text-xs font-extrabold px-2.5 py-0.5">
              {departmentName}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            Department Manager workspace • Scoped exclusively to <strong className="text-slate-700">{departmentName}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={handleExportRoster} className="h-9 text-xs font-bold text-slate-700 rounded-xl">
            <Download size={14} className="mr-1.5" /> Export Roster
          </Button>

          <Button
            size="sm"
            onClick={() => handleOpenInviteLeader()}
            className="h-9 bg-gradient-to-r from-[#274690] to-[#5B53BA] text-xs font-black text-white hover:opacity-95 shadow-md shadow-indigo-950/20 rounded-xl px-3.5"
          >
            <Sparkles size={14} className="mr-1.5 text-amber-300" /> Invite Team Leader
          </Button>

          <Button
            size="sm"
            onClick={handleOpenCreateTeam}
            className="h-9 bg-[#274690] text-xs font-black text-white hover:bg-[#1f3770] shadow-sm rounded-xl px-4 gap-1.5"
          >
            <Plus size={15} /> Create Team
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

      {/* ========================================================================= */}
      {/* 2. SUMMARY CARDS (4 CARDS) */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        {/* Total Teams */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Total Teams</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-[#274690]">
              <Layers size={16} />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-slate-900 tracking-tight">{stats.totalTeams}</p>
          <span className="mt-1 block text-[10px] font-semibold text-slate-400">Department Units</span>
        </div>

        {/* Team Leads */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Team Leads</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-[#274690]">
              <UserCheck size={16} />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-indigo-600 tracking-tight">{stats.teamLeads}</p>
          <span className="mt-1 block text-[10px] font-semibold text-slate-400">Supervisors Appointed</span>
        </div>

        {/* Employees */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Employees</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-[#5B53BA]">
              <Users size={16} />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-slate-900 tracking-tight">{stats.employees}</p>
          <span className="mt-1 block text-[10px] font-semibold text-slate-400">Associates & Analysts</span>
        </div>

        {/* Active Teams */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Active Teams</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp size={16} />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-emerald-600 tracking-tight">{stats.activeTeams}</p>
          <span className="mt-1 block text-[10px] font-semibold text-slate-400">Operational & Active</span>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SEARCH & FILTERS BAR */}
      {/* ========================================================================= */}
      <section className="flex flex-col gap-3 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search teams by name, lead, or keyword..."
            className="pl-10 h-10 rounded-2xl text-xs font-semibold"
          />
        </div>

        {/* Filters & View Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter by Lead */}
          <select
            value={selectedLeadFilter}
            onChange={(e) => setSelectedLeadFilter(e.target.value)}
            className="h-10 rounded-2xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-bold text-slate-700 focus:border-[#274690] focus:outline-none"
          >
            <option value="ALL">All Team Leads</option>
            {distinctLeads.map((lead) => (
              <option key={lead} value={lead}>
                Lead: {lead}
              </option>
            ))}
          </select>

          {/* Filter by Status */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
            className="h-10 rounded-2xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-bold text-slate-700 focus:border-[#274690] focus:outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Teams</option>
            <option value="INACTIVE">Inactive Teams</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-10 rounded-2xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-bold text-slate-700 focus:border-[#274690] focus:outline-none"
          >
            <option value="NAME">Sort by Name</option>
            <option value="EMPLOYEES">Sort by Employees</option>
            <option value="DATE">Sort by Created Date</option>
          </select>

          {/* Grid / List View Toggle */}
          <div className="flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setViewMode("GRID")}
              className={`rounded-xl p-1.5 transition ${viewMode === "GRID" ? "bg-white text-[#274690] shadow-xs" : "text-slate-400 hover:text-slate-700"}`}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("LIST")}
              className={`rounded-xl p-1.5 transition ${viewMode === "LIST" ? "bg-white text-[#274690] shadow-xs" : "text-slate-400 hover:text-slate-700"}`}
              title="List View"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. TEAMS LIST (GRID & LIST VIEWS) */}
      {/* ========================================================================= */}
      {filteredTeams.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <Layers className="h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-sm font-bold text-slate-800">No teams matching filters</h3>
          <p className="mt-1 text-xs text-slate-400">Try changing your search query or create a new team.</p>
          <Button size="sm" onClick={handleOpenCreateTeam} className="mt-4 bg-[#274690] text-xs font-bold text-white">
            <Plus size={14} className="mr-1" /> Create Team
          </Button>
        </div>
      ) : viewMode === "GRID" ? (
        /* GRID VIEW (CARDS) */
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredTeams.map((team) => (
            <div
              key={team.id}
              className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:border-[#274690]/40 hover:shadow-md"
            >
              <div className="space-y-4">
                {/* Card Top: Title, Lead & Context Menu */}
                <div className="flex items-start justify-between">
                  <div className="pr-6">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-900 group-hover:text-[#274690] transition">
                        {team.name}
                      </h3>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-[#274690] flex items-center gap-1.5">
                      <UserCheck size={13} /> Lead: <span className="font-extrabold">{team.teamLead}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Badge
                      className={`text-[10px] font-bold ${team.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                    >
                      {team.status}
                    </Badge>

                    {/* Context Menu (⋮) */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdownId(openDropdownId === team.id ? null : team.id);
                        }}
                        className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {openDropdownId === team.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-8 z-30 w-48 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl animate-in fade-in duration-150 text-xs font-bold text-slate-700 space-y-0.5"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTeam(team);
                              setDetailTab("OVERVIEW");
                              setOpenDropdownId(null);
                            }}
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-blue-50 hover:text-[#274690]"
                          >
                            <Eye size={14} /> View Details
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleOpenEditTeam(team);
                              setOpenDropdownId(null);
                            }}
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-slate-50"
                          >
                            <Edit size={14} /> Edit Team
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTeam(team);
                              setDetailTab("MEMBERS");
                              setOpenDropdownId(null);
                            }}
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-slate-50"
                          >
                            <Users size={14} /> Manage Members
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleOpenChangeLead(team);
                              setOpenDropdownId(null);
                            }}
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-slate-50"
                          >
                            <UserCheck size={14} /> Change Team Lead
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleOpenAssignDoc(team);
                              setOpenDropdownId(null);
                            }}
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-slate-50"
                          >
                            <FilePlus size={14} /> Assign Documents
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTeam(team);
                              setDetailTab("ACTIVITY");
                              setOpenDropdownId(null);
                            }}
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-slate-50"
                          >
                            <Activity size={14} /> View Activity
                          </button>
                          <div className="border-t border-slate-100 my-1" />
                          <button
                            type="button"
                            onClick={() => {
                              handleToggleTeamStatus(team);
                              setOpenDropdownId(null);
                            }}
                            className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left ${team.status === "ACTIVE" ? "text-rose-600 hover:bg-rose-50" : "text-emerald-600 hover:bg-emerald-50"
                              }`}
                          >
                            {team.status === "ACTIVE" ? <PowerOff size={14} /> : <Power size={14} />}
                            {team.status === "ACTIVE" ? "Deactivate Team" : "Activate Team"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {team.description || "Operational team executing department document workflows and reviews."}
                </p>

                {/* 3 Metric Pills: Employees, Active Docs, Pending Approvals */}
                <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-50/80 p-3 text-center text-xs">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400">Employees</span>
                    <p className="mt-0.5 text-sm font-black text-slate-800">{team.membersCount}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400">Active Docs</span>
                    <p className="mt-0.5 text-sm font-black text-[#274690]">{team.documentsCount}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400">Pending</span>
                    <p className="mt-0.5 text-sm font-black text-[#c96f4a]">{team.pendingTasks}</p>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions: [View] [Manage Members] */}
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                  <Calendar size={11} /> Created: {team.createdDate}
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedTeam(team);
                      setDetailTab("MEMBERS");
                    }}
                    className="h-8 text-[11px] font-bold rounded-xl border-slate-200"
                  >
                    Manage Members
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedTeam(team);
                      setDetailTab("OVERVIEW");
                    }}
                    className="h-8 bg-[#274690] text-[11px] font-bold text-white hover:bg-[#1f3770] rounded-xl px-3"
                  >
                    <Eye size={12} className="mr-1" /> View
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* LIST VIEW (TABLE) */
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-4 py-3.5">Team Name</th>
                  <th className="px-4 py-3.5">Team Lead</th>
                  <th className="px-4 py-3.5 text-center">Employees</th>
                  <th className="px-4 py-3.5 text-center">Active Docs</th>
                  <th className="px-4 py-3.5 text-center">Pending Approvals</th>
                  <th className="px-4 py-3.5">Team Status</th>
                  <th className="px-4 py-3.5">Created Date</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeams.map((team) => (
                  <tr key={team.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3.5 font-bold text-slate-900">
                      {team.name}
                      <span className="block text-[11px] font-normal text-slate-400 truncate max-w-xs">{team.description}</span>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-[#274690]">{team.teamLead}</td>
                    <td className="px-4 py-3.5 text-center font-extrabold text-slate-800">{team.membersCount}</td>
                    <td className="px-4 py-3.5 text-center font-extrabold text-[#274690]">{team.documentsCount}</td>
                    <td className="px-4 py-3.5 text-center font-extrabold text-[#c96f4a]">{team.pendingTasks}</td>
                    <td className="px-4 py-3.5">
                      <Badge
                        className={`text-[10px] font-bold ${team.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                      >
                        {team.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">{team.createdDate}</td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTeam(team);
                            setDetailTab("MEMBERS");
                          }}
                          className="h-7 text-[10px] font-bold rounded-lg"
                        >
                          Members
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedTeam(team);
                            setDetailTab("OVERVIEW");
                          }}
                          className="h-7 bg-[#274690] text-[10px] font-bold text-white hover:bg-[#1f3770] rounded-lg px-2.5"
                        >
                          View
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 6. TEAM DETAILS MODAL / DRAWER (5 TABS) */}
      {/* ========================================================================= */}
      {selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-4xl max-h-[92vh] flex flex-col justify-between rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header: Team Name, Lead, Dept, Status, Stats */}
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl font-black text-slate-900">{selectedTeam.name}</h2>
                    <Badge
                      className={`text-[10px] font-bold ${selectedTeam.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-600"
                        }`}
                    >
                      {selectedTeam.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 font-medium">
                    Lead: <strong className="text-[#274690]">{selectedTeam.teamLead}</strong> • Department:{" "}
                    <strong>{departmentName}</strong> • Created: {selectedTeam.createdDate}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTeam(null)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* 5 Tabs Navigation */}
              <div className="mt-5 flex gap-2 border-b border-slate-200 overflow-x-auto pb-1">
                {[
                  { id: "OVERVIEW", label: "Overview", icon: Layers },
                  { id: "MEMBERS", label: `Members (${teamMembers.length})`, icon: Users },
                  { id: "DOCUMENTS", label: `Documents (${teamDocs.length})`, icon: FileText },
                  { id: "APPROVALS", label: `Approvals (${teamApprovals.length})`, icon: FileCheck2 },
                  { id: "ACTIVITY", label: "Activity", icon: Activity },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = detailTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setDetailTab(tab.id as any)}
                      className={`flex items-center gap-1.5 rounded-t-xl px-4 py-2 text-xs font-black transition border-b-2 ${isActive
                          ? "border-[#274690] text-[#274690] bg-blue-50/50"
                          : "border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                    >
                      <Icon size={14} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Body / Tab Content */}
            <div className="my-4 flex-1 overflow-y-auto pr-1 space-y-4">
              {/* TAB 1: OVERVIEW */}
              {detailTab === "OVERVIEW" && (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">Team Purpose & Scope</h4>
                    <p className="mt-1 text-xs text-slate-700 leading-relaxed">{selectedTeam.description}</p>
                  </div>

                  {/* 3 Metric Cards */}
                  <div className="grid grid-cols-3 gap-3 text-center text-xs">
                    <div className="rounded-2xl bg-blue-50 p-4 border border-blue-100">
                      <span className="text-[10px] font-bold text-[#274690] uppercase">Total Employees</span>
                      <p className="text-2xl font-black text-[#274690] mt-1">{selectedTeam.membersCount}</p>
                    </div>
                    <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-100">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase">Documents Processed</span>
                      <p className="text-2xl font-black text-emerald-700 mt-1">{selectedTeam.documentsCount}</p>
                    </div>
                    <div className="rounded-2xl bg-orange-50 p-4 border border-orange-100">
                      <span className="text-[10px] font-bold text-[#c96f4a] uppercase">Pending Approvals</span>
                      <p className="text-2xl font-black text-[#c96f4a] mt-1">{selectedTeam.pendingTasks}</p>
                    </div>
                  </div>

                  {/* Quick Manager Actions */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-3">
                    <h4 className="text-xs font-black uppercase text-slate-700">Team Management Quick Actions</h4>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleOpenAddEmployee(selectedTeam)}
                        className="bg-[#274690] text-xs font-bold text-white hover:bg-[#1f3770] rounded-xl"
                      >
                        <UserPlus size={13} className="mr-1.5" /> Add Employee to Team
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenAssignDoc(selectedTeam)}
                        className="text-xs font-bold text-slate-700 rounded-xl"
                      >
                        <FilePlus size={13} className="mr-1.5" /> Assign Document
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenChangeLead(selectedTeam)}
                        className="text-xs font-bold text-indigo-700 border-indigo-200 hover:bg-indigo-50 rounded-xl"
                      >
                        <UserCheck size={13} className="mr-1.5" /> Change Team Lead
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: MEMBERS */}
              {detailTab === "MEMBERS" && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-72">
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        value={memberSearchQuery}
                        onChange={(e) => setMemberSearchQuery(e.target.value)}
                        placeholder="Search team members..."
                        className="pl-8 h-9 rounded-xl text-xs"
                      />
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleOpenAddEmployee(selectedTeam)}
                      className="bg-[#274690] text-xs font-bold text-white hover:bg-[#1f3770] rounded-xl h-9"
                    >
                      <UserPlus size={13} className="mr-1.5" /> Add Employee
                    </Button>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase text-slate-600">
                        <tr>
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3">Role</th>
                          <th className="px-4 py-3 text-center">Documents</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {teamMembers.map((m) => (
                          <tr key={m.id} className="hover:bg-slate-50/70 transition">
                            <td className="px-4 py-3">
                              <span className="font-bold text-slate-900">{m.name}</span>
                              <span className="block text-[11px] text-slate-400 font-mono">{m.email}</span>
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                className={`text-[10px] font-bold ${m.role.toLowerCase().includes("lead")
                                    ? "bg-indigo-100 text-indigo-800"
                                    : "bg-slate-100 text-slate-700"
                                  }`}
                              >
                                {m.role}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-[#274690]">{m.assignedDocs || 0}</td>
                            <td className="px-4 py-3">
                              {m.status === "INVITED" ? (
                                <div className="flex flex-col gap-1">
                                  <Badge className="w-fit bg-amber-100 text-amber-900 text-[10px] font-bold">
                                    Invited (Pending)
                                  </Badge>
                                  <button
                                    type="button"
                                    onClick={() => handleResendInvite(m.email)}
                                    className="text-[10px] font-bold text-[#274690] hover:underline flex items-center gap-1"
                                  >
                                    <Send size={9} /> Resend Gmail
                                  </button>
                                </div>
                              ) : (
                                <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">Active</Badge>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMember(m)}
                                  className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 transition"
                                  title="Remove from team"
                                >
                                  <UserX size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: DOCUMENTS */}
              {detailTab === "DOCUMENTS" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-slate-100 text-slate-700 text-xs font-bold">Total: {teamDocs.length}</Badge>
                      <Badge className="bg-blue-100 text-[#274690] text-xs font-bold">Scoped to {selectedTeam.name}</Badge>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleOpenAssignDoc(selectedTeam)}
                      className="bg-[#274690] text-xs font-bold text-white rounded-xl h-9"
                    >
                      <FilePlus size={13} className="mr-1.5" /> Assign Document
                    </Button>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase text-slate-600">
                        <tr>
                          <th className="px-4 py-3">Document</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Assigned To</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {teamDocs.map((doc) => (
                          <tr key={doc.id} className="hover:bg-slate-50/70 transition">
                            <td className="px-4 py-3 font-bold text-slate-900">{doc.name}</td>
                            <td className="px-4 py-3 text-slate-600">{doc.type || "Contract"}</td>
                            <td className="px-4 py-3 font-semibold text-[#274690]">{doc.assignedTo || selectedTeam.teamLead}</td>
                            <td className="px-4 py-3">
                              <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                {doc.status || "ACTIVE"}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Link href="/department-manager/documents">
                                <Button variant="ghost" size="sm" className="h-7 text-xs font-bold text-[#274690]">
                                  View
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: APPROVALS */}
              {detailTab === "APPROVALS" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-orange-100 text-[#c96f4a] text-xs font-bold">
                      Pending Approvals: {teamApprovals.length}
                    </Badge>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase text-slate-600">
                        <tr>
                          <th className="px-4 py-3">Document</th>
                          <th className="px-4 py-3">Submitted By</th>
                          <th className="px-4 py-3">Priority</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Due Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {teamApprovals.map((appr) => (
                          <tr key={appr.id} className="hover:bg-slate-50/70 transition">
                            <td className="px-4 py-3 font-bold text-slate-900">{appr.documentName}</td>
                            <td className="px-4 py-3 text-slate-600">{appr.submittedBy}</td>
                            <td className="px-4 py-3">
                              <Badge className="bg-rose-100 text-rose-700 text-[10px] font-bold">{appr.priority}</Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Badge className="bg-amber-100 text-amber-800 text-[10px] font-bold">{appr.status}</Badge>
                            </td>
                            <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{appr.dueDate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 5: ACTIVITY */}
              {detailTab === "ACTIVITY" && (
                <div className="space-y-3 p-2">
                  <h4 className="text-xs font-black uppercase text-slate-500">Team Activity Timeline</h4>
                  <div className="space-y-3">
                    {teamActivities.map((act) => (
                      <div key={act.id} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 text-xs">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-[#274690] shrink-0 mt-0.5">
                          <Activity size={15} />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-slate-800">{act.text}</p>
                          <span className="text-[10px] text-slate-400 font-semibold">{act.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleTeamStatus(selectedTeam)}
                className={`text-xs font-bold rounded-xl ${selectedTeam.status === "ACTIVE" ? "text-rose-600 border-rose-200 hover:bg-rose-50" : "text-emerald-600"
                  }`}
              >
                {selectedTeam.status === "ACTIVE" ? "Deactivate Team" : "Activate Team"}
              </Button>

              <Button
                size="sm"
                onClick={() => setSelectedTeam(null)}
                className="bg-slate-800 text-xs font-bold text-white hover:bg-slate-700 rounded-xl"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. CREATE TEAM MODAL */}
      {/* ========================================================================= */}
      {isCreateTeamOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Create Department Team</h3>
              <button type="button" onClick={() => setIsCreateTeamOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTeamSubmit} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-600">Team Name *</label>
                <Input
                  required
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Sales Team A"
                  className="mt-1 h-10 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-600">Department</label>
                <Input
                  disabled
                  value={departmentName}
                  className="mt-1 h-10 rounded-xl text-xs font-bold bg-slate-100 text-slate-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-600">Team Lead *</label>
                  <span className="text-[10px] text-slate-400 font-semibold">Type name or choose</span>
                </div>
                <Input
                  list="create-team-leads-list"
                  required
                  value={createLead}
                  onChange={(e) => setCreateLead(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="mt-1 h-10 rounded-xl text-xs font-semibold"
                />
                <datalist id="create-team-leads-list">
                  {distinctLeads.map((lead) => (
                    <option key={lead} value={lead} />
                  ))}
                  <option value="Assigned Lead" />
                </datalist>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-600">Description</label>
                <textarea
                  rows={3}
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  placeholder="Handles corporate sales documents and approvals..."
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-800 focus:border-[#274690] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsCreateTeamOpen(false)} className="text-xs font-bold rounded-xl">
                  Cancel
                </Button>
                <Button size="sm" type="submit" className="bg-[#274690] text-xs font-bold text-white hover:bg-[#1f3770] rounded-xl px-4">
                  Create Team
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT TEAM MODAL */}
      {/* ========================================================================= */}
      {isEditTeamOpen && activeActionTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Edit Team: {activeActionTeam.name}</h3>
              <button type="button" onClick={() => setIsEditTeamOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditTeamSubmit} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-black uppercase text-slate-600">Team Name *</label>
                <Input
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 h-10 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase text-slate-600">Team Lead</label>
                  <span className="text-[10px] text-slate-400 font-semibold">Type name or choose</span>
                </div>
                <Input
                  list="edit-team-leads-list"
                  required
                  value={editLead}
                  onChange={(e) => setEditLead(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="mt-1 h-10 rounded-xl text-xs font-semibold"
                />
                <datalist id="edit-team-leads-list">
                  {distinctLeads.map((lead) => (
                    <option key={lead} value={lead} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-600">Team Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-600">Description</label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsEditTeamOpen(false)} className="text-xs font-bold rounded-xl">
                  Cancel
                </Button>
                <Button size="sm" type="submit" className="bg-[#274690] text-xs font-bold text-white hover:bg-[#1f3770] rounded-xl px-4">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CHANGE TEAM LEAD MODAL */}
      {/* ========================================================================= */}
      {isChangeLeadOpen && activeActionTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Change Team Lead</h3>
              <button type="button" onClick={() => setIsChangeLeadOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleChangeLeadSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-black uppercase text-slate-600">Team</label>
                <Input disabled value={activeActionTeam.name} className="mt-1 h-10 rounded-xl bg-slate-100 text-xs font-bold" />
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-600">Select New Team Lead</label>
                <select
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800"
                >
                  {distinctLeads.map((lead) => (
                    <option key={lead} value={lead}>
                      {lead}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsChangeLeadOpen(false)} className="text-xs font-bold rounded-xl">
                  Cancel
                </Button>
                <Button size="sm" type="submit" className="bg-[#274690] text-xs font-bold text-white rounded-xl">
                  Confirm Lead
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INVITE TEAM LEADER MODAL (WITH GMAIL DISPATCH) */}
      {/* ========================================================================= */}
      {isInviteLeaderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-200/80 space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#274690] to-[#5B53BA] text-white shadow-md">
                  <UserCheck size={22} className="text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight text-slate-900">Invite Team Leader</h3>

                </div>
              </div>
              <button type="button" onClick={() => setIsInviteLeaderOpen(false)} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 transition">
                <X size={18} />
              </button>
            </div>



            <form onSubmit={handleInviteLeaderSubmit} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-black uppercase text-slate-600">Team Leader Full Name *</label>
                <Input
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="mt-1 h-10 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-600">Team Leader Gmail Address *</label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="e.g. rahul.sharma@gmail.com"
                    className="pl-9 h-10 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-600">Assigned Team *</label>
                  <select
                    value={inviteTeam}
                    onChange={(e) => setInviteTeam(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800"
                  >
                    {rawTeams.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-600">Phone (Optional)</label>
                  <Input
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    placeholder="+91 98000 00000"
                    className="mt-1 h-10 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsInviteLeaderOpen(false)} className="h-10 text-xs font-bold rounded-xl">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  type="submit"
                  disabled={inviting}
                  className="h-10 bg-gradient-to-r from-[#274690] to-[#5B53BA] text-xs font-black text-white hover:opacity-95 rounded-xl px-5 gap-2"
                >
                  {inviting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send size={14} />}
                  Send Gmail Invitation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD EMPLOYEE TO TEAM MODAL */}
      {/* ========================================================================= */}
      {isAddEmployeeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Add Employee to {activeActionTeam?.name || "Team"}</h3>
              <button type="button" onClick={() => setIsAddEmployeeOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddEmployeeSubmit} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-black uppercase text-slate-600">Employee Full Name *</label>
                <Input
                  required
                  value={newEmployeeName}
                  onChange={(e) => setNewEmployeeName(e.target.value)}
                  placeholder="e.g. Amit Kumar"
                  className="mt-1 h-10 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-600">Corporate Email *</label>
                <Input
                  type="email"
                  required
                  value={newEmployeeEmail}
                  onChange={(e) => setNewEmployeeEmail(e.target.value)}
                  placeholder="e.g. amit.k@docucore.ai"
                  className="mt-1 h-10 rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-600">Role</label>
                  <select
                    value={newEmployeeRole}
                    onChange={(e) => setNewEmployeeRole(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800"
                  >
                    <option value="Employee">Employee</option>
                    <option value="Operations Associate">Operations Associate</option>
                    <option value="Operations Analyst">Operations Analyst</option>
                    <option value="Workflow Coordinator">Workflow Coordinator</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-600">Phone</label>
                  <Input
                    value={newEmployeePhone}
                    onChange={(e) => setNewEmployeePhone(e.target.value)}
                    placeholder="+91 98000 00000"
                    className="mt-1 h-10 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsAddEmployeeOpen(false)} className="text-xs font-bold rounded-xl">
                  Cancel
                </Button>
                <Button size="sm" type="submit" className="bg-[#274690] text-xs font-bold text-white rounded-xl">
                  Add to Team
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ASSIGN DOCUMENT MODAL */}
      {/* ========================================================================= */}
      {isAssignDocOpen && activeActionTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Assign Document to {activeActionTeam.name}</h3>
              <button type="button" onClick={() => setIsAssignDocOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignDocSubmit} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-black uppercase text-slate-600">Select Document *</label>
                <select
                  value={assignDocId}
                  onChange={(e) => setAssignDocId(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800"
                >
                  {rawDocuments.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} ({doc.type || "Document"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-600">Assignee in Team</label>
                <Input
                  value={assignMember}
                  onChange={(e) => setAssignMember(e.target.value)}
                  placeholder={`e.g. ${activeActionTeam.teamLead}`}
                  className="mt-1 h-10 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-600">Priority Level</label>
                <select
                  value={assignPriority}
                  onChange={(e) => setAssignPriority(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800"
                >
                  <option value="HIGH">High Priority</option>
                  <option value="NORMAL">Normal</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsAssignDocOpen(false)} className="text-xs font-bold rounded-xl">
                  Cancel
                </Button>
                <Button size="sm" type="submit" className="bg-[#274690] text-xs font-bold text-white rounded-xl">
                  Confirm Assignment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}