"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu, X, Search, Bell, Settings, LogOut,
  LayoutDashboard, Brain, BookOpen, Target, Users, TrendingUp, User,
  CheckCircle2, AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import MentoraLogo from "@/components/auth/MentoraLogo";
import { useAuth } from "@/contexts/AuthContext";
import GithubLinkCard, { GitHubIcon } from "@/components/onboarding/GithubLinkCard";
import { githubApi } from "@/lib/api/github";
import { toast } from "sonner";
import InteractiveBackground from "../layout/InteractiveBackground";

type NavSubItem = {
  name: string;
  href: string;
};

type NavItem = {
  name: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems?: NavSubItem[];
};

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    name: "Knowledge Assist",
    icon: Brain,
    subItems: [
      { name: "Knowledge Profile", href: "/knowledge-assist" },
      { name: "Assessment", href: "/knowledge-assist/assessment" },
      { name: "Sandbox", href: "/knowledge-assist/sandbox" },
      { name: "Forensics", href: "/knowledge-assist/forensics" },
      { name: "Mastery", href: "/knowledge-assist/mastery" },
    ],
  },
  { name: "Material Generator", href: "/learning-generator", icon: BookOpen },
  { name: "Assessment", href: "/assessment", icon: Target },
  { name: "Peer Learning", href: "/peer-learning", icon: Users },
  { name: "Progress", href: "/progress", icon: TrendingUp },
] satisfies NavItem[];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [githubPromptOpen, setGithubPromptOpen] = useState(false);
  const [githubPromptMode, setGithubPromptMode] = useState<"connect" | "change">("connect");
  const [githubMenuOpen, setGithubMenuOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout, refreshUser } = useAuth();
  const githubLinked = user?.github?.linked === true;
  const githubLogin = user?.github?.gh_login;
  const needsGithubLink = !isLoading && !!user && !githubLinked;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);

    const frame = window.requestAnimationFrame(() => {
      if (window.innerWidth < 1024) setSidebarOpen(false);
    });

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (!needsGithubLink) return;

    const frame = window.requestAnimationFrame(() => {
      setGithubPromptMode("connect");
      setGithubPromptOpen(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [needsGithubLink]);

  const handleGithubStatusClick = async () => {
    if (!user) return;

    if (!githubLinked) {
      setGithubPromptMode("connect");
      setGithubPromptOpen(true);
      return;
    }

    setGithubMenuOpen((open) => !open);
  };

  const handleRefreshGithubStatus = async () => {
    setGithubMenuOpen(false);

    try {
      await refreshUser();
      toast.success(
        githubLogin
          ? `GitHub connected as @${githubLogin}`
          : "GitHub is connected",
      );
    } catch {
      toast.error("Could not refresh GitHub status");
    }
  };

  const handleChangeGithubAccount = () => {
    setGithubMenuOpen(false);
    setGithubPromptMode("change");
    setGithubPromptOpen(true);
  };

  const handleDisconnectGithub = async () => {
    setGithubMenuOpen(false);

    try {
      await githubApi.unlink();
      toast.success("GitHub disconnected");
      await refreshUser();
      setGithubPromptMode("connect");
      setGithubPromptOpen(true);
    } catch {
      toast.error("Could not disconnect GitHub");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">

      {/* ── SIDEBAR ── */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-sunken border-r border-border transform transition-transform duration-300 ease-in-out flex flex-col ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-20"
          }`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-border shrink-0">
          <div className={`overflow-hidden transition-all ${!sidebarOpen && "lg:hidden"}`}>
            <MentoraLogo size="sm" />
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1.5 scrollbar-hide">
          {navItems.map((item) => {
            const subMenuActive = item.subItems?.some((subItem) => pathname === subItem.href) ?? false;
            const active = item.href ? pathname === item.href : subMenuActive;

            if (item.subItems) {
              const isExpanded = expandedMenu === item.name;
              return (
                <div key={item.name} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setExpandedMenu((prev) => (prev === item.name ? null : item.name))}
                    className={`relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300
                      ${active
                        ? "bg-teal-500/10 text-teal-700 dark:text-teal-400 "
                        : "text-muted-foreground hover:bg-surface-3 hover:text-teal-800 dark:hover:text-teal-200"
                      }
                    `}
                    title={!sidebarOpen ? item.name : undefined}
                  >
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-teal-500 rounded-r-full " />
                    )}
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span className={`font-semibold text-sm whitespace-nowrap transition-opacity duration-300 ${!sidebarOpen && "lg:opacity-0 lg:hidden"}`}>
                      {item.name}
                    </span>
                  </button>

                  <div className={`${!isExpanded || !sidebarOpen ? "hidden" : ""} pl-6 space-y-1`}>
                    {item.subItems.map((subItem) => {
                      const subActive = pathname === subItem.href;
                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={`block px-3 py-2 rounded-lg text-sm transition-all
                            ${subActive
                              ? "bg-teal-500/10 text-teal-700 dark:text-teal-300"
                              : "text-muted-foreground hover:text-teal-800 dark:hover:text-teal-200 hover:bg-surface-3"
                            }
                          `}
                        >
                          {subItem.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group
                  ${active
                    ? "bg-teal-500/10 text-teal-700 dark:text-teal-400 "
                    : "text-muted-foreground hover:bg-surface-3 hover:text-teal-800 dark:hover:text-teal-200"
                  }
                `}
                title={!sidebarOpen ? item.name : undefined}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-teal-500 rounded-r-full " />
                )}
                <item.icon className={`w-5 h-5 shrink-0 transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-110"}`} />
                <span className={`font-semibold text-sm whitespace-nowrap transition-opacity duration-300 ${!sidebarOpen && "lg:opacity-0 lg:hidden"}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border space-y-1.5 shrink-0">
          {user && (
            <div className="relative">
              {githubMenuOpen && githubLinked && sidebarOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Close GitHub account menu"
                    className="fixed inset-0 z-30 cursor-default"
                    onClick={() => setGithubMenuOpen(false)}
                  />
                  <div className="absolute bottom-full left-0 right-0 z-40 mb-2 rounded-xl border border-border bg-popover p-2 shadow-overlay">
                    <div className="px-3 py-2 border-b border-border">
                      <p className="text-xs font-semibold text-foreground">GitHub account</p>
                      <p className="text-[10px] uppercase tracking-widest text-teal-700 dark:text-teal-300 truncate">
                        {githubLogin ? `@${githubLogin}` : "Connected"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleChangeGithubAccount}
                      className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-foreground/80 hover:bg-teal-500/10 hover:text-teal-800 dark:hover:text-teal-200 transition-colors"
                    >
                      Change account
                    </button>
                    <button
                      type="button"
                      onClick={handleRefreshGithubStatus}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      Check status
                    </button>
                    <button
                      type="button"
                      onClick={handleDisconnectGithub}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-700 dark:text-red-300/80 hover:bg-red-500/10 hover:text-red-800 dark:hover:text-red-200 transition-colors"
                    >
                      Disconnect account
                    </button>
                  </div>
                </>
              )}

              <button
                type="button"
                onClick={handleGithubStatusClick}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border transition-all group
                  ${githubLinked
                    ? "border-teal-500/20 bg-teal-500/10 text-teal-800 dark:text-teal-200 hover:bg-teal-500/15"
                    : "border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-200 hover:bg-amber-500/15"
                  }
                `}
                title={
                  githubLinked
                    ? `GitHub connected${githubLogin ? ` as @${githubLogin}` : ""}`
                    : "Connect GitHub"
                }
              >
                <GitHubIcon className="w-5 h-5 shrink-0" />
                <span className={`min-w-0 flex-1 text-left ${!sidebarOpen && "lg:hidden"}`}>
                  <span className="block text-sm font-semibold leading-tight">
                    {githubLinked ? "GitHub connected" : "Connect GitHub"}
                  </span>
                  <span className="block truncate text-[10px] uppercase tracking-widest text-subtle-foreground pt-0.5">
                    {githubLinked
                      ? githubLogin
                        ? `@${githubLogin}`
                        : "Linked"
                      : "Required"}
                  </span>
                </span>
                {githubLinked ? (
                  <CheckCircle2 className={`w-4 h-4 text-teal-700 dark:text-teal-300 ${!sidebarOpen && "lg:hidden"}`} />
                ) : (
                  <AlertCircle className={`w-4 h-4 text-amber-700 dark:text-amber-300 ${!sidebarOpen && "lg:hidden"}`} />
                )}
              </button>
            </div>
          )}
          <Link href="/settings" className={`flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:bg-surface-3 hover:text-foreground transition-all group`}>
            <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            <span className={`font-medium text-sm whitespace-nowrap ${!sidebarOpen && "lg:hidden"}`}>Settings</span>
          </Link>
          <button
            onClick={async () => { await logout(); router.push("/login"); }}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-400 transition-all group`}
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className={`font-medium text-sm whitespace-nowrap ${!sidebarOpen && "lg:hidden"}`}>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">

        {/* HEADER */}
        <header className={`h-16 flex items-center justify-between px-4 lg:px-8 border-b border-transparent transition-all duration-300 z-30
          ${scrolled ? "bg-background/80 backdrop-blur-md border-border shadow-raised" : "bg-transparent"}
        `}>
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-muted border border-border rounded-full focus-within:border-teal-500/50 transition-all">
              <Search className="w-4 h-4 text-subtle-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-subtle-foreground w-48 focus:w-64 transition-all duration-300"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-5">
            <button className="relative p-2 rounded-full text-muted-foreground hover:text-teal-700 dark:hover:text-teal-400 hover:bg-muted transition-all">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#B45309] animate-pulse" />
            </button>

            <div className="h-6 w-px bg-surface-3" />

            <div className="relative">
              <div
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => setProfileOpen(!profileOpen)}
              >
                <div className="hidden md:block text-right">
                  <p className="text-sm font-bold text-foreground group-hover:text-teal-800 dark:group-hover:text-teal-200 transition-colors">{user?.name || "User"}</p>
                  <p className="text-[10px] text-teal-700 dark:text-teal-400 uppercase tracking-widest font-semibold pb-0.5">{user?.role || "Student"}</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-teal-800 border-2 border-background flex items-center justify-center font-bold relative overflow-hidden transition-transform ">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
              </div>

              {/* Profile Dropdown */}
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 top-full mt-3 w-48 bg-card border border-border rounded-2xl shadow-overlay overflow-hidden z-50 animate-slide-up origin-top-right">
                    <div className="p-2 space-y-1">
                      <Link
                        href="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-foreground/80 hover:text-teal-700 dark:hover:text-teal-400 hover:bg-teal-500/10 rounded-xl transition-colors"
                      >
                        <User className="w-4 h-4" /> Profile
                      </Link>
                      <button
                        onClick={async () => {
                          setProfileOpen(false);
                          await logout();
                          router.push("/");
                        }}
                        className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-[#ef4444]/80 hover:text-[#ef4444] hover:bg-[#ef4444]/10 rounded-xl transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto scrollbar-hide relative bg-background">
          <InteractiveBackground />
          {/* Subtle background glow for all pages */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-600/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-600/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="p-4 md:p-8 2xl:p-12 max-w-7xl 2xl:max-w-[1600px] min-[1920px]:max-w-[1800px] mx-auto w-full relative z-10 animate-slide-up pb-24">
            {children}
          </div>

          {/* FOOTER */}
          <footer className="w-full text-center py-6 border-t border-border text-xs text-subtle-foreground z-10 relative">
            <p className="mb-2">MENTORA – AI-Powered Personalized Learning</p>
            <div className="flex justify-center gap-4">
              <a href="#" className="hover:text-teal-700 dark:hover:text-teal-400 transition-colors">Help</a>
              <a href="#" className="hover:text-teal-700 dark:hover:text-teal-400 transition-colors">Privacy</a>
              <a href="#" className="hover:text-teal-700 dark:hover:text-teal-400 transition-colors">Contact</a>
            </div>
          </footer>
        </main>
      </div>

      {githubPromptOpen && (
        <GithubLinkCard
          mode={githubPromptMode}
          previousLogin={githubLogin}
          previousLinkedAt={user?.github?.linked_at}
          onDismiss={
            githubPromptMode === "change"
              ? () => setGithubPromptOpen(false)
              : undefined
          }
          onLinked={() => setGithubPromptOpen(false)}
        />
      )}
    </div>
  );
}
