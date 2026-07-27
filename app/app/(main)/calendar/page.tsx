"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, CalendarX, Check } from "lucide-react";
import { useApp } from "@/lib/i18n";
import { Button } from "@/components/ui/primitives";
import { PageHeader } from "@/components/app/blocks";
import { useData } from "@/components/app/DataProvider";
import { useUI } from "@/components/app/ModalProvider";
import { PRACTITIONERS, TODAY_ISO, type Appointment } from "@/lib/data";
import { cn } from "@/lib/utils";

const OPEN_FROM = 9; // ouverture habituelle
const OPEN_TO = 17.5; // fermeture habituelle
const PX_PER_HOUR = 96;

/** Heure décimale d'un « HH:MM » (09:30 → 9.5). */
function hourOf(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h + m / 60;
}

const COLORS: Record<string, string> = {
  "Dr. Bennani": "from-teal-400/90 to-teal-600/90",
  "Dr. El Amrani": "from-amber-400/90 to-amber-600/90",
};

/** Pastille de statut lisible d'un coup d'œil sur le bloc. */
const STATUS_DOT: Record<string, string> = {
  confirmed: "bg-white",
  pending: "bg-amber-200",
  arrived: "bg-sky-200",
  completed: "bg-white/40",
  no_show: "bg-rose-300",
};

/**
 * Répartit les rendez-vous qui se chevauchent en colonnes.
 *
 * Empilés, deux rendez-vous à la même heure se recouvraient : le second
 * devenait invisible, et le praticien ne voyait pas qu'il avait un conflit —
 * exactement ce qu'un agenda doit rendre évident.
 */
function layoutOverlaps(items: Appointment[]) {
  const sorted = [...items].sort((a, b) => a.time.localeCompare(b.time));
  const placed: { appt: Appointment; col: number; cols: number }[] = [];
  let cluster: { appt: Appointment; col: number; cols: number }[] = [];
  let clusterEnd = -Infinity;

  const endOf = (a: Appointment) => hourOf(a.time) + a.duration / 60;

  const flush = () => {
    if (!cluster.length) return;
    const cols = Math.max(...cluster.map((x) => x.col)) + 1;
    cluster.forEach((x) => placed.push({ ...x, cols }));
    cluster = [];
  };

  for (const appt of sorted) {
    const start = hourOf(appt.time);
    if (start >= clusterEnd) {
      flush();
      clusterEnd = endOf(appt);
    } else {
      clusterEnd = Math.max(clusterEnd, endOf(appt));
    }
    const busy = new Set(cluster.filter((x) => endOf(x.appt) > start).map((x) => x.col));
    let col = 0;
    while (busy.has(col)) col++;
    cluster.push({ appt, col, cols: 1 });
  }
  flush();
  return placed;
}

// ---- date helpers (UTC-based to avoid timezone drift) ----
function addDays(iso: string, n: number) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function mondayOf(iso: string) {
  const d = new Date(iso + "T00:00:00Z");
  const monIdx = (d.getUTCDay() + 6) % 7; // Mon=0 … Sun=6
  return addDays(iso, -monIdx);
}
const DAY_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const DAY_AR = ["إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"];

