"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Mail,
  ShieldCheck,
  Building2,
  Briefcase,
  Users,
  User,
  Sparkles,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import axios from "@/lib/axios";
import {
  AuthShell,
  PasswordField,
  TextField,
} from "../_components/auth-ui";

interface DemoRole {
  title: string;
  scope: string;
  email: string;
  badge: string;
  icon: any;
  badgeColor: string;
  cardColor: string;
  activeBorder: string;
}

const demoRoles: DemoRole[] = [
  {
    title: "Super Admin",
    scope: "Platform Control Plane & Global SaaS",
    email: "admin@demo.com",
    badge: "Platform Owner",
    icon: ShieldCheck,
    badgeColor: "bg-purple-100 text-purple-700 border-purple-200",
    cardColor: "hover:border-purple-300 hover:bg-purple-50/50",
    activeBorder: "border-purple-600 bg-purple-50/80 ring-2 ring-purple-600/20",
  },
  {
    title: "Organization Admin",
    scope: "Tenant Admin, Users, Billing & Workflows",
    email: "orgadmin@demo.com",
    badge: "Tenant Admin",
    icon: Building2,
    badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
    cardColor: "hover:border-blue-300 hover:bg-blue-50/50",
    activeBorder: "border-blue-600 bg-blue-50/80 ring-2 ring-blue-600/20",
  },
  {
    title: "Department Manager",
    scope: "Department Workflows & Approval Queues",
    email: "manager@demo.com",
    badge: "Dept Manager",
    icon: Briefcase,
    badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    cardColor: "hover:border-emerald-300 hover:bg-emerald-50/50",
    activeBorder: "border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-600/20",
  },
  {
    title: "Team Lead",
    scope: "Team Task Reviews & Assigned Docs",
    email: "teamlead@demo.com",
    badge: "Team Leader",
    icon: Users,
    badgeColor: "bg-amber-100 text-amber-700 border-amber-200",
    cardColor: "hover:border-amber-300 hover:bg-amber-50/50",
    activeBorder: "border-amber-600 bg-amber-50/80 ring-2 ring-amber-600/20",
  },
  {
    title: "Employee",
    scope: "Document Submissions & Self-Service",
    email: "employee@demo.com",
    badge: "Staff Member",
    icon: User,
    badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
    cardColor: "hover:border-slate-300 hover:bg-slate-50/50",
    activeBorder: "border-slate-700 bg-slate-100/90 ring-2 ring-slate-700/20",
  },
];

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "admin@demo.com",
    password: "Admin@123",
  });

  const [selectedRole, setSelectedRole] = useState<string>("Super Admin");
  const [showDemoRoles, setShowDemoRoles] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectDemoRole = (role: DemoRole) => {
    setSelectedRole(role.title);
    setFormData({
      email: role.email,
      password: "Admin@123",
    });
    setError(null);
    setMessage(`Selected demo credentials for ${role.title}`);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { data: response } = await axios.post<{
        success: boolean;
        message: string;
        accessToken: string;
        refreshToken?: string;
        user: {
          id: string | number;
          name: string;
          email: string;
          role: string;
          organisation_id?: string | number | null;
          organisation_name?: string;
        };
      }>("/auth/login", {
        email: formData.email.trim(),
        password: formData.password.trim(),
        role: selectedRole || "Super Admin",
      });

      const { accessToken, refreshToken, user } = response;

      localStorage.setItem("accessToken", accessToken);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("currentUser", JSON.stringify(user));

      if ((user as unknown as Record<string, unknown>).organisation_name) {
        const u = user as unknown as Record<string, string>;
        localStorage.setItem(
          "organization",
          JSON.stringify({
            companyName: u.organisation_name,
            name: u.organisation_name,
            id: u.organisation_id,
          })
        );
      }

      try {
        const { data: companyResponse } = await axios.get<{
          success: boolean;
          data: { company_name: string; logo?: string; id: string };
        }>("/companies");
        const company = companyResponse.data;
        if (company && company.company_name) {
          localStorage.setItem(
            "organization",
            JSON.stringify({
              companyName: company.company_name,
              name: company.company_name,
              logo: company.logo,
              id: company.id,
            })
          );
        }
      } catch (e) {}

      setMessage(response.message || "Login Successful.");

      setTimeout(() => {
        const userRole = (user?.role || "").toLowerCase();
        const selRole = (selectedRole || "").toLowerCase();

        // 1. Employee / Staff check
        if (
          selRole === "employee" ||
          userRole === "staff" ||
          userRole.includes("employee") ||
          userRole.includes("staff")
        ) {
          window.location.href = "/employee/dashboard";
          return;
        }

        // 2. Team Lead check
        if (
          selRole === "team lead" ||
          userRole === "team_leader" ||
          userRole.includes("team leader") ||
          userRole.includes("team_leader") ||
          userRole.includes("team lead") ||
          userRole.includes("team_lead") ||
          userRole.includes("teamlead")
        ) {
          window.location.href = "/team-leader/dashboard";
          return;
        }

        // 3. Department Manager check
        if (
          selRole === "department manager" ||
          userRole === "department_manager" ||
          userRole.includes("department manager") ||
          userRole.includes("department_manager") ||
          userRole.includes("dept manager") ||
          userRole.includes("dept_manager")
        ) {
          window.location.href = "/department-manager/dashboard";
          return;
        }

        // 4. Organisation Admin check
        if (
          selRole === "organization admin" ||
          userRole === "organisation_admin" ||
          userRole.includes("organisation_admin") ||
          userRole.includes("organization_admin") ||
          userRole.includes("org_admin") ||
          userRole.includes("org admin")
        ) {
          window.location.href = "/org-admin/dashboard";
          return;
        }

        // 5. Super Admin check
        if (
          selRole === "super admin" ||
          userRole === "super_admin" ||
          userRole.includes("super admin") ||
          userRole.includes("super_admin")
        ) {
          window.location.href = "/super-admin/dashboard";
          return;
        }

        window.location.href = "/employee/dashboard";
      }, 500);
    } catch (submitError: any) {
      const apiMsg = submitError?.response?.data?.message;
      setError(
        apiMsg ||
          (submitError instanceof Error
            ? submitError.message
            : "Login failed. Please check your credentials.")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      badge="DocuCore AI"
      title="Sign in to your workspace"
      description="Access approvals, policies, and document workflows from one clean control center."
      asideTitle="Bring every approval lane into one secure place."
      asideBody="Track exceptions, route requests faster, and keep compliance visible without making the interface feel heavy."
      features={[
        {
          label: "Audit-ready activity",
          hint: "Every decision and handoff stays visible for your team.",
        },
        {
          label: "Faster document intake",
          hint: "Guide teams through structured submissions and reviews.",
        },
        {
          label: "Clear operator workflows",
          hint: "Reduce back-and-forth with better page-level clarity.",
        },
      ]}
      contentScrollOnly
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <TextField
          label="Work email"
          placeholder="name@company.com"
          icon={Mail}
          type="email"
          name="email"
          value={formData.email}
          onChange={(event) =>
            setFormData((current) => ({
              ...current,
              email: event.target.value,
            }))
          }
          autoComplete="email"
          required
          disabled={loading}
        />

        <PasswordField
          label="Password"
          placeholder="Enter your password"
          name="password"
          value={formData.password}
          onChange={(event) =>
            setFormData((current) => ({
              ...current,
              password: event.target.value,
            }))
          }
          autoComplete="current-password"
          required
          disabled={loading}
        />

        <div className="flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-[#274690] focus:ring-[#274690]/20"
            />
            Keep me signed in
          </label>

          <Link
            href="/auth/forgot-password"
            className="font-semibold text-[#274690] transition hover:text-[#c96f4a]"
          >
            Forgot your Password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-2xl bg-gradient-to-r from-[#274690] via-[#244186] to-[#c96f4a] text-sm font-bold text-white shadow-lg shadow-[#274690]/25 transition-all duration-300 hover:shadow-[#c96f4a]/30 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Signing in..." : `Sign in as ${selectedRole}`}
        </button>
      </form>

      {message && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {error}
        </div>
      )}

      {/* Demo Accounts & Workspace Roles Toggle Header */}
      <div className="mt-8 border-t border-slate-200/80 pt-6">
        <button
          type="button"
          onClick={() => setShowDemoRoles((prev) => !prev)}
          className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50/80 hover:bg-slate-100 hover:border-slate-300 transition-all duration-200 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold border border-amber-200/50 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                Demo Accounts
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded-full capitalize">
                  5 Roles
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {showDemoRoles ? "Click to collapse roles" : "Click to view & 1-click fill demo roles"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm">
              {showDemoRoles ? "Hide Roles" : "Show Roles"}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                showDemoRoles ? "rotate-180 text-slate-900" : ""
              }`}
            />
          </div>
        </button>

        {/* Expandable Workspace Roles List */}
        {showDemoRoles && (
          <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <p className="text-xs text-slate-500 mb-2 px-1">
              Select a workspace role below to auto-fill credentials:
            </p>

            {demoRoles.map((role) => {
              const isSelected = selectedRole === role.title;
              const Icon = role.icon;
              return (
                <button
                  key={role.title}
                  type="button"
                  onClick={() => selectDemoRole(role)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all duration-150 group ${
                    isSelected
                      ? role.activeBorder
                      : `border-slate-200 bg-white ${role.cardColor}`
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? "bg-white text-slate-900 border-slate-300 shadow-sm"
                          : "bg-slate-50 text-slate-600 border-slate-200 group-hover:bg-white"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {role.title}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${role.badgeColor}`}
                        >
                          {role.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {role.email} • {role.scope}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 ml-2">
                    {isSelected ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-100/80 px-2 py-1 rounded-lg border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Active
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-400 group-hover:text-slate-700 bg-slate-50 group-hover:bg-white px-2 py-1 rounded-lg border border-slate-200 transition-colors">
                        Fill
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </AuthShell>
  );
}
