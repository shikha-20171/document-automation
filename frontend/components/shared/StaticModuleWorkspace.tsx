"use client";

import { useMemo, useState } from "react";
import { ArrowDownUp, CheckCircle2, Download, Eye, Filter, MoreHorizontal, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export type WorkspaceRow = {
  id: number;
  title: string;
  subtitle: string;
  category: string;
  owner: string;
  date: string;
  status: string;
  metric: string;
};

export type WorkspaceConfig = {
  eyebrow: string;
  title: string;
  description: string;
  tabs: string[];
  addLabel: string;
  searchLabel: string;
  columns: [string, string, string, string, string, string];
  rows: WorkspaceRow[];
  stats: { label: string; value: string; change: string }[];
  details: string[];
  features?: string[];
};

const statusStyles: Record<string, string> = {
  Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Published: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  "In Progress": "bg-blue-50 text-blue-700 border-blue-200",
  Draft: "bg-slate-100 text-slate-700 border-slate-200",
  Paused: "bg-orange-50 text-orange-700 border-orange-200",
  Archived: "bg-slate-100 text-slate-600 border-slate-200",
  Rejected: "bg-red-50 text-red-700 border-red-200",
  Declined: "bg-red-50 text-red-700 border-red-200",
  Sent: "bg-purple-50 text-purple-700 border-purple-200",
};

export default function StaticModuleWorkspace({ config }: { config: WorkspaceConfig }) {
  const [activeTab, setActiveTab] = useState(config.tabs[0]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [sortNewest, setSortNewest] = useState(true);
  const [rows, setRows] = useState(config.rows);
  const [selected, setSelected] = useState<WorkspaceRow | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 2800);
  };
  const visibleRows = useMemo(() => rows
    .filter((row) => (status === "All statuses" || row.status === status) && `${row.title} ${row.subtitle} ${row.category} ${row.owner}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => sortNewest ? b.id - a.id : a.id - b.id), [rows, status, query, sortNewest]);
  const allStatuses = Array.from(new Set(rows.map((row) => row.status)));
  const updateStatus = (row: WorkspaceRow, next: string) => {
    setRows((current) => current.map((item) => item.id === row.id ? { ...item, status: next } : item));
    setSelected(null);
    showNotice(`${row.title} marked as ${next}.`);
  };

  return (
    <div className="space-y-5 font-sans text-slate-800 pb-8">
      {notice && <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-[#1f3561] px-5 py-3 text-xs font-bold text-white shadow-2xl"><CheckCircle2 size={16} className="text-[#ffd9a0]" />{notice}</div>}
      <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div><Badge className="bg-[#274690] text-xs font-bold text-white">{config.eyebrow}</Badge><h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900">{config.title}</h1><p className="mt-1 text-xs text-slate-500">{config.description}</p></div>
        <Button onClick={() => setShowCreate(true)} className="font-bold"><Plus size={15} /> {config.addLabel}</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {config.stats.map((stat) => <Card key={stat.label} className="rounded-2xl border-slate-200/80"><CardContent className="p-4"><p className="text-[11px] font-semibold text-slate-500">{stat.label}</p><div className="mt-1 flex items-end justify-between"><strong className="text-xl font-black text-slate-900">{stat.value}</strong><span className="text-[10px] font-bold text-emerald-600">{stat.change}</span></div></CardContent></Card>)}
      </div>

      <Card className="rounded-2xl border-slate-200/80 bg-white">
        <CardContent className="p-0">
          <div className="flex gap-1 overflow-x-auto border-b border-slate-200 px-4 pt-3">
            {config.tabs.map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={`shrink-0 border-b-2 px-3 py-3 text-xs font-bold transition ${activeTab === tab ? "border-[#274690] text-[#274690]" : "border-transparent text-slate-500 hover:text-slate-800"}`}>{tab}</button>)}
          </div>
          <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={config.searchLabel} className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none focus:border-[#274690] focus:bg-white" /></div>
            <div className="flex gap-2"><div className="relative"><Filter size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><select value={status} onChange={(event) => setStatus(event.target.value)} className="h-9 appearance-none rounded-xl border border-slate-200 bg-white py-0 pl-8 pr-7 text-xs font-semibold outline-none"><option>All statuses</option>{allStatuses.map((item) => <option key={item}>{item}</option>)}</select></div><Button variant="outline" size="sm" onClick={() => setSortNewest(!sortNewest)}><ArrowDownUp size={14} /> Sort</Button></div>
          </div>
          <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-xs"><thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500"><tr>{config.columns.map((column) => <th key={column} className="px-5 py-3 font-bold">{column}</th>)}</tr></thead><tbody>{visibleRows.map((row) => <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50/70"><td className="px-5 py-4"><button onClick={() => setSelected(row)} className="text-left"><p className="font-bold text-slate-900 hover:text-[#274690]">{row.title}</p><p className="mt-0.5 text-[11px] text-slate-500">{row.subtitle}</p></button></td><td className="px-5 py-4 font-medium text-slate-600">{row.category}</td><td className="px-5 py-4"><Badge className={`border text-[10px] ${statusStyles[row.status] || statusStyles.Draft}`}>{row.status}</Badge></td><td className="px-5 py-4 font-medium text-slate-600">{row.owner}</td><td className="px-5 py-4 text-slate-500">{row.date}</td><td className="px-5 py-4"><div className="flex items-center gap-2"><span className="font-bold text-slate-700">{row.metric}</span><button onClick={() => setSelected(row)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200"><MoreHorizontal size={16} /></button></div></td></tr>)}</tbody></table></div>
          {!visibleRows.length && <div className="px-5 py-12 text-center text-sm text-slate-500">No matching records found.</div>}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2"><Card className="rounded-2xl border-slate-200/80"><CardContent className="p-5"><h2 className="text-sm font-extrabold text-slate-900">Module overview</h2><div className="mt-4 space-y-3">{config.details.map((detail, index) => <div key={detail} className="flex items-center gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#274690]/10 text-[10px] font-black text-[#274690]">{index + 1}</span><p className="text-xs font-medium text-slate-600">{detail}</p></div>)}</div></CardContent></Card><Card className="rounded-2xl border-slate-200/80"><CardContent className="p-5"><div className="flex items-center justify-between"><h2 className="text-sm font-extrabold text-slate-900">Quick actions</h2><SlidersHorizontal size={16} className="text-[#274690]" /></div><div className="mt-4 flex flex-wrap gap-2">{(config.features || ["Preview", "Duplicate", "Archive", "Export"]).map((item) => <Button key={item} variant="outline" size="sm" onClick={() => showNotice(`${item} is ready in this static workspace.`)}>{item}</Button>)}</div><button onClick={() => showNotice("Export prepared as CSV.")} className="mt-6 flex items-center gap-2 text-xs font-bold text-[#274690]"><Download size={14} /> Export current view</button></CardContent></Card></div>

      {(selected || showCreate) && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"><div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><h2 className="text-lg font-black text-slate-900">{showCreate ? config.addLabel : selected?.title}</h2><p className="mt-1 text-xs text-slate-500">{showCreate ? "Add a record to this local static workspace." : selected?.subtitle}</p></div><button onClick={() => { setSelected(null); setShowCreate(false); }} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button></div>{showCreate ? <CreateForm config={config} onCancel={() => setShowCreate(false)} onCreate={(title) => { setRows((all) => [{ id: Date.now(), title, subtitle: "Newly created record", category: "General", status: "Draft", owner: "You", date: "Just now", metric: "0" }, ...all]); setShowCreate(false); showNotice(`${title} created successfully.`); }} /> : selected && <div className="mt-6 space-y-4"><div className="grid grid-cols-2 gap-3 text-xs"><Info label="Category" value={selected.category} /><Info label="Owner" value={selected.owner} /><Info label="Updated" value={selected.date} /><Info label="Metric" value={selected.metric} /></div><div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4"><Button variant="outline" size="sm" onClick={() => showNotice(`Preview opened for ${selected.title}.`)}><Eye size={14} /> Preview</Button><Button variant="outline" size="sm" onClick={() => showNotice(`${selected.title} duplicated.`)}>Duplicate</Button>{selected.status === "Archived" ? <Button size="sm" onClick={() => updateStatus(selected, "Draft")}>Restore</Button> : <Button size="sm" onClick={() => updateStatus(selected, selected.status === "Active" ? "Paused" : "Active")}>{selected.status === "Active" ? "Pause" : "Activate"}</Button>}<Button variant="outline" size="sm" onClick={() => updateStatus(selected, "Archived")}>Archive</Button></div></div>}</div></div>}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 font-semibold text-slate-700">{value}</p></div>; }
function CreateForm({ config, onCancel, onCreate }: { config: WorkspaceConfig; onCancel: () => void; onCreate: (title: string) => void }) { const [title, setTitle] = useState(""); return <form className="mt-6 space-y-4" onSubmit={(event) => { event.preventDefault(); if (title.trim()) onCreate(title.trim()); }}><div><label className="text-xs font-bold text-slate-700">Name</label><input autoFocus required value={title} onChange={(event) => setTitle(event.target.value)} placeholder={`Enter ${config.addLabel.toLowerCase()} name`} className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-[#274690]" /></div><div className="grid grid-cols-2 gap-3"><div><label className="text-xs font-bold text-slate-700">Category</label><select className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs"><option>General</option><option>Legal</option><option>Finance</option></select></div><div><label className="text-xs font-bold text-slate-700">Access</label><select className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs"><option>Team</option><option>Private</option><option>Organisation</option></select></div></div><div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button type="submit">Create</Button></div></form>; }
