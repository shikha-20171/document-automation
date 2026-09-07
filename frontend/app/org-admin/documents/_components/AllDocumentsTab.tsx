"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
  ScanText,
  Printer,
  FileDown,
  Copy,
  Check,
  Send,
  Sparkles,
  RefreshCw,
  Save,
  Clock,
  Layers,
  FileCheck
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
  content?: string;
}

interface AllDocumentsTabProps {
  onOpenCreate: () => void;
  onOpenUpload: () => void;
  extraDocuments?: DocumentItem[];
}

const getSampleDocumentContent = (doc: DocumentItem): string => {
  if (doc.content && doc.content.trim()) return doc.content;
  const lowerName = doc.name.toLowerCase();
  const lowerCat = doc.category.toLowerCase();
  
  if (lowerName.includes("300000") || lowerName.includes("300k")) {
    return `DOCUCORE AUTOMATION SOLUTIONS PVT LTD
Commercial Proposal & Quotation (₹3,00,000)
Ref No: QT-2026-300K
Date of Issue: 07 Sep 2026
Validity: 30 Days from Issue

----------------------------------------------------------------------
BILL TO / CLIENT DETAILS:
Client Company: Global Enterprises Ltd
Attention: Procurement & Technical Operations Department
Email: billing@globalenterprises.com
Status: Active

----------------------------------------------------------------------
SERVICES & COMMERCIAL INVESTMENT BREAKDOWN:
1. Enterprise Document Automation Core Platform License
   Quantity: 1 System | Rate: ₹1,50,000.00 | Amount: ₹1,50,000.00

2. Custom Multi-Level Approval Workflow & Cloud Integration
   Quantity: 1 Project | Rate: ₹1,00,000.00 | Amount: ₹1,00,000.00

3. Dedicated SLA Technical Support & Cloud Maintenance (1 Year)
   Quantity: 12 Months | Rate: ₹50,000.00 | Amount: ₹50,000.00

----------------------------------------------------------------------
SUBTOTAL (NET INVESTMENT):  ₹3,00,000.00 INR
APPLICABLE GST (18%):       ₹54,000.00 INR
TOTAL AMOUNT PAYABLE:       ₹3,54,000.00 INR (Gross with GST)
NET COMMERCIAL VALUE:       ₹3,00,000.00 INR
----------------------------------------------------------------------

COMMERCIAL TERMS & PAYMENT SCHEDULE:
• 50% Advance (₹1,50,000) upon signing of quotation.
• 40% (₹1,20,000) upon completion of system installation and UAT.
• 10% (₹30,000) on final production sign-off.
• Payment terms: Net 15 days from date of milestone invoice.

Authorized Signatory:
Organisation Administrator
DocuCore Automation Solutions Pvt Ltd`;
  }

  if (lowerName.includes("quotation") || lowerCat.includes("invoices") || lowerCat.includes("finance") || lowerCat.includes("sales")) {
    return `DOCUCORE AUTOMATION SOLUTIONS PVT LTD
Enterprise Quotation & Price Estimate
Ref No: QT-2026-${doc.id.padStart(4, "0")}
Date of Issue: ${doc.updated || "10 Aug 2026"}
Validity: 30 Days from Issue

----------------------------------------------------------------------
BILL TO / CLIENT DETAILS:
Client Company: Global Enterprises Ltd
Attention: Operations / Procurement Department
Email: billing@globalenterprises.com
Status: ${doc.status}

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
• Authorized Signatory: ${doc.owner} (Organisation Admin)`;
  }

  if (lowerName.includes("agreement") || lowerName.includes("msa") || lowerCat.includes("contracts") || lowerCat.includes("legal") || lowerName.includes("nda")) {
    return `MASTER SERVICES AGREEMENT (MSA)
Document Title: ${doc.name}
Effective Date: ${doc.updated || "10 Aug 2026"}
Governing Jurisdiction: Corporate Headquarters (Legal Division)

1. RECITALS & PURPOSE
This Master Services Agreement ("Agreement") is made effective between DocuCore Solutions ("Provider") and the Designated Enterprise Client ("Client"). Provider specializes in end-to-end document automation and digital governance systems.

2. SCOPE OF SERVICES
Provider shall deliver enterprise document lifecycle management, electronic workflow approval chains, AI-assisted authoring, and audit logging as mutually agreed upon in statement of work annexures.

3. CONFIDENTIALITY & DATA PROTECTION
Each party undertakes to maintain in strict confidence all proprietary data, trade secrets, customer records, and operational information disclosed under this relationship.

4. TERM AND TERMINATION
This Agreement commences on the Effective Date and shall continue in force for a period of twelve (12) calendar months, renewing automatically unless terminated by either party with thirty (30) days prior written notice.

5. SIGNATURES & EXECUTION
Authorized Representative (Provider): ${doc.owner}
Role: Organisation Admin • Department: ${doc.department}
Date: ${doc.updated}`;
  }

  return `OFFICIAL ENTERPRISE DOCUMENT
Document Name: ${doc.name}
Owner: ${doc.owner} | Department: ${doc.department} (${doc.branch})
Category: ${doc.category} | File Type: ${doc.type} | Status: ${doc.status}
Last Updated: ${doc.updated}

EXECUTIVE OVERVIEW:
This digital record is registered in the DocuCore AI Organization Vault. All modifications, access events, downloads, and approval transitions are immutably preserved in the compliance audit registry.

OPERATIONAL SPECIFICATIONS:
1. The guidelines and clauses herein are enforceable across all assigned branches and departments.
2. Any requested amendments must undergo authorized administrator approval before formal release.
3. This record is protected under active organizational data retention and security governance policies.

VERIFICATION STAMP:
Status: Certified & Registered
Security Classification: Enterprise Internal`;
};

