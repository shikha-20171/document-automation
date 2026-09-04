"use client";

import { useState, useEffect } from "react";
import { 
  FileText, 
  Search, 
  Filter, 
  Eye, 
  Download, 
  Share2, 
  FolderInput, 
  History, 
  Archive, 
  Trash2, 
  MoreVertical, 
  Edit3,
  Plus,
  Upload,
  CheckCircle2,
  XCircle,
  Tag,
  ScanText
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";

export interface DocumentItem {
  id: string;
  name: string;
  type: string;
  category: string;
  owner: string;
  department: string;
  branch: string;
  status: string;
  updated: string;
  tags: string[];
  ocrStatus: string;
  size: string;
}

interface AllDocumentsTabProps {
  onOpenCreate: () => void;
  onOpenUpload: () => void;
  extraDocuments?: DocumentItem[];
}

const initialDocuments: DocumentItem[] = [
  { id: "1", name: "Employment_Agreement_Rajesh.pdf", type: "PDF", category: "HR", owner: "Shikha Gour", department: "HR", branch: "Headquarters", status: "Active", updated: "10 Aug 2026", tags: ["Employment", "Urgent"], ocrStatus: "Completed", size: "2.4 MB" },
  { id: "2", name: "Vendor_Invoice_TechCorp_Q3.pdf", type: "PDF", category: "Invoices", owner: "Rajesh Kumar", department: "Finance", branch: "Mumbai", status: "Approved", updated: "10 Aug 2026", tags: ["Tax2026", "Vendor"], ocrStatus: "Completed", size: "1.1 MB" },
  { id: "3", name: "Master_Service_Agreement_2026.docx", type: "DOCX", category: "Contracts", owner: "Priya Sharma", department: "Legal", branch: "Headquarters", status: "Draft", updated: "09 Aug 2026", tags: ["Client", "Confidential"], ocrStatus: "N/A", size: "850 KB" },
  { id: "4", name: "Q3_Financial_Audit_Report.xlsx", type: "XLSX", category: "Reports", owner: "Amit Patel", department: "Finance", branch: "Bangalore", status: "Active", updated: "09 Aug 2026", tags: ["Audit", "Finance"], ocrStatus: "N/A", size: "4.2 MB" },
  { id: "5", name: "Company_Security_Policy_v4.pdf", type: "PDF", category: "Policies", owner: "Shikha Gour", department: "HR", branch: "Headquarters", status: "Approved", updated: "08 Aug 2026", tags: ["Policy", "Compliance"], ocrStatus: "Completed", size: "3.5 MB" },
  { id: "6", name: "NDA_Client_GlobalTech.pdf", type: "PDF", category: "Legal", owner: "Priya Sharma", department: "Legal", branch: "Delhi", status: "Pending Review", updated: "07 Aug 2026", tags: ["NDA", "Client"], ocrStatus: "Review Required", size: "920 KB" },
  { id: "7", name: "Employee_Offer_Letter_Draft.docx", type: "DOCX", category: "HR", owner: "Shikha Gour", department: "HR", branch: "Headquarters", status: "Draft", updated: "06 Aug 2026", tags: ["Hiring"], ocrStatus: "N/A", size: "410 KB" },
  { id: "8", name: "Office_Lease_Agreement_2026.pdf", type: "PDF", category: "Contracts", owner: "Amit Patel", department: "Operations", branch: "Mumbai", status: "Active", updated: "05 Aug 2026", tags: ["Lease", "Legal"], ocrStatus: "Completed", size: "5.8 MB" },
];

export default function AllDocumentsTab({ onOpenCreate, onOpenUpload, extraDocuments }: AllDocumentsTabProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
  const [isLoadingDocs, setIsLoadingDocs] = useState<boolean>(false);

  // Load documents from backend database and localStorage on mount
  useEffect(() => {
    const loadAllDocs = async () => {
      setIsLoadingDocs(true);
      let dbDocs: DocumentItem[] = [];

      // 1. Fetch from Backend Database API
      try {
        const res = await api.get("/org-admin/documents");
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          dbDocs = res.data.data;
        }
      } catch {
        // fallback to /api/ai/documents
        try {
          const aiDocsRes = await api.get("/ai/documents");
          if (aiDocsRes.data?.success && Array.isArray(aiDocsRes.data.data) && aiDocsRes.data.data.length > 0) {
            dbDocs = aiDocsRes.data.data.map((d: any) => ({
              id: String(d.id),
              name: d.name,
              type: d.name.split(".").pop()?.toUpperCase() || "PDF",
              category: d.type || "General",
              owner: d.uploaded_by || "Organisation Admin",
              department: "General",
              branch: "Headquarters",
              status: "Active",
              updated: "Recently",
              tags: ["Database", d.type || "Doc"],
              ocrStatus: "Completed",
              size: `${((d.size || 102400) / (1024 * 1024)).toFixed(1)} MB`,
            }));
          }
        } catch {}
      }

      // 2. Fetch locally saved template/AI generated documents
      let localSaved: DocumentItem[] = [];
      if (typeof window !== "undefined") {
        try {
          localSaved = JSON.parse(localStorage.getItem("org_saved_documents") || "[]");
        } catch {}
      }

      // 3. Combine unique items
      setDocuments((prev) => {
        const map = new Map<string, DocumentItem>();
        // Add local saved first (newest)
        localSaved.forEach((d) => map.set(d.id, d));
        // Add DB docs
        dbDocs.forEach((d) => map.set(d.id, d));
        // Add extra passed from parent
        (extraDocuments || []).forEach((d) => map.set(d.id, d));
        // Add initial seed docs if not present
        initialDocuments.forEach((d) => {
          if (!map.has(d.id)) map.set(d.id, d);
        });
        return Array.from(map.values());
      });
      setIsLoadingDocs(false);
    };

    loadAllDocs();
  }, [extraDocuments]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filters
  const [filterType, setFilterType] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterDept, setFilterDept] = useState("All");
  const [filterBranch, setFilterBranch] = useState("All");
  const [filterOwner, setFilterOwner] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterOcr, setFilterOcr] = useState("All");

  // Selected Action Modal State
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [versionDoc, setVersionDoc] = useState<DocumentItem | null>(null);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = filterType === "All" || doc.type === filterType;
    const matchesCat = filterCategory === "All" || doc.category === filterCategory;
    const matchesDept = filterDept === "All" || doc.department === filterDept;
    const matchesBranch = filterBranch === "All" || doc.branch === filterBranch;
    const matchesOwner = filterOwner === "All" || doc.owner === filterOwner;
    const matchesStatus = filterStatus === "All" || doc.status === filterStatus;
    const matchesOcr = filterOcr === "All" || doc.ocrStatus === filterOcr;

    return matchesSearch && matchesType && matchesCat && matchesDept && matchesBranch && matchesOwner && matchesStatus && matchesOcr;
  });

  const handleDelete = (id: string, name: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
    showToast(`Archived/Deleted document "${name}" successfully.`);
    setActiveActionMenuId(null);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-slate-900 text-white px-4 py-3 text-xs font-bold shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText size={22} className="text-[#274690]" /> All Documents
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Central organization repository. Search, filter, classify, and execute document management actions.
          </p>
        </div>

        {/* Action Buttons: [+ Create Document] [↑ Upload Document] */}
        <div className="flex items-center gap-3">
          <Button 
            onClick={onOpenCreate}
            className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-2xl text-xs px-4 py-2.5 shadow-md flex items-center gap-2"
          >
            <Plus size={16} /> + Create Document
          </Button>
          <Button 
            onClick={onOpenUpload}
            className="bg-[#274690] hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs px-4 py-2.5 shadow-md flex items-center gap-2"
          >
            <Upload size={16} /> ↑ Upload Document
          </Button>
        </div>
      </div>

      {/* Search & 8 Multi-Filters */}
      <Card className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by title, owner, tags, keyword..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-[#274690] focus:outline-none transition font-medium"
          />
        </div>

        {/* 8 Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-xs">
          {/* 1. Document Type */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Doc Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none"
            >
              <option value="All">All Types</option>
              <option value="PDF">PDF</option>
              <option value="DOCX">DOCX</option>
              <option value="XLSX">XLSX</option>
            </select>
          </div>

          {/* 2. Category */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none"
            >
              <option value="All">All Categories</option>
              <option value="HR">HR</option>
              <option value="Invoices">Invoices</option>
              <option value="Contracts">Contracts</option>
              <option value="Reports">Reports</option>
              <option value="Policies">Policies</option>
              <option value="Legal">Legal</option>
            </select>
          </div>

          {/* 3. Department */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Department</label>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none"
            >
              <option value="All">All Depts</option>
              <option value="HR">HR</option>
              <option value="Finance">Finance</option>
              <option value="Legal">Legal</option>
              <option value="Operations">Operations</option>
            </select>
          </div>

          {/* 4. Branch */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Branch</label>
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none"
            >
              <option value="All">All Branches</option>
              <option value="Headquarters">Headquarters</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Delhi">Delhi</option>
            </select>
          </div>

          {/* 5. Owner */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Owner</label>
            <select
              value={filterOwner}
              onChange={(e) => setFilterOwner(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none"
            >
              <option value="All">All Owners</option>
              <option value="Shikha Gour">Shikha Gour</option>
              <option value="Rajesh Kumar">Rajesh Kumar</option>
              <option value="Priya Sharma">Priya Sharma</option>
              <option value="Amit Patel">Amit Patel</option>
            </select>
          </div>

          {/* 6. Status */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Approved">Approved</option>
              <option value="Draft">Draft</option>
              <option value="Pending Review">Pending Review</option>
            </select>
          </div>

          {/* 7. OCR Status */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">OCR Status</label>
            <select
              value={filterOcr}
              onChange={(e) => setFilterOcr(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none"
            >
              <option value="All">All OCR</option>
              <option value="Completed">Completed</option>
              <option value="Review Required">Review Required</option>
              <option value="N/A">N/A</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Main Documents Table */}
      <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Document</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Owner</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Updated</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    No documents matched your filters.
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70 transition">
                    {/* Document Name & Tags */}
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-blue-50 text-[#274690] flex items-center justify-center font-extrabold text-xs shrink-0 border border-blue-100">
                          {doc.type}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs hover:text-[#274690] cursor-pointer" onClick={() => setPreviewDoc(doc)}>
                            {doc.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-slate-400">{doc.size}</span>
                            {doc.tags.map(t => (
                              <span key={t} className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">
                                <Tag size={9} /> {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        {doc.category}
                      </span>
                    </td>

                    {/* Owner */}
                    <td className="py-3.5 px-4 text-slate-800 font-semibold">
                      {doc.owner}
                    </td>

                    {/* Department */}
                    <td className="py-3.5 px-4 text-slate-600">
                      {doc.department} ({doc.branch})
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <Badge className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        doc.status === "Approved" || doc.status === "Active" ? "bg-emerald-100 text-emerald-800" :
                        doc.status === "Draft" ? "bg-slate-100 text-slate-700" :
                        "bg-amber-100 text-amber-800"
                      }`}>
                        {doc.status}
                      </Badge>
                    </td>

                    {/* Updated */}
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {doc.updated}
                    </td>

                    {/* Actions Menu */}
                    <td className="py-3.5 px-4 text-right relative">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          title="Preview / View"
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-[#274690] transition"
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          onClick={() => showToast(`Downloaded "${doc.name}"`)}
                          title="Download"
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-emerald-600 transition"
                        >
                          <Download size={16} />
                        </button>

                        <button
                          onClick={() => setVersionDoc(doc)}
                          title="Version History"
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-amber-600 transition"
                        >
                          <History size={16} />
                        </button>

                        <div className="relative">
                          <button
                            onClick={() => setActiveActionMenuId(activeActionMenuId === doc.id ? null : doc.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {activeActionMenuId === doc.id && (
                            <div className="absolute right-0 top-8 z-30 w-44 rounded-2xl bg-white border border-slate-200 shadow-xl p-1.5 text-left text-xs font-semibold text-slate-700 space-y-0.5 animate-in fade-in zoom-in-95">
                              <button onClick={() => { setPreviewDoc(doc); setActiveActionMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100">
                                <Eye size={14} className="text-[#274690]" /> View & Edit
                              </button>
                              <button onClick={() => { showToast(`Shared link created for ${doc.name}`); setActiveActionMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100">
                                <Share2 size={14} className="text-purple-600" /> Share Document
                              </button>
                              <button onClick={() => { showToast(`Moved ${doc.name} to designated department`); setActiveActionMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100">
                                <FolderInput size={14} className="text-cyan-600" /> Move Folder
                              </button>
                              <button onClick={() => { handleDelete(doc.id, doc.name); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-amber-50 text-amber-700">
                                <Archive size={14} /> Archive Document
                              </button>
                              <button onClick={() => { handleDelete(doc.id, doc.name); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-600">
                                <Trash2 size={14} /> Delete Document
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-2xl bg-blue-100 text-[#274690] flex items-center justify-center font-black text-sm">
                  {previewDoc.type}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{previewDoc.name}</h3>
                  <p className="text-xs text-slate-500">Category: {previewDoc.category} • Owner: {previewDoc.owner}</p>
                </div>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 font-bold flex items-center justify-center">
                ✕
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-3">
              <FileText size={48} className="mx-auto text-[#274690]" />
              <p className="text-xs font-bold text-slate-800">Document Document Viewer Simulation</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                File size: <strong>{previewDoc.size}</strong> • Department: <strong>{previewDoc.department}</strong> ({previewDoc.branch})
              </p>
              <div className="flex justify-center gap-2 flex-wrap">
                {previewDoc.tags.map(t => (
                  <Badge key={t} className="bg-blue-50 text-[#274690] border border-blue-200">{t}</Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button onClick={() => setPreviewDoc(null)} variant="outline" className="rounded-xl text-xs font-bold">
                Close
              </Button>
              <Button onClick={() => { showToast(`Downloading ${previewDoc.name}`); setPreviewDoc(null); }} className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-xl text-xs">
                Download File
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {versionDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <History size={18} className="text-amber-600" /> Version History: {versionDoc.name}
              </h3>
              <button onClick={() => setVersionDoc(null)} className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 flex justify-between items-center">
                <div>
                  <p className="font-extrabold text-slate-900">v2.0 (Current Active)</p>
                  <p className="text-[11px] text-slate-500">Updated by {versionDoc.owner} on {versionDoc.updated}</p>
                </div>
                <Badge className="bg-emerald-600 text-white font-bold">Active</Badge>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex justify-between items-center opacity-80">
                <div>
                  <p className="font-extrabold text-slate-900">v1.1 (Revision)</p>
                  <p className="text-[11px] text-slate-500">Updated by Priya Sharma on 04 Aug 2026</p>
                </div>
                <Button size="sm" variant="ghost" className="text-xs text-[#274690] font-bold">Restore</Button>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex justify-between items-center opacity-60">
                <div>
                  <p className="font-extrabold text-slate-900">v1.0 (Initial Upload)</p>
                  <p className="text-[11px] text-slate-500">Uploaded on 01 Aug 2026</p>
                </div>
                <Button size="sm" variant="ghost" className="text-xs text-[#274690] font-bold">Restore</Button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setVersionDoc(null)} className="bg-slate-900 text-white font-bold rounded-xl text-xs">
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
