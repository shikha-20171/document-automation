"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon, ArrowLeft, CheckCircle2, AlertCircle, RefreshCcw, Save, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type SettingsSection = {
  title: string;
  href: string;
  description: string;
  icon: LucideIcon;
  iconClassName: string;
  accentClassName: string;
};

export function ToastBanner({
  message,
  type = "success",
  onClose,
}: {
  message: string;
  type?: "success" | "error" | "info";
  onClose?: () => void;
}) {
  if (!message) return null;

  return (
    <div
      className={`fixed top-6 right-6 z-[100] flex items-center gap-2.5 rounded-2xl px-4 py-3 text-xs font-bold text-white shadow-xl transition-all animate-in fade-in slide-in-from-top-4 ${
        type === "success"
          ? "bg-slate-900 border border-emerald-500/30"
          : type === "error"
          ? "bg-rose-900 border border-rose-500/30"
          : "bg-blue-900 border border-blue-500/30"
      }`}
    >
      {type === "success" && <CheckCircle2 size={16} className="text-emerald-400" />}
      {type === "error" && <AlertCircle size={16} className="text-rose-400" />}
      {type === "info" && <CheckCircle2 size={16} className="text-blue-400" />}
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className="ml-2 text-white/60 hover:text-white text-xs">
          ✕
        </button>
      )}
    </div>
  );
}

export function SettingsShell({
  eyebrow,
  title,
  description,
  children,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const pathname = usePathname();
  const isSubpage = pathname !== "/super-admin/settings";

  return (
    <div className="min-h-screen bg-slate-50/60 p-4 md:p-6 space-y-6 font-sans">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Sleek Header Banner */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <div className="border-b border-slate-100 bg-[linear-gradient(135deg,#1f3561_0%,#274690_100%)] px-6 py-6 text-white">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {isSubpage && (
                    <Link
                      href="/super-admin/settings"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-white/90 hover:text-white bg-white/15 hover:bg-white/25 px-3 py-1 rounded-xl transition"
                    >
                      <ArrowLeft size={13} />
                      Back to Overview
                    </Link>
                  )}
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#ffd9a0]">
                    {eyebrow}
                  </span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
                <p className="max-w-2xl text-xs text-white/80 md:text-sm">{description}</p>
              </div>

              {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
            </div>
          </div>
        </section>

        {/* Page Content */}
        {children}
      </div>
    </div>
  );
}

export function Field({
  label,
  value,
  onChange,
  defaultValue,
  placeholder,
  type = "text",
  options,
  tintClassName = "bg-white",
  helpText,
  disabled = false,
}: {
  label: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  defaultValue?: string;
  placeholder?: string;
  type?: "text" | "number" | "email" | "password" | "select" | "textarea";
  options?: { value: string; label: string }[];
  tintClassName?: string;
  helpText?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </Label>
      {type === "select" && options ? (
        <select
          value={value !== undefined ? value : defaultValue}
          onChange={onChange}
          disabled={disabled}
          className={`h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-800 focus:border-[#274690] focus:outline-none ${tintClassName}`}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          value={value !== undefined ? value : defaultValue}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          rows={3}
          className={`w-full rounded-xl border border-slate-200 p-3 text-xs font-semibold text-slate-800 focus:border-[#274690] focus:outline-none ${tintClassName}`}
        />
      ) : (
        <Input
          type={type}
          value={value !== undefined ? value : defaultValue}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`h-10 rounded-xl border-slate-200 text-xs font-semibold text-slate-800 ${tintClassName}`}
        />
      )}
      {helpText && <p className="text-[10px] text-slate-400 font-medium">{helpText}</p>}
    </div>
  );
}

export function ToggleRow({
  title,
  description,
  enabled = true,
  onChange,
}: {
  title: string;
  description: string;
  enabled?: boolean;
  onChange?: (newVal: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 hover:bg-slate-50 transition">
      <div>
        <p className="text-xs font-bold text-slate-900">{title}</p>
        <p className="mt-0.5 text-[11px] text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange && onChange(!enabled)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${
          enabled ? "bg-[#274690]" : "bg-slate-300"
        }`}
        aria-pressed={enabled}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-xs transition-all ${
            enabled ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

export function SectionCard({
  title,
  description,
  className = "",
  children,
}: {
  title: string;
  description: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={`border-slate-200/80 shadow-xs bg-white ${className}`}>
      <CardHeader className="pb-3 border-b border-slate-100/80">
        <CardTitle className="text-sm font-extrabold text-slate-900">{title}</CardTitle>
        <CardDescription className="text-xs text-slate-500">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">{children}</CardContent>
    </Card>
  );
}

export function SettingsNavCard({ section }: { section: SettingsSection }) {
  const Icon = section.icon;

  return (
    <Link href={section.href}>
      <Card className="group border-slate-200/80 bg-white shadow-xs hover:shadow-md transition-all duration-200 hover:border-[#274690]/40">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-[#274690] transition-colors">
                {section.title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {section.description}
              </p>
            </div>
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${section.iconClassName}`}>
              <Icon size={20} />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function SettingsPageActions({
  onSave,
  onReset,
  isSaving = false,
}: {
  onSave?: () => void;
  onReset?: () => void;
  isSaving?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {onSave && (
        <Button
          size="sm"
          onClick={onSave}
          disabled={isSaving}
          className="bg-white hover:bg-slate-100 text-[#274690] font-bold text-xs px-4 h-9 gap-1.5 rounded-xl shadow-xs"
        >
          <Save size={14} />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      )}
      {onReset && (
        <Button
          size="sm"
          variant="outline"
          onClick={onReset}
          className="text-white border-white/30 bg-white/10 hover:bg-white/20 text-xs font-bold px-3 h-9 gap-1 rounded-xl"
        >
          <RefreshCcw size={13} />
          Reset
        </Button>
      )}
    </div>
  );
}
