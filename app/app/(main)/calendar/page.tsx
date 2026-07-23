"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useApp } from "@/lib/i18n";
import { Button } from "@/components/ui/primitives";
import { PageHeader } from "@/components/app/blocks";
import { useData } from "@/components/app/DataProvider";
import { PRACTITIONERS } from "@/lib/data";
import { cn } from "@/lib/utils";

const START = 9; // 09:00
const END = 17.5; // 17:30
const PX_PER_HOUR = 96;

function toTop(time: string) {
  const [h, m] = time.split(":").map(Number);
  return (h + m / 60 - START) * PX_PER_HOUR;
}

const COLORS: Record<string, string> = {
  "Dr. Bennani": "from-teal-400/90 to-teal-600/90",
  "Dr. El Amrani": "from-amber-400/90 to-amber-600/90",
};

export default function CalendarPage() {
  const { t, lang } = useApp();
  const { appointments: todaysAppointments } = useData();
  const [day] = useState(new Date(2026, 6, 23));
  const hours: number[] = [];
  for (let h = START; h <= END; h++) hours.push(h);

  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const weekDates = [21, 22, 23, 24, 25, 26];
  const dateLabel = new Intl.DateTimeFormat(lang === "ar" ? "ar-MA" : "fr-MA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(day);

  return (
    <>
      <PageHeader
        title={t("nav.calendar")}
        subtitle={<span className="capitalize">{dateLabel}</span>}
        action={
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-xl border border-black/5 bg-white p-1">
              <button className="grid h-8 w-8 place-items-center rounded-lg text-ink-800/50 hover:bg-sand-50"><ChevronLeft className="h-4 w-4 rtl:rotate-180" /></button>
              <span className="px-2 text-sm font-semibold text-ink-900">{t("app.today")}</span>
              <button className="grid h-8 w-8 place-items-center rounded-lg text-ink-800/50 hover:bg-sand-50"><ChevronRight className="h-4 w-4 rtl:rotate-180" /></button>
            </div>
            <Button variant="primary"><Plus className="h-4 w-4" /> {t("app.new")}</Button>
          </div>
        }
      />

      {/* week strip */}
      <div className="rise mb-4 grid grid-cols-6 gap-2">
        {weekDays.map((d, i) => (
          <button
            key={d}
            className={cn(
              "rounded-xl border p-3 text-center transition-all",
              weekDates[i] === 23
                ? "border-teal-400/40 bg-gradient-to-br from-teal-400 to-teal-600 text-white shadow-glow"
                : "border-black/5 bg-white text-ink-800/60 hover:border-teal-300"
            )}
          >
            <div className="text-xs font-medium opacity-80">{d}</div>
            <div className="font-display text-lg font-bold">{weekDates[i]}</div>
          </button>
        ))}
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
          </div>

          {/* practitioner columns */}
          {PRACTITIONERS.map((p) => (
            <div key={p} className="relative border-e border-black/5 last:border-e-0" style={{ height: (END - START) * PX_PER_HOUR }}>
              {hours.map((h) => (
                <div key={h} className="absolute inset-x-0 border-t border-black/[0.04]" style={{ top: (h - START) * PX_PER_HOUR }} />
              ))}
              {todaysAppointments
                .filter((a) => a.practitioner === p && a.status !== "cancelled")
                .map((a) => (
                  <div
                    key={a.id}
                    className={cn(
                      "absolute inset-x-1.5 overflow-hidden rounded-xl bg-gradient-to-br p-2.5 text-white shadow-sm",
                      COLORS[p]
                    )}
                    style={{ top: toTop(a.time) + 2, height: (a.duration / 60) * PX_PER_HOUR - 4 }}
                  >
                    <div className="text-xs font-bold">{a.time} · {a.patient}</div>
                    <div className="truncate text-[11px] text-white/85">{a.act}</div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
