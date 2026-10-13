"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Brain, BookOpen, Target, Users, ChevronRight, Check, Sun, Moon,
  Lightbulb, FlaskConical, ArrowUpRight,
} from "lucide-react";
import { GitHubIcon } from "@/components/onboarding/GithubLinkCard";
import MentoraLogo from "@/components/auth/MentoraLogo";
import { useTheme } from "@/contexts/ThemeContext";
import InteractiveBackground from "@/components/layout/InteractiveBackground";

const loop = [
  {
    title: "Analyse your work",
    desc: "Mentora reads the Java you have already written on GitHub and the answers you give, not just quiz scores.",
  },
  {
    title: "Diagnose the gap",
    desc: "It separates a missing fundamental from a partial idea or a surface slip, and names the misconception.",
  },
  {
    title: "Teach to the gap",
    desc: "A lesson, worked examples, a quiz and flashcards are written for that exact concept at your level.",
  },
  {
    title: "Measure mastery",
    desc: "Adaptive questions and code challenges confirm the concept has stuck before moving you on.",
  },
];

const agents = [
  {
    icon: Brain,
    name: "Knowledge Assistant",
    tone: "bg-primary-soft text-primary-soft-foreground",
    desc: "Builds your knowledge profile from repository forensics, quizzes and sandbox challenges.",
    points: ["GitHub repository analysis", "Misconception diagnosis", "Career-fit insights"],
  },
  {
    icon: BookOpen,
    name: "Learning Material Generator",
    tone: "bg-info-soft text-info",
    desc: "Turns each knowledge gap into a short course you can work through at your own pace.",
    points: ["Lessons and worked examples", "Quizzes and flashcards", "Hands-on coding workspace"],
  },
  {
    icon: Target,
    name: "Assessment & Mastery",
    tone: "bg-warning-soft text-warning",
    desc: "Adapts question difficulty as you answer and reports mastery concept by concept.",
    points: ["Adaptive question sets", "Code tracing and debugging", "Detailed mastery report"],
  },
  {
    icon: Users,
    name: "Collaborative Peer Learning",
    tone: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
    desc: "Matches you with a classmate whose strengths cover your gaps, then guides the session.",
    points: ["Smart peer matching", "Shared live code editor", "AI-guided pair sessions"],
  },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme, mounted } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden relative">
      <InteractiveBackground />

      {/* ── HEADER ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
          scrolled ? "bg-background/90 backdrop-blur-md border-b border-border" : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-5 md:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" aria-label="Mentora home"><MentoraLogo size="sm" /></Link>
          <nav className="hidden md:flex items-center gap-1 text-sm" aria-label="Sections">
            <a href="#how-it-works" className="px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">How it works</a>
            <a href="#agents" className="px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">Agents</a>
            <a href="#research" className="px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">Research</a>
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {mounted ? (theme === "dark" ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />) : <span className="w-[18px] h-[18px]" />}
            </button>
            <Link
              href="/login"
              className="hidden sm:inline-flex h-9 items-center px-4 text-sm font-semibold text-foreground rounded-lg hover:bg-muted transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-9 items-center px-4 text-sm font-semibold text-white bg-action rounded-lg shadow-xs hover:brightness-110 transition"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-page-glow">
        <div className="max-w-6xl mx-auto px-5 md:px-6 grid lg:grid-cols-[1.05fr_1fr] gap-14 items-center">
          <div className="animate-slide-up">
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              Multi-agent tutoring for Java programming
            </p>
            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-[3.6rem] font-extrabold leading-[1.06] tracking-tight text-heading">
              A tutor that finds what you have not understood yet.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
              Mentora studies how you write and reason about Java, pinpoints the concept behind each mistake,
              and teaches exactly that, then checks that it stuck.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row gap-3">
              <Link
                href="/signup"
                className="group inline-flex items-center justify-center gap-2 h-12 px-6 text-base font-semibold text-white bg-action rounded-xl shadow-raised hover:brightness-110 transition"
              >
                Start learning <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center h-12 px-6 text-base font-semibold text-foreground bg-card border border-border-strong rounded-xl hover:bg-muted transition-colors"
              >
                See how it works
              </a>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {["Personal knowledge profile", "Lessons written for you", "Adaptive mastery checks"].map((t) => (
                <li key={t} className="flex items-center gap-2"><Check className="w-4 h-4 text-brand" />{t}</li>
              ))}
            </ul>
          </div>

          {/* Tutoring moment */}
          <div className="relative animate-slide-up delay-200" aria-label="Example of Mentora diagnosing a misconception">
            <div className="surface-card overflow-hidden shadow-overlay">
              <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-2.5">
                <span className="font-mono text-xs text-muted-foreground">LoginCheck.java</span>
                <span className="text-xs text-muted-foreground">Your submission</span>
              </div>
              <pre className="bg-sunken px-5 py-4 font-mono text-[13px] leading-6 text-foreground overflow-x-auto"><code>
