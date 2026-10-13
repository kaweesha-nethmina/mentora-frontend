"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  baseAlpha: number;
  pulseSpeed: number;
  pulsePhase: number;
}

export default function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { theme } = useTheme();
  const [mousePos, setMousePos] = useState<{ x: number; y: number; active: boolean }>({
    x: -1000,
    y: -1000,
    active: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];

    const isDark =
      theme === "dark" ||
      document.documentElement.classList.contains("dark") ||
      document.documentElement.getAttribute("data-theme") === "dark";

    // Palette tailored for Mentora: forest/emerald greens, mint, and subtle warm accents
    const darkColors = [
      "rgba(52, 201, 138, ", // emerald sprout
      "rgba(22, 167, 101, ", // brand leaf
      "rgba(14, 116, 144, ", // info cyan
      "rgba(245, 158, 11, ", // amber accent
    ];

    const lightColors = [
      "rgba(22, 167, 101, ", // brand leaf
      "rgba(8, 116, 67, ",  // pine green
      "rgba(14, 116, 144, ", // info cyan
      "rgba(217, 119, 6, ",  // amber
    ];

    const palette = isDark ? darkColors : lightColors;

    const initParticles = () => {
      const count = Math.min(45, Math.max(22, Math.floor((width * height) / 38000)));
      particles = [];

      for (let i = 0; i < count; i++) {
        const baseAlpha = isDark ? 0.25 + Math.random() * 0.35 : 0.15 + Math.random() * 0.25;
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45,
          radius: 1.5 + Math.random() * 2.2,
          color: palette[Math.floor(Math.random() * palette.length)],
          alpha: baseAlpha,
          baseAlpha,
          pulseSpeed: 0.015 + Math.random() * 0.025,
          pulsePhase: Math.random() * Math.PI * 2,
        });
      }
    };

    const handleResize = () => {
      if (!canvas) return;
      const parent = canvas.parentElement;
      width = parent ? parent.clientWidth : window.innerWidth;
      height = parent ? Math.max(parent.clientHeight, window.innerHeight) : window.innerHeight;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
      initParticles();
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // Mouse tracking across container/window
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMousePos({ x, y, active: true });
    };

    const onMouseLeave = () => {
      setMousePos((prev) => ({ ...prev, active: false }));
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);

    if (prefersReducedMotion) {
      // Just draw static calm points without animation loop
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.alpha})`;
        ctx.fill();
      });
      return () => {
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseleave", onMouseLeave);
      };
    }

    // Animation render loop
    let currentMouseX = -1000;
    let currentMouseY = -1000;
    const maxLinkDist = 125;
    const mouseRadius = 140;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse position easing
      if (mousePos.active) {
        currentMouseX += (mousePos.x - currentMouseX) * 0.12;
        currentMouseY += (mousePos.y - currentMouseY) * 0.12;
      } else {
        currentMouseX = -1000;
        currentMouseY = -1000;
      }

      // Draw subtle interactive cursor glow halo
      if (mousePos.active && currentMouseX > 0 && currentMouseY > 0) {
        const glowRadius = isDark ? 160 : 130;
        const radialGlow = ctx.createRadialGradient(
          currentMouseX,
          currentMouseY,
          0,
          currentMouseX,
          currentMouseY,
          glowRadius
        );
        radialGlow.addColorStop(0, isDark ? "rgba(52, 201, 138, 0.08)" : "rgba(22, 167, 101, 0.05)");
        radialGlow.addColorStop(0.5, isDark ? "rgba(22, 167, 101, 0.03)" : "rgba(8, 116, 67, 0.02)");
        radialGlow.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = radialGlow;
        ctx.beginPath();
        ctx.arc(currentMouseX, currentMouseY, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Update and draw particles
      const len = particles.length;
      for (let i = 0; i < len; i++) {
        const p = particles[i];

        // Autonomous drift
        p.x += p.vx;
        p.y += p.vy;

        // Pulse alpha gently
        p.pulsePhase += p.pulseSpeed;
        p.alpha = p.baseAlpha + Math.sin(p.pulsePhase) * 0.1;

        // Interactive mouse interaction (gravitational deflection)
        const dx = currentMouseX - p.x;
        const dy = currentMouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouseRadius && mousePos.active) {
          const force = (mouseRadius - dist) / mouseRadius;
          p.x -= (dx / dist) * force * 1.6;
          p.y -= (dy / dist) * force * 1.6;
          p.alpha = Math.min(0.8, p.alpha + force * 0.4);

          // Interactive constellation connection to mouse
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(currentMouseX, currentMouseY);
          ctx.strokeStyle = `${p.color}${force * (isDark ? 0.35 : 0.22)})`;
          ctx.lineWidth = 0.9;
          ctx.stroke();
        }

        // Screen boundary wrapping
        if (p.x < -10) p.x = width + 10;
        else if (p.x > width + 10) p.x = -10;

        if (p.y < -10) p.y = height + 10;
        else if (p.y > height + 10) p.y = -10;

        // Draw particle node
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${Math.max(0.05, p.alpha)})`;
        ctx.fill();

        // Connect nearby particles (Knowledge Graph constellation)
        for (let j = i + 1; j < len; j++) {
          const p2 = particles[j];
          const cdx = p.x - p2.x;
          const cdy = p.y - p2.y;
          const cDist = Math.sqrt(cdx * cdx + cdy * cdy);

          if (cDist < maxLinkDist) {
            const linkAlpha = (1 - cDist / maxLinkDist) * (isDark ? 0.16 : 0.1);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `${p.color}${linkAlpha})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [theme, mousePos.active]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0"
    >
      {/* ── AMBIENT FLOATING AURORA ORBS ── */}
      <div className="absolute top-[-10%] right-[-5%] w-[550px] 2xl:w-[750px] h-[550px] 2xl:h-[750px] bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-[110px] 2xl:blur-[140px] animate-float pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] 2xl:w-[700px] h-[500px] 2xl:h-[700px] bg-teal-500/10 dark:bg-teal-500/12 rounded-full blur-[100px] 2xl:blur-[130px] animate-float-delayed pointer-events-none" />
      <div className="absolute top-[40%] left-[20%] w-[420px] 2xl:w-[600px] h-[420px] 2xl:h-[600px] bg-amber-500/5 dark:bg-emerald-400/8 rounded-full blur-[90px] 2xl:blur-[120px] animate-glow-pulse pointer-events-none" />

      {/* ── INTERACTIVE CANVAS PARTICLES & CONSTELLATION ── */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
    </div>
  );
}
