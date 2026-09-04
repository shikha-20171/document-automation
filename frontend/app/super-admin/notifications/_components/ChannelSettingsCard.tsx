"use client";

import { Mail, Bell, Activity, CheckCircle2, RefreshCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChannelSettingsData } from "../types";

interface ChannelSettingsCardProps {
  settings: ChannelSettingsData;
  onChange: (settings: ChannelSettingsData) => void;
  onSave: (e: React.FormEvent) => void;
  saving: boolean;
}

export function ChannelSettingsCard({
  settings,
  onChange,
  onSave,
  saving,
}: ChannelSettingsCardProps) {
  return (
    <Card className="bg-white border-slate-200/80 shadow-xs rounded-2xl p-6 space-y-6">
      <div>
        <h3 className="text-base font-extrabold text-slate-900">Notification Delivery Channels</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure system alert channels, webhook dispatchers, and transactional notifications.
        </p>
      </div>

      <form onSubmit={onSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#274690]" />
                <span className="font-bold text-slate-900">Email Dispatch (Nodemailer SMTP)</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emailEnabled}
                  onChange={(e) => onChange({ ...settings, emailEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#274690]"></div>
              </label>
            </div>
            <p className="text-slate-600 text-[11px]">
              Dispatches transactional emails for critical server outages, billing failures, and password resets.
            </p>
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-[11px]">
              <CheckCircle2 size={14} />
              <span>SMTP Server Connected & Verified</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#274690]" />
                <span className="font-bold text-slate-900">In-App Notification Feed</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.inAppEnabled}
                  onChange={(e) => onChange({ ...settings, inAppEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#274690]"></div>
              </label>
            </div>
            <p className="text-slate-600 text-[11px]">
              Renders real-time bell badge and banner alerts in user dashboards.
            </p>
            <div className="flex items-center gap-2 text-blue-600 font-bold text-[11px]">
              <Activity size={14} />
              <span>Real-time In-App Dispatch Active</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 md:col-span-2">
            <span className="font-bold text-slate-900 block">Slack Operations Webhook</span>
            <p className="text-slate-500 text-[11px]">
              Forward high-severity incidents directly to your team&apos;s Slack channel.
            </p>
            <input
              type="text"
              value={settings.slackWebhook}
              onChange={(e) => onChange({ ...settings, slackWebhook: e.target.value })}
              placeholder="https://hooks.slack.com/services/..."
              className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 font-mono text-[11px] text-slate-800"
            />
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <Button
            type="submit"
            disabled={saving}
            className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold h-9 text-xs px-5 rounded-xl gap-2"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check size={14} />}
            <span>Save Channel Settings</span>
          </Button>
        </div>
      </form>
    </Card>
  );
}
