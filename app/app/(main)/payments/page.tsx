"use client";

import { useState } from "react";
import { Banknote, CreditCard, FileCheck, ArrowLeftRight, Coins, Clock, Check } from "lucide-react";
import { useApp } from "@/lib/i18n";
import { Avatar, Button, Kpi } from "@/components/ui/primitives";
import { PageHeader, SectionCard } from "@/components/app/blocks";
import { useData } from "@/components/app/DataProvider";
import { cn, mad } from "@/lib/utils";

const METHOD_ICON = {
  cash: Banknote,
  card: CreditCard,
  cheque: FileCheck,
  transfer: ArrowLeftRight,
} as const;

export default function PaymentsPage() {
  const { t } = useApp();
  const { payments, patients } = useData();
  const [method, setMethod] = useState<keyof typeof METHOD_ICON>("cash");
  const [recorded, setRecorded] = useState(false);
  const [amount, setAmount] = useState("");

  const collected = payments.reduce((s, p) => s + p.amount, 0);
  const outstanding = patients.reduce((s, p) => s + p.balance, 0);

  const installments = [
    { patient: "Yasmine Alaoui", plan: "Orthodontie", paid: 4, total: 12, next: "24 Jul", amount: 300 },
    { patient: "Youssef Berrada", plan: "Implant + prothèse", paid: 1, total: 4, next: "28 Jul", amount: 2900 },
    { patient: "Salma Cherkaoui", plan: "Blanchiment + facette", paid: 1, total: 3, next: "23 Jul", amount: 1400 },
  ];

  return (
    <>
      <PageHeader title={t("pay.title")} subtitle={t("f.billing.d")} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi index={0} label={t("pay.collected")} value={mad(collected)} suffix={t("common.mad")} icon={<Coins className="h-4 w-4" />} />
        <Kpi index={1} label={t("pay.outstanding")} value={mad(outstanding)} suffix={t("common.mad")} icon={<Clock className="h-4 w-4" />} accent="amber" />
        <Kpi index={2} label={t("kpi.due")} value={mad(2450)} suffix={t("common.mad")} icon={<Banknote className="h-4 w-4" />} />
        <Kpi index={3} label={t("kpi.acceptance")} value="78%" icon={<FileCheck className="h-4 w-4" />} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1.5fr]">
        {/* record payment */}
        <SectionCard title={t("pay.record")} delay={0.05}>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-800/50">{t("col.name")}</label>
              <select className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-400">
                {patients.map((p) => (
                  <option key={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-800/50">Montant ({t("common.mad")})</label>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="numeric"
                placeholder="0"
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
            <Button
              variant={recorded ? "outline" : "primary"}
              className="w-full"
              onClick={() => setRecorded(true)}
            >
              {recorded ? <><Check className="h-4 w-4 text-teal-600" /> {t("reminder.sent")}</> : t("pay.record")}
            </Button>
          </div>
        </SectionCard>

        {/* recent transactions + installments */}
        <div className="space-y-5">
          <SectionCard title={t("nav.payments")} delay={0.08}>
            <ul className="divide-y divide-black/5">
              {payments.map((p) => {
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
