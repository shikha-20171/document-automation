"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import TemplateTable, {
  TemplateItem,
  ModalKind,
  TemplateStatus,
  Visibility,
} from "./_components/TemplateTable";
import TemplateModals from "./_components/TemplateModals";

const categorySeed = ["HR", "Legal", "Finance", "Sales", "Procurement", "Operations", "Compliance", "Other"];

const templateSeed: TemplateItem[] = [
  {
    id: 1001,
    name: "Employee Offer Letter",
    description: "Standard offer letter for new employees with compensation breakdown, joining date, and e-signatures.",
    category: "HR",
    status: "Active",
    usage: 42,
    createdBy: "Rahul Admin",
    owner: "Rahul Admin",
    updated: "12 Aug 2026",
    department: "Human Resources",
    documentType: "Offer Letter",
    tags: ["employee", "offer", "joining"],
    visibility: "Organisation Wide",
    isShared: true,
    content: `# EMPLOYMENT OFFER LETTER\n\n**Date:** {{joining_date}}\n\n**To:** {{employee_name}}  \n**Employee ID:** {{employee_id}}  \n**Address:** {{client_address}}\n\nDear {{employee_name}},\n\nWe are pleased to formally extend an offer of employment for the position of **{{designation}}** in the **{{department}}** department at **{{organisation_name}}**.\n\n### 1. Position & Reporting\nYou will report directly to **{{manager_name}}** commencing on **{{joining_date}}**.\n\n### 2. Compensation & Benefits\nYour annual Gross CTC will be **{{total_salary}}**, structured as follows:\n- Basic Salary: {{basic_salary}}\n- House Rent Allowance: {{hra}}\n- Special Allowance: {{special_allowance}}\n- Total CTC: {{total_salary}}\n\n### 3. Key Responsibilities\n{{AI_JOB_RESPONSIBILITIES}}\n\n---\n\n| For Employer Signatory | Employee Acceptance |\n| :--- | :--- |\n| _______________________ | _______________________ |\n| Name: {{manager_name}} | Name: {{employee_name}} |`,
    activities: [
      { time: "12 Aug 10:30", event: "Rahul updated template" },
      { time: "12 Aug 10:45", event: "Admin published template" },
    ],
  },
  {
    id: 1002,
    name: "Mutual Non-Disclosure Agreement (NDA)",
    description: "Mutual confidentiality agreement for vendors, contractors, and corporate clients.",
    category: "Legal",
    status: "Active",
    usage: 31,
    createdBy: "Priya Legal",
    owner: "Priya Legal",
    updated: "10 Aug 2026",
    department: "Legal",
    documentType: "NDA",
    tags: ["nda", "legal", "confidential"],
    visibility: "Department Only",
    isShared: true,
    content: `# MUTUAL NON-DISCLOSURE AGREEMENT\n\n**Effective Date:** {{joining_date}}\n\n**Disclosing Party:** {{organisation_name}}\n**Receiving Party:** {{client_name}} ({{client_company}})\n\n### 1. Purpose & Confidentiality\nThe parties intend to engage in discussions concerning potential business collaboration. Both parties agree to protect proprietary source codes, financial statements, and business data.\n\n### 2. Non-Disclosure Obligations\nThe Receiving Party shall hold all Confidential Information in strict confidence for a period of 3 (three) years.\n\n---\n\n| Disclosing Party Signature | Receiving Party Signature |\n| :--- | :--- |\n| __________________________ | __________________________ |\n| Name: {{manager_name}} | Name: {{client_name}} |`,
    activities: [
      { time: "10 Aug 09:10", event: "Template published" },
    ],
  },
  {
    id: 1003,
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
    content: `# TAX INVOICE\n\n**Invoice Date:** {{joining_date}}\n**Vendor:** {{organisation_name}}\n**Client:** {{client_name}} ({{client_company}})\n**Client Address:** {{client_address}}\n\n### Billing Summary\n| Description | Rate | Amount |\n| :--- | :--- | :--- |\n| Professional Technology Services | Standard Fee | {{total_salary}} |\n| Total Tax & GST | 18% | Included |\n| **Grand Total Payable** | Net 30 Days | **{{total_salary}}** |\n\nAuthorized Signatory:\n{{organisation_name}} Accounts Dept`,
    activities: [{ time: "09 Aug 14:20", event: "Template published" }],
  },
  {
    id: 1004,
    name: "B2B Enterprise Master Services Agreement",
    description: "Comprehensive services contract covering SLAs, liability limits, and milestones.",
    category: "Sales",
    status: "Active",
    usage: 14,
    createdBy: "Anil Sales",
    owner: "Anil Sales",
    updated: "30 Jul 2026",
    department: "Sales",
    documentType: "Proposal",
    tags: ["contract", "sales", "msa"],
    visibility: "Organisation Wide",
    isShared: true,
    content: `# MASTER SERVICES AGREEMENT\n\n**Contract Value:** {{contract_value}}\n**Effective Date:** {{joining_date}}\n**Service Provider:** {{organisation_name}}\n**Client:** {{client_name}}\n\n### 1. Scope of Work\nProvider shall deliver digital automation software and infrastructure maintenance.\n\n### 2. Payment Terms\nInvoices are payable within 30 days of issuance. Total consideration: {{contract_value}}.\n\nAuthorized Signatures:\nFor Provider: {{manager_name}}\nFor Client: {{client_name}}`,
    activities: [{ time: "30 Jul 10:00", event: "Template published" }],
  },
];

