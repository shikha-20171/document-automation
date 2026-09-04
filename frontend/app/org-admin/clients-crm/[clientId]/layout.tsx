"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import {
  ArrowLeft, Edit2, Plus, FileText, MoreHorizontal, Building2, User,
  Globe, Mail, Phone, MapPin, ChevronDown, CheckCircle2, X,
} from "lucide-react";
import { clientStore, type Client, formatDate } from "../_components/clientStore";

const TABS = [
  { label: "Overview", path: "overview" },
  { label: "Contacts", path: "contacts" },
  { label: "Documents", path: "documents" },
  { label: "Requests", path: "requests" },
  { label: "Activities", path: "activities" },
  { label: "Notes", path: "notes" },
];

const STATUS_STYLES: Record<string, string> = {
  Active: "bg-emerald-100 text-emerald-700 border-emerald-300",
  Inactive: "bg-slate-100 text-slate-600 border-slate-300",
  Prospect: "bg-blue-100 text-blue-700 border-blue-300",
  Archived: "bg-amber-100 text-amber-700 border-amber-300",
};

export default function ClientDetailLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const clientId = params?.clientId as string;

  const [client, setClient] = useState<Client | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    const clients = clientStore.getClients();
    const found = clients.find(c => c.id === clientId);
    setClient(found ?? null);
  }, [clientId]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const activeTab = TABS.find(t => pathname?.includes(`/${t.path}`))?.path ?? "overview";

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <Building2 size={40} className="mb-4 opacity-30" />
        <p className="text-sm font-semibold">Client not found</p>
        <button onClick={() => router.push("/org-admin/clients-crm")} className="mt-4 text-xs font-bold text-[#274690] hover:underline">← Back to Clients</button>
      </div>
    );
  }

  const summaryStats = [
    { label: "Total Documents", value: client.documents },
    { label: "Pending Requests", value: clientStore.getRequests(clientId).filter(r => ["New", "In Progress", "Waiting for Client"].includes(r.status)).length },
    { label: "Completed Requests", value: clientStore.getRequests(clientId).filter(r => r.status === "Completed").length },
    { label: "Active Workflows", value: Math.max(0, client.documents - 5) },
    { label: "Last Activity", value: null },
  ];

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
      <button onClick={() => router.push("/org-admin/clients-crm")} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#274690] transition">
        <ArrowLeft size={14} /> Clients & CRM
      </button>

      {/* Client Header Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="px-6 pt-5 pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-md ${client.type === "Company" ? "bg-[#274690]" : "bg-violet-600"}`}>
                {client.type === "Company" ? <Building2 size={22} /> : <User size={22} />}
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl font-black text-slate-900">{client.name}</h1>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${STATUS_STYLES[client.status]}`}>
                    {client.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {client.industry && <span className="text-xs text-slate-500 font-medium">{client.industry}</span>}
                  <span className="text-[10px] text-slate-400">·</span>
                  <span className="text-xs text-slate-500 font-mono font-medium">{client.id}</span>
                  {client.createdAt && (
                    <>
                      <span className="text-[10px] text-slate-400">·</span>
                      <span className="text-xs text-slate-400">Since {formatDate(client.createdAt)}</span>
                    </>
                  )}
                </div>
                {/* Quick info pills */}
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {client.email && <InfoPill icon={Mail} text={client.email} />}
                  {client.phone && <InfoPill icon={Phone} text={client.phone} />}
                  {client.website && <InfoPill icon={Globe} text={client.website} />}
                  {(client.city || client.country) && <InfoPill icon={MapPin} text={[client.city, client.country].filter(Boolean).join(", ")} />}
                </div>
                {/* Tags */}
                {client.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {client.tags.map(tag => (
                      <span key={tag} className="rounded-full bg-[#274690]/8 border border-[#274690]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#274690]">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => showToast("Edit client form — coming soon")} className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition">
                <Edit2 size={13} /> Edit
              </button>
              <button onClick={() => router.push(`/org-admin/clients-crm/${clientId}/documents`)} className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition">
                <Plus size={13} /> Add Document
              </button>
              <button onClick={() => router.push(`/org-admin/clients-crm/${clientId}/requests`)} className="flex items-center gap-1.5 rounded-xl bg-[#274690] px-3 py-2 text-xs font-bold text-white hover:bg-[#1f3561] transition">
                <FileText size={13} /> Create Request
              </button>
              <div className="relative">
                <button onClick={() => setMoreOpen(o => !o)} className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition">
                  <MoreHorizontal size={15} /> <ChevronDown size={11} />
                </button>
                {moreOpen && (
                  <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-slate-200 bg-white shadow-xl z-20 py-1">
                    {[
                      ["Add Note", () => { router.push(`/org-admin/clients-crm/${clientId}/notes`); setMoreOpen(false); }],
                      ["View Activities", () => { router.push(`/org-admin/clients-crm/${clientId}/activities`); setMoreOpen(false); }],
                      ["Send for Signature", () => { showToast("E-signature flow — coming soon"); setMoreOpen(false); }],
                      ["Archive Client", () => { clientStore.updateClient(clientId, { status: "Archived" }); setClient(c => c ? { ...c, status: "Archived" } : c); showToast("Client archived"); setMoreOpen(false); }],
                    ].map(([label, fn]) => (
                      <button key={label as string} onClick={fn as () => void} className="flex w-full items-center px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                        {label as string}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-px bg-slate-100 border-t border-slate-100 lg:grid-cols-5">
          {summaryStats.map(s => (
            <div key={s.label} className="bg-white px-4 py-3 text-center">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{s.label}</p>
              <p className="mt-0.5 text-lg font-black text-slate-900">
                {s.value !== null ? s.value : (
                  <span className="text-xs font-semibold text-slate-500">
                    {new Date(client.lastActivity).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                  </span>
                )}
              </p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-0 overflow-x-auto border-t border-slate-100 px-4 bg-slate-50/60">
          {TABS.map(tab => (
            <button
              key={tab.path}
              onClick={() => router.push(`/org-admin/clients-crm/${clientId}/${tab.path}`)}
              className={`shrink-0 border-b-2 px-4 py-3 text-xs font-bold transition whitespace-nowrap ${
                activeTab === tab.path
                  ? "border-[#274690] text-[#274690]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>{children}</div>
    </div>
  );
}

function InfoPill({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[10px] font-medium text-slate-600">
      <Icon size={10} className="text-slate-400" /> {text}
    </span>
  );
}
