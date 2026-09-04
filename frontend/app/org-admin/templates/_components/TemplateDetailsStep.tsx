"use client";

import React, { useState } from "react";
import {
  FileText,
  Building2,
  Users,
  Shield,
  Layers,
  ArrowRight,
  X,
  Sparkles,
  Info,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type TemplateVisibility = "Organisation Wide" | "Department Only" | "Team Only" | "Private";

export interface TemplateDetailsData {
  name: string;
  description: string;
  category: string;
  visibility: TemplateVisibility;
  department?: string;
  team?: string;
  tags: string[];
}

interface TemplateDetailsStepProps {
  initialData?: Partial<TemplateDetailsData>;
  onCancel: () => void;
  onNext: (data: TemplateDetailsData) => void;
}

const CATEGORIES = [
  { id: "HR", label: "HR", desc: "Offer letters, NDA, contracts, appraisals" },
  { id: "Legal", label: "Legal", desc: "Agreements, compliance, policies, clauses" },
  { id: "Finance", label: "Finance", desc: "Invoices, salary slips, billing statements" },
  { id: "Sales", label: "Sales", desc: "Proposals, client contracts, quotations" },
  { id: "Procurement", label: "Procurement", desc: "Vendor orders, purchase requisition" },
  { id: "Operations", label: "Operations", desc: "SOPs, project charters, internal guidelines" },
  { id: "Compliance", label: "Compliance", desc: "Audit reports, regulatory filings" },
  { id: "Other", label: "Other", desc: "Custom organization documents" },
];

const DEPARTMENTS = [
  "Engineering",
  "Human Resources",
  "Finance & Accounts",
  "Legal & Compliance",
  "Sales & Marketing",
  "Customer Success",
  "Operations",
  "Procurement",
];

const TEAMS = [
  "Core Engineering Team",
  "Frontend Architecture",
  "Talent Acquisition",
  "Enterprise Sales Alpha",
  "Finance Operations",
  "Legal Advisory Group",
];

export default function TemplateDetailsStep({
  initialData,
  onCancel,
  onNext,
}: TemplateDetailsStepProps) {
  const [name, setName] = useState(initialData?.name || "Employee Offer Letter");
  const [description, setDescription] = useState(
    initialData?.description || "Standard offer letter for new employees with salary breakdown and terms"
  );
  const [category, setCategory] = useState(initialData?.category || "HR");
  const [visibility, setVisibility] = useState<TemplateVisibility>(
    initialData?.visibility || "Organisation Wide"
  );
  const [department, setDepartment] = useState(initialData?.department || "Human Resources");
  const [team, setTeam] = useState(initialData?.team || "Talent Acquisition");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(initialData?.tags || ["offer", "onboarding", "hr"]);
  const [error, setError] = useState<string | null>(null);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim().toLowerCase())) {
      setTags([...tags, tagInput.trim().toLowerCase()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleProceed = () => {
    if (!name.trim()) {
      setError("Please provide a valid Template Name.");
      return;
    }
    setError(null);
    onNext({
      name: name.trim(),
      description: description.trim(),
      category,
      visibility,
      department: visibility === "Department Only" ? department : undefined,
      team: visibility === "Team Only" ? team : undefined,
      tags,
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header card */}
      <div className="bg-gradient-to-r from-[#274690] to-[#1B2A4A] rounded-3xl p-8 text-white shadow-xl mb-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-blue-100 text-xs font-bold mb-3 border border-white/10">
              <Sparkles size={14} className="text-amber-300" />
              <span>Step 1 of 2: Template Details</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Create Document Template</h1>
            <p className="text-sm text-blue-100/90 max-w-xl mt-1">
              Configure template metadata, access visibility, and categorization before opening the Document Designer canvas.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/10 p-3 rounded-2xl border border-white/15 backdrop-blur-md">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center font-black text-lg">
              1
            </div>
            <div className="text-xs">
              <div className="font-bold text-white">Details</div>
              <div className="text-blue-200 text-[11px]">Next: Designer Canvas</div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm space-y-8">
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
            <Info size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Basic Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <FileText size={18} className="text-[#274690]" />
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">General Information</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Template Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Employee Offer Letter, Mutual NDA, Vendor Agreement"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-[#274690] focus:bg-white focus:outline-none transition shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">Description</label>
              <textarea
                rows={3}
                placeholder="Standard offer letter for new employees with salary breakdown, designation, and terms of employment..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-[#274690] focus:bg-white focus:outline-none transition shadow-xs resize-none"
              />
            </div>
          </div>
        </div>

        {/* 2. Category Selection */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Layers size={18} className="text-[#274690]" />
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Document Category</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => {
              const active = category === cat.id;
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                    active
                      ? "border-[#274690] bg-[#274690]/5 shadow-xs ring-2 ring-[#274690]/20"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">{cat.label}</span>
                    {active && <CheckCircle2 size={15} className="text-[#274690]" />}
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-1 line-clamp-2 leading-relaxed">
                    {cat.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Visibility & Access Permissions */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Shield size={18} className="text-[#274690]" />
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Visibility & Permissions</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {(
              [
                { id: "Organisation Wide", label: "Organisation Wide", desc: "Available to all employees across company" },
                { id: "Department Only", label: "Department Only", desc: "Restricted to specific department staff" },
                { id: "Team Only", label: "Team Only", desc: "Restricted to designated project/function team" },
                { id: "Private", label: "Private", desc: "Visible only to template author and Organisation Admin" },
              ] as const
            ).map((vis) => {
              const active = visibility === vis.id;
              return (
                <button
                  type="button"
                  key={vis.id}
                  onClick={() => setVisibility(vis.id)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    active
                      ? "border-[#274690] bg-[#274690]/5 ring-2 ring-[#274690]/20 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{vis.label}</span>
                    {active && <CheckCircle2 size={15} className="text-[#274690]" />}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 font-medium leading-relaxed">{vis.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Conditional Department Selection */}
          {visibility === "Department Only" && (
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 animate-in fade-in slide-in-from-top-1 space-y-2">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-[#274690]" />
                <label className="text-xs font-bold text-slate-900">Select Target Department</label>
              </div>
              <p className="text-[11px] text-slate-500">Only members of this department can use and view this template.</p>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-800 focus:border-[#274690] focus:outline-none"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Conditional Team Selection */}
          {visibility === "Team Only" && (
            <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 animate-in fade-in slide-in-from-top-1 space-y-2">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-purple-700" />
                <label className="text-xs font-bold text-slate-900">Select Target Team</label>
              </div>
              <p className="text-[11px] text-slate-500">Only designated team members will have access to this template.</p>
              <select
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-800 focus:border-purple-600 focus:outline-none"
              >
                {TEAMS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* 4. Search Tags */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-800">
            Search Tags <span className="text-slate-400 font-normal">(press Enter or Add)</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. employee, contract, salary, 2026"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              className="flex-1 h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs font-semibold text-slate-800 focus:border-[#274690] focus:bg-white focus:outline-none"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAddTag}
              className="h-10 px-4 rounded-xl text-xs font-bold"
            >
              Add Tag
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <X size={12} />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="rounded-xl px-5 text-xs font-bold text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleProceed}
            className="rounded-2xl bg-[#274690] text-xs font-bold text-white hover:bg-[#1f3561] px-6 h-11 shadow-lg shadow-[#274690]/20 flex items-center gap-2"
          >
            <span>Next: Design Template</span>
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
