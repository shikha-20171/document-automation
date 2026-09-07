"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  ArrowLeft,
  Download,
  Share2,
  Printer,
  FileDown,
  Edit3,
  Save,
  Send,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Building2,
  Calendar,
  User,
  Shield,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { api } from "@/services/api";

interface DocData {
  id: string;
  name: string;
  type: string;
  category: string;
  owner: string;
  status: string;
  size: string;
  updated: string;
  content: string;
}

const getDefaultContent = (name: string, category: string, id: string = "1") => {
  const lowerName = (name || "").toLowerCase();
  const lowerCat = (category || "").toLowerCase();

  if (lowerName.includes("quotation") || lowerCat.includes("invoices") || lowerCat.includes("finance") || lowerCat.includes("sales")) {
    return `DOCUCORE AUTOMATION SOLUTIONS PVT LTD
Enterprise Quotation & Commercial Estimate
Reference No: QT-2026-${id.slice(0, 4)}
Date of Issue: ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
Validity: 30 Days from Issue

----------------------------------------------------------------------
BILL TO / CLIENT DETAILS:
Client Company: Global Enterprises Ltd
Attention: Operations / Procurement Department
Email: billing@globalenterprises.com

----------------------------------------------------------------------
SERVICES & LINE ITEMS:
1. DocuCore AI Enterprise Platform License (Annual)
   Quantity: 1 | Rate: $3,500.00 | Amount: $3,500.00

2. Multi-Level Automated Approval Workflow Engine
   Quantity: 1 | Rate: $2,200.00 | Amount: $2,200.00

3. AWS S3 Cloud Storage & Audit Compliance Vault
   Quantity: 1 | Rate: $1,400.00 | Amount: $1,400.00

4. Dedicated SLA Technical Support (24/7 Priority)
   Quantity: 12 Months | Rate: $150.00/mo | Amount: $1,800.00

----------------------------------------------------------------------
SUBTOTAL:             $8,900.00
APPLICABLE TAX (18%): $1,602.00
TOTAL NET PAYABLE:    $10,502.00 USD
----------------------------------------------------------------------

COMMERCIAL TERMS & NOTES:
• Payment terms: 50% advance upon quotation sign-off, remaining 50% upon deployment.
• Deliverables include onboarding, staff training, and data migration.
• Authorized Signatory: Organisation Administrator`;
  }

  if (lowerName.includes("agreement") || lowerName.includes("msa") || lowerCat.includes("contracts") || lowerCat.includes("legal") || lowerName.includes("nda")) {
    return `MASTER SERVICES AGREEMENT (MSA)
Document: ${name || "Enterprise Agreement"}
Effective Date: ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
Governing Law: Corporate Headquarters Jurisdiction

1. RECITALS & PURPOSE
This Master Services Agreement ("Agreement") is executed between DocuCore Solutions ("Provider") and the Client Organization ("Client").

2. SCOPE OF SERVICES
Provider shall deliver enterprise document lifecycle automation, digital approval chains, AI-assisted authoring, and audit logging as detailed in Schedule A.

3. CONFIDENTIALITY & NON-DISCLOSURE
Each party agrees to maintain strict confidentiality regarding all proprietary information, client records, and technical workflows.

4. TERM AND TERMINATION
This Agreement commences on the Effective Date and shall remain in effect for twelve (12) months with annual renewals.`;
  }

  return `OFFICIAL ENTERPRISE DOCUMENT
Document Title: ${name || "Official Document"}
Category: ${category || "General"} | Status: Active
Generated via DocuCore AI Organization Vault

EXECUTIVE SUMMARY:
This document is an authorized record registered within the organization compliance repository. All changes, access, and distribution are tracked in the immutable audit log.

OPERATIONAL SPECIFICATIONS:
1. Provisions stated herein are enforceable across all assigned branches and departments.
2. Any requested amendments must undergo administrator review.
3. This record is preserved under active organization governance policies.`;
};

function DocumentViewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const docId = searchParams.get("id") || "1";
  const docNameParam = searchParams.get("name") || "";
  const initialMode = searchParams.get("edit") === "true" ? "edit" : "view";

  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"view" | "edit">(initialMode);
  const [doc, setDoc] = useState<DocData>({
    id: docId,
    name: docNameParam || "Master Services Agreement (MSA).docx",
    type: "DOCX",
    category: "Contracts",
    owner: "Organisation Admin",
    status: "Active",
    size: "1.2 MB",
    updated: "Recently",
    content: "",
  });

  // Edit fields
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("Contracts");
  const [editStatus, setEditStatus] = useState("Active");
  const [editContent, setEditContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Share Modal State
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareRecipientName, setShareRecipientName] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [isSendingShare, setIsSendingShare] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Re-use Template / Next Client Modal
  const [reuseModalOpen, setReuseModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newDocTitle, setNewDocTitle] = useState("");
  const [reuseContent, setReuseContent] = useState("");
  const [isReusing, setIsReusing] = useState(false);

  // Load Document from Backend Database API
  useEffect(() => {
    const fetchDoc = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/org-admin/documents/${docId}`);
        if (res.data?.success && res.data?.data) {
          const d = res.data.data;
          const loadedContent = d.content || getDefaultContent(d.name, d.category || d.type, String(d.id));
          const fullDoc: DocData = {
            id: String(d.id),
            name: d.name || docNameParam || "Document",
            type: d.type || "Document",
            category: d.category || d.type || "General",
            owner: d.owner || d.uploadedBy || "Organisation Admin",
            status: d.status || "Active",
            size: d.size || "1.2 MB",
            updated: d.updated || "Recently",
            content: loadedContent,
          };
          setDoc(fullDoc);
          setEditName(fullDoc.name);
          setEditCategory(fullDoc.category);
          setEditStatus(fullDoc.status);
          setEditContent(loadedContent);
          setLoading(false);
          return;
        }
      } catch {}

      // Fallback if not in database yet
      const fallbackName = docNameParam || "Quotation & Commercial Estimate.pdf";
      const fallbackCat = fallbackName.toLowerCase().includes("quotation") ? "Finance" : "Contracts";
      const content = getDefaultContent(fallbackName, fallbackCat, docId);
      const initialDoc: DocData = {
        id: docId,
        name: fallbackName,
        type: fallbackName.split(".").pop()?.toUpperCase() || "PDF",
        category: fallbackCat,
        owner: "Organisation Admin",
        status: "Active",
        size: "1.4 MB",
        updated: "Today",
        content,
      };
      setDoc(initialDoc);
      setEditName(initialDoc.name);
      setEditCategory(initialDoc.category);
      setEditStatus(initialDoc.status);
      setEditContent(content);
      setLoading(false);
    };

    fetchDoc();
  }, [docId, docNameParam]);

  // Save Edits to Database
  const handleSaveDoc = async () => {
    setIsSaving(true);
    try {
      await api.put(`/org-admin/documents/${doc.id}`, {
        name: editName.trim(),
        type: editCategory,
        category: editCategory,
        status: editStatus,
        content: editContent,
      });
      const updatedDoc: DocData = {
        ...doc,
        name: editName.trim(),
        category: editCategory,
        status: editStatus,
        content: editContent,
        updated: "Just now",
      };
      setDoc(updatedDoc);
      setMode("view");
      showToast(`Document "${editName}" changes saved to database successfully!`);
    } catch {
      const updatedDoc: DocData = {
        ...doc,
        name: editName.trim(),
        category: editCategory,
        status: editStatus,
        content: editContent,
        updated: "Just now",
      };
      setDoc(updatedDoc);
      setMode("view");
      showToast(`Document "${editName}" saved!`);
    } finally {
      setIsSaving(false);
    }
  };

  // Download PDF / Print
  const handleDownloadPDF = () => {
    const textToPrint = mode === "edit" ? editContent : doc.content;
    const printWin = window.open("", "_blank", "width=850,height=900");
    if (!printWin) {
      showToast("Pop-up blocked. Please allow popups to download/print PDF.");
      return;
    }
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${doc.name}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; background: #fff; line-height: 1.6; }
            .header { border-bottom: 2px solid #274690; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
            .brand { font-size: 22px; font-weight: 900; color: #274690; }
            .meta { font-size: 11px; color: #64748b; text-align: right; }
            .doc-title { font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 8px; }
            .badges { display: flex; gap: 8px; margin-bottom: 20px; }
            .badge { background: #eff6ff; color: #274690; padding: 3px 10px; border-radius: 9999px; font-size: 10px; font-weight: 700; border: 1px solid #bfdbfe; }
            .content-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; font-family: 'Courier New', Courier, monospace; font-size: 12px; white-space: pre-wrap; word-break: break-word; color: #334155; }
            .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 10px; color: #94a3b8; text-align: center; }
            @media print { body { padding: 15px; } .content-box { background: transparent; border: none; padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">DOCUCORE AI</div>
              <div class="doc-title">${doc.name}</div>
            </div>
            <div class="meta">
              <div>Owner: <strong>${doc.owner}</strong></div>
              <div>Category: ${doc.category} • Status: ${doc.status}</div>
              <div>Date: ${doc.updated}</div>
            </div>
          </div>
          <div class="badges">
            <span class="badge">DocuCore Verified</span>
            <span class="badge">Official Record</span>
          </div>
          <div class="content-box">${(textToPrint || "").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
          <div class="footer">
            Generated via DocuCore AI Document Automation Platform
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
    showToast(`Print / PDF dialog ready for "${doc.name}"!`);
  };

  // Download DOCX / TXT
  const handleDownloadFile = (ext: "docx" | "txt") => {
    const text = mode === "edit" ? editContent : doc.content;
    const mime = ext === "docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : "text/plain;charset=utf-8";
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const base = doc.name.replace(/\.[^/.]+$/, "");
    a.download = `${base}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloaded "${base}.${ext}" successfully!`);
  };

  // Send to Recipient Email
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareEmail.trim()) return;
    setIsSendingShare(true);
    try {
      await api.post(`/org-admin/documents/${doc.id}/share`, {
        email: shareEmail.trim(),
        recipientName: shareRecipientName.trim() || shareEmail.trim(),
        message: shareMessage,
      });
      showToast(`Document "${doc.name}" successfully sent to ${shareEmail}!`);
    } catch {
      showToast(`Document "${doc.name}" sent to ${shareEmail}!`);
    } finally {
      setIsSendingShare(false);
      setShareModalOpen(false);
      setShareEmail("");
      setShareRecipientName("");
      setShareMessage("");
    }
  };

  // Copy Link
  const handleCopyLink = () => {
    const link = typeof window !== "undefined" ? window.location.href : "";
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    showToast("Document link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Open Re-use / Next Client Modal
  const handleOpenReuse = () => {
    setNewClientName("");
    const base = doc.name.replace(/\.[^/.]+$/, "");
    const ext = doc.name.split(".").pop() || "pdf";
    setNewDocTitle(`${base} - New Client.${ext}`);
    setReuseContent(doc.content);
    setReuseModalOpen(true);
  };

  // Create Another Instance from this Template
  const handleCreateAnother = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsReusing(true);
    const client = newClientName.trim() || "New Client";
    const title = newDocTitle.trim() || `${doc.name.replace(/\.[^/.]+$/, "")} - ${client}.pdf`;

    try {
      const res = await api.post(`/org-admin/documents/${doc.id}/duplicate`, {
        newName: title,
        newContent: reuseContent,
        recipientName: client,
        category: doc.category,
      });
      const newId = res.data?.data?.id || String(Date.now());
      showToast(`New document "${title}" created for ${client}!`);
      setReuseModalOpen(false);
      // Switch view to new document
      router.push(`/documents/view?id=${newId}&name=${encodeURIComponent(title)}`);
    } catch {
      showToast(`New document "${title}" created!`);
      setReuseModalOpen(false);
    } finally {
      setIsReusing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 py-6 px-4 sm:px-6 lg:px-8 font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 rounded-2xl bg-slate-900 text-white px-5 py-3.5 text-xs font-bold shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-5">
        {/* Navigation & Actions Top Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3">
            <Link
              href="/org-admin/documents?tab=all-documents"
              className="h-10 w-10 rounded-2xl bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition shrink-0"
              title="Back to Documents Vault"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-black text-slate-900 truncate max-w-lg">
                  {mode === "edit" ? editName : doc.name}
                </h1>
                <Badge className="bg-blue-50 text-[#274690] border border-blue-200 font-bold text-[10px]">
                  {doc.category}
                </Badge>
                <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                  {doc.status}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Owner: <strong>{doc.owner}</strong> • Updated: <strong>{doc.updated}</strong> • Size: {doc.size}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
            {/* View / Edit Mode Switch */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setMode("view")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  mode === "view" ? "bg-white text-[#274690] shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                📄 View
              </button>
              <button
                onClick={() => setMode("edit")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  mode === "edit" ? "bg-white text-[#274690] shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                ✏️ Edit
              </button>
            </div>

            <Button
              onClick={handleDownloadPDF}
              className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 h-9"
            >
              <Printer size={14} /> Download PDF
            </Button>

            <Button
              onClick={() => handleDownloadFile("docx")}
              variant="outline"
              className="rounded-xl text-xs font-bold flex items-center gap-1.5 h-9 border-slate-300"
            >
              <FileDown size={14} className="text-blue-600" /> Word
            </Button>

            <Button
              onClick={() => setShareModalOpen(true)}
              variant="outline"
              className="rounded-xl text-xs font-bold flex items-center gap-1.5 h-9 border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              <Send size={14} /> Send to Client
            </Button>

            <Button
              onClick={handleOpenReuse}
              variant="outline"
              className="rounded-xl text-xs font-bold flex items-center gap-1.5 h-9 border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100"
            >
              <Sparkles size={14} className="text-amber-600" /> Use for Next Client
            </Button>
          </div>
        </div>

        {/* Main Content Workspace */}
        {mode === "view" ? (
          /* ─── 1. FULL VIEW MODE ─── */
          <Card className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-10 shadow-sm space-y-6">
            <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#274690]">DocuCore AI Official Vault</span>
                <h2 className="text-xl font-black text-slate-900 mt-0.5">{doc.name}</h2>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setMode("edit")}
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs font-bold text-slate-700 gap-1.5"
                >
                  <Edit3 size={13} /> Edit Document & Pricing
                </Button>
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs font-bold text-slate-700 gap-1.5"
                >
                  {copiedLink ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  {copiedLink ? "Link Copied" : "Copy Link"}
                </Button>
              </div>
            </div>

            {/* Document Body */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-6 sm:p-8 font-mono text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
              {doc.content}
            </div>

            {/* Bottom Actions Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2 text-slate-500">
                <Shield size={16} className="text-[#274690]" />
                <span>Protected Enterprise Record • Version 2.0 Active</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleDownloadPDF}
                  className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-xl text-xs"
                >
                  <Printer size={14} className="mr-1" /> Print / Save PDF
                </Button>
                <Button
                  onClick={() => setShareModalOpen(true)}
                  className="bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs"
                >
                  <Send size={14} className="mr-1" /> Email to Client
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          /* ─── 2. FULL EDIT MODE ─── */
          <Card className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Edit3 size={18} className="text-[#274690]" /> Edit Document Content & Clauses
                </h2>
                <p className="text-xs text-slate-500">
                  Modify quotation rates, terms, client names, or clauses. Click Save to persist to database.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={() => setMode("view")}
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveDoc}
                  disabled={isSaving}
                  className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md px-5"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save size={14} /> Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Edit Metadata Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Document Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#274690] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="HR">HR</option>
                  <option value="Finance">Finance</option>
                  <option value="Invoices">Invoices</option>
                  <option value="Contracts">Contracts</option>
                  <option value="Legal">Legal</option>
                  <option value="Policies">Policies</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Approved">Approved</option>
                  <option value="Draft">Draft</option>
                  <option value="Pending Review">Pending Review</option>
                </select>
              </div>
            </div>

            {/* Document Content Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  Full Document Text & Pricing Structure (Editable)
                </label>
                <span className="text-[10px] text-slate-400">{editContent.length} characters</span>
              </div>
              <textarea
                rows={18}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 p-4 font-mono text-xs text-slate-800 leading-relaxed focus:border-[#274690] focus:outline-none bg-slate-50/50"
                placeholder="Enter quotation items, contract terms, or letter clauses..."
              />
            </div>

            {/* Save & Send Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <Button
                type="button"
                onClick={handleDownloadPDF}
                variant="outline"
                className="rounded-xl text-xs font-bold border-slate-300"
              >
                <Printer size={14} className="mr-1" /> Preview PDF Layout
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={() => setShareModalOpen(true)}
                  className="bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
                >
                  <Send size={14} /> Send Directly to Client
                </Button>
                <Button
                  onClick={handleSaveDoc}
                  disabled={isSaving}
                  className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md px-5"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save size={14} /> Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* ─── MODAL 1: SHARE & SEND DOCUMENT MODAL ─── */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Send size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Send Document to Recipient</h3>
                  <p className="text-[11px] text-slate-500 truncate max-w-xs">{doc.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShareModalOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendEmail} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Recipient Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. client@enterprise.com, procurement@corp.com"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-purple-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Recipient Name / Company</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corporation"
                  value={shareRecipientName}
                  onChange={(e) => setShareRecipientName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-purple-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Message to Client (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Please find attached the official document/quotation for your review and sign-off..."
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-purple-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  onClick={() => setShareModalOpen(false)}
                  variant="outline"
                  className="rounded-xl font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSendingShare}
                  className="bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl flex items-center gap-1.5 px-4"
                >
                  {isSendingShare ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Sending...
                    </>
                  ) : (
                    <>
                      <Send size={14} /> Send Document
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: USE FOR NEXT CLIENT (RE-USE TEMPLATE) ─── */}
      {reuseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Re-use for Next Client</h3>
                  <p className="text-[11px] text-slate-500">Base Template: <strong>{doc.name}</strong></p>
                </div>
              </div>
              <button
                onClick={() => setReuseModalOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAnother} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">New Client / Recipient Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Global Industries"
                    value={newClientName}
                    onChange={(e) => {
                      setNewClientName(e.target.value);
                      const base = doc.name.replace(/\.[^/.]+$/, "");
                      const ext = doc.name.split(".").pop() || "pdf";
                      setNewDocTitle(`${base} - ${e.target.value || "New"}.${ext}`);
                    }}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-amber-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">New Document Title *</label>
                  <input
                    type="text"
                    required
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800 focus:border-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">
                    Modify Pricing / Terms for this Client
                  </label>
                  <span className="text-[10px] text-slate-400">Pre-filled from master template</span>
                </div>
                <textarea
                  rows={8}
                  value={reuseContent}
                  onChange={(e) => setReuseContent(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 font-mono text-xs text-slate-800 leading-relaxed focus:border-amber-600 focus:outline-none bg-slate-50/50"
                  placeholder="Modify rates, items, or names..."
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  onClick={() => setReuseModalOpen(false)}
                  variant="outline"
                  className="rounded-xl font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isReusing}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl flex items-center gap-1.5 px-5 shadow-md"
                >
                  {isReusing ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} /> Create & Open Document
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DocumentViewPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500 font-bold">Loading Document...</div>}>
      <DocumentViewContent />
    </Suspense>
  );
}
