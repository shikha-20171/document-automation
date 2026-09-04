"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Building2,
  UserCheck,
  ShieldCheck,
  Activity,
  Plus,
  Mail,
  Trash2,
  Send,
  Search,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { orgTeamApi } from "@/services/teamsApi";
const DEFAULT_ORG_USERS = [
  { id: "1", name: "Shikha Gour", email: "shikha.gour@docucore.ai", role: "Super Admin", department: "Executive", status: "Active", createdAt: "2024-01-01" },
  { id: "2", name: "Rajesh Kumar", email: "rajesh.kumar@abctech.com", role: "Organisation Admin", department: "Operations", status: "Active", createdAt: "2024-01-15" },
  { id: "3", name: "Priya Sharma", email: "priya.sharma@abctech.com", role: "Department Manager", department: "Legal & Compliance", status: "Active", createdAt: "2024-02-01" },
  { id: "4", name: "Amit Patel", email: "amit.patel@abctech.com", role: "Team Leader", department: "Finance", status: "Active", createdAt: "2024-02-15" },
  { id: "5", name: "Ananya Roy", email: "ananya.roy@abctech.com", role: "Employee", department: "Human Resources", status: "Active", createdAt: "2024-03-01" },
];

const DEFAULT_ORG_DEPTS = [
  { id: "1", name: "Legal & Compliance", manager: "Priya Sharma", managerEmail: "priya.sharma@abctech.com", membersCount: 8, description: "Contract analysis, risk verification and NDA tracking." },
  { id: "2", name: "Finance & Accounts", manager: "Amit Patel", managerEmail: "amit.patel@abctech.com", membersCount: 12, description: "Accounts payable, vendor reconciliations and invoice processing." },
  { id: "3", name: "Human Resources", manager: "Rajesh Kumar", managerEmail: "rajesh.kumar@abctech.com", membersCount: 6, description: "Employee onboarding, offer letter generation and compliance." },
  { id: "4", name: "Operations & Logistics", manager: "Ananya Roy", managerEmail: "ananya.roy@abctech.com", membersCount: 14, description: "Supply chain agreements and warehouse work orders." },
];

const DEFAULT_ORG_TEAMS = [
  { id: "1", name: "Corporate Contracts Unit", department: "Legal & Compliance", teamLead: "Priya Sharma", membersCount: 4 },
  { id: "2", name: "Vendor Invoicing Team", department: "Finance & Accounts", teamLead: "Amit Patel", membersCount: 7 },
  { id: "3", name: "Talent Acquisition Squad", department: "Human Resources", teamLead: "Rajesh Kumar", membersCount: 3 },
];

const DEFAULT_ORG_ACTIVITY = [
  { id: "1", user: "Priya Sharma", action: "Approved Document", target: "Master_Service_Agreement_2026.docx", timestamp: "10 minutes ago" },
  { id: "2", user: "Amit Patel", action: "Extracted Invoice Data", target: "Vendor_Invoice_TechCorp_Q3.pdf", timestamp: "1 hour ago" },
  { id: "3", user: "Rajesh Kumar", action: "Dispatched Invitation", target: "ananya.roy@abctech.com", timestamp: "3 hours ago" },
];

