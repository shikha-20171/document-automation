"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FileText, MessageSquare, Upload, Plus, UserPlus, StickyNote, PenTool,
  Globe, Mail, Phone, MapPin, Building2, User, Calendar, Hash, Briefcase,
  Activity, Clock,
} from "lucide-react";
import { clientStore, type Client, type ClientDocument, type Activity as ActivityType, formatDate, timeAgo } from "../_components/clientStore";

const DOC_STATUS_STYLES: Record<string, string> = {
  Draft: "bg-slate-100 text-slate-600",
  "Pending Approval": "bg-amber-50 text-amber-700",
  Approved: "bg-emerald-50 text-emerald-700",
  Signed: "bg-blue-50 text-blue-700",
  Rejected: "bg-red-50 text-red-700",
  Archived: "bg-slate-100 text-slate-500",
};

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  "Client created": Building2,
  "Client updated": Building2,
  "Contact added": UserPlus,
  "Document created": FileText,
  "Document shared": FileText,
  "Document approved": FileText,
  "Signature requested": PenTool,
  "Signature completed": PenTool,
  "Request created": MessageSquare,
  "Request completed": MessageSquare,
  "Note added": StickyNote,
  "User assigned": UserPlus,
};

export default function OverviewTab() {
  const params = useParams();
  const router = useRouter();
  const clientId = params?.clientId as string;

  const [client, setClient] = useState<Client | null>(null);
  const [recentDocs, setRecentDocs] = useState<ClientDocument[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityType[]>([]);

  useEffect(() => {
    const clients = clientStore.getClients();
    const found = clients.find(c => c.id === clientId);
    setClient(found ?? null);
    setRecentDocs(clientStore.getDocuments(clientId).slice(0, 5));
    setRecentActivity(clientStore.getActivities(clientId).slice(0, 8));
  }, [clientId]);

  if (!client) return null;

  const quickActions = [
    { icon: FileText, label: "Create Document", path: `documents` },
    { icon: Upload, label: "Upload Document", path: `documents` },
    { icon: MessageSquare, label: "Create Request", path: `requests` },
    { icon: UserPlus, label: "Add Contact", path: `contacts` },
    { icon: StickyNote, label: "Add Note", path: `notes` },
    { icon: PenTool, label: "Send for Signature", path: null },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Left Column */}
      <div className="lg:col-span-2 space-y-4">
        {/* Client Information */}
        <Section title="Client Information">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <InfoRow icon={Building2} label="Client Name" value={client.name} />
            <InfoRow icon={Hash} label="Client ID" value={client.id} mono />
            <InfoRow icon={User} label="Client Type" value={client.type} />
            <InfoRow icon={Briefcase} label="Industry" value={client.industry || "—"} />
            <InfoRow icon={Globe} label="Website" value={client.website || "—"} />
            <InfoRow icon={Mail} label="Email" value={client.email || "—"} />
            <InfoRow icon={Phone} label="Phone" value={client.phone || "—"} />
            <InfoRow icon={MapPin} label="Address" value={[client.address, client.city, client.state, client.country].filter(Boolean).join(", ") || "—"} />
            <InfoRow icon={Activity} label="Status" value={client.status} />
            <InfoRow icon={Calendar} label="Created" value={formatDate(client.createdAt)} />
          </div>
        </Section>

        {/* Recent Documents */}
        <Section title="Recent Documents" action={{ label: "View all →", onClick: () => router.push(`/org-admin/clients-crm/${clientId}/documents`) }}>
          {recentDocs.length === 0 ? (
            <EmptyState icon={FileText} text="No documents yet" />
          ) : (
            <div className="space-y-2">
              {recentDocs.map(doc => (
                <div key={doc.id} className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#274690]/10">
                      <FileText size={14} className="text-[#274690]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{doc.title}</p>
                      <p className="text-[10px] text-slate-400">{doc.type} · {doc.version} · {formatDate(doc.updatedAt)}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${DOC_STATUS_STYLES[doc.status] || "bg-slate-100 text-slate-600"}`}>
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Recent Activity */}
        <Section title="Recent Activity" action={{ label: "View all →", onClick: () => router.push(`/org-admin/clients-crm/${clientId}/activities`) }}>
          {recentActivity.length === 0 ? (
            <EmptyState icon={Clock} text="No activity yet" />
          ) : (
            <div className="space-y-3">
              {recentActivity.map(act => {
                const Icon = ACTIVITY_ICONS[act.type] || Activity;
                return (
                  <div key={act.id} className="flex items-start gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#274690]/8 mt-0.5">
                      <Icon size={12} className="text-[#274690]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700">{act.description}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{act.user} · {timeAgo(act.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      </div>

      {/* Right Column */}
      <div className="space-y-4">
        {/* Assigned Team */}
        <Section title="Assigned Team">
          <div className="space-y-3">
            <InfoRow icon={Briefcase} label="Department" value={client.department || "—"} />
            <InfoRow icon={User} label="Account Owner" value={client.assignedTo || "—"} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">Team Members</p>
              <div className="flex flex-wrap gap-1.5">
                {client.assignedTo ? (
                  <span className="flex items-center gap-1.5 rounded-full bg-[#274690]/8 border border-[#274690]/15 px-2.5 py-1 text-[11px] font-semibold text-[#274690]">
                    <div className="h-5 w-5 rounded-full bg-[#274690] flex items-center justify-center text-[9px] font-black text-white">
                      {client.assignedTo.charAt(0)}
                    </div>
                    {client.assignedTo}
                  </span>
                ) : <span className="text-xs text-slate-400">No team assigned</span>}
              </div>
            </div>
          </div>
        </Section>

        {/* Quick Actions */}
        <Section title="Quick Actions">
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map(({ icon: Icon, label, path }) => (
              <button
                key={label}
                onClick={() => path ? router.push(`/org-admin/clients-crm/${clientId}/${path}`) : undefined}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-center text-[10px] font-bold text-slate-600 hover:border-[#274690] hover:bg-[#274690]/5 hover:text-[#274690] transition"
              >
                <Icon size={16} className="text-[#274690]" />
                {label}
              </button>
            ))}
          </div>
        </Section>

        {/* Notes preview */}
        {client.notes && (
          <Section title="Internal Notes">
            <p className="text-xs text-slate-600 leading-relaxed">{client.notes}</p>
            <button onClick={() => router.push(`/org-admin/clients-crm/${clientId}/notes`)} className="mt-2 text-xs font-bold text-[#274690] hover:underline">
              View all notes →
            </button>
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-extrabold text-slate-900">{title}</h2>
        {action && <button onClick={action.onClick} className="text-xs font-bold text-[#274690] hover:underline">{action.label}</button>}
      </div>
      {children}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, mono }: { icon: React.ElementType; label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 flex items-center gap-1">
        <Icon size={9} /> {label}
      </p>
      <p className={`mt-0.5 text-xs font-semibold text-slate-700 ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex flex-col items-center py-6 text-slate-300">
      <Icon size={24} className="mb-2" />
      <p className="text-xs font-medium">{text}</p>
    </div>
  );
}
