import {
  LayoutDashboard,
  Users,
  FileText,
  Copy,
  CheckSquare,
  CheckCircle,
  GitFork,
  Sparkles,
  BarChart3,
  Bell,
  User,
  HelpCircle,
  LucideIcon,
} from "lucide-react";

export interface TeamLeaderNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export const teamLeaderNavItems: TeamLeaderNavItem[] = [
  {
    title: "Dashboard",
    href: "/team-leader/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "My Team",
    href: "/team-leader/my-team",
    icon: Users,
  },
  {
    title: "Documents",
    href: "/team-leader/documents",
    icon: FileText,
  },
  {
    title: "Document Templates",
    href: "/team-leader/document-templates",
    icon: Copy,
  },
  {
    title: "Tasks",
    href: "/team-leader/tasks",
    icon: CheckSquare,
  },
  {
    title: "Approvals",
    href: "/team-leader/approvals",
    icon: CheckCircle,
    badge: "2",
  },
  {
    title: "Workflow",
    href: "/team-leader/workflow",
    icon: GitFork,
  },
  {
    title: "AI Tools",
    href: "/team-leader/ai-tools",
    icon: Sparkles,
  },
  {
    title: "Reports",
    href: "/team-leader/reports",
    icon: BarChart3,
  },
  {
    title: "Notifications",
    href: "/team-leader/notifications",
    icon: Bell,
    badge: "3",
  },
  {
    title: "Profile",
    href: "/team-leader/profile",
    icon: User,
  },
  {
    title: "Help & Support",
    href: "/team-leader/support",
    icon: HelpCircle,
  },
];
