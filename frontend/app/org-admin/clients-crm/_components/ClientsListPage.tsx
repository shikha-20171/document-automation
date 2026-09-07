"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Search, Filter, MoreHorizontal, Eye, Edit2, FileText, MessageSquare,
  StickyNote, UserCheck, Archive, Trash2, Upload, Download, Users,
  CheckSquare, Tag, ChevronDown, X, CheckCircle2, Building2, User,
  ArrowUpDown, RefreshCw, RotateCcw,
} from "lucide-react";
import { clientStore, type Client, formatDate, timeAgo, ALL_TAGS, INDUSTRIES, DEPARTMENTS, TEAM_MEMBERS } from "./clientStore";
import AddClientModal from "./AddClientModal";
import ImportClientsModal from "./ImportClientsModal";

const STATUS_STYLES: Record<string, string> = {
  Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Inactive: "bg-slate-100 text-slate-600 border-slate-300",
  Prospect: "bg-blue-50 text-blue-700 border-blue-200",
  Archived: "bg-amber-50 text-amber-700 border-amber-200",
};

const STATUS_DOT: Record<string, string> = {
  Active: "bg-emerald-500",
  Inactive: "bg-slate-400",
  Prospect: "bg-blue-500",
  Archived: "bg-amber-500",
};

export default function ClientsListPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [industryFilter, setIndustryFilter] = useState("All");
  const [assignedFilter, setAssignedFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [tagFilter, setTagFilter] = useState("All");
  const [sortAsc, setSortAsc] = useState(false);

  // Bulk
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setClients(clientStore.getClients());
    const remote = await clientStore.fetchClients();
    if (remote && Array.isArray(remote)) {
      setClients(remote);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = useMemo(() => {
    let list = clients.filter(c => {
      const q = search.toLowerCase();
      const matchSearch = !q || c.name.toLowerCase().includes(q) || c.contactPerson.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) || c.phone.includes(q) || c.id.toLowerCase().includes(q);
      const matchStatus = statusFilter === "All" || c.status === statusFilter;
      const matchInd = industryFilter === "All" || c.industry === industryFilter;
      const matchAssigned = assignedFilter === "All" || c.assignedTo === assignedFilter;
      const matchDept = deptFilter === "All" || c.department === deptFilter;
      const matchTag = tagFilter === "All" || c.tags.includes(tagFilter);
      return matchSearch && matchStatus && matchInd && matchAssigned && matchDept && matchTag;
    });
    list = list.sort((a, b) => sortAsc
      ? a.name.localeCompare(b.name)
      : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return list;
  }, [clients, search, statusFilter, industryFilter, assignedFilter, deptFilter, tagFilter, sortAsc]);

  const stats = useMemo(() => ({
    total: clients.length,
    active: clients.filter(c => c.status === "Active").length,
    inactive: clients.filter(c => c.status === "Inactive").length,
    prospect: clients.filter(c => c.status === "Prospect").length,
    archived: clients.filter(c => c.status === "Archived").length,
  }), [clients]);

  const toggleSelect = (id: string) => {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const selectAll = () => setSelected(filtered.length === selected.size ? new Set() : new Set(filtered.map(c => c.id)));

  const bulkArchive = async () => {
    const ids = Array.from(selected);
    for (const id of ids) {
      await clientStore.archiveClient(id);
    }
    await load();
    setSelected(new Set());
    showToast(`${ids.length} clients archived`);
  };

  const bulkDelete = async () => {
    const ids = Array.from(selected);
    for (const id of ids) {
      await clientStore.deleteClient(id);
    }
    await load();
    setSelected(new Set());
    showToast(`${ids.length} clients removed`);
  };

  const handleDelete = async (c: Client) => {
    await clientStore.deleteClient(c.id);
    await load();
    showToast(`${c.name} removed safely`);
    setOpenMenu(null);
  };

  const handleArchive = async (c: Client) => {
    await clientStore.archiveClient(c.id);
    await load();
    showToast(`${c.name} archived`);
    setOpenMenu(null);
  };

  const handleRestore = async (c: Client) => {
    await clientStore.restoreClient(c.id);
    await load();
    showToast(`${c.name} restored to Active`);
    setOpenMenu(null);
  };

  const exportCsv = () => {
    if (clients.length === 0) {
      showToast("No clients to export.");
      return;
    }
    const headers = ["ID", "Name", "Type", "Status", "Contact Person", "Email", "Phone", "Industry", "Department", "Assigned To", "City", "Country", "Created At"];
    const rows = filtered.map(c => [
      c.id,
      `"${c.name.replace(/"/g, '""')}"`,
      c.type,
      c.status,
      `"${(c.contactPerson || "").replace(/"/g, '""')}"`,
      c.email || "",
      c.phone || "",
      c.industry || "",
      c.department || "",
      c.assignedTo || "",
      c.city || "",
      c.country || "",
      c.createdAt || "",
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `crm_clients_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Clients CSV exported successfully");
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-[#1f3561] px-5 py-3 text-xs font-bold text-white shadow-2xl animate-in slide-in-from-bottom-4">
          <CheckCircle2 size={15} className="text-[#ffd9a0]" /> {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-lg bg-[#274690] px-2.5 py-0.5 text-[10px] font-black text-white tracking-wide">Enterprise CRM</span>
            <span className="rounded-lg bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">PostgreSQL Connected</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Clients & CRM</h1>
          <p className="text-xs text-slate-500 mt-1">Manage external clients, linked contacts, documents, and business workflows</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 rounded-xl bg-[#274690] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#1f3561] transition shadow-md"
          >
            <Plus size={15} /> Add Client
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            <Upload size={14} /> Import
          </button>
          <button
            onClick={exportCsv}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            onClick={() => router.push("/org-admin/clients-crm/requests")}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            <FileText size={14} /> All Requests
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        {[
          { label: "Total Clients", value: stats.total, sub: "All records", color: "text-[#274690]", bg: "bg-[#274690]/8" },
          { label: "Active Clients", value: stats.active, sub: `${stats.total ? Math.round((stats.active / stats.total) * 100) : 0}% active`, color: "text-emerald-700", bg: "bg-emerald-50" },
          { label: "Prospects", value: stats.prospect, sub: "In pipeline", color: "text-blue-700", bg: "bg-blue-50" },
          { label: "Inactive", value: stats.inactive, sub: "Needs follow-up", color: "text-slate-600", bg: "bg-slate-100" },
          { label: "Archived", value: stats.archived, sub: "Historical records", color: "text-amber-700", bg: "bg-amber-50" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-semibold text-slate-500">{s.label}</p>
            <div className="mt-1 flex items-end justify-between">
              <strong className={`text-2xl font-black ${s.color}`}>{s.value}</strong>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${s.bg} ${s.color}`}>{s.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-0 lg:max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, phone, Client ID..."
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none focus:border-[#274690] focus:bg-white"
            />
            {search && <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={13} /></button>}
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={["All", "Active", "Inactive", "Prospect", "Archived"]} />
            <FilterSelect label="Industry" value={industryFilter} onChange={setIndustryFilter} options={["All", ...INDUSTRIES]} />
            <FilterSelect label="Assigned To" value={assignedFilter} onChange={setAssignedFilter} options={["All", ...TEAM_MEMBERS]} />
            <FilterSelect label="Department" value={deptFilter} onChange={setDeptFilter} options={["All", ...DEPARTMENTS]} />
            <FilterSelect label="Tags" value={tagFilter} onChange={setTagFilter} options={["All", ...ALL_TAGS]} />
            <button
              onClick={() => setSortAsc(s => !s)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 h-9 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <ArrowUpDown size={13} /> {sortAsc ? "A→Z" : "Newest"}
            </button>
            <button
              onClick={load}
              title="Refresh CRM Data"
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 h-9 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw size={13} className={loading ? "animate-spin text-[#274690]" : ""} /> Refresh
            </button>
            {(search || statusFilter !== "All" || industryFilter !== "All" || assignedFilter !== "All" || deptFilter !== "All" || tagFilter !== "All") && (
              <button onClick={() => { setSearch(""); setStatusFilter("All"); setIndustryFilter("All"); setAssignedFilter("All"); setDeptFilter("All"); setTagFilter("All"); }}
                className="flex items-center gap-1 text-xs font-bold text-[#274690] hover:underline">
                <RefreshCw size={11} /> Reset
              </button>
            )}
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-[#274690]/5 border-t border-[#274690]/10">
            <span className="text-xs font-bold text-[#274690]">{selected.size} selected</span>
            <div className="flex gap-2 ml-2">
              <BulkBtn icon={Archive} label="Archive" onClick={bulkArchive} />
              <BulkBtn icon={Trash2} label="Delete" onClick={bulkDelete} danger />
              <button onClick={() => setSelected(new Set())} className="text-xs text-slate-500 hover:text-slate-700 font-medium ml-2">Clear</button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500 border-y border-slate-100">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={selectAll} className="rounded" />
                </th>
                {["Client", "Contact", "Email", "Phone", "Status", "Assigned To", "Docs", "Last Activity", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 font-bold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className={`border-t border-slate-100 hover:bg-slate-50/60 transition ${selected.has(c.id) ? "bg-[#274690]/3" : ""}`}>
                  <td className="px-4 py-3.5">
                    <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} className="rounded" />
                  </td>
                  <td className="px-4 py-3.5">
                    <button onClick={() => router.push(`/org-admin/clients-crm/${c.id}`)} className="text-left group">
                      <div className="flex items-center gap-2.5">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white ${c.type === "Company" ? "bg-[#274690]" : "bg-violet-600"}`}>
                          {c.type === "Company" ? <Building2 size={13} /> : <User size={13} />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-[#274690] transition truncate max-w-[180px]">{c.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{c.id.slice(0, 8)}... · {c.industry || "—"}</p>
                        </div>
                      </div>
                    </button>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 font-medium">{c.contactPerson || "—"}</td>
                  <td className="px-4 py-3.5 text-slate-500">{c.email || "—"}</td>
                  <td className="px-4 py-3.5 text-slate-500">{c.phone || "—"}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${STATUS_STYLES[c.status] || "bg-slate-100 text-slate-700"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[c.status] || "bg-slate-400"}`} />
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-slate-600">{c.assignedTo || "—"}</td>
                  <td className="px-4 py-3.5">
                    <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">{c.documents}</span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">{timeAgo(c.lastActivity)}</td>
                  <td className="px-4 py-3.5">
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === c.id ? null : c.id)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition"
                      >
                        <MoreHorizontal size={15} />
                      </button>
                      {openMenu === c.id && (
                        <RowMenu
                          client={c}
                          onView={() => { router.push(`/org-admin/clients-crm/${c.id}`); setOpenMenu(null); }}
                          onEdit={() => { router.push(`/org-admin/clients-crm/${c.id}/overview`); setOpenMenu(null); }}
                          onAddDoc={() => { router.push(`/org-admin/clients-crm/${c.id}/documents`); setOpenMenu(null); }}
                          onCreateRequest={() => { router.push(`/org-admin/clients-crm/${c.id}/requests`); setOpenMenu(null); }}
                          onAddNote={() => { router.push(`/org-admin/clients-crm/${c.id}/notes`); setOpenMenu(null); }}
                          onArchive={() => handleArchive(c)}
                          onRestore={() => handleRestore(c)}
                          onDelete={() => handleDelete(c)}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && !loading && (
            <div className="py-16 text-center">
              <Users size={32} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-500">No clients found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or click &ldquo;Add Client&rdquo; to create your first record</p>
            </div>
          )}
        </div>

        {/* Table Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/40">
          <p className="text-xs text-slate-500">Showing <strong>{filtered.length}</strong> of <strong>{clients.length}</strong> clients</p>
        </div>
      </div>

      {/* Add Client Modal */}
      {showAdd && (
        <AddClientModal
          onClose={() => setShowAdd(false)}
          onSaved={client => {
            setShowAdd(false);
            load();
            showToast(`✓ ${client.name} added successfully`);
          }}
        />
      )}

      {/* Import Clients Modal */}
      {showImport && (
        <ImportClientsModal
          isOpen={showImport}
          onClose={() => setShowImport(false)}
          onSuccess={count => {
            setShowImport(false);
            load();
            showToast(`✓ ${count} clients imported successfully`);
          }}
        />
      )}
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="relative">
      <Filter size={12} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
      <select value={value} onChange={e => onChange(e.target.value)} className="h-9 appearance-none rounded-xl border border-slate-200 bg-white pl-7 pr-6 text-xs font-semibold text-slate-700 outline-none focus:border-[#274690] cursor-pointer">
        {options.map(o => <option key={o}>{o === "All" ? `All ${label}` : o}</option>)}
      </select>
      <ChevronDown size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

function BulkBtn({ icon: Icon, label, onClick, danger }: { icon: React.ElementType; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${danger ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-[#274690]/10 text-[#274690] hover:bg-[#274690]/20"}`}>
      <Icon size={12} /> {label}
    </button>
  );
}

function RowMenu({ client, onView, onEdit, onAddDoc, onCreateRequest, onAddNote, onArchive, onRestore, onDelete }: {
  client: Client; onView: () => void; onEdit: () => void; onAddDoc: () => void; onCreateRequest: () => void;
  onAddNote: () => void; onArchive: () => void; onRestore: () => void; onDelete: () => void;
}) {
  const items = [
    { icon: Eye, label: "View Workspace", onClick: onView },
    { icon: Edit2, label: "Overview & Info", onClick: onEdit },
    { icon: FileText, label: "Documents", onClick: onAddDoc },
    { icon: MessageSquare, label: "Requests & Tasks", onClick: onCreateRequest },
    { icon: StickyNote, label: "Notes", onClick: onAddNote },
  ];
  return (
    <div className="absolute right-0 top-full z-30 mt-1 w-48 rounded-xl border border-slate-200 bg-white shadow-xl py-1">
      {items.map(({ icon: Icon, label, onClick }) => (
        <button key={label} onClick={onClick} className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
          <Icon size={13} className="text-slate-400" /> {label}
        </button>
      ))}
      <div className="border-t border-slate-100 mt-1 pt-1">
        {client.status !== "Archived" ? (
          <button onClick={onArchive} className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50">
            <Archive size={13} /> Archive Client
          </button>
        ) : (
          <button onClick={onRestore} className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">
            <RotateCcw size={13} /> Restore Client
          </button>
        )}
        <button onClick={onDelete} className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">
          <Trash2 size={13} /> Delete Client
        </button>
      </div>
    </div>
  );
}
