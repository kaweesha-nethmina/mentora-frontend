import { ReactNode } from "react";
import type { Metadata } from "next";
import AuthBackground from "@/components/auth/AuthBackground";
import Link from "next/link";
import MentoraLogo from "@/components/auth/MentoraLogo";

export const metadata: Metadata = {
  title: {
    template: "%s | Mentora",
    default: "Mentora | Personalised Java Tutoring",
  },
  description:
    "Sign in or create your Mentora account to access personalised AI-powered learning, assessments and peer collaboration.",
};

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const highlights = [
    { title: "Know where you stand", desc: "A knowledge profile built from your own Java code and answers." },
    { title: "Learn what you are missing", desc: "Lessons, quizzes and flashcards written for your exact gaps." },
    { title: "Prove you have mastered it", desc: "Adaptive assessments and peer sessions confirm real progress." },
  ];

  return (
    <div className="relative min-h-screen flex bg-background">
      <AuthBackground />

      {/* ── Left story panel (desktop) ── */}
      <aside className="hidden lg:flex lg:w-[46%] xl:w-1/2 relative z-10 flex-col justify-between overflow-hidden bg-forest p-12 xl:p-14 text-white">
        <svg aria-hidden className="pointer-events-none absolute -right-24 -bottom-28 h-[30rem] w-[30rem] text-white/[0.05]" viewBox="0 0 200 200" fill="none">
          <path d="M100 10c40 30 70 70 60 120-10 40-50 60-60 60s-50-20-60-60C30 80 60 40 100 10Z" fill="currentColor" />
          <path d="M100 30v160M100 80l-28-20M100 110l32-24M100 140l-30-18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>

        <Link href="/" aria-label="Mentora home" className="relative w-fit">
          <MentoraLogo size="md" tone="inverse" />
        </Link>

        <div className="relative max-w-md">
          <h2 className="text-4xl xl:text-[2.6rem] font-extrabold leading-[1.1] tracking-tight">
            Learn Java with a tutor that adapts to you.
          </h2>
          <p className="mt-4 text-white/75 leading-relaxed">
            Four cooperating AI agents diagnose, teach, assess and pair you with peers, all from one shared picture of what you know.
          </p>

          <ol className="mt-10 space-y-5">
            {highlights.map((h, i) => (
              <li key={h.title} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold ring-1 ring-white/20">{i + 1}</span>
                <div>
                  <p className="font-semibold">{h.title}</p>
                  <p className="mt-0.5 text-sm text-white/70">{h.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <p className="relative text-xs text-white/55">
          © {new Date().getFullYear()} Mentora, research project R26-SE-030 at SLIIT
        </p>
      </aside>

      {/* ── Right panel: form ── */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-5 sm:p-10">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8 lg:hidden">
            <Link href="/" aria-label="Mentora home"><MentoraLogo size="md" /></Link>
          </div>

          <div className="surface-card shadow-raised p-7 sm:p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
