"use client";

import React, { useState } from "react";
import { Upload } from "lucide-react";
import { clientStore, type ClientDocument, TEAM_MEMBERS } from "./clientStore";
import { CrmModalShell, CrmModalFooter, CrmFormField, CRM_INPUT_CLS } from "./CrmModalShell";

const DOC_TYPES = [
  "Contract",
  "NDA",
  "Agreement",
  "Invoice",
  "Legal",
  "Finance",
  "HR",
  "Compliance",
  "Other",
] as const;

interface UploadClientDocModalProps {
  clientId: string;
  onClose: () => void;
  onSaved: (msg: string) => void;
}

export function UploadClientDocModal({
  clientId,
  onClose,
  onSaved,
}: UploadClientDocModalProps) {
  const [form, setForm] = useState({
    title: "",
    type: "Contract" as ClientDocument["type"],
    owner: "",
  });

  const set = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    clientStore.addDocument({
      ...form,
      clientId,
      status: "Draft",
      version: "v1.0",
    });
    onSaved(`"${form.title}" uploaded successfully`);
  };

  return (
    <CrmModalShell title="Upload Document" onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
          <Upload size={24} className="mx-auto text-slate-400 mb-2" />
          <p className="text-xs font-semibold text-slate-700">
            Drag & drop or click to browse
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            PDF, DOCX, XLSX up to 50MB
          </p>
          <button
            type="button"
            className="mt-3 rounded-xl bg-white border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs transition"
          >
            Browse Files
          </button>
        </div>

        <CrmFormField
          label="Document Title *"
          value={form.title}
          onChange={(val) => set("title", val)}
          placeholder="e.g. Scanned_Vendor_Invoice_2026.pdf"
        />

        <div>
          <label className="text-xs font-bold text-slate-700 mb-1.5 block">
            Document Type
          </label>
          <select
            value={form.type}
            onChange={(e) => set("type", e.target.value)}
            className={CRM_INPUT_CLS}
          >
            {DOC_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 mb-1.5 block">
            Owner
          </label>
          <select
            value={form.owner}
            onChange={(e) => set("owner", e.target.value)}
            className={CRM_INPUT_CLS}
          >
            <option value="">Select owner</option>
            {TEAM_MEMBERS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>
      <CrmModalFooter
        onClose={onClose}
        onSave={handleSave}
        disabled={!form.title.trim()}
        label="Upload Document"
      />
    </CrmModalShell>
  );
}
