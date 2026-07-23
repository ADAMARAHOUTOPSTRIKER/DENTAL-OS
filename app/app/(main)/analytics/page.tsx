"use client";

import { Wallet, CalendarDays, UserX, FileCheck, TrendingUp } from "lucide-react";
import { useApp } from "@/lib/i18n";
import { Kpi } from "@/components/ui/primitives";
import { PageHeader, SectionCard } from "@/components/app/blocks";
import { RevenueArea, ActsDonut, WeeklyBars } from "@/components/app/charts";
import { useData } from "@/components/app/DataProvider";
import { mad } from "@/lib/utils";

export default function AnalyticsPage() {
  const { t } = useApp();
  const { stats } = useData();
  return (
    <>
      <PageHeader title={t("analytics.title")} subtitle={t("analytics.subtitle")} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi index={0} label={t("kpi.revenue")} countTo={stats.collected} format={(n) => mad(n)} suffix={t("common.mad")} delta={stats.revenueDelta} icon={<Wallet className="h-4 w-4" />} />
        <Kpi index={1} label={t("kpi.appointments")} countTo={stats.appointmentsCount} format={(n) => String(Math.round(n))} delta={stats.appointmentsDelta} icon={<CalendarDays className="h-4 w-4" />} />
        <Kpi index={2} label={t("kpi.noshow")} countTo={stats.noShow} format={(n) => `${n.toFixed(1)}%`} delta={stats.noShowDelta} icon={<UserX className="h-4 w-4" />} accent="amber" />
        <Kpi index={3} label={t("kpi.acceptance")} countTo={stats.acceptance} format={(n) => `${Math.round(n)}%`} delta={stats.acceptanceDelta} icon={<FileCheck className="h-4 w-4" />} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <SectionCard
          title={t("sec.revenuetrend")}
          delay={0.05}
          action={<span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600"><TrendingUp className="h-3.5 w-3.5" /> +{stats.revenueDelta}% {t("common.thismonth")}</span>}
        >
          <RevenueArea data={stats.revenueTrend} />
        </SectionCard>
        <SectionCard title={t("sec.actsmix")} delay={0.08}>
          <ActsDonut data={stats.actsMix} />
        </SectionCard>
      </div>

      <div className="mt-5">
        <SectionCard title={`${t("kpi.appointments")}`} delay={0.1}>
          <WeeklyBars />
        </SectionCard>
      </div>
    </>
  );
}
