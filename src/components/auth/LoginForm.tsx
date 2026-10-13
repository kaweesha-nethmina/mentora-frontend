"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles } from "lucide-react";
import AuthInput from "@/components/auth/AuthInput";
import AuthButton from "@/components/auth/AuthButton";
import AuthDivider from "@/components/auth/AuthDivider";
import SocialButton from "@/components/auth/SocialButton";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/api/auth";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email";
    if (!password) e.password = "Password is required";
    return e;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);

    try {
      const result = await login({ email, password });
      if (result.success) {
        router.push("/dashboard");
      } else {
        setErrors({ general: result.message || "Invalid email or password" });
      }
    } catch {
      setErrors({ general: "Network error. Please try again." });
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 dark:text-teal-400 bg-teal-400/10 border border-teal-400/20 rounded-full px-3 py-1">
            <Sparkles className="w-3 h-3" /> AI-Powered Learning
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to continue your learning journey</p>
      </div>

      {/* Social Buttons */}
      <div>
        <SocialButton icon={<GoogleIcon />} label="Continue with Google" />
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
          label="Email address"
          id="login-email"
          type="email"
          placeholder="you@university.edu"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          icon={<Mail className="w-4 h-4" />}
        />

        <div>
          <AuthInput
            label="Password"
            id="login-password"
            type={showPw ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            icon={<Lock className="w-4 h-4" />}
            rightElement={
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPw((v) => !v)}
                className="text-subtle-foreground hover:text-foreground/80 transition-colors"
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
          <div className="flex justify-end mt-2">
            <Link
              href="/forgot-password"
              className="text-xs text-teal-700 dark:text-teal-400/80 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {/* Remember me */}
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            id="remember-me"
            className="w-4 h-4 rounded border-border-strong bg-muted accent-teal-500 cursor-pointer"
          />
          <span className="text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors">
            Remember me for 30 days
          </span>
        </label>

        <AuthButton loading={loading} type="submit">
          <span className="flex items-center gap-2">
            Sign in <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </span>
        </AuthButton>
      </form>

      {/* Footer link */}
      <p className="text-center text-sm text-subtle-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="text-teal-700 dark:text-teal-400 font-semibold hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
        >
          Sign up for free
        </Link>
      </p>
    </div>
  );
}
