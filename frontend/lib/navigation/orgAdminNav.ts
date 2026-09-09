import {
  LayoutDashboard,
  FileText,
  Sparkles,
  PenTool,
  Layout,
  GitBranch,
  CheckCircle2,
  BarChart3,
  Building2,
  Plug,
  History,
  Settings,
  Users2,
  FileCheck,
  type LucideIcon,
} from "lucide-react";

export type OrgAdminNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  requiredFeature?: string;
};

export type OrgAdminNavSection = {
  title: string;
  items: OrgAdminNavItem[];
};

export const orgAdminNavSections: OrgAdminNavSection[] = [
  {
    title: "Document Operations",
    items: [
      { title: "Dashboard", href: "/org-admin/dashboard", icon: LayoutDashboard },
      { title: "Documents", href: "/org-admin/documents", icon: FileText },
      { title: "Document Builder", href: "/org-admin/ai-builder", icon: PenTool },
      { title: "Templates", href: "/org-admin/templates", icon: Layout },
      { title: "E-Signatures", href: "/org-admin/e-signatures", icon: FileCheck },
      { title: "AI Tools", href: "/org-admin/ai-tools", icon: Sparkles, requiredFeature: "ai.processing" },
      { title: "Workflows", href: "/org-admin/workflows", icon: GitBranch, requiredFeature: "workflows.enabled" },
      { title: "Clients / CRM", href: "/org-admin/clients-crm", icon: Users2, requiredFeature: "crm.enabled" },
      { title: "Approvals", href: "/org-admin/approvals", icon: CheckCircle2, requiredFeature: "workflows.enabled" },
    ],
  },
  {
    title: "Administration & Oversight",
    items: [
      { title: "Reports & Analytics", href: "/org-admin/analytics", icon: BarChart3, requiredFeature: "analytics.basic" },
      { title: "Integrations", href: "/org-admin/integrations", icon: Plug, requiredFeature: "integrations.google" },
      { title: "Organisation", href: "/org-admin/team", icon: Building2 },
      { title: "Audit Logs", href: "/org-admin/audit-logs", icon: History, requiredFeature: "security.basic_audit" },
      { title: "Settings", href: "/org-admin/settings", icon: Settings },
    ],
  },
];