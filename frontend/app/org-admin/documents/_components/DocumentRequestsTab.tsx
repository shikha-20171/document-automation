"use client";

import { useState } from "react";
import { FileQuestion, Plus, Clock, CheckCircle2, AlertCircle, User, Calendar, Tag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface DocRequest {
  id: string;
  requestedFrom: string;
  documentName: string;
  dueDate: string;
  priority: "High" | "Medium" | "Low";
  status: "Pending" | "Submitted" | "Under Review" | "Completed" | "Rejected";
  purpose: string;
}

const initialRequests: DocRequest[] = [
  { id: "1", requestedFrom: "Employee (Rajesh Kumar)", documentName: "Joining Form & Id Proof", dueDate: "15 Aug 2026", priority: "High", status: "Pending", purpose: "HR Compliance & Verification" },
  { id: "2", requestedFrom: "Finance Manager (Amit Patel)", documentName: "Q2 Tax Receipt Statements", dueDate: "20 Aug 2026", priority: "Medium", status: "Submitted", purpose: "Internal Quarterly Audit" },
  { id: "3", requestedFrom: "Legal Advisor (Priya Sharma)", documentName: "Vendor NDA Executed Copy", dueDate: "12 Aug 2026", priority: "High", status: "Under Review", purpose: "Vendor Onboarding" },
  { id: "4", requestedFrom: "Employee (Pooja Verma)", documentName: "Relieving Letter & Payslips", dueDate: "05 Aug 2026", priority: "Low", status: "Completed", purpose: "Background Verification" },
];

export default function DocumentRequestsTab() {
  const [requests, setRequests] = useState<DocRequest[]>(initialRequests);
  const [showModal, setShowModal] = useState(false);
  const [newFrom, setNewFrom] = useState("");
  const [newDoc, setNewDoc] = useState("");
  const [newDueDate, setNewDueDate] = useState("15 Aug 2026");
  const [newPriority, setNewPriority] = useState<"High" | "Medium" | "Low">("High");
  const [newPurpose, setNewPurpose] = useState("");

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFrom || !newDoc) return;
    const req: DocRequest = {
      id: Date.now().toString(),
      requestedFrom: newFrom,
      documentName: newDoc,
      dueDate: newDueDate,
      priority: newPriority,
      status: "Pending",
      purpose: newPurpose || "Official Document Request",
    };
    setRequests([req, ...requests]);
    setShowModal(false);
    setNewFrom("");
    setNewDoc("");
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileQuestion size={22} className="text-[#274690]" /> Document Requests
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Request official documents, forms, or certificates from employees, managers, and external partners.
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-2xl text-xs px-4 py-2.5 shadow-md flex items-center gap-2">
          <Plus size={16} /> + New Document Request
        </Button>
      </div>

      {/* Request Queue Table */}
      <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Requested From</th>
                <th className="py-3.5 px-4">Document</th>
                <th className="py-3.5 px-4">Purpose</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <User size={15} className="text-[#274690]" />
                    {r.requestedFrom}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">
                    {r.documentName}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                    {r.purpose}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-semibold flex items-center gap-1">
                    <Calendar size={13} className="text-slate-400" />
                    {r.dueDate}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge className={`text-[10px] font-bold ${
                      r.priority === "High" ? "bg-rose-100 text-rose-800" :
                      r.priority === "Medium" ? "bg-amber-100 text-amber-800" :
                      "bg-slate-100 text-slate-700"
                    }`}>
                      {r.priority}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge className={`text-[10px] font-bold ${
                      r.status === "Pending" ? "bg-amber-100 text-amber-800" :
                      r.status === "Submitted" ? "bg-blue-100 text-blue-800" :
                      r.status === "Under Review" ? "bg-purple-100 text-purple-800" :
                      r.status === "Completed" ? "bg-emerald-100 text-emerald-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {r.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Button size="sm" variant="outline" className="rounded-xl text-xs font-bold text-[#274690]">
                      Track
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* New Request Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <FileQuestion size={18} className="text-[#274690]" /> New Document Request
              </h3>
              <button onClick={() => setShowModal(false)} className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Requested From (Employee / Manager)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Employee (Rajesh Kumar)"
                  value={newFrom}
                  onChange={(e) => setNewFrom(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#274690] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Document Required</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Joining Form / Tax Invoice / Medical Certificate"
                  value={newDoc}
                  onChange={(e) => setNewDoc(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#274690] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Due Date</label>
                <input
                  type="text"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#274690] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:outline-none"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Purpose / Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. HR onboarding compliance check"
                  value={newPurpose}
                  onChange={(e) => setNewPurpose(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#274690] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" onClick={() => setShowModal(false)} variant="outline" className="rounded-xl font-bold">
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-xl">
                  Send Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
