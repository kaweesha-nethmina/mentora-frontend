"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "../dashboard/Sidebar";
import Header from "../dashboard/Header";
import Footer from "../dashboard/Footer";
import InteractiveBackground from "./InteractiveBackground";
import { Menu } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);

    const frame = window.requestAnimationFrame(() => {
      setMounted(true);
      if (window.innerWidth < 1024) setSidebarOpen(false);
    });

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (pathname.startsWith("/assessment")) {
      setExpandedMenu("Assessment");
    } else if (pathname.startsWith("/learning-generator")) {
      setExpandedMenu("Material Generator");
    } else if (pathname.startsWith("/knowledge-assist")) {
      setExpandedMenu("Knowledge Assist");
    }
  }, [pathname]);

  return (
    <div className="h-screen bg-background text-foreground flex overflow-hidden">

      {/* mobile backdrop */}
      {sidebarOpen && (
        <div
          aria-hidden
          className="fixed inset-0 z-30 bg-overlay backdrop-blur-[2px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        expandedMenu={expandedMenu}
        setExpandedMenu={setExpandedMenu}
        onMobileClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden relative">

        {/* mobile menu trigger */}
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
          className={`lg:hidden fixed left-3 top-3.5 z-40 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground shadow-xs ${sidebarOpen ? "hidden" : ""}`}
        >
          <Menu className="h-5 w-5" />
        </button>

        <Header
          scrolled={scrolled}
          mounted={mounted}
          onProfileToggle={() => setProfileOpen((prev) => !prev)}
          profileOpen={profileOpen}
        />

        <main className="flex-1 overflow-y-auto custom-scrollbar relative bg-background bg-page-glow flex flex-col">
          <InteractiveBackground />
          <div className="relative z-10 flex flex-1 flex-col">
            <div className="px-4 py-6 md:px-8 md:py-8 2xl:px-12 2xl:py-10 max-w-7xl 2xl:max-w-[1600px] min-[1920px]:max-w-[1800px] mx-auto w-full animate-slide-up pb-20 flex-1">
              {children}
            </div>

            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
}
