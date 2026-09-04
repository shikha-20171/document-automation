"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import axios from "@/lib/axios";
import {
  AuthShell,
  InlineAction,
  PasswordField,
} from "../_components/auth-ui";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!token) {
    return <ResetPasswordFallback />;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New password and confirm password must match.");
      setMessage(null);
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { data: response } = await axios.post<{ success: boolean; message: string }>("/auth/reset-password", {
        token,
        newPassword: formData.newPassword,
        email: email ?? undefined,
      });

      setMessage(response.message);
      setFormData({
        newPassword: "",
        confirmPassword: "",
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to reset password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      badge="Credentials"
      title="Create a new password"
      description={`Choose and confirm a new password${
        email ? ` for ${email}` : ""
      }, then sign in with the updated credentials.`}
      asideTitle="Password updates should feel deliberate and trustworthy."
      asideBody="The reset flow stays simple while clearly separating identity recovery from new credential setup."
      features={[
        {
          label: "Clear completion path",
          hint: "The final step is focused on setting and confirming a new password.",
        },
        {
          label: "Reduced input mistakes",
          hint: "Show-hide controls make verification easier during entry.",
        },
        {
          label: "Consistent route structure",
          hint: "Each auth screen now lives under a predictable URL path.",
        },
      ]}
      navigation={[
        { href: "/auth/login", label: "Login" },
        { href: "/auth/forgot-password", label: "Forgot password" },
      ]}
      contentScrollOnly
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Recovery link verified.
        </div>
        <PasswordField
          label="New password"
          placeholder="Enter a new password"
          name="newPassword"
          value={formData.newPassword}
          onChange={(event) =>
            setFormData((current) => ({
              ...current,
              newPassword: event.target.value,
            }))
          }
          autoComplete="new-password"
          required
          disabled={loading}
        />
        <PasswordField
          label="Confirm new password"
          placeholder="Re-enter the new password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={(event) =>
            setFormData((current) => ({
              ...current,
              confirmPassword: event.target.value,
            }))
          }
          autoComplete="new-password"
          required
          disabled={loading}
        />

        <button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-2xl bg-gradient-to-r from-[#274690] via-[#244186] to-[#c96f4a] text-sm font-bold text-white shadow-lg shadow-[#274690]/25 transition-all duration-300 hover:shadow-[#c96f4a]/30 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Updating..." : "Update password"}
        </button>
      </form>

      {message ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {error}
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>Need to start over? Request a fresh reset link first.</p>
        <InlineAction
          href="/auth/forgot-password"
          label="Request another link"
        />
      </div>
    </AuthShell>
  );
}

function ResetPasswordFallback() {
  return (
    <AuthShell
      badge="Credentials"
      title="Open the reset link from your email"
      description="This page is intended to open from the secure link sent to the registered email address."
      asideTitle="Password reset stays hidden until the email link is used."
      asideBody="That keeps the recovery flow predictable for the browser and makes backend token validation easier to connect later."
      features={[
        {
          label: "Email-first recovery",
          hint: "Users begin on forgot password and continue only from the mailbox link.",
        },
        {
          label: "Token-ready routing",
          hint: "The reset page already expects a token in the browser URL.",
        },
        {
          label: "Cleaner navigation",
          hint: "Reset password is available by link, not as a regular menu item.",
        },
      ]}
      navigation={[
        { href: "/auth/login", label: "Login" },
        { href: "/auth/forgot-password", label: "Forgot password" },
      ]}
      contentScrollOnly
    >
      <div className="space-y-5">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-900">
          First submit the registered email on the forgot password page. After
          that, the mailbox link should open this page with a secure token.
        </div>

        <Link
          href="/auth/forgot-password"
          className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#274690] px-4 text-sm font-semibold text-white transition hover:bg-[#1f3561]"
        >
          Go to forgot password
        </Link>
      </div>
    </AuthShell>
  );
}
