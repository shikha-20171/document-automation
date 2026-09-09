"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { clientStore, type ClientDocument, TEAM_MEMBERS } from "./clientStore";
import { CrmModalShell, CrmModalFooter, CrmFormField, CRM_INPUT_CLS } from "./CrmModalShell";

const TEMPLATES = [
  "Non-Disclosure Agreement (NDA)",
  "Master Services Agreement (MSA)",
  "Service Level Agreement (SLA)",
  "Commercial Invoice",
  "Vendor Onboarding Form",
  "Statement of Work (SOW)",
  "Independent Contractor Agreement",
] as const;

interface CreateClientDocModalProps {
  clientId: string;
  onClose: () => void;
  onSaved: (msg: string) => void;
}

export function CreateClientDocModal({
  clientId,
  onClose,
  onSaved,
}: CreateClientDocModalProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    type: "Contract" as ClientDocument["type"],
    owner: "",
    template: TEMPLATES[0] as string,
  });
  const [saving, setSaving] = useState(false);

  const set = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await clientStore.addDocument({
        clientId,
        title: form.title,
        type: form.type,
        owner: form.owner || "Organisation Admin",
        status: "Draft",
        version: "v1.0",
      });
      onSaved(`Document "${form.title}" created from template`);
    } catch (err: any) {
      alert(err?.message || "Failed to create document");
    } finally {
      setSaving(false);
    }
  };

  return (
    <CrmModalShell title="Create Document for Client" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-700 mb-1.5 block">
            Select Template
          </label>
          <select
            value={form.template}
            onChange={(e) => {
              set("template", e.target.value);
              if (!form.title) {
                set("title", e.target.value);
              }
            }}
            className={CRM_INPUT_CLS}
          >
            {TEMPLATES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>

        <CrmFormField
          label="Document Title *"
          value={form.title}
          onChange={(val) => set("title", val)}
          placeholder="e.g. Mutual NDA Agreement"
        />

        <div>
          <label className="text-xs font-bold text-slate-700 mb-1.5 block">
            Assigned Owner
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
      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => {
            router.push(
              `/org-admin/ai-builder?clientId=${encodeURIComponent(clientId)}&title=${encodeURIComponent(
                form.title || form.template
              )}&template=${encodeURIComponent(form.template)}`
            );
            onClose();
          }}
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
        >
          <span>Open in Document Builder →</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || !form.title.trim()}
            onClick={handleSave}
            className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-sm"
          >
            {saving ? "Creating..." : "Create Document"}
          </button>
        </div>
      </div>
    </CrmModalShell>
  );
}
