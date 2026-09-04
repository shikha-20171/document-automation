"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  Filter,
  Plus,
  UploadCloud,
  Download,
  Eye,
  Edit,
  Trash2,
  Archive,
  Send,
  History,
  CheckCircle2,
  Clock,
  XCircle,
  MoreVertical,
  ChevronDown,
  LayoutGrid,
  List,
  Sparkles,
  X,
  FileCheck,
  Star,
  Share2,
  MessageSquare,
  Users,
  RotateCcw,
  Check,
  Shield,
  Layers,
  ArrowUpDown,
  Tag,
} from "lucide-react";
import { documentsApi } from "@/services/documentsApi";

export default function MyDocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedTag, setSelectedTag] = useState("ALL");
  const [showArchived, setShowArchived] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Modals & Drawers
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [detailsDoc, setDetailsDoc] = useState<any>(null);
  const [detailsTab, setDetailsTab] = useState<"info" | "preview" | "versions" | "comments" | "activity" | "shared">("info");
  const [renameDoc, setRenameDoc] = useState<any>(null);
  const [shareDoc, setShareDoc] = useState<any>(null);
  const [shareEmail, setShareEmail] = useState("");
  const [sharePermission, setSharePermission] = useState("VIEW");
  const [newName, setNewName] = useState("");
  const [newComment, setNewComment] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState("Finance");
  const [uploadTags, setUploadTags] = useState("Finance, Invoice");

  // Success / Notice banner
  const [notice, setNotice] = useState<string | null>(null);

  const fetchDocs = async () => {
    setLoading(true);
    const res = await documentsApi.getDocuments({
      search,
      category: selectedCategory,
      status: selectedStatus,
      isArchived: showArchived,
      sort: sortBy,
    });
    if (res?.data?.documents) {
      let docs = res.data.documents;
      if (onlyFavorites) {
        docs = docs.filter((d: any) => d.isFavorite);
      }
      if (selectedTag !== "ALL") {
        docs = docs.filter((d: any) => d.tags?.includes(selectedTag));
      }
      setDocuments(docs);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDocs();
  }, [search, selectedCategory, selectedStatus, selectedTag, showArchived, onlyFavorites, sortBy]);

  const showToast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  // Actions
  const handleToggleFavorite = (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, isFavorite: !d.isFavorite } : d))
    );
    showToast("Favorites updated");
  };

  const handleSubmitApproval = async (doc: any) => {
    await documentsApi.submitDocumentForApproval(doc.id);
    showToast(`'${doc.name}' submitted for Team Leader / Manager approval!`);
    fetchDocs();
    if (detailsDoc?.id === doc.id) {
      setDetailsDoc({ ...detailsDoc, status: "Pending Approval" });
    }
  };

  const handleToggleArchive = async (doc: any) => {
    await documentsApi.toggleArchiveDocument(doc.id);
    showToast(`'${doc.name}' ${doc.isArchived ? "restored to active list" : "archived"}.`);
    fetchDocs();
    if (detailsDoc?.id === doc.id) setDetailsDoc(null);
  };

  const handleDelete = async (doc: any) => {
    if (!confirm(`Are you sure you want to delete '${doc.name}'?`)) return;
    try {
      await documentsApi.deleteDocument(doc.id);
      showToast(`'${doc.name}' deleted.`);
      fetchDocs();
      if (detailsDoc?.id === doc.id) setDetailsDoc(null);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameDoc || !newName.trim()) return;
    await documentsApi.updateDocument(renameDoc.id, { name: newName.trim() });
    showToast(`Document renamed to '${newName.trim()}'`);
    setRenameDoc(null);
    setNewName("");
    fetchDocs();
  };

  const handleShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareDoc || !shareEmail.trim()) return;
    showToast(`Shared '${shareDoc.name}' with ${shareEmail} (${sharePermission})`);
    setShareDoc(null);
    setShareEmail("");
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailsDoc || !newComment.trim()) return;
    const commentObj = {
      id: `c-${Date.now()}`,
      user: "Priya Sharma (You)",
      time: "Just now",
      text: newComment.trim(),
    };
    const updatedComments = [...(detailsDoc.comments || []), commentObj];
    setDetailsDoc({ ...detailsDoc, comments: updatedComments });
    setNewComment("");
    showToast("Comment added");
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    const tagArray = uploadTags.split(",").map((t) => t.trim()).filter(Boolean);
    await documentsApi.createDocument({
      name: uploadFile.name,
      category: uploadCategory,
      type: uploadFile.name.split(".").pop()?.toUpperCase() || "PDF",
      content: `Uploaded file content for ${uploadFile.name}. Size: ${(uploadFile.size / (1024 * 1024)).toFixed(2)} MB.`,
      status: "Draft",
      tags: tagArray,
    });
    showToast(`'${uploadFile.name}' uploaded successfully.`);
    setUploadModalOpen(false);
    setUploadFile(null);
    fetchDocs();
  };

  const handleDownload = (doc: any, format = "txt") => {
    const content = doc.content || `Document: ${doc.name}\nCategory: ${doc.category}\nStatus: ${doc.status}`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${doc.name.replace(/\.[^/.]+$/, "")}.${format}`;
    link.click();
    showToast(`Downloaded '${doc.name}' as ${format.toUpperCase()}`);
  };

  const categories = ["Finance", "Legal", "Operations", "Procurement", "HR", "Compliance"];
  const allTags = ["Finance", "Reconciliation", "Contract", "Draft", "Audit", "SOP", "Checklist"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-black text-slate-800 sm:text-2xl">My Documents</h1>
          <p className="mt-1 text-xs text-slate-500">
            Create, upload, edit, manage drafts, view details, and track approval workflows
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center gap-2 rounded-2xl border border-[#274690]/30 bg-white px-4 py-2.5 text-xs font-bold text-[#274690] shadow-sm transition hover:bg-slate-50 active:scale-95"
          >
            <UploadCloud size={16} />
            <span>Upload Document</span>
          </button>

          <Link
            href="/employee/documents/create"
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#274690] to-[#182747] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#274690]/30 transition hover:brightness-110 active:scale-95"
          >
            <Plus size={16} />
            <span>Create Document</span>
          </Link>
        </div>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-md">
        <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search by title, tags, or content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 py-2 pl-9 pr-3 text-xs font-medium text-slate-800 outline-none transition focus:border-[#274690] focus:bg-white focus:ring-2 focus:ring-[#274690]/20"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <Filter size={14} className="text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-[#274690] focus:bg-white"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-[#274690] focus:bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="Draft">Drafts</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>

          {/* Tags Filter */}
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-[#274690] focus:bg-white"
          >
            <option value="ALL">All Tags</option>
            {allTags.map((t) => (
              <option key={t} value={t}>Tag: {t}</option>
            ))}
          </select>

          {/* Sort Selector */}
          <div className="flex items-center gap-1">
            <ArrowUpDown size={13} className="text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-[#274690]"
            >
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="name_asc">Name: A to Z</option>
              <option value="name_desc">Name: Z to A</option>
              <option value="size">File Size</option>
            </select>
          </div>
        </div>

        {/* View Mode & Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            className={`flex items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-bold transition border ${
              onlyFavorites
                ? "bg-amber-50 text-amber-700 border-amber-300"
                : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Star size={13} className={onlyFavorites ? "fill-amber-500 text-amber-500" : "text-slate-400"} />
            <span>Favorites</span>
          </button>

          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`flex items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-bold transition border ${
              showArchived
                ? "bg-slate-800 text-white border-slate-800"
                : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Archive size={13} />
            <span>{showArchived ? "Show Active" : "Trash / Archive"}</span>
          </button>

          <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 p-0.5">
            <button
              onClick={() => setViewMode("table")}
              className={`rounded-xl p-1.5 transition ${
                viewMode === "table" ? "bg-white text-[#274690] shadow-sm font-bold" : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded-xl p-1.5 transition ${
                viewMode === "grid" ? "bg-white text-[#274690] shadow-sm font-bold" : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Document Content List / Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#274690] border-t-transparent" />
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white/60 p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#274690]">
            <FileText size={24} />
          </div>
          <h3 className="mt-3 text-sm font-bold text-slate-800">No Documents Found</h3>
          <p className="mt-1 max-w-xs text-xs text-slate-400">
            {showArchived
              ? "Your trash / archive is empty."
              : "No documents match your filter. Try adjusting search or create a new document."}
          </p>
          <div className="mt-4 flex gap-2">
            <Link
              href="/employee/documents/create"
              className="rounded-2xl bg-[#274690] px-4 py-2 text-xs font-bold text-white shadow-sm hover:brightness-110"
            >
              Create New Document
            </Link>
          </div>
        </div>
      ) : viewMode === "table" ? (
        /* Table View */
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Document Name</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Size / Version</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Updated</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.map((doc) => (
                  <tr
                    key={doc.id}
                    className="group transition hover:bg-slate-50/70 cursor-pointer"
                    onClick={() => {
                      setDetailsDoc(doc);
                      setDetailsTab("info");
                    }}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => handleToggleFavorite(doc.id, e)}
                          className="text-slate-300 hover:text-amber-500 transition"
                        >
                          <Star
                            size={15}
                            className={doc.isFavorite ? "fill-amber-400 text-amber-400" : ""}
                          />
                        </button>
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#274690]">
                          <FileText size={17} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-800 group-hover:text-[#274690] transition truncate max-w-sm">
                            {doc.name}
                          </div>
                          {doc.tags && doc.tags.length > 0 && (
                            <div className="flex items-center gap-1 mt-0.5">
                              {doc.tags.slice(0, 2).map((t: string) => (
                                <span key={t} className="rounded bg-slate-100 px-1.5 py-0.2 text-[9px] font-medium text-slate-600">
                                  #{t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
                        {doc.category || "General"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      <div>{doc.sizeFormatted || `${doc.size || 1.2} MB`}</div>
                      <div className="text-[10px] text-slate-400">{doc.version || "v1.0"}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold border ${
                          doc.status === "Approved"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : doc.status === "Rejected"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : doc.status === "Pending Approval"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {doc.status === "Approved" ? (
                          <CheckCircle2 size={11} />
                        ) : doc.status === "Rejected" ? (
                          <XCircle size={11} />
                        ) : doc.status === "Pending Approval" ? (
                          <Clock size={11} />
                        ) : null}
                        <span>{doc.status}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                      {doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString() : "Recent"}
                    </td>
                    <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setDetailsDoc(doc);
                            setDetailsTab("preview");
                          }}
                          title="View Details & Preview"
                          className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleDownload(doc, "txt")}
                          title="Download"
                          className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Download size={15} />
                        </button>
                        <button
                          onClick={() => setShareDoc(doc)}
                          title="Share"
                          className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#274690]"
                        >
                          <Share2 size={15} />
                        </button>
                        <button
                          onClick={() => {
                            setRenameDoc(doc);
                            setNewName(doc.name);
                          }}
                          title="Rename"
                          className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => handleToggleArchive(doc)}
                          title={doc.isArchived ? "Restore" : "Archive"}
                          className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-amber-600"
                        >
                          {doc.isArchived ? <RotateCcw size={15} /> : <Archive size={15} />}
                        </button>
                        <button
                          onClick={() => handleDelete(doc)}
                          title="Delete"
                          className="rounded-xl p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              onClick={() => {
                setDetailsDoc(doc);
                setDetailsTab("info");
              }}
              className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md transition hover:-translate-y-1 hover:border-[#274690]/40 hover:shadow-md cursor-pointer"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-[#274690]">
                    <FileText size={20} />
                  </div>
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleToggleFavorite(doc.id, e)}
                      className="text-slate-300 hover:text-amber-500 transition"
                    >
                      <Star size={16} className={doc.isFavorite ? "fill-amber-400 text-amber-400" : ""} />
                    </button>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                        doc.status === "Approved"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : doc.status === "Rejected"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : doc.status === "Pending Approval"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-sm font-bold text-slate-800 group-hover:text-[#274690] transition line-clamp-2">
                    {doc.name}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-600">{doc.category || "General"}</span>
                    <span>•</span>
                    <span>{doc.sizeFormatted || `${doc.size || 1.2} MB`}</span>
                    <span>•</span>
                    <span>{doc.version || "v1.0"}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                <span className="text-[10px] text-slate-400 font-medium">
                  {doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString() : "Recently"}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDownload(doc, "txt")}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    title="Download"
                  >
                    <Download size={14} />
                  </button>
                  <button
                    onClick={() => setShareDoc(doc)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-[#274690]"
                    title="Share"
                  >
                    <Share2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(doc)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DOCUMENT DETAILS MODAL / DRAWER */}
      {detailsDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
              <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#274690] text-white">
                  <FileText size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-black text-slate-800">{detailsDoc.name}</h3>
                  <p className="text-xs text-slate-400">
                    Category: <span className="font-bold text-slate-600">{detailsDoc.category}</span> • ID: {detailsDoc.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailsDoc(null)}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-200 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-100 px-6 bg-white gap-2">
              {[
                { id: "info", label: "Information" },
                { id: "preview", label: "Preview" },
                { id: "versions", label: "Version History" },
                { id: "comments", label: "Comments" },
                { id: "activity", label: "Activity" },
                { id: "shared", label: "Shared Users" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setDetailsTab(tab.id as any)}
                  className={`border-b-2 py-3 px-3 text-xs font-bold transition ${
                    detailsTab === tab.id
                      ? "border-[#274690] text-[#274690]"
                      : "border-transparent text-slate-400 hover:text-slate-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {detailsTab === "info" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Document Status</div>
                      <div className="mt-1 font-bold text-slate-800">{detailsDoc.status}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Current Version</div>
                      <div className="mt-1 font-bold text-slate-800">{detailsDoc.version || "v1.0"}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">File Size</div>
                      <div className="mt-1 font-bold text-slate-800">{detailsDoc.sizeFormatted || "2.4 MB"}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Created By</div>
                      <div className="mt-1 font-bold text-slate-800">{detailsDoc.uploadedBy || "Priya Sharma"}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Workflow Reviewer</div>
                      <div className="mt-1 font-bold text-slate-800">{detailsDoc.reviewer || "Ritika Sharma (TL)"}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Last Updated</div>
                      <div className="mt-1 font-bold text-slate-800">
                        {detailsDoc.updatedAt ? new Date(detailsDoc.updatedAt).toLocaleString() : "Recently"}
                      </div>
                    </div>
                  </div>

                  {/* Workflow / Approval Status Banner */}
                  <div className="rounded-2xl border border-[#274690]/20 bg-blue-50/40 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield size={16} className="text-[#274690]" />
                        <span className="text-xs font-bold text-[#274690]">Workflow & Approval Status</span>
                      </div>
                      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-[#274690]">
                        {detailsDoc.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">
                      {detailsDoc.status === "Draft"
                        ? "This document is in draft mode. You can edit content, adjust fields, or submit it for manager review."
                        : detailsDoc.status === "Pending Approval"
                        ? "Submitted for Team Leader review. Changes are locked while under review."
                        : detailsDoc.status === "Approved"
                        ? "Document has been formally reviewed and approved by management."
                        : "Document requires corrections based on reviewer remarks."}
                    </p>
                  </div>
                </div>
              )}

              {detailsTab === "preview" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">Live Preview Container</span>
                    <button
                      onClick={() => handleDownload(detailsDoc, "txt")}
                      className="flex items-center gap-1 text-xs font-bold text-[#274690] hover:underline"
                    >
                      <Download size={13} />
                      <span>Download File</span>
                    </button>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs text-slate-800 whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed">
                    {detailsDoc.content || "No text content available for preview."}
                  </div>
                </div>
              )}

              {detailsTab === "versions" && (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-500">Document Version History</div>
                  <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-slate-50/50 p-2">
                    {(detailsDoc.history || [
                      { action: "Created Draft", user: "Priya Sharma", date: "2026-08-17 10:00 AM" },
                      { action: "Updated Table & Line Items", user: "Priya Sharma", date: "2026-08-17 02:30 PM" },
                      { action: "Submitted for Approval", user: "Priya Sharma", date: "2026-08-18 10:15 AM" },
                    ]).map((h: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 text-xs">
                        <div>
                          <div className="font-bold text-slate-800">{h.action}</div>
                          <div className="text-[10px] text-slate-400">By {h.user}</div>
                        </div>
                        <span className="text-[10px] font-medium text-slate-500">{h.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detailsTab === "comments" && (
                <div className="space-y-4">
                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {(detailsDoc.comments || [
                      { id: "c-1", user: "Ritika Sharma (TL)", time: "1 hour ago", text: "Please ensure the supplier tax number matches the invoice ledger before resubmitting." },
                    ]).map((c: any) => (
                      <div key={c.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">{c.user}</span>
                          <span className="text-[10px] text-slate-400">{c.time}</span>
                        </div>
                        <p className="mt-1 text-slate-600">{c.text}</p>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a comment or collaborator note..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="flex-1 rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#274690] focus:bg-white"
                    />
                    <button
                      type="submit"
                      className="rounded-2xl bg-[#274690] px-4 py-2 text-xs font-bold text-white hover:brightness-110"
                    >
                      Post
                    </button>
                  </form>
                </div>
              )}

              {detailsTab === "activity" && (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-500">Document Activity Log</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs">
                      <span className="font-bold text-slate-800">Document Created</span>
                      <span className="text-[10px] text-slate-400">3 days ago</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs">
                      <span className="font-bold text-slate-800">Metadata & Tags Updated</span>
                      <span className="text-[10px] text-slate-400">2 days ago</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs">
                      <span className="font-bold text-slate-800">Submitted for Approval to Team Leader</span>
                      <span className="text-[10px] text-slate-400">Yesterday</span>
                    </div>
                  </div>
                </div>
              )}

              {detailsTab === "shared" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-slate-500">Collaborators with Access</div>
                    <button
                      onClick={() => setShareDoc(detailsDoc)}
                      className="text-xs font-bold text-[#274690] hover:underline"
                    >
                      + Add Collaborator
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-3 text-xs">
                      <div>
                        <div className="font-bold text-slate-800">Priya Sharma (You)</div>
                        <div className="text-[10px] text-slate-400">employee@demo.com</div>
                      </div>
                      <span className="rounded-lg bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-[#274690]">
                        Owner
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-3 text-xs">
                      <div>
                        <div className="font-bold text-slate-800">Ritika Sharma</div>
                        <div className="text-[10px] text-slate-400">ritika.s@docucore.ai</div>
                      </div>
                      <span className="rounded-lg bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                        Reviewer (Edit)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-6 py-4">
              <button
                onClick={() => setDetailsDoc(null)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
              <div className="flex items-center gap-2">
                {detailsDoc.status === "Draft" && (
                  <button
                    onClick={() => handleSubmitApproval(detailsDoc)}
                    className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-[#274690] to-[#182747] px-4 py-2 text-xs font-bold text-white shadow-md hover:brightness-110"
                  >
                    <Send size={14} />
                    <span>Submit for Approval</span>
                  </button>
                )}
                <button
                  onClick={() => handleDownload(detailsDoc, "txt")}
                  className="flex items-center gap-1.5 rounded-2xl border border-[#274690] px-4 py-2 text-xs font-bold text-[#274690] hover:bg-blue-50"
                >
                  <Download size={14} />
                  <span>Download</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENAME MODAL */}
      {renameDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800">Rename Document</h3>
            <form onSubmit={handleRename} className="mt-4 space-y-4">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#274690] focus:bg-white"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRenameDoc(null)}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-[#274690] px-4 py-2 text-xs font-bold text-white hover:brightness-110"
                >
                  Save Rename
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SHARE MODAL */}
      {shareDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2">
              <Share2 size={18} className="text-[#274690]" />
              <h3 className="text-sm font-bold text-slate-800">Share Document</h3>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Share <span className="font-bold text-slate-700">{shareDoc.name}</span> with team members
            </p>
            <form onSubmit={handleShareSubmit} className="mt-4 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600">Collaborator Email</label>
                <input
                  type="email"
                  placeholder="colleague@docucore.ai"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#274690] focus:bg-white"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600">Access Permission</label>
                <select
                  value={sharePermission}
                  onChange={(e) => setSharePermission(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-[#274690]"
                >
                  <option value="VIEW">Can View (Read-Only)</option>
                  <option value="COMMENT">Can Comment</option>
                  <option value="EDIT">Can Edit</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShareDoc(null)}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-[#274690] px-4 py-2 text-xs font-bold text-white hover:brightness-110"
                >
                  Grant Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPLOAD MODAL */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UploadCloud size={20} className="text-[#274690]" />
                <h3 className="text-sm font-bold text-slate-800">Upload New Document</h3>
              </div>
              <button onClick={() => setUploadModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="mt-4 space-y-4">
              {/* Drag and Drop Zone */}
              <div className="rounded-3xl border-2 border-dashed border-[#274690]/30 bg-blue-50/30 p-6 text-center">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadFile(e.target.files[0]);
                    }
                  }}
                  accept=".pdf,.docx,.doc,.xlsx,.xls,.txt,.png,.jpg"
                />
                <label htmlFor="file-upload" className="cursor-pointer block">
                  <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-blue-100 text-[#274690]">
                    <UploadCloud size={24} />
                  </div>
                  <div className="mt-2 text-xs font-bold text-slate-700">
                    {uploadFile ? uploadFile.name : "Click to browse or drag file here"}
                  </div>
                  <div className="text-[10px] text-slate-400">PDF, DOCX, XLSX, TXT (Max 25 MB)</div>
                </label>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600">Category</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-[#274690]"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={uploadTags}
                  onChange={(e) => setUploadTags(e.target.value)}
                  placeholder="e.g. Finance, Reconciliation, Invoice"
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#274690]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadFile}
                  className="rounded-2xl bg-[#274690] px-5 py-2 text-xs font-bold text-white hover:brightness-110 disabled:opacity-50"
                >
                  Upload & Save Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
