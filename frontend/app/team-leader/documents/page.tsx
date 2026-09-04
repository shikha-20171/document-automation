"use client";

import { useEffect, useState, useMemo } from "react";
import {
  FileText,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Briefcase,
  Layers,
  ChevronRight,
  Download,
  UploadCloud,
  Check,
  X,
  Plus,
  MessageSquare,
  History,
  FileCheck2,
  FileX,
  FileEdit,
  GitPullRequest,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { documentsApi } from "@/services/documentsApi";

type DocumentTab =
  | "ALL"
  | "MY_TEAM"
  | "ASSIGNED_TO_ME"
  | "UNDER_REVIEW"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "DRAFTS"
  | "COMPLETED";

export default function TeamLeaderDocumentsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successToast, setSuccessToast] = useState("");

  const [activeTab, setActiveTab] = useState<DocumentTab>("ALL");
  const [documents, setDocuments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Detail & Action Drawer
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [detailTab, setDetailTab] = useState<
    "PREVIEW" | "INFO" | "VERSIONS" | "COMMENTS" | "TIMELINE" | "WORKFLOW" | "AUDIT"
  >("PREVIEW");
  const [newCommentText, setNewCommentText] = useState("");

  // Reassign Modal
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [reassignTarget, setReassignTarget] = useState("Aakash Verma");

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 4000);
  };

  const fetchDocs = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await documentsApi.getTeamDocuments({ tab: activeTab, search: searchQuery });
      if (res?.data) {
        setDocuments(res.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDocs();
  }, [activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void fetchDocs();
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc || !newCommentText.trim()) return;
    try {
      const res = await documentsApi.addDocumentComment(selectedDoc.id, newCommentText.trim());
      showToast("Comment added!");
      setNewCommentText("");
      if (selectedDoc.comments) {
        selectedDoc.comments.push(res.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add comment.");
    }
  };

  const handleDocAction = async (action: "APPROVE" | "REJECT" | "REQUEST_CHANGES", comment: string = "") => {
    if (!selectedDoc) return;
    try {
      const res = await documentsApi.updateDocumentAction(selectedDoc.id, { action, comment });
      showToast(`Document ${action} successfully!`);
      setSelectedDoc(res.data);
      void fetchDocs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process document action.");
    }
  };

  const handleReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc) return;
    try {
      const res = await documentsApi.updateDocumentAction(selectedDoc.id, {
        action: "REASSIGN",
        assignedTo: reassignTarget,
      });
      showToast(`Document reassigned to ${reassignTarget}!`);
      setIsReassignOpen(false);
      setSelectedDoc(res.data);
      void fetchDocs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reassign document.");
    }
  };

  const tabs: { key: DocumentTab; label: string }[] = [
    { key: "ALL", label: "All Documents" },
    { key: "MY_TEAM", label: "My Team Documents" },
    { key: "ASSIGNED_TO_ME", label: "Assigned to Me" },
    { key: "UNDER_REVIEW", label: "Under Review" },
    { key: "PENDING_APPROVAL", label: "Pending Approval" },
    { key: "APPROVED", label: "Approved" },
    { key: "REJECTED", label: "Rejected" },
    { key: "DRAFTS", label: "Drafts" },
    { key: "COMPLETED", label: "Completed" },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-20 font-sans text-slate-800">
      {/* 1. HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-[#274690] sm:text-3xl">Team Documents</h1>
            <Badge className="bg-[#c96f4a]/10 text-[#c96f4a] border-[#c96f4a]/30 text-xs font-black px-2.5 py-0.5">
              Financial Operations
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-semibold">
            Scoped strictly to team & department documents • Review, approve, and assign
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            onClick={() => {
              showToast("New version upload dialog initialized.");
            }}
            className="h-10 rounded-xl bg-[#274690] px-4 text-xs font-black text-white hover:bg-[#1f3561] shadow-sm gap-1.5"
          >
            <UploadCloud size={15} /> Upload Version
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

      {/* 2. 9 TABS BAR */}
      <div className="flex overflow-x-auto space-x-1.5 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xs scrollbar-none">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key)}
            className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-black transition-all ${
              activeTab === t.key
                ? "bg-[#274690] text-white shadow-xs"
                : "text-slate-500 hover:bg-[#274690]/5 hover:text-[#274690]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 3. SEARCH BAR */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by name, type, owner, or status..."
            className="pl-10 h-10 rounded-2xl bg-white text-xs font-semibold focus:border-[#274690]"
          />
        </div>
        <Button type="submit" size="sm" className="h-10 rounded-2xl bg-[#274690] text-xs font-bold text-white px-5 hover:bg-[#1f3561]">
          Search
        </Button>
      </form>

      {/* 4. DOCUMENT TABLE */}
      <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Document Name</th>
                <th className="px-4 py-3.5">Type</th>
                <th className="px-4 py-3.5">Owner / Created By</th>
                <th className="px-4 py-3.5">Assigned To</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-3 py-3.5 text-center">Version</th>
                <th className="px-4 py-3.5">Updated</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                    No documents found for this filter tab.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="transition hover:bg-[#274690]/5">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#274690]/10 text-[#274690] shrink-0">
                          <FileText size={16} />
                        </div>
                        <div className="max-w-[240px]">
                          <p className="font-extrabold text-slate-900 truncate" title={doc.name}>
                            {doc.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold">{doc.size || "1.5 MB"}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <Badge className="bg-slate-100 text-slate-700 text-[10px] font-black">
                        {doc.type}
                      </Badge>
                    </td>

                    <td className="px-4 py-4 font-bold text-slate-800">{doc.owner}</td>

                    <td className="px-4 py-4">
                      <span className="rounded-lg bg-[#274690]/10 px-2 py-1 text-[11px] font-extrabold text-[#274690]">
                        {doc.assignedTo}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <Badge
                        className={`text-[10px] font-black ${
                          doc.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : doc.status === "PENDING_APPROVAL"
                            ? "bg-[#c96f4a]/15 text-[#c96f4a] border-[#c96f4a]/30"
                            : doc.status === "CHANGES_REQUESTED"
                            ? "bg-orange-100 text-orange-800"
                            : doc.status === "REJECTED"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {doc.status}
                      </Badge>
                    </td>

                    <td className="px-3 py-4 text-center font-extrabold text-slate-600">{doc.version}</td>

                    <td className="px-4 py-4 text-[11px] text-slate-400 font-bold">{doc.updatedDate}</td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedDoc(doc);
                            setDetailTab("PREVIEW");
                          }}
                          className="h-8 rounded-xl bg-[#274690] text-[11px] font-bold text-white hover:bg-[#1f3561] px-2.5"
                        >
                          <Eye size={13} className="mr-1" /> View & Review
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. DOCUMENT DETAIL DRAWER (WITH PREVIEW, INFO, VERSIONS, COMMENTS, WORKFLOW) */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-4xl rounded-3xl bg-white p-6 shadow-2xl border border-[#274690]/20 max-h-[92vh] overflow-y-auto space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-[#274690]">{selectedDoc.name}</h3>
                  <Badge className="bg-[#c96f4a]/10 text-[#c96f4a] text-[10px] font-black">{selectedDoc.version}</Badge>
                </div>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">
                  Owner: <strong className="text-slate-700">{selectedDoc.owner}</strong> • Assigned To:{" "}
                  <strong className="text-[#274690]">{selectedDoc.assignedTo}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto space-x-2 border-b border-slate-100 pb-2 text-xs font-bold scrollbar-none">
              <button
                type="button"
                onClick={() => setDetailTab("PREVIEW")}
                className={`px-3 py-1 rounded-lg ${detailTab === "PREVIEW" ? "bg-[#274690] text-white" : "text-slate-500 hover:bg-slate-50"}`}
              >
                Document Preview
              </button>
              <button
                type="button"
                onClick={() => setDetailTab("INFO")}
                className={`px-3 py-1 rounded-lg ${detailTab === "INFO" ? "bg-[#274690] text-white" : "text-slate-500 hover:bg-slate-50"}`}
              >
                Metadata & Details
              </button>
              <button
                type="button"
                onClick={() => setDetailTab("VERSIONS")}
                className={`px-3 py-1 rounded-lg ${detailTab === "VERSIONS" ? "bg-[#274690] text-white" : "text-slate-500 hover:bg-slate-50"}`}
              >
                Version History ({selectedDoc.versionHistory?.length || 1})
              </button>
              <button
                type="button"
                onClick={() => setDetailTab("COMMENTS")}
                className={`px-3 py-1 rounded-lg ${detailTab === "COMMENTS" ? "bg-[#274690] text-white" : "text-slate-500 hover:bg-slate-50"}`}
              >
                Comments ({selectedDoc.comments?.length || 0})
              </button>
            </div>

            {/* TAB BODIES */}
            {detailTab === "PREVIEW" && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 text-xs font-medium text-slate-700 leading-relaxed min-h-[160px]">
                <p className="font-bold text-[#274690] mb-2 uppercase text-[10px] tracking-wider">
                  Extracted Document Text Content:
                </p>
                {selectedDoc.contentPreview || "No text preview available for this document format."}
              </div>
            )}

            {detailTab === "INFO" && (
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Document Type</span>
                  <p className="font-extrabold text-slate-900">{selectedDoc.type}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Category</span>
                  <p className="font-extrabold text-slate-900">{selectedDoc.category}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Created Date</span>
                  <p className="font-extrabold text-slate-900">{selectedDoc.createdDate}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Last Updated</span>
                  <p className="font-extrabold text-slate-900">{selectedDoc.updatedDate}</p>
                </div>
              </div>
            )}

            {detailTab === "VERSIONS" && (
              <div className="space-y-2 max-h-56 overflow-y-auto text-xs">
                {(selectedDoc.versionHistory || []).map((v: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <span className="font-black text-[#274690]">{v.version}</span>
                      <p className="text-[11px] text-slate-600 font-semibold">{v.note}</p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">{v.date} by {v.author}</span>
                  </div>
                ))}
              </div>
            )}

            {detailTab === "COMMENTS" && (
              <div className="space-y-3">
                <div className="space-y-2 max-h-48 overflow-y-auto text-xs">
                  {(selectedDoc.comments || []).length === 0 ? (
                    <p className="text-slate-400">No review comments yet.</p>
                  ) : (
                    selectedDoc.comments.map((c: any) => (
                      <div key={c.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex justify-between font-bold text-[10px] text-slate-400">
                          <span className="text-[#274690]">{c.user}</span>
                          <span>{c.date}</span>
                        </div>
                        <p className="mt-1 text-slate-800 text-xs font-semibold">{c.text}</p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddComment} className="flex gap-2">
                  <Input
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Add team leader review comment..."
                    className="h-9 text-xs rounded-xl focus:border-[#274690]"
                  />
                  <Button size="sm" type="submit" className="h-9 bg-[#274690] text-xs font-bold text-white rounded-xl hover:bg-[#1f3561]">
                    Post
                  </Button>
                </form>
              </div>
            )}

            {/* Quick Decision Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsReassignOpen(true)}
                  className="rounded-xl text-xs font-bold text-slate-700"
                >
                  Reassign
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const comment = prompt("Enter correction instructions:");
                    if (comment) handleDocAction("REQUEST_CHANGES", comment);
                  }}
                  className="rounded-xl border-[#c96f4a]/40 text-[#c96f4a] text-xs font-bold hover:bg-[#c96f4a]/10"
                >
                  Request Changes
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (confirm("Reject this document?")) handleDocAction("REJECT", "Rejected during team lead review.");
                  }}
                  className="rounded-xl border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-50"
                >
                  Reject
                </Button>
              </div>

              <Button
                size="sm"
                onClick={() => handleDocAction("APPROVE", "Approved by Team Leader")}
                className="rounded-xl bg-emerald-600 text-xs font-black text-white hover:bg-emerald-700 gap-1.5"
              >
                <Check size={14} /> Approve Document
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* REASSIGN MODAL */}
      {isReassignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border border-[#274690]/20 space-y-4">
            <h3 className="text-sm font-black text-[#274690]">Reassign {selectedDoc?.name}</h3>
            <form onSubmit={handleReassignSubmit} className="space-y-3">
              <select
                value={reassignTarget}
                onChange={(e) => setReassignTarget(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-800 focus:border-[#274690]"
              >
                <option value="Aakash Verma">Aakash Verma (Senior Analyst)</option>
                <option value="Priya Sharma">Priya Sharma (Legal Associate)</option>
                <option value="Rohan Das">Rohan Das (Doc Specialist)</option>
                <option value="Neha Kapoor">Neha Kapoor (Ops Executive)</option>
                <option value="Vikram Mehta">Vikram Mehta (Tax Auditor)</option>
              </select>

              <div className="flex justify-end gap-2 pt-2">
                <Button size="sm" variant="outline" type="button" onClick={() => setIsReassignOpen(false)} className="rounded-xl text-xs">
                  Cancel
                </Button>
                <Button size="sm" type="submit" className="rounded-xl bg-[#274690] text-xs font-bold text-white hover:bg-[#1f3561]">
                  Confirm Reassign
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
