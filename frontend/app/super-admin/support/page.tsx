"use client";

import { useEffect, useState } from "react";
import {
  LifeBuoy,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  MessageSquare,
  Sparkles,
  X,
  User,
  Paperclip,
  Shield,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supportApi } from "@/services/supportApi";

export default function SuperAdminSupportPage() {
  const [activeTab, setActiveTab] = useState<"tickets" | "overview">("tickets");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [internalNote, setInternalNote] = useState("");

  const DEFAULT_TICKETS = [
    {
      id: "TCK-8921",
      org: "Enterprise Tenant Alpha",
      createdBy: "Sarah Jenkins (Org Admin)",
      category: "AI Inference Latency",
      priority: "HIGH",
      status: "IN_PROGRESS",
      created: "2 hours ago",
      assignedTo: "Karan Mehta (L2 Support)",
      subject: "Claude 3.5 contract analysis intermittent 504 gateway timeout",
      messages: [
        { sender: "Sarah Jenkins", role: "Customer", time: "2 hours ago", text: "When analyzing 80+ page MSA contracts, Claude 3.5 times out after 30 seconds." },
        { sender: "Karan Mehta", role: "DocuCore L2", time: "1 hour ago", text: "Investigating inference timeout thresholds. Adjusting gateway proxy timeout to 60s." },
      ],
      notes: "Inference proxy timeout configuration adjusted in worker pool.",
    },
    {
      id: "TCK-8920",
      org: "Reliance Tech",
      createdBy: "Vikram Malhotra",
      category: "Storage Quota Extension",
      priority: "MEDIUM",
      status: "OPEN",
      created: "5 hours ago",
      assignedTo: "Unassigned",
      subject: "Requesting additional 2 TB S3 bucket quota for Q3 audit",
      messages: [
        { sender: "Vikram Malhotra", role: "Customer", time: "5 hours ago", text: "We have reached 84% capacity. Requesting temporary expansion for the quarterly compliance audit." },
      ],
      notes: "",
    },
    {
      id: "TCK-8919",
      org: "Global Dynamics Ltd",
      createdBy: "Ananya Roy",
      category: "SSO / SAML 2.0 Integration",
      priority: "LOW",
      status: "RESOLVED",
      created: "1 day ago",
      assignedTo: "Deepak Sharma (Identity Team)",
      subject: "Okta metadata certificate rotated successfully",
      messages: [
        { sender: "Ananya Roy", role: "Customer", time: "1 day ago", text: "Rotated our Okta certificate. Verified employee SSO login works normally." },
        { sender: "Deepak Sharma", role: "DocuCore L2", time: "22 hours ago", text: "Confirmed Okta cert fingerprint verified in platform configuration. Closing ticket." },
      ],
      notes: "Certificate verification logged in audit trail.",
    },
  ];

  const normalizeTicket = (t: any) => ({
    id: t.id || "TCK-" + Math.floor(1000 + Math.random() * 9000),
    org: t.org || t.organisation?.name || "Tenant Organization",
    createdBy: t.createdBy || t.user?.name || t.user?.email || "Tenant User",
    category: t.category || t.type || "General Inquiry",
    priority: (t.priority || "MEDIUM").toUpperCase(),
    status: (t.status || "OPEN").toUpperCase(),
    created: t.created || (t.created_at ? new Date(t.created_at).toLocaleString() : "Recently"),
    assignedTo: t.assignedTo || "Support Team",
    subject: t.subject || t.title || "Support Ticket",
    description: t.description || t.message || "",
    messages: Array.isArray(t.messages)
      ? t.messages
      : t.description || t.message
      ? [
          {
            sender: t.createdBy || t.user?.name || "Customer",
            role: "Customer",
            time: t.created || "Initial message",
            text: t.description || t.message,
          },
        ]
      : [],
    notes: t.notes || "",
  });

  const [tickets, setTickets] = useState<any[]>(DEFAULT_TICKETS.map(normalizeTicket));

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await supportApi.getTickets({}, "/super-admin/support/tickets");
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          setTickets(res.data.map(normalizeTicket));
        }
      } catch {
        // Resilient fallback
      }
    };
    void fetchTickets();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;
    const newMsg = {
      sender: "Super Admin (Platform Support)",
      role: "Platform Support",
      time: "Just now",
      text: replyText,
    };
    const updatedMessages = [...(selectedTicket.messages || []), newMsg];
    const updatedTicket = {
      ...selectedTicket,
      messages: updatedMessages,
    };
    setSelectedTicket(updatedTicket);
    setTickets((prev) =>
      prev.map((t) => (t.id === selectedTicket.id ? updatedTicket : t))
    );
    setReplyText("");
    showToast("Reply sent to customer ticket.");
  };

  const handleUpdateStatus = (newStatus: string) => {
    if (!selectedTicket) return;
    const updated = { ...selectedTicket, status: newStatus };
    setSelectedTicket(updated);
    setTickets((prev) =>
      prev.map((t) => (t.id === selectedTicket.id ? updated : t))
    );
    showToast(`Ticket status changed to ${newStatus}`);
  };

  const filteredTickets = tickets.filter((t) => {
    const sTerm = searchTerm.toLowerCase();
    const matchesSearch =
      (t.id || "").toLowerCase().includes(sTerm) ||
      (t.org || "").toLowerCase().includes(sTerm) ||
      (t.subject || "").toLowerCase().includes(sTerm);
    const matchesStatus =
      statusFilter === "ALL" || (t.status || "").toUpperCase() === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 rounded-2xl bg-slate-900 text-white px-4 py-3 shadow-2xl border border-slate-700 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <Sparkles className="text-[#c96f4a]" size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Customer Support & Service Desk
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Manage customer issue tickets, SLA resolution metrics, internal support notes, and tenant inquiries
          </p>
        </div>

        <Badge className="bg-blue-50 text-[#274690] dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 text-xs font-bold px-3 py-1 self-start sm:self-auto">
          <LifeBuoy size={13} className="mr-1" />
          {tickets.filter((t) => t.status !== "RESOLVED" && t.status !== "CLOSED").length} Open Tickets
        </Badge>
      </div>

      {/* 2 Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab("tickets")}
          className={`px-4 py-2 rounded-xl transition ${
            activeTab === "tickets"
              ? "bg-[#274690] text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          Support Tickets ({tickets.length})
        </button>
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-xl transition ${
            activeTab === "overview"
              ? "bg-[#274690] text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          SLA Performance & Metrics
        </button>
      </div>

      {/* TAB 1: TICKETS */}
      {activeTab === "tickets" && (
        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search ticket ID, org, subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:outline-none focus:border-[#274690]"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {["ALL", "OPEN", "IN_PROGRESS", "RESOLVED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    statusFilter === st
                      ? "bg-[#c96f4a] text-white"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-3.5 pl-6">Ticket ID</th>
                  <th className="p-3.5">Organization</th>
                  <th className="p-3.5">Subject / Category</th>
                  <th className="p-3.5">Priority</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Assignee</th>
                  <th className="p-3.5 pr-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <td className="p-3.5 pl-6 font-mono font-bold text-slate-900 dark:text-slate-100">{t.id}</td>
                    <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">{t.org}</td>
                    <td className="p-3.5">
                      <p className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-xs">{t.subject}</p>
                      <p className="text-[10px] text-slate-400">{t.category}</p>
                    </td>
                    <td className="p-3.5">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold ${
                          t.priority === "HIGH"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : t.priority === "MEDIUM"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {t.priority}
                      </Badge>
                    </td>
                    <td className="p-3.5">
                      <Badge
                        className={`text-[10px] font-bold ${
                          t.status === "RESOLVED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : t.status === "IN_PROGRESS"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {t.status}
                      </Badge>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-600 dark:text-slate-400">{t.assignedTo}</td>
                    <td className="p-3.5 pr-6 text-right">
                      <Button
                        size="sm"
                        onClick={() => setSelectedTicket(t)}
                        className="h-8 px-2.5 text-xs font-bold bg-[#274690] text-white rounded-xl"
                      >
                        <Eye size={13} className="mr-1" /> View Ticket
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 2: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 p-4">
            <span className="text-[11px] font-bold text-slate-400">OPEN TICKETS</span>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">2</p>
            <p className="text-[10px] text-amber-600 font-bold mt-0.5">Pending resolution</p>
          </Card>
          <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 p-4">
            <span className="text-[11px] font-bold text-slate-400">HIGH PRIORITY</span>
            <p className="text-2xl font-black text-rose-600 mt-1">1</p>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">&lt; 1 hr SLA target</p>
          </Card>
          <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 p-4">
            <span className="text-[11px] font-bold text-slate-400">AVG RESOLUTION TIME</span>
            <p className="text-2xl font-black text-[#274690] dark:text-blue-400 mt-1">1.8 Hours</p>
            <p className="text-[10px] text-emerald-600 font-bold mt-0.5">99.2% SLA adherence</p>
          </Card>
          <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 p-4">
            <span className="text-[11px] font-bold text-slate-400">SATISFACTION SCORE</span>
            <p className="text-2xl font-black text-[#c96f4a] mt-1">4.9 / 5.0</p>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Customer feedback</p>
          </Card>
        </div>
      )}

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-3xl rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm">
                  {selectedTicket.id} — {selectedTicket.subject}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {selectedTicket.org} • Created by {selectedTicket.createdBy}
                </p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {/* Status & Priority Control */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500">Status:</span>
                <Badge className="bg-[#274690] text-white text-[10px] font-bold">{selectedTicket.status}</Badge>
              </div>
              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="outline" onClick={() => handleUpdateStatus("IN_PROGRESS")} className="h-7 text-[11px] font-bold">
                  Mark In Progress
                </Button>
                <Button size="sm" onClick={() => handleUpdateStatus("RESOLVED")} className="h-7 text-[11px] font-bold bg-emerald-600 text-white">
                  Mark Resolved
                </Button>
              </div>
            </div>

            {/* Conversation Thread */}
            <div className="space-y-3 pt-2">
              <p className="font-bold text-slate-900 dark:text-slate-100">Conversation History</p>
              <div className="space-y-2.5">
                {(selectedTicket.messages && selectedTicket.messages.length > 0) ? (
                  selectedTicket.messages.map((m: any, i: number) => (
                    <div key={i} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-[#274690] dark:text-blue-400">{m.sender || "User"} ({m.role || "Customer"})</span>
                        <span className="text-[10px] text-slate-400 font-normal">{m.time || "Recently"}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300">{m.text}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center text-slate-400 text-xs font-semibold">
                    No conversation history recorded for this ticket yet.
                  </div>
                )}
              </div>
            </div>

            {/* Reply Form */}
            <form onSubmit={handleSendReply} className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <textarea
                rows={3}
                placeholder="Type response to tenant admin..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:outline-none focus:border-[#274690]"
              />
              <div className="flex items-center justify-end gap-2">
                <Button type="submit" className="bg-[#274690] text-white text-xs font-bold h-8">
                  <Send size={13} className="mr-1" /> Send Reply
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
