"use client";

import { InputHTMLAttributes, forwardRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  icon?: React.ReactNode;
  error?: string;
  hint?: string;
  rightElement?: React.ReactNode;
}

const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, id, icon, error, hint, rightElement, className = "", ...props }, ref) => {
    const [focused, setFocused] = useState(false);

    return (
      <div className="space-y-1.5">
        <Label
          htmlFor={id}
          className={`text-sm font-medium transition-colors duration-200 ${
            focused ? "text-primary" : "text-foreground"
          }`}
        >
          {label}
        </Label>

        <div className={`relative group`}>
          {/* left icon */}
          {icon && (
            <span
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 z-10 transition-colors duration-200 ${
                focused ? "text-brand" : "text-subtle-foreground"
              }`}
            >
              {icon}
            </span>
          )}

          <Input
            ref={ref}
            id={id}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={`
              h-11 w-full rounded-lg border transition-colors duration-150
              bg-card dark:bg-sunken text-foreground placeholder:text-subtle-foreground
              border-input
              focus-visible:border-ring focus-visible:ring-0 focus-visible:ring-offset-0
              hover:border-border-strong
              ${icon ? "pl-11" : "pl-4"}
              ${rightElement ? "pr-12" : "pr-4"}
              ${error ? "border-danger/60 focus-visible:border-danger" : ""}
              ${className}
            `}
            {...props}
          />

          {/* right element (e.g. show/hide toggle) */}
          {rightElement && (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 z-10">
              {rightElement}
            </span>
          )}

          {/* focus glow */}
          <div
            className={`absolute inset-0 rounded-lg transition-shadow duration-150 pointer-events-none ${
              focused
                ? ""
                : ""
            }`}
          />
        </div>

        {error && <p className="text-xs text-danger mt-1">{error}</p>}
        {hint && !error && <p className="text-xs text-subtle-foreground mt-1">{hint}</p>}
      </div>
    );
  }
);
AuthInput.displayName = "AuthInput";
export default AuthInput;
