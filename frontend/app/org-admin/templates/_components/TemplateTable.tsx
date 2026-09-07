"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FilePlus2,
  Plus,
  Search,
  Share2,
  Trash2,
  Copy,
  Eye,
  Edit3,
  Download,
  Sparkles,
  LayoutGrid,
  List,
  Layers,
  CheckCircle2,
  Send,
  Printer,
  FileText,
  Clock,
  Building2,
  Globe,
  MoreVertical,
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
  id: number | string;
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
  | "quickCreate"
  | "builder"
  | "preview"
  | "share"
  | "use"
  | "edit";

interface TemplateTableProps {
  templates: TemplateItem[];
  categories: string[];
  onOpenModal: (kind: ModalKind, template?: TemplateItem) => void;
  onDuplicate: (template: TemplateItem) => void;
  onDelete: (id: number | string) => void;
}

const PAGE_SIZE = 9;

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
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [sortBy, setSortBy] = useState("Most used");
  const [page, setPage] = useState(1);
  const [activeMenuId, setActiveMenuId] = useState<string | number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Instant PDF Download / Print
  const handleDirectDownloadPDF = (t: TemplateItem) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast("Pop-up blocked. Please allow popups to download PDF.");
      return;
    }
    const raw = t.content || `# ${t.name}\n\nStandard Template Content.`;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${t.name}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; max-width: 800px; margin: 0 auto; }
            h1 { font-size: 20px; color: #0f172a; border-bottom: 2px solid #274690; padding-bottom: 8px; }
            pre { font-family: inherit; white-space: pre-wrap; word-break: break-word; font-size: 13px; }
            @media print { body { padding: 0; } @page { margin: 1.5cm; } }
          </style>
        </head>
        <body>
          <pre>${raw}</pre>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
    showToast(`Print / PDF preview opened for "${t.name}"!`);
  };

  // Filter and sort templates
  const filtered = useMemo(() => {
    let list = [...templates];

    list = list.filter((t) => {
      const text = `${t.name} ${t.description} ${t.category} ${t.createdBy}`.toLowerCase();
      const q = search.toLowerCase();

      const searchOk = q.length === 0 || text.includes(q);
      const categoryOk = categoryFilter === "All" || t.category.toLowerCase() === categoryFilter.toLowerCase();

      return searchOk && categoryOk;
    });

    list.sort((a, b) => {
      if (sortBy === "A-Z") return a.name.localeCompare(b.name);
      if (sortBy === "Z-A") return b.name.localeCompare(a.name);
      if (sortBy === "Most used") return (b.usage || 0) - (a.usage || 0);
      if (sortBy === "Oldest") return String(a.id).localeCompare(String(b.id));
      return String(b.id).localeCompare(String(a.id));
    });

    return list;
  }, [templates, search, categoryFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const paged = filtered.slice(start, start + PAGE_SIZE);

  const totalRuns = useMemo(
    () => templates.reduce((acc, curr) => acc + (curr.usage || 0), 0),
    [templates]
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-60 rounded-2xl bg-[#274690] text-white px-5 py-3 text-xs font-bold shadow-2xl flex items-center gap-2 border border-white/20">
          <CheckCircle2 size={16} className="text-[#ffd9a0]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#274690] text-xs font-black mb-1 border border-blue-100">
            <FilePlus2 size={13} />
            <span>Document Blueprints & Reusable Master Formats</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Document Templates</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5 max-w-2xl">
            Reusable master documents. Use any template multiple times for different clients (Quotation, Invoice, Offer Letter), preview full content, edit text, or send directly to anyone.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => router.push("/org-admin/ai-builder")}
            className="h-10 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 text-xs font-bold text-white shadow-md hover:from-indigo-700 hover:to-violet-700 flex items-center gap-1.5"
          >
            <Sparkles size={15} /> AI Document Studio
          </Button>

          <Button
            onClick={() => onOpenModal("quickCreate")}
            className="h-10 rounded-2xl bg-[#274690] px-4 text-xs font-bold text-white shadow-md transition hover:bg-[#1f3561] flex items-center gap-1.5"
          >
            <Plus size={15} /> Create Template
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push("/org-admin/templates/create")}
            className="h-10 rounded-2xl border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
          >
            <Sparkles size={14} className="text-[#274690]" /> AI Designer
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Master Templates</div>
            <div className="mt-1 text-2xl font-black text-slate-900">{templates.length}</div>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-blue-50 text-[#274690] flex items-center justify-center font-bold">
            <FileText size={20} />
          </div>
        </Card>

        <Card className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Documents Generated / Reused</div>
            <div className="mt-1 text-2xl font-black text-emerald-600">{totalRuns} instances</div>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={20} />
          </div>
        </Card>

        <Card className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Blueprints</div>
            <div className="mt-1 text-2xl font-black text-slate-900">
              {templates.filter((t) => t.status === "Active").length}
            </div>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-blue-50 text-[#274690] flex items-center justify-center font-bold">
            <Layers size={20} />
          </div>
        </Card>
      </div>

      {/* Filter & Control Bar */}
      <Card className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search template name, category, client keywords..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-[#274690] focus:bg-white focus:outline-none transition"
            />
          </div>

          {/* Right Controls: Sort + View Mode Switcher */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-10 rounded-2xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold text-slate-700 focus:border-[#274690] focus:outline-none"
            >
              <option value="Most used">Sort: Most Used</option>
              <option value="Recently updated">Sort: Recently Updated</option>
              <option value="A-Z">Sort: A-Z</option>
              <option value="Z-A">Sort: Z-A</option>
            </select>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-xl transition ${
                  viewMode === "grid"
                    ? "bg-white text-[#274690] shadow-xs font-bold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
                title="Cards View"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-xl transition ${
                  viewMode === "table"
                    ? "bg-white text-[#274690] shadow-xs font-bold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
                title="Table View"
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5">
          {["All", "Sales", "Finance", "HR", "Legal", "Procurement", "Operations"].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setCategoryFilter(cat);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                categoryFilter === cat
                  ? "bg-[#274690] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
              }`}
            >
              {cat === "All"
                ? "All Blueprints"
                : cat === "Sales"
                ? "Sales & Quotations"
                : cat === "Finance"
                ? "Finance & Invoices"
                : cat === "HR"
                ? "HR & Employment"
                : cat === "Legal"
                ? "Legal & Agreements"
                : cat}
            </button>
          ))}
        </div>
      </Card>

      {/* Main Content Area: Cards View or Table View */}
      {paged.length === 0 ? (
        <Card className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center shadow-xs">
          <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <FileText size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-900">No document templates found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or create a new template blueprint to get started.
          </p>
          <Button
            onClick={() => onOpenModal("quickCreate")}
            className="mt-4 rounded-xl bg-[#274690] text-white text-xs font-bold h-9 px-4"
          >
            + Create First Template
          </Button>
        </Card>
      ) : viewMode === "grid" ? (
        /* CARDS GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paged.map((t) => (
            <Card
              key={t.id}
              className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                {/* Top row: Category badge + Usage + Status */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className="text-[10px] font-bold text-[#274690] border-[#274690]/30 bg-[#274690]/5 px-2 py-0.5"
                    >
                      {t.category}
                    </Badge>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {t.usage || 0} runs
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      t.status === "Active"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {t.status}
                  </span>
                </div>

                {/* Template Title & Description */}
                <div>
                  <h3 className="font-black text-slate-900 text-sm group-hover:text-[#274690] transition-colors line-clamp-1">
                    {t.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 min-h-[32px]">
                    {t.description || "Reusable blueprint for creating customized documents with dynamic client fields."}
                  </p>
                </div>

                {/* Content Preview Snippet Box */}
                <div
                  onClick={() => onOpenModal("preview", t)}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] font-mono text-slate-600 line-clamp-3 leading-relaxed cursor-pointer hover:bg-blue-50/40 transition select-none"
                  title="Click to view full template clauses"
                >
                  {t.content
                    ? t.content.slice(0, 160) + "..."
                    : `# ${t.name}\n\nStandard reusable clauses.`}
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="pt-4 mt-3 border-t border-slate-100 space-y-2">
                {/* PRIMARY ACTION: USE TEMPLATE (REPEATED REUSE) */}
                <Button
                  onClick={() => onOpenModal("use", t)}
                  className="w-full h-9 rounded-xl bg-[#274690] hover:bg-[#1f3561] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5"
                >
                  <FilePlus2 size={14} />
                  <span>Use Template (Generate)</span>
                </Button>

                {/* SECONDARY ROW: View, Edit, Send, Download, More */}
                <div className="flex items-center justify-between gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenModal("preview", t)}
                    className="flex-1 h-8 rounded-xl border-slate-200 text-slate-700 text-[11px] font-bold hover:bg-slate-50 flex items-center justify-center gap-1"
                  >
                    <Eye size={12} /> View
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenModal("edit", t)}
                    className="flex-1 h-8 rounded-xl border-slate-200 text-slate-700 text-[11px] font-bold hover:bg-slate-50 flex items-center justify-center gap-1"
                  >
                    <Edit3 size={12} /> Edit
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenModal("share", t)}
                    className="flex-1 h-8 rounded-xl border-slate-200 text-[#274690] text-[11px] font-bold hover:bg-blue-50 flex items-center justify-center gap-1"
                  >
                    <Send size={12} /> Send
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDirectDownloadPDF(t)}
                    className="h-8 w-8 rounded-xl text-slate-500 hover:text-slate-900"
                    title="Download / Print PDF"
                  >
                    <Download size={14} />
                  </Button>

                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setActiveMenuId(activeMenuId === t.id ? null : t.id)}
                      className="h-8 w-8 rounded-xl text-slate-500 hover:text-slate-900"
                    >
                      <MoreVertical size={14} />
                    </Button>

                    {/* Context Dropdown */}
                    {activeMenuId === t.id && (
                      <div className="absolute right-0 bottom-9 z-30 w-44 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl text-left animate-in fade-in">
                        <button
                          onClick={() => {
                            onDuplicate(t);
                            setActiveMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl"
                        >
                          <Copy size={13} className="text-slate-500" /> Duplicate
                        </button>
                        <button
                          onClick={() => {
                            onOpenModal("builder", t);
                            setActiveMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-[#274690] hover:bg-blue-50 rounded-xl"
                        >
                          <Sparkles size={13} /> Full Designer
                        </button>
                        <div className="my-1 border-t border-slate-100" />
                        <button
                          onClick={() => {
                            onDelete(t.id);
                            setActiveMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* TABLE LIST VIEW */
        <Card className="rounded-3xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-5 py-3.5">Template Blueprint</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Usage</th>
                  <th className="px-4 py-3.5">Last Updated</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paged.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition group">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 text-sm group-hover:text-[#274690] transition-colors">
                        {t.name}
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 max-w-sm">
                        {t.description || "Reusable template blueprint"}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-bold text-[#274690] border-[#274690]/30 bg-[#274690]/5"
                      >
                        {t.category}
                      </Badge>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          t.status === "Active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>

                    <td className="px-4 py-4 font-bold text-slate-900">
                      <span className="bg-blue-50/70 text-[#274690] px-2.5 py-1 rounded-lg text-[11px]">
                        {t.usage || 0} runs
                      </span>
                    </td>

                    <td className="px-4 py-4 text-[11px] text-slate-400">{t.updated}</td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          onClick={() => onOpenModal("use", t)}
                          className="h-8 px-3 text-xs font-bold bg-[#274690] hover:bg-[#1f3561] text-white rounded-xl shadow-xs flex items-center gap-1"
                        >
                          <FilePlus2 size={13} /> Use
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onOpenModal("preview", t)}
                          className="h-8 px-2.5 text-xs font-bold text-slate-700 hover:text-[#274690] rounded-xl"
                        >
                          <Eye size={13} className="mr-1" /> View
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onOpenModal("edit", t)}
                          className="h-8 px-2.5 text-xs font-bold text-slate-700 hover:text-[#274690] rounded-xl"
                        >
                          <Edit3 size={13} className="mr-1" /> Edit
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onOpenModal("share", t)}
                          className="h-8 px-2.5 text-xs font-bold text-[#274690] rounded-xl"
                        >
                          <Send size={13} className="mr-1" /> Send
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDirectDownloadPDF(t)}
                          className="h-8 w-8 text-slate-500 rounded-xl"
                        >
                          <Download size={14} />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(t.id)}
                          className="h-8 w-8 text-rose-500 hover:text-rose-700 rounded-xl"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border border-slate-200/80 rounded-2xl bg-white text-xs">
          <span className="text-slate-500">
            Showing {start + 1} to {Math.min(start + PAGE_SIZE, filtered.length)} of {filtered.length} templates
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="h-8 px-3 text-xs font-bold rounded-xl border-slate-200"
            >
              Previous
            </Button>
            <span className="px-3 font-bold text-slate-800">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="h-8 px-3 text-xs font-bold rounded-xl border-slate-200"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
