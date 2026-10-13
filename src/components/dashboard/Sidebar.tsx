"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  X, Settings, LogOut,
  LayoutDashboard, Brain, BookOpen, Target, Users, TrendingUp, ChevronDown, PanelLeftClose, PanelLeftOpen
} from "lucide-react";
import MentoraLogo from "@/components/auth/MentoraLogo";
import { useAuth } from "@/contexts/AuthContext";
import GitHubStatusControl from "@/components/dashboard/GitHubStatusControl";
import { useActiveReview } from "@/contexts/ActiveReviewContext";
import { learningGeneratorApi } from "@/lib/api/learningGenerator";
import { getGapCounts } from "@/components/learning-generator/GapFilters";

type NavSubItem = {
  name: string;
  href: string;
  badge?: string | number;
  hasDot?: boolean;
};

type NavItem = {
  name: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems?: NavSubItem[];
};

const navItems: NavItem[] = [
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
  {
    name: "Material Generator",
    icon: BookOpen,
    subItems: [
      { name: "Overview", href: "/learning-generator", hasDot: true },
      { name: "Knowledge Gaps", href: "/learning-generator/knowledge-gaps" },
      { name: "Generated Materials", href: "/learning-generator/materials" },
      { name: "Learn Code Sandbox", href: "/learning-generator/workspace" },
    ],
  },
  {
    name: "Assessments",
    icon: Target,
    subItems: [
      { name: "Overview", href: "/assessment" },
      { name: "Questions & Answers", href: "/assessment/questions-answers" },
      { name: "Report", href: "/assessment/report" },
    ],
  },
  { name: "Peer Learning", href: "/peer-learning", icon: Users },
  { name: "Progress Analytics", href: "/progress", icon: TrendingUp },
];

const exactSubItemHrefs = new Set(["/knowledge-assist", "/learning-generator"]);

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  expandedMenu: string | null;
  setExpandedMenu: (name: string | null) => void;
  onMobileClose: () => void;
}

