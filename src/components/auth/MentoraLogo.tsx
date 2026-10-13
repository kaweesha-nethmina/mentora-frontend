import Image from "next/image";

export default function MentoraLogo({ size = "md", tone = "default" }: { size?: "sm" | "md" | "lg"; tone?: "default" | "inverse" }) {
  const sizes = {
    sm: { icon: 36, text: "text-xl" },
    md: { icon: 42, text: "text-2xl" },
    lg: { icon: 56, text: "text-3xl" },
  };
  const s = sizes[size];

  return (
    <div className="flex items-center gap-2.5 group w-fit cursor-default select-none">
      <div
        className={`relative flex shrink-0 items-center justify-center rounded-[28%] bg-forest shadow-xs ring-1 ${tone === "inverse" ? "ring-white/25" : "ring-black/5 dark:ring-white/10"}`}
        style={{ width: s.icon, height: s.icon, perspective: "500px" }}
      >
        <Image
          src="/Mentora2.svg"
          alt="Mentora logo"
          width={Math.round(s.icon * 0.78)}
          height={Math.round(s.icon * 0.78 * (151 / 226))}
          className="object-contain logo-3d-spin"
          style={{ width: Math.round(s.icon * 0.78), height: "auto" }}
          priority
        />
      </div>

      <span className={`${s.text} font-extrabold tracking-tight leading-none ${tone === "inverse" ? "text-white" : "text-heading"}`}>
        Mentora
      </span>
    </div>
  );
}
