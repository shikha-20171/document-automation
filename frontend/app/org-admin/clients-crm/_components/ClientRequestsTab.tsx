"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, MessageSquare, MoreHorizontal, Calendar, User, Flag, CheckCircle2, X, ChevronRight } from "lucide-react";
import { clientStore, type ClientRequest, type Client, TEAM_MEMBERS, formatDate } from "./clientStore";

const STATUS_STYLES: Record<string, string> = {
  "New": "bg-slate-100 text-slate-600 border-slate-200",
  "In Progress": "bg-blue-50 text-blue-700 border-blue-200",
  "Waiting for Client": "bg-amber-50 text-amber-700 border-amber-200",
  "Pending Approval": "bg-violet-50 text-violet-700 border-violet-200",
  "Completed": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Rejected": "bg-red-50 text-red-700 border-red-200",
  "Cancelled": "bg-slate-100 text-slate-500 border-slate-200",
};

const PRIORITY_STYLES: Record<string, string> = {
  Low: "text-slate-500",
  Medium: "text-blue-600",
  High: "text-amber-600",
  Urgent: "text-red-600",
};

const REQUEST_TYPES = ["New Document", "Document Update", "Contract", "NDA", "Agreement", "Compliance Document", "Signature Request", "Other"] as const;

export default function ClientRequestsTab({ allClients }: { allClients?: boolean }) {
  const params = useParams();
  const router = useRouter();
  const clientId = allClients ? undefined : (params?.clientId as string);

  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("All");

  const load = () => {
    setRequests(clientStore.getRequests(clientId));
    setClients(clientStore.getClients());
  };
  useEffect(() => { load(); }, [clientId]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const updateStatus = (req: ClientRequest, status: ClientRequest["status"]) => {
    clientStore.updateRequest(req.id, { status });
    load();
    showToast(`Request "${req.title}" → ${status}`);
    setOpenMenu(null);
  };

  const filtered = statusFilter === "All" ? requests : requests.filter(r => r.status === statusFilter);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-[#1f3561] px-5 py-3 text-xs font-bold text-white shadow-2xl">
          <CheckCircle2 size={15} className="text-[#ffd9a0]" /> {toast}
          <button onClick={() => setToast(null)}><X size={13} className="opacity-60" /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900">{allClients ? "All Requests" : "Requests"}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{filtered.length} request{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2 items-center">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-8 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold outline-none">
            {["All", "New", "In Progress", "Waiting for Client", "Pending Approval", "Completed", "Rejected", "Cancelled"].map(s => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 rounded-xl bg-[#274690] px-3 py-2 text-xs font-bold text-white hover:bg-[#1f3561] transition">
            <Plus size={13} /> Create Request
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[950px] text-left text-xs">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500 border-b border-slate-100">
            <tr>
              {["Request", allClients ? "Client" : null, "Assigned To", "Priority", "Status", "Due Date", "Created", "Actions"].filter(Boolean).map(h => (
                <th key={h!} className="px-5 py-3 font-bold whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(req => (
              <tr key={req.id} className="border-t border-slate-100 hover:bg-slate-50/60 transition">
                <td className="px-5 py-4">
                  <button onClick={() => router.push(`/org-admin/clients-crm/requests/${req.id}`)} className="text-left group">
                    <p className="font-bold text-slate-800 group-hover:text-[#274690] transition">{req.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{req.type} · {req.id}</p>
                  </button>
                </td>
                {allClients && (
                  <td className="px-5 py-4">
                    <button onClick={() => router.push(`/org-admin/clients-crm/${req.clientId}`)} className="text-xs font-semibold text-[#274690] hover:underline">
                      {req.clientName}
                    </button>
                  </td>
                )}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1.5">
                    <div className="h-5 w-5 rounded-full bg-[#274690]/15 flex items-center justify-center text-[9px] font-black text-[#274690]">
                      {req.assignedTo.charAt(0)}
                    </div>
                    <span className="text-slate-600 font-medium">{req.assignedTo}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`flex items-center gap-1 font-bold ${PRIORITY_STYLES[req.priority]}`}>
                    <Flag size={11} /> {req.priority}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${STATUS_STYLES[req.status]}`}>
                    {req.status}
                  </span>
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <span className={`flex items-center gap-1 ${new Date(req.dueDate) < new Date() ? "text-red-600 font-bold" : "text-slate-500"}`}>
                    <Calendar size={11} /> {req.dueDate}
                  </span>
                </td>
                <td className="px-5 py-4 text-slate-500 whitespace-nowrap">{formatDate(req.createdAt)}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1">
                    <button onClick={() => router.push(`/org-admin/clients-crm/requests/${req.id}`)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 transition">
                      <ChevronRight size={14} />
                    </button>
                    <div className="relative">
                      <button onClick={() => setOpenMenu(openMenu === req.id ? null : req.id)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 transition">
                        <MoreHorizontal size={15} />
                      </button>
                      {openMenu === req.id && (
                        <div className="absolute right-0 top-full z-30 mt-1 w-52 rounded-xl border border-slate-200 bg-white shadow-xl py-1">
                          <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">Change Status</p>
                          {(["In Progress", "Waiting for Client", "Pending Approval", "Completed", "Rejected", "Cancelled"] as ClientRequest["status"][]).map(s => (
                            s !== req.status && (
                              <button key={s} onClick={() => updateStatus(req, s)} className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                                → {s}
                              </button>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-16 text-slate-300">
            <MessageSquare size={32} className="mb-3" />
            <p className="text-sm font-semibold text-slate-500">No requests found</p>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateRequestModal
          clientId={clientId ?? ""}
          clientName={clients.find(c => c.id === clientId)?.name ?? ""}
          clients={clients}
          allClients={allClients}
          onClose={() => setShowCreate(false)}
          onSaved={msg => { load(); showToast(msg); setShowCreate(false); }}
        />
      )}
    </div>
  );
}

function CreateRequestModal({ clientId, clientName, clients, allClients, onClose, onSaved }: {
  clientId: string; clientName: string; clients: Client[]; allClients?: boolean; onClose: () => void; onSaved: (msg: string) => void;
}) {
  const [form, setForm] = useState({
    title: "",
    type: "New Document" as ClientRequest["type"],
    clientId: clientId,
    clientName: clientName,
    description: "",
    priority: "Medium" as ClientRequest["priority"],
    assignedTo: "",
    dueDate: "",
    requestedBy: "You",
    attachments: [] as string[],
    status: "New" as ClientRequest["status"],
  });

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const handleClientChange = (id: string) => {
    const c = clients.find(cl => cl.id === id);
    setForm(f => ({ ...f, clientId: id, clientName: c?.name ?? "" }));
  };

  const handleSave = () => {
    clientStore.addRequest(form);
    onSaved(`Request "${form.title}" created`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl flex flex-col max-h-[88vh]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-base font-black text-slate-900">Create Request</h2>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 transition"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <Field label="Request Title *" value={form.title} onChange={v => set("title", v)} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">Request Type</label>
              <select value={form.type} onChange={e => set("type", e.target.value)} className={INPUT_CLS}>
                {REQUEST_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            {allClients ? (
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">Client *</label>
                <select value={form.clientId} onChange={e => handleClientChange(e.target.value)} className={INPUT_CLS}>
                  <option value="">Select client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            ) : null}
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">Priority</label>
              <select value={form.priority} onChange={e => set("priority", e.target.value)} className={INPUT_CLS}>
                {["Low", "Medium", "High", "Urgent"].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">Assigned To</label>
              <select value={form.assignedTo} onChange={e => set("assignedTo", e.target.value)} className={INPUT_CLS}>
                <option value="">Select user</option>
                {TEAM_MEMBERS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">Due Date</label>
              <input type="date" value={form.dueDate} onChange={e => set("dueDate", e.target.value)} className={INPUT_CLS} />
            </div>
            <Field label="Requested By" value={form.requestedBy} onChange={v => set("requestedBy", v)} />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">Description</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} className={`${INPUT_CLS} h-auto py-2 resize-none`} placeholder="Describe the request..." />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition">Cancel</button>
          <button onClick={handleSave} disabled={!form.title.trim() || !form.clientId} className="rounded-xl bg-[#274690] px-5 py-2 text-xs font-bold text-white hover:bg-[#1f3561] transition disabled:opacity-40">
            Create Request
          </button>
        </div>
      </div>
    </div>
  );
}

const INPUT_CLS = "h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 outline-none focus:border-[#274690] focus:bg-white transition";

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-700 mb-1.5 block">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} className={INPUT_CLS} />
    </div>
  );
}
