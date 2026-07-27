"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Check, FileText, Loader2, Search, MoreVertical, Trash2, ArrowRight, Wallet, FileCheck,
} from "lucide-react";
import { useApp } from "@/lib/i18n";
import { Avatar, Pill, Button, Kpi } from "@/components/ui/primitives";
import { PageHeader } from "@/components/app/blocks";
import { useData } from "@/components/app/DataProvider";
import { useUI } from "@/components/app/ModalProvider";
import { mad, isoToLabel } from "@/lib/utils";
import type { TreatmentPlan } from "@/lib/data";

type FilterKey = "all" | "proposed" | "accepted";

/** Menu d'actions d'un devis. Un devis se corrige et s'annule : c'est un document de travail. */
function PlanMenu({ plan }: { plan: TreatmentPlan }) {
  const { t } = useApp();
  const { deleteTreatmentPlan } = useData();
  const ui = useUI();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const items = [
    { icon: ArrowRight, label: t("treat.openfile"), run: () => router.push(`/app/patients?id=${plan.patientId}`) },
    { icon: Wallet, label: t("pay.record"), run: () => ui.openPayment(plan.patientId) },
    {
      icon: Trash2,
      label: t("treat.delete"),
      danger: true,
      run: async () => {
        await deleteTreatmentPlan(plan.id);
        ui.toast(t("treat.deleted"));
      },
    },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        aria-label={t("treat.actions")}
        className="grid h-8 w-8 place-items-center rounded-lg text-ink-800/40 transition-colors hover:bg-sand-100 hover:text-ink-900"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="pop-in absolute end-0 top-full z-30 mt-1 w-52 overflow-hidden rounded-xl border border-black/5 bg-white p-1 shadow-float">
          {items.map((it) => (
            <button
              key={it.label}
              onClick={() => {
                setOpen(false);
                it.run();
              }}
              className={
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-start text-sm font-medium transition-colors " +
                (it.danger ? "text-rose-600 hover:bg-rose-50" : "text-ink-800/80 hover:bg-sand-50")
              }
            >
              <it.icon className="h-4 w-4" /> {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TreatmentsPage() {
  const { t, lang } = useApp();
  const { treatmentPlans, setPlanStatus, patientById } = useData();
  const ui = useUI();
  const [sending, setSending] = useState<Record<string, "busy" | "done" | undefined>>({});
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  const prepareDevis = async (planId: string) => {
    const plan = treatmentPlans.find((p) => p.id === planId);
    if (!plan) return;
    setSending((s) => ({ ...s, [planId]: "busy" }));
    await ui.sendDevis(plan, patientById(plan.patientId));
    setSending((s) => ({ ...s, [planId]: "done" }));
  };

  const totals = useMemo(() => {
    const sum = (list: TreatmentPlan[]) =>
      list.reduce((s, p) => s + p.lines.reduce((x, l) => x + l.price, 0), 0);
    const accepted = treatmentPlans.filter((p) => p.status === "accepted");
    const proposed = treatmentPlans.filter((p) => p.status === "proposed");
    return {
      accepted: sum(accepted),
      proposed: sum(proposed),
      rate: treatmentPlans.length ? Math.round((accepted.length / treatmentPlans.length) * 100) : 0,
      proposedCount: proposed.length,
    };
  }, [treatmentPlans]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return treatmentPlans.filter((p) => {
      if (filter !== "all" && p.status !== filter) return false;
      if (!q) return true;
      return (
        p.patient.toLowerCase().includes(q) ||
        p.lines.some((l) => l.act.toLowerCase().includes(q) || l.tooth.includes(q))
      );
    });
  }, [treatmentPlans, query, filter]);

  const FILTERS: { key: FilterKey; label: string }[] = [
    { key: "all", label: t("app.viewall") },
    { key: "proposed", label: t("status.proposed") },
    { key: "accepted", label: t("status.accepted") },
  ];

  return (
    <>
      <PageHeader
        title={t("treat.title")}
        subtitle={t("f.plans.d")}
        action={
          <Button variant="primary" onClick={() => ui.openNewPlan()}>
            <Plus className="h-4 w-4" /> {t("app.new")}
          </Button>
        }
      />

      {/* Les trois chiffres qui pilotent l'activité : ce qui est signé, ce qui
          dort en attente de réponse, et le taux de transformation. */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Kpi index={0} label={t("treat.kpi.accepted")} countTo={totals.accepted} format={(n) => mad(n)} suffix={t("common.mad")} icon={<Check className="h-4 w-4" />} />
        <Kpi index={1} label={t("treat.kpi.pending")} countTo={totals.proposed} format={(n) => mad(n)} suffix={t("common.mad")} icon={<FileText className="h-4 w-4" />} accent="amber" />
        <Kpi index={2} label={t("kpi.acceptance")} countTo={totals.rate} format={(n) => `${Math.round(n)}%`} icon={<FileCheck className="h-4 w-4" />} />
      </div>

      {/* Recherche + filtres : /patients et /imagerie en avaient, pas cet écran. */}
      <div className="rise mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-black/5 bg-white px-3 py-2.5 text-sm focus-within:border-teal-400">
          <Search className="h-4 w-4 shrink-0 text-ink-800/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("treat.search")}
            className="w-full bg-transparent outline-none placeholder:text-ink-800/40"
          />
        </div>
        <div className="flex items-center rounded-xl border border-black/5 bg-white p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={
                "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors " +
                (filter === f.key ? "bg-ink-900 text-white" : "text-ink-800/60 hover:text-ink-900")
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 && (
        <div className="rise mt-5 grid place-items-center gap-3 rounded-2xl border border-dashed border-black/10 py-20 text-center">
          <span className="text-sm text-ink-800/40">
            {treatmentPlans.length ? t("treat.nomatch") : t("plan.empty")}
          </span>
          {!treatmentPlans.length && (
            <Button variant="outline" onClick={() => ui.openNewPlan()}>
              <Plus className="h-4 w-4" /> {t("new.plan")}
            </Button>
          )}
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {shown.map((plan, idx) => {
          const total = plan.lines.reduce((s, l) => s + l.price, 0);
          const status = plan.status;
          const send = sending[plan.id];
          const who = patientById(plan.patientId);
          return (
            <div key={plan.id} className="rise flex flex-col rounded-2xl border border-black/5 bg-white p-5 shadow-card" style={{ animationDelay: `${idx * 0.06}s` }}>
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => ui.openPayment(plan.patientId)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-start"
                >
                  <Avatar name={plan.patient} size={42} />
                  <div className="min-w-0">
                    <div className="truncate font-display text-base font-semibold text-ink-900">{plan.patient}</div>
                    <div className="text-xs text-ink-800/50">
                      {isoToLabel(plan.createdAt, lang)}
                      {who && who.balance > 0 && (
                        <span className="text-amber-600"> · {mad(who.balance)} {t("common.mad")}</span>
                      )}
                    </div>
                  </div>
                </button>
                <div className="flex shrink-0 items-center gap-1">
                  <Pill tone={status}>{t(`status.${status}`)}</Pill>
                  <PlanMenu plan={plan} />
                </div>
              </div>

              <ul className="my-4 divide-y divide-black/5 rounded-xl bg-sand-50 px-3">
                <li className="flex justify-between py-2 text-[11px] font-semibold uppercase tracking-wide text-ink-800/40">
                  <span>{t("treat.act")}</span>
                  <span>{t("treat.price")}</span>
                </li>
                {plan.lines.map((l, i) => (
                  <li key={i} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="flex items-center gap-2">
                      {l.tooth !== "—" && (
                        <span className="grid h-6 w-6 place-items-center rounded-md bg-teal-100 text-[10px] font-bold text-teal-700">{l.tooth}</span>
                      )}
                      <span className="text-ink-800/80">{l.act}</span>
                    </span>
                    <span className="font-semibold text-ink-900">{mad(l.price)}</span>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-800/60">{t("treat.total")}</span>
                <span className="font-display text-2xl font-bold text-teal-600">
                  {mad(total)} <span className="text-sm font-medium text-ink-800/50">{t("common.mad")}</span>
                </span>
              </div>

              <div className="mt-4 flex gap-2 border-t border-black/5 pt-4">
                <Button
                  variant={status === "accepted" ? "outline" : "primary"}
                  className="flex-1"
                  disabled={status === "accepted"}
                  onClick={() => setPlanStatus(plan.id, "accepted")}
                >
                  <Check className="h-4 w-4" /> {status === "accepted" ? t("status.accepted") : t("treat.accept")}
                </Button>
                {/* Le bouton se désarme une fois le devis produit : chaque clic
                    empilait sinon un doublon dans le coffre d'imagerie. */}
                <Button
                  variant="outline"
                  onClick={() => prepareDevis(plan.id)}
                  disabled={send === "busy" || send === "done"}
                >
                  {send === "busy" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : send === "done" ? (
                    <Check className="h-4 w-4 text-teal-600" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  {send === "done" ? t("plan.ready") : t("plan.preparepdf")}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
