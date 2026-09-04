"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Flag, Calendar, User, MessageSquare, FileText, Activity,
  CheckCircle2, X, Send, ChevronDown, PenTool, Upload,
  Clock, Building2,
} from "lucide-react";
import { clientStore, type ClientRequest, TEAM_MEMBERS, formatDate, timeAgo } from "../../_components/clientStore";

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
  Low: "bg-slate-50 text-slate-600 border-slate-200",
  Medium: "bg-blue-50 text-blue-600 border-blue-200",
  High: "bg-amber-50 text-amber-700 border-amber-200",
  Urgent: "bg-red-50 text-red-700 border-red-200",
};

const TABS = ["Details", "Documents", "Comments", "Activity"] as const;
type Tab = (typeof TABS)[number];

export default function RequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = params?.requestId as string;

  const [req, setReq] = useState<ClientRequest | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("Details");
  const [toast, setToast] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [statusOpen, setStatusOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const load = () => {
    const all = clientStore.getRequests();
    setReq(all.find(r => r.id === requestId) ?? null);
  };

  useEffect(() => { load(); }, [requestId]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const updateStatus = (status: ClientRequest["status"]) => {
    clientStore.updateRequest(requestId, { status });
    load();
    showToast(`Status → ${status}`);
    setStatusOpen(false);
  };

  const updatePriority = (priority: ClientRequest["priority"]) => {
    clientStore.updateRequest(requestId, { priority });
    load();
    showToast(`Priority → ${priority}`);
    setPriorityOpen(false);
  };

  const assignTo = (user: string) => {
    clientStore.updateRequest(requestId, { assignedTo: user });
    clientStore.addActivity({ clientId: req!.clientId, type: "User assigned", description: `${user} assigned to request "${req!.title}"`, user: "You" });
    load();
    showToast(`Assigned to ${user}`);
    setAssignOpen(false);
  };

  const addComment = () => {
    if (!commentText.trim()) return;
    clientStore.addComment(requestId, commentText.trim());
    load();
    setCommentText("");
    showToast("Comment added");
  };

  if (!req) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <MessageSquare size={40} className="mb-4 opacity-30" />
        <p className="text-sm font-semibold">Request not found</p>
        <button onClick={() => router.back()} className="mt-4 text-xs font-bold text-[#274690] hover:underline">← Go back</button>
      </div>
    );
  }

  const client = clientStore.getClients().find(c => c.id === req.clientId);

  return (
    <div className="space-y-4 pb-8">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-[#1f3561] px-5 py-3 text-xs font-bold text-white shadow-2xl">
          <CheckCircle2 size={15} className="text-[#ffd9a0]" /> {toast}
          <button onClick={() => setToast(null)}><X size={13} className="opacity-60" /></button>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <button onClick={() => router.push("/org-admin/clients-crm")} className="hover:text-[#274690] transition">Clients & CRM</button>
        <span>/</span>
        <button onClick={() => router.push("/org-admin/clients-crm/requests")} className="hover:text-[#274690] transition">Requests</button>
        <span>/</span>
        <span className="text-slate-800 font-bold truncate max-w-[200px]">{req.title}</span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Main Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Request Header Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="px-5 pt-5 pb-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#274690]/10">
                  <MessageSquare size={18} className="text-[#274690]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-black text-slate-900">{req.title}</h1>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${STATUS_STYLES[req.status]}`}>
                      {req.status}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${PRIORITY_STYLES[req.priority]}`}>
                      <Flag size={9} /> {req.priority}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{req.id}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-0 border-t border-slate-100 px-4 bg-slate-50/60">
              {TABS.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`shrink-0 border-b-2 px-4 py-2.5 text-xs font-bold transition ${activeTab === tab ? "border-[#274690] text-[#274690]" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
                  {tab} {tab === "Comments" && req.comments.length > 0 && <span className="ml-1 rounded-full bg-[#274690] text-white text-[9px] font-black px-1.5">{req.comments.length}</span>}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-5">
              {activeTab === "Details" && (
                <div className="space-y-4">
                  <InfoGrid req={req} client={client} />
                  {req.description && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">Description</p>
                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-3.5 border border-slate-100">{req.description}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "Documents" && (
                <div>
                  {clientStore.getDocuments(req.clientId).slice(0, 4).map(doc => (
                    <div key={doc.id} className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#274690]/10"><FileText size={14} className="text-[#274690]" /></div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-800">{doc.title}</p>
                        <p className="text-[10px] text-slate-400">{doc.type} · {doc.status}</p>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => showToast("Attach document — coming soon")} className="mt-3 flex items-center gap-2 text-xs font-bold text-[#274690] hover:underline">
                    <Upload size={13} /> Attach Document
                  </button>
                </div>
              )}

              {activeTab === "Comments" && (
                <div className="space-y-4">
                  {req.comments.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 py-8">No comments yet. Be the first to comment.</p>
                  ) : (
                    <div className="space-y-3">
                      {req.comments.map(c => (
                        <div key={c.id} className="flex items-start gap-3">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#274690] text-[10px] font-black text-white">
                            {c.author.charAt(0)}
                          </div>
                          <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-slate-700">{c.author}</span>
                              <span className="text-[10px] text-slate-400">{timeAgo(c.createdAt)}</span>
                            </div>
                            <p className="text-xs text-slate-600">{c.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Comment Input */}
                  <div className="flex gap-2 mt-3">
                    <input value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addComment(); }} placeholder="Write a comment..." className="flex-1 h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs outline-none focus:border-[#274690]" />
                    <button onClick={addComment} disabled={!commentText.trim()} className="flex items-center gap-1.5 rounded-xl bg-[#274690] px-3 py-2 text-xs font-bold text-white hover:bg-[#1f3561] transition disabled:opacity-40">
                      <Send size={12} /> Send
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "Activity" && (
                <div className="space-y-3">
                  {clientStore.getActivities(req.clientId).slice(0, 10).map(act => (
                    <div key={act.id} className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-[#274690]/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Activity size={11} className="text-[#274690]" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-700">{act.description}</p>
                        <p className="text-[10px] text-slate-400">{act.user} · {timeAgo(act.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Action Panel */}
        <div className="space-y-4">
          {/* Status */}
          <ActionCard title="Request Status">
            <div className="relative">
              <button onClick={() => { setStatusOpen(o => !o); setPriorityOpen(false); setAssignOpen(false); }} className={`w-full flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-bold ${STATUS_STYLES[req.status]}`}>
                {req.status} <ChevronDown size={13} />
              </button>
              {statusOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 z-20 rounded-xl border border-slate-200 bg-white shadow-xl py-1">
                  {(["New", "In Progress", "Waiting for Client", "Pending Approval", "Completed", "Rejected", "Cancelled"] as ClientRequest["status"][]).map(s => (
                    <button key={s} onClick={() => updateStatus(s)} className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50 ${s === req.status ? "font-black text-[#274690]" : "text-slate-700"}`}>
                      {s === req.status ? "✓ " : ""}{s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </ActionCard>

          {/* Priority */}
          <ActionCard title="Priority">
            <div className="relative">
              <button onClick={() => { setPriorityOpen(o => !o); setStatusOpen(false); setAssignOpen(false); }} className={`w-full flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-bold ${PRIORITY_STYLES[req.priority]}`}>
                <span className="flex items-center gap-1.5"><Flag size={11} /> {req.priority}</span>
                <ChevronDown size={13} />
              </button>
              {priorityOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 z-20 rounded-xl border border-slate-200 bg-white shadow-xl py-1">
                  {(["Low", "Medium", "High", "Urgent"] as ClientRequest["priority"][]).map(p => (
                    <button key={p} onClick={() => updatePriority(p)} className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50 ${p === req.priority ? "font-black text-[#274690]" : "text-slate-700"}`}>
                      {p === req.priority ? "✓ " : ""}{p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </ActionCard>

          {/* Assigned To */}
          <ActionCard title="Assigned To">
            <div className="relative">
              <button onClick={() => { setAssignOpen(o => !o); setStatusOpen(false); setPriorityOpen(false); }} className="w-full flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition">
                <span className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-[#274690] flex items-center justify-center text-[9px] font-black text-white">{req.assignedTo.charAt(0)}</div>
                  {req.assignedTo || "Unassigned"}
                </span>
                <ChevronDown size={13} />
              </button>
              {assignOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 z-20 rounded-xl border border-slate-200 bg-white shadow-xl py-1">
                  {TEAM_MEMBERS.map(u => (
                    <button key={u} onClick={() => assignTo(u)} className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50 ${u === req.assignedTo ? "font-black text-[#274690]" : "text-slate-700"}`}>
                      {u === req.assignedTo ? "✓ " : ""}{u}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </ActionCard>

          {/* Client */}
          <ActionCard title="Client">
            <button onClick={() => router.push(`/org-admin/clients-crm/${req.clientId}`)} className="flex items-center gap-2.5 w-full group">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#274690]">
                <Building2 size={14} className="text-white" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800 group-hover:text-[#274690] transition">{req.clientName}</p>
                <p className="text-[10px] text-slate-400">Requested by: {req.requestedBy}</p>
              </div>
            </button>
          </ActionCard>

          {/* Due Date */}
          <ActionCard title="Due Date">
            <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold ${new Date(req.dueDate) < new Date() ? "bg-red-50 border-red-200 text-red-700" : "bg-slate-50 border-slate-200 text-slate-700"}`}>
              <Calendar size={13} /> {req.dueDate || "Not set"}
              {new Date(req.dueDate) < new Date() && <span className="ml-auto text-[10px] bg-red-100 rounded-full px-1.5 py-0.5">Overdue</span>}
            </div>
          </ActionCard>

          {/* Quick Actions */}
          <ActionCard title="Quick Actions">
            <div className="space-y-2">
              {[
                { label: "Request Approval", icon: CheckCircle2, onClick: () => updateStatus("Pending Approval") },
                { label: "Send for Signature", icon: PenTool, onClick: () => showToast("Signature request sent") },
                { label: "Complete Request", icon: CheckCircle2, onClick: () => updateStatus("Completed"), green: true },
                { label: "Reject Request", icon: X, onClick: () => updateStatus("Rejected"), red: true },
              ].map(({ label, icon: Icon, onClick, green, red }) => (
                <button key={label} onClick={onClick} className={`w-full flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                  green ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50" :
                  red ? "border-red-200 text-red-600 hover:bg-red-50" :
                  "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}>
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>
          </ActionCard>

          {/* Meta */}
          <ActionCard title="Request Info">
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Type</span>
                <span className="font-semibold text-slate-700">{req.type}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Created</span>
                <span className="font-semibold text-slate-700">{formatDate(req.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Comments</span>
                <span className="font-semibold text-slate-700">{req.comments.length}</span>
              </div>
            </div>
          </ActionCard>
        </div>
      </div>
    </div>
  );
}

function ActionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 mb-3">{title}</p>
      {children}
    </div>
  );
}

function InfoGrid({ req, client }: { req: ClientRequest; client: ReturnType<typeof clientStore.getClients>[number] | undefined }) {
  const rows = [
    { label: "Request Type", value: req.type, icon: MessageSquare },
    { label: "Client", value: req.clientName, icon: Building2 },
    { label: "Requested By", value: req.requestedBy, icon: User },
    { label: "Assigned To", value: req.assignedTo, icon: User },
    { label: "Priority", value: req.priority, icon: Flag },
    { label: "Due Date", value: req.dueDate || "Not set", icon: Calendar },
    { label: "Created", value: formatDate(req.createdAt), icon: Clock },
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {rows.map(({ label, value, icon: Icon }) => (
        <div key={label} className="rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 flex items-center gap-1"><Icon size={9} /> {label}</p>
          <p className="mt-0.5 text-xs font-semibold text-slate-700 truncate">{value}</p>
        </div>
      ))}
    </div>
  );
}
