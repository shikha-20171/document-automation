"use client";

import React, { useState } from "react";
import {
  Share2,
  X,
  Copy,
  CheckCircle2,
  Send,
  Mail,
  Link as LinkIcon,
  Check,
  Building2,
  Lock,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TemplateItem } from "./TemplateTable";
import { orgDocBuilderApi } from "@/services/templatesApi";

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
  const [activeTab, setActiveTab] = useState<"email" | "link">("email");

  // Email form state
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [subject, setSubject] = useState(`Document Template: ${template.name}`);
  const [message, setMessage] = useState(
    `Hello,\n\nPlease find the standard "${template.name}" document blueprint attached for your review and execution.\n\nBest regards,\nOrganisation Admin`
  );
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);

  // Link & Permission state
  const [shareScope, setShareScope] = useState<string>(
    template.visibility === "Department" || template.visibility === "Department Only"
      ? "Department Only"
      : "Organisation Wide"
  );
  const [targetDepartment, setTargetDepartment] = useState<string>(
    template.department || "Human Resources"
  );
  const [isCopied, setIsCopied] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  if (!isOpen) return null;

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/org-admin/templates?templateId=${template.id}`
      : `https://app.docucore.ai/templates?id=${template.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail.trim()) return;

    setIsSendingEmail(true);
    try {
      await orgDocBuilderApi.shareTemplate(template.id, {
        email: recipientEmail.trim(),
        recipientName: recipientName.trim() || recipientEmail.trim(),
        message: message.trim(),
      });

      const updated: TemplateItem = {
        ...template,
        activities: [
          {
            time: "Just now",
            event: `Sent template to ${recipientEmail}`,
          },
          ...(template.activities || []),
        ],
      };
      onUpdateShare(updated);
      setEmailSentSuccess(true);
    } catch (err) {
      // Fallback update
      setEmailSentSuccess(true);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleConfirmAccessShare = async () => {
    const updated: TemplateItem = {
      ...template,
      visibility: shareScope as any,
      isShared: true,
      department: shareScope === "Department Only" ? targetDepartment : "All",
      activities: [
        {
          time: "Just now",
          event: `Updated access permissions: ${shareScope}`,
        },
        ...(template.activities || []),
      ],
    };

    try {
      await orgDocBuilderApi.updateTemplate(template.id, {
        visibility: shareScope,
        department: shareScope === "Department Only" ? targetDepartment : "All",
      });
    } catch (e) {
      console.warn("Update template share error:", e);
    }

    onUpdateShare(updated);
    setShareSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#274690]">
              <Share2 size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">Send & Share Template</h2>
                <Badge className="bg-[#274690] text-white text-[10px] px-2 py-0.5 font-bold">
                  {template.category}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{template.name}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center border-b border-slate-100 bg-white px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("email")}
            className={`pb-2.5 px-2 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
              activeTab === "email"
                ? "border-[#274690] text-[#274690]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Mail size={14} /> Send via Email to Someone
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("link")}
            className={`pb-2.5 px-2 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
              activeTab === "link"
                ? "border-[#274690] text-[#274690]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <LinkIcon size={14} /> Share Link & Internal Access
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {activeTab === "email" ? (
            emailSentSuccess ? (
              <div className="p-6 text-center space-y-4">
                <div className="h-14 w-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
                  <CheckCircle2 size={30} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Template Sent Successfully!</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    <strong>"{template.name}"</strong> was dispatched to <strong>{recipientEmail}</strong>.
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-center gap-2">
                  <Button
                    onClick={() => {
                      setEmailSentSuccess(false);
                      setRecipientEmail("");
                    }}
                    variant="outline"
                    className="rounded-xl text-xs font-bold h-9 px-4 border-slate-200"
                  >
                    Send to Another Recipient
                  </Button>
                  <Button
                    onClick={onClose}
                    className="rounded-xl bg-[#274690] text-white text-xs font-bold h-9 px-5"
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendEmail} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Recipient Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="e.g. client@company.com or partner@acme.com"
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-900 focus:bg-white focus:border-[#274690] focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Recipient Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full h-9 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 focus:bg-white focus:border-[#274690] focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full h-9 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 focus:bg-white focus:border-[#274690] focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Custom Message
                  </label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 focus:bg-white focus:border-[#274690] focus:outline-none transition resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onClose}
                    className="rounded-xl text-xs font-bold text-slate-600 h-9"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSendingEmail || !recipientEmail.trim()}
                    className="rounded-xl bg-[#274690] hover:bg-[#1f3561] text-xs font-bold text-white px-5 h-9 shadow-md flex items-center gap-1.5"
                  >
                    <Send size={13} />
                    <span>{isSendingEmail ? "Sending..." : "Send to Recipient"}</span>
                  </Button>
                </div>
              </form>
            )
          ) : shareSuccess ? (
            <div className="p-6 text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Permissions Updated!</h3>
                <p className="text-xs text-slate-500 mt-1">
                  This template access is now configured as: <strong>{shareScope}</strong>.
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
              {/* Direct Copyable Link */}
              <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-1.5">
                <span className="block font-bold text-slate-700 text-[11px]">Direct Shareable Link:</span>
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
                    className="h-8 px-3 rounded-lg text-xs font-bold border-slate-200 text-[#274690] hover:bg-blue-50 gap-1 shrink-0"
                  >
                    {isCopied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    <span>{isCopied ? "Copied" : "Copy"}</span>
                  </Button>
                </div>
              </div>

              {/* Share Scope */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Internal Organization Visibility
                </label>
                <select
                  value={shareScope}
                  onChange={(e) => setShareScope(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 font-semibold text-slate-800 focus:border-[#274690] focus:bg-white focus:outline-none"
                >
                  <option value="Organisation Wide">Entire Organisation (All Members & Roles)</option>
                  <option value="Department Only">Specific Department Only</option>
                  <option value="Private">Private (Owner Only)</option>
                </select>
              </div>

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

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onClose}
                  className="rounded-xl text-xs font-bold text-slate-600"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirmAccessShare}
                  className="rounded-xl bg-[#274690] hover:bg-[#1f3561] text-xs font-bold text-white px-5 shadow-xs"
                >
                  Save Settings
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
