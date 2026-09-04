"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Copy,
  FilePlus2,
  MoreHorizontal,
  Plus,
  Search,
  Share2,
  Trash2,
  Sparkles,
  Eye,
  Edit3,
  CheckCircle2,
  Globe,
  Building2,
  Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export type TemplateStatus = "Active" | "Draft" | "Archived";
export type Visibility =
  | "Private"
  | "Department"
  | "Team"
  | "Organisation"
  | "Organisation Wide"
  | "Department Only"
  | "Team Only";

export type TemplateActivity = {
  time: string;
  event: string;
};

export type TemplateItem = {
  id: number;
  name: string;
  description: string;
  category: string;
  status: TemplateStatus;
  usage: number;
  createdBy: string;
  owner: string;
  updated: string;
  department: string;
  documentType: string;
  tags: string[];
  visibility: Visibility;
  isShared: boolean;
  content?: string;
  activities?: TemplateActivity[];
};

export type ModalKind =
  | "none"
  | "create"
  | "builder"
  | "preview"
  | "share"
  | "use";

interface TemplateTableProps {
  templates: TemplateItem[];
  categories: string[];
  onOpenModal: (kind: ModalKind, template?: TemplateItem) => void;
  onDuplicate: (template: TemplateItem) => void;
  onDelete: (id: number) => void;
}

const PAGE_SIZE = 6;
const sortValues = ["Newest", "Oldest", "Recently updated", "Most used", "A-Z", "Z-A"];

