"use client";

import { Wallet, CalendarDays, UserX, FileCheck, TrendingUp } from "lucide-react";
import { useApp } from "@/lib/i18n";
import { Kpi } from "@/components/ui/primitives";
import { PageHeader, SectionCard } from "@/components/app/blocks";
import { RevenueArea, ActsDonut, WeeklyBars } from "@/components/app/charts";
import { kpis } from "@/lib/data";
import { mad } from "@/lib/utils";

export default function AnalyticsPage() {
  const { t } = useApp();
  return (
    <>
      <PageHeader title={t("analytics.title")} subtitle={t("analytics.subtitle")} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi index={0} label={t("kpi.revenue")} value={mad(kpis.revenue)} suffix={t("common.mad")} delta={kpis.revenueDelta} icon={<Wallet className="h-4 w-4" />} />
        <Kpi index={1} label={t("kpi.appointments")} value={String(kpis.appointments)} delta={kpis.appointmentsDelta} icon={<CalendarDays className="h-4 w-4" />} />
        <Kpi index={2} label={t("kpi.noshow")} value={`${kpis.noShow}%`} delta={kpis.noShowDelta} icon={<UserX className="h-4 w-4" />} accent="amber" />
        <Kpi index={3} label={t("kpi.acceptance")} value={`${kpis.acceptance}%`} delta={kpis.acceptanceDelta} icon={<FileCheck className="h-4 w-4" />} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <SectionCard
          title={t("sec.revenuetrend")}
          delay={0.05}
          action={<span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600"><TrendingUp className="h-3.5 w-3.5" /> +{kpis.revenueDelta}% {t("common.thismonth")}</span>}
        >
          <RevenueArea />
        </SectionCard>
        <SectionCard title={t("sec.actsmix")} delay={0.08}>
          <ActsDonut />
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
