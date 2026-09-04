"use client";

import { useState } from "react";
import { X, Building2, User, ChevronRight, Check, Tag } from "lucide-react";
import { clientStore, INDUSTRIES, DEPARTMENTS, TEAM_MEMBERS, COMPANY_SIZES, ALL_TAGS, type Client } from "./clientStore";

interface AddClientModalProps {
  onClose: () => void;
  onSaved: (client: Client) => void;
}

const STEPS = ["Basic Info", "Business", "Organisation"] as const;
type Step = (typeof STEPS)[number];

export default function AddClientModal({ onClose, onSaved }: AddClientModalProps) {
  const [step, setStep] = useState<Step>("Basic Info");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    type: "Company" as "Company" | "Individual",
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    postalCode: "",
    industry: "",
    companySize: "2-10",
    status: "Active" as Client["status"],
    department: "",
    assignedTo: "",
    tags: [] as string[],
    notes: "",
  });

  const set = (field: string, value: unknown) => setForm(f => ({ ...f, [field]: value }));

  const toggleTag = (tag: string) => {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag],
    }));
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    setSaving(true);
    setTimeout(() => {
      const client = clientStore.addClient(form);
      setSaving(false);
      onSaved(client);
    }, 500);
  };

  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-black text-slate-900">Add New Client</h2>
            <p className="text-xs text-slate-500 mt-0.5">Fill in client details to create a new record</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
            <X size={20} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-0 px-7 py-4 border-b border-slate-100 bg-slate-50/60">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-0">
              <button
                onClick={() => setStep(s)}
                className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  step === s ? "bg-[#274690] text-white" : i < stepIndex ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                {i < stepIndex ? <Check size={13} /> : <span className="w-4 text-center">{i + 1}</span>}
                {s}
              </button>
              {i < STEPS.length - 1 && <ChevronRight size={14} className="text-slate-300 mx-1" />}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-7 py-6 space-y-5">
          {step === "Basic Info" && (
            <>
              {/* Client Type */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-2 block">Client Type</label>
                <div className="flex gap-3">
                  {(["Company", "Individual"] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => set("type", t)}
                      className={`flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-xs font-bold transition ${
                        form.type === t ? "border-[#274690] bg-[#274690]/5 text-[#274690]" : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {t === "Company" ? <Building2 size={14} /> : <User size={14} />}
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Field label={form.type === "Company" ? "Company Name *" : "Client Name *"} value={form.name} onChange={v => set("name", v)} placeholder={form.type === "Company" ? "e.g. ABC Technologies Pvt. Ltd." : "e.g. Meera Kapoor"} />
                </div>
                <Field label="Contact Person" value={form.contactPerson} onChange={v => set("contactPerson", v)} placeholder="Primary contact name" />
                <Field label="Email" value={form.email} onChange={v => set("email", v)} placeholder="contact@company.com" type="email" />
                <Field label="Phone" value={form.phone} onChange={v => set("phone", v)} placeholder="+91 XXXXX XXXXX" />
                <Field label="Website" value={form.website} onChange={v => set("website", v)} placeholder="https://example.com" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">Address</label>
                <input value={form.address} onChange={e => set("address", e.target.value)} placeholder="Street address" className={INPUT_CLS} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="City" value={form.city} onChange={v => set("city", v)} placeholder="City" />
                <Field label="State" value={form.state} onChange={v => set("state", v)} placeholder="State" />
                <Field label="Country" value={form.country} onChange={v => set("country", v)} placeholder="Country" />
                <Field label="Postal Code" value={form.postalCode} onChange={v => set("postalCode", v)} placeholder="Postal code" />
              </div>
            </>
          )}

          {step === "Business" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">Industry</label>
                  <select value={form.industry} onChange={e => set("industry", e.target.value)} className={INPUT_CLS}>
                    <option value="">Select industry</option>
                    {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">Company Size</label>
                  <select value={form.companySize} onChange={e => set("companySize", e.target.value)} className={INPUT_CLS}>
                    {COMPANY_SIZES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">Client Status</label>
                  <div className="flex gap-2 flex-wrap">
                    {(["Active", "Inactive", "Prospect", "Archived"] as Client["status"][]).map(s => (
                      <button key={s} onClick={() => set("status", s)} className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition ${form.status === s ? "border-[#274690] bg-[#274690] text-white" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === "Organisation" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">Assigned Department</label>
                  <select value={form.department} onChange={e => set("department", e.target.value)} className={INPUT_CLS}>
                    <option value="">Select department</option>
                    {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">Assigned User</label>
                  <select value={form.assignedTo} onChange={e => set("assignedTo", e.target.value)} className={INPUT_CLS}>
                    <option value="">Select user</option>
                    {TEAM_MEMBERS.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5 block">
                  <Tag size={13} /> Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALL_TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`rounded-full border px-3 py-1 text-[11px] font-bold transition ${
                        form.tags.includes(tag) ? "border-[#274690] bg-[#274690] text-white" : "border-slate-200 text-slate-600 hover:border-[#274690] hover:text-[#274690]"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => set("notes", e.target.value)}
                  placeholder="Internal notes about this client..."
                  rows={3}
                  className={`${INPUT_CLS} resize-none`}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-7 py-4 border-t border-slate-100 bg-slate-50/40">
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition">
            Cancel
          </button>
          <div className="flex gap-2">
            {stepIndex > 0 && (
              <button onClick={() => setStep(STEPS[stepIndex - 1])} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition">
                Back
              </button>
            )}
            {stepIndex < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(STEPS[stepIndex + 1])}
                disabled={step === "Basic Info" && !form.name.trim()}
                className="rounded-xl bg-[#274690] px-5 py-2 text-xs font-bold text-white hover:bg-[#1f3561] transition disabled:opacity-40"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="rounded-xl bg-[#274690] px-5 py-2 text-xs font-bold text-white hover:bg-[#1f3561] transition disabled:opacity-60 flex items-center gap-2"
              >
                {saving ? <span className="h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : null}
                Save Client
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const INPUT_CLS = "h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 outline-none focus:border-[#274690] focus:bg-white transition";

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-700 mb-1.5 block">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={INPUT_CLS} />
    </div>
  );
}