import { orgDocBuilderApi } from "@/services/templatesApi";

export default function OrgAdminTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<TemplateItem[]>(templateSeed);
  const [modal, setModal] = useState<ModalKind>("none");
  const [selected, setSelected] = useState<TemplateItem | null>(null);

  const loadTemplates = async () => {
    try {
      const res = await orgDocBuilderApi.getTemplates();
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        const formatted: TemplateItem[] = res.data.map((t: any, idx: number) => ({
          id: t.id || idx + 1,
          name: t.name,
          description: t.description || "",
          category: t.category || "General",
          status: (t.status === "DRAFT" || t.status === "Draft" ? "Draft" : t.status === "ARCHIVED" || t.status === "Archived" ? "Archived" : "Active") as TemplateStatus,
          usage: t.usage || 0,
          createdBy: t.createdBy || "Org Admin",
          owner: t.createdBy || "Org Admin",
          updated: t.updatedAt ? new Date(t.updatedAt).toLocaleDateString("en-GB") : "Recently",
          department: t.department || "All",
          documentType: t.documentType || "Document",
          tags: t.tags || [t.category || "General"],
          visibility: (t.visibility || "Organisation Wide") as Visibility,
          isShared: true,
          content: t.content || "",
          activities: t.activities || [{ time: "Just now", event: "Template active" }],
        }));
        setTemplates(formatted);
      }
    } catch (err) {
      console.warn("Failed to load templates from API, using fallback:", err);
    }
  };

  useEffect(() => {
    void loadTemplates();
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
    const newItem: TemplateItem = {
      id: Date.now(),
      name: data.name || "Untitled Template",
      description: data.description || "",
      category: data.category || "General",
      status: "Draft",
      usage: 0,
      createdBy: "Org Admin",
      owner: "Org Admin",
      updated: "Just now",
      department: data.department || "All",
      documentType: "Document",
      tags: data.tags || [],
      visibility: data.visibility || "Organisation Wide",
      isShared: true,
      activities: [{ time: "Just now", event: "Template created" }],
    };

    setTemplates([newItem, ...templates]);
    setSelected(newItem);
    setModal("builder");

    try {
      await orgDocBuilderApi.createTemplate({
        name: newItem.name,
        description: newItem.description,
        category: newItem.category,
        documentType: newItem.documentType,
        content: newItem.content || "",
        status: "DRAFT",
      });
      void loadTemplates();
    } catch (e) {}
  };

  const handleUpdateTemplate = async (updated: TemplateItem) => {
    setTemplates(templates.map((t) => (t.id === updated.id ? updated : t)));
    try {
      await orgDocBuilderApi.updateTemplate(updated.id, {
        name: updated.name,
        description: updated.description,
        category: updated.category,
        documentType: updated.documentType,
        content: updated.content,
        status: updated.status,
      });
      void loadTemplates();
    } catch (e) {}
  };

  const handleDuplicate = async (template: TemplateItem) => {
    const copy: TemplateItem = {
      ...template,
      id: Date.now(),
      name: `${template.name} (Copy)`,
      usage: 0,
      updated: "Just now",
    };
    setTemplates([copy, ...templates]);
    try {
      await orgDocBuilderApi.duplicateTemplate(template.id);
      void loadTemplates();
    } catch (e) {}
  };

  const handleDelete = async (id: number | string) => {
    setTemplates(templates.filter((t) => t.id !== id));
    try {
      await orgDocBuilderApi.deleteTemplate(id);
      void loadTemplates();
    } catch (e) {}
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
        onCreateTemplate={handleCreateTemplate}
        onUpdateTemplate={handleUpdateTemplate}
      />
    </div>
  );
}
