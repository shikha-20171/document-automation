"use client";

import React, { useState } from "react";
import {
  Share2,
  X,
  Copy,
  CheckCircle2,
  Users,
  Building2,
  Lock,
  Link as LinkIcon,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TemplateItem } from "./TemplateTable";

interface TemplateShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: TemplateItem;
  onUpdateShare: (updatedTemplate: TemplateItem) => void;
}

export default function TemplateShareModal({
  isOpen,
  onClose,
  template,
  onUpdateShare,
}: TemplateShareModalProps) {
  const [shareScope, setShareScope] = useState<string>(
    template.visibility === "Department" || template.visibility === "Department Only"
      ? "Department Only"
      : "Organisation Wide"
  );
  const [targetDepartment, setTargetDepartment] = useState<string>(template.department || "Human Resources");
  const [accessLevel, setAccessLevel] = useState<string>("Can Use to Generate Documents");
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/org-admin/templates?templateId=${template.id}`
    : `https://app.docucore.ai/templates?id=${template.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleConfirmShare = () => {
    const updated: TemplateItem = {
      ...template,
      visibility: shareScope as any,
      isShared: true,
      department: shareScope === "Department Only" ? targetDepartment : "All",
      activities: [
        { time: "Just now", event: `Shared with: ${shareScope === "Department Only" ? targetDepartment : "Organisation"}` },
        ...(template.activities || []),
      ],
    };

    // Save to local storage for persistence across sessions
    if (typeof window !== "undefined") {
      try {
        const stored = JSON.parse(localStorage.getItem("org_custom_templates") || "[]");
        const filtered = stored.filter((s: TemplateItem) => s.id !== template.id);
        localStorage.setItem("org_custom_templates", JSON.stringify([updated, ...filtered]));
      } catch {}
    }

    onUpdateShare(updated);
    setIsSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-5 border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#274690]">
              <Share2 size={18} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Share Template</h2>
              <p className="text-xs text-slate-500 font-medium">{template.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X size={18} />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-6 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Template Shared Successfully!</h3>
              <p className="text-xs text-slate-500 mt-1">
                This template is now accessible to{" "}
                <strong>
                  {shareScope === "Department Only" ? `${targetDepartment} Department` : "the Entire Organisation"}
                </strong>.
              </p>
            </div>
            <Button
              onClick={onClose}
              className="w-full rounded-xl bg-[#274690] text-white text-xs font-bold h-10"
            >
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Share Scope */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Who can access this template?</label>
              <select
                value={shareScope}
                onChange={(e) => setShareScope(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 font-semibold text-slate-800 focus:border-[#274690] focus:bg-white focus:outline-none"
              >
                <option value="Organisation Wide">Entire Organisation (All Departments & Roles)</option>
                <option value="Department Only">Specific Department Only</option>
                <option value="Team Only">Specific Team Only</option>
                <option value="Private">Private (Owner Only)</option>
              </select>
            </div>

            {/* Department Selection if Department Only */}
            {shareScope === "Department Only" && (
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Target Department</label>
                <select
                  value={targetDepartment}
                  onChange={(e) => setTargetDepartment(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 font-semibold text-slate-800 focus:border-[#274690] focus:bg-white focus:outline-none"
                >
                  <option value="Human Resources">Human Resources (HR)</option>
                  <option value="Legal">Legal & Compliance</option>
                  <option value="Finance">Finance & Accounting</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Sales">Sales & Business Development</option>
                  <option value="Operations">Operations</option>
                  <option value="Procurement">Procurement</option>
                </select>
              </div>
            )}

            {/* Access Permission */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Permission Level</label>
              <select
                value={accessLevel}
                onChange={(e) => setAccessLevel(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 font-semibold text-slate-800 focus:border-[#274690] focus:bg-white focus:outline-none"
              >
                <option>Can Use to Generate Documents (Read/Fill)</option>
                <option>Can Edit & Update Template Blueprint (Collaborator)</option>
              </select>
            </div>

            {/* Direct Copyable Link */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <span className="block font-bold text-slate-600 text-[11px]">Direct Shareable Link:</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-[11px] font-mono text-slate-600 focus:outline-none truncate"
                />
                <Button
                  size="sm"
                  type="button"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="h-8 px-2.5 rounded-lg text-xs font-bold border-slate-200 text-[#274690] hover:bg-blue-50 gap-1 shrink-0"
                >
                  {isCopied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  <span>{isCopied ? "Copied" : "Copy"}</span>
                </Button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button size="sm" variant="ghost" onClick={onClose} className="rounded-xl text-xs font-bold text-slate-600">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmShare}
                className="rounded-xl bg-[#274690] hover:bg-[#1f3561] text-xs font-bold text-white px-5 shadow-xs"
              >
                Save & Share
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
