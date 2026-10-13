"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight, ArrowLeft, RefreshCw, ShieldCheck, KeyRound } from "lucide-react";
import AuthInput from "@/components/auth/AuthInput";
import AuthButton from "@/components/auth/AuthButton";

type Step = "email" | "sent" | "otp" | "reset" | "done";

export default function ForgotPasswordForm() {
  const [step, setStep] = useState<Step>("email");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwErrors, setPwErrors] = useState<{ newPw?: string; confirm?: string }>({});
  const [resendCount, setResendCount] = useState(0);

  /* ── step 1 – submit email ── */
  const handleEmailSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!email) { setEmailError("Email is required"); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setEmailError("Enter a valid email"); return; }
    setEmailError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1800));
    setLoading(false);
    setStep("sent");
  };

  /* ── OTP input handler ── */
  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) {
      document.getElementById(`otp-${idx + 1}`)?.focus();
    }
  };
  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      document.getElementById(`otp-${idx - 1}`)?.focus();
    }
  };

  const handleOtpSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (otp.some((d) => !d)) { setOtpError("Enter all 6 digits"); return; }
    setOtpError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setStep("reset");
  };

  /* ── step 3 – new password ── */
  const handleResetSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e: typeof pwErrors = {};
    if (!newPw || newPw.length < 8) e.newPw = "At least 8 characters";
    if (confirmPw !== newPw) e.confirm = "Passwords do not match";
    if (Object.keys(e).length) { setPwErrors(e); return; }
    setPwErrors({});
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1800));
    setLoading(false);
    setStep("done");
  };

  const handleResend = async () => {
    setResendCount((c) => c + 1);
    setOtp(["", "", "", "", "", ""]);
    await new Promise((r) => setTimeout(r, 1000));
  };

  /* ════════════════════ RENDER ════════════════════ */

  if (step === "email" || step === "sent") {
    const isSent = step === "sent";
    return (
      <div className="space-y-6 animate-slide-up">
        {/* Back */}
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-subtle-foreground hover:text-foreground/80 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign in
        </Link>

        {/* Icon */}
        <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center
          ${isSent ? "bg-teal-500/15 border border-teal-500/30" : "bg-amber-500/10 border border-amber-500/20"}`}
        >
          {isSent
            ? <ShieldCheck className="w-8 h-8 text-teal-700 dark:text-teal-400" />
            : <KeyRound className="w-8 h-8 text-amber-700 dark:text-amber-400" />
          }
        </div>

        <div className="space-y-1.5">
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            {isSent ? "Check your inbox" : "Reset password"}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isSent
              ? <>We sent a 6-digit code to <span className="text-teal-700 dark:text-teal-400 font-semibold">{email}</span>. Enter it below to continue.</>
              : "Enter your registered email and we'll send you a reset link."
            }
          </p>
        </div>

        {!isSent ? (
          <form onSubmit={handleEmailSubmit} noValidate className="space-y-4">
            <AuthInput
              label="Email address"
              id="forgot-email"
              type="email"
              placeholder="you@university.edu"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={emailError}
              icon={<Mail className="w-4 h-4" />}
            />
            <AuthButton loading={loading} type="submit">
              <span className="flex items-center gap-2">
                Send reset code <ArrowRight className="w-4 h-4" />
              </span>
            </AuthButton>
          </form>
        ) : (
          <div className="space-y-4">
            <AuthButton onClick={() => setStep("otp")} type="button">
              <span className="flex items-center gap-2">
                Enter code <ArrowRight className="w-4 h-4" />
              </span>
            </AuthButton>
            <button
              type="button"
              onClick={() => setStep("email")}
              className="w-full text-sm text-subtle-foreground hover:text-muted-foreground transition-colors flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Wrong email? Try again
            </button>
          </div>
        )}
      </div>
    );
  }

  if (step === "otp") {
    return (
      <div className="space-y-6 animate-slide-up">
        <button
          onClick={() => setStep("sent")}
          className="inline-flex items-center gap-1.5 text-sm text-subtle-foreground hover:text-foreground/80 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        <div className="mx-auto w-16 h-16 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center">
          <ShieldCheck className="w-8 h-8 text-teal-700 dark:text-teal-400 animate-bounce-subtle" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-2xl font-extrabold text-foreground">Enter OTP</h1>
          <p className="text-sm text-muted-foreground">
            6-digit code sent to <span className="text-teal-700 dark:text-teal-400 font-semibold">{email}</span>
          </p>
        </div>

        <form onSubmit={handleOtpSubmit} noValidate className="space-y-4">
          {/* OTP inputs */}
          <div className="flex gap-2.5 justify-between">
            {otp.map((digit, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                className={`w-full aspect-square max-w-[52px] text-center text-xl font-bold rounded-xl
                  border bg-muted text-foreground caret-teal-400
                  transition-all duration-200 outline-none
                  focus:border-teal-500/70 focus:bg-surface-3
                   focus:ring-0
                  ${digit ? "border-teal-500/50 bg-teal-500/10" : "border-border"}
                  ${otpError ? "border-red-500/60" : ""}
                `}
              />
            ))}
          </div>
          {otpError && <p className="text-xs text-red-700 dark:text-red-400">{otpError}</p>}

          <AuthButton loading={loading} type="submit">
            <span className="flex items-center gap-2">
              Verify code <ArrowRight className="w-4 h-4" />
            </span>
          </AuthButton>

          <button
            type="button"
            onClick={handleResend}
            className="w-full text-sm text-subtle-foreground hover:text-teal-700 dark:hover:text-teal-400 transition-colors flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {resendCount > 0 ? `Resend code (${resendCount})` : "Didn't receive it? Resend"}
          </button>
        </form>
      </div>
    );
  }

  if (step === "reset") {
    return (
      <div className="space-y-6 animate-slide-up">
        <button
          onClick={() => setStep("otp")}
          className="inline-flex items-center gap-1.5 text-sm text-subtle-foreground hover:text-foreground/80 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <KeyRound className="w-8 h-8 text-amber-700 dark:text-amber-400" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-2xl font-extrabold text-foreground">New password</h1>
          <p className="text-sm text-muted-foreground">Choose a strong password for your account</p>
        </div>

        <form onSubmit={handleResetSubmit} noValidate className="space-y-4">
          <AuthInput
            label="New password"
            id="reset-new-pw"
            type="password"
            placeholder="Min. 8 characters"
            autoComplete="new-password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            error={pwErrors.newPw}
            icon={<KeyRound className="w-4 h-4" />}
          />
          <AuthInput
            label="Confirm new password"
            id="reset-confirm-pw"
            type="password"
            placeholder="Repeat password"
            autoComplete="new-password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            error={pwErrors.confirm}
            icon={<KeyRound className="w-4 h-4" />}
          />
          <AuthButton loading={loading} type="submit" variant="secondary">
            <span className="flex items-center gap-2">
              Reset password <ArrowRight className="w-4 h-4" />
            </span>
          </AuthButton>
        </form>
      </div>
    );
  }

  /* ── done ── */
  return (
    <div className="space-y-6 text-center animate-slide-up py-4">
      <div className="mx-auto w-20 h-20 rounded-full bg-teal-500/15 border border-teal-500/30 flex items-center justify-center animate-bounce-subtle">
        <ShieldCheck className="w-10 h-10 text-teal-700 dark:text-teal-400" />
      </div>
      <div>
        <h2 className="text-2xl font-extrabold text-foreground mb-2">All done!</h2>
        <p className="text-muted-foreground text-sm">
          Your password has been reset successfully.<br />
          You can now sign in with your new password.
        </p>
      </div>
      <AuthButton fullWidth={false} className="mx-auto px-8">
        <Link href="/login" className="flex items-center gap-2">
          Go to Sign in <ArrowRight className="w-4 h-4" />
        </Link>
      </AuthButton>
    </div>
  );
}
