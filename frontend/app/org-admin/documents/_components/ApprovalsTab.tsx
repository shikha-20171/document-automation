"use client";

import { useState } from "react";
import { CheckSquare, CheckCircle2, XCircle, RotateCcw, Clock, FileText, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface ApprovalItem {
  id: string;
  documentName: string;
  submittedBy: string;
  approver: string;
  submittedDate: string;
  status: "Pending" | "Approved" | "Rejected" | "Returned";
  category: string;
  notes: string;
}

const initialApprovals: ApprovalItem[] = [
  { id: "1", documentName: "Company_Policy_2026.pdf", submittedBy: "HR Manager (Priya Sharma)", approver: "Organisation Admin (Shikha Gour)", submittedDate: "10 Aug 2026", status: "Pending", category: "Policies", notes: "Annual updated HR employee code of conduct." },
  { id: "2", documentName: "Vendor_Payment_Approval_INV-889.pdf", submittedBy: "Finance Lead (Amit Patel)", approver: "Organisation Admin (Shikha Gour)", submittedDate: "09 Aug 2026", status: "Pending", category: "Invoices", notes: "₹2,50,000 vendor disbursement for Cloud Servers." },
  { id: "3", documentName: "Client_NDA_TechCorp.pdf", submittedBy: "Sales Director (Rajesh Kumar)", approver: "Organisation Admin (Shikha Gour)", submittedDate: "09 Aug 2026", status: "Pending", category: "Legal", notes: "Standard NDA with custom IP indemnity clause." },
  { id: "4", documentName: "Q2_Tax_Filing_Summary.pdf", submittedBy: "Finance Lead (Amit Patel)", approver: "Organisation Admin (Shikha Gour)", submittedDate: "05 Aug 2026", status: "Approved", category: "Reports", notes: "Signed and archived." },
  { id: "5", documentName: "Unapproved_Expense_Claim.xlsx", submittedBy: "Sales Manager (Vikas)", approver: "Organisation Admin (Shikha Gour)", submittedDate: "03 Aug 2026", status: "Rejected", category: "Finance", notes: "Missing receipts for travel." },
];

export default function ApprovalsTab() {
  const [approvals, setApprovals] = useState<ApprovalItem[]>(initialApprovals);
  const [activeTab, setActiveTab] = useState<"Pending" | "Approved" | "Rejected" | "Returned">("Pending");
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const handleUpdateStatus = (id: string, status: "Approved" | "Rejected" | "Returned") => {
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    setActionFeedback(`Document marked as ${status}.`);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const filtered = approvals.filter(a => a.status === activeTab);

  return (
    <div className="space-y-6 font-sans">
      {/* Feedback Toast */}
      {actionFeedback && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CheckSquare size={22} className="text-[#274690]" /> Document Approvals
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review and sign off on company policies, legal agreements, vendor payments, and official documents.
          </p>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {(["Pending", "Approved", "Rejected", "Returned"] as const).map((st) => (
          <button
            key={st}
            onClick={() => setActiveTab(st)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
              activeTab === st
                ? st === "Pending" ? "bg-amber-600 text-white shadow-xs" :
                  st === "Approved" ? "bg-emerald-600 text-white shadow-xs" :
                  st === "Rejected" ? "bg-rose-600 text-white shadow-xs" :
                  "bg-purple-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {st} ({approvals.filter(a => a.status === st).length})
          </button>
        ))}
      </div>

      {/* Queue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-2 text-center py-10 bg-white rounded-2xl border border-slate-200/80 text-slate-400 font-medium text-xs">
            No documents in the {activeTab} approval queue.
          </div>
        ) : (
          filtered.map((item) => (
            <Card key={item.id} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-extrabold">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">{item.documentName}</h4>
                    <span className="text-[11px] font-semibold text-slate-400">Category: {item.category}</span>
                  </div>
                </div>
                <Badge className={`text-[10px] font-bold ${
                  item.status === "Pending" ? "bg-amber-100 text-amber-800" :
                  item.status === "Approved" ? "bg-emerald-100 text-emerald-800" :
                  item.status === "Rejected" ? "bg-rose-100 text-rose-800" :
                  "bg-purple-100 text-purple-800"
                }`}>
                  {item.status}
                </Badge>
              </div>

              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                <p className="text-slate-700 font-medium"><strong>Notes:</strong> {item.notes}</p>
                <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
                  <span>Submitted by: <strong>{item.submittedBy}</strong></span>
                  <span>{item.submittedDate}</span>
                </div>
              </div>

              {/* Action Buttons */}
              {item.status === "Pending" && (
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                  <Button 
                    onClick={() => handleUpdateStatus(item.id, "Returned")}
                    size="sm" 
                    variant="outline" 
                    className="text-purple-700 border-purple-200 hover:bg-purple-50 text-xs font-bold rounded-xl h-8"
                  >
                    <RotateCcw size={13} className="mr-1" /> Return
                  </Button>
                  <Button 
                    onClick={() => handleUpdateStatus(item.id, "Rejected")}
                    size="sm" 
                    variant="outline" 
                    className="text-rose-700 border-rose-200 hover:bg-rose-50 text-xs font-bold rounded-xl h-8"
                  >
                    <XCircle size={13} className="mr-1" /> Reject
                  </Button>
                  <Button 
                    onClick={() => handleUpdateStatus(item.id, "Approved")}
                    size="sm" 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl h-8 px-4"
                  >
                    <CheckCircle2 size={13} className="mr-1" /> Approve
                  </Button>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
