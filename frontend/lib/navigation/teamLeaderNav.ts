import {
  LayoutDashboard,
  Users,
  FileText,
  Copy,
  CheckSquare,
  CheckCircle,
  GitFork,
  Sparkles,
  Bot,
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
    title: "Documents",
    href: "/team-leader/documents",
    icon: FileText,
  },
  {
    title: "Document Builder",
    href: "/team-leader/ai-builder",
    icon: Sparkles,
  },
  {
    title: "Templates",
    href: "/team-leader/document-templates",
    icon: Copy,
  },
  {
    title: "AI Tools",
    href: "/team-leader/ai-tools",
    icon: Bot,
  },
  {
    title: "My Team",
    href: "/team-leader/my-team",
    icon: Users,
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