export default function Sidebar({ sidebarOpen, setSidebarOpen, expandedMenu, setExpandedMenu, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isReviewRunning, sandboxHref } = useActiveReview();
  const [gapCount, setGapCount] = useState<number>(0);

  useEffect(() => {
    if (!user?.student_id) return;
    let cancelled = false;
    learningGeneratorApi
      .getProfile(user.student_id)
      .then((res) => {
        if (cancelled || !res?.success) return;
        setGapCount(getGapCounts(res.data as any).ALL);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user?.student_id]);

  const isActive = (item: NavItem) => {
    if (item.href) return pathname === item.href;

    return item.subItems?.some((subItem) => isSubActive(subItem.href)) ?? false;
  };

  const isSubActive = (href: string) => {
    if (exactSubItemHrefs.has(href)) return pathname === href;

    return pathname === href || pathname.startsWith(href + "/");
  };

  const itemBase =
    "relative flex w-full items-center gap-3 2xl:gap-3.5 rounded-lg 2xl:rounded-xl px-3 py-2.5 2xl:px-4 2xl:py-3 text-sm 2xl:text-base transition-colors duration-150";
  const itemIdle =
    "text-sidebar-foreground hover:bg-muted hover:text-foreground";
  const itemActive =
    "bg-sidebar-accent text-sidebar-accent-foreground font-semibold";
  const itemGuided =
    "bg-info-soft text-info font-semibold ring-1 ring-info/40";

  return (
    <aside
      className={`fixed lg:static inset-y-0 left-0 z-40 bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out flex flex-col overflow-x-hidden ${
        sidebarOpen ? "w-64 2xl:w-72 translate-x-0" : "w-64 -translate-x-full invisible lg:visible lg:w-[76px] 2xl:lg:w-[84px] lg:translate-x-0"
      }`}
    >
      <div className={`h-16 2xl:h-20 flex items-center shrink-0 border-b border-sidebar-border ${sidebarOpen ? "justify-between px-4 2xl:px-6" : "justify-center px-2"}`}>
        <div className={`overflow-hidden transition-all ${!sidebarOpen && "lg:hidden"}`}>
          <MentoraLogo size="sm" />
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden lg:inline-flex p-2 rounded-lg text-subtle-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
          title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          <div className="relative w-5 h-5">
            <PanelLeftClose
              className={`w-5 h-5 absolute inset-0 transition-all duration-300 ${sidebarOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-75"}`}
            />
            <PanelLeftOpen
              className={`w-5 h-5 absolute inset-0 transition-all duration-300 ${!sidebarOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-75"}`}
            />
          </div>
        </button>
        <button onClick={onMobileClose} className="lg:hidden p-2 rounded-lg text-subtle-foreground hover:text-foreground hover:bg-muted" aria-label="Close menu">
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1 scrollbar-hide" aria-label="Main navigation">
        {navItems.map((item) => {
          const active = isActive(item);

          if (item.subItems) {
            const isExpanded = expandedMenu === item.name || (item.name === "Assessments" && expandedMenu === "Assessment");
            const reviewGuided = isReviewRunning && item.name === "Knowledge Assist";
            const defaultHref = reviewGuided
              ? sandboxHref(undefined, "sidebar-active-review")
              : item.subItems[0]?.href;
            const isInGroup = item.subItems.some((subItem) => isSubActive(subItem.href));

            return (
              <div key={item.name} className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => {

                    if (reviewGuided && defaultHref) {
                      router.push(defaultHref);
                      setExpandedMenu(item.name);
                      onMobileClose();
                      return;
                    }

                    if (!sidebarOpen) {
                      if (defaultHref) router.push(defaultHref);
                      onMobileClose();
                    } else if (!isInGroup && defaultHref) {
                      router.push(defaultHref);
                    }
                    setExpandedMenu(isExpanded ? null : item.name);
                  }}
                  aria-expanded={isExpanded}
                  className={`${itemBase} ${!sidebarOpen ? "lg:justify-center" : ""}
                    ${reviewGuided ? itemGuided : active ? itemActive : itemIdle}
                  `}
                  title={!sidebarOpen ? (reviewGuided ? "Review running - open Sandbox" : item.name) : undefined}
                >
                  {(active || reviewGuided) && (
                    <span
                      aria-hidden
                      className={`absolute -left-3 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full ${
                        reviewGuided ? "bg-info" : "bg-brand"
                      }`}
                    />
                  )}
                  <item.icon className={`w-[18px] h-[18px] shrink-0 ${active ? "text-brand" : ""} ${reviewGuided ? "animate-pulse" : ""}`} />
                  <span className={`whitespace-nowrap flex-1 text-left ${!sidebarOpen && "lg:hidden"}`}>
                    {item.name}
                  </span>
                  {!sidebarOpen ? null : (
                    <ChevronDown className={`w-4 h-4 shrink-0 text-subtle-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                  )}
                </button>

                <div className={`${!isExpanded || !sidebarOpen ? "hidden" : ""} ml-[21px] border-l border-sidebar-border pl-3 py-1 space-y-0.5`}>
                  {item.subItems.map((subItem) => {
                    const sandboxGuided =
                      isReviewRunning && subItem.href === "/knowledge-assist/sandbox";
                    const subActive = isSubActive(subItem.href);
                    return (
                      <Link
                        key={subItem.href}
                        href={
                          sandboxGuided
                            ? sandboxHref(undefined, "sidebar-active-review")
                            : subItem.href
                        }
                        aria-current={subActive ? "page" : undefined}
                        className={`relative flex items-center justify-between rounded-md px-3 py-2 text-[13px] transition-colors
                          ${sandboxGuided
                            ? "bg-info-soft text-info font-semibold ring-1 ring-info/40"
                            : subActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          }
                        `}
                      >
                        {subActive && !sandboxGuided && (
                          <span aria-hidden className="absolute -left-[13px] top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full bg-brand" />
                        )}
                        <span className="truncate">{subItem.name}</span>
                        {subItem.badge !== undefined && (
                          <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">
                            {subItem.badge}
                          </span>
                        )}
                        {subItem.href === "/learning-generator/knowledge-gaps" && gapCount > 0 && (
                          <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">
                            {gapCount}
                          </span>
                        )}
                        {subActive && subItem.hasDot && (
                          <span className="ml-2 w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
                        )}
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
              href={item.href!}
              aria-current={active ? "page" : undefined}
              className={`${itemBase} group ${!sidebarOpen ? "lg:justify-center" : ""}
                ${active ? itemActive : itemIdle}
              `}
              title={!sidebarOpen ? item.name : undefined}
            >
              {active && (
                <span aria-hidden className="absolute -left-3 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-brand" />
              )}
              <item.icon className={`w-[18px] h-[18px] shrink-0 ${active ? "text-brand" : ""}`} />
              <span className={`whitespace-nowrap ${!sidebarOpen && "lg:hidden"}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border space-y-1 shrink-0">
        <GitHubStatusControl sidebarOpen={sidebarOpen} />
        <Link
          href="/settings"
          className={`${itemBase} ${itemIdle} group ${!sidebarOpen ? "lg:justify-center" : ""} ${pathname === "/settings" ? "!bg-sidebar-accent !text-sidebar-accent-foreground font-semibold" : ""}`}
          title={!sidebarOpen ? "Settings" : undefined}
        >
          <Settings className="w-[18px] h-[18px] shrink-0 transition-transform duration-300 group-hover:rotate-45" />
          <span className={`whitespace-nowrap ${!sidebarOpen && "lg:hidden"}`}>Settings</span>
        </Link>
        <button
          onClick={async () => { await logout(); router.push("/login"); }}
          className={`${itemBase} text-sidebar-foreground hover:bg-danger-soft hover:text-danger group ${!sidebarOpen ? "lg:justify-center" : ""}`}
          title={!sidebarOpen ? "Log out" : undefined}
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          <span className={`whitespace-nowrap ${!sidebarOpen && "lg:hidden"}`}>Log out</span>
        </button>
      </div>
    </aside>
  );
}
