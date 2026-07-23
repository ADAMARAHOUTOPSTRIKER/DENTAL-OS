"use client";

import { cn, initials, avatarColor } from "@/lib/utils";

// ---------- Logo ----------
export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 font-display font-bold tracking-tight">
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 shadow-glow">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor">
          <path d="M12 2c-2 0-3.2 1-4.6 1C5.8 3 4 2.2 4 5.2c0 2 .5 3.3 1 5.3.5 2 .6 4 1.2 6.3.4 1.6.8 3.2 1.7 3.2.8 0 1-1.2 1.2-2.6.2-1.3.3-2.6.9-2.6s.7 1.3.9 2.6c.2 1.4.4 2.6 1.2 2.6.9 0 1.3-1.6 1.7-3.2.6-2.3.7-4.3 1.2-6.3.5-2 1-3.3 1-5.3C20 2.2 18.2 3 16.6 3 15.2 3 14 2 12 2z" />
        </svg>
      </span>
      <span className={cn("text-[17px]", light ? "text-white" : "text-ink-900")}>
        Dental<span className="text-teal-500">OS</span>
      </span>
    </span>
  );
}

// ---------- Avatar ----------
export function Avatar({
  name,
  size = 40,
  ring = false,
}: {
  name: string;
  size?: number;
  ring?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full font-semibold text-white select-none",
        ring && "ring-2 ring-white"
      )}
      style={{
        width: size,
        height: size,
        background: avatarColor(name),
        fontSize: size * 0.36,
      }}
    >
      {initials(name)}
    </span>
  );
}

// ---------- Status pill ----------
const PILL: Record<string, string> = {
  confirmed: "bg-teal-50 text-teal-700 ring-teal-200",
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  arrived: "bg-sky-50 text-sky-700 ring-sky-200",
  completed: "bg-slate-100 text-slate-600 ring-slate-200",
  cancelled: "bg-rose-50 text-rose-600 ring-rose-200",
  paid: "bg-teal-50 text-teal-700 ring-teal-200",
  partial: "bg-amber-50 text-amber-700 ring-amber-200",
  unpaid: "bg-rose-50 text-rose-600 ring-rose-200",
  accepted: "bg-teal-50 text-teal-700 ring-teal-200",
  proposed: "bg-amber-50 text-amber-700 ring-amber-200",
  sent: "bg-teal-50 text-teal-700 ring-teal-200",
};

export function Pill({
  children,
  tone = "confirmed",
  dot = true,
}: {
  children: React.ReactNode;
  tone?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        PILL[tone] ?? PILL.completed
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}

// ---------- Card ----------
export function Card({
  children,
  className = "",
  hover = false,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-black/5 bg-white shadow-card",
        hover && "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-float",
        className
      )}
    >
      {children}
    </div>
  );
}

// ---------- KPI card ----------
export function Kpi({
  label,
  value,
  delta,
  icon,
  suffix,
  accent = "teal",
  index = 0,
}: {
  label: string;
  value: string;
  delta?: number;
  icon?: React.ReactNode;
  suffix?: string;
  accent?: "teal" | "amber";
  index?: number;
}) {
  const up = (delta ?? 0) >= 0;
  return (
    <div
      style={{ animationDelay: `${index * 0.06}s` }}
      className="rise group relative overflow-hidden rounded-2xl border border-black/5 bg-white p-5 shadow-card"
    >
      <div
        className={cn(
          "absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 blur-xl transition-opacity group-hover:opacity-20",
          accent === "teal" ? "bg-teal-400" : "bg-amber-400"
        )}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-ink-800/50">
          {label}
        </span>
        {icon && (
          <span
            className={cn(
              "grid h-8 w-8 place-items-center rounded-lg",
              accent === "teal" ? "bg-teal-50 text-teal-600" : "bg-amber-50 text-amber-600"
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-end gap-1.5">
        <span className="font-display text-3xl font-bold tabular-nums text-ink-900">
          {value}
        </span>
        {suffix && <span className="mb-1 text-sm text-ink-800/50">{suffix}</span>}
      </div>
      {delta !== undefined && (
        <div className="mt-1.5 flex items-center gap-1 text-xs font-medium">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5",
              up ? "bg-teal-50 text-teal-700" : "bg-rose-50 text-rose-600"
            )}
          >
            {up ? "▲" : "▼"} {Math.abs(delta)}%
          </span>
        </div>
      )}
    </div>
  );
}

// ---------- Buttons ----------
export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: {
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "outline" | "dark";
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles = {
    primary:
      "bg-gradient-to-br from-teal-400 to-teal-600 text-white shadow-glow hover:brightness-105 active:scale-[0.98]",
    dark: "bg-ink-900 text-white hover:bg-ink-800 active:scale-[0.98]",
    outline:
      "border border-ink-900/15 bg-white text-ink-900 hover:border-teal-400 hover:text-teal-600",
    ghost: "text-ink-800 hover:bg-ink-900/5",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200",
        styles[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