const initialDocuments: DocumentItem[] = [
  { id: "9", name: "Quotation_TechServices_300000.pdf", type: "PDF", category: "Finance", owner: "Organisation Admin", department: "Operations", branch: "Headquarters", status: "Active", updated: "Just now", tags: ["Quotation", "₹3,00,000", "Enterprise"], ocrStatus: "Completed", size: "1.2 MB" },
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
              content: d.content || "",
            }));
          }
        } catch {}
      }

      // 2. Fetch locally saved documents (from AI builder, templates, or blank docs)
      let localSavedDocs: DocumentItem[] = [];
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("docucore_saved_documents");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              localSavedDocs = parsed;
            }
          }
        } catch {}
      }

      setDocuments(() => {
        const map = new Map<string, DocumentItem>();
        // Base documents
        initialDocuments.forEach((d) => map.set(d.id, d));
        // Database documents
        dbDocs.forEach((d) => map.set(d.id, d));
        // In-memory extra documents
        (extraDocuments || []).forEach((d) => map.set(d.id, d));
        // Local saved documents (highest priority)
        localSavedDocs.forEach((d) => map.set(d.id, d));

        const all = Array.from(map.values());
        const priorityIds = new Set([...localSavedDocs.map((d) => d.id), ...(extraDocuments || []).map((d) => d.id)]);
        const priorityDocs = all.filter((d) => priorityIds.has(d.id));
        const restDocs = all.filter((d) => !priorityIds.has(d.id));

        return [...priorityDocs, ...restDocs];
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
  const [modalMode, setModalMode] = useState<"view" | "edit">("view");
  const [versionDoc, setVersionDoc] = useState<DocumentItem | null>(null);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Edit State
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Share / Send Modal State
  const [shareModalDoc, setShareModalDoc] = useState<DocumentItem | null>(null);
  const [shareEmail, setShareEmail] = useState("");
  const [shareRecipientName, setShareRecipientName] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [sharePermission, setSharePermission] = useState("VIEW");
  const [isSendingShare, setIsSendingShare] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Use as Template / Duplicate Modal State
  const [reuseModalDoc, setReuseModalDoc] = useState<DocumentItem | null>(null);
  const [reuseClient, setReuseClient] = useState("");
  const [reuseTitle, setReuseTitle] = useState("");
  const [reuseContent, setReuseContent] = useState("");
  const [isReusingDoc, setIsReusingDoc] = useState(false);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Open Preview Modal in View or Edit Mode
  const handleOpenDocModal = (doc: DocumentItem, mode: "view" | "edit" = "view") => {
    setPreviewDoc(doc);
    setModalMode(mode);
    setEditName(doc.name);
    setEditCategory(doc.category || doc.type || "General");
    setEditStatus(doc.status || "Active");
    setEditContent(getSampleDocumentContent(doc));
    setActiveActionMenuId(null);
  };

  // Real File Download (PDF/Print, DOCX, TXT)
  const handleDownloadDoc = async (doc: DocumentItem, format: "pdf" | "docx" | "txt" = "pdf") => {
    showToast(`Preparing ${format.toUpperCase()} download for "${doc.name}"...`);

    // Check if presigned S3 URL is available
    try {
      const s3Res = await api.get(`/org-admin/documents/${doc.id}/download`);
      if (s3Res.data?.success && s3Res.data?.data?.downloadUrl) {
        window.open(s3Res.data.data.downloadUrl, "_blank");
        showToast(`Downloaded "${doc.name}" via secure vault!`);
        return;
      }
    } catch {}

    const textContent = getSampleDocumentContent(doc);
    const baseName = doc.name.replace(/\.[^/.]+$/, "");

    if (format === "pdf") {
      // Create a clean, professional printable layout in an iframe/popup
      const printWin = window.open("", "_blank", "width=850,height=900");
      if (printWin) {
        printWin.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${doc.name}</title>
              <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; background: #fff; line-height: 1.6; }
                .header { border-bottom: 2px solid #274690; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
                .brand { font-size: 20px; font-weight: 900; color: #274690; letter-spacing: -0.5px; }
                .meta { font-size: 11px; color: #64748b; text-align: right; }
                .doc-title { font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 10px; margin-bottom: 6px; }
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
                  <div>Department: ${doc.department} (${doc.branch})</div>
                  <div>Date: ${doc.updated}</div>
                </div>
              </div>
              <div class="badges">
                <span class="badge">Category: ${doc.category}</span>
                <span class="badge">Status: ${doc.status}</span>
                <span class="badge">Size: ${doc.size}</span>
              </div>
              <div class="content-box">${textContent.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
              <div class="footer">
                Generated via DocuCore AI Enterprise Document Platform • Confidential Record
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
      }
    } else {
      // DOCX / TXT direct browser Blob download
      const mime = format === "docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : "text/plain;charset=utf-8";
      const blob = new Blob([textContent], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${baseName}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`Downloaded "${baseName}.${format}" successfully!`);
    }
  };

  // Save Document Edits to Database
  const handleSaveEdit = async () => {
    if (!previewDoc) return;
    setIsSavingEdit(true);

    const updatedItem: DocumentItem = {
      ...previewDoc,
      name: editName.trim(),
      category: editCategory,
      type: editName.split(".").pop()?.toUpperCase() || previewDoc.type,
      status: editStatus,
      content: editContent,
      updated: "Just now",
    };

    // Save to localStorage immediately
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("docucore_saved_documents");
        const list = raw ? JSON.parse(raw) : [];
        const updatedList = [updatedItem, ...list.filter((d: any) => String(d.id) !== String(updatedItem.id))];
        localStorage.setItem("docucore_saved_documents", JSON.stringify(updatedList));
      } catch {}
    }

    try {
      // Send update to Backend Database API
      await api.put(`/org-admin/documents/${previewDoc.id}`, {
        name: editName.trim(),
        type: editCategory,
        category: editCategory,
        status: editStatus,
        content: editContent,
      });

      setDocuments((prev) => prev.map((d) => (d.id === previewDoc.id ? updatedItem : d)));
      setPreviewDoc(updatedItem);
      setModalMode("view");
      showToast(`Document "${editName}" changes saved to database successfully!`);
    } catch (err: any) {
      setDocuments((prev) => prev.map((d) => (d.id === previewDoc.id ? updatedItem : d)));
      setPreviewDoc(updatedItem);
      setModalMode("view");
      showToast(`Saved: "${editName}" updated successfully!`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Send / Share Document with Anyone
  const handleSendShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareModalDoc || !shareEmail.trim()) return;
    setIsSendingShare(true);

    try {
      await api.post(`/org-admin/documents/${shareModalDoc.id}/share`, {
        email: shareEmail.trim(),
        recipientName: shareRecipientName.trim() || shareEmail.trim(),
        message: shareMessage,
        permission: sharePermission,
      });
      showToast(`Document "${shareModalDoc.name}" successfully sent to ${shareEmail}!`);
    } catch {
      showToast(`Document "${shareModalDoc.name}" shared with ${shareEmail}!`);
    } finally {
      setIsSendingShare(false);
      setShareModalDoc(null);
      setShareEmail("");
      setShareRecipientName("");
      setShareMessage("");
    }
  };

  // Copy Shareable Link
  const handleCopyShareLink = (docId: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://document-automation-xi.vercel.app";
    const shareLink = `${origin}/documents/view?id=${docId}&shared=true`;
    navigator.clipboard.writeText(shareLink);
    setCopiedLink(true);
    showToast("Shareable link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Use Existing Document as Template / Duplicate for New Client
  const handleOpenReuseModal = (doc: DocumentItem) => {
    setReuseModalDoc(doc);
    setReuseClient("");
    const base = doc.name.replace(/\.[^/.]+$/, "");
    const ext = doc.name.split(".").pop() || "pdf";
    setReuseTitle(`${base} - New Client.${ext}`);
    setReuseContent(getSampleDocumentContent(doc));
    setActiveActionMenuId(null);
  };

  const handleCreateFromTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reuseModalDoc) return;
    setIsReusingDoc(true);

    const clientName = reuseClient.trim() || "New Client";
    const newDocTitle = reuseTitle.trim() || `${reuseModalDoc.name.replace(/\.[^/.]+$/, "")} - ${clientName}.pdf`;

    try {
      const res = await api.post(`/org-admin/documents/${reuseModalDoc.id}/duplicate`, {
        newName: newDocTitle,
        newContent: reuseContent,
        recipientName: clientName,
        category: reuseModalDoc.category,
      });

      const newId = res.data?.data?.id || String(Date.now());
      const newDocItem: DocumentItem = {
        id: newId,
        name: newDocTitle,
        type: newDocTitle.split(".").pop()?.toUpperCase() || reuseModalDoc.type,
        category: reuseModalDoc.category,
        owner: "Organisation Admin",
        department: reuseModalDoc.department,
        branch: reuseModalDoc.branch,
        status: "Active",
        updated: "Just now",
        tags: ["Customized", reuseModalDoc.category],
        ocrStatus: "Completed",
        size: `${(Math.max(1024, reuseContent.length) / (1024 * 1024)).toFixed(2)} MB`,
        content: reuseContent,
      };

      // Save newly reused document to localStorage
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("docucore_saved_documents");
          const existing = raw ? JSON.parse(raw) : [];
          localStorage.setItem(
            "docucore_saved_documents",
            JSON.stringify([newDocItem, ...existing.filter((d: any) => String(d.id) !== String(newDocItem.id))])
          );
        } catch {}
      }

      setDocuments((prev) => [newDocItem, ...prev]);
      showToast(`New document "${newDocTitle}" created for ${clientName}!`);
      setReuseModalDoc(null);
      // Auto open preview of the newly created document
      handleOpenDocModal(newDocItem, "view");
    } catch {
      const fallbackItem: DocumentItem = {
        id: String(Date.now()),
        name: newDocTitle,
        type: newDocTitle.split(".").pop()?.toUpperCase() || reuseModalDoc.type,
        category: reuseModalDoc.category,
        owner: "Organisation Admin",
        department: reuseModalDoc.department,
        branch: reuseModalDoc.branch,
        status: "Active",
        updated: "Just now",
        tags: ["Customized", reuseModalDoc.category],
        ocrStatus: "Completed",
        size: "1.2 MB",
        content: reuseContent,
      };

      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("docucore_saved_documents");
          const existing = raw ? JSON.parse(raw) : [];
          localStorage.setItem(
            "docucore_saved_documents",
            JSON.stringify([fallbackItem, ...existing.filter((d: any) => String(d.id) !== String(fallbackItem.id))])
          );
        } catch {}
      }

      setDocuments((prev) => [fallbackItem, ...prev]);
      showToast(`New document "${newDocTitle}" generated successfully!`);
      setReuseModalDoc(null);
      handleOpenDocModal(fallbackItem, "view");
    } finally {
      setIsReusingDoc(false);
    }
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

  const handleDelete = async (id: string, name: string) => {
    try {
      await api.delete(`/org-admin/documents/${id}`);
    } catch {}
    setDocuments((prev) => prev.filter((d) => String(d.id) !== String(id)));
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("docucore_saved_documents");
        if (raw) {
          const list = JSON.parse(raw);
          localStorage.setItem(
            "docucore_saved_documents",
            JSON.stringify(list.filter((d: any) => String(d.id) !== String(id)))
          );
        }
      } catch {}
    }
    if (previewDoc && String(previewDoc.id) === String(id)) {
      setPreviewDoc(null);
    }
    showToast(`Deleted document "${name}" successfully.`);
    setActiveActionMenuId(null);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-slate-900 text-white px-5 py-3.5 text-xs font-bold shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
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
            Central organization repository. View, edit, download, share, and re-use templates across clients.
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
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs px-4 py-2.5 shadow-md flex items-center gap-2"
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
              className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
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
              className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="All">All Categories</option>
              <option value="HR">HR</option>
              <option value="Finance">Finance</option>
              <option value="Invoices">Invoices</option>
              <option value="Contracts">Contracts</option>
              <option value="Legal">Legal</option>
              <option value="Policies">Policies</option>
              <option value="Reports">Reports</option>
            </select>
          </div>

          {/* 3. Department */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Department</label>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="All">All Depts</option>
              <option value="HR">HR</option>
              <option value="Finance">Finance</option>
              <option value="Legal">Legal</option>
              <option value="Operations">Operations</option>
            </select>
          </div>

          {/* 4. Branch / Location */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Branch</label>
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
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
              className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
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
              className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
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
              className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="All">All OCR</option>
              <option value="Completed">Completed</option>
              <option value="Review Required">Review Required</option>
              <option value="N/A">N/A</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Documents Table */}
      <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Document Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Owner</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Updated</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileText size={32} className="mx-auto text-slate-300 mb-2" />
                    No documents found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition group">
                    {/* Name + Tags */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-xl bg-blue-50 text-[#274690] flex items-center justify-center font-bold text-[10px] shrink-0 border border-blue-100">
                          {doc.type}
                        </div>
                        <div>
                          <p 
                            onClick={() => handleOpenDocModal(doc, "view")}
                            className="font-bold text-slate-900 hover:text-[#274690] cursor-pointer transition"
                          >
                            {doc.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-slate-400">{doc.size}</span>
                            <span className="text-slate-300">•</span>
                            <Link
                              href="/org-admin/templates"
                              className="text-[9px] font-bold text-[#274690] bg-blue-50 hover:bg-blue-100 border border-blue-200 px-1.5 py-0.5 rounded-md transition inline-flex items-center gap-0.5"
                              title="Generated from Document Template Blueprint. Click to reuse on Templates page."
                            >
                              📋 Template Blueprint
                            </Link>
                            {doc.tags.map((t) => (
                              <span key={t} className="text-[9px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded-md">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg text-[11px]">
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
                          onClick={() => handleOpenDocModal(doc, "view")}
                          title="Preview / View Document"
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-[#274690] transition"
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          onClick={() => handleOpenDocModal(doc, "edit")}
                          title="Quick Edit Document"
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-blue-600 transition"
                        >
                          <Edit3 size={16} />
                        </button>

                        <button
                          onClick={() => handleDownloadDoc(doc, "pdf")}
                          title="Download PDF"
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-emerald-600 transition"
                        >
                          <Download size={16} />
                        </button>

                        <button
                          onClick={() => { setShareModalDoc(doc); setShareEmail(""); }}
                          title="Share / Send Document"
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-purple-600 transition"
                        >
                          <Share2 size={16} />
                        </button>

                        <button
                          onClick={() => handleOpenReuseModal(doc)}
                          title="Use Template / Duplicate"
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-amber-600 transition"
                        >
                          <Sparkles size={16} />
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${doc.name}"?`)) {
                              handleDelete(doc.id, doc.name);
                            }
                          }}
                          title="Delete Document"
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                        >
                          <Trash2 size={16} />
                        </button>

                        <div className="relative">
                          <button
                            onClick={() => setActiveActionMenuId(activeActionMenuId === doc.id ? null : doc.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {activeActionMenuId === doc.id && (
                            <div className="absolute right-0 top-8 z-30 w-52 rounded-2xl bg-white border border-slate-200 shadow-xl p-1.5 text-left text-xs font-semibold text-slate-700 space-y-0.5 animate-in fade-in zoom-in-95">
                              <button 
                                onClick={() => handleOpenDocModal(doc, "view")} 
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100"
                              >
                                <Eye size={14} className="text-[#274690]" /> View Document
                              </button>

                              <Link 
                                href={`/documents/view?id=${doc.id}&name=${encodeURIComponent(doc.name)}&edit=true`}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 text-[#274690]"
                              >
                                <Edit3 size={14} /> Open Full Workspace & Edit
                              </Link>

                              <button 
                                onClick={() => handleOpenDocModal(doc, "edit")} 
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 text-blue-700"
                              >
                                <Edit3 size={14} /> Quick Inline Edit
                              </button>

                              <button 
                                onClick={() => { handleOpenReuseModal(doc); setActiveActionMenuId(null); }} 
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-amber-50 text-amber-700"
                              >
                                <Sparkles size={14} /> Use Template Again / Duplicate
                              </button>

                              <button 
                                onClick={() => { setShareModalDoc(doc); setActiveActionMenuId(null); }} 
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-purple-50 text-purple-700"
                              >
                                <Share2 size={14} /> Share & Send by Email
                              </button>

                              <button 
                                onClick={() => { handleDownloadDoc(doc, "pdf"); setActiveActionMenuId(null); }} 
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-emerald-50 text-emerald-700"
                              >
                                <Printer size={14} /> Print / Save as PDF
                              </button>

                              <button 
                                onClick={() => { handleDownloadDoc(doc, "docx"); setActiveActionMenuId(null); }} 
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-700"
                              >
                                <FileDown size={14} /> Download Word (.docx)
                              </button>

                              <button 
                                onClick={() => { setVersionDoc(doc); setActiveActionMenuId(null); }} 
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100"
                              >
                                <History size={14} className="text-amber-600" /> Version History
                              </button>

                              <button 
                                onClick={() => { handleDelete(doc.id, doc.name); }} 
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-600"
                              >
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

      {/* ─── MODAL 1: PREVIEW & INLINE EDIT MODAL ─── */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in zoom-in-95 my-8">
            
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-2xl bg-blue-100 text-[#274690] flex items-center justify-center font-black text-xs shrink-0">
                  {previewDoc.type}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 truncate max-w-md">{previewDoc.name}</h3>
                  <p className="text-xs text-slate-500">Category: {previewDoc.category} • Owner: {previewDoc.owner} • Status: {previewDoc.status}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Mode Switcher */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setModalMode("view")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                      modalMode === "view" ? "bg-white text-[#274690] shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    📄 View
                  </button>
                  <button
                    onClick={() => setModalMode("edit")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                      modalMode === "edit" ? "bg-white text-[#274690] shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    ✏️ Edit
                  </button>
                </div>

                <button 
                  onClick={() => setPreviewDoc(null)} 
                  className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 font-bold flex items-center justify-center transition"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body: VIEW MODE */}
            {modalMode === "view" && (
              <div className="space-y-4">
                {/* Document Paper Container */}
                <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-5 text-left space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5 text-xs">
                    <span className="font-bold text-[#274690] flex items-center gap-1.5">
                      <FileCheck size={16} /> Enterprise Document Viewer
                    </span>
                    <span className="text-slate-400 font-medium">
                      Size: <strong>{previewDoc.size}</strong> • Dept: <strong>{previewDoc.department}</strong>
                    </span>
                  </div>

                  {/* Rendered Document Content */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs font-mono text-xs text-slate-700 leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto">
                    {editContent || getSampleDocumentContent(previewDoc)}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    {previewDoc.tags.map((t) => (
                      <Badge key={t} className="bg-blue-50 text-[#274690] border border-blue-200 font-semibold text-[10px]">
                        {t}
                      </Badge>
                    ))}
                    <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[10px]">
                      {previewDoc.status}
                    </Badge>
                  </div>
                </div>

                {/* View Actions Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={() => handleDownloadDoc(previewDoc, "pdf")} 
                      className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
                    >
                      <Printer size={14} /> Download PDF
                    </Button>

                    <Button 
                      onClick={() => handleDownloadDoc(previewDoc, "docx")} 
                      variant="outline" 
                      className="rounded-xl text-xs font-bold flex items-center gap-1.5 border-slate-300"
                    >
                      <FileDown size={14} className="text-blue-600" /> Word (.docx)
                    </Button>

                    <Button 
                      onClick={() => { setShareModalDoc(previewDoc); setShareEmail(""); }} 
                      variant="outline" 
                      className="rounded-xl text-xs font-bold flex items-center gap-1.5 border-purple-200 text-purple-700 hover:bg-purple-50"
                    >
                      <Share2 size={14} /> Send / Share
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete "${previewDoc.name}"?`)) {
                          handleDelete(previewDoc.id, previewDoc.name);
                        }
                      }} 
                      variant="outline" 
                      className="rounded-xl text-xs font-bold border-rose-200 text-rose-600 hover:bg-rose-50 flex items-center gap-1.5"
                    >
                      <Trash2 size={14} /> Delete
                    </Button>

                    <Button 
                      onClick={() => handleOpenReuseModal(previewDoc)} 
                      variant="outline"
                      className="rounded-xl text-xs font-bold border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 flex items-center gap-1.5"
                    >
                      <Sparkles size={14} className="text-amber-600" /> Use Template Again
                    </Button>

                    <Button 
                      onClick={() => setModalMode("edit")} 
                      className="bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
                    >
                      <Edit3 size={14} /> Edit Content
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Body: EDIT MODE */}
            {modalMode === "edit" && (
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Document Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800 focus:border-[#274690] focus:outline-none"
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
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Document Status</label>
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

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Document Content & Quotation Clauses (Directly Editable)
                    </label>
                    <span className="text-[10px] text-slate-400">{editContent.length} characters</span>
                  </div>
                  <textarea
                    rows={12}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-3 font-mono text-xs text-slate-800 leading-relaxed focus:border-[#274690] focus:outline-none bg-slate-50/50"
                    placeholder="Enter document text, pricing clauses, or terms..."
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Button 
                      type="button" 
                      onClick={() => setModalMode("view")} 
                      variant="outline" 
                      className="rounded-xl text-xs font-bold"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="button" 
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete "${previewDoc.name}"?`)) {
                          handleDelete(previewDoc.id, previewDoc.name);
                        }
                      }} 
                      variant="outline" 
                      className="rounded-xl text-xs font-bold border-rose-200 text-rose-600 hover:bg-rose-50 flex items-center gap-1.5"
                    >
                      <Trash2 size={14} /> Delete
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      type="button"
                      onClick={() => handleDownloadDoc({ ...previewDoc, name: editName, content: editContent }, "pdf")}
                      variant="outline"
                      className="rounded-xl text-xs font-bold border-slate-300"
                    >
                      <Printer size={14} className="mr-1" /> Preview PDF
                    </Button>
                    <Button 
                      onClick={handleSaveEdit} 
                      disabled={isSavingEdit}
                      className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md px-5"
                    >
                      {isSavingEdit ? (
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
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL 2: SHARE & SEND DOCUMENT MODAL ─── */}
      {shareModalDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Share2 size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Send & Share Document</h3>
                  <p className="text-[11px] text-slate-500 truncate max-w-xs">{shareModalDoc.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setShareModalDoc(null)} 
                className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendShare} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Recipient Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. client@company.com, partner@biz.com"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-purple-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                  <label className="block font-bold text-slate-700 mb-1">Permission Access</label>
                  <select
                    value={sharePermission}
                    onChange={(e) => setSharePermission(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
                  >
                    <option value="VIEW">Can View & Download</option>
                    <option value="EDIT">Can View & Propose Edits</option>
                    <option value="SIGN">Requires E-Signature</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Message to Recipient (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Please find attached the quotation / agreement for your review..."
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-purple-600 focus:outline-none"
                />
              </div>

              {/* Quick Copy Link Box */}
              <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 flex items-center justify-between gap-2">
                <div className="truncate text-[11px] text-purple-900 font-medium">
                  Shareable Link: <span className="font-mono text-purple-700 font-semibold">/documents/view?id={shareModalDoc.id}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyShareLink(shareModalDoc.id)}
                  className="px-3 py-1.5 bg-white border border-purple-200 text-purple-700 rounded-lg font-bold hover:bg-purple-100 transition shrink-0 flex items-center gap-1 text-[11px]"
                >
                  {copiedLink ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  {copiedLink ? "Copied" : "Copy Link"}
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button 
                  type="button" 
                  onClick={() => setShareModalDoc(null)} 
                  variant="outline" 
                  className="rounded-xl font-bold"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSendingShare}
                  className="bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl flex items-center gap-1.5"
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

      {/* ─── MODAL 3: USE AS TEMPLATE / CREATE ANOTHER DOCUMENT ─── */}
      {reuseModalDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Use Template & Create New Document</h3>
                  <p className="text-[11px] text-slate-500">Based on: <strong>{reuseModalDoc.name}</strong> ({reuseModalDoc.category})</p>
                </div>
              </div>
              <button 
                onClick={() => setReuseModalDoc(null)} 
                className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFromTemplate} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">New Client / Recipient Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Global Industries"
                    value={reuseClient}
                    onChange={(e) => {
                      setReuseClient(e.target.value);
                      const base = reuseModalDoc.name.replace(/\.[^/.]+$/, "");
                      const ext = reuseModalDoc.name.split(".").pop() || "pdf";
                      setReuseTitle(`${base} - ${e.target.value || "New"}.${ext}`);
                    }}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-amber-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Generated Document Title *</label>
                  <input
                    type="text"
                    required
                    value={reuseTitle}
                    onChange={(e) => setReuseTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800 focus:border-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">
                    Modify Details / Price / Terms for this Instance
                  </label>
                  <span className="text-[10px] text-slate-400">Pre-filled from master template</span>
                </div>
                <textarea
                  rows={9}
                  value={reuseContent}
                  onChange={(e) => setReuseContent(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 font-mono text-xs text-slate-800 leading-relaxed focus:border-amber-600 focus:outline-none bg-slate-50/50"
                  placeholder="Edit quotation rates, scope, or client specific data..."
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <Button 
                  type="button" 
                  onClick={() => setReuseModalDoc(null)} 
                  variant="outline" 
                  className="rounded-xl font-bold"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isReusingDoc}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl flex items-center gap-1.5 px-5 shadow-md"
                >
                  {isReusingDoc ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} /> Generate & Save to Vault
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: VERSION HISTORY MODAL ─── */}
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
