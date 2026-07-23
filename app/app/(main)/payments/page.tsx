"use client";

import { useMemo, useState } from "react";
import { Banknote, CreditCard, FileCheck, ArrowLeftRight, Coins, Clock, Check, TrendingUp } from "lucide-react";
import { useApp } from "@/lib/i18n";
import { Avatar, Button, Kpi } from "@/components/ui/primitives";
import { PageHeader, SectionCard } from "@/components/app/blocks";
import { RevenueArea } from "@/components/app/charts";
import { useData } from "@/components/app/DataProvider";
import { useUI } from "@/components/app/ModalProvider";
import { cn, mad } from "@/lib/utils";
import type { Payment } from "@/lib/data";

const METHOD_ICON = {
  cash: Banknote,
  card: CreditCard,
  cheque: FileCheck,
  transfer: ArrowLeftRight,
} as const;
const METHOD_COLOR: Record<keyof typeof METHOD_ICON, string> = {
  cash: "#2ec4b6",
  card: "#0f6e68",
  cheque: "#ffa02e",
  transfer: "#14a89a",
};

export default function PaymentsPage() {
  const { t } = useApp();
  const { payments, patients, stats, recordPayment, patientById } = useData();
  const { toast } = useUI();

  const [patientId, setPatientId] = useState(patients[0]?.id ?? "");
  const [method, setMethod] = useState<keyof typeof METHOD_ICON>("cash");
  const [amount, setAmount] = useState("");
  const [act, setAct] = useState("");
  const [justDone, setJustDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const selected = patientById(patientId);
  const amt = Number(amount) || 0;
  const canRecord = !!patientId && amt > 0 && !busy;

  // Distribution by payment method.
  const byMethod = useMemo(() => {
    const totals: Record<keyof typeof METHOD_ICON, number> = { cash: 0, card: 0, cheque: 0, transfer: 0 };
    payments.forEach((p) => { totals[p.method] += p.amount; });
    const sum = Object.values(totals).reduce((a, b) => a + b, 0) || 1;
    return (Object.keys(totals) as (keyof typeof METHOD_ICON)[]).map((m) => ({
      m, label: t(`pay.${m}`), raw: totals[m], pct: Math.round((totals[m] / sum) * 100), color: METHOD_COLOR[m],
    }));
  }, [payments, t]);

  const submit = async () => {
    if (!canRecord) return;
    setBusy(true);
    await recordPayment({ patientId, patient: selected?.name ?? "Patient", amount: amt, method, act });
    toast(`${t("pay.recorded")} · +${mad(amt)} MAD`);
    setAmount(""); setAct(""); setJustDone(true); setBusy(false);
    setTimeout(() => setJustDone(false), 1600);
  };

  const installments = [
    { patient: "Yasmine Alaoui", plan: "Orthodontie", paid: 4, total: 12, next: "24 Jul", amount: 300 },
    { patient: "Youssef Berrada", plan: "Implant + prothèse", paid: 1, total: 4, next: "28 Jul", amount: 2900 },
    { patient: "Salma Cherkaoui", plan: "Blanchiment + facette", paid: 1, total: 3, next: "23 Jul", amount: 1400 },
  ];

  return (
    <>
      <PageHeader title={t("pay.title")} subtitle={t("f.billing.d")} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi index={0} label={t("pay.collected")} countTo={stats.collected} format={(n) => mad(n)} suffix={t("common.mad")} icon={<Coins className="h-4 w-4" />} />
        <Kpi index={1} label={t("pay.outstanding")} countTo={stats.outstanding} format={(n) => mad(n)} suffix={t("common.mad")} icon={<Clock className="h-4 w-4" />} accent="amber" />
        <Kpi index={2} label={t("kpi.due")} countTo={stats.dueToday} format={(n) => mad(n)} suffix={t("common.mad")} icon={<Banknote className="h-4 w-4" />} />
        <Kpi index={3} label={t("kpi.acceptance")} countTo={stats.acceptance} format={(n) => `${Math.round(n)}%`} icon={<FileCheck className="h-4 w-4" />} />
      </div>

      {/* trend + method breakdown */}
      <div className="mt-6 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <SectionCard
          title={t("pay.collected")}
          delay={0.05}
          action={<span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600"><TrendingUp className="h-3.5 w-3.5" /> +{stats.revenueDelta}% {t("common.thismonth")}</span>}
        >
          <RevenueArea data={stats.revenueTrend} />
        </SectionCard>

        <SectionCard title={t("pay.method")} delay={0.08}>
          <div className="space-y-3.5 pt-1">
            {byMethod.map((m) => {
              const I = METHOD_ICON[m.m];
              return (
                <div key={m.m}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-medium text-ink-800/70">
                      <span className="grid h-5 w-5 place-items-center rounded-md" style={{ background: `${m.color}1f`, color: m.color }}><I className="h-3 w-3" /></span>
                      {m.label}
                    </span>
                    <span className="font-semibold text-ink-900">{mad(m.raw)} <span className="text-[10px] text-ink-800/40">MAD · {m.pct}%</span></span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-black/5">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${m.pct}%`, background: m.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>

      {/* record + recent */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.5fr]">
        <SectionCard title={t("pay.record")} delay={0.05}>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-800/50">{t("col.name")}</label>
              <select value={patientId} onChange={(e) => setPatientId(e.target.value)}
                className="w-full appearance-none rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-400">
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}{p.balance > 0 ? ` · ${mad(p.balance)} MAD` : ""}</option>
                ))}
              </select>
            </div>
            {selected && selected.balance > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-xs">
                <span className="text-amber-700">{t("col.balance")}</span>
                <span className="font-semibold text-amber-700">{mad(selected.balance)} {t("common.mad")}</span>
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-800/50">{t("field.amount")} ({t("common.mad")})</label>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" placeholder="0"
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-400" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-800/50">{t("appt.act")}</label>
              <input value={act} onChange={(e) => setAct(e.target.value)} placeholder="Détartrage, acompte implant…"
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-400" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-800/50">{t("pay.method")}</label>
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(METHOD_ICON) as (keyof typeof METHOD_ICON)[]).map((m) => {
                  const I = METHOD_ICON[m];
                  return (
                    <button key={m} onClick={() => setMethod(m)}
                      className={cn("flex flex-col items-center gap-1 rounded-xl border p-2.5 text-[11px] font-medium transition-all",
                        method === m ? "border-teal-400 bg-teal-50 text-teal-700 shadow-sm" : "border-black/5 text-ink-800/60 hover:border-teal-200")}>
                      <I className="h-4 w-4" />
                      {t(`pay.${m}`)}
                    </button>
                  );
                })}
              </div>
            </div>
            <Button variant={justDone ? "outline" : "primary"} className="w-full" onClick={submit} disabled={!canRecord}>
              {justDone ? <><Check className="h-4 w-4 text-teal-600" /> {t("pay.recorded")}</> : t("pay.record")}
            </Button>
          </div>
        </SectionCard>

        <SectionCard title={t("nav.payments")} delay={0.08}>
          <ul className="divide-y divide-black/5">
            {payments.slice(0, 10).map((p: Payment) => {
              const I = METHOD_ICON[p.method];
              return (
                <li key={p.id} className="group flex items-center gap-3 rounded-lg px-1 py-2.5 transition-colors first:pt-0 hover:bg-sand-50">
                  <span className="grid h-9 w-9 place-items-center rounded-lg transition-transform group-hover:scale-105" style={{ background: `${METHOD_COLOR[p.method]}1f`, color: METHOD_COLOR[p.method] }}><I className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink-900">{p.patient}</div>
                    <div className="truncate text-xs text-ink-800/50">{p.act} · {p.date} · {t(`pay.${p.method}`)}</div>
                  </div>
                  <span className="font-semibold tabular-nums text-teal-600">+{mad(p.amount)}</span>
                </li>
              );
            })}
          </ul>
        </SectionCard>
      </div>

      {/* installments */}
      <div className="mt-5">
        <SectionCard title={t("pay.installments")} delay={0.12}>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {installments.map((it, i) => (
              <li key={i} className="rounded-xl border border-black/5 bg-sand-50 p-3">
                <div className="flex items-center gap-3">
                  <Avatar name={it.patient} size={34} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink-900">{it.patient}</div>
                    <div className="truncate text-xs text-ink-800/50">{it.plan}</div>
                  </div>
                </div>
                <div className="mt-2.5 flex items-center justify-between text-xs">
                  <span className="text-ink-800/50">Prochaine · {it.next}</span>
                  <span className="font-semibold text-ink-900">{mad(it.amount)} {t("common.mad")}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/5">
                    <div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600 transition-all duration-700" style={{ width: `${(it.paid / it.total) * 100}%` }} />
                  </div>
                  <span className="text-xs font-medium text-ink-800/60">{it.paid}/{it.total}</span>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </>
  );
}
