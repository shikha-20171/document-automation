import {
  LayoutDashboard,
  FileText,
  Sparkles,
  Layout,
  GitBranch,
  PenTool,
  Bot,
  BarChart3,
  UserCheck,
  Blocks,
  Settings,
  LifeBuoy,
  ShieldCheck,
  Bell,
  type LucideIcon,
} from "lucide-react";

export type OrgAdminNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export type OrgAdminNavSection = {
  title: string;
  items: OrgAdminNavItem[];
};

export const orgAdminNavSections: OrgAdminNavSection[] = [
  {
    title: "", 
    items: [
      { title: "Dashboard", href: "/org-admin/dashboard", icon: LayoutDashboard },
      { title: "Workflows & Approvals", href: "/org-admin/workflows", icon: GitBranch },
      { title: "Notifications", href: "/org-admin/notifications", icon: Bell },
      { title: "Documents", href: "/org-admin/documents", icon: FileText },
      { title: "Governance", href: "/org-admin/governance", icon: ShieldCheck },
      { title: "E-Signatures", href: "/org-admin/e-signatures", icon: PenTool },
      { title: "AI Tools", href: "/org-admin/ai-tools", icon: Bot },
      { title: "AI Document Builder", href: "/org-admin/ai-builder", icon: Sparkles },
      { title: "Templates", href: "/org-admin/templates", icon: Layout },
      { title: "Analytics", href: "/org-admin/analytics", icon: BarChart3 },
      { title: "Team", href: "/org-admin/team", icon: UserCheck },
      { title: "Integrations", href: "/org-admin/integrations", icon: Blocks },
      { title: "Settings", href: "/org-admin/settings", icon: Settings },
      { title: "Support", href: "/org-admin/support", icon: LifeBuoy },
    ],
  },
];