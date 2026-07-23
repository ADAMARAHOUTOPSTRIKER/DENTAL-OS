"use client";

import { useState } from "react";
import { Banknote, CreditCard, FileCheck, ArrowLeftRight, Coins, Clock, Check } from "lucide-react";
import { useApp } from "@/lib/i18n";
import { Avatar, Button, Kpi } from "@/components/ui/primitives";
import { PageHeader, SectionCard } from "@/components/app/blocks";
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

  const submit = async () => {
    if (!canRecord) return;
    setBusy(true);
    await recordPayment({
      patientId,
      patient: selected?.name ?? "Patient",
      amount: amt,
      method,
      act,
    });
    toast(`${t("pay.recorded")} · +${mad(amt)} MAD`);
    setAmount("");
    setAct("");
    setJustDone(true);
    setBusy(false);
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
        <Kpi index={0} label={t("pay.collected")} value={mad(stats.collected)} suffix={t("common.mad")} icon={<Coins className="h-4 w-4" />} />
        <Kpi index={1} label={t("pay.outstanding")} value={mad(stats.outstanding)} suffix={t("common.mad")} icon={<Clock className="h-4 w-4" />} accent="amber" />
        <Kpi index={2} label={t("kpi.due")} value={mad(stats.dueToday)} suffix={t("common.mad")} icon={<Banknote className="h-4 w-4" />} />
        <Kpi index={3} label={t("kpi.acceptance")} value={`${stats.acceptance}%`} icon={<FileCheck className="h-4 w-4" />} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1.5fr]">
        {/* record payment */}
        <SectionCard title={t("pay.record")} delay={0.05}>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-800/50">{t("col.name")}</label>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full appearance-none rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-400"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}{p.balance > 0 ? ` · ${mad(p.balance)} MAD` : ""}
                  </option>
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
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="numeric"
                placeholder="0"
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-400"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-800/50">{t("appt.act")}</label>
              <input
                value={act}
                onChange={(e) => setAct(e.target.value)}
                placeholder="Détartrage, acompte implant…"
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-400"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-800/50">{t("pay.method")}</label>
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(METHOD_ICON) as (keyof typeof METHOD_ICON)[]).map((m) => {
                  const I = METHOD_ICON[m];
                  return (
                    <button
                      key={m}
                      onClick={() => setMethod(m)}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-xl border p-2.5 text-[11px] font-medium transition-all",
                        method === m ? "border-teal-400 bg-teal-50 text-teal-700" : "border-black/5 text-ink-800/60 hover:border-teal-200"
                      )}
                    >
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

        {/* recent transactions + installments */}
        <div className="space-y-5">
          <SectionCard title={t("nav.payments")} delay={0.08}>
            <ul className="divide-y divide-black/5">
              {payments.slice(0, 10).map((p: Payment) => {
                const I = METHOD_ICON[p.method];
                return (
                  <li key={p.id} className="flex items-center gap-3 py-2.5 first:pt-0">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal-50 text-teal-600"><I className="h-4 w-4" /></span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-ink-900">{p.patient}</div>
                      <div className="truncate text-xs text-ink-800/50">{p.act} · {p.date} · {t(`pay.${p.method}`)}</div>
                    </div>
                    <span className="font-semibold text-teal-600">+{mad(p.amount)}</span>
                  </li>
                );
              })}
            </ul>
          </SectionCard>

          <SectionCard title={t("pay.installments")} delay={0.12}>
            <ul className="space-y-3">
              {installments.map((it, i) => (
                <li key={i} className="rounded-xl border border-black/5 bg-sand-50 p-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={it.patient} size={34} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-ink-900">{it.patient}</div>
                      <div className="truncate text-xs text-ink-800/50">{it.plan}</div>
                    </div>
                    <div className="text-end">
                      <div className="text-xs text-ink-800/50">Prochaine · {it.next}</div>
                      <div className="text-sm font-semibold text-ink-900">{mad(it.amount)} {t("common.mad")}</div>
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/5">
                      <div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600" style={{ width: `${(it.paid / it.total) * 100}%` }} />
                    </div>
                    <span className="text-xs font-medium text-ink-800/60">{it.paid}/{it.total}</span>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </div>
    </>
  );
}