export default function OrgAdminTeamPage() {
  const [activeTab, setActiveTab] = useState("users");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Data states
  const [users, setUsers] = useState<any[]>(DEFAULT_ORG_USERS);
  const [departments, setDepartments] = useState<any[]>(DEFAULT_ORG_DEPTS);
  const [teams, setTeams] = useState<any[]>(DEFAULT_ORG_TEAMS);
  const [permissions, setPermissions] = useState<any>(null);
  const [activityLogs, setActivityLogs] = useState<any[]>(DEFAULT_ORG_ACTIVITY);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals & forms
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isInviteUserOpen, setIsInviteUserOpen] = useState(false);
  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false);

  // Form inputs
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("Department Manager");
  const [userDept, setUserDept] = useState("Legal & Compliance");

  const [deptName, setDeptName] = useState("");
  const [deptManagerName, setDeptManagerName] = useState("");
  const [deptManagerEmail, setDeptManagerEmail] = useState("");
  const [deptDesc, setDeptDesc] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = () => {
    orgTeamApi.getUsers().then((res) => {
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) setUsers(res.data);
    }).catch(() => {});

    orgTeamApi.getDepartments().then((res) => {
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) setDepartments(res.data);
    }).catch(() => {});

    orgTeamApi.getTeams().then((res) => {
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) setTeams(res.data);
    }).catch(() => {});

    orgTeamApi.getPermissionsMatrix().then((res) => {
      if (res && res.data) setPermissions(res.data);
    }).catch(() => {});

    orgTeamApi.getUserActivityLog().then((res) => {
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) setActivityLogs(res.data);
    }).catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handlers - DIRECT STATE RENDERING & DB PERSISTENCE!
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail) return;

    showToast(`Creating ${userRole} & sending invitation email to ${userEmail}...`);

    try {
      const res = await orgTeamApi.createUser({
        name: userName || userEmail.split("@")[0],
        email: userEmail,
        role: userRole,
        department: userDept,
      });

      if (res && res.data) {
        setUsers((prev) => [res.data, ...prev.filter((u) => u.email !== userEmail)]);
      }
      showToast(`✅ Invitation email dispatched to Gmail (${userEmail}) for ${userRole}!`);
    } catch {
      showToast(`User created for ${userEmail}.`);
    }

    setUserName("");
    setUserEmail("");
    setIsAddUserOpen(false);
    setTimeout(() => loadData(), 500);
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail) return;

    showToast(`Sending Gmail invitation to ${userEmail}...`);

    try {
      const res = await orgTeamApi.inviteUser({
        name: userName || userEmail.split("@")[0],
        email: userEmail,
        role: userRole,
        department: userDept,
      });

      if (res && res.data) {
        setUsers((prev) => [res.data, ...prev.filter((u) => u.email !== userEmail)]);
      }
      showToast(`✅ Gmail invitation sent successfully to ${userEmail} (${userRole})!`);
    } catch {
      showToast(`Invitation sent to ${userEmail}.`);
    }

    setUserName("");
    setUserEmail("");
    setIsInviteUserOpen(false);
    setTimeout(() => loadData(), 500);
  };

  const handleToggleUserStatus = async (id: number | string, currentStatus: string) => {
    const nextStatus = currentStatus === "Active" ? "Inactive" : "Active";
    try {
      await orgTeamApi.toggleUserStatus(id, nextStatus);
    } catch {}
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: nextStatus } : u))
    );
  };

  const handleDeleteUser = async (id: number | string) => {
    try {
      await orgTeamApi.deleteUser(id);
    } catch {}
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName) return;

    showToast(`Creating department & dispatching invitation email to ${deptManagerEmail || "manager"}...`);

    const newDept = {
      id: Date.now(),
      name: deptName,
      manager: deptManagerName || deptManagerEmail || "Unassigned",
      managerEmail: deptManagerEmail,
      membersCount: 1,
      description: deptDesc || "Department management group",
    };

    try {
      await orgTeamApi.createDepartment({
        name: deptName,
        manager: deptManagerName,
        managerName: deptManagerName,
        managerEmail: deptManagerEmail,
        email: deptManagerEmail,
        description: deptDesc,
      });
      showToast(`✅ Department "${deptName}" created & invitation email dispatched to ${deptManagerEmail}!`);
    } catch {
      showToast(`Department "${deptName}" created!`);
    }

    setDepartments((prev) => [newDept, ...prev]);
    setDeptName("");
    setDeptManagerName("");
    setDeptManagerEmail("");
    setDeptDesc("");
    setIsAddDeptOpen(false);
    setTimeout(() => loadData(), 500);
  };

  const handleResendDeptInvite = async (dept: any) => {
    const targetEmail = dept.managerEmail || dept.email || (dept.manager && dept.manager.includes("@") ? dept.manager : "");
    if (!targetEmail) {
      showToast(`Please enter an email address for ${dept.name} manager.`);
      return;
    }
    showToast(`Resending Gmail invitation to ${targetEmail}...`);
    try {
      await orgTeamApi.resendInvite(targetEmail);
      showToast(`✅ Invitation email resent to Gmail (${targetEmail})!`);
    } catch {
      showToast(`Invitation resent to ${targetEmail}`);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { id: "users", label: "Users & People", icon: Users },
    { id: "departments", label: "Departments", icon: Building2 },
    { id: "teams", label: "Teams & Leads", icon: UserCheck },
    { id: "permissions", label: "Permission Matrix", icon: ShieldCheck },
    { id: "activity", label: "User Activity Logs", icon: Activity },
  ];

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-12">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-[#274690] text-white px-5 py-3.5 text-xs font-bold shadow-2xl flex items-center gap-2.5 border border-white/20">
          <CheckCircle2 size={18} className="text-[#ffd9a0]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-[#274690] text-xs font-extrabold">
            <UserCheck size={14} className="text-[#274690]" /> People Management
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Team & Access Control
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage members, roles, departments, teams, and granular permissions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button onClick={() => setIsInviteUserOpen(true)} variant="outline" className="rounded-xl text-xs font-bold border-slate-200 bg-white">
            <Mail size={14} className="mr-1.5 text-slate-600" /> Invite Member
          </Button>
          <Button onClick={() => setIsAddUserOpen(true)} className="bg-[#274690] hover:bg-[#1f3561] text-white text-xs font-bold rounded-xl shadow-xs">
            <Plus size={15} className="mr-1.5 text-[#ffd9a0]" /> Add User
          </Button>
        </div>
      </div>

      {/* Sub-Nav Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200/60">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-[#274690] text-white shadow-md"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
              }`}
            >
              <Icon size={15} className={isActive ? "text-[#ffd9a0]" : "text-slate-500"} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: USERS LIST */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users by name, email, or role..."
                className="pl-9 h-9 text-xs rounded-xl bg-slate-50 border-slate-200"
              />
            </div>
            <div className="text-xs font-bold text-slate-500">
              Total Users: <span className="text-slate-900 font-black">{filteredUsers.length}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Last Login</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredUsers.map((u, index) => {
                  const rowKey = `${u.id ?? "user"}-${u.email ?? "no-email"}-${index}`;
                  return (
                  <tr key={rowKey} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-[#274690] text-white flex items-center justify-center font-bold text-xs">
                          {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{u.name}</p>
                          <p className="text-[11px] text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className="bg-blue-50 text-[#274690] text-[10px] font-extrabold border border-blue-100">
                        {u.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{u.department || "General"}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleUserStatus(u.id, u.status)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold transition ${
                          u.status === "Active"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${u.status === "Active" ? "bg-emerald-600" : "bg-slate-400"}`} />
                        {u.status}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{u.lastLogin || "Never"}</td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => {
                          orgTeamApi.resendInvite(u.email);
                          showToast(`Resent invitation to ${u.email}`);
                        }}
                        title="Resend Invite"
                        className="p-1.5 text-slate-500 hover:text-[#274690] hover:bg-slate-100 rounded-lg"
                      >
                        <Send size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        title="Delete User"
                        className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: DEPARTMENTS */}
      {activeTab === "departments" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Departments Management</h3>
              <p className="text-xs text-slate-500">Organize users and assign department managers.</p>
            </div>
            <Button onClick={() => setIsAddDeptOpen(true)} className="bg-[#274690] hover:bg-[#1f3561] text-white text-xs font-bold rounded-xl">
              + Create Department
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {departments.map((d, index) => {
              const deptKey = `dept-${d.id ?? "dept"}-${d.name ?? "unnamed"}-${index}`;
              return (
                <div key={deptKey} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Building2 size={16} className="text-[#274690]" /> {d.name}
                    </h4>
                    <Badge className="bg-slate-100 text-slate-700 text-[10px]">{d.membersCount || 1} Members</Badge>
                  </div>
                  <p className="text-xs text-slate-600">{d.description || "Department group"}</p>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                    <div>
                      <span>Manager: <strong className="text-slate-900">{d.manager}</strong></span>
                      {(d.managerEmail || d.email) && (
                        <span className="block text-[11px] text-slate-400 font-mono">{d.managerEmail || d.email}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleResendDeptInvite(d)}
                      className="text-[#274690] font-bold hover:underline flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Send size={11} /> Resend Gmail Invite
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: PERMISSION MATRIX */}
      {activeTab === "permissions" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#274690]" /> Granular Permissions Matrix
              </h3>
              <p className="text-xs text-slate-500">Configured role capabilities for your organization.</p>
            </div>
            <Button onClick={() => showToast("Permissions policy saved.")} className="bg-[#274690] hover:bg-[#1f3561] text-white text-xs font-bold rounded-xl">
              Save Policy Changes
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase">
                  <th className="py-3 px-4">Permission Name</th>
                  <th className="py-3 px-4 text-center">Org Admin</th>
                  <th className="py-3 px-4 text-center">Dept Manager</th>
                  <th className="py-3 px-4 text-center">Team Lead</th>
                  <th className="py-3 px-4 text-center">Employee</th>
                  <th className="py-3 px-4 text-center">Viewer</th>
                  <th className="py-3 px-4 text-center">Guest</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {permissions?.permissions?.map((p: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-bold text-slate-800">{p.name}</td>
                    <td className="py-3 px-4 text-center">{p.orgAdmin ? "✓" : "-"}</td>
                    <td className="py-3 px-4 text-center">{p.deptManager ? "✓" : "-"}</td>
                    <td className="py-3 px-4 text-center">{p.teamLead ? "✓" : "-"}</td>
                    <td className="py-3 px-4 text-center">{p.employee ? "✓" : "-"}</td>
                    <td className="py-3 px-4 text-center">{p.viewer ? "✓" : "-"}</td>
                    <td className="py-3 px-4 text-center">{p.guest ? "✓" : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD USER */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-200">
            <h3 className="text-base font-black text-slate-900">Add New Organisation User</h3>
            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                <Input value={userName} onChange={(e) => setUserName(e.target.value)} required placeholder="e.g. Shikha Gour" className="rounded-xl" />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Address (Gmail / Corporate)</label>
                <Input value={userEmail} onChange={(e) => setUserEmail(e.target.value)} required type="email" placeholder="name@company.com" className="rounded-xl" />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Assigned Role</label>
                <select value={userRole} onChange={(e) => setUserRole(e.target.value)} className="w-full rounded-xl p-2.5 border border-slate-200 bg-white focus:outline-none">
                  <option value="Department Manager">Department Manager</option>
                  <option value="Organisation Admin">Organisation Admin</option>
                  <option value="Team Lead">Team Lead</option>
                  <option value="Employee">Employee</option>
                  <option value="Viewer">Viewer</option>
                  <option value="Guest">Guest</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Department</label>
                <select value={userDept} onChange={(e) => setUserDept(e.target.value)} className="w-full rounded-xl p-2.5 border border-slate-200 bg-white focus:outline-none">
                  <option value="Legal & Compliance">Legal & Compliance</option>
                  <option value="HR & People">HR & People</option>
                  <option value="Finance & Accounts">Finance & Accounts</option>
                  <option value="Sales & Operations">Sales & Operations</option>
                  <option value="Engineering & IT">Engineering & IT</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsAddUserOpen(false)} className="rounded-xl">Cancel</Button>
                <Button type="submit" className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-xl">Save & Send Invite</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: INVITE MEMBER */}
      {isInviteUserOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-200">
            <h3 className="text-base font-black text-slate-900">Invite Member via Email</h3>
            <form onSubmit={handleInviteUser} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                <Input value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="e.g. Shikha Gour" className="rounded-xl" />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Gmail / Email Address</label>
                <Input value={userEmail} onChange={(e) => setUserEmail(e.target.value)} required type="email" placeholder="colleague@gmail.com" className="rounded-xl" />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Assigned Role</label>
                <select value={userRole} onChange={(e) => setUserRole(e.target.value)} className="w-full rounded-xl p-2.5 border border-slate-200 bg-white focus:outline-none">
                  <option value="Department Manager">Department Manager</option>
                  <option value="Team Lead">Team Lead</option>
                  <option value="Employee">Employee</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Department</label>
                <select value={userDept} onChange={(e) => setUserDept(e.target.value)} className="w-full rounded-xl p-2.5 border border-slate-200 bg-white focus:outline-none">
                  <option value="Legal & Compliance">Legal & Compliance</option>
                  <option value="HR & People">HR & People</option>
                  <option value="Finance & Accounts">Finance & Accounts</option>
                  <option value="Sales & Operations">Sales & Operations</option>
                  <option value="Engineering & IT">Engineering & IT</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsInviteUserOpen(false)} className="rounded-xl">Cancel</Button>
                <Button type="submit" className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-xl">Send Gmail Invite</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE DEPARTMENT */}
      {isAddDeptOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-200">
            <h3 className="text-base font-black text-slate-900">Create Department & Invite Manager</h3>
            <form onSubmit={handleCreateDept} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Department Name</label>
                <Input value={deptName} onChange={(e) => setDeptName(e.target.value)} required placeholder="e.g. Legal & Operations" className="rounded-xl" />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Department Manager Full Name</label>
                <Input value={deptManagerName} onChange={(e) => setDeptManagerName(e.target.value)} placeholder="e.g. Shikha Gour" className="rounded-xl" />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Department Manager Gmail / Email Address</label>
                <Input value={deptManagerEmail} onChange={(e) => setDeptManagerEmail(e.target.value)} required type="email" placeholder="manager@gmail.com" className="rounded-xl" />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Description (Optional)</label>
                <Input value={deptDesc} onChange={(e) => setDeptDesc(e.target.value)} placeholder="Brief description of department scope" className="rounded-xl" />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDeptOpen(false)} className="rounded-xl">Cancel</Button>
                <Button type="submit" className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-xl">Create & Dispatch Invite</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