<span className="text-violet-700 dark:text-violet-300">String</span> input = scanner.nextLine();{"\n"}
<span className="text-violet-700 dark:text-violet-300">if</span> (input <span className="rounded bg-danger-soft px-1 text-danger ring-1 ring-danger/30">==</span> <span className="text-primary-soft-foreground">&quot;admin&quot;</span>) {"{"}{"\n"}
{"    "}grantAccess();{"\n"}
{"}"}
              </code></pre>
              <div className="space-y-4 p-5">
                <div className="flex gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warning-soft text-warning"><Lightbulb className="h-4 w-4" /></span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Misconception found: comparing Strings with ==</p>
                    <p className="mt-1 text-sm text-muted-foreground"><code className="font-mono text-[13px]">==</code> checks whether both sides are the same object. Use <code className="font-mono text-[13px] text-primary-soft-foreground">input.equals(&quot;admin&quot;)</code> to compare text.</p>
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-muted p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">Object equality</span>
                    <span className="tabular-nums text-muted-foreground">38% → 82%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-card ring-1 ring-inset ring-border overflow-hidden">
                    <div className="h-full w-[82%] rounded-full bg-action" />
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">After a 6-minute lesson and four practice questions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-20 md:py-24 border-y border-border bg-card scroll-mt-16">
        <div className="max-w-6xl mx-auto px-5 md:px-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-heading">One loop, repeated until it sticks</h2>
            <p className="mt-4 text-lg text-muted-foreground">Every concept goes through the same four steps. Each pass sharpens your knowledge profile, so the next lesson starts closer to where you are.</p>
          </div>
          <ol className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2 lg:grid-cols-4">
            {loop.map((step, i) => (
              <li key={step.title} className="bg-card p-6">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary-soft-foreground">{i + 1}</span>
                <h3 className="mt-5 text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── AGENTS ── */}
      <section id="agents" className="py-20 md:py-24 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-5 md:px-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-heading">Four agents, one tutor</h2>
            <p className="mt-4 text-lg text-muted-foreground">Each agent owns one part of teaching. They share your knowledge profile, so what one learns about you, the others use.</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {agents.map((a) => (
              <article key={a.name} className="surface-card p-6 md:p-7">
                <div className="flex items-start gap-4">
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${a.tone}`}><a.icon className="h-5 w-5" /></span>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{a.name}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{a.desc}</p>
                  </div>
                </div>
                <ul className="mt-5 grid gap-2 border-t border-border pt-5 sm:grid-cols-3">
                  {a.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-foreground/80"><Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />{p}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── RESEARCH ── */}
      <section id="research" className="px-5 md:px-6 pb-20 md:pb-24 scroll-mt-16">
        <div className="relative max-w-6xl mx-auto overflow-hidden rounded-3xl bg-forest px-7 py-12 md:px-14 md:py-16 text-white">
          <svg aria-hidden className="pointer-events-none absolute -right-16 -bottom-24 h-96 w-96 text-white/[0.05]" viewBox="0 0 200 200" fill="none">
            <path d="M100 10c40 30 70 70 60 120-10 40-50 60-60 60s-50-20-60-60C30 80 60 40 100 10Z" fill="currentColor" />
          </svg>
          <div className="relative grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-end">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-white/70"><FlaskConical className="h-4 w-4" /> Research project R26-SE-030, SLIIT</p>
              <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">Built and evaluated as academic research</h2>
              <p className="mt-4 max-w-xl text-white/80 leading-relaxed">
                Mentora is developed at the Sri Lanka Institute of Information Technology to study how cooperating AI agents can personalise programming education and measure real mastery.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-stretch">
              <a
                href="https://mentora-website.kaweesha.com/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-white text-[#14532d] font-semibold hover:bg-[#e8f8ed] transition-colors"
              >
                Read the research <ArrowUpRight className="h-4 w-4" />
              </a>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-white/10 text-white font-semibold ring-1 ring-white/25 hover:bg-white/15 transition-colors"
              >
                Create a free account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border bg-card">
        <div className="max-w-6xl mx-auto px-5 md:px-6 py-10 grid gap-8 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <MentoraLogo size="sm" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              An agentic, multi-agent tutoring system for personalised learning and mastery assessment in programming education.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Product</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><a href="#how-it-works" className="hover:text-primary transition-colors">How it works</a></li>
              <li><a href="#agents" className="hover:text-primary transition-colors">Agents</a></li>
              <li><Link href="/login" className="hover:text-primary transition-colors">Log in</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Project</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><a href="https://mentora-website.kaweesha.com/" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">Research website</a></li>
              <li><a href="https://github.com/mentora-ai-tutor" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-primary transition-colors"><GitHubIcon className="h-3.5 w-3.5" /> GitHub</a></li>
              <li><a href="https://mentora-website.kaweesha.com/contact.html" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border">
          <p className="max-w-6xl mx-auto px-5 md:px-6 py-5 text-xs text-muted-foreground">
            © {new Date().getFullYear()} Mentora, R26-SE-030. Department of Software Engineering, Faculty of Computing, SLIIT.
          </p>
        </div>
      </footer>
    </div>
  );
}
