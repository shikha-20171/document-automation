"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import axios from "@/lib/axios";
import { AuthShell, InlineAction, TextField } from "../_components/auth-ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetLink, setResetLink] = useState<string | null>(null);

  return (
    <AuthShell
      badge="Recovery"
      title="Reset access without the support queue"
      description="Enter the registered email, send the reset link, and continue the password update from the email securely."
      asideTitle="Recovery should feel calm, not confusing."
      asideBody="This flow is designed for fast self-service while keeping the workspace secure and predictable."
      features={[
        {
          label: "Protected reset links",
          hint: "Issue short-lived links to reduce accidental exposure.",
        },
        {
          label: "Less admin overhead",
          hint: "Users can restart access without waiting on manual help.",
        },
        {
          label: "Consistent UX",
          hint: "The recovery journey matches the rest of the auth system.",
        },
      ]}
      navigation={[
        { href: "/auth/login", label: "Login" },
        { href: "/auth/forgot-password", label: "Forgot password" },
      ]}
      contentScrollOnly
    >
      <form
        className="space-y-5"
        onSubmit={async (event) => {
          event.preventDefault();
          setLoading(true);
          setError(null);
          setMessage(null);

          try {
            const { data: response } = await axios.post<{ success: boolean; message: string; resetLink?: string }>("/auth/forgot-password", { email });
            setSubmitted(true);
            setMessage(response.message);
            if (response.resetLink) {
              setResetLink(response.resetLink);
            }
          } catch (submitError) {
            setSubmitted(false);
            setError( 
              submitError instanceof Error
                ? submitError.message
                : "Unable to send reset link."
            );
          } finally {
            setLoading(false);
          }
        }}
      >
        <TextField
          label="Registered email"
          placeholder="name@company.com"
          icon={Mail}
          type="email"
          name="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
          disabled={loading}
        />

        <button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-2xl bg-gradient-to-r from-[#274690] via-[#244186] to-[#c96f4a] text-sm font-bold text-white shadow-lg shadow-[#274690]/25 transition-all duration-300 hover:shadow-[#c96f4a]/30 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>

      {submitted && message ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {message}
        </div>
      ) : null}

      {submitted && resetLink ? (
        <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <p className="font-semibold mb-2">Reset Link (Development Mode):</p>
          <a href={resetLink} className="break-all text-blue-600 underline">
            {resetLink}
          </a>
          <p className="mt-2 text-xs">Click the link above to reset your password</p>
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {error}
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>Already have your password? Head back to the sign-in screen.</p>
        <InlineAction href="/auth/login" label="Back to login" />
      </div>
    </AuthShell>
  );
}
