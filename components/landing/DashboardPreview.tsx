"use client";

import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Wallet,
  Images,
  Search,
  BellRing,
} from "lucide-react";
import { Avatar, Pill } from "@/components/ui/primitives";
import { todaysAppointments } from "@/lib/data";

// A static, good-looking miniature of the app — used on the landing page only.
export default function DashboardPreview() {
  const bars = [42, 58, 50, 72, 64, 88, 96];
  return (
    <div className="overflow-hidden rounded-2xl bg-sand-50 text-ink-900">
      {/* window chrome */}
      <div className="flex items-center gap-1.5 border-b border-black/5 bg-white px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-teal-300" />
        <span className="ml-3 text-xs text-ink-800/40">app.dentalos.ma</span>
      </div>

      <div className="flex">
        {/* sidebar */}
        <div className="hidden w-14 flex-col items-center gap-4 border-r border-black/5 bg-white py-5 sm:flex">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 text-white">
            <LayoutDashboard className="h-4 w-4" />
          </span>
          {[CalendarDays, Users, Images, Wallet].map((I, i) => (
            <span key={i} className="grid h-9 w-9 place-items-center rounded-xl text-ink-800/40 hover:bg-ink-900/5">
              <I className="h-4 w-4" />
            </span>
          ))}
        </div>

        {/* main */}
        <div className="flex-1 p-4 sm:p-5">
          {/* topbar */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs text-ink-800/40 shadow-sm">
              <Search className="h-3.5 w-3.5" /> Rechercher…
            </div>
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-white shadow-sm">
                <BellRing className="h-4 w-4 text-ink-800/50" />
              </span>
              <Avatar name="Dr Bennani" size={32} />
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { l: "Revenu / mois", v: "262K", d: "+10%" },
              { l: "RDV / semaine", v: "111", d: "+6%" },
              { l: "No-show", v: "4.2%", d: "−1.8%" },
            ].map((k) => (
              <div key={k.l} className="rounded-xl border border-black/5 bg-white p-3">
                <div className="text-[10px] uppercase tracking-wide text-ink-800/40">{k.l}</div>
                <div className="mt-1 font-display text-xl font-bold">{k.v}</div>
                <div className="text-[10px] font-semibold text-teal-600">{k.d}</div>
              </div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[1.4fr_1fr]">
            {/* chart */}
            <div className="rounded-xl border border-black/5 bg-white p-4">
              <div className="mb-3 text-xs font-semibold text-ink-800/70">Tendance du revenu</div>
              <div className="flex h-24 items-end gap-2">
                {bars.map((b, i) => (
                  <div key={i} className="flex-1">
                    <div
                      className="rounded-t-md bg-gradient-to-t from-teal-500 to-teal-300"
                      style={{ height: `${b}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
            {/* agenda */}
            <div className="rounded-xl border border-black/5 bg-white p-4">
              <div className="mb-3 text-xs font-semibold text-ink-800/70">Agenda du jour</div>
              <div className="space-y-2.5">
                {todaysAppointments.slice(0, 3).map((a) => (
                  <div key={a.id} className="flex items-center gap-2.5">
                    <Avatar name={a.patient} size={26} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium">{a.patient}</div>
                      <div className="truncate text-[10px] text-ink-800/45">
                        {a.time} · {a.act}
                      </div>
                    </div>
                    <Pill tone={a.status} dot={false}>
                      <span className="text-[10px]">{a.time}</span>
                    </Pill>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
