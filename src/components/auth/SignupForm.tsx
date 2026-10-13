"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Eye, EyeOff, Mail, Lock, User, ArrowRight, Sparkles, Check, MapPin,
} from "lucide-react";
import AuthInput from "@/components/auth/AuthInput";
import AuthButton from "@/components/auth/AuthButton";
import AuthDivider from "@/components/auth/AuthDivider";
import SocialButton from "@/components/auth/SocialButton";
import PasswordStrength from "@/components/auth/PasswordStrength";
import { useAuth } from "@/contexts/AuthContext";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

export default function SignupForm() {
  const router = useRouter();
  const { register, loginWithGoogle } = useAuth();
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [step, setStep] = useState<"form" | "success">("form");

  const [form, setForm] = useState({
    name: "", email: "", password: "", confirm: "", country: "",
  });
  const [errors, setErrors] = useState<Partial<typeof form & { agree: string; general: string }>>({});

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.country) e.country = "Country is required";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8) e.password = "At least 8 characters";
    if (form.confirm !== form.password) e.confirm = "Passwords do not match";
    if (!agreed) e.agree = "Please accept the terms";
    return e;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);

    try {
      const result = await register({
        name: form.name,
        email: form.email,
        password: form.password,
        country: form.country,
      });

      if (result.success) {
        setStep("success");
        setTimeout(() => router.push("/dashboard"), 2000);
      } else {
        setErrors({ general: result.message || "Registration failed. Please try again." });
      }
    } catch {
      setErrors({ general: "Network error. Please try again." });
    }

    setLoading(false);
  };

  if (step === "success") {
    return (
      <div className="space-y-6 text-center animate-slide-up py-4">
        <div className="mx-auto w-20 h-20 rounded-full bg-teal-500/15 border border-teal-500/30 flex items-center justify-center animate-bounce-subtle">
          <Check className="w-10 h-10 text-teal-700 dark:text-teal-400" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-foreground mb-2">Account created!</h2>
          <p className="text-muted-foreground text-sm">
            Welcome to Mentora, <span className="text-teal-700 dark:text-teal-400 font-semibold">{form.name.split(" ")[0]}</span>!
            <br />Check your email to verify your account.
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

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div className="space-y-1">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 dark:text-teal-400 bg-teal-400/10 border border-teal-400/20 rounded-full px-3 py-1">
          <Sparkles className="w-3 h-3" /> Free for students
        </span>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight pt-1">Create your account</h1>
        <p className="text-sm text-muted-foreground">Start your AI-powered learning journey today</p>
      </div>

      {/* Social */}
      <div>
        <SocialButton icon={<GoogleIcon />} label="Continue with Google" onClick={loginWithGoogle} />
      </div>

      <AuthDivider />

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {errors.general && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {errors.general}
          </div>
        )}
        <AuthInput
          label="Full name"
          id="signup-name"
          type="text"
          placeholder="Jane Smith"
          autoComplete="name"
          value={form.name}
          onChange={set("name")}
          error={errors.name}
          icon={<User className="w-4 h-4" />}
        />
        <AuthInput
          label="Email address"
          id="signup-email"
          type="email"
          placeholder="you@university.edu"
          autoComplete="email"
          value={form.email}
          onChange={set("email")}
          error={errors.email}
          icon={<Mail className="w-4 h-4" />}
        />

        <div className="relative">
          <label
            htmlFor="signup-country"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            Country
          </label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle-foreground pointer-events-none">
              <MapPin className="w-4 h-4" />
            </div>
            <select
              id="signup-country"
              value={form.country}
              onChange={set("country")}
              className="w-full h-11 pl-11 pr-10 rounded-lg border border-input bg-card dark:bg-sunken text-foreground focus:border-ring focus:ring-[3px] focus:ring-ring/20 outline-none transition-colors hover:border-border-strong appearance-none cursor-pointer"
            >
              <option value="" className="bg-popover text-foreground">Select your country</option>
              <option value="Sri Lanka" className="bg-popover text-foreground">Sri Lanka</option>
              <option value="India" className="bg-popover text-foreground">India</option>
              <option value="United States" className="bg-popover text-foreground">United States</option>
              <option value="United Kingdom" className="bg-popover text-foreground">United Kingdom</option>
              <option value="Australia" className="bg-popover text-foreground">Australia</option>
              <option value="Canada" className="bg-popover text-foreground">Canada</option>
              <option value="Germany" className="bg-popover text-foreground">Germany</option>
              <option value="France" className="bg-popover text-foreground">France</option>
              <option value="Japan" className="bg-popover text-foreground">Japan</option>
              <option value="Singapore" className="bg-popover text-foreground">Singapore</option>
              <option value="Malaysia" className="bg-popover text-foreground">Malaysia</option>
              <option value="Other" className="bg-popover text-foreground">Other</option>
            </select>
          </div>
          {errors.country && <p className="text-xs text-red-700 dark:text-red-400 mt-1 ml-1">{errors.country}</p>}
        </div>

        <div>
          <AuthInput
            label="Password"
            id="signup-password"
            type={showPw ? "text" : "password"}
            placeholder="Create a strong password"
            autoComplete="new-password"
            value={form.password}
            onChange={set("password")}
            error={errors.password}
            icon={<Lock className="w-4 h-4" />}
            rightElement={
              <button type="button" tabIndex={-1} onClick={() => setShowPw((v) => !v)}
                className="text-subtle-foreground hover:text-foreground/80 transition-colors" aria-label="Toggle password">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
          <PasswordStrength password={form.password} />
        </div>

        <AuthInput
          label="Confirm password"
          id="signup-confirm"
          type={showConfirm ? "text" : "password"}
          placeholder="Repeat your password"
          autoComplete="new-password"
          value={form.confirm}
          onChange={set("confirm")}
          error={errors.confirm}
          icon={<Lock className="w-4 h-4" />}
          rightElement={
            <button type="button" tabIndex={-1} onClick={() => setShowConfirm((v) => !v)}
              className="text-subtle-foreground hover:text-foreground/80 transition-colors" aria-label="Toggle confirm">
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />

        {/* Terms */}
        <div>
          <label className="flex items-start gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              id="terms"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-border-strong bg-muted accent-teal-500 cursor-pointer"
            />
            <span className="text-xs text-subtle-foreground group-hover:text-muted-foreground transition-colors leading-relaxed">
              I agree to the{" "}
              <Link href="#" className="text-teal-700 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium">Terms of Service</Link>
              {" "}and{" "}
              <Link href="#" className="text-teal-700 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium">Privacy Policy</Link>
            </span>
          </label>
          {errors.agree && <p className="text-xs text-red-700 dark:text-red-400 mt-1 ml-6">{errors.agree}</p>}
        </div>

        <AuthButton loading={loading} type="submit">
          <span className="flex items-center gap-2">
            Create account <ArrowRight className="w-4 h-4" />
          </span>
        </AuthButton>
      </form>

      <p className="text-center text-sm text-subtle-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-teal-700 dark:text-teal-400 font-semibold hover:text-teal-700 dark:hover:text-teal-300 transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
