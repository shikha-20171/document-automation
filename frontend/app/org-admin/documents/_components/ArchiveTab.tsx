"use client";

import { useState } from "react";
import { Archive, RotateCcw, Trash2, Calendar, ShieldAlert, FileText, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface ArchivedDoc {
  id: string;
  name: string;
  category: string;
  archivedDate: string;
  retentionPolicy: "7 Years (Tax)" | "5 Years (HR)" | "3 Years (Contracts)" | "Custom";
  reason: string;
  status: "Archived" | "Expired" | "Retention Expired" | "Deleted / Recoverable";
}

const initialArchive: ArchivedDoc[] = [
  { id: "1", name: "2019_Tax_Return_Filing_Master.pdf", category: "Finance", archivedDate: "15 Mar 2024", retentionPolicy: "7 Years (Tax)", reason: "Mandatory tax retention period", status: "Archived" },
  { id: "2", name: "Former_Employee_Record_2020.pdf", category: "HR", archivedDate: "10 Jan 2025", retentionPolicy: "5 Years (HR)", reason: "Former staff record archival", status: "Archived" },
  { id: "3", name: "Vendor_Lease_Agreement_2021.pdf", category: "Contracts", archivedDate: "01 Aug 2025", retentionPolicy: "3 Years (Contracts)", reason: "Contract term finished", status: "Expired" },
  { id: "4", name: "Legacy_Marketing_Deck_2018.pptx", category: "General", archivedDate: "05 Jun 2023", retentionPolicy: "Custom", reason: "Retention period reached", status: "Retention Expired" },
  { id: "5", name: "Draft_Proposal_Unused.docx", category: "Sales", archivedDate: "10 Aug 2026", retentionPolicy: "Custom", reason: "User soft-deleted", status: "Deleted / Recoverable" },
];

export default function ArchiveTab() {
  const [archiveList, setArchiveList] = useState<ArchivedDoc[]>(initialArchive);
  const [activeTab, setActiveTab] = useState<ArchivedDoc["status"]>("Archived");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleRestore = (id: string, name: string) => {
    setArchiveList(prev => prev.filter(a => a.id !== id));
    showToast(`Restored "${name}" back to active All Documents.`);
  };

  const handlePermanentDelete = (id: string, name: string) => {
    setArchiveList(prev => prev.filter(a => a.id !== id));
    showToast(`Permanently purged "${name}".`);
  };

  const filtered = archiveList.filter(a => a.status === activeTab);

  return (
    <div className="space-y-6 font-sans">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Archive size={22} className="text-[#274690]" /> Document Archive & Retention
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage long-term compliant document archives, expired contracts, and trash recovery according to retention policies.
          </p>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 flex-wrap border-b border-slate-200 pb-2">
        {(["Archived", "Expired", "Retention Expired", "Deleted / Recoverable"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
              activeTab === tab ? "bg-[#274690] text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab} ({archiveList.filter(a => a.status === tab).length})
          </button>
        ))}
      </div>

      {/* Archive Table */}
      <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Document Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Archived Date</th>
                <th className="py-3.5 px-4">Retention Policy</th>
                <th className="py-3.5 px-4">Reason</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    No documents in {activeTab}.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <FileText size={15} className="text-slate-400" />
                      {item.name}
                    </td>
                    <td className="py-3.5 px-4">{item.category}</td>
                    <td className="py-3.5 px-4 text-slate-500">{item.archivedDate}</td>
                    <td className="py-3.5 px-4">
                      <Badge className="bg-purple-100 text-purple-800 text-[10px] font-bold">
                        {item.retentionPolicy}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">{item.reason}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          onClick={() => handleRestore(item.id, item.name)} 
                          size="sm" 
                          variant="outline" 
                          className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-xs font-bold rounded-xl h-8"
                        >
                          <RotateCcw size={13} className="mr-1" /> Restore
                        </Button>
                        <Button 
                          onClick={() => handlePermanentDelete(item.id, item.name)} 
                          size="sm" 
                          variant="ghost" 
                          className="text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-xl h-8"
                        >
                          <Trash2 size={13} className="mr-1" /> Purge
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
