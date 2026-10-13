"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Bell, LogOut, User, Sun, Moon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { peerLearningApi } from "@/lib/api/peerLearning";

interface HeaderProps {
  scrolled: boolean;
  mounted: boolean;
  onProfileToggle: () => void;
  profileOpen: boolean;
}

export default function Header({ scrolled, mounted, onProfileToggle, profileOpen }: HeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggleTheme, mounted: themeMounted } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      const count = await peerLearningApi.getUnreadNotificationCount();
      setUnreadCount(count);
    };
    fetchCount();
    const interval = setInterval(fetchCount, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className={`sticky top-0 h-16 2xl:h-20 shrink-0 flex items-center justify-between gap-4 px-4 lg:px-8 2xl:px-12 border-b transition-colors duration-200 z-30
      ${scrolled
        ? "bg-background/85 backdrop-blur-md border-border"
        : "bg-background/60 backdrop-blur-sm border-transparent"}
    `}>
      <div className="flex items-center gap-4 min-w-0">
        <label className="hidden md:flex items-center gap-2.5 h-9 2xl:h-11 px-3.5 w-56 2xl:w-80 focus-within:w-72 2xl:focus-within:w-96 bg-card border border-border rounded-xl focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20 transition-all duration-200">
          <Search className="w-4 h-4 2xl:w-5 2xl:h-5 shrink-0 text-subtle-foreground" />
          <input
            type="text"
            placeholder="Search topics, materials..."
            aria-label="Search"
            className="w-full bg-transparent border-none outline-none text-sm 2xl:text-base text-foreground placeholder:text-subtle-foreground"
          />
        </label>
      </div>

      <div className="flex items-center gap-1.5 md:gap-3 2xl:gap-4">
        {/* Theme switch */}
        <button
          type="button"
          onClick={toggleTheme}
          role="switch"
          aria-checked={theme === "dark"}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="relative inline-flex h-9 2xl:h-11 w-[68px] 2xl:w-[80px] items-center rounded-full border border-border bg-muted p-1 transition-colors hover:border-border-strong cursor-pointer"
        >
          {themeMounted ? (
            <>
              <span
                aria-hidden
                className={`absolute top-1 h-7 w-7 rounded-full bg-card shadow-raised ring-1 ring-border transition-transform duration-300 ${
                  theme === "dark" ? "translate-x-[30px]" : "translate-x-0"
                }`}
              />
              <Sun className={`relative z-10 mx-1.5 w-4 h-4 transition-colors ${theme === "dark" ? "text-subtle-foreground" : "text-warning"}`} />
              <Moon className={`relative z-10 ml-auto mr-1.5 w-4 h-4 transition-colors ${theme === "dark" ? "text-brand" : "text-subtle-foreground"}`} />
            </>
          ) : (
            <span className="w-full" />
          )}
        </button>

        {/* Notification Bell */}
        <Link
          href="/notification"
          aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-warning text-white dark:text-[#1a1203] text-[10px] font-bold ring-2 ring-background">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        <div className="h-6 w-px bg-border mx-1" />

        <div className="relative">
          <button
            type="button"
            className="flex items-center gap-3 rounded-lg py-1 pl-1 pr-1 md:pr-2 hover:bg-muted transition-colors cursor-pointer"
            onClick={onProfileToggle}
            aria-haspopup="menu"
            aria-expanded={profileOpen}
          >
            <div className="w-8 h-8 rounded-full bg-forest flex items-center justify-center text-sm font-semibold text-white">
              {mounted && user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="hidden md:block text-left leading-tight">
              <p className="text-sm font-semibold text-foreground">{mounted ? (user?.name || "User") : "User"}</p>
              <p className="text-xs text-muted-foreground capitalize">{mounted ? (user?.role || "Student") : "Student"}</p>
            </div>
          </button>

          {profileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={onProfileToggle} />
              <div role="menu" className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-xl shadow-overlay overflow-hidden z-50 animate-slide-up origin-top-right">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-semibold text-foreground truncate">{mounted ? (user?.name || "User") : "User"}</p>
                  <p className="text-xs text-muted-foreground truncate">{mounted ? (user?.email || "") : ""}</p>
                </div>
                <div className="p-1.5">
                  <Link
                    href="/settings"
                    onClick={onProfileToggle}
                    className="flex items-center gap-3 w-full px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    <User className="w-4 h-4 text-muted-foreground" /> Profile
                  </Link>
                  <button
                    onClick={async () => {
                      onProfileToggle();
                      await logout();
                      router.push("/");
                    }}
                    className="flex items-center gap-3 w-full px-3 py-2 text-sm text-danger hover:bg-danger-soft rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Log out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
