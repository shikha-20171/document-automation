"use client";

import { 
  FileText, 
  Clock, 
  Upload, 
  Share2, 
  ScanText, 
  AlertTriangle, 
  HardDrive, 
  ArrowUpRight,
  User,
  Calendar,
  FileCheck
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { useState, useEffect } from "react";
import { api } from "@/services/api";

interface DashboardTabProps {
  onNavigateTab: (tab: string) => void;
  onOpenUpload: () => void;
  onOpenCreate: () => void;
}

export default function DashboardTab({ onNavigateTab, onOpenUpload, onOpenCreate }: DashboardTabProps) {
  const [recentDocs, setRecentDocs] = useState<any[]>([
    { id: "1", name: "Employment_Agreement_Rajesh.pdf", cat: "HR", owner: "Rajesh Kumar", dept: "Engineering", status: "Active", date: "10 Aug 2026, 02:30 PM" },
    { id: "2", name: "Vendor_Invoice_TechCorp_Q3.pdf", cat: "Finance", owner: "Shikha Gour", dept: "Finance", status: "Active", date: "10 Aug 2026, 01:15 PM" },
    { id: "3", name: "Master_Service_Agreement_2026.docx", cat: "Legal", owner: "Priya Sharma", dept: "Legal", status: "Draft", date: "09 Aug 2026, 05:45 PM" },
    { id: "4", name: "Q3_Financial_Audit_Report.xlsx", cat: "Reports", owner: "Amit Patel", dept: "Operations", status: "Active", date: "09 Aug 2026, 11:20 AM" },
    { id: "5", name: "Company_Security_Policy_v4.pdf", cat: "Policies", owner: "Shikha Gour", dept: "HR", status: "Active", date: "08 Aug 2026, 04:10 PM" },
  ]);

  const [totalCount, setTotalCount] = useState<string>("1,482");

  useEffect(() => {
    const fetchRecent = async () => {
      let combined: any[] = [];
      if (typeof window !== "undefined") {
        try {
          const localSaved = JSON.parse(localStorage.getItem("org_saved_documents") || "[]");
          if (Array.isArray(localSaved) && localSaved.length > 0) {
            combined = localSaved.map((d) => ({
              id: d.id,
              name: d.name,
              cat: d.category || "General",
              owner: d.owner || "Organisation Admin",
              dept: d.department || "General",
              status: d.status || "Active",
              date: d.updated || "Just now",
            }));
          }
        } catch {}
      }

      try {
        const res = await api.get("/org-admin/documents");
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const dbFormatted = res.data.data.map((d: any) => ({
            id: d.id,
            name: d.name,
            cat: d.category || "General",
            owner: d.owner || "Organisation Admin",
            dept: d.department || "General",
            status: d.status || "Active",
            date: d.updated || "Recent",
          }));
          const existingIds = new Set(combined.map((c) => c.id));
          const toAdd = dbFormatted.filter((d: any) => !existingIds.has(d.id));
          combined = [...combined, ...toAdd];
          if (res.data.stats?.totalDocuments) {
            setTotalCount(String(res.data.stats.totalDocuments));
          }
        }
      } catch {}

      if (combined.length > 0) {
        setRecentDocs(combined.slice(0, 8));
      }
    };

    fetchRecent();
  }, []);

  const kpis = [
    { title: "Total Documents", count: totalCount, change: "+12% this month", icon: FileText, tab: "all-documents" },
    { title: "Uploaded Today", count: "24", change: "Active uploads", icon: Upload, tab: "all-documents" },
    { title: "Shared Documents", count: "312", change: "Internal & team", icon: Share2, tab: "shared-documents" },
    { title: "Storage Used", count: "42.8 GB", change: "42% of 100 GB", icon: HardDrive, tab: "all-documents" },
  ];

  const activities = [
    { user: "Rajesh Kumar", action: "Uploaded", doc: "Employment Contract.pdf", time: "10 Aug, 2:30 PM" },
    { user: "Shikha Gour", action: "Created", doc: "Vendor_Invoice_TechCorp_Q3.pdf", time: "10 Aug, 1:20 PM" },
    { user: "Priya Sharma", action: "Shared", doc: "Joining Documents (Employee Form)", time: "10 Aug, 11:00 AM" },
    { user: "Amit Patel", action: "Downloaded", doc: "Q3_Financial_Audit_Report.xlsx", time: "10 Aug, 10:45 AM" },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#1f3561] via-[#274690] to-[#1e3a5f] p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold tracking-wide text-[#ffd9a0]">
            <FileCheck size={14} /> Organisation Document Overview
          </span>
          <h2 className="text-2xl font-black tracking-tight mt-2 text-white">
            Document Management Dashboard
          </h2>
          <p className="text-xs text-white/80 mt-1 max-w-xl">
            Real-time insights into your organisation&apos;s storage, document library, shared access permissions, and audit logs.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button onClick={onOpenCreate} className="bg-[#ffd9a0] text-[#1f3561] hover:bg-amber-300 font-bold rounded-2xl text-xs px-4 py-2.5 shadow-md">
            + Create Document
          </Button>
          <Button onClick={onOpenUpload} className="bg-white/20 hover:bg-white/30 text-white font-bold rounded-2xl text-xs px-4 py-2.5 border border-white/30">
            ↑ Upload Document
          </Button>
        </div>
      </div>

      {/* KPI Grid - Clean Monochromatic Icons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Card key={idx} onClick={() => onNavigateTab(kpi.tab)} className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:shadow-md hover:border-[#274690]/40 transition duration-200">
              <CardContent className="p-0 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500">{kpi.title}</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{kpi.count}</p>
                  <p className="text-[11px] font-medium text-slate-400 mt-0.5 flex items-center gap-1">
                    {kpi.change}
                  </p>
                </div>
                <div className="h-11 w-11 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-[#274690] group-hover:bg-[#274690] group-hover:text-white transition duration-200">
                  <Icon size={20} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Grid: Left Recent Docs, Right Activity Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Documents Card */}
          <Card className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <FileText size={18} className="text-[#274690]" /> Recent Documents
                </h3>
                <p className="text-xs text-slate-500">Latest active files in your organisation library</p>
              </div>
              <Button onClick={() => onNavigateTab("all-documents")} variant="ghost" className="text-xs font-bold text-[#274690] hover:bg-blue-50">
                View All <ArrowUpRight size={14} className="ml-1" />
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/80 text-slate-700 font-bold border-b border-slate-200/60">
                  <tr>
                    <th className="py-2.5 px-3 rounded-l-lg">Document Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Owner</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 rounded-r-lg">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {recentDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-3 font-semibold text-slate-900 flex items-center gap-2">
                        <FileText size={15} className="text-[#274690] shrink-0" />
                        <span className="truncate max-w-[200px]" title={doc.name}>{doc.name}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                          {doc.cat}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <User size={13} className="text-slate-400" />
                          <span>{doc.owner}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {doc.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-slate-500 text-[11px] whitespace-nowrap">{doc.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column (1 col) */}
        <div className="space-y-6">
          {/* Activity Stream */}
          <Card className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-extrabold text-slate-900">Recent Activity</h3>
              <Button onClick={() => onNavigateTab("activity-audit")} variant="ghost" className="text-xs font-bold text-[#274690] hover:bg-blue-50">
                Audit Log
              </Button>
            </div>
            <div className="space-y-3">
              {activities.map((act, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs">
                  <div className="h-6 w-6 rounded-full bg-blue-100 text-[#274690] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {act.user.charAt(0)}
                  </div>
                  <div>
                    <p className="text-slate-800 font-medium">
                      <strong>{act.user}</strong> {act.action} <span className="text-[#274690] font-semibold">{act.doc}</span>
                    </p>
                    <p className="text-[10px] text-slate-400">{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
