"use client";

import { useState } from "react";
import { Share2, Users, Building, Lock, Eye, Download, Edit3, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function SharedDocumentsTab() {
  const [activeTab, setActiveTab] = useState<"with-me" | "by-me" | "dept" | "team">("with-me");

  const sharedWithMe = [
    { name: "Q3_Financial_Audit_Report.xlsx", by: "Amit Patel (Finance)", perm: ["View", "Download"], date: "09 Aug 2026" },
    { name: "Master_Service_Agreement_2026.docx", by: "Priya Sharma (Legal)", perm: ["View", "Edit", "Download"], date: "09 Aug 2026" },
  ];

  const sharedByMe = [
    { name: "Company_Security_Policy_v4.pdf", to: "All Staff (Organisation)", perm: ["View"], date: "08 Aug 2026" },
    { name: "Employment_Agreement_Rajesh.pdf", to: "Rajesh Kumar (Employee)", perm: ["View", "Download"], date: "10 Aug 2026" },
  ];

  const departmentShared = [
    { name: "HR_Payroll_Structure_2026.pdf", dept: "HR Department", perm: ["View", "Edit", "Share"], date: "05 Aug 2026" },
    { name: "Engineering_Architecture_Design.pdf", dept: "Engineering", perm: ["View", "Download"], date: "02 Aug 2026" },
  ];

  const teamShared = [
    { name: "Quarterly_OKRs_Leadership.docx", team: "Executive Committee", perm: ["View", "Edit", "Download", "Share"], date: "01 Aug 2026" },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Share2 size={22} className="text-[#274690]" /> Shared Documents
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Documents shared across your organisation with explicit view, edit, download, and re-sharing permissions.
          </p>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("with-me")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
            activeTab === "with-me" ? "bg-[#274690] text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Shared with Me ({sharedWithMe.length})
        </button>

        <button
          onClick={() => setActiveTab("by-me")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
            activeTab === "by-me" ? "bg-[#274690] text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Shared by Me ({sharedByMe.length})
        </button>

        <button
          onClick={() => setActiveTab("dept")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
            activeTab === "dept" ? "bg-[#274690] text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Department Shared ({departmentShared.length})
        </button>

        <button
          onClick={() => setActiveTab("team")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
            activeTab === "team" ? "bg-[#274690] text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Team Shared ({teamShared.length})
        </button>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeTab === "with-me" && sharedWithMe.map((doc, idx) => (
          <Card key={idx} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">{doc.name}</h4>
                <p className="text-[11px] text-slate-500">Shared by: <strong>{doc.by}</strong></p>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold">{doc.date}</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Granted Permissions:</p>
              <div className="flex gap-1.5 flex-wrap">
                {doc.perm.map(p => (
                  <Badge key={p} className="bg-purple-100 text-purple-800 text-[10px] font-bold">{p}</Badge>
                ))}
              </div>
            </div>
          </Card>
        ))}

        {activeTab === "by-me" && sharedByMe.map((doc, idx) => (
          <Card key={idx} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">{doc.name}</h4>
                <p className="text-[11px] text-slate-500">Shared to: <strong>{doc.to}</strong></p>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold">{doc.date}</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Permissions:</p>
              <div className="flex gap-1.5 flex-wrap">
                {doc.perm.map(p => (
                  <Badge key={p} className="bg-blue-100 text-blue-800 text-[10px] font-bold">{p}</Badge>
                ))}
              </div>
            </div>
          </Card>
        ))}

        {activeTab === "dept" && departmentShared.map((doc, idx) => (
          <Card key={idx} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">{doc.name}</h4>
                <p className="text-[11px] text-slate-500">Department: <strong>{doc.dept}</strong></p>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold">{doc.date}</span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {doc.perm.map(p => (
                <Badge key={p} className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">{p}</Badge>
              ))}
            </div>
          </Card>
        ))}

        {activeTab === "team" && teamShared.map((doc, idx) => (
          <Card key={idx} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">{doc.name}</h4>
                <p className="text-[11px] text-slate-500">Team: <strong>{doc.team}</strong></p>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold">{doc.date}</span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {doc.perm.map(p => (
                <Badge key={p} className="bg-indigo-100 text-indigo-800 text-[10px] font-bold">{p}</Badge>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
