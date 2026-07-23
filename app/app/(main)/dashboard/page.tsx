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
import { PageHeader, SectionCard, AgendaList, RecallList } from "@/components/app/blocks";
import { RevenueArea, ActsDonut } from "@/components/app/charts";
import { useData } from "@/components/app/DataProvider";
import { kpis } from "@/lib/data";
import { mad } from "@/lib/utils";

export default function DashboardPage() {
  const { t, role, lang } = useApp();
  const { patients, appointments: todaysAppointments, recalls } = useData();
  const router = useRouter();
  const isDentist = role === "dentist";
  const name = isDentist ? "Dr. Bennani" : "Imane";
  const goPatient = (id: string) => router.push(`/app/patients?id=${id}`);

  return (
    <>
      <PageHeader
        title={`${t("app.greeting.morning")}, ${name} 👋`}
        subtitle={
          lang === "ar"
            ? "إليك ما يجري في العيادة اليوم."
            : "Voici ce qui se passe au cabinet aujourd’hui."
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {isDentist ? (
          <>
            <Kpi index={0} label={t("kpi.revenue")} value={mad(kpis.revenue)} suffix={t("common.mad")} delta={kpis.revenueDelta} icon={<Wallet className="h-4 w-4" />} />
            <Kpi index={1} label={t("kpi.appointments")} value={String(kpis.appointments)} delta={kpis.appointmentsDelta} icon={<CalendarDays className="h-4 w-4" />} />
            <Kpi index={2} label={t("kpi.noshow")} value={`${kpis.noShow}%`} delta={kpis.noShowDelta} icon={<UserX className="h-4 w-4" />} accent="amber" />
            <Kpi index={3} label={t("kpi.acceptance")} value={`${kpis.acceptance}%`} delta={kpis.acceptanceDelta} icon={<FileCheck className="h-4 w-4" />} />
          </>
        ) : (
          <>
            <Kpi index={0} label={t("kpi.appointments")} value={String(todaysAppointments.length)} suffix={t("app.today")} icon={<CalendarDays className="h-4 w-4" />} />
            <Kpi index={1} label={t("kpi.due")} value={mad(kpis.dueToday)} suffix={t("common.mad")} icon={<Coins className="h-4 w-4" />} accent="amber" />
            <Kpi index={2} label={t("kpi.pending")} value={mad(kpis.pendingPayments)} suffix={t("common.mad")} icon={<Clock className="h-4 w-4" />} accent="amber" />
            <Kpi index={3} label={t("kpi.active")} value={mad(kpis.activePatients)} icon={<Users className="h-4 w-4" />} />
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
              <RevenueArea />
            </SectionCard>
          )}
        </div>

        <div className="space-y-5">
          <SectionCard
            title={t("sec.recalls")}
            delay={0.08}
            action={<span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">{recalls.filter((r) => !r.reminderSent).length}</span>}
          >
            <RecallList items={recalls} />
          </SectionCard>

          {isDentist ? (
            <SectionCard title={t("sec.actsmix")} delay={0.12}>
              <ActsDonut />
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
