import {
  LayoutDashboard,
  FileText,
  LayoutTemplate,
  CheckSquare,
  CheckCircle2,
  Sparkles,
  Bot,
  Bell,
  UserCheck,
  BarChart3,
} from "lucide-react";

export interface EmployeeNavItem {
  name: string;
  href: string;
  icon: any;
  badge?: string;
  badgeColor?: string;
}

export const employeeNavItems: EmployeeNavItem[] = [
  {
    name: "Dashboard",
    href: "/employee/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Documents",
    href: "/employee/documents",
    icon: FileText,
  },
  {
    name: "Document Builder",
    href: "/employee/ai-builder",
    icon: Sparkles,
  },
  {
    name: "Templates",
    href: "/employee/document-templates",
    icon: LayoutTemplate,
  },
  {
    name: "AI Tools",
    href: "/employee/ai-tools",
    icon: Bot,
  },
  {
    name: "My Tasks",
    href: "/employee/tasks",
    icon: CheckSquare,
  },
  {
    name: "Approvals",
    href: "/employee/approvals",
    icon: CheckCircle2,
  },
  {
    name: "Reports & Performance",
    href: "/employee/reports",
    icon: BarChart3,
  },
  {
    name: "Notifications",
    href: "/employee/notifications",
    icon: Bell,
  },
  {
    name: "Profile",
    href: "/employee/profile",
    icon: UserCheck,
  },
];

