"use client";

import Link from "next/link";
import {
  useId,
  useState,
  type ChangeEventHandler,
  type ReactNode,
} from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, CheckCircle2, Eye, EyeOff } from "lucide-react";

type Feature = {
  label: string;
  hint: string;
};

type NavigationLink = {
  href: string;
  label: string;
};

type AuthShellProps = {
  badge: string;
  title: string;
  description: string;
  asideTitle: string;
  asideBody: string;
  features: Feature[];
  navigation?: NavigationLink[];
  contentScrollOnly?: boolean;
  children: ReactNode;
};

type TextFieldProps = {
  label: string;
  placeholder: string;
  icon: LucideIcon;
  type?: string;
  name?: string;
  value?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
};

type PasswordFieldProps = {
  label: string;
  placeholder: string;
  name?: string;
  value?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
};

type SectionCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  children: ReactNode;
};

type StatusOptionProps = {
  defaultChecked?: boolean;
  description: string;
  title: string;
  value?: string;
  checked?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  disabled?: boolean;
};

export function AuthShell({
  badge,
  title,
  description,
  asideTitle,
  asideBody,
  features,
  navigation,
  contentScrollOnly = false,
  children,
}: AuthShellProps) {
  const shellHeightClass = contentScrollOnly
    ? "lg:h-[calc(100vh-4rem)] lg:min-h-0"
    : "";
  const asideHeightClass = contentScrollOnly
    ? "lg:h-[calc(100vh-4rem)] lg:overflow-hidden"
    : "";
  const contentPanelClass = contentScrollOnly
    ? "items-start lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto"
    : "items-center";

  return (
    <div className="relative isolate overflow-hidden rounded-[2rem] border border-white/60 bg-white/75 shadow-[0_30px_80px_rgba(31,41,55,0.12)] backdrop-blur-xl">
      <div className="absolute inset-x-0 top-0 h-px bg-white/80" />

      <div className={`grid min-h-[720px] lg:grid-cols-[1.05fr_0.95fr] ${shellHeightClass}`}>
        <aside
          className={`relative overflow-hidden bg-[linear-gradient(140deg,#1f3561_0%,#274690_42%,#6a3f4e_75%,#c96f4a_100%)] px-6 py-8 text-white sm:px-10 lg:px-12 lg:py-12 ${asideHeightClass}`}
        >
          {/* Ambient Lighting Orbs with #274690 and #c96f4a */}
          <div className="pointer-events-none absolute left-[-15%] top-[-10%] h-72 w-72 rounded-full bg-[#274690]/80 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-15%] right-[-10%] h-80 w-80 rounded-full bg-[#c96f4a]/70 blur-3xl" />
          <div className="pointer-events-none absolute top-1/2 left-1/3 h-52 w-52 -translate-y-1/2 rounded-full bg-[#ffd5c4]/20 blur-2xl" />

          {/* Decorative Grid Texture */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          />

          <div className="relative flex h-full flex-col justify-between gap-10">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#c96f4a]/50 bg-gradient-to-r from-[#274690]/90 via-[#1f3561]/90 to-[#c96f4a]/50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.25em] text-[#ffd5c4] shadow-lg shadow-[#c96f4a]/15 backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-[#c96f4a] animate-pulse" />
                {badge}
              </span>

              <div className="space-y-4">
                <h1 className="max-w-md font-serif font-bold text-3xl leading-tight sm:text-4xl lg:text-5xl text-white">
                  {asideTitle}
                </h1>
                <div className="h-1 w-20 rounded-full bg-gradient-to-r from-[#c96f4a] via-[#ffd5c4] to-transparent" />
                <p className="max-w-lg text-sm leading-7 text-white/85 sm:text-base font-serif">
                  {asideBody}
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              {features.map((feature) => (
                <div
                  key={feature.label}
                  className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-md transition-all duration-300 hover:border-[#c96f4a]/50 hover:bg-white/[0.15] group"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#c96f4a] to-[#274690] text-white shadow-md shadow-[#c96f4a]/30 transition-transform duration-200 group-hover:scale-105">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white group-hover:text-[#ffd5c4] transition-colors">
                        {feature.label}
                      </p>
                      <p className="mt-0.5 text-xs sm:text-sm text-white/75 leading-relaxed">
                        {feature.hint}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section
          className={`relative flex px-5 py-6 sm:px-8 lg:px-10 lg:py-12 ${contentPanelClass}`}
        >
          <div className="mx-auto w-full max-w-xl">
            {navigation ? (
              <nav className="mb-8 flex flex-wrap gap-2">
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-[#274690]/30 hover:text-[#274690]"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            ) : null}

            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#274690]/20 bg-[#274690]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#274690]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#c96f4a]" />
                {badge}
              </span>
              <h2 className="font-serif font-bold text-3xl leading-tight text-slate-900 sm:text-4xl">
                {title}
              </h2>
              <p className="max-w-xl text-sm leading-7 text-slate-600 sm:text-base font-serif">
                {description}
              </p>
            </div>

            <div className="mt-8 rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-7">
              {children}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export function TextField({
  label,
  placeholder,
  icon: Icon,
  type = "text",
  name,
  value,
  onChange,
  autoComplete,
  required,
  disabled,
}: TextFieldProps) {
  const id = useId();

  return (
    <label className="block space-y-2" htmlFor={id}>
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <span className="relative block">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          id={id}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#274690] focus:bg-white focus:ring-4 focus:ring-[#274690]/10 hover:border-[#c96f4a]/40"
        />
      </span>
    </label>
  );
}

export function PasswordField({
  label,
  placeholder,
  name,
  value,
  onChange,
  autoComplete,
  required,
  disabled,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  return (
    <label className="block space-y-2" htmlFor={id}>
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <span className="relative block">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-4 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#274690] focus:bg-white focus:ring-4 focus:ring-[#274690]/10 hover:border-[#c96f4a]/40"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          disabled={disabled}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-[#c96f4a]"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </span>
    </label>
  );
}

export function SectionCard({
  title,
  description,
  icon: Icon,
  children,
}: SectionCardProps) {
  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)] sm:p-6">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-[#274690]/10 text-[#274690] p-3 border border-[#274690]/20">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        </div>
      </div>

      <div className="mt-6">{children}</div>
    </section>
  );
}

export function StatusOption({
  defaultChecked,
  description,
  title,
  value,
  checked,
  onChange,
  disabled,
}: StatusOptionProps) {
  const id = useId();

  return (
    <label
      className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-[#274690]/40 hover:bg-white"
      htmlFor={id}
    >
      <input
        id={id}
        type="radio"
        name="status"
        value={value}
        defaultChecked={defaultChecked}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="mt-1 h-4 w-4 border-slate-300 text-[#274690] focus:ring-[#274690]/20"
      />
      <span>
        <span className="block text-sm font-semibold text-slate-900">{title}</span>
        <span className="mt-1 block text-sm leading-6 text-slate-600">
          {description}
        </span>
      </span>
    </label>
  );
}

export function InlineAction({
  href,
  label,
}: NavigationLink) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-sm font-semibold text-[#274690] transition hover:text-[#c96f4a] group"
    >
      <span>{label}</span>
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
