"use client";

import { useState } from "react";
import {
  X,
  Phone,
  MapPin,
  AlertTriangle,
  CalendarPlus,
  MessageSquare,
  Users,
  FileText,
  Wallet,
  Activity,
} from "lucide-react";
import { useApp } from "@/lib/i18n";
import { Avatar, Pill, Button } from "@/components/ui/primitives";
import { cn, mad } from "@/lib/utils";
import { useData } from "@/components/app/DataProvider";
import { type Patient } from "@/lib/data";

const TABS = [
  { key: "overview", labelKey: "detail.overview", icon: Activity },
  { key: "plan", labelKey: "detail.plan", icon: FileText },
  { key: "payments", labelKey: "detail.payments", icon: Wallet },
  { key: "family", labelKey: "detail.family", icon: Users },
];

export default function PatientDrawer({
  patient,
  onClose,
}: {
  patient: Patient;
  onClose: () => void;
}) {
  const { t } = useApp();
  const { treatmentPlans, payments, patientById } = useData();
  const [tab, setTab] = useState("overview");

  const plan = treatmentPlans.find((p) => p.patientId === patient.id);
  const pays = payments.filter((p) => p.patientId === patient.id);
  const family = patient.family.map((id) => patientById(id)).filter(Boolean) as Patient[];

  return (
    <div className="fixed inset-0 z-50">
      <div className="fade-in absolute inset-0 bg-ink-950/40 backdrop-blur-sm" onClick={onClose} />
      <aside className="drawer-in absolute inset-y-0 end-0 flex w-full max-w-md flex-col bg-sand-50 shadow-float">
        {/* header */}
        <div className="relative overflow-hidden bg-ink-950 p-5 text-white">
          <div className="pointer-events-none absolute inset-0 bg-aurora opacity-40" />
          <div className="relative">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={patient.name} size={54} ring />
                <div>
                  <h2 className="font-display text-xl font-bold">{patient.name}</h2>
                  <p className="text-sm text-white/60">
                    {patient.age} {t("detail.age")} · {patient.gender === "F" ? "♀" : "♂"} · {patient.city}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 hover:bg-white/20">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {patient.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/80">
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="primary" className="flex-1">
                <CalendarPlus className="h-4 w-4" /> {t("detail.book")}
              </Button>
              <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:border-teal-300 hover:text-teal-200">
                <MessageSquare className="h-4 w-4" /> {t("detail.message")}
              </Button>
            </div>
          </div>
        </div>

        {/* medical alerts */}
        {patient.alerts.length > 0 && (
          <div className="border-b border-amber-200/60 bg-amber-50 px-5 py-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-700">
              <AlertTriangle className="h-3.5 w-3.5" /> {t("detail.alerts")}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {patient.alerts.map((a) => (
                <span key={a} className="rounded-md bg-white px-2 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* tabs */}
        <div className="flex gap-1 border-b border-black/5 bg-white px-3">
          {TABS.map((tb) => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={cn(
                "relative flex items-center gap-1.5 px-3 py-3 text-sm font-medium transition-colors",
                tab === tb.key ? "text-teal-700" : "text-ink-800/50 hover:text-ink-900"
              )}
            >
              <tb.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{t(tb.labelKey)}</span>
              {tab === tb.key && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-teal-500" />}
            </button>
          ))}
        </div>

        {/* content */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === "overview" && (
            <div className="space-y-3">
              <InfoRow icon={<Phone className="h-4 w-4" />} label={t("col.phone")} value={patient.phone} />
              <InfoRow icon={<MapPin className="h-4 w-4" />} label={t("col.name")} value={patient.city} />
              <div className="grid grid-cols-2 gap-3">
                <MiniStat label={t("col.last")} value={patient.lastVisit} />
                <MiniStat label={t("col.next")} value={patient.nextVisit ?? "—"} />
              </div>
              <div className="rounded-xl border border-black/5 bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ink-800/60">{t("col.balance")}</span>
                  <span className={cn("font-display text-xl font-bold", patient.balance > 0 ? "text-amber-600" : "text-teal-600")}>
                    {mad(patient.balance)} {t("common.mad")}
                  </span>
                </div>
              </div>
            </div>
          )}

          {tab === "plan" &&
            (plan ? (
              <div className="rounded-xl border border-black/5 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs text-ink-800/50">{plan.createdAt}</span>
                  <Pill tone={plan.status}>{t(`status.${plan.status}`)}</Pill>
                </div>
                <ul className="divide-y divide-black/5">
                  {plan.lines.map((l, i) => (
                    <li key={i} className="flex items-center justify-between py-2.5 text-sm">
                      <span className="flex items-center gap-2">
                        {l.tooth !== "—" && (
                          <span className="grid h-6 w-6 place-items-center rounded-md bg-teal-50 text-[10px] font-bold text-teal-700">
                            {l.tooth}
                          </span>
                        )}
                        <span className="text-ink-800/80">{l.act}</span>
                      </span>
                      <span className="font-semibold text-ink-900">{mad(l.price)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex items-center justify-between border-t border-black/5 pt-3">
                  <span className="text-sm font-semibold text-ink-900">{t("treat.total")}</span>
                  <span className="font-display text-lg font-bold text-teal-600">
                    {mad(plan.lines.reduce((s, l) => s + l.price, 0))} {t("common.mad")}
                  </span>
                </div>
              </div>
            ) : (
              <Empty label="—" />
            ))}

          {tab === "payments" &&
            (pays.length ? (
              <ul className="space-y-2">
                {pays.map((p) => (
                  <li key={p.id} className="flex items-center justify-between rounded-xl border border-black/5 bg-white p-3">
                    <div>
                      <div className="text-sm font-medium text-ink-900">{p.act}</div>
                      <div className="text-xs text-ink-800/50">{p.date} · {t(`pay.${p.method}`)}</div>
                    </div>
                    <span className="font-semibold text-teal-600">+{mad(p.amount)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty label="—" />
            ))}

          {tab === "family" &&
            (family.length ? (
              <ul className="space-y-2">
                {family.map((f) => (
                  <li key={f.id} className="flex items-center gap-3 rounded-xl border border-black/5 bg-white p-3">
                    <Avatar name={f.name} size={38} />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-ink-900">{f.name}</div>
                      <div className="text-xs text-ink-800/50">{f.age} {t("detail.age")}</div>
                    </div>
                    {f.tags[0] && <span className="rounded-full bg-sand-100 px-2 py-0.5 text-xs text-ink-800/60">{f.tags[0]}</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <Empty label={t("detail.family")} />
            ))}
        </div>
      </aside>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-black/5 bg-white p-3">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-sand-100 text-ink-800/50">{icon}</span>
      <div>
        <div className="text-xs text-ink-800/45">{label}</div>
        <div className="text-sm font-medium text-ink-900">{value}</div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-black/5 bg-white p-3">
      <div className="text-xs text-ink-800/45">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-ink-900">{value}</div>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-black/10 py-10 text-sm text-ink-800/40">
      {label}
    </div>
  );
}
