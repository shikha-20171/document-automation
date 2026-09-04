"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Workflow,
  FileCheck,
  History,
  ScrollText,
  Plus,
  CheckCircle2,
} from "lucide-react";

import WorkflowsTab from "./_components/WorkflowsTab";
import ApprovalRequestsTab from "./_components/ApprovalRequestsTab";
import WorkflowHistoryTab from "./_components/WorkflowHistoryTab";
import ApprovalHistoryTab from "./_components/ApprovalHistoryTab";

import CreateWorkflowModal from "./_components/CreateWorkflowModal";

const tabsConfig = [
  { id: "workflows", label: "Workflows", icon: Workflow },
  { id: "approval-requests", label: "Approval Requests", icon: FileCheck },
  { id: "workflow-history", label: "Workflow History", icon: History },
  { id: "approval-history", label: "Approval History", icon: ScrollText },
];

function WorkflowsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentTabFromUrl = searchParams?.get("tab") || "workflows";
  const activeTab = currentTabFromUrl;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [globalToast, setGlobalToast] = useState<string | null>(null);

  const handleTabChange = (tabId: string) => {
    router.push(`/org-admin/workflows?tab=${tabId}`);
  };

  const showToast = (msg: string) => {
    setGlobalToast(msg);
    setTimeout(() => setGlobalToast(null), 3500);
  };

  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-12">
      {/* Toast Notification */}
      {globalToast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-linear-to-r from-[#1f3561] to-[#274690] text-white px-5 py-3.5 text-xs font-bold shadow-2xl flex items-center gap-2.5 border border-white/20 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 size={18} className="text-[#ffd9a0]" />
          <span>{globalToast}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#274690]/10 text-[#274690] text-xs font-bold">
            <Workflow size={14} /> Organisation Admin Workflows Module
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Workflows & Approvals
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage document routing, approval chains, rules, execution history, and audit logs.
          </p>
        </div>

        {/* Global Action Header Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 bg-[#274690] hover:bg-[#1f3561] text-white font-bold rounded-2xl text-xs px-4 py-2.5 shadow-md transition"
          >
            <Plus size={16} /> + Create Workflow
          </button>
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
        {activeTab === "workflows" && (
          <WorkflowsTab
            key={refreshKey}
            onOpenCreate={() => setIsCreateOpen(true)}
            showToast={showToast}
          />
        )}
        {activeTab === "approval-requests" && <ApprovalRequestsTab showToast={showToast} />}
        {activeTab === "workflow-history" && <WorkflowHistoryTab />}
        {activeTab === "approval-history" && <ApprovalHistoryTab showToast={showToast} />}
      </div>

      {/* Interactive Modals */}
      <CreateWorkflowModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          showToast("Workflow created successfully!");
          setIsCreateOpen(false);
          setRefreshKey((k) => k + 1);
        }}
      />
    </div>
  );
}

export default function OrgAdminWorkflowsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs font-bold text-slate-400">
          Loading Workflows & Approvals...
        </div>
      }
    >
      <WorkflowsPageContent />
    </Suspense>
  );
}
