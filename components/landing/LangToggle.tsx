"use client";

import { useApp } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function LangToggle({ light = false }: { light?: boolean }) {
  const { lang, setLang } = useApp();
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full p-0.5 text-xs font-semibold",
        light ? "bg-white/10 ring-1 ring-white/15" : "bg-ink-900/5"
      )}
    >
      {(["fr", "ar"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={cn(
            "rounded-full px-2.5 py-1 transition-all duration-200",
            lang === l
              ? "bg-gradient-to-br from-teal-400 to-teal-600 text-white shadow"
              : light
              ? "text-white/70 hover:text-white"
              : "text-ink-800/60 hover:text-ink-900"
          )}
        >
          {l === "fr" ? "FR" : "ع"}
        </button>
      ))}
    </div>
  );
}
