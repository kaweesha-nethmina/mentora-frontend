"use client";

interface PasswordStrengthProps {
  password: string;
}

function getStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "" };
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;

  if (s <= 1) return { score: 1, label: "Weak", color: "bg-red-500" };
  if (s === 2) return { score: 2, label: "Fair", color: "bg-amber-500" };
  if (s === 3) return { score: 3, label: "Good", color: "bg-teal-400" };
  return { score: 4, label: "Strong", color: "bg-teal-500" };
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  const { score, label, color } = getStrength(password);
  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i <= score ? color : "bg-surface-3"
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium transition-colors ${score <= 1 ? "text-red-700 dark:text-red-400" : score === 2 ? "text-amber-700 dark:text-amber-400" : "text-teal-700 dark:text-teal-400"}`}>
        {label}
      </p>
    </div>
  );
}
