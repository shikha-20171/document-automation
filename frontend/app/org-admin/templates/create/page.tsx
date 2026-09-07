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
      await orgDocBuilderApi.createTemplate(payload).catch(() => null);
    } catch (e) {
      console.error("Template save error:", e);
    }
  };

  const handlePublish = async (content: string) => {
    try {
      const payload = {
        name: templateDetails.name,
        description: templateDetails.description,
        category: templateDetails.category,
        documentType: templateDetails.name,
        content,
        status: "ACTIVE",
      };
      await orgDocBuilderApi.createTemplate(payload).catch(() => null);
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
          onBack={handleBackToDetails}
          onSaveDraft={handleSaveDraft}
          onPublish={handlePublish}
        />
      )}
    </div>
  );
}
