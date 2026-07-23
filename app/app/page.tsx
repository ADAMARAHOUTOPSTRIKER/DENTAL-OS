"use client";

import { useRouter } from "next/navigation";
import { type MouseEvent as ReactMouseEvent } from "react";
import {
  Stethoscope,
  Headset,
  User,
  ArrowRight,
} from "lucide-react";
import { useApp, type Role } from "@/lib/i18n";
import { Logo } from "@/components/ui/primitives";
import LangToggle from "@/components/landing/LangToggle";
import { cn } from "@/lib/utils";

// Cursor-following spotlight — sets --mx/--my on the hovered card.
function spotlightMove(e: ReactMouseEvent<HTMLButtonElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
}

const ROLES: {
  role: Role;
  icon: typeof Stethoscope;
  labelKey: string;
  descKey: string;
  to: string;
  accent: string;
}[] = [
  {
    role: "dentist",
    icon: Stethoscope,
    labelKey: "role.dentist",
    descKey: "role.dentist.desc",
    to: "/app/dashboard",
    accent: "from-teal-400 to-teal-600",
  },
  {
    role: "secretary",
    icon: Headset,
    labelKey: "role.secretary",
    descKey: "role.secretary.desc",
    to: "/app/dashboard",
    accent: "from-amber-400 to-amber-600",
  },
  {
    role: "patient",
    icon: User,
    labelKey: "role.patient",
    descKey: "role.patient.desc",
    to: "/app/login",
    accent: "from-sky-400 to-teal-500",
  },
];

export default function RoleChooser() {
  const { t, setRole } = useApp();
  const router = useRouter();

  const choose = (role: Role, to: string) => {
    setRole(role);
    router.push(to);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-ink-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-aurora animate-aurora opacity-70" />
      <div className="pointer-events-none absolute inset-0 bg-grid bg-[size:44px_44px] opacity-[0.12] mask-fade-b" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-6">
        {/* top bar */}
        <div className="flex items-center justify-between">
          <Logo light />
          <LangToggle light />
        </div>

        {/* center */}
        <div className="flex flex-1 flex-col items-center justify-center py-12">
          <div className="rise mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-teal-200">
            {t("common.demo")} · {t("role.choose")}
          </div>
          <h1 className="rise text-center font-display text-4xl font-bold tracking-tight sm:text-5xl" style={{ animationDelay: "0.08s" }}>
            {t("role.choose")}
          </h1>
          <p className="rise mt-3 max-w-md text-center text-white/55" style={{ animationDelay: "0.16s" }}>
            {t("role.subtitle")}
          </p>

          <div className="mt-12 grid w-full gap-5 sm:grid-cols-3">
            {ROLES.map((r, i) => (
              <button
                key={r.role}
                onClick={() => choose(r.role, r.to)}
                onMouseMove={spotlightMove}
                style={{ animationDelay: `${0.24 + i * 0.1}s` }}
                className="rise group relative flex flex-col items-start overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-left transition-all duration-300 hover:-translate-y-2 hover:border-teal-400/40 hover:bg-white/[0.07] hover:shadow-[0_30px_80px_-30px_rgba(46,196,182,0.5)] rtl:text-right"
              >
                {/* cursor spotlight */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: "radial-gradient(240px circle at var(--mx,50%) var(--my,50%), rgba(46,196,182,0.18), transparent 65%)" }}
                />
                {/* gradient hairline top */}
                <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div
                  className={cn(
                    "relative mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-glow transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3",
                    r.accent
                  )}
                >
                  <r.icon className="h-7 w-7" />
                </div>
                <h3 className="relative font-display text-xl font-bold">{t(r.labelKey)}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-white/55">{t(r.descKey)}</p>
                <span className="relative mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-300">
                  {t("role.enter")}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                </span>
                <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-teal-400/10 blur-2xl transition-opacity group-hover:opacity-100 opacity-0" />
              </button>
            ))}
          </div>
        </div>

        <p className="pb-2 text-center text-xs text-white/35">{t("footer.note")}</p>
      </div>
    </main>
  );
}
