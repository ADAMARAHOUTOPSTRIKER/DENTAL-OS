"use client";

import { useState } from "react";
import { Plus, Check, Share2 } from "lucide-react";
import { useApp } from "@/lib/i18n";
import { Avatar, Pill, Button } from "@/components/ui/primitives";
import { PageHeader } from "@/components/app/blocks";
import { useData } from "@/components/app/DataProvider";
import { type PlanStatus } from "@/lib/data";
import { mad } from "@/lib/utils";

export default function TreatmentsPage() {
  const { t } = useApp();
  const { treatmentPlans } = useData();
  const [statuses, setStatuses] = useState<Record<string, PlanStatus>>({});
  const [shared, setShared] = useState<Record<string, boolean>>({});

  const statusFor = (id: string, fallback: PlanStatus) => statuses[id] ?? fallback;

  return (
    <>
      <PageHeader
        title={t("treat.title")}
        subtitle={t("f.plans.d")}
        action={<Button variant="primary"><Plus className="h-4 w-4" /> {t("app.new")}</Button>}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {treatmentPlans.map((plan, idx) => {
          const total = plan.lines.reduce((s, l) => s + l.price, 0);
          const status = statusFor(plan.id, plan.status);
          return (
            <div key={plan.id} className="rise flex flex-col rounded-2xl border border-black/5 bg-white p-5 shadow-card" style={{ animationDelay: `${idx * 0.06}s` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={plan.patient} size={42} />
                  <div>
                    <div className="font-display text-base font-semibold text-ink-900">{plan.patient}</div>
                    <div className="text-xs text-ink-800/50">{plan.createdAt}</div>
                  </div>
                </div>
                <Pill tone={status}>{t(`status.${status}`)}</Pill>
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
                <span className="font-display text-2xl font-bold text-teal-600">{mad(total)} <span className="text-sm font-medium text-ink-800/50">{t("common.mad")}</span></span>
              </div>

              <div className="mt-4 flex gap-2 border-t border-black/5 pt-4">
                <Button
                  variant={status === "accepted" ? "outline" : "primary"}
                  className="flex-1"
                  disabled={status === "accepted"}
                  onClick={() => setStatuses((s) => ({ ...s, [plan.id]: "accepted" }))}
                >
                  <Check className="h-4 w-4" /> {status === "accepted" ? t("status.accepted") : t("treat.accept")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShared((s) => ({ ...s, [plan.id]: true }))}
                >
                  {shared[plan.id] ? <Check className="h-4 w-4 text-teal-600" /> : <Share2 className="h-4 w-4" />}
                  {shared[plan.id] ? t("reminder.sent") : t("treat.share")}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
