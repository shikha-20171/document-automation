"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import TemplateDetailsStep, { TemplateDetailsData } from "../_components/TemplateDetailsStep";
import TemplateDesigner from "../_components/TemplateDesigner";

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

  const handleSaveDraft = (content: string) => {
    if (typeof window !== "undefined") {
      const existing = JSON.parse(localStorage.getItem("org_custom_templates") || "[]");
      const newTemplate = {
        id: Date.now(),
        name: templateDetails.name,
        description: templateDetails.description,
        category: templateDetails.category,
        status: "Draft",
        usage: 0,
        createdBy: "Org Admin",
        owner: "Org Admin",
        updated: "Just now",
        department: templateDetails.department || "All",
        documentType: templateDetails.name,
        tags: templateDetails.tags,
        visibility: templateDetails.visibility,
        isShared: true,
        content,
        activities: [{ time: "Just now", event: "Template saved as draft" }],
      };
      localStorage.setItem("org_custom_templates", JSON.stringify([newTemplate, ...existing]));
    }
  };

  const handlePublish = (content: string) => {
    if (typeof window !== "undefined") {
      const existing = JSON.parse(localStorage.getItem("org_custom_templates") || "[]");
      const newTemplate = {
        id: Date.now(),
        name: templateDetails.name,
        description: templateDetails.description,
        category: templateDetails.category,
        status: "Active",
        usage: 0,
        createdBy: "Org Admin",
        owner: "Org Admin",
        updated: "Just now",
        department: templateDetails.department || "All",
        documentType: templateDetails.name,
        tags: templateDetails.tags,
        visibility: templateDetails.visibility,
        isShared: true,
        content,
        activities: [{ time: "Just now", event: "Template published to organization" }],
      };
      localStorage.setItem("org_custom_templates", JSON.stringify([newTemplate, ...existing]));
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
          onBack={handleBackToDetails}
          onSaveDraft={handleSaveDraft}
          onPublish={handlePublish}
        />
      )}
    </div>
  );
}
