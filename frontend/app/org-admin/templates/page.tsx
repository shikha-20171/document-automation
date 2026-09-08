"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TemplateTable, {
  TemplateItem,
  ModalKind,
  TemplateStatus,
  Visibility,
} from "./_components/TemplateTable";
import TemplateModals from "./_components/TemplateModals";
import { orgDocBuilderApi } from "@/services/templatesApi";
import apiClient from "@/lib/axios";

const categorySeed = [
  "Sales",
  "Finance",
  "HR",
  "Legal",
  "Procurement",
  "Operations",
  "Compliance",
  "Other",
];

const templateSeed: TemplateItem[] = [
  {
    id: 1001,
    name: "Commercial Proposal & Quotation",
    description: "Standard commercial quotation with itemized milestone fees, payment schedule, and signature block.",
    category: "Sales",
    status: "Active",
    usage: 48,
    createdBy: "Org Admin",
    owner: "Org Admin",
    updated: "10 Aug 2026",
    department: "Sales",
    documentType: "Quotation",
    tags: ["quotation", "sales", "proposal"],
    visibility: "Organisation Wide",
    isShared: true,
    content: `# COMMERCIAL PROPOSAL & QUOTATION\n\n**Quotation Reference:** {{quotation_number}}\n**Date:** {{today_date}}\n**Validity:** 30 Days from issue\n\n### Prepared For:\n**Client Name:** {{client_name}}\n**Company:** {{client_company}}\n**Billing Address:** {{client_address}}\n**Contact Email:** {{client_email}}\n\n### Service Provider Details:\n**Organisation:** {{organisation_name}}\n**Address:** {{organisation_address}}\n**Representative:** {{manager_name}}\n**Official Email:** {{organisation_email}}\n\n---\n\n### 1. Scope of Work & Deliverables\n{{project_scope}}\n\n### 2. Commercial Investment Breakdown\n| Item / Milestone Description | Qty | Rate (INR) | Total (INR) |\n| :--- | :--- | :--- | :--- |\n| Core Technology Platform License | 1 | {{basic_fee}} | {{basic_fee}} |\n| Custom Module Engineering & Setup | 1 | {{integration_fee}} | {{integration_fee}} |\n| Annual Technical Support & Maintenance | 1 | {{support_fee}} | {{support_fee}} |\n| **Total Investment Payable (Excl. Taxes)** | | | **{{total_amount}}** |\n\n### 3. Payment Terms & Schedule\n- 50% advance on commercial contract acceptance.\n- 40% upon completion of User Acceptance Testing (UAT).\n- 10% on live production handover.\n\n### 4. Client Sign-Off & Acceptance\nKindly confirm your acceptance of this quotation by returning a signed duplicate copy.\n\n---\n\n| For {{organisation_name}} (Authorized) | Client Acceptance Signature |\n| :--- | :--- |\n| _____________________________________ | _____________________________________ |\n| **Name:** {{manager_name}} | **Name:** {{client_name}} |\n| **Title:** Commercial Director | **Title:** Authorized Client Signatory |\n| **Date:** {{today_date}} | **Date:** __________________________ |`,
    activities: [
      { time: "10 Aug 11:30", event: "Admin published quotation template" },
    ],
  },
  {
    id: 1002,
    name: "Employee Offer Letter",
    description: "Standard offer letter for new hires with compensation breakdown, joining date, and e-signatures.",
    category: "HR",
    status: "Active",
    usage: 34,
    createdBy: "Rahul Admin",
    owner: "Rahul Admin",
    updated: "12 Aug 2026",
    department: "Human Resources",
    documentType: "Offer Letter",
    tags: ["employee", "offer", "joining"],
    visibility: "Organisation Wide",
    isShared: true,
    content: `# EMPLOYMENT OFFER LETTER\n\n**Date:** {{joining_date}}\n\n**To:** {{employee_name}}  \n**Employee ID:** {{employee_id}}  \n**Address:** {{client_address}}\n\nDear {{employee_name}},\n\nWe are pleased to formally extend an offer of employment for the position of **{{designation}}** in the **{{department}}** department at **{{organisation_name}}**.\n\n### 1. Position & Reporting\nYou will report directly to **{{manager_name}}** commencing on **{{joining_date}}**.\n\n### 2. Compensation & Benefits\nYour annual Gross CTC will be **{{total_salary}}**, structured as follows:\n- Basic Salary: {{basic_salary}}\n- House Rent Allowance: {{hra}}\n- Special Allowance: {{special_allowance}}\n- Total CTC: {{total_salary}}\n\n### 3. Key Responsibilities\n• Deliver scalable and compliant enterprise engineering solutions.\n• Adhere strictly to industry standards and security benchmarks.\n• Collaborate cross-functionally with team stakeholders.\n\n---\n\n| For Employer Signatory | Employee Acceptance |\n| :--- | :--- |\n| _______________________ | _______________________ |\n| Name: {{manager_name}} | Name: {{employee_name}} |`,
    activities: [
      { time: "12 Aug 10:30", event: "Rahul updated template" },
    ],
  },
  {
    id: 1003,
    name: "Mutual Non-Disclosure Agreement (NDA)",
    description: "Mutual confidentiality agreement for vendors, contractors, and corporate clients.",
    category: "Legal",
    status: "Active",
    usage: 28,
    createdBy: "Priya Legal",
    owner: "Priya Legal",
    updated: "10 Aug 2026",
    department: "Legal",
    documentType: "NDA",
    tags: ["nda", "legal", "confidential"],
    visibility: "Organisation Wide",
    isShared: true,
    content: `# MUTUAL NON-DISCLOSURE AGREEMENT\n\n**Effective Date:** {{today_date}}\n\n**Disclosing Party:** {{organisation_name}}\n**Receiving Party:** {{client_name}} ({{client_company}})\n\n### 1. Purpose & Confidentiality\nThe parties intend to engage in discussions concerning potential business collaboration. Both parties agree to protect proprietary source codes, financial statements, and business data.\n\n### 2. Non-Disclosure Obligations\nThe Receiving Party shall hold all Confidential Information in strict confidence for a period of 3 (three) years.\n\n---\n\n| Disclosing Party Signature | Receiving Party Signature |\n| :--- | :--- |\n| __________________________ | __________________________ |\n| Name: {{manager_name}} | Name: {{client_name}} |`,
    activities: [{ time: "10 Aug 09:10", event: "Template published" }],
  },
  {
    id: 1004,
    name: "GST Tax Invoice & Billing",
    description: "Standard tax invoice template with itemized line items, GSTIN, and payment terms.",
    category: "Finance",
    status: "Active",
    usage: 19,
    createdBy: "Neha Finance",
    owner: "Neha Finance",
    updated: "09 Aug 2026",
    department: "Finance",
    documentType: "Invoice",
    tags: ["invoice", "gst", "payment"],
    visibility: "Organisation Wide",
    isShared: true,
    content: `# TAX INVOICE\n\n**Invoice Date:** {{today_date}}\n**Vendor:** {{organisation_name}}\n**Client:** {{client_name}} ({{client_company}})\n**Client Address:** {{client_address}}\n\n### Billing Summary\n| Description | Rate | Amount |\n| :--- | :--- | :--- |\n| Professional Technology Services | Standard Fee | {{total_amount}} |\n| Total Tax & GST | 18% | Included |\n| **Grand Total Payable** | Net 30 Days | **{{total_amount}}** |\n\nAuthorized Signatory:\n{{organisation_name}} Accounts Dept`,
    activities: [{ time: "09 Aug 14:20", event: "Template published" }],
  },
];

