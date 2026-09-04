"use client";

import { useState, useEffect } from "react";
import { FileText, User, Upload, Edit3, Eye, Download, Tag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface MyDocumentsTabProps {
  onOpenCreate: () => void;
  onOpenUpload: () => void;
}

export default function MyDocumentsTab({ onOpenCreate, onOpenUpload }: MyDocumentsTabProps) {
  const [subTab, setSubTab] = useState<"created" | "uploaded" | "edited">("created");

  const [myCreatedDocs, setMyCreatedDocs] = useState<any[]>([
    { name: "Company_Security_Policy_v4.pdf", cat: "Policies", date: "08 Aug 2026", status: "Approved", desc: "In-app authored security & data compliance policy." },
    { name: "Annual_Leave_Guidelines_2026.docx", cat: "HR", date: "04 Aug 2026", status: "Active", desc: "HR policy document generated from HR template." },
  ]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const localSaved = JSON.parse(localStorage.getItem("org_saved_documents") || "[]");
        if (Array.isArray(localSaved) && localSaved.length > 0) {
          const formatted = localSaved.map((d) => ({
            name: d.name,
            cat: d.category || "General",
            date: d.updated || "Just now",
            status: d.status || "Active",
            desc: `Generated from ${d.tags?.[1] || "Template"} format.`,
          }));
          setMyCreatedDocs((prev) => {
            const existingNames = new Set(prev.map((p) => p.name));
            const newOnes = formatted.filter((f) => !existingNames.has(f.name));
            return [...newOnes, ...prev];
          });
        }
      } catch {}
    }
  }, []);

  const myUploadedDocs = [
    { name: "Employment_Agreement_Rajesh.pdf", cat: "HR", date: "10 Aug 2026", size: "2.4 MB", status: "Approved" },
    { name: "Vendor_Invoice_TechCorp_Q3.pdf", cat: "Invoices", date: "10 Aug 2026", size: "1.1 MB", status: "Processed" },
  ];

  const myRecentlyEdited = [
    { name: "Vendor_Invoice_TechCorp_Q3.pdf", cat: "Invoices", date: "10 Aug 2026, 01:15 PM", editType: "OCR Fields Verified" },
    { name: "Company_Security_Policy_v4.pdf", cat: "Policies", date: "08 Aug 2026, 04:10 PM", editType: "Updated Section 4.2" },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <User size={22} className="text-[#274690]" /> My Documents
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Documents created, uploaded, or personally owned by you as Organisation Admin.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onOpenCreate} className="bg-[#274690] text-white font-bold rounded-2xl text-xs px-3.5 py-2">
            + Create New
          </Button>
          <Button onClick={onOpenUpload} className="bg-emerald-600 text-white font-bold rounded-2xl text-xs px-3.5 py-2">
            ↑ Upload New
          </Button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setSubTab("created")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
            subTab === "created"
              ? "bg-[#274690] text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Created by me ({myCreatedDocs.length})
        </button>

        <button
          onClick={() => setSubTab("uploaded")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
            subTab === "uploaded"
              ? "bg-[#274690] text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Uploaded by me ({myUploadedDocs.length})
        </button>

        <button
          onClick={() => setSubTab("edited")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
            subTab === "edited"
              ? "bg-[#274690] text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Recently edited ({myRecentlyEdited.length})
        </button>
      </div>

      {/* Content for Created By Me */}
      {subTab === "created" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myCreatedDocs.map((doc, idx) => (
            <Card key={idx} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <FileText size={20} className="text-[#274690]" />
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">{doc.name}</h4>
                    <span className="text-[11px] font-semibold text-slate-400">Category: {doc.cat}</span>
                  </div>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">{doc.status}</Badge>
              </div>
              <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                {doc.desc}
              </p>
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                <span className="text-slate-400 text-[11px]">Date: {doc.date}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" className="text-[#274690] font-bold text-xs h-7 px-2">
                    <Edit3 size={13} className="mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" className="text-slate-700 font-bold text-xs h-7 px-2">
                    <Eye size={13} className="mr-1" /> View
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Content for Uploaded By Me */}
      {subTab === "uploaded" && (
        <Card className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">File Name</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Size</th>
                <th className="py-2.5 px-3">Uploaded Date</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {myUploadedDocs.map((doc, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-2">
                    <Upload size={15} className="text-emerald-600" />
                    {doc.name}
                  </td>
                  <td className="py-3 px-3">{doc.cat}</td>
                  <td className="py-3 px-3 text-slate-400">{doc.size}</td>
                  <td className="py-3 px-3">{doc.date}</td>
                  <td className="py-3 px-3">
                    <Badge className="bg-blue-100 text-blue-800 text-[10px]">{doc.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Content for Recently Edited */}
      {subTab === "edited" && (
        <div className="space-y-3">
          {myRecentlyEdited.map((doc, i) => (
            <Card key={i} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs">
                  <Edit3 size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">{doc.name}</h4>
                  <p className="text-[11px] text-slate-500">{doc.editType} • {doc.date}</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="rounded-xl text-xs font-bold text-[#274690]">
                Open Document
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
