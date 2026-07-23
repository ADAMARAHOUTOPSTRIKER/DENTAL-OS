"use client";

import { useState } from "react";
import {
  CalendarClock,
  Check,
  RefreshCw,
  FileText,
  Download,
  MapPin,
  Clock,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/lib/i18n";
import { Button, Pill } from "@/components/ui/primitives";
import { PageHeader, SectionCard } from "@/components/app/blocks";
import { useData } from "@/components/app/DataProvider";
import { mad } from "@/lib/utils";
import type { DocFile } from "@/lib/data";

function openFile(f: DocFile) {
  if (!f.dataUrl) return;
  const w = window.open();
  if (!w) return;
  if (f.kind === "image")
    w.document.write(`<img src="${f.dataUrl}" style="max-width:100%;height:auto;display:block;margin:auto"/>`);
  else w.location.href = f.dataUrl;
}

export default function PortalPage() {
  const { t, lang } = useApp();
  const { patientById, treatmentPlans, payments, documents } = useData();
  const me = patientById("p1")!; // Yasmine Alaoui — always present (seed + Supabase)
  const plan = treatmentPlans.find((p) => p.patientId === me.id);
  const myPays = payments.filter((p) => p.patientId === me.id);
  const myDocs = documents.filter((d) => d.patientId === me.id);
  const [confirmed, setConfirmed] = useState(false);

  const total = plan?.lines.reduce((s, l) => s + l.price, 0) ?? 0;
  const paidSoFar = myPays.reduce((s, p) => s + p.amount, 0);

  return (
    <>
      <PageHeader
        title={`${t("portal.welcome")}, ${me.name.split(" ")[0]} ✨`}
        subtitle={lang === "ar" ? "كل ما يخص علاجك في مكان واحد." : "Tout votre suivi de soins, au même endroit."}
      />

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          {/* next appointment hero card */}
          <div className="rise relative overflow-hidden rounded-2xl bg-ink-950 p-6 text-white shadow-float">
            <div className="pointer-events-none absolute inset-0 bg-aurora opacity-40" />
            <div className="relative">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-teal-200">
                <CalendarClock className="h-4 w-4" /> {t("portal.next")}
              </div>
              <div className="mt-3 font-display text-3xl font-bold">24 Juil · 11:30</div>
              <div className="mt-1 text-white/70">Contrôle orthodontie · Dr. Bennani</div>
              <div className="mt-2 flex items-center gap-4 text-sm text-white/50">
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> 30 min</span>
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Cabinet, Casablanca</span>
              </div>
              <div className="mt-5 flex gap-2">
                <Button variant="primary" onClick={() => setConfirmed(true)} disabled={confirmed}>
                  {confirmed ? <><Check className="h-4 w-4" /> {t("status.confirmed")}</> : <><Check className="h-4 w-4" /> {t("portal.confirm")}</>}
                </Button>
                <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:border-teal-300 hover:text-teal-200">
                  <RefreshCw className="h-4 w-4" /> {t("portal.reschedule")}
                </Button>
              </div>
            </div>
          </div>

          {/* care plan */}
          {plan && (
            <SectionCard title={t("portal.plan")} delay={0.06}>
              <ul className="divide-y divide-black/5">
                {plan.lines.map((l, i) => (
                  <li key={i} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-teal-400" />
                      <span className="text-ink-800/80">{l.act}</span>
                    </span>
                    <span className="font-semibold text-ink-900">{mad(l.price)} {t("common.mad")}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 rounded-xl bg-sand-50 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-800/60">{t("portal.pay")}</span>
                  <span className="font-medium text-ink-900">{mad(paidSoFar)} / {mad(total)} {t("common.mad")}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/5">
                  <div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600" style={{ width: `${(paidSoFar / total) * 100}%` }} />
                </div>
              </div>
            </SectionCard>
          )}
        </div>

        <div className="space-y-5">
          {/* documents */}
          <SectionCard title={t("portal.docs")} delay={0.08}>
            {myDocs.length ? (
              <ul className="space-y-2">
                {myDocs.flatMap((d) =>
                  d.files.map((f, i) => (
                    <li key={`${d.id}-${i}`} className="flex items-center gap-3 rounded-xl border border-black/5 bg-white p-3">
                      <span className="grid h-9 w-9 place-items-center rounded-lg bg-rose-50 text-rose-500"><FileText className="h-4 w-4" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink-900">{f.name}</span>
                        <span className="block truncate text-xs text-ink-800/45">{d.title}</span>
                      </span>
                      <button
                        onClick={() => openFile(f)}
                        disabled={!f.dataUrl}
                        className="grid h-8 w-8 place-items-center rounded-lg text-ink-800/50 hover:bg-sand-50 hover:text-teal-600 disabled:opacity-30"
                        title={t("common.download")}
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </li>
                  ))
                )}
              </ul>
            ) : (
              <div className="grid place-items-center rounded-xl border border-dashed border-black/10 py-8 text-sm text-ink-800/40">
                {t("doc.empty")}
              </div>
            )}
          </SectionCard>

          {/* payment history */}
          <SectionCard title={t("portal.pay")} delay={0.12}>
            <ul className="space-y-2">
              {myPays.map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-xl border border-black/5 bg-white p-3">
                  <div>
                    <div className="text-sm font-medium text-ink-900">{p.act}</div>
                    <div className="text-xs text-ink-800/50">{p.date} · {t(`pay.${p.method}`)}</div>
                  </div>
                  <span className="font-semibold text-teal-600">{mad(p.amount)}</span>
                </li>
              ))}
              <li className="flex items-center justify-between px-1 pt-1">
                <span className="text-sm text-ink-800/60">{t("col.balance")}</span>
                <Pill tone={me.status}>{mad(me.balance)} {t("common.mad")}</Pill>
              </li>
            </ul>
          </SectionCard>
        </div>
      </div>
    </>
  );
}
