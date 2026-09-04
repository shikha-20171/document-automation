"use client";

import React, { useState } from "react";
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
    onSaved(`"${form.title}" created as Draft`);
  };

  return (
    <CrmModalShell title="Create Document" onClose={onClose}>
      <div className="space-y-4">
        <CrmFormField
          label="Document Title *"
          value={form.title}
          onChange={(val) => set("title", val)}
          placeholder="e.g. Master Services Agreement"
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
        label="Create Document"
      />
    </CrmModalShell>
  );
}
