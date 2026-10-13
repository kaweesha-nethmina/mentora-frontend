import { Separator } from "@/components/ui/separator";

interface AuthDividerProps {
  label?: string;
}

export default function AuthDivider({ label = "or" }: AuthDividerProps) {
  return (
    <div className="flex items-center gap-3 my-2">
      <Separator className="flex-1 bg-surface-3" />
      <span className="text-xs text-subtle-foreground font-medium uppercase tracking-widest shrink-0">
        {label}
      </span>
      <Separator className="flex-1 bg-surface-3" />
    </div>
  );
}
