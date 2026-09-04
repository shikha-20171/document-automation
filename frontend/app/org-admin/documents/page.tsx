"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Files, 
  User, 
  Share2, 
  FileQuestion, 
  CheckSquare, 
  Layout,  
  Tags, 
  ScanText, 
  Workflow, 
  Archive, 
  History,
  Plus,
  Upload,
  CheckCircle2,
  FileText
} from "lucide-react";

import DashboardTab from "./_components/DashboardTab";
import AllDocumentsTab from "./_components/AllDocumentsTab";
import MyDocumentsTab from "./_components/MyDocumentsTab";
import SharedDocumentsTab from "./_components/SharedDocumentsTab";
import ApprovalsTab from "./_components/ApprovalsTab";
import ActivityAuditTab from "./_components/ActivityAuditTab";

import CreateDocumentModal from "./_components/CreateDocumentModal";
import UploadDocumentModal from "./_components/UploadDocumentModal";

const tabsConfig = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "all-documents", label: "All Documents", icon: Files },
  { id: "my-documents", label: "My Documents", icon: User },
  { id: "shared-documents", label: "Shared Documents", icon: Share2 },
  { id: "approvals", label: "Approvals", icon: CheckSquare },
  { id: "activity-audit", label: "Activity / Audit", icon: History },
];

function DocumentsPageContent() {
  const searchParams = useSearchParams(); 
  const router = useRouter();

  const currentTabFromUrl = searchParams?.get("tab") || "dashboard";
  const [activeTab, setActiveTab] = useState(currentTabFromUrl);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [globalToast, setGlobalToast] = useState<string | null>(null);

  useEffect(() => {
    if (currentTabFromUrl && currentTabFromUrl !== activeTab) {
      setActiveTab(currentTabFromUrl);
    }
  }, [currentTabFromUrl]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    router.push(`/org-admin/documents?tab=${tabId}`);
  };

  const showToast = (msg: string) => {
    setGlobalToast(msg);
    setTimeout(() => setGlobalToast(null), 3500);
  };

  const [extraDocuments, setExtraDocuments] = useState<any[]>([]);

  const handleCreateSuccess = (docName: string, newDoc?: any) => {
    if (newDoc) {
      setExtraDocuments((prev) => [newDoc, ...prev]);
    }
    showToast(`Successfully created "${docName}"! Added to All Documents.`);
    setActiveTab("all-documents");
  };

  const handleUploadSuccess = (fileName: string, customDoc?: any) => {
    const uploadedDoc = customDoc || {
      id: `doc-${Date.now()}`,
      name: fileName,
      type: fileName.endsWith(".pdf") ? "PDF" : fileName.endsWith(".xlsx") ? "XLSX" : "DOCX",
      category: "General",
      owner: "Organisation Admin",
      department: "Operations",
      branch: "Headquarters",
      status: "Active",
      updated: "Just now",
      tags: ["Uploaded", "Repository"],
      ocrStatus: "Completed",
      size: "1.2 MB",
    };
    setExtraDocuments((prev) => [uploadedDoc, ...prev]);
    showToast(`Successfully uploaded "${fileName}"! Saved to document repository.`);
    setActiveTab("all-documents");
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-12">
      {/* Toast Notification */}
      {globalToast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-gradient-to-r from-[#1f3561] to-[#274690] text-white px-5 py-3.5 text-xs font-bold shadow-2xl flex items-center gap-2.5 border border-white/20 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 size={18} className="text-[#ffd9a0]" />
          <span>{globalToast}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#274690]/10 text-[#274690] text-xs font-bold">
            <FileText size={14} /> Organisation Admin Documents Module
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Documents System
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage organization document repository, approval workflows, personal files, shared permissions, and security audit logs.
          </p>
        </div>
      </div>

        
      {/* Primary Sub-Section Nav Tabs Bar */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto scrollbar-none flex items-center gap-1.5">
        {tabsConfig.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-[#274690] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon size={15} className={isActive ? "text-[#ffd9a0]" : "text-slate-400"} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Sub-Tab View Rendering */}
      <div>
        {activeTab === "dashboard" && (
          <DashboardTab
            onNavigateTab={handleTabChange}
            onOpenUpload={() => setIsUploadOpen(true)}
            onOpenCreate={() => setIsCreateOpen(true)}
          />
        )}

        {activeTab === "all-documents" && (
          <AllDocumentsTab
            onOpenCreate={() => setIsCreateOpen(true)}
            onOpenUpload={() => setIsUploadOpen(true)}
            extraDocuments={extraDocuments}
          />
        )}

        {activeTab === "my-documents" && (
          <MyDocumentsTab
            onOpenCreate={() => setIsCreateOpen(true)}
            onOpenUpload={() => setIsUploadOpen(true)}
          />
        )}

        {activeTab === "shared-documents" && <SharedDocumentsTab />}

        {activeTab === "approvals" && <ApprovalsTab />}

        {activeTab === "activity-audit" && <ActivityAuditTab />}
      </div>

      {/* Interactive Modals */}
      <CreateDocumentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <UploadDocumentModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={handleUploadSuccess}
      />npnm
    </div>
  );
}

export default function OrgAdminDocumentsPage() {
  return (
    <Suspense fallback={
      <div className="p-8 text-center text-xs font-bold text-slate-400">
        Loading Document Management System...
      </div>
    }>
      <DocumentsPageContent />
    </Suspense>
  );
}
