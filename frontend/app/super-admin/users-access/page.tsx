"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Shield,
  Plus,
  Key,
  Lock,
  Mail,
  CheckCircle2,
  Sparkles,
  Search,
  RefreshCw,
  UserCheck,
  Building2,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import superAdminUsersApi, { type SuperAdminUserItem } from "@/services/superAdminUsersApi";

export default function UsersAndAccessPage() {
  const [activeTab, setActiveTab] = useState<"all_users" | "roles" | "admins" | "access_control">("all_users");
  const [users, setUsers] = useState<SuperAdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [stats, setStats] = useState({
    totalUsers: 0,
    superAdmins: 0,
    orgAdmins: 0,
    deptManagers: 0,
    teamLeads: 0,
    employees: 0,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await superAdminUsersApi.getUsers({
        search: search.trim() || undefined,
        role: filterRole !== "ALL" ? filterRole : undefined,
      });
      if (res && res.data) {
        setUsers(res.data);
        if (res.stats) setStats(res.stats);
      }
    } catch {
      showToast("Failed to load users from database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [filterRole, search]);

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
      await superAdminUsersApi.toggleUserStatus(id, newStatus);
      showToast(`User status updated to ${newStatus}`);
      loadUsers();
    } catch {
      showToast("Error updating user status.");
    }
  };

  const rolesMatrix = [
    { name: "Super Admin", description: "Unrestricted platform, database & system telemetry control", count: stats.superAdmins },
    { name: "Organization Admin", description: "Manages tenant documents, team, workflows, settings", count: stats.orgAdmins },
    { name: "Department Manager", description: "Reviews department documents, approvals, templates", count: stats.deptManagers },
    { name: "Team Leader", description: "Manages team tasks, documents, reports", count: stats.teamLeads },
    { name: "Employee", description: "Creates documents, runs AI tools, submits tasks", count: stats.employees },
  ];

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-[#090d16] p-4 sm:p-6 space-y-6 font-sans text-slate-800 dark:text-slate-200">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[100] bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-[#274690] flex items-center gap-3 animate-in fade-in">
          <Sparkles className="w-5 h-5 text-[#f3b092]" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-[#11192e] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-[#274690] text-white text-[10px] font-bold px-2 py-0.5">
              Cross-Tenant Directory
            </Badge>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              ● All 5 Roles Synchronized
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1">
            Users & Access Control
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage all platform and tenant users, roles & permissions, access control, and status toggles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={loadUsers}
            variant="outline"
            size="sm"
            disabled={loading}
            className="text-xs font-bold gap-1.5 h-9 rounded-xl"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-4 rounded-2xl bg-white dark:bg-[#11192e] border-slate-200/90 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase">TOTAL USERS</span>
          <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">{stats.totalUsers}</p>
        </Card>
        <Card className="p-4 rounded-2xl bg-white dark:bg-[#11192e] border-slate-200/90 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase">SUPER ADMINS</span>
          <p className="text-xl font-black text-[#274690] dark:text-blue-400 mt-1">{stats.superAdmins}</p>
        </Card>
        <Card className="p-4 rounded-2xl bg-white dark:bg-[#11192e] border-slate-200/90 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase">ORG ADMINS</span>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.orgAdmins}</p>
        </Card>
        <Card className="p-4 rounded-2xl bg-white dark:bg-[#11192e] border-slate-200/90 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase">MANAGERS</span>
          <p className="text-xl font-black text-[#c96f4a] mt-1">{stats.deptManagers}</p>
        </Card>
        <Card className="p-4 rounded-2xl bg-white dark:bg-[#11192e] border-slate-200/90 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase">TEAM LEADS</span>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats.teamLeads}</p>
        </Card>
        <Card className="p-4 rounded-2xl bg-white dark:bg-[#11192e] border-slate-200/90 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase">EMPLOYEES</span>
          <p className="text-xl font-black text-slate-700 dark:text-slate-300 mt-1">{stats.employees}</p>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-3 text-xs font-bold">
        {[
          { id: "all_users", label: "All Users Directory", icon: Users, count: users.length },
          { id: "roles", label: "Roles & Permissions", icon: Shield },
          { id: "admins", label: "Super Admins", icon: UserCheck, count: stats.superAdmins },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition font-bold ${
                isActive
                  ? "bg-[#274690] text-white shadow-md"
                  : "bg-white dark:bg-[#11192e] text-slate-600 dark:text-slate-400 hover:bg-slate-100 border border-slate-200/80 dark:border-slate-800"
              }`}
            >
              <Icon size={15} />
              <span>{t.label}</span>
              {t.count !== undefined && (
                <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full">{t.count}</span>
              )}
            </button>
          );
        })}
      </div>

      {activeTab === "all_users" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative col-span-2">
              <Search size={14} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search user by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#11192e] text-xs font-semibold"
              />
            </div>

            <div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#11192e] text-xs font-semibold"
              >
                <option value="ALL">All Roles</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ORG_ADMIN">Organization Admin</option>
                <option value="DEPARTMENT_MANAGER">Department Manager</option>
                <option value="TEAM_LEADER">Team Leader</option>
                <option value="EMPLOYEE">Employee</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#11192e] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-extrabold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">USER</th>
                    <th className="p-3.5">ROLE</th>
                    <th className="p-3.5">ORGANISATION</th>
                    <th className="p-3.5">DEPARTMENT / TEAM</th>
                    <th className="p-3.5">STATUS</th>
                    <th className="p-3.5 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{u.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                      </td>
                      <td className="p-3.5">
                        <Badge variant="outline" className="text-[10.5px] font-bold">
                          {u.role.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-700 dark:text-slate-300">
                        {u.organisationName}
                      </td>
                      <td className="p-3.5 text-slate-500">
                        {u.departmentName} {u.teamName !== "-" ? `• ${u.teamName}` : ""}
                      </td>
                      <td className="p-3.5">
                        <Badge className={u.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 font-bold" : "bg-rose-50 text-rose-700 font-bold"}>
                          {u.status}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right">
                        {u.role !== "SUPER_ADMIN" && (
                          <Button
                            onClick={() => handleToggleStatus(u.id, u.status)}
                            variant="outline"
                            size="sm"
                            className="h-7 text-[11px] font-bold rounded-lg"
                          >
                            {u.status === "ACTIVE" ? "Suspend" : "Activate"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}

                  {users.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400 font-bold">
                        No users found matching current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "roles" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rolesMatrix.map((r) => (
            <Card key={r.name} className="p-5 rounded-2xl bg-white dark:bg-[#11192e] border-slate-200/90 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">{r.name}</h3>
                <Badge className="bg-[#274690] text-white text-[10.5px] font-bold">{r.count} users</Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{r.description}</p>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "admins" && (
        <Card className="p-5 rounded-2xl bg-white dark:bg-[#11192e] border-slate-200/90 dark:border-slate-800 space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Super Administrator Accounts</h3>
          <div className="space-y-2">
            {users.filter(u => u.role === "SUPER_ADMIN").map((sa) => (
              <div key={sa.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs">
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">{sa.name}</div>
                  <div className="text-slate-500 font-mono">{sa.email}</div>
                </div>
                <Badge className="bg-emerald-50 text-emerald-700 font-bold">{sa.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
