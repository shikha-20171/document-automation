"use client";

import React, { useState } from "react";
import {
  X,
  History,
  CheckCircle2,
  Clock,
  RotateCcw,
  GitCompare,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface TemplateVersionItem {
  version: string;
  date: string;
  createdBy: string;
  changes: string[];
  contentSample?: string;
}

interface TemplateVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateName: string;
  currentVersion: string;
  versions?: TemplateVersionItem[];
  onRestoreVersion?: (version: string) => void;
}

const DEFAULT_VERSIONS: TemplateVersionItem[] = [
  {
    version: "v2.0",
    date: "12 Aug 2026, 10:45 AM",
    createdBy: "Rahul Admin",
    changes: [
      "Added structured CTC Breakdown table with {{basic_salary}} and {{hra}}",
      "Integrated E-Signature authorization fields for HR and Employee",
      "Added conditional probation clause {{#if probation_period}}",
    ],
    contentSample: "Employment Offer Letter v2.0 with dual digital signatures and dynamic compensation table.",
  },
  {
    version: "v1.1",
    date: "05 Aug 2026, 03:20 PM",
    createdBy: "Anita Desai",
    changes: [
      "Updated official company address and branding banner",
      "Added confidential IP governance clause",
    ],
    contentSample: "Employment Offer Letter v1.1 with updated office address and IP terms.",
  },
  {
    version: "v1.0",
    date: "01 Aug 2026, 09:00 AM",
    createdBy: "Rahul Admin",
    changes: ["Initial official release of standard offer letter blueprint"],
    contentSample: "Standard baseline offer letter format.",
  },
];

export default function TemplateVersionModal({
  isOpen,
  onClose,
  templateName,
  currentVersion = "v2.0",
  versions = DEFAULT_VERSIONS,
  onRestoreVersion,
}: TemplateVersionModalProps) {
  const [selectedVersion, setSelectedVersion] = useState<string>(currentVersion);
  const [comparingWith, setComparingWith] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeVerObj = versions.find((v) => v.version === selectedVersion) || versions[0];
  const compareVerObj = comparingWith ? versions.find((v) => v.version === comparingWith) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#274690]/10 flex items-center justify-center text-[#274690]">
              <History size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">Version History</h2>
                <Badge className="bg-blue-50 text-[#274690] border-blue-200 text-[10px] font-bold">
                  {templateName}
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Track incremental changes, compare diffs, and restore previous blueprint versions.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X size={18} />
          </button>
        </div>

        {/* Immutability Assurance Alert */}
        <div className="px-6 py-2.5 bg-emerald-50/70 border-b border-emerald-100 flex items-center gap-2 text-xs text-emerald-800 font-medium">
          <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
          <span>
            <strong>Immutable Historical Documents:</strong> Updating or restoring a template never alters previously generated or signed employee documents.
          </span>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Version List */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Available Versions
              </span>
              {versions.map((ver) => {
                const isSelected = selectedVersion === ver.version;
                const isCurrent = ver.version === currentVersion;

                return (
                  <div
                    key={ver.version}
                    onClick={() => setSelectedVersion(ver.version)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-[#274690]/5 border-[#274690] shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900">{ver.version}</span>
                        {isCurrent && (
                          <Badge className="bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                            Active
                          </Badge>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">{ver.date.split(",")[0]}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium mt-1">
                      By {ver.createdBy}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Version Detail & Changelog */}
            <div className="md:col-span-2 bg-slate-50/70 rounded-2xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Version {activeVerObj.version} Details
                  </h3>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <Clock size={12} /> {activeVerObj.date} • Created by {activeVerObj.createdBy}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {activeVerObj.version !== currentVersion && (
                    <Button
                      size="sm"
                      onClick={() => {
                        if (onRestoreVersion) onRestoreVersion(activeVerObj.version);
                        onClose();
                      }}
                      className="h-8 rounded-xl bg-[#274690] text-white hover:bg-[#1f3561] text-xs font-bold gap-1.5"
                    >
                      <RotateCcw size={13} /> Restore {activeVerObj.version}
                    </Button>
                  )}
                </div>
              </div>

              {/* Changes list */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-2">
                  Changelog & Modifications:
                </span>
                <ul className="space-y-1.5">
                  {activeVerObj.changes.map((change, idx) => (
                    <li key={idx} className="text-xs text-slate-700 font-medium flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#274690] mt-1.5 shrink-0" />
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Blueprint summary snippet */}
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 font-mono">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Snapshot Summary:
                </span>
                {activeVerObj.contentSample || "Official document blueprint configuration snapshot."}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 bg-slate-50 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-xl text-xs font-bold"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
