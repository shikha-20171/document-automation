"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import TemplateDetailsStep, { TemplateDetailsData } from "../_components/TemplateDetailsStep";
import TemplateDesigner from "../_components/TemplateDesigner";
import { orgDocBuilderApi } from "@/services/templatesApi";

export default function CreateTemplatePage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [templateDetails, setTemplateDetails] = useState<TemplateDetailsData>({
    name: "Employee Offer Letter",
    description: "Standard offer letter for new employees with salary breakdown and terms",
    category: "HR",
    visibility: "Organisation Wide",
    tags: ["offer", "employee", "joining"],
  });

  const handleNextToDesigner = (data: TemplateDetailsData) => {
    setTemplateDetails(data);
    setStep(2);
  };

  const handleBackToDetails = () => {
    setStep(1);
  };

  const starterContent = React.useMemo(() => {
    const isQuote = templateDetails.name.toLowerCase().includes("quotation") || templateDetails.category === "Sales";
    if (isQuote) {
      return `# COMMERCIAL PROPOSAL & QUOTATION\n\n**Quotation Reference:** {{quotation_number}}\n**Date:** {{today_date}}\n**Validity:** 30 Days from issue\n\n### Prepared For:\n**Client Name:** {{client_name}}\n**Company:** {{client_company}}\n**Billing Address:** {{client_address}}\n**Contact Email:** {{client_email}}\n\n### Service Provider Details:\n**Organisation:** {{organisation_name}}\n**Address:** {{organisation_address}}\n**Representative:** {{manager_name}}\n**Official Email:** {{organisation_email}}\n\n---\n\n### 1. Scope of Work & Deliverables\n{{project_scope}}\n\n### 2. Commercial Investment Breakdown\n| Item / Milestone Description | Qty | Rate (INR) | Total (INR) |\n| :--- | :--- | :--- | :--- |\n| Core Technology Solution & Licensing | 1 | {{basic_fee}} | {{basic_fee}} |\n| Custom Module Engineering & Integrations | 1 | {{integration_fee}} | {{integration_fee}} |\n| Maintenance, Hosting & SLA Support (Year 1) | 1 | {{support_fee}} | {{support_fee}} |\n| **Total Investment Payable (Excl. Taxes)** | | | **{{total_amount}}** |\n\n### 3. Payment Terms & Schedule\n- 50% advance on commercial contract acceptance.\n- 40% upon completion of User Acceptance Testing (UAT).\n- 10% on live production handover.\n\n### 4. Client Sign-Off & Acceptance\nKindly confirm your acceptance of this quotation by returning a signed duplicate copy.\n\n---\n\n| For {{organisation_name}} (Authorized) | Client Acceptance Signature |\n| :--- | :--- |\n| _____________________________________ | _____________________________________ |\n| **Name:** {{manager_name}} | **Name:** {{client_name}} |\n| **Title:** Commercial Director | **Title:** Authorized Client Signatory |\n| **Date:** {{today_date}} | **Date:** __________________________ |`;
    }
    return undefined;
  }, [templateDetails.name, templateDetails.category]);

  const handleSaveDraft = async (content: string) => {
    try {
      const payload = {
        name: templateDetails.name,
        description: templateDetails.description,
        category: templateDetails.category,
        documentType: templateDetails.name,
        content,
        status: "DRAFT",
      };
      await orgDocBuilderApi.createTemplate(payload);
    } catch (e) {
      console.error("Template save error:", e);
    }
  };

  const handlePublish = async (content: string) => {
    const newTemplate = {
      id: `tmpl-${Date.now()}`,
      name: templateDetails.name,
      description: templateDetails.description,
      category: templateDetails.category,
      documentType: templateDetails.name,
      status: "Active",
      usage: 0,
      createdBy: "Org Admin",
      owner: "Org Admin",
      updated: "Just now",
      department: templateDetails.department || "All",
      visibility: templateDetails.visibility,
      tags: templateDetails.tags || [templateDetails.category],
      isShared: true,
      content,
      activities: [{ time: "Just now", event: "Template published" }],
    };

    if (typeof window !== "undefined") {
      try {
        const rawLocal = localStorage.getItem("docucore_custom_templates");
        const existing = rawLocal ? JSON.parse(rawLocal) : [];
        localStorage.setItem(
          "docucore_custom_templates",
          JSON.stringify([newTemplate, ...existing.filter((t: any) => t.name !== newTemplate.name)])
        );
      } catch {}
    }

    try {
      const payload = {
        name: templateDetails.name,
        description: templateDetails.description,
        category: templateDetails.category,
        documentType: templateDetails.name,
        content,
        status: "ACTIVE",
      };
      await orgDocBuilderApi.createTemplate(payload);
    } catch (e) {
      console.error("Template publish error:", e);
    }
    router.push("/org-admin/templates");
  };

  return (
    <div className="w-full min-h-[calc(100vh-100px)] py-4">
      {step === 1 ? (
        <TemplateDetailsStep
          initialData={templateDetails}
          onCancel={() => router.push("/org-admin/templates")}
          onNext={handleNextToDesigner}
        />
      ) : (
        <TemplateDesigner
          details={templateDetails}
          initialContent={starterContent}
          onBack={handleBackToDetails}
          onSaveDraft={handleSaveDraft}
          onPublish={handlePublish}
        />
      )}
    </div>
  );
}
