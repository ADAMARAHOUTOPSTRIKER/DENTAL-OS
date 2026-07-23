"use client";

import { Send, Check, Clock, MoreHorizontal, ChevronRight } from "lucide-react";
import { useApp } from "@/lib/i18n";
import { Avatar, Pill } from "@/components/ui/primitives";
import { useData } from "@/components/app/DataProvider";
import { useUI } from "@/components/app/ModalProvider";
import { cn } from "@/lib/utils";
import type { Appointment, Recall } from "@/lib/data";

/* ---------- Page header ---------- */
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="rise">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-ink-800/55">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------- Section card ---------- */
export function SectionCard({
  title,
  action,
  children,
  className = "",
  delay = 0,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <section
      className={cn("rise rounded-2xl border border-black/5 bg-white p-5 shadow-card", className)}
      style={{ animationDelay: `${delay}s` }}
    >
      {title && (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-ink-900">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/* ---------- Reminder button (controlled — opens WhatsApp modal) ---------- */
export function ReminderButton({
  sent,
  onClick,
}: {
  sent: boolean;
  onClick: () => void;
}) {
  const { t } = useApp();
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all duration-300",
        sent
          ? "bg-teal-50 text-teal-700 hover:bg-teal-100"
          : "bg-ink-900/[0.04] text-ink-800/70 hover:bg-teal-500 hover:text-white active:scale-95"
      )}
      title={t("reminder.via")}
    >
      {sent ? <Check className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
      {sent ? t("reminder.sent") : t("reminder.send")}
    </button>
  );
}

/* ---------- Agenda list ---------- */
export function AgendaList({
  items,
  onSelect,
}: {
  items: Appointment[];
  onSelect?: (patientId: string) => void;
}) {
  const { t } = useApp();
  const { markApptReminder, patientById } = useData();
  const ui = useUI();
  const openReminder = (a: Appointment) => {
    const p = patientById(a.patientId);
    if (!p) return;
    ui.openMessage(p, { reminder: true, onSent: () => markApptReminder(a.id) });
  };
  return (
    <ul className="divide-y divide-black/5">
      {items.map((a) => (
        <li
          key={a.id}
          className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0"
        >
          <div className="flex w-14 shrink-0 flex-col items-center">
            <span className="font-display text-sm font-bold text-ink-900">{a.time}</span>
            <span className="text-[10px] text-ink-800/40">{a.duration}min</span>
          </div>
          <div className="h-9 w-px bg-black/5" />
          <button
            onClick={() => onSelect?.(a.patientId)}
            className="flex min-w-0 flex-1 items-center gap-3 text-start"
          >
            <Avatar name={a.patient} size={38} />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-ink-900 group-hover:text-teal-700">
                {a.patient}
              </div>
              <div className="truncate text-xs text-ink-800/50">
                {a.act} · {a.practitioner}
              </div>
            </div>
          </button>
          <Pill tone={a.status}>{t(`status.${a.status}`)}</Pill>
          <div className="hidden sm:block">
            <ReminderButton sent={a.reminderSent} onClick={() => openReminder(a)} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ---------- Recall list ---------- */
export function RecallList({ items }: { items: Recall[] }) {
  const { markRecallSent, patientById } = useData();
  const ui = useUI();
  const openReminder = (r: Recall) => {
    const p = patientById(r.patientId);
    if (!p) return;
    ui.openMessage(p, { recallReason: r.reason, onSent: () => markRecallSent(r.patientId) });
  };
  return (
    <ul className="space-y-2.5">
      {items.map((r) => (
        <li
          key={r.patientId}
          className="flex items-center gap-3 rounded-xl border border-black/5 bg-sand-50 p-2.5"
        >
          <Avatar name={r.patient} size={34} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-ink-900">{r.patient}</div>
            <div className="flex items-center gap-1 truncate text-xs text-ink-800/50">
              <Clock className="h-3 w-3" /> {r.reason} · {r.due}
            </div>
          </div>
          <ReminderButton sent={r.reminderSent} onClick={() => openReminder(r)} />
        </li>
      ))}
    </ul>
  );
}

/* ---------- Simple list row ---------- */
export function LinkRow({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-start transition-colors hover:bg-sand-50"
    >
      {children}
      <ChevronRight className="ms-auto h-4 w-4 shrink-0 text-ink-800/30 rtl:rotate-180" />
    </button>
  );
}

export { MoreHorizontal };
