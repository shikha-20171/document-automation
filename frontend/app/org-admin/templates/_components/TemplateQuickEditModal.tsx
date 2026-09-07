"use client";

import React, { useState } from "react";
import { X, Save, Sparkles, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TemplateItem } from "./TemplateTable";

interface TemplateQuickEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: TemplateItem;
  onSave: (updated: TemplateItem) => void;
}

const COMMON_TAGS = [
  "{{client_name}}",
  "{{client_company}}",
  "{{client_email}}",
  "{{total_amount}}",
  "{{today_date}}",
  "{{joining_date}}",
  "{{employee_name}}",
  "{{designation}}",
  "{{organisation_name}}",
  "{{manager_name}}",
];

export default function TemplateQuickEditModal({
  isOpen,
  onClose,
  template,
  onSave,
}: TemplateQuickEditModalProps) {
  const [name, setName] = useState(template.name);
  const [category, setCategory] = useState(template.category);
  const [description, setDescription] = useState(template.description || "");
  const [status, setStatus] = useState(template.status || "Active");
  const [content, setContent] = useState(template.content || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleInsertTag = (tag: string) => {
    setContent((prev) => prev + (prev.endsWith("\n") ? "" : " ") + tag + " ");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const updated: TemplateItem = {
        ...template,
        name: name.trim(),
        category,
        description: description.trim(),
        status: status as any,
        content,
        updated: "Just now",
        activities: [
          { time: "Just now", event: `Updated template content & settings` },
          ...(template.activities || []),
        ],
      };

      await onSave(updated);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error("Save template error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 md:p-6 overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#274690]">
              <FileText size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">Edit Template Blueprint</h2>
                <Badge className="bg-[#274690] text-white text-[10px] px-2 py-0.5 font-bold">
                  {category}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Modify template clauses, placeholders, and structure. Changes apply to all future documents.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-900 focus:bg-white focus:border-[#274690] focus:outline-none transition"
                  placeholder="e.g. Commercial Proposal & Quotation"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#274690] focus:outline-none transition"
                >
                  <option value="Sales">Sales & Quotations</option>
                  <option value="Finance">Finance & Invoices</option>
                  <option value="HR">HR & Employment</option>
                  <option value="Legal">Legal & Agreements</option>
                  <option value="Procurement">Procurement & Orders</option>
                  <option value="Operations">Operations</option>
                  <option value="Compliance">Compliance</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description / Purpose
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of what this template is used for..."
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 focus:bg-white focus:border-[#274690] focus:outline-none transition"
              />
            </div>

            {/* Quick Variable Tags Picker */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-700">Quick Insert Variables:</span>
                <span className="text-[11px] text-slate-400">Click any variable to append into content</span>
              </div>
              <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-50 rounded-2xl border border-slate-200">
                {COMMON_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleInsertTag(tag)}
                    className="text-[11px] font-mono font-bold bg-white text-[#274690] hover:bg-blue-50 border border-blue-200 px-2 py-1 rounded-lg transition"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Template Markdown/Text Content */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Template Content & Clauses (Markdown / Plain Text) *
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {content.length} characters
                </span>
              </div>
              <textarea
                required
                rows={14}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="# TEMPLATE TITLE&#10;&#10;Enter your clauses, paragraphs and dynamic placeholders like {{client_name}} here..."
                className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50/50 font-mono text-xs leading-relaxed text-slate-900 focus:bg-white focus:border-[#274690] focus:outline-none transition resize-y"
              />
            </div>
          </div>

          {/* Footer Bar */}
          <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="h-10 px-4 rounded-xl text-xs font-bold text-slate-600"
            >
              Cancel
            </Button>

            <div className="flex items-center gap-2">
              {saveSuccess && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  <CheckCircle2 size={14} /> Saved successfully!
                </div>
              )}

              <Button
                type="submit"
                disabled={isSaving || !name.trim()}
                className="h-10 px-6 rounded-xl bg-[#274690] hover:bg-[#1f3561] text-white text-xs font-bold shadow-md flex items-center gap-2"
              >
                <Save size={15} />
                <span>{isSaving ? "Saving Changes..." : "Save Template"}</span>
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
