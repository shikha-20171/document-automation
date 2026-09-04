"use client";

import React from "react";
import { X } from "lucide-react";

export const CRM_INPUT_CLS =
  "h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 outline-none focus:border-[#274690] focus:bg-white transition";

interface CrmModalShellProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function CrmModalShell({ title, onClose, children }: CrmModalShellProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-base font-black text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 transition"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

interface CrmModalFooterProps {
  onClose: () => void;
  onSave: () => void;
  disabled?: boolean;
  label: string;
}

export function CrmModalFooter({
  onClose,
  onSave,
  disabled = false,
  label,
}: CrmModalFooterProps) {
  return (
    <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-100">
      <button
        onClick={onClose}
        className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={disabled}
        className="rounded-xl bg-[#274690] px-5 py-2 text-xs font-bold text-white hover:bg-[#1f3770] transition disabled:opacity-40"
      >
        {label}
      </button>
    </div>
  );
}

interface CrmFormFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function CrmFormField({
  label,
  value,
  onChange,
  placeholder,
}: CrmFormFieldProps) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-700 mb-1.5 block">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={CRM_INPUT_CLS}
      />
    </div>
  );
}
