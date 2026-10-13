"use client";

import { ReactNode } from "react";

interface AuthCardProps {
  children: ReactNode;
  className?: string;
}

export default function AuthCard({ children, className = "" }: AuthCardProps) {
  return (
    <div
      className={`
        relative w-full max-w-md overflow-hidden
        surface-card shadow-overlay
        ${className}
      `}
    >
      <div className="relative p-8">{children}</div>
    </div>
  );
}
