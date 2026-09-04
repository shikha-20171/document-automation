"use client";

import { Megaphone, RefreshCw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BroadcastFormData } from "../types";

interface BroadcastNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: BroadcastFormData;
  onChange: (form: BroadcastFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
}

export function BroadcastNoticeModal({
  isOpen,
  onClose,
  form,
  onChange,
  onSubmit,
  submitting,
}: BroadcastNoticeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4 text-xs animate-in fade-in zoom-in-95">
        <div className="flex justify-between items-center border-b pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#274690]/10 flex items-center justify-center text-[#274690]">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Broadcast Platform Notice</h3>
              <p className="text-[11px] text-slate-400">Send an announcement to platform tenants</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-sm"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Announcement Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Scheduled Maintenance on Sunday 2:00 AM"
              value={form.title}
              onChange={(e) => onChange({ ...form, title: e.target.value })}
              className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-[#274690] focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Target Audience</label>
              <select
                value={form.targetAudience}
                onChange={(e) => onChange({ ...form, targetAudience: e.target.value })}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs font-medium bg-white focus:outline-hidden"
              >
                <option value="ALL_USERS">All Organisations</option>
                <option value="ORG_ADMINS">Org Admins Only</option>
                <option value="SUPER_ADMINS">Super Admins Only</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => onChange({ ...form, priority: e.target.value })}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs font-medium bg-white focus:outline-hidden"
              >
                <option value="HIGH">High Priority</option>
                <option value="CRITICAL">Critical / Urgent</option>
                <option value="NORMAL">Normal / Info</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Message Details</label>
            <textarea
              rows={3}
              placeholder="Describe details of the platform announcement, affected services, or action required..."
              value={form.message}
              onChange={(e) => onChange({ ...form, message: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-[#274690] focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !form.title.trim()}
              className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold text-xs gap-1.5"
            >
              {submitting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Send Broadcast</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
