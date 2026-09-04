"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Building2,
  User,
  Mail,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import axios from "@/lib/axios";

export default function AcceptInvitationPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const [invalidReason, setInvalidReason] = useState<string | null>(null);
  const [invitationData, setInvitationData] = useState<{
    organisationName: string;
    adminName: string;
    adminEmail: string;
    role?: string;
  } | null>(null);

  // Form states
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activatedSuccess, setActivatedSuccess] = useState(false);

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: "Empty", color: "bg-slate-200" };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 25, label: "Weak", color: "bg-rose-500" };
    if (score === 2) return { score: 50, label: "Fair", color: "bg-amber-500" };
    if (score === 3) return { score: 75, label: "Good", color: "bg-blue-500" };
    return { score: 100, label: "Strong & Secure", color: "bg-emerald-500" };
  };

  const strength = getPasswordStrength(password);

  useEffect(() => {
    if (!token) {
      setInvalidReason("Invitation token is missing.");
      setVerifying(false);
      setLoading(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const { data } = await axios.post<{ success: boolean; message?: string; data?: { valid?: boolean; organisation?: { name?: string }; admin?: { name?: string; email?: string; role?: string } } }>("/auth/invitation/verify", { token });

        if (data.success && data.data?.valid) {
          const inv = data.data;
          setInvitationData({
            organisationName: inv.organisation?.name || "Organisation",
            adminName: inv.admin?.name || "Staff Member",
            adminEmail: inv.admin?.email || "",
            role: inv.admin?.role || "Team Leader",
          });
        } else {
          setInvalidReason(data.message || "Invitation link is invalid or has expired.");
        }
      } catch (err) {
        setInvalidReason("Failed to connect to backend server for token verification.");
      } finally {
        setVerifying(false);
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleActivateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please re-enter.");
      return;
    }
    if (!acceptedTerms) {
      setErrorMsg("Please accept the Terms of Service & Privacy Policy.");
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await axios.post<{ success: boolean; message?: string }>("/auth/invitation/activate", { token, password });

      if (data.success) {
        setActivatedSuccess(true);
        setTimeout(() => {
          router.push("/auth/login");
        }, 3000);
      } else {
        setErrorMsg(data.message || "Failed to activate account. Token may have expired.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Connection error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const isTeamLead = invitationData?.role?.toUpperCase().includes("LEAD");

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans text-slate-100 relative overflow-hidden">
      {/* Background Glow Elements */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-[#274690]/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[#8fb1ec]/20 blur-3xl" />

      <div className="w-full max-w-lg space-y-6 relative z-10">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#274690] text-white shadow-xl shadow-[#274690]/40 ring-1 ring-white/20 mb-1">
            <ShieldCheck size={30} className="text-[#8fb1ec]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">DocuCore AI</h1>
          <p className="text-xs text-slate-400 font-medium">
            {isTeamLead ? "Team Leader Account Activation & Setup" : "Enterprise Workspace Account Setup"}
          </p>
        </div>

        {/* LOADING STATE */}
        {verifying && (
          <Card className="bg-[#131c36] border-[#274690]/40 p-8 rounded-2xl text-center space-y-4 shadow-2xl">
            <RefreshCw size={32} className="animate-spin text-[#8fb1ec] mx-auto" />
            <p className="text-sm font-bold text-slate-200">Verifying secure invitation token...</p>
          </Card>
        )}

        {/* INVALID OR EXPIRED TOKEN STATE */}
        {!verifying && invalidReason && (
          <Card className="bg-[#131c36] border-rose-500/40 p-6 rounded-2xl space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400 border-b border-slate-800 pb-3">
              <AlertCircle size={24} />
              <h2 className="text-base font-extrabold">Invalid or Expired Invitation Link</h2>
            </div>
            <p className="text-xs text-slate-300 font-semibold leading-relaxed">
              {invalidReason}
            </p>
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1 text-xs text-slate-400">
              <p className="font-bold text-slate-300">Why might this happen?</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>The 48-hour invitation window has elapsed.</li>
                <li>The invitation has already been accepted and activated.</li>
                <li>Your Department Manager issued a fresh invitation link.</li>
              </ul>
            </div>
            <Button
              onClick={() => router.push("/auth/login")}
              className="w-full bg-[#274690] hover:bg-[#1f3561] text-white font-bold text-xs h-10 rounded-xl"
            >
              Return to Login Page
            </Button>
          </Card>
        )}

        {/* ACTIVATION SUCCESS STATE */}
        {activatedSuccess && (
          <Card className="bg-[#131c36] border-emerald-500/40 p-8 rounded-2xl text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={36} />
            </div>
            <h2 className="text-xl font-black text-white">Account Activated Successfully!</h2>
            <p className="text-xs text-slate-300 font-medium">
              Your password has been configured. Redirecting to login in 3 seconds...
            </p>
            <Button
              onClick={() => router.push("/auth/login")}
              className="bg-[#274690] hover:bg-[#1f3561] text-white font-bold text-xs h-9 px-6 rounded-xl"
            >
              Go to Login Now →
            </Button>
          </Card>
        )}

        {/* VALID TOKEN - FORM SETUP STATE */}
        {!verifying && !invalidReason && !activatedSuccess && invitationData && (
          <Card className="bg-[#131c36] border-[#274690]/40 p-6 sm:p-8 rounded-2xl shadow-2xl space-y-5 border">
            <CardHeader className="p-0 pb-4 border-b border-slate-800 space-y-1">
              <Badge className="bg-[#274690] text-white text-[10px] font-bold w-fit">
                {isTeamLead ? "Role: Team Leader" : "Account Setup"}
              </Badge>
              <CardTitle className="text-lg font-black text-white flex items-center gap-2">
                <Lock size={18} className="text-[#8fb1ec]" /> Set Your Account Password
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0 space-y-4">
              {/* Display Organisation & Admin Read-Only Info */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-[#274690]/30 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                    <Building2 size={14} className="text-[#8fb1ec]" /> Organisation:
                  </span>
                  <span className="font-extrabold text-white">{invitationData.organisationName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                    <User size={14} className="text-[#8fb1ec]" /> Name:
                  </span>
                  <span className="font-extrabold text-white">{invitationData.adminName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                    <Mail size={14} className="text-[#8fb1ec]" /> Email Address:
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">{invitationData.adminEmail}</span>
                </div>
                {invitationData.role && (
                  <div className="flex items-center justify-between border-t border-slate-800 pt-2 mt-2">
                    <span className="text-slate-400 font-semibold">Assigned Role:</span>
                    <span className="font-bold text-[#8fb1ec]">{invitationData.role}</span>
                  </div>
                )}
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleActivateSubmit} className="space-y-4 text-xs font-bold">
                <div className="space-y-1.5">
                  <label className="text-slate-300">Create Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Minimum 8 characters (letters, numbers, symbols)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-10 px-3.5 pr-10 rounded-xl border border-slate-800 bg-slate-900 text-white font-mono text-xs focus:outline-none focus:border-[#274690]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {password && (
                    <div className="space-y-1 pt-1">
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-300 ${strength.color}`} style={{ width: `${strength.score}%` }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                        <span>Password Strength:</span>
                        <span className="font-bold text-slate-200">{strength.label}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300">Confirm Password *</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-800 bg-slate-900 text-white font-mono text-xs focus:outline-none focus:border-[#274690]"
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-[10px] text-rose-400 font-bold">⚠️ Passwords do not match</p>
                  )}
                  {confirmPassword && password === confirmPassword && (
                    <p className="text-[10px] text-emerald-400 font-bold">✓ Passwords match</p>
                  )}
                </div>

                <div className="pt-2">
                  <label className="flex items-start gap-2.5 cursor-pointer text-slate-300 font-medium leading-tight">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="rounded mt-0.5 border-slate-700 bg-slate-900"
                    />
                    <span>
                      I agree to the <span className="text-[#8fb1ec] underline">Terms of Service</span> & <span className="text-[#8fb1ec] underline">Privacy Policy</span>.
                    </span>
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#274690] hover:bg-[#1f3561] text-white font-extrabold text-xs h-11 rounded-xl shadow-lg shadow-[#274690]/30 gap-2 mt-2"
                >
                  {submitting ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
                  Activate Account & Complete Setup
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