export default function OrgAdminTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<TemplateItem[]>(templateSeed);
  const [modal, setModal] = useState<ModalKind>("none");
  const [selected, setSelected] = useState<TemplateItem | null>(null);

  const loadTemplates = async () => {
    let apiItems: TemplateItem[] = [];

    // 1. Fetch real unified templates from PostgreSQL database
    try {
      const res = await apiClient.get("/api/unified-templates").catch(() => null);
      if (res?.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        apiItems = res.data.data.map((t: any, idx: number) => {
          let content = typeof t.content === "string" && t.content.trim() ? t.content : "";
          if (!content && Array.isArray(t.sections) && t.sections.length > 0) {
            content = t.sections
              .map((sec: any) => {
                let part = `### ${sec.title || "Section"}\n\n${sec.body || ""}`;
                if (sec.tableData?.headers && sec.tableData?.rows) {
                  part += `\n\n| ${sec.tableData.headers.join(" | ")} |\n| ${sec.tableData.headers.map(() => ":---").join(" | ")} |\n`;
                  sec.tableData.rows.forEach((r: any) => {
                    part += `| ${Array.isArray(r) ? r.join(" | ") : r} |\n`;
                  });
                }
                return part;
              })
              .join("\n\n---\n\n");
          }

          return {
            id: t.id || `tpl-${idx + 1}`,
            name: t.name,
            description: t.description || `Reusable master ${t.documentType || "document"} blueprint.`,
            category: t.category || "General",
            status: "Active" as TemplateStatus,
            usage: t._count?.documents || t.usage || 0,
            createdBy: t.isStandard ? "System Master" : "Organisation",
            owner: "Organisation",
            updated: t.updatedAt ? new Date(t.updatedAt).toLocaleDateString("en-GB") : "Recently",
            department: "All",
            documentType: t.documentType || "Document",
            tags: [t.category || "General"],
            visibility: "Organisation Wide" as Visibility,
            isShared: true,
            content: content || `# ${t.name}\n\nStandard template clauses.`,
            activities: [{ time: "Active", event: "Template available" }],
          };
        });
      }
    } catch (err) {
      console.warn("Unified templates database fetch warning:", err);
    }

    // 2. Fetch from builder api fallback if empty
    if (apiItems.length === 0) {
      try {
        const res = await orgDocBuilderApi.getTemplates().catch(() => null);
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          apiItems = res.data.map((t: any, idx: number) => ({
            id: t.id || idx + 1,
            name: t.name,
            description: t.description || "",
            category: t.category || "General",
            status: "Active" as TemplateStatus,
            usage: t.usage || 0,
            createdBy: t.createdBy || "Org Admin",
            owner: t.createdBy || "Org Admin",
            updated: t.updatedAt ? new Date(t.updatedAt).toLocaleDateString("en-GB") : "Recently",
            department: t.department || "All",
            documentType: t.documentType || "Document",
            tags: t.tags || [t.category || "General"],
            visibility: "Organisation Wide" as Visibility,
            isShared: true,
            content: t.content || "",
            activities: t.activities || [{ time: "Just now", event: "Template active" }],
          }));
        }
      } catch {}
    }

    // 3. Read any local custom templates created by user in AI Builder
    let localItems: TemplateItem[] = [];
    if (typeof window !== "undefined") {
      try {
        const rawLocal = localStorage.getItem("docucore_custom_templates");
        if (rawLocal) {
          localItems = JSON.parse(rawLocal);
        }
      } catch {}
    }

    // 4. Merge: templateSeed -> apiItems -> localItems (user creations take absolute precedence)
    const mergedMap = new Map<string, TemplateItem>();
    templateSeed.forEach((t) => mergedMap.set(String(t.name.toLowerCase().trim()), t));
    apiItems.forEach((t) => mergedMap.set(String(t.name.toLowerCase().trim()), t));
    localItems.forEach((t) => mergedMap.set(String(t.name.toLowerCase().trim()), t));

    setTemplates(Array.from(mergedMap.values()));
  };

  useEffect(() => {
    void loadTemplates();

    // Re-check when window regains focus (e.g. returning from AI Builder tab)
    const onFocus = () => void loadTemplates();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const handleOpenModal = (kind: ModalKind, template?: TemplateItem) => {
    if (kind === "create") {
      router.push("/org-admin/templates/create");
      return;
    }
    if (template) setSelected(template);
    setModal(kind);
  };

  const handleCloseModal = () => {
    setModal("none");
  };

  const handleCreateTemplate = async (data: Partial<TemplateItem>) => {
    const newId = `tmpl-${Date.now()}`;
    const newTemplate: TemplateItem = {
      id: newId,
      name: data.name || "Untitled Template",
      description: data.description || "",
      category: data.category || "General",
      status: "Active",
      usage: 0,
      createdBy: "Org Admin",
      owner: "Org Admin",
      updated: "Just now",
      department: data.department || "All",
      documentType: data.documentType || data.name || "Document",
      tags: data.tags || [data.category || "General"],
      visibility: (data.visibility || "Organisation Wide") as Visibility,
      isShared: true,
      content: data.content || `# ${data.name || "Template"}\n\nStandard template content.`,
      activities: [{ time: "Just now", event: "Template created" }],
    };

    // Immediate UI update
    setTemplates((prev) => [newTemplate, ...prev.filter((t) => t.name !== newTemplate.name)]);

    // Store in localStorage
    if (typeof window !== "undefined") {
      try {
        const rawLocal = localStorage.getItem("docucore_custom_templates");
        const existing: TemplateItem[] = rawLocal ? JSON.parse(rawLocal) : [];
        localStorage.setItem(
          "docucore_custom_templates",
          JSON.stringify([newTemplate, ...existing.filter((t) => t.name !== newTemplate.name)])
        );
      } catch {}
    }

    // Persist to backend database
    try {
      const res = await orgDocBuilderApi.createTemplate({
        name: newTemplate.name,
        description: newTemplate.description,
        category: newTemplate.category,
        documentType: newTemplate.documentType,
        content: newTemplate.content,
        status: "ACTIVE",
      });
      if (res?.data?.id) {
        newTemplate.id = res.data.id;
      }
    } catch (e) {
      console.error("Template creation error:", e);
    }
  };

  const handleUpdateTemplate = async (updated: TemplateItem) => {
    setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));

    // Update in localStorage
    if (typeof window !== "undefined") {
      try {
        const rawLocal = localStorage.getItem("docucore_custom_templates");
        const existing: TemplateItem[] = rawLocal ? JSON.parse(rawLocal) : [];
        const filtered = existing.filter((t) => t.id !== updated.id && t.name !== updated.name);
        localStorage.setItem("docucore_custom_templates", JSON.stringify([updated, ...filtered]));
      } catch {}
    }

    try {
      await orgDocBuilderApi.updateTemplate(updated.id, {
        name: updated.name,
        description: updated.description,
        category: updated.category,
        documentType: updated.documentType,
        content: updated.content,
        status: updated.status,
      });
    } catch (e) {
      console.error("Template update error:", e);
    }
  };

  const handleDuplicate = async (template: TemplateItem) => {
    const copyId = `tmpl-${Date.now()}`;
    const copy: TemplateItem = {
      ...template,
      id: copyId,
      name: `${template.name} (Copy)`,
      usage: 0,
      updated: "Just now",
      activities: [{ time: "Just now", event: "Duplicated template" }],
    };

    setTemplates((prev) => [copy, ...prev]);

    if (typeof window !== "undefined") {
      try {
        const rawLocal = localStorage.getItem("docucore_custom_templates");
        const existing: TemplateItem[] = rawLocal ? JSON.parse(rawLocal) : [];
        localStorage.setItem("docucore_custom_templates", JSON.stringify([copy, ...existing]));
      } catch {}
    }

    try {
      await orgDocBuilderApi.duplicateTemplate(template.id);
    } catch (e) {
      console.error("Template duplicate error:", e);
    }
  };

  const handleDelete = async (id: number | string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));

    if (typeof window !== "undefined") {
      try {
        const rawLocal = localStorage.getItem("docucore_custom_templates");
        if (rawLocal) {
          const existing: TemplateItem[] = JSON.parse(rawLocal);
          localStorage.setItem(
            "docucore_custom_templates",
            JSON.stringify(existing.filter((t) => t.id !== id))
          );
        }
      } catch {}
    }

    try {
      await orgDocBuilderApi.deleteTemplate(id);
    } catch (e) {
      console.error("Template delete error:", e);
    }
  };

  return (
    <div className="space-y-6">
      <TemplateTable
        templates={templates}
        categories={categorySeed}
        onOpenModal={handleOpenModal}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
      />

      <TemplateModals
        modal={modal}
        selected={selected}
        categories={categorySeed}
        onClose={handleCloseModal}
        onOpenModal={handleOpenModal}
        onCreateTemplate={handleCreateTemplate}
        onUpdateTemplate={handleUpdateTemplate}
      />
    </div>
  );
}
