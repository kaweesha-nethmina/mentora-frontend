"use client";

import { ReactNode } from "react";

interface SocialButtonProps {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
}

export default function SocialButton({ icon, label, onClick }: SocialButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        flex items-center justify-center gap-2.5
        h-11 w-full rounded-lg
        border border-border-strong bg-card
        text-foreground text-sm font-medium
        transition-colors duration-150
        hover:bg-muted
      "
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
