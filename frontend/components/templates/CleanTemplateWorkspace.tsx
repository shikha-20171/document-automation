"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Layout,
  Plus,
  Search,
  Filter,
  Copy,
  Trash2,
  Edit,
  Eye,
  ArrowRight,
  Sparkles,
  Upload,
  Check,
  X,
  AlertCircle,
  MoreHorizontal,
  Layers,
  Calendar,
  FileText,
  RotateCcw,
} from "lucide-react";
import apiClient from "@/lib/axios";

export type RoleType = "ORGANISATION_ADMIN" | "DEPARTMENT_MANAGER" | "TEAM_LEADER" | "STAFF";

interface TemplateWorkspaceProps {
  role: RoleType;
  roleDisplayName?: string;
}

export default function CleanTemplateWorkspace({
  role,
}: TemplateWorkspaceProps) {
  const router = useRouter();

  // Role path prefix
  const roleSlug = useMemo(() => {
    switch (role) {
      case "ORGANISATION_ADMIN":
        return "org-admin";
      case "DEPARTMENT_MANAGER":
        return "department-manager";
      case "TEAM_LEADER":
        return "team-leader";
      default:
        return "employee";
    }
  }, [role]);

  // States
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [createdByFilter, setCreatedByFilter] = useState("ALL");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Modals
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);
  const [useTemplateDoc, setUseTemplateDoc] = useState<any | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editTemplateDoc, setEditTemplateDoc] = useState<any | null>(null);

  // Create/Edit form
  const [templateForm, setTemplateForm] = useState({
    name: "",
    documentType: "Quotation",
    category: "Sales",
    description: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ title: string; message?: string; type: "success" | "error" } | null>(null);

  const showToast = (title: string, message?: string, type: "success" | "error" = "success") => {
    setToast({ title, message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  // Fetch Templates
  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/unified-templates", {
        params: {
          documentType: typeFilter !== "ALL" ? typeFilter : undefined,
          search: searchTerm.trim() || undefined,
        },
      });

      if (res.data?.success) {
        setTemplates(res.data.data || []);
      }
    } catch (err: any) {
      console.error("Failed to load templates:", err);
      showToast("Error loading templates", err.response?.data?.message || err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [typeFilter, searchTerm]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Extract variables from template
  const getTemplateVariables = (t: any): string[] => {
    const varsSet = new Set<string>();
    
    // Check defaultVariables object
    if (t.defaultVariables && typeof t.defaultVariables === "object") {
      Object.keys(t.defaultVariables).forEach((key) => varsSet.add(key));
    }

    // Parse sections for {{...}} syntax
    if (Array.isArray(t.sections)) {
      const regex = /\{\{([a-zA-Z0-9_-]+)\}\}/g;
      t.sections.forEach((sec: any) => {
        const text = `${sec.title || ""} ${sec.body || ""} ${sec.content || ""}`;
        let match;
        while ((match = regex.exec(text)) !== null) {
          varsSet.add(match[1]);
        }
      });
    }

    // Default fallback variables if none detected
    if (varsSet.size === 0) {
      return ["client_name", "document_date", "amount"];
    }

    return Array.from(varsSet);
  };

  // Filter templates client side
  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      if (createdByFilter === "STANDARD" && !t.isStandard) return false;
      if (createdByFilter === "CUSTOM" && t.isStandard) return false;
      return true;
    });
  }, [templates, createdByFilter]);

  // Handle "Use Template" click
  const handleOpenUseTemplate = (t: any) => {
    const vars = getTemplateVariables(t);
    const initialValues: Record<string, string> = {};
    vars.forEach((v) => {
      if (v.toLowerCase().includes("date")) {
        initialValues[v] = new Date().toISOString().split("T")[0];
      } else if (v.toLowerCase().includes("client")) {
        initialValues[v] = "";
      } else if (v.toLowerCase().includes("amount")) {
        initialValues[v] = "";
      } else {
        initialValues[v] = "";
      }
    });
    setVariableValues(initialValues);
    setUseTemplateDoc(t);
  };

  // Proceed from Variable Modal into Document Builder
  const handleProceedToBuilder = () => {
    if (!useTemplateDoc) return;
    // Store selected template and filled variables in sessionStorage for Document Builder
    const payload = {
      templateId: useTemplateDoc.id,
      templateName: useTemplateDoc.name,
      documentType: useTemplateDoc.documentType,
      category: useTemplateDoc.category,
      sections: useTemplateDoc.sections || [],
      variables: variableValues,
    };
    try {
      sessionStorage.setItem("active_template_payload", JSON.stringify(payload));
    } catch {}

    setUseTemplateDoc(null);
    router.push(`/${roleSlug}/ai-builder?fromTemplate=${useTemplateDoc.id}`);
  };

  // Create new template
  const handleCreateTemplate = async () => {
    if (!templateForm.name.trim()) {
      showToast("Template Name Required", "Please enter a title for your template.", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const defaultSections = [
        {
          id: "sec_1",
          type: "header",
          title: "Introduction & Scope",
          body: "This document defines standard commercial terms for {{client_name}}.",
        },
        {
          id: "sec_2",
          type: "table",
          title: "Deliverables & Commercials",
          tableData: {
            headers: ["Item", "Description", "Qty", "Rate (INR)", "Total (INR)"],
            rows: [["Item 1", "Professional Service Delivery", "1", "{{amount}}", "{{amount}}"]],
          },
        },
      ];

      await apiClient.post("/api/unified-templates", {
        name: templateForm.name,
        documentType: templateForm.documentType,
        category: templateForm.category,
        description: templateForm.description,
        sections: defaultSections,
        defaultVariables: {
          client_name: "{{client_name}}",
          amount: "{{amount}}",
          valid_until: "30 Days",
        },
      });

      showToast("Template Created", `"${templateForm.name}" is now available to reuse.`);
      setCreateModalOpen(false);
      setTemplateForm({
        name: "",
        documentType: "Quotation",
        category: "Sales",
        description: "",
      });
      fetchTemplates();
    } catch (err: any) {
      showToast("Failed to Create Template", err.response?.data?.message || err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Duplicate template
  const handleDuplicate = async (t: any) => {
    try {
      await apiClient.post("/api/unified-templates", {
        name: `${t.name} (Copy)`,
        documentType: t.documentType,
        category: t.category,
        description: t.description,
        sections: t.sections || [],
        defaultVariables: t.defaultVariables || {},
      });
      showToast("Template Duplicated", `Created a copy of "${t.name}".`);
      fetchTemplates();
    } catch (err: any) {
      showToast("Failed to duplicate", err.message, "error");
    }
  };

  // Delete template
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      await apiClient.delete(`/api/unified-templates/${id}`);
      showToast("Deleted", "Template removed from library.");
      fetchTemplates();
    } catch (err: any) {
      showToast("Failed to delete", err.message, "error");
    }
  };

  // Toggle Active / Inactive
  const handleToggleStatus = async (t: any) => {
    try {
      const nextStatus = t.status === "INACTIVE" ? "ACTIVE" : "INACTIVE";
      await apiClient.put(`/api/unified-templates/${t.id}`, {
        status: nextStatus,
      });
      showToast("Status Updated", `Template is now ${nextStatus}.`);
      fetchTemplates();
    } catch (err: any) {
      showToast("Update Failed", err.message, "error");
    }
  };

  // Archive template
  const handleArchive = async (id: string) => {
    try {
      await apiClient.put(`/api/unified-templates/${id}`, {
        status: "ARCHIVED",
      });
      showToast("Archived", "Template moved to archive.");
      fetchTemplates();
    } catch (err: any) {
      showToast("Archive Failed", err.message, "error");
    }
  };

  const hasActiveFilters = searchTerm.trim() !== "" || typeFilter !== "ALL" || createdByFilter !== "ALL";

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-zinc-950 p-6 lg:p-10 font-sans text-slate-900 dark:text-slate-100">
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border text-sm transition-all duration-300 ${
            toast.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950 dark:border-rose-800 dark:text-rose-200"
              : "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200"
          }`}
        >
          {toast.type === "error" ? <AlertCircle className="w-5 h-5 text-rose-600" /> : <Check className="w-5 h-5 text-emerald-600" />}
          <div>
            <div className="font-semibold">{toast.title}</div>
            {toast.message && <div className="text-xs opacity-90">{toast.message}</div>}
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Templates
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Create and reuse standard document formats.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm transition-colors duration-150"
          >
            <Plus className="w-4 h-4" />
            <span>Create Template</span>
          </button>
        </div>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="max-w-7xl mx-auto mb-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search template name or document type..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Category / Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="ALL">All Categories</option>
            <option value="Quotation">Quotation</option>
            <option value="Proposal">Proposal</option>
            <option value="Invoice">Invoice</option>
            <option value="Contract">Contract</option>
            <option value="NDA">NDA</option>
            <option value="Purchase Order">Purchase Order</option>
            <option value="Letter">Letter</option>
            <option value="Report">Report</option>
            <option value="Custom">Custom</option>
          </select>

          {/* Created By Filter */}
          <select
            value={createdByFilter}
            onChange={(e) => setCreatedByFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="ALL">All Creators</option>
            <option value="STANDARD">Organisation Standard</option>
            <option value="CUSTOM">Custom Templates</option>
          </select>

          {/* Reset button */}
          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearchTerm("");
                setTypeFilter("ALL");
                setCreatedByFilter("ALL");
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-zinc-800 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* TEMPLATE LIST TABLE */}
      <div className="max-w-7xl mx-auto bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-zinc-800/50 border-b border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Template Name</th>
                <th className="px-6 py-3.5">Type</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Version</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Created By</th>
                <th className="px-6 py-3.5">Last Updated</th>
                <th className="px-6 py-3.5">Usage Count</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading templates...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredTemplates.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-14 text-center">
                    <div className="max-w-sm mx-auto flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 mb-3">
                        <Layout className="w-6 h-6" />
                      </div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">No templates found</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {hasActiveFilters
                          ? "Try changing your search query or filters."
                          : "Create standard templates to streamline document creation."}
                      </p>
                      {!hasActiveFilters && (
                        <button
                          onClick={() => setCreateModalOpen(true)}
                          className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Create First Template</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTemplates.map((t) => {
                  const isMenuOpen = openMenuId === t.id;
                  const isInactive = t.status === "INACTIVE";
                  const isArchived = t.status === "ARCHIVED";

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors duration-100 group"
                    >
                      {/* Template Name & Description */}
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                            <Layout className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 dark:text-white">
                              {t.name}
                            </div>
                            {t.description && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 max-w-md">
                                {t.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Type Column */}
                      <td className="px-6 py-4">
                        <span className="inline-block px-2.5 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300">
                          {t.documentType || "Document"}
                        </span>
                      </td>

                      {/* Category Column */}
                      <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400">
                        {t.category || "General"}
                      </td>

                      {/* Version */}
                      <td className="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                        v{t.version || 1}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isArchived
                              ? "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-slate-400"
                              : isInactive
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isArchived ? "bg-slate-400" : isInactive ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                          />
                          <span>{isArchived ? "Archived" : isInactive ? "Inactive" : "Active"}</span>
                        </span>
                      </td>

                      {/* Created By */}
                      <td className="px-6 py-4 text-xs">
                        {t.isStandard ? (
                          <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium">
                            <Sparkles className="w-3 h-3" />
                            <span>Organisation Standard</span>
                          </span>
                        ) : (
                          <span className="text-slate-600 dark:text-slate-400">
                            {t.createdByName || "User"}
                          </span>
                        )}
                      </td>

                      {/* Updated Column */}
                      <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(t.updatedAt || t.createdAt || Date.now()).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      {/* Usage Count */}
                      <td className="px-6 py-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                        {t.usageCount || t.metadata?.usageCount || 0}
                      </td>

                      {/* Actions Column */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2 relative">
                          <button
                            onClick={() => handleOpenUseTemplate(t)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 dark:text-indigo-300 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <span>Use Template</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(isMenuOpen ? null : t.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {/* Dropdown Menu */}
                          {isMenuOpen && (
                            <div
                              className="absolute right-0 top-10 z-40 w-44 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl py-1 text-xs text-left"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => {
                                  setPreviewTemplate(t);
                                  setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-zinc-800/80 text-slate-700 dark:text-slate-200"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-400" />
                                <span>Preview</span>
                              </button>

                              <button
                                onClick={() => {
                                  const payload = {
                                    templateId: t.id,
                                    templateName: t.name,
                                    documentType: t.documentType,
                                    category: t.category,
                                    sections: t.sections || [],
                                    isEditingTemplate: true,
                                  };
                                  try {
                                    sessionStorage.setItem("active_template_payload", JSON.stringify(payload));
                                  } catch {}
                                  setOpenMenuId(null);
                                  router.push(`/${roleSlug}/ai-builder?editTemplate=${t.id}`);
                                }}
                                className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-zinc-800/80 text-slate-700 dark:text-slate-200"
                              >
                                <Edit className="w-3.5 h-3.5 text-slate-400" />
                                <span>Edit Template</span>
                              </button>

                              <button
                                onClick={() => {
                                  handleDuplicate(t);
                                  setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-zinc-800/80 text-slate-700 dark:text-slate-200"
                              >
                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                                <span>Duplicate</span>
                              </button>

                              <button
                                onClick={() => {
                                  handleToggleStatus(t);
                                  setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-zinc-800/80 text-slate-700 dark:text-slate-200"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                                <span>{isInactive ? "Activate" : "Deactivate"}</span>
                              </button>

                              <button
                                onClick={() => {
                                  handleArchive(t.id);
                                  setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-zinc-800/80 text-slate-700 dark:text-slate-200"
                              >
                                <FileText className="w-3.5 h-3.5 text-slate-400" />
                                <span>Archive</span>
                              </button>

                              {!t.isStandard && (
                                <button
                                  onClick={() => {
                                    handleDelete(t.id);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-zinc-800/80 text-rose-600 dark:text-rose-400 border-t border-slate-100 dark:border-zinc-800"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                  <span>Delete</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: USE TEMPLATE & FILL VARIABLES */}
      {useTemplateDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-slate-200 dark:border-zinc-800 p-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Use Template: {useTemplateDoc.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Fill in variable values below to generate your initial document draft.
                </p>
              </div>
              <button
                onClick={() => setUseTemplateDoc(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 py-2 text-xs">
              {Object.keys(variableValues).length === 0 ? (
                <p className="text-slate-400 italic">No variables required for this template.</p>
              ) : (
                Object.keys(variableValues).map((key) => {
                  const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
                  return (
                    <div key={key}>
                      <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {label} <span className="text-slate-400 font-mono text-[10px]">({`{{${key}}}`})</span>
                      </label>
                      <input
                        type={key.toLowerCase().includes("date") ? "date" : "text"}
                        value={variableValues[key] || ""}
                        onChange={(e) =>
                          setVariableValues({ ...variableValues, [key]: e.target.value })
                        }
                        placeholder={`Enter ${label.toLowerCase()}...`}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800 mt-4">
              <button
                onClick={() => setUseTemplateDoc(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleProceedToBuilder}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                <span>Continue to Document Builder</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW TEMPLATE */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-slate-200 dark:border-zinc-800 p-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {previewTemplate.name}
                </h3>
                <span className="text-xs text-slate-500">
                  {previewTemplate.documentType} • {previewTemplate.category}
                </span>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
              {Array.isArray(previewTemplate.sections) && previewTemplate.sections.length > 0 ? (
                previewTemplate.sections.map((sec: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700"
                  >
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                      {sec.title}
                    </h4>
                    <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                      {sec.body || sec.content || "—"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 italic">No structured sections preview available.</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800 mt-4">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const t = previewTemplate;
                  setPreviewTemplate(null);
                  handleOpenUseTemplate(t);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
              >
                <span>Use this Template</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE TEMPLATE */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-slate-200 dark:border-zinc-800 p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Create Template
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Define a new reusable standard document format.
            </p>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="e.g. Master Service Agreement (MSA)"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Document Type
                  </label>
                  <select
                    value={templateForm.documentType}
                    onChange={(e) => setTemplateForm({ ...templateForm, documentType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="Quotation">Quotation</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Invoice">Invoice</option>
                    <option value="Contract">Contract</option>
                    <option value="NDA">NDA</option>
                    <option value="Purchase Order">Purchase Order</option>
                    <option value="Letter">Letter</option>
                    <option value="Report">Report</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={templateForm.category}
                    onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="Quotation">Quotation</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Invoice">Invoice</option>
                    <option value="Contract">Contract</option>
                    <option value="NDA">NDA</option>
                    <option value="Purchase Order">Purchase Order</option>
                    <option value="Letter">Letter</option>
                    <option value="Report">Report</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Dynamic Fields (Click to insert)
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 dark:bg-zinc-800/70 border border-slate-200 dark:border-zinc-700 rounded-lg mb-2">
                  {[
                    "{{client_name}}",
                    "{{company_name}}",
                    "{{quotation_number}}",
                    "{{date}}",
                    "{{items}}",
                    "{{subtotal}}",
                    "{{tax}}",
                    "{{total}}",
                  ].map((field) => (
                    <button
                      key={field}
                      type="button"
                      onClick={() =>
                        setTemplateForm({
                          ...templateForm,
                          description: templateForm.description ? `${templateForm.description} ${field}` : field,
                        })
                      }
                      className="px-2 py-1 bg-white dark:bg-zinc-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 text-[11px] font-mono rounded border border-slate-200 dark:border-zinc-600 transition-colors"
                    >
                      {field}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description / Prompt Structure
                </label>
                <textarea
                  rows={2}
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                  placeholder="Describe standard layout, placeholders, and structure..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-white resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setCreateModalOpen(false)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={isSubmitting || !templateForm.name}
                onClick={handleCreateTemplate}
                className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
              >
                {isSubmitting ? "Creating..." : "Create Template"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
