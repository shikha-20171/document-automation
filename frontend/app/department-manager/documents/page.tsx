"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  Filter,
  Plus,
  UploadCloud,
  Sparkles,
  Download,
  Eye,
  Edit3,
  Trash2,
  Send,
  CheckCircle2,
  AlertCircle,
  Share2,
  UserCheck,
  Archive,
  RefreshCw,
  X,
  FileCheck,
  Clock,
  MessageSquare,
  Bot,
  Layout,
  Check,
  CheckSquare,
  Tag,
  Calendar,
  Layers,
  MoreHorizontal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { documentsApi } from "@/services/documentsApi";

type DocumentItem = {
  id: number;
  name: string;
  type?: string;
  category?: string;
  team?: string;
  createdBy: string;
  assignedTo: string;
  priority?: string;
  tags?: string[];
  status: string;
  approvalStatus: string;
  size: number;
  createdDate: string;
  updatedDate: string;
  dueDate?: string;
  description?: string;
  previewContent?: string;
  version?: string;
  history?: Array<{ action: string; user: string; time: string; comment?: string }>;
  aiHistory?: Array<{ tool: string; runAt: string; note: string }>;
};

export default function DepartmentManagerDocumentsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successToast, setSuccessToast] = useState("");

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [teams, setTeams] = useState<string[]>([]);
  const [members, setMembers] = useState<string[]>([]);

  // Search, Filters & Sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("");
  const [assignedFilter, setAssignedFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "name" | "priority">("newest");

  // Selection for Bulk Actions
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Modals & Drawers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState("Sanya Mehta");

  // Create Form State
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("Contract");
  const [newCategory, setNewCategory] = useState("Legal");
  const [newTeam, setNewTeam] = useState("Procurement & Logistics");
  const [newAssignedTo, setNewAssignedTo] = useState("Sanya Mehta");
  const [newPriority, setNewPriority] = useState("NORMAL");
  const [newTags, setNewTags] = useState("Vendor, Operations");
  const [newDueDate, setNewDueDate] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 4000);
  };

  const fetchDocuments = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await documentsApi.getDepartmentDocuments({
        search: searchQuery,
        type: typeFilter,
        category: categoryFilter,
        status: statusFilter,
        approvalStatus: approvalFilter,
        assignedTo: assignedFilter,
        team: teamFilter,
        priority: priorityFilter,
      });
      if (res?.data) {
        setDocuments(res.data.documents || []);
        if (res.data.categories) setCategories(res.data.categories);
        if (res.data.types) setTypes(res.data.types);
        if (res.data.teams) setTeams(res.data.teams);
        if (res.data.members) setMembers(res.data.members);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchDocuments();
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, typeFilter, categoryFilter, statusFilter, approvalFilter, assignedFilter, teamFilter, priorityFilter]);

  // Bulk Actions
  const handleSelectAll = () => {
    if (selectedIds.length === documents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(documents.map((d) => d.id));
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleBulkAction = async (action: "DELETE" | "ARCHIVE" | "SUBMIT_APPROVAL") => {
    if (!selectedIds.length) return;
    try {
      await documentsApi.bulkDocumentAction(action, selectedIds);
      showToast(`Bulk ${action.toLowerCase()} applied to ${selectedIds.length} documents.`);
      setSelectedIds([]);
      void fetchDocuments();
    } catch {
      setError("Failed to execute bulk action.");
    }
  };

  const handleCreateDocument = async (status = "CREATED", submitApproval = false) => {
    if (!newName.trim()) {
      setError("Document name is required.");
      return;
    }
    setError("");
    try {
      const res = await documentsApi.createDocument({
        name: newName,
        type: newType,
        category: newCategory,
        team: newTeam,
        assignedTo: newAssignedTo,
        priority: newPriority,
        tags: newTags,
        dueDate: newDueDate,
        description: newDescription,
        status,
        submitApproval,
        file: uploadedFile,
      }, "/department-manager/documents");
      showToast(res?.message || "Document created successfully!");
      setIsCreateModalOpen(false);
      setNewName("");
      setNewDescription("");
      setUploadedFile(null);
      void fetchDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create document.");
    }
  };

  const handleDeleteDocument = async (id: number) => {
    if (!confirm("Are you sure you want to delete this department document?")) return;
    try {
      await documentsApi.deleteDocument(id, "/department-manager/documents");
      showToast("Document deleted successfully.");
      if (selectedDoc?.id === id) setIsDetailDrawerOpen(false);
      void fetchDocuments();
    } catch {
      setError("Failed to delete document.");
    }
  };

  const handleAssignDocument = async () => {
    if (!selectedDoc) return;
    try {
      await documentsApi.updateDocument(selectedDoc.id, { assignedTo: assignTarget }, "/department-manager/documents");
      showToast(`Assigned ${selectedDoc.name} to ${assignTarget}!`);
      setIsAssignModalOpen(false);
      void fetchDocuments();
      if (selectedDoc) setSelectedDoc({ ...selectedDoc, assignedTo: assignTarget });
    } catch {
      setError("Failed to assign document.");
    }
  };

  const handleStatusChange = async (docId: number, status: string, approvalStatus?: string) => {
    try {
      await documentsApi.updateDocument(docId, { status, ...(approvalStatus && { approvalStatus }) }, "/department-manager/documents");
      showToast(`Document updated to ${status}!`);
      void fetchDocuments();
      if (selectedDoc?.id === docId) {
        setSelectedDoc({ ...selectedDoc, status, ...(approvalStatus && { approvalStatus }) });
      }
    } catch {
      setError("Failed to update status.");
    }
  };

  const handleDownload = (doc: DocumentItem) => {
    const blob = new Blob([doc.previewContent || doc.description || doc.name], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${doc.name}`);
  };

  const workflowSteps = [
    { key: "DRAFT", label: "Draft" },
    { key: "CREATED", label: "Created" },
    { key: "ASSIGNED", label: "Assigned" },
    { key: "IN_PROGRESS", label: "In Progress" },
    { key: "SUBMITTED_FOR_APPROVAL", label: "Submitted" },
    { key: "COMPLETED", label: "Completed" },
  ];

  const getWorkflowStepIndex = (status: string) => {
    if (status === "DRAFT") return 0;
    if (status === "CREATED") return 1;
    if (status === "IN_PROGRESS") return 3;
    if (status === "SUBMITTED_FOR_APPROVAL") return 4;
    if (status === "COMPLETED" || status === "APPROVED") return 5;
    return 2;
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-16 font-sans text-slate-800">
      {/* Header with Title & Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Department Documents</h1>
            <Badge className="bg-[#274690]/10 text-[#274690] text-xs font-bold">Scoped</Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500">Manage, organize, approve, assign, and AI-process your department documents.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/department-manager/document-templates">
            <Button variant="outline" size="sm" className="border-[#274690]/30 text-xs font-bold text-[#274690] hover:bg-blue-50">
              <Layout size={14} className="mr-1.5" />
              Create from Template
            </Button>
          </Link>
          <Link href="/department-manager/ai-tools/document-generator">
            <Button variant="outline" size="sm" className="border-[#c96f4a]/30 text-xs font-bold text-[#c96f4a] hover:bg-orange-50">
              <Sparkles size={14} className="mr-1.5" />
              Generate with AI
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#274690] text-xs font-bold text-white hover:bg-[#1f3770] shadow-sm"
          >
            <Plus size={14} className="mr-1.5" />
            Create Document
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {successToast && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 shadow-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-800 shadow-sm">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search, Filters & Bulk Bar */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
        <div className="grid gap-3 md:grid-cols-12">
          <div className="relative md:col-span-4">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents, tags, creators, assignees..."
              className="pl-9 h-10 rounded-xl text-xs font-semibold"
            />
          </div>

          <div className="md:col-span-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
            >
              <option value="">All Document Types</option>
              {types.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
            >
              <option value="">All Statuses</option>
              <option value="CREATED">Created</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="SUBMITTED_FOR_APPROVAL">Submitted for Approval</option>
              <option value="COMPLETED">Completed</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
            >
              <option value="">All Priorities</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium</option>
              <option value="NORMAL">Normal</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Controls */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-blue-50 border border-blue-200 px-4 py-2.5 text-xs font-bold text-[#274690]">
            <div className="flex items-center gap-2">
              <CheckSquare size={16} />
              <span>{selectedIds.length} document(s) selected</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => handleBulkAction("SUBMIT_APPROVAL")}
                className="h-7 bg-[#274690] text-white text-[11px] font-bold"
              >
                Submit for Approval
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction("ARCHIVE")}
                className="h-7 border-blue-300 text-[11px] font-bold"
              >
                Archive Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction("DELETE")}
                className="h-7 border-rose-300 text-rose-700 text-[11px] font-bold hover:bg-rose-50"
              >
                Delete Selected
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Documents Table */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
            Document List ({documents.length})
          </h2>
          <Button variant="ghost" size="sm" onClick={fetchDocuments} className="text-xs font-bold text-slate-500">
            <RefreshCw size={13} className={`mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase text-slate-600">
              <tr>
                <th className="px-3 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === documents.length}
                    onChange={handleSelectAll}
                    className="rounded text-[#274690]"
                  />
                </th>
                <th className="px-4 py-3">Document Name</th>
                <th className="px-4 py-3">Type & Category</th>
                <th className="px-4 py-3">Team</th>
                <th className="px-4 py-3">Created By</th>
                <th className="px-4 py-3">Assigned To</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Approval</th>
                <th className="px-4 py-3">Created Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                    <RefreshCw className="mx-auto h-6 w-6 animate-spin text-[#274690]" />
                    <p className="mt-2 text-xs font-bold">Loading department documents...</p>
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                    No documents found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(doc.id)}
                        onChange={() => handleToggleSelect(doc.id)}
                        className="rounded text-[#274690]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDoc(doc);
                          setIsDetailDrawerOpen(true);
                        }}
                        className="text-left font-bold text-slate-900 hover:text-[#274690]"
                      >
                        {doc.name}
                        {doc.priority === "HIGH" && (
                          <span className="ml-1.5 rounded bg-rose-100 px-1.5 py-0.2 text-[9px] font-black text-rose-700">
                            HIGH
                          </span>
                        )}
                      </button>
                      {doc.tags && doc.tags.length > 0 && (
                        <div className="mt-0.5 flex flex-wrap gap-1">
                          {doc.tags.map((t, idx) => (
                            <span key={idx} className="rounded bg-slate-100 px-1 py-0.2 text-[9px] text-slate-500">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-slate-800">{doc.type || "Document"}</span>
                        <span className="text-[10px] text-slate-400">{doc.category || "General"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-medium">{doc.team || "Operations"}</td>
                    <td className="px-4 py-3 text-slate-700">{doc.createdBy}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 font-semibold text-[#274690]">
                        <UserCheck size={12} /> {doc.assignedTo}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black ${
                        doc.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800" : doc.status === "SUBMITTED_FOR_APPROVAL" ? "bg-orange-100 text-[#c96f4a]" : "bg-slate-100 text-slate-700"
                      }`}>
                        {(doc.status || "DRAFT").toString().replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-[10px] font-bold ${
                        doc.approvalStatus === "APPROVED" ? "border-emerald-300 text-emerald-700 bg-emerald-50" : doc.approvalStatus === "PENDING" ? "border-amber-300 text-amber-700 bg-amber-50" : "text-slate-500"
                      }`}>
                        {(doc.approvalStatus || "N/A").toString().replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                      {new Date(doc.createdDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedDoc(doc);
                            setIsDetailDrawerOpen(true);
                          }}
                          className="h-7 w-7 p-0 text-slate-600 hover:text-[#274690]"
                        >
                          <Eye size={13} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(doc)}
                          className="h-7 w-7 p-0 text-slate-600 hover:text-[#274690]"
                        >
                          <Download size={13} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedDoc(doc);
                            setIsAssignModalOpen(true);
                          }}
                          className="h-7 w-7 p-0 text-slate-600 hover:text-[#c96f4a]"
                        >
                          <Share2 size={13} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* CREATE DOCUMENT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Create / Upload Department Document</h3>
              <button type="button" onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-black uppercase text-slate-500">Document Name *</label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Q3 Vendor Master Services Agreement.pdf"
                  className="mt-1 rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-500">Document Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
                  >
                    <option value="Contract">Contract / Agreement</option>
                    <option value="Invoice">Invoice / Tax Bill</option>
                    <option value="Report">Report / Reconciliation</option>
                    <option value="Policy">Policy / SOP</option>
                    <option value="Checklist">Checklist</option>
                    <option value="Memo">Approval Memo</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-500">Department Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
                  >
                    <option value="Legal">Legal</option>
                    <option value="Finance">Finance</option>
                    <option value="Operations">Operations</option>
                    <option value="Compliance">Compliance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-500">Assigned Team</label>
                  <select
                    value={newTeam}
                    onChange={(e) => setNewTeam(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
                  >
                    {teams.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-500">Assigned User</label>
                  <select
                    value={newAssignedTo}
                    onChange={(e) => setNewAssignedTo(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
                  >
                    {members.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-500">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
                  >
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="NORMAL">Normal</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-500">Due Date</label>
                  <Input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="mt-1 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-500">Tags (comma-separated)</label>
                <Input
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="e.g. Vendor, SLA, Urgent"
                  className="mt-1 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-500">Description & Context</label>
                <textarea
                  rows={2}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-800 focus:border-[#274690] focus:bg-white focus:outline-none"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Operational context or notes..."
                />
              </div>

              {/* Upload Dropzone */}
              <div>
                <label className="text-[11px] font-black uppercase text-slate-500">Attach Document File</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setUploadedFile(f);
                  }}
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-3.5 text-xs font-semibold text-slate-600 hover:border-[#274690]"
                >
                  <UploadCloud size={18} className="text-[#274690]" />
                  {uploadedFile ? uploadedFile.name : "Click to attach PDF, DOCX, or TXT file"}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <Link href="/department-manager/ai-tools/document-generator" onClick={() => setIsCreateModalOpen(false)}>
                <Button variant="ghost" size="sm" className="text-xs font-bold text-[#c96f4a]">
                  <Sparkles size={13} className="mr-1" /> Generate with AI
                </Button>
              </Link>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCreateDocument("DRAFT", false)}
                  className="text-xs font-bold text-slate-700"
                >
                  Save Draft
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleCreateDocument("SUBMITTED_FOR_APPROVAL", true)}
                  className="bg-[#274690] text-xs font-bold text-white hover:bg-[#1f3770]"
                >
                  Create & Submit
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT DETAIL DRAWER WITH WORKFLOW STEPPER */}
      {isDetailDrawerOpen && selectedDoc && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white p-6 shadow-2xl overflow-y-auto flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-black text-slate-900">{selectedDoc.name}</h3>
                  <p className="text-xs text-[#274690] font-semibold">{selectedDoc.team} • {selectedDoc.category}</p>
                </div>
                <button type="button" onClick={() => setIsDetailDrawerOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>

              {/* Workflow Stepper */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-2">Document Lifecycle Workflow</span>
                <div className="flex items-center justify-between">
                  {workflowSteps.map((step, idx) => {
                    const currentIdx = getWorkflowStepIndex(selectedDoc.status);
                    const isDone = idx <= currentIdx;
                    return (
                      <div key={step.key} className="flex flex-col items-center text-center">
                        <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black ${
                          isDone ? "bg-[#274690] text-white" : "bg-slate-200 text-slate-500"
                        }`}>
                          {idx + 1}
                        </div>
                        <span className={`mt-1 text-[9px] font-bold ${isDone ? "text-[#274690]" : "text-slate-400"}`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Metadata Pills */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-slate-50 p-3">
                  <span className="text-[10px] font-bold text-slate-400">Created By</span>
                  <p className="font-black text-slate-800">{selectedDoc.createdBy}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <span className="text-[10px] font-bold text-slate-400">Assigned User & Team</span>
                  <p className="font-black text-[#274690]">{selectedDoc.assignedTo} ({selectedDoc.team})</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <span className="text-[10px] font-bold text-slate-400">Status & Priority</span>
                  <p className="font-black text-slate-800">{selectedDoc.status} • {selectedDoc.priority || "NORMAL"}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <span className="text-[10px] font-bold text-slate-400">Approval Sign-off</span>
                  <p className="font-black text-emerald-700">{selectedDoc.approvalStatus}</p>
                </div>
              </div>

              {/* Preview Content */}
              <div>
                <h4 className="text-xs font-black uppercase text-slate-500 mb-1.5">Document Content Preview</h4>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 font-mono text-xs text-slate-800 whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {selectedDoc.previewContent || selectedDoc.description || "No preview content available."}
                </div>
              </div>

              {/* AI Processing History */}
              {selectedDoc.aiHistory && selectedDoc.aiHistory.length > 0 && (
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-500 mb-2">AI Processing History</h4>
                  <div className="space-y-2">
                    {selectedDoc.aiHistory.map((ai, i) => (
                      <div key={i} className="flex items-center justify-between rounded-xl bg-purple-50/60 border border-purple-100 p-2.5 text-xs text-purple-900">
                        <span className="font-bold">{ai.tool}: {ai.note}</span>
                        <span className="font-mono text-[10px] text-purple-600">{new Date(ai.runAt).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Version History & Activity */}
              <div>
                <h4 className="text-xs font-black uppercase text-slate-500 mb-2">Version & Activity History</h4>
                <div className="space-y-2">
                  {(selectedDoc.history || []).map((h, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{h.action}</p>
                        <span className="text-[10px] text-slate-400">by {h.user}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">{new Date(h.time).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 border-t border-slate-100 pt-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleDownload(selectedDoc)} className="text-xs font-bold">
                  <Download size={13} className="mr-1" /> Download
                </Button>
                <Link href="/department-manager/ai-tools/summarizer">
                  <Button variant="outline" size="sm" className="text-xs font-bold text-[#c96f4a] border-orange-200 hover:bg-orange-50">
                    <Bot size={13} className="mr-1" /> Ask AI
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleStatusChange(selectedDoc.id, "COMPLETED", "APPROVED")}
                  className="bg-[#274690] text-xs font-bold text-white hover:bg-[#1f3770]"
                >
                  <CheckCircle2 size={13} className="mr-1" /> Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange(selectedDoc.id, "REJECTED", "REJECTED")}
                  className="text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  Reject
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN MODAL */}
      {isAssignModalOpen && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-base font-black text-slate-900">Assign Document</h3>
            <p className="text-xs text-slate-500">Assign &quot;{selectedDoc.name}&quot; to a department team member.</p>

            <select
              value={assignTarget}
              onChange={(e) => setAssignTarget(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800"
            >
              {members.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setIsAssignModalOpen(false)} className="text-xs font-bold">
                Cancel
              </Button>
              <Button size="sm" onClick={handleAssignDocument} className="bg-[#274690] text-xs font-bold text-white hover:bg-[#1f3770]">
                Confirm Assignment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}