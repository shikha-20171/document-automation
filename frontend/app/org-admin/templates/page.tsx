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

export default function OrgAdminTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [modal, setModal] = useState<ModalKind>("none");
  const [selected, setSelected] = useState<TemplateItem | null>(null);

  const loadTemplates = async () => {
    let customTemplates: TemplateItem[] = [];

    // 1. Fetch real custom unified templates from PostgreSQL database
    try {
      const res = await apiClient.get("/api/unified-templates").catch(() => null);
      if (res?.data?.data && Array.isArray(res.data.data)) {
        // ONLY show custom templates created by user or saved from AI builder (exclude pre-seeded standard templates)
        const customOnly = res.data.data.filter((t: any) => !t.isStandard);
        customTemplates = customOnly.map((t: any, idx: number) => {
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
            description: t.description || `Reusable custom ${t.documentType || "document"} blueprint.`,
            category: t.category || "General",
            status: "Active" as TemplateStatus,
            usage: t._count?.documents || t.usage || 0,
            createdBy: "AI Document Builder",
            owner: "Organisation",
            updated: t.updatedAt ? new Date(t.updatedAt).toLocaleDateString("en-GB") : "Recently",
            department: "All",
            documentType: t.documentType || "Document",
            tags: [t.category || "General", "AI Template"],
            visibility: "Organisation Wide" as Visibility,
            isShared: true,
            content: content || `# ${t.name}\n\nCustom template clauses.`,
            activities: [{ time: "Active", event: "Saved from AI Builder" }],
          };
        });
      }
    } catch (err) {
      console.warn("Unified templates database fetch warning:", err);
    }

    // 2. Read any local custom templates saved by user in AI Builder
    let localItems: TemplateItem[] = [];
    if (typeof window !== "undefined") {
      try {
        const rawLocal = localStorage.getItem("docucore_custom_templates");
        if (rawLocal) {
          localItems = JSON.parse(rawLocal);
        }
      } catch {}
    }

    // 3. Merge custom templates (DB custom + AI Builder local saves)
    const mergedMap = new Map<string, TemplateItem>();
    customTemplates.forEach((t) => mergedMap.set(String(t.name.toLowerCase().trim()), t));
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
