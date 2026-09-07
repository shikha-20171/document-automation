"use client";

import React, { useState } from "react";
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
      <CrmModalFooter
        onClose={onClose}
        onSave={handleSave}
        disabled={saving || !form.title.trim()}
        label="Create Document"
      />
    </CrmModalShell>
  );
}