export default function TemplateTable({
  templates,
  categories,
  onOpenModal,
  onDuplicate,
  onDelete,
}: TemplateTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [createdByFilter, setCreatedByFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Recently updated");
  const [page, setPage] = useState(1);
  const [actionMenuId, setActionMenuId] = useState<number | null>(null);

  const departments = useMemo(
    () => Array.from(new Set(templates.map((t) => t.department))).sort((a, b) => a.localeCompare(b)),
    [templates]
  );

  const filtered = useMemo(() => {
    let list = [...templates];

    list = list.filter((t) => {
      const text = `${t.name} ${t.description} ${t.category} ${t.createdBy}`.toLowerCase();
      const q = search.toLowerCase();

      const searchOk = q.length === 0 || text.includes(q);
      const categoryOk = categoryFilter === "All" || t.category === categoryFilter;
      const departmentOk = departmentFilter === "All" || t.department === departmentFilter;
      const createdByOk = createdByFilter === "All" || t.createdBy === createdByFilter;

      return searchOk && categoryOk && departmentOk && createdByOk;
    });

    list.sort((a, b) => {
      if (sortBy === "A-Z") return a.name.localeCompare(b.name);
      if (sortBy === "Z-A") return b.name.localeCompare(a.name);
      if (sortBy === "Most used") return b.usage - a.usage;
      if (sortBy === "Oldest") return a.id - b.id;
      return b.id - a.id;
    });

    return list;
  }, [templates, search, categoryFilter, departmentFilter, createdByFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const paged = filtered.slice(start, start + PAGE_SIZE);

  const stats = [
    { label: "Total Templates", value: templates.length },
    { label: "Most Used Template", value: templates.slice().sort((a, b) => b.usage - a.usage)[0]?.name ?? "-" },
    {
      label: "Active Templates",
      value: templates.filter((t) => t.status === "Active").length,
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Header & Quick Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#274690] text-xs font-black mb-1">
            <FilePlus2 size={13} />
            <span>Document Blueprints & Reusable Formats</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Document Templates</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Create standard reusable document structures. Click <strong>"Use Template"</strong> on any card to fill variables and generate real documents.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => onOpenModal("create")}
            className="h-10 rounded-2xl bg-[#274690] px-4 text-xs font-bold text-white shadow-md transition hover:bg-[#1f3561] flex items-center gap-1.5"
          >
            <Plus size={15} /> Create Template
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s, idx) => (
          <Card key={idx} className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{s.label}</div>
            <div className="mt-1 text-xl font-black text-slate-900 truncate">{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <Card className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search template name, category, keyword..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-[#274690] focus:bg-white focus:outline-none transition"
            />
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold text-slate-700 focus:border-[#274690] focus:outline-none"
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold text-slate-700 focus:border-[#274690] focus:outline-none"
            >
              <option value="All">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-10 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold text-slate-700 focus:border-[#274690] focus:outline-none"
            >
              {sortValues.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Templates Table List */}
      <Card className="rounded-3xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-5 py-3.5">Template Name</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Visibility / Access</th>
                <th className="px-4 py-3.5">Usage</th>
                <th className="px-4 py-3.5">Updated</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400 font-semibold space-y-2">
                    <p>No templates found matching your filters.</p>
                    <Button
                      size="sm"
                      onClick={() => onOpenModal("create")}
                      className="rounded-xl bg-[#274690] text-white text-xs font-bold"
                    >
                      + Create First Template
                    </Button>
                  </td>
                </tr>
              ) : (
                paged.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition group">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 text-sm group-hover:text-[#274690] transition-colors">
                        {t.name}
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 max-w-xs">{t.description}</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {t.tags?.map((tag) => (
                          <span key={tag} className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-semibold">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <Badge variant="outline" className="text-[10px] font-bold text-[#274690] border-[#274690]/30 bg-[#274690]/5">
                        {t.category}
                      </Badge>
                    </td>

                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        t.status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                        t.status === "Draft" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                        "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}>
                        {t.status}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
                        {t.visibility === "Department Only" || t.visibility === "Department" ? (
                          <>
                            <Building2 size={11} className="text-[#274690]" />
                            <span>Dept: {t.department}</span>
                          </>
                        ) : t.visibility === "Private" ? (
                          <>
                            <Lock size={11} className="text-slate-500" />
                            <span>Private</span>
                          </>
                        ) : (
                          <>
                            <Globe size={11} className="text-emerald-600" />
                            <span>Organisation</span>
                          </>
                        )}
                      </span>
                    </td>

                    <td className="px-4 py-4 font-bold text-slate-900">
                      <span className="bg-blue-50/70 text-[#274690] px-2 py-0.5 rounded-md text-[11px]">
                        {t.usage || 0} runs
                      </span>
                    </td>

                    <td className="px-4 py-4 text-[11px] text-slate-400">{t.updated}</td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 relative">
                        {/* PRIMARY ACTION: USE TEMPLATE */}
                        <Button
                          size="sm"
                          onClick={() => onOpenModal("use", t)}
                          className="h-8 px-3 text-xs font-bold bg-[#274690] hover:bg-[#1f3561] text-white rounded-xl shadow-xs flex items-center gap-1"
                        >
                          <FilePlus2 size={13} /> Use Template
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onOpenModal("builder", t)}
                          className="h-8 px-2.5 text-xs font-bold text-slate-700 hover:text-[#274690] hover:bg-slate-100 rounded-xl"
                        >
                          <Edit3 size={13} className="mr-1" /> Edit
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onOpenModal("share", t)}
                          className="h-8 px-2.5 text-xs font-bold text-slate-600 hover:text-[#274690] hover:bg-blue-50 rounded-xl"
                        >
                          <Share2 size={13} className="mr-1" /> Share
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setActionMenuId(actionMenuId === t.id ? null : t.id)}
                          className="h-8 w-8 text-slate-500 hover:text-slate-900 rounded-xl"
                        >
                          <MoreHorizontal size={15} />
                        </Button>

                        {/* Dropdown Menu */}
                        {actionMenuId === t.id && (
                          <div className="absolute right-0 top-9 z-30 w-52 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl text-left animate-in fade-in">
                            <button
                              onClick={() => {
                                onOpenModal("preview", t);
                                setActionMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl"
                            >
                              <Eye size={13} className="text-slate-500" /> Preview Format
                            </button>

                            <button
                              onClick={() => {
                                if (typeof window !== "undefined") {
                                  sessionStorage.setItem("aiBuilderTemplate", t.name);
                                  sessionStorage.setItem("aiBuilderPrompt", `Generate a complete ${t.name} adhering to standard clauses.`);
                                  router.push("/org-admin/ai-builder");
                                }
                                setActionMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-bold text-[#274690] bg-blue-50/50 hover:bg-blue-50 rounded-xl my-0.5"
                            >
                              <Sparkles size={13} className="text-[#274690]" /> Open in AI Builder
                            </button>

                            <button
                              onClick={() => {
                                onDuplicate(t);
                                setActionMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl"
                            >
                              <Copy size={13} className="text-slate-500" /> Duplicate Template
                            </button>

                            <div className="my-1 border-t border-slate-100" />

                            <button
                              onClick={() => {
                                onDelete(t.id);
                                setActionMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl"
                            >
                              <Trash2 size={13} /> Delete Template
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50 text-xs">
            <span className="text-slate-500">
              Showing {start + 1} to {Math.min(start + PAGE_SIZE, filtered.length)} of {filtered.length} templates
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="h-7 px-2 text-xs font-bold rounded-lg border-slate-200"
              >
                Previous
              </Button>
              <span className="px-2 font-bold text-slate-800">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="h-7 px-2 text-xs font-bold rounded-lg border-slate-200"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
