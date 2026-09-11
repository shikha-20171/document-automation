/**
 * Role-Based Access Control (RBAC) and Route Protection Helpers
 */

export type UserRole =
  | "SUPER_ADMIN"
  | "ORGANISATION_ADMIN"
  | "DEPARTMENT_MANAGER"
  | "TEAM_LEADER"
  | "STAFF"
  | "EMPLOYEE";

export function normalizeRole(role?: string | null): string {
  if (!role) return "STAFF";
  const r = role.toUpperCase().replace(/[\s-]+/g, "_");
  if (r.includes("SUPER")) return "SUPER_ADMIN";
  if (r.includes("ORG")) return "ORGANISATION_ADMIN";
  if (r.includes("DEPARTMENT") || r.includes("DEPT") || r.includes("MANAGER")) return "DEPARTMENT_MANAGER";
  if (r.includes("TEAM") || r.includes("LEAD")) return "TEAM_LEADER";
  if (r.includes("STAFF") || r.includes("EMPLOYEE") || r.includes("USER")) return "STAFF";
  return r;
}

export function getRoleDashboard(role?: string | null): string {
  const norm = normalizeRole(role);
  switch (norm) {
    case "SUPER_ADMIN":
      return "/super-admin/dashboard";
    case "ORGANISATION_ADMIN":
      return "/org-admin/dashboard";
    case "DEPARTMENT_MANAGER":
      return "/department-manager/dashboard";
    case "TEAM_LEADER":
      return "/team-leader/dashboard";
    case "STAFF":
    default:
      return "/employee/dashboard";
  }
}

export function isRoleAllowed(currentRole: string | null | undefined, allowedRoles: string[]): boolean {
  if (!currentRole) return false;
  const norm = normalizeRole(currentRole);
  const normalizedAllowed = allowedRoles.map((r) => normalizeRole(r));
  return normalizedAllowed.includes(norm);
}

export function getCurrentUser(): { id?: number | string; role?: string; email?: string; name?: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("currentUser") || localStorage.getItem("user");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
