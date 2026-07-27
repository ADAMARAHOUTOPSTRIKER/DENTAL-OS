"use client";

import { useMemo, useState } from "react";
import { Wallet, Users, Receipt, TrendingUp, Download, UserX } from "lucide-react";
import { useApp } from "@/lib/i18n";
import { Kpi, Button } from "@/components/ui/primitives";
import { PageHeader, SectionCard } from "@/components/app/blocks";
import { RevenueArea, ActsDonut, WeeklyBars } from "@/components/app/charts";
import { useData } from "@/components/app/DataProvider";
import { mad, isoToLabel } from "@/lib/utils";
import { TODAY_ISO } from "@/lib/data";

/** Fenêtres d'analyse proposées, en jours. */
const PERIODS = [30, 90, 365] as const;
type Period = (typeof PERIODS)[number];

function isoDaysAgo(n: number) {
  return new Date(Date.parse(TODAY_ISO + "T00:00:00Z") - n * 86_400_000).toISOString().slice(0, 10);
}

export default function AnalyticsPage() {
  const { t, lang } = useApp();
  const { stats, payments, appointments, patients, treatmentPlans } = useData();
  const [period, setPeriod] = useState<Period>(90);

  const from = isoDaysAgo(period);
  const prevFrom = isoDaysAgo(period * 2);

  /**
   * L'écran répétait à l'identique les quatre indicateurs du tableau de bord.
   * Ici on analyse : sur une fenêtre choisie, avec la période précédente en
   * regard — ce que le tableau de bord, tourné vers la journée, ne fait pas.
   */
  const analysis = useMemo(() => {
    const inRange = payments.filter((p) => p.date >= from && p.date <= TODAY_ISO);
    const prevRange = payments.filter((p) => p.date >= prevFrom && p.date < from);

    const revenue = inRange.reduce((s, p) => s + p.amount, 0);
    const prevRevenue = prevRange.reduce((s, p) => s + p.amount, 0);
    const basket = inRange.length ? Math.round(revenue / inRange.length) : 0;
    const prevBasket = prevRange.length ? Math.round(prevRevenue / prevRange.length) : 0;

    const seen = new Set(
      appointments
        .filter((a) => a.day >= from && a.day <= TODAY_ISO && a.status === "completed")
        .map((a) => a.patientId)
    );
    const prevSeen = new Set(
      appointments
        .filter((a) => a.day >= prevFrom && a.day < from && a.status === "completed")
        .map((a) => a.patientId)
    );

    const past = appointments.filter((a) => a.day >= from && a.day < TODAY_ISO);
    const noShow = past.length
      ? +((past.filter((a) => a.status === "no_show").length / past.length) * 100).toFixed(1)
      : 0;

    const pct = (now: number, before: number) =>
      before ? Math.round(((now - before) / before) * 100) : 0;

    // Les actes qui rapportent le plus sur la période : c'est la question que
    // se pose un praticien qui veut réorienter son activité.
    const byAct = new Map<string, { count: number; total: number }>();
    inRange.forEach((p) => {
      const key = p.act || "—";
      const cur = byAct.get(key) ?? { count: 0, total: 0 };
      cur.count++;
      cur.total += p.amount;
      byAct.set(key, cur);
    });
    const topActs = Array.from(byAct.entries())
      .map(([act, v]) => ({ act, ...v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);

    return {
      revenue,
      revenueDelta: pct(revenue, prevRevenue),
      basket,
      basketDelta: pct(basket, prevBasket),
      seen: seen.size,
      seenDelta: pct(seen.size, prevSeen.size),
      noShow,
      topActs,
      count: inRange.length,
    };
  }, [payments, appointments, from, prevFrom]);

  /** Export CSV : le comptable du cabinet travaille sur tableur, pas dans l'app. */
  const exportCsv = () => {
    const rows = [
      ["date", "patient", "acte", "montant_mad", "moyen"],
      ...payments
        .filter((p) => p.date >= from && p.date <= TODAY_ISO)
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((p) => [p.date, p.patient, p.act, String(p.amount), t(`pay.${p.method}`)]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    // BOM en tête : sans lui Excel affiche « Détartrage » en « DÃ©tartrage ».
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `encaissements-${from}-${TODAY_ISO}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader
        title={t("analytics.title")}
        subtitle={t("analytics.subtitle")}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-xl border border-black/5 bg-white p-1">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={
                    "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors " +
                    (period === p ? "bg-ink-900 text-white" : "text-ink-800/60 hover:text-ink-900")
                  }
                >
                  {p === 365 ? t("analytics.year") : `${p} ${t("analytics.days")}`}
                </button>
              ))}
            </div>
            <Button variant="outline" onClick={exportCsv}>
              <Download className="h-4 w-4" /> {t("analytics.export")}
            </Button>
          </div>
        }
      />

      <p className="rise -mt-2 mb-4 text-xs text-ink-800/45">
        {isoToLabel(from, lang)} — {isoToLabel(TODAY_ISO, lang)} · {analysis.count}{" "}
        {t("analytics.entries")}
      </p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi index={0} label={t("analytics.revenue")} countTo={analysis.revenue} format={(n) => mad(n)} suffix={t("common.mad")} delta={analysis.revenueDelta} icon={<Wallet className="h-4 w-4" />} />
        <Kpi index={1} label={t("analytics.basket")} countTo={analysis.basket} format={(n) => mad(n)} suffix={t("common.mad")} delta={analysis.basketDelta} icon={<Receipt className="h-4 w-4" />} />
        <Kpi index={2} label={t("analytics.seen")} countTo={analysis.seen} format={(n) => String(Math.round(n))} delta={analysis.seenDelta} icon={<Users className="h-4 w-4" />} />
        <Kpi index={3} label={t("kpi.noshow")} countTo={analysis.noShow} format={(n) => `${n.toFixed(1)}%`} icon={<UserX className="h-4 w-4" />} accent="amber" />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <SectionCard
          title={t("sec.revenuetrend")}
          delay={0.05}
          action={
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600">
              <TrendingUp className="h-3.5 w-3.5" />
              {stats.revenueDelta > 0 ? "+" : ""}
              {stats.revenueDelta}% {t("common.thismonth")}
            </span>
          }
        >
          <RevenueArea data={stats.revenueTrend} />
        </SectionCard>
        <SectionCard title={t("sec.actsmix")} delay={0.08}>
          <ActsDonut data={stats.actsMix} />
        </SectionCard>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <SectionCard title={t("analytics.weekload")} delay={0.1}>
          <WeeklyBars data={stats.weeklyLoad} unit={t("analytics.appts")} />
        </SectionCard>

        <SectionCard title={t("analytics.topacts")} delay={0.12}>
          {analysis.topActs.length ? (
            <ul className="divide-y divide-black/5">
              {analysis.topActs.map((a) => {
                const share = analysis.revenue ? Math.round((a.total / analysis.revenue) * 100) : 0;
                return (
                  <li key={a.act} className="py-2.5">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0 flex-1 truncate font-medium text-ink-900">{a.act}</span>
                      <span className="shrink-0 text-xs text-ink-800/45">{a.count}×</span>
                      <span className="shrink-0 font-semibold tabular-nums text-ink-900">
                        {mad(a.total)}{" "}
                        <span className="text-[10px] text-ink-800/40">{t("common.mad")}</span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600"
                        style={{ width: `${share}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="grid place-items-center py-10 text-sm text-ink-800/40">
              {t("analytics.nodata")}
            </div>
          )}
        </SectionCard>
      </div>

      <div className="mt-5">
        <SectionCard title={t("analytics.plans")} delay={0.14}>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: t("status.accepted"), n: treatmentPlans.filter((p) => p.status === "accepted").length, tone: "text-teal-600" },
              { label: t("status.proposed"), n: treatmentPlans.filter((p) => p.status === "proposed").length, tone: "text-amber-600" },
              { label: t("kpi.active"), n: patients.length, tone: "text-ink-900" },
            ].map((b) => (
              <div key={b.label} className="rounded-xl bg-sand-50 p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-ink-800/45">{b.label}</div>
                <div className={`mt-1 font-display text-2xl font-bold ${b.tone}`}>{b.n}</div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </>
  );
}
