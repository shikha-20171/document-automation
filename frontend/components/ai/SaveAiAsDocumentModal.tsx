"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Building,
  Users,
  Folder,
  Tag,
  CheckCircle2,
  Lock,
  Sparkles,
  Save,
  X,
  Bot,
  AlertCircle,
  FileCheck,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { aiDocumentService } from "@/services/ai/aiDocumentService";

interface SaveAiAsDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  suggestedTitle?: string;
  sourceType?: string;
  aiProvider?: string;
  aiModel?: string;
  conversationId?: string;
  messageId?: string;
  onSaved?: (savedDoc: any) => void;
}

export default function SaveAiAsDocumentModal({
  isOpen,
  onClose,
  content,
  suggestedTitle = "AI Generated Document",
  sourceType = "AI Assistant",
  aiProvider = "Google Gemini",
  aiModel = "Gemini 3.6 Flash",
  conversationId,
  messageId,
  onSaved,
}: SaveAiAsDocumentModalProps) {
  const [docTitle, setDocTitle] = useState(suggestedTitle);
  const [docType, setDocType] = useState("Offer Letter");
  const [department, setDepartment] = useState("Operations");
  const [team, setTeam] = useState("General Team");
  const [folder, setFolder] = useState("AI Documents");
  const [tagsInput, setTagsInput] = useState("AI Generated, Official");
  const [status, setStatus] = useState<"DRAFT" | "ACTIVE">("DRAFT");
  const [editedContent, setEditedContent] = useState(content);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDocTitle(suggestedTitle || "AI Generated Document");
      setEditedContent(content || "");
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, suggestedTitle, content]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim()) {
      setErrorMsg("Document title is required.");
      return;
    }
    if (!editedContent.trim()) {
      setErrorMsg("Document content cannot be empty.");
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      const tagsArray = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await aiDocumentService.saveAiContentAsDocument({
        title: docTitle.trim(),
        content: editedContent.trim(),
        documentType: docType,
        departmentName: department,
        teamName: team,
        folder,
        tags: tagsArray,
        status,
        aiMetadata: {
          provider: aiProvider,
          model: aiModel,
          feature: sourceType,
          conversationId,
          messageId,
        },
      });

      if (res.success || res.data) {
        setSuccessMsg(res.message || "Document saved to vault successfully!");
        if (onSaved) onSaved(res.data);
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to save document.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#131c36] max-w-2xl w-full rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-white/10 space-y-5 animate-in zoom-in-95 text-slate-800 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#274690] dark:text-[#8fb1ec] flex items-center justify-center font-black shadow-xs">
              <FileCheck size={22} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                Save AI Content as Document
                <Badge className="bg-[#274690] text-white text-[10px] font-bold">
                  {sourceType}
                </Badge>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generated via {aiProvider} ({aiModel}) • Preserves tenant & department ownership
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Status Banners */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 text-xs font-bold">
          {/* Document Title */}
          <div>
            <label className="text-slate-700 dark:text-slate-300 block mb-1">
              Document Title *
            </label>
            <Input
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              required
              placeholder="e.g. Employment Offer Letter - Senior Engineer"
              className="rounded-xl font-medium text-xs h-10 dark:bg-slate-900 dark:border-white/10"
            />
          </div>

          {/* Department, Team, Type grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1">
                <Building size={13} className="text-[#274690] dark:text-[#8fb1ec]" /> Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#274690]"
              >
                <option value="HR">HR & Recruitment</option>
                <option value="Legal">Legal & Compliance</option>
                <option value="Operations">Operations</option>
                <option value="Finance">Finance & Billing</option>
                <option value="Engineering">Engineering</option>
                <option value="General">General / Company-wide</option>
              </select>
            </div>

            <div>
              <label className="text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1">
                <Users size={13} className="text-[#274690] dark:text-[#8fb1ec]" /> Team (Optional)
              </label>
              <select
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#274690]"
              >
                <option value="Recruitment Team">Recruitment Team</option>
                <option value="Core Legal">Core Legal</option>
                <option value="Accounts Payable">Accounts Payable</option>
                <option value="General Team">General Team</option>
              </select>
            </div>

            <div>
              <label className="text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1">
                <FileText size={13} className="text-[#274690] dark:text-[#8fb1ec]" /> Document Type
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#274690]"
              >
                <option value="Offer Letter">Offer Letter</option>
                <option value="Employment Agreement">Employment Agreement</option>
                <option value="NDA">Non-Disclosure Agreement</option>
                <option value="Policy">Company Policy</option>
                <option value="Summary">Executive Summary</option>
                <option value="Report">Analysis Report</option>
                <option value="Memo">Internal Memorandum</option>
              </select>
            </div>
          </div>

          {/* Folder & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1">
                <Folder size={13} className="text-amber-500" /> Vault Folder
              </label>
              <Input
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                placeholder="AI Documents"
                className="rounded-xl font-medium text-xs h-10 dark:bg-slate-900 dark:border-white/10"
              />
            </div>

            <div>
              <label className="text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1">
                <Tag size={13} className="text-purple-500" /> Tags (Comma separated)
              </label>
              <Input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="AI Generated, Official"
                className="rounded-xl font-medium text-xs h-10 dark:bg-slate-900 dark:border-white/10"
              />
            </div>
          </div>

          {/* Status Radio */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-white/5 flex items-center justify-between">
            <div>
              <p className="font-extrabold text-slate-800 dark:text-slate-200">Initial Document State</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                Draft allows future team editing before workflow submission
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="docState"
                  checked={status === "DRAFT"}
                  onChange={() => setStatus("DRAFT")}
                  className="text-[#274690]"
                />
                <span>Draft</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="docState"
                  checked={status === "ACTIVE"}
                  onChange={() => setStatus("ACTIVE")}
                  className="text-[#274690]"
                />
                <span>Active</span>
              </label>
            </div>
          </div>

          {/* Content Preview & Review */}
          <div>
            <label className="text-slate-700 dark:text-slate-300 block mb-1">
              Document Content (Review / Edit Before Saving)
            </label>
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={6}
              required
              className="w-full rounded-xl p-3 font-mono text-xs border border-slate-200 dark:border-white/10 bg-slate-950 text-emerald-400 focus:outline-none focus:ring-2 focus:ring-[#274690] leading-relaxed"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl text-xs font-bold h-10 border-slate-200 dark:border-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || Boolean(successMsg)}
              className="bg-[#274690] hover:bg-[#1f3561] text-white font-black text-xs rounded-xl h-10 px-5 gap-1.5 shadow-md shadow-[#274690]/20"
            >
              {saving ? (
                <Clock className="animate-spin" size={14} />
              ) : (
                <Save size={14} />
              )}
              <span>{saving ? "Saving Document..." : "Save to Documents"}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
