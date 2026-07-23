"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Wallet,
  CalendarDays,
  UserX,
  FileCheck,
  Users,
  Clock,
  Coins,
  ArrowRight,
} from "lucide-react";
import { useApp } from "@/lib/i18n";
import { Kpi, Avatar, Pill } from "@/components/ui/primitives";
import { Counter } from "@/components/ui/Counter";
import { SectionCard, AgendaList, RecallList } from "@/components/app/blocks";
import { RevenueArea, ActsDonut } from "@/components/app/charts";
import { useData } from "@/components/app/DataProvider";
import { TODAY_ISO } from "@/lib/data";
import { mad } from "@/lib/utils";

export default function DashboardPage() {
  const { t, role, lang } = useApp();
  const { patients, appointments, recalls, stats } = useData();
  const todaysAppointments = appointments
    .filter((a) => a.day === TODAY_ISO)
    .sort((a, b) => a.time.localeCompare(b.time));
  // Respect each patient's recall opt-in choice made in their portal.
  const optedOut = new Set(patients.filter((p) => p.recallOptIn === false).map((p) => p.id));
  const visibleRecalls = recalls.filter((r) => !optedOut.has(r.patientId));
  const router = useRouter();
  const isDentist = role === "dentist";
  const name = isDentist ? "Dr. Bennani" : "Imane";
  const goPatient = (id: string) => router.push(`/app/patients?id=${id}`);
  const today = new Intl.DateTimeFormat(lang === "ar" ? "ar-MA" : "fr-MA", {
    weekday: "long", day: "numeric", month: "long",
  }).format(new Date(2026, 6, 23));

  return (
    <>
      {/* greeting hero */}
      <div className="rise noise relative mb-6 overflow-hidden rounded-2xl bg-ink-950 p-6 text-white shadow-float">
        <div className="pointer-events-none absolute inset-0 bg-aurora animate-aurora opacity-45" />
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-teal-500/20 blur-[90px]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background:radial-gradient(120%_80%_at_50%_-10%,white,transparent)]" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-teal-200">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-300 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-teal-300" />
              </span>
              <span className="capitalize">{today}</span>
            </div>
            <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              {t("app.greeting.morning")}, {name} 👋
            </h1>
            <p className="mt-1 text-sm text-white/60">
              {lang === "ar" ? "إليك ما يجري في العيادة اليوم." : "Voici ce qui se passe au cabinet aujourd’hui."}
            </p>
          </div>
          <div className="flex gap-6">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-white/40">{t("sec.agenda")}</div>
              <div className="font-display text-2xl font-bold tabular-nums">
                <Counter value={todaysAppointments.length} format={(n) => String(Math.round(n))} />
              </div>
            </div>
            <div className="border-s border-white/10 ps-6">
              <div className="text-[11px] uppercase tracking-wide text-white/40">{t("kpi.due")}</div>
              <div className="font-display text-2xl font-bold tabular-nums text-teal-300">
                <Counter value={stats.dueToday} format={(n) => mad(n)} /> <span className="text-sm font-medium text-white/40">MAD</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {isDentist ? (
          <>
            <Kpi index={0} label={t("kpi.revenue")} countTo={stats.collected} format={(n) => mad(n)} suffix={t("common.mad")} delta={stats.revenueDelta} icon={<Wallet className="h-4 w-4" />} />
            <Kpi index={1} label={t("kpi.appointments")} countTo={stats.appointmentsCount} format={(n) => String(Math.round(n))} delta={stats.appointmentsDelta} icon={<CalendarDays className="h-4 w-4" />} />
            <Kpi index={2} label={t("kpi.noshow")} countTo={stats.noShow} format={(n) => `${n.toFixed(1)}%`} delta={stats.noShowDelta} icon={<UserX className="h-4 w-4" />} accent="amber" />
            <Kpi index={3} label={t("kpi.acceptance")} countTo={stats.acceptance} format={(n) => `${Math.round(n)}%`} delta={stats.acceptanceDelta} icon={<FileCheck className="h-4 w-4" />} />
          </>
        ) : (
          <>
            <Kpi index={0} label={t("kpi.appointments")} countTo={todaysAppointments.length} format={(n) => String(Math.round(n))} suffix={t("app.today")} icon={<CalendarDays className="h-4 w-4" />} />
            <Kpi index={1} label={t("kpi.due")} countTo={stats.dueToday} format={(n) => mad(n)} suffix={t("common.mad")} icon={<Coins className="h-4 w-4" />} accent="amber" />
            <Kpi index={2} label={t("kpi.pending")} countTo={stats.outstanding} format={(n) => mad(n)} suffix={t("common.mad")} icon={<Clock className="h-4 w-4" />} accent="amber" />
            <Kpi index={3} label={t("kpi.active")} countTo={stats.activePatients} format={(n) => mad(n)} icon={<Users className="h-4 w-4" />} />
          </>
        )}
      </div>

      {/* Main grid */}
      <div className="mt-6 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          <SectionCard
            title={t("sec.agenda")}
            delay={0.05}
            action={
              <Link href="/app/calendar" className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700">
                {t("app.viewall")} <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
              </Link>
            }
          >
            <AgendaList items={todaysAppointments} onSelect={goPatient} />
          </SectionCard>

          {isDentist && (
            <SectionCard title={t("sec.revenuetrend")} delay={0.1}>
              <RevenueArea data={stats.revenueTrend} />
            </SectionCard>
          )}
        </div>

        <div className="space-y-5">
          <SectionCard
            title={t("sec.recalls")}
            delay={0.08}
            action={<span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">{visibleRecalls.filter((r) => !r.reminderSent).length}</span>}
          >
            <RecallList items={visibleRecalls} />
          </SectionCard>

          {isDentist ? (
            <SectionCard title={t("sec.actsmix")} delay={0.12}>
              <ActsDonut data={stats.actsMix} />
            </SectionCard>
          ) : (
            <SectionCard title={t("sec.recentpatients")} delay={0.12}>
              <ul className="space-y-1">
                {patients.slice(0, 5).map((p) => (
                  <li key={p.id}>
                    <button onClick={() => goPatient(p.id)} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-sand-50">
                      <Avatar name={p.name} size={34} />
                      <div className="min-w-0 flex-1 text-start">
                        <div className="truncate text-sm font-medium text-ink-900">{p.name}</div>
                        <div className="truncate text-xs text-ink-800/50">{p.city} · {p.phone}</div>
                      </div>
                      {p.balance > 0 && <Pill tone={p.status}>{mad(p.balance)} {t("common.mad")}</Pill>}
                    </button>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}
        </div>
      </div>
    </>
  );
}
