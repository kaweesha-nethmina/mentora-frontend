"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  loading?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  fullWidth?: boolean;
}

export default function AuthButton({
  children,
  loading = false,
  variant = "primary",
  fullWidth = true,
  className = "",
  disabled,
  ...props
}: AuthButtonProps) {
  const base =
    "relative h-11 rounded-lg font-semibold text-sm transition-[filter,background-color,border-color,color] duration-150 overflow-hidden group";

  const variants = {
    primary: `
      bg-action text-white shadow-xs
      hover:brightness-110
      active:brightness-95
      disabled:opacity-60 disabled:brightness-100
    `,
    secondary: `
      bg-forest text-white shadow-xs
      hover:brightness-125
      active:brightness-95
    `,
    ghost: `
      bg-card border border-border-strong text-foreground
      hover:bg-muted
    `,
  };

  return (
    <Button
      className={`
        ${base}
        ${variants[variant]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg
            className="h-4 w-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Processing…
        </span>
      ) : (
        children
      )}
    </Button>
  );
}