export default function CalendarPage() {
  const { t, lang } = useApp();
  const { appointments } = useData();
  const ui = useUI();
  const router = useRouter();

  const [selectedDay, setSelectedDay] = useState(TODAY_ISO);

  // Live "now" line — client-only (avoids SSR hydration mismatch), refreshes each minute.
  const [nowFrac, setNowFrac] = useState<number | null>(null);
  useEffect(() => {
    const update = () => {
      const d = new Date();
      setNowFrac(d.getHours() + d.getMinutes() / 60);
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);
  const weekStart = useMemo(() => mondayOf(selectedDay), [selectedDay]);
  const weekDays = useMemo(
    () => Array.from({ length: 6 }, (_, i) => addDays(weekStart, i)), // Mon–Sat
    [weekStart]
  );

  // Appointment count per day (for the week strip badges).
  const countFor = (iso: string) =>
    appointments.filter((a) => a.day === iso && a.status !== "cancelled").length;

  const dayAppts = useMemo(
    () => appointments.filter((a) => a.day === selectedDay && a.status !== "cancelled"),
    [appointments, selectedDay]
  );

  // Les bornes de la grille suivent la journée réelle. Fixées à 9h–17h30, une
  // urgence de 8h ou une fin de séance à 19h disparaissait purement et
  // simplement de l'écran, sans le moindre signal.
  const { START, END } = useMemo(() => {
    let start = OPEN_FROM;
    let end = OPEN_TO;
    dayAppts.forEach((a) => {
      start = Math.min(start, Math.floor(hourOf(a.time)));
      end = Math.max(end, Math.ceil(hourOf(a.time) + a.duration / 60));
    });
    return { START: start, END: end };
  }, [dayAppts]);

  const showNow = selectedDay === TODAY_ISO && nowFrac !== null;
  // Clamp to business hours so the live line stays on-grid at any real time.
  const nowTop =
    nowFrac !== null ? (Math.min(END, Math.max(START, nowFrac)) - START) * PX_PER_HOUR : 0;

  const hours: number[] = [];
  for (let h = START; h <= END; h++) hours.push(h);

  const toTop = (time: string) => (hourOf(time) - START) * PX_PER_HOUR;

  // Cliquer un créneau vide ouvre la création au bon jour, à la bonne heure et
  // chez le bon praticien : c'est le geste qu'un secrétariat fait cent fois.
  const createAt = (practitioner: string, offsetY: number) => {
    const raw = START + offsetY / PX_PER_HOUR;
    const snapped = Math.round(raw * 2) / 2; // quart d'heure trop fin, demi-heure suffit
    const h = Math.floor(snapped);
    const m = snapped % 1 ? "30" : "00";
    ui.openNewAppointment(undefined, {
      day: selectedDay,
      time: `${String(h).padStart(2, "0")}:${m}`,
      practitioner,
    });
  };

  const dateLabel = new Intl.DateTimeFormat(lang === "ar" ? "ar-MA" : "fr-MA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(selectedDay + "T12:00:00Z"));

  const names = lang === "ar" ? DAY_AR : DAY_FR;

  return (
    <>
      <PageHeader
        title={t("nav.calendar")}
        subtitle={<span className="capitalize">{dateLabel}</span>}
        action={
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-xl border border-black/5 bg-white p-1">
              <button
                onClick={() => setSelectedDay((d) => addDays(d, -7))}
                className="grid h-8 w-8 place-items-center rounded-lg text-ink-800/50 hover:bg-sand-50"
                title={t("cal.week")}
              >
                <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
              </button>
              <button
                onClick={() => setSelectedDay(TODAY_ISO)}
                className="px-2 text-sm font-semibold text-ink-900 hover:text-teal-600"
              >
                {t("app.today")}
              </button>
              <button
                onClick={() => setSelectedDay((d) => addDays(d, 7))}
                className="grid h-8 w-8 place-items-center rounded-lg text-ink-800/50 hover:bg-sand-50"
                title={t("cal.week")}
              >
                <ChevronRight className="h-4 w-4 rtl:rotate-180" />
              </button>
            </div>
            <Button variant="primary" onClick={() => ui.openNewAppointment()}>
              <Plus className="h-4 w-4" /> {t("app.new")}
            </Button>
          </div>
        }
      />

      {/* week strip — clickable days */}
      <div className="rise mb-4 grid grid-cols-6 gap-2">
        {weekDays.map((iso, i) => {
          const active = iso === selectedDay;
          const isToday = iso === TODAY_ISO;
          const count = countFor(iso);
          const dayNum = Number(iso.slice(8, 10));
          return (
            <button
              key={iso}
              onClick={() => setSelectedDay(iso)}
              className={cn(
                "relative rounded-xl border p-3 text-center transition-all",
                active
                  ? "border-teal-400/40 bg-gradient-to-br from-teal-400 to-teal-600 text-white shadow-glow"
                  : "border-black/5 bg-white text-ink-800/60 hover:border-teal-300"
              )}
            >
              <div className="text-xs font-medium opacity-80">{names[i]}</div>
              <div className="font-display text-lg font-bold">{dayNum}</div>
              {isToday && !active && (
                <span className="absolute bottom-1 left-1/2 flex h-1.5 w-1.5 -translate-x-1/2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-500 opacity-70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-teal-500" />
                </span>
              )}
              {count > 0 && (
                <span
                  className={cn(
                    "absolute end-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-bold",
                    active ? "bg-white/25 text-white" : "bg-teal-50 text-teal-700"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* legend */}
      <div className="rise mb-3 flex items-center gap-4" style={{ animationDelay: "0.04s" }}>
        {PRACTITIONERS.map((p) => (
          <span key={p} className="flex items-center gap-1.5 text-xs font-medium text-ink-800/60">
            <span className={cn("h-3 w-3 rounded-full bg-gradient-to-br", COLORS[p])} /> {p}
          </span>
        ))}
      </div>

      {/* day grid */}
      <div className="rise overflow-hidden rounded-2xl border border-black/5 bg-white shadow-card" style={{ animationDelay: "0.08s" }}>
        <div className="grid grid-cols-[56px_1fr_1fr]">
          {/* header */}
          <div className="border-b border-e border-black/5 bg-sand-50" />
          {PRACTITIONERS.map((p) => (
            <div key={p} className="border-b border-e border-black/5 bg-sand-50 px-4 py-3 text-sm font-semibold text-ink-900 last:border-e-0">
              {p}
            </div>
          ))}

          {/* time gutter */}
          <div className="relative border-e border-black/5" style={{ height: (END - START) * PX_PER_HOUR }}>
            {hours.map((h) => (
              <div key={h} className="absolute inset-x-0 -translate-y-1/2 pe-2 text-end text-[11px] text-ink-800/40" style={{ top: (h - START) * PX_PER_HOUR }}>
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
            {showNow && (
              <div className="absolute -right-[5px] z-30 -translate-y-1/2" style={{ top: nowTop }}>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-70" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
                </span>
              </div>
            )}
          </div>

          {/* practitioner columns */}
          {PRACTITIONERS.map((p) => (
            <div
              key={p}
              onClick={(e) => {
                // Seul un clic sur le fond crée : les blocs stoppent la propagation.
                const box = e.currentTarget.getBoundingClientRect();
                createAt(p, e.clientY - box.top);
              }}
              className="group/col relative cursor-copy border-e border-black/5 last:border-e-0"
              style={{ height: (END - START) * PX_PER_HOUR }}
            >
              {hours.map((h) => (
                <div key={h} className="absolute inset-x-0 border-t border-black/[0.04]" style={{ top: (h - START) * PX_PER_HOUR }} />
              ))}
              {showNow && (
                <div className="pointer-events-none absolute inset-x-0 z-20 h-px bg-rose-500/70" style={{ top: nowTop }} />
              )}
              {layoutOverlaps(dayAppts.filter((a) => a.practitioner === p)).map(({ appt: a, col, cols }) => (
                <button
                  key={a.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/app/patients?id=${a.patientId}`);
                  }}
                  title={`${a.time} · ${a.patient} — ${a.act}`}
                  className={cn(
                    "fade-in group absolute overflow-hidden rounded-xl bg-gradient-to-br p-2.5 text-start text-white shadow-md ring-1 ring-white/10 transition-all duration-200 hover:z-20 hover:shadow-xl hover:ring-white/25",
                    COLORS[p],
                    a.status === "completed" && "opacity-70"
                  )}
                  style={{
                    top: toTop(a.time) + 2,
                    height: (a.duration / 60) * PX_PER_HOUR - 4,
                    // Les rendez-vous d'un même créneau se partagent la largeur.
                    insetInlineStart: `calc(${(col / cols) * 100}% + 6px)`,
                    width: `calc(${100 / cols}% - 12px)`,
                  }}
                >
                  <div className="pointer-events-none absolute inset-0 bg-white/0 transition-colors duration-200 group-hover:bg-white/10" />
                  <div className="relative flex items-center gap-1.5 text-xs font-bold">
                    <span
                      className={cn("h-1.5 w-1.5 shrink-0 rounded-full", STATUS_DOT[a.status] ?? "bg-white")}
                      title={t(`status.${a.status}`)}
                    />
                    <span className="truncate">{a.time} · {a.patient}</span>
                    {a.patientConfirmed && (
                      <span className="grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full bg-white/25" title={t("status.confirmed")}>
                        <Check className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </div>
                  <div className="relative truncate text-[11px] text-white/85">{a.act}</div>
                </button>
              ))}
              {/* Invite discrète : le fond est cliquable, il faut le dire. */}
              <span className="pointer-events-none absolute inset-x-0 bottom-2 text-center text-[11px] font-medium text-teal-600 opacity-0 transition-opacity group-hover/col:opacity-100">
                + {t("cal.clickslot")}
              </span>
            </div>
          ))}
        </div>

        {dayAppts.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 border-t border-black/5 py-12 text-sm text-ink-800/40">
            <CalendarX className="h-6 w-6" />
            {t("cal.noappts")}
            <button
              onClick={() => ui.openNewAppointment()}
              className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700"
            >
              <Plus className="h-3.5 w-3.5" /> {t("app.new")}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
