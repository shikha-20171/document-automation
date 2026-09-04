"use client";

import { useEffect, useState } from "react";
import {
  HelpCircle,
  Search,
  BookOpen,
  MessageSquare,
  LifeBuoy,
  Plus,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Send,
  X,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supportApi } from "@/services/supportApi";

export default function TeamLeaderSupportPage() {
  const [loading, setLoading] = useState(true);
  const [supportData, setSupportData] = useState<any>(null);
  const [error, setError] = useState("");
  const [successToast, setSuccessToast] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);

  // Ticket Modal
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("AI Tools & Processing");
  const [priority, setPriority] = useState("MEDIUM");
  const [description, setDescription] = useState("");

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 4000);
  };

  const fetchSupport = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await supportApi.getSupportData();
      if (res?.data) {
        setSupportData(res.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load support data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSupport();
  }, []);

  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;
    try {
      const res = await supportApi.createTeamLeaderTicket({
        subject: subject.trim(),
        category,
        priority,
        description: description.trim(),
      });
      showToast(res?.message || "Support ticket created!");
      setIsCreateTicketOpen(false);
      setSubject("");
      setDescription("");
      void fetchSupport();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to raise ticket.");
    }
  };

  const faqs = supportData?.faqs || [];
  const guides = supportData?.guides || [];
  const tickets = supportData?.tickets || [];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-20 font-sans text-slate-800">
      {/* 1. HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-[#274690] sm:text-3xl">Help & Support</h1>
            <Badge className="bg-[#c96f4a]/10 text-[#c96f4a] border-[#c96f4a]/30 text-xs font-black px-2.5 py-0.5">
              Knowledge Base & Tickets
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-semibold">
            Guides, FAQs, and dedicated support ticket tracking for Team Leaders
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            onClick={() => setIsCreateTicketOpen(true)}
            className="h-10 rounded-xl bg-[#274690] px-4 text-xs font-black text-white hover:bg-[#1f3561] shadow-sm gap-1.5"
          >
            <Plus size={15} /> Raise Support Ticket
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {successToast && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 shadow-sm animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-800 shadow-sm animate-in fade-in">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. USER GUIDES CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {guides.map((g: any, i: number) => (
          <div key={i} className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-2 hover:border-[#c96f4a]/40 transition">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#274690]/10 text-[#274690] font-bold">
              <BookOpen size={16} />
            </div>
            <h4 className="text-xs font-black text-slate-900 leading-snug">{g.title}</h4>
            <p className="text-[10px] text-slate-400 font-bold">{g.category} • {g.duration}</p>
          </div>
        ))}
      </div>

      {/* 3. FAQS ACCORDION */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-[#274690] flex items-center gap-2">
          <HelpCircle size={16} className="text-[#c96f4a]" /> Frequently Asked Questions
        </h3>

        <div className="space-y-2.5">
          {faqs.map((faq: any, idx: number) => {
            const isOpen = expandedFaqIndex === idx;
            return (
              <div key={idx} className="rounded-2xl border border-slate-100 bg-slate-50/60 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedFaqIndex(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between p-4 text-left text-xs font-black text-slate-900"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp size={16} className="text-[#c96f4a] shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs font-medium text-slate-600 border-t border-slate-100 pt-3 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. MY SUPPORT TICKETS TRACKER */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-[#274690] flex items-center gap-2">
          <LifeBuoy size={16} className="text-[#c96f4a]" /> My Raised Tickets
        </h3>

        <div className="space-y-3">
          {tickets.map((t: any) => (
            <div key={t.id} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-black text-[#274690] text-xs">{t.id}</span>
                  <h4 className="text-xs font-extrabold text-slate-900">{t.subject}</h4>
                </div>
                <Badge
                  className={`text-[9px] font-black ${
                    t.status === "RESOLVED"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-[#274690]/10 text-[#274690] border-[#274690]/20"
                  }`}
                >
                  {t.status}
                </Badge>
              </div>

              <p className="text-xs text-slate-600">{t.description}</p>

              {t.responses?.map((r: any, idx: number) => (
                <div key={idx} className="rounded-xl bg-white p-3 border border-slate-200 text-[11px] space-y-1">
                  <span className="font-bold text-[#274690]">{r.by} ({r.date}):</span>
                  <p className="text-slate-700 font-medium">{r.text}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* 5. RAISE TICKET MODAL */}
      {isCreateTicketOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-[#274690]/20 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-[#274690]">Raise Support Ticket</h3>
              <button type="button" onClick={() => setIsCreateTicketOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTicketSubmit} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-black uppercase text-slate-600">Subject *</label>
                <Input
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Discrepancy in table extraction"
                  className="mt-1 h-10 rounded-xl text-xs font-semibold focus:border-[#274690]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-600">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold"
                  >
                    <option value="AI Tools & Processing">AI Tools & Processing</option>
                    <option value="Document Approvals">Document Approvals</option>
                    <option value="Team Task Management">Team Task Management</option>
                    <option value="Storage & Quota">Storage & Quota</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-600">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-600">Issue Description *</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what happened and steps to reproduce..."
                  className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-xs font-semibold focus:border-[#274690] focus:outline-none"
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsCreateTicketOpen(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button size="sm" type="submit" className="rounded-xl bg-[#274690] text-xs font-black text-white hover:bg-[#1f3561]">
                  <Send size={13} className="mr-1.5" /> Submit Ticket
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
