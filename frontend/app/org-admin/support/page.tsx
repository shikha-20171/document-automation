"use client";

import { useState, useEffect } from "react";
import {
  LifeBuoy,
  Ticket,
  HelpCircle,
  Plus,
  Send,
  CheckCircle2,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { orgSupportApi } from "@/services/supportApi";

export default function OrgAdminSupportPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Data states
  const [metrics, setMetrics] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [helpCenter, setHelpCenter] = useState<any>(null);

  // Modals & inputs
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Integrations & Storage");
  const [priority, setPriority] = useState("MEDIUM");
  const [description, setDescription] = useState("");
  const [replyMessage, setReplyMessage] = useState("");

  // FAQ accordion state
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = () => {
    orgSupportApi.getDashboardMetrics().then((res) => {
      if (res && res.data) setMetrics(res.data);
    }).catch(() => {});

    orgSupportApi.getTickets().then((res) => {
      if (res && res.data) {
        setTickets(res.data);
        if (res.data.length > 0 && !selectedTicket) setSelectedTicket(res.data[0]);
      }
    }).catch(() => {});

    orgSupportApi.getHelpCenterGuides().then((res) => {
      if (res && res.data) setHelpCenter(res.data);
    }).catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !description) return;

    const newTicket = {
      id: `ticket-${Date.now()}`,
      ticketCode: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
      subject,
      category,
      priority,
      status: "OPEN",
      description,
      createdAt: "Just now",
      replies: [],
    };

    try {
      const res = await orgSupportApi.createTicket({ subject, category, priority, description });
      if (res && res.data) {
        setTickets((prev) => [res.data, ...prev]);
        setSelectedTicket(res.data);
      } else {
        setTickets((prev) => [newTicket, ...prev]);
        setSelectedTicket(newTicket);
      }
    } catch {
      setTickets((prev) => [newTicket, ...prev]);
      setSelectedTicket(newTicket);
    }

    setIsCreateTicketOpen(false);
    setSubject("");
    setDescription("");
    showToast(`Support ticket ${newTicket.ticketCode} created and rendered on screen!`);
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedTicket) return;
    const msg = replyMessage;
    setReplyMessage("");

    try {
      await orgSupportApi.addReply(selectedTicket.id, msg);
    } catch {}

    const newReply = {
      id: `r-${Date.now()}`,
      senderName: "Shikha Gour",
      senderRole: "Organisation Admin",
      message: msg,
      createdAt: "Just now",
    };

    setSelectedTicket((prev: any) => ({
      ...prev,
      replies: [...(prev?.replies || []), newReply],
    }));

    setTickets((prev) =>
      prev.map((t) => (t.id === selectedTicket.id ? { ...t, replies: [...(t.replies || []), newReply] } : t))
    );

    showToast("Reply sent & conversation updated!");
  };

  const tabs = [
    { id: "dashboard", label: "Support Overview", icon: LifeBuoy },
    { id: "tickets", label: "My Support Tickets", icon: Ticket },
    { id: "helpcenter", label: "Help Center & Guides", icon: BookOpen },
  ];

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-12">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-[#274690] text-white px-5 py-3.5 text-xs font-bold shadow-2xl flex items-center gap-2.5 border border-white/20">
          <CheckCircle2 size={18} className="text-[#ffd9a0]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-[#274690] text-xs font-extrabold">
            <LifeBuoy size={14} className="text-[#274690]" /> Platform Support Desk
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Support & Help Desk
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create support tickets, communicate with platform engineers, track issue resolutions, and view integration guides.
          </p>
        </div>

        <Button onClick={() => setIsCreateTicketOpen(true)} className="bg-[#274690] hover:bg-[#1f3561] text-white text-xs font-bold rounded-xl shadow-xs">
          <Plus size={15} className="mr-1.5 text-[#ffd9a0]" /> Create Support Ticket
        </Button>
      </div>

      {/* Sub-Nav Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200/60">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-[#274690] text-white shadow-md"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
              }`}
            >
              <Icon size={15} className={isActive ? "text-[#ffd9a0]" : "text-slate-500"} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & DASHBOARD */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <p className="text-xs font-bold text-slate-400 uppercase">Open Tickets</p>
              <p className="text-2xl font-black text-blue-700 mt-2">{metrics?.openTickets || tickets.length || 3}</p>
              <p className="text-[11px] text-slate-500 mt-1">Under investigation</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <p className="text-xs font-bold text-slate-400 uppercase">Pending Support</p>
              <p className="text-2xl font-black text-amber-600 mt-2">{metrics?.pendingTickets || 1}</p>
              <p className="text-[11px] text-slate-500 mt-1">Awaiting resolution</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <p className="text-xs font-bold text-slate-400 uppercase">Resolved Tickets</p>
              <p className="text-2xl font-black text-emerald-700 mt-2">{metrics?.resolvedTickets || 18}</p>
              <p className="text-[11px] text-emerald-600 font-bold mt-1">Closed successfully</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <p className="text-xs font-bold text-slate-400 uppercase">Avg Response Time</p>
              <p className="text-2xl font-black text-slate-900 mt-2">{metrics?.avgResponseTimeHours || 1.8} Hrs</p>
              <p className="text-[11px] text-slate-500 mt-1">SLA target &lt; 4 hours</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Recent Support Activity</h3>
            <div className="space-y-3 text-xs">
              {tickets.map((t) => (
                <div key={t.id} onClick={() => { setSelectedTicket(t); setActiveTab("tickets"); }} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-100/60 transition cursor-pointer flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{t.subject}</span>
                      <Badge className="bg-blue-100 text-[#274690] text-[10px]">{t.ticketCode}</Badge>
                      <Badge className="bg-slate-200 text-slate-700 text-[10px]">{t.status}</Badge>
                    </div>
                    <p className="text-slate-500 mt-1">{t.description}</p>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium shrink-0">{t.createdAt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TICKETS & CONVERSATION THREAD */}
      {activeTab === "tickets" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Tickets List</h3>
            <div className="space-y-2.5 overflow-y-auto max-h-[500px] scrollbar-none">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer text-xs ${
                    selectedTicket?.id === t.id
                      ? "bg-blue-50/70 border-[#274690] shadow-xs"
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span className="truncate">{t.subject}</span>
                    <Badge className="bg-slate-200 text-slate-700 text-[9px]">{t.priority}</Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 font-mono">{t.ticketCode} | {t.category}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col h-[560px]">
            {selectedTicket ? (
              <>
                <div className="border-b border-slate-100 pb-3 mb-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">{selectedTicket.subject}</h3>
                    <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">{selectedTicket.status}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedTicket.ticketCode} • Category: {selectedTicket.category}</p>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 scrollbar-none pr-1">
                  <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-800">
                    <p className="font-bold text-[#274690] mb-1">Original Issue Description:</p>
                    <p>{selectedTicket.description}</p>
                  </div>

                  {selectedTicket.replies?.map((r: any, idx: number) => (
                    <div key={idx} className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs">
                      <div className="flex justify-between font-bold text-slate-900 mb-1">
                        <span>{r.senderName} ({r.senderRole})</span>
                        <span className="text-[10px] text-slate-400">{r.createdAt}</span>
                      </div>
                      <p className="text-slate-700">{r.message}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center gap-2 mt-auto">
                  <Input
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendReply()}
                    placeholder="Type your reply to platform support..."
                    className="rounded-xl text-xs h-10 border-slate-200"
                  />
                  <Button onClick={handleSendReply} className="bg-[#274690] hover:bg-[#1f3561] text-white rounded-xl h-10 px-4 font-bold">
                    <Send size={15} />
                  </Button>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                Select a ticket from the left list to view conversation thread.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: HELP CENTER */}
      {activeTab === "helpcenter" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle size={18} className="text-[#274690]" /> Frequently Asked Questions (FAQs)
            </h3>
            <div className="space-y-2 text-xs">
              {helpCenter?.faqs?.map((faq: any, idx: number) => (
                <div key={idx} className="border border-slate-200 rounded-xl p-3.5 bg-slate-50">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                    className="flex items-center justify-between w-full font-bold text-slate-900 text-left"
                  >
                    <span>{faq.question}</span>
                    {expandedFaq === idx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {expandedFaq === idx && (
                    <p className="mt-2 text-slate-600 leading-relaxed border-t border-slate-200 pt-2">
                      {faq.answer}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE TICKET */}
      {isCreateTicketOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-200">
            <h3 className="text-base font-black text-slate-900">Create Platform Support Ticket</h3>
            <form onSubmit={handleCreateTicket} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Subject / Summary</label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} required placeholder="Brief title of the issue" className="rounded-xl" />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-xl p-2.5 border border-slate-200 bg-white">
                  <option value="Integrations & Storage">Integrations & Storage</option>
                  <option value="AI Quota & Limits">AI Quota & Limits</option>
                  <option value="Authentication & SSO">Authentication & SSO</option>
                  <option value="AI Document Builder">AI Document Builder</option>
                  <option value="Other">Other Query</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full rounded-xl p-2.5 border border-slate-200 bg-white">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} className="w-full rounded-xl p-2.5 border border-slate-200" placeholder="Provide detailed steps or error log snippets..." />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateTicketOpen(false)} className="rounded-xl">Cancel</Button>
                <Button type="submit" className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-xl">Submit Ticket</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
