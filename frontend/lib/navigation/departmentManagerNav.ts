import {
  LayoutDashboard,
  FileText,
  Sparkles,
  Layout,
  Users,
  CheckSquare,
  BarChart3,
  Bell,
  UserCircle2,
  type LucideIcon,
} from "lucide-react";

export type DepartmentManagerNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export const departmentManagerNavItems: DepartmentManagerNavItem[] = [
  { title: "Dashboard", href: "/department-manager/dashboard", icon: LayoutDashboard },
  { title: "Documents", href: "/department-manager/documents", icon: FileText },
  { title: "Document Builder", href: "/department-manager/ai-builder", icon: Sparkles },
  { title: "Templates", href: "/department-manager/document-templates", icon: Layout },
  { title: "Team / Employees", href: "/department-manager/team", icon: Users },
  { title: "Approvals", href: "/department-manager/approvals", icon: CheckSquare },
  { title: "Reports", href: "/department-manager/reports", icon: BarChart3 },
  { title: "Notifications", href: "/department-manager/notifications", icon: Bell },
  { title: "Profile", href: "/department-manager/profile", icon: UserCircle2 },
];