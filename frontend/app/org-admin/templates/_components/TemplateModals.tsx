"use client";

import React from "react";
import {
  TemplateItem,
  ModalKind,
} from "./TemplateTable";
import TemplateDetailsStep, { TemplateDetailsData } from "./TemplateDetailsStep";
import TemplateDesigner from "./TemplateDesigner";
import TemplatePreviewModal from "./TemplatePreviewModal";
import TemplateUseModal from "./TemplateUseModal";
import TemplateShareModal from "./TemplateShareModal";

interface TemplateModalsProps {
  modal: ModalKind;
  selected: TemplateItem | null;
  categories: string[];
  onClose: () => void;
  onCreateTemplate: (template: Partial<TemplateItem>) => void;
  onUpdateTemplate: (template: TemplateItem) => void;
}

export default function TemplateModals({
  modal,
  selected,
  categories,
  onClose,
  onCreateTemplate,
  onUpdateTemplate,
}: TemplateModalsProps) {
  if (modal === "none") return null;

  return (
    <>
      {/* 1. Step 1: Create Template Modal (Template Details) */}
      {modal === "create" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-4xl max-h-[95vh] overflow-y-auto">
            <TemplateDetailsStep
              onCancel={onClose}
              onNext={(data: TemplateDetailsData) => {
                onCreateTemplate({
                  name: data.name,
                  description: data.description,
                  category: data.category,
                  department: data.department || "All",
                  visibility: data.visibility,
                  tags: data.tags,
                  status: "Draft",
                });
              }}
            />
          </div>
        </div>
      )}

      {/* 2. Step 2: Full Manual Template Designer */}
      {modal === "builder" && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-2 md:p-4 overflow-hidden">
          <div className="w-full h-full max-w-7xl">
            <TemplateDesigner
              details={{
                name: selected.name,
                description: selected.description,
                category: selected.category,
                visibility: selected.visibility as any,
                department: selected.department,
                tags: selected.tags || [],
              }}
              initialContent={(selected as any).content}
              initialStatus={selected.status === "Active" ? "Active" : "Draft"}
              onBack={onClose}
              onSaveDraft={(newContent) => {
                onUpdateTemplate({
                  ...selected,
                  status: "Draft",
                  updated: "Just now",
                  content: newContent,
                } as any);
              }}
              onPublish={(newContent) => {
                onUpdateTemplate({
                  ...selected,
                  status: "Active",
                  updated: "Just now",
                  content: newContent,
                } as any);
                onClose();
              }}
            />
          </div>
        </div>
      )}

      {/* 3. Live Preview Modal */}
      {modal === "preview" && selected && (
        <TemplatePreviewModal
          isOpen={true}
          onClose={onClose}
          templateName={selected.name}
          category={selected.category}
          content={
            (selected as any).content ||
            `# ${selected.name.toUpperCase()}\n\nDear {{employee_name}},\n\nWe are pleased to offer you the position of **{{designation}}** in the **{{department}}** department at **{{organisation_name}}**.\n\n### Compensation\n- Annual Salary: {{total_salary}}\n- Joining Date: {{joining_date}}\n\n### Responsibilities\n{{AI_JOB_RESPONSIBILITIES}}\n\n---\n\n| Employer Signatory | Candidate Signatory |\n| :--- | :--- |\n| __________________ | __________________ |\n| Name: {{manager_name}} | Name: {{employee_name}} |`
          }
        />
      )}

      {/* 4. Use Template & Fill Document Modal */}
      {modal === "use" && selected && (
        <TemplateUseModal
          isOpen={true}
          onClose={onClose}
          template={selected}
          onSuccessGenerate={(updated) => {
            onUpdateTemplate(updated);
          }}
        />
      )}

      {/* 5. Share Template Modal */}
      {modal === "share" && selected && (
        <TemplateShareModal
          isOpen={true}
          onClose={onClose}
          template={selected}
          onUpdateShare={(updated) => {
            onUpdateTemplate(updated);
          }}
        />
      )}
    </>
  );
}
