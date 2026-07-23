"use client";

import { useMemo } from "react";
import {
  CalendarClock,
  Check,
  RefreshCw,
  FileText,
  Download,
  MapPin,
  Clock,
  Sparkles,
  ScanLine,
  ImageIcon,
  Receipt,
  Globe,
  UserPlus,
  CalendarX,
  Wallet,
} from "lucide-react";
import { useApp, type Lang } from "@/lib/i18n";
import { Button, Pill } from "@/components/ui/primitives";
import { PageHeader, SectionCard } from "@/components/app/blocks";
import { useData } from "@/components/app/DataProvider";
import { useUI } from "@/components/app/ModalProvider";
import { generateReceiptPDF } from "@/lib/pdf";
import { mad, isoToLabel } from "@/lib/utils";
import { TODAY_ISO, type DocFile, type Payment, type DocCategory } from "@/lib/data";

function openFile(f: DocFile) {
  if (!f.dataUrl) return;
  const w = window.open();
  if (!w) return;
  if (f.kind === "image")
    w.document.write(`<img src="${f.dataUrl}" style="max-width:100%;height:auto;display:block;margin:auto"/>`);
  else w.location.href = f.dataUrl;
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

const CAT_ICON: Record<DocCategory, typeof FileText> = {
  xray: ScanLine,
  photo: ImageIcon,
  doc: FileText,
};

export default function PortalPage() {
  const { t, lang, setLang } = useApp();
  const {
    patientById,
    treatmentPlans,
    payments,
    documents,
    appointments,
    confirmAppointmentByPatient,
    setPatientLanguage,
  } = useData();
  const ui = useUI();

  const me = patientById("p1")!; // Yasmine Alaoui — the demo patient (seed + Supabase)
  const plan = treatmentPlans.find((p) => p.patientId === me.id && p.status === "accepted")
    ?? treatmentPlans.find((p) => p.patientId === me.id);
  const myPays = payments.filter((p) => p.patientId === me.id);
  const myDocs = documents.filter((d) => d.patientId === me.id);

  // Real next appointment — soonest upcoming, from live data (no more hardcoding).
  const nextAppt = useMemo(
    () =>
      appointments
        .filter((a) => a.patientId === me.id && a.day >= TODAY_ISO && a.status !== "cancelled")
        .sort((a, b) => a.day.localeCompare(b.day) || a.time.localeCompare(b.time))[0],
    [appointments, me.id]
  );

  // Échéancier driven by the clinic's authoritative outstanding balance (updates
  // live when a payment is recorded) — clamped to the plan so it never goes absurd.
  const total = plan?.lines.reduce((s, l) => s + l.price, 0) ?? 0;
  const remaining = Math.min(Math.max(0, me.balance), total);
  const paidSoFar = total - remaining;
  const pct = total > 0 ? Math.round((paidSoFar / total) * 100) : 0;

  // Documents grouped by category for a real "coffre".
  const docsByCat = useMemo(() => {
    const groups: Record<DocCategory, typeof myDocs> = { xray: [], photo: [], doc: [] };
    myDocs.forEach((d) => groups[d.category].push(d));
    return groups;
  }, [myDocs]);

  const setMyLang = (l: Lang) => {
    setPatientLanguage(me.id, l);
    setLang(l);
    ui.toast(t("portal.language.saved"));
  };

  const downloadReceipt = (p: Payment) => {
    const { blob, filename } = generateReceiptPDF(p, me);
    download(blob, filename);
    ui.toast(t("portal.receipt.done"));
  };

  return (
    <>
      <PageHeader
        title={`${t("portal.welcome")}, ${me.name.split(" ")[0]} ✨`}
        subtitle={lang === "ar" ? "كل ما يخص علاجك في مكان واحد." : "Tout votre suivi de soins, au même endroit."}
        action={
          <div className="flex items-center gap-2 rounded-xl border border-black/5 bg-white p-1 shadow-sm">
            <Globe className="ms-1.5 h-3.5 w-3.5 text-ink-800/40" />
            {(["fr", "ar"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setMyLang(l)}
                className={
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors " +
                  ((me.languagePreference ?? lang) === l
                    ? "bg-ink-900 text-white"
                    : "text-ink-800/60 hover:text-ink-900")
                }
              >
                {l === "fr" ? "Français" : "العربية"}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          {/* next appointment hero — real data */}
          <div className="rise relative overflow-hidden rounded-2xl bg-ink-950 p-6 text-white shadow-float">
            <div className="pointer-events-none absolute inset-0 bg-aurora opacity-40" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-teal-200">
                  <CalendarClock className="h-4 w-4" /> {t("portal.next")}
                </div>
                {nextAppt && (
                  <Pill tone={nextAppt.status}>{t(`status.${nextAppt.status}`)}</Pill>
                )}
              </div>

              {nextAppt ? (
                <>
                  <div className="mt-3 font-display text-3xl font-bold capitalize">
                    {isoToLabel(nextAppt.day)} · {nextAppt.time}
                  </div>
                  <div className="mt-1 text-white/70">
                    {nextAppt.act} · {nextAppt.practitioner}
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-sm text-white/50">
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {nextAppt.duration} min</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Cabinet, {me.city}</span>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button
                      variant="primary"
                      onClick={() => confirmAppointmentByPatient(nextAppt.id)}
                      disabled={nextAppt.patientConfirmed}
                    >
                      <Check className="h-4 w-4" />
                      {nextAppt.patientConfirmed ? t("portal.confirmed") : t("portal.confirm")}
                    </Button>
                    <Button
                      variant="outline"
                      className="border-white/20 bg-white/5 text-white hover:border-teal-300 hover:text-teal-200"
                      onClick={() => ui.openReschedule(nextAppt)}
                    >
                      <RefreshCw className="h-4 w-4" /> {t("portal.reschedule")}
                    </Button>
                  </div>
                  {nextAppt.status === "pending" && (
                    <div className="mt-3 text-xs text-amber-200/80">{t("portal.awaiting")}</div>
                  )}
                </>
              ) : (
                <div className="mt-4 flex flex-col items-start gap-2 py-4">
                  <CalendarX className="h-8 w-8 text-white/30" />
                  <div className="font-display text-lg font-bold">{t("portal.noappt")}</div>
                  <div className="text-sm text-white/50">{t("portal.noappt.sub")}</div>
                </div>
              )}
            </div>
          </div>

          {/* live échéancier */}
          {total > 0 && (
            <SectionCard title={t("portal.plan")} delay={0.06}>
              <ul className="divide-y divide-black/5">
                {plan!.lines.map((l, i) => (
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
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-ink-800/45">{t("portal.total")}</div>
                    <div className="mt-0.5 font-display text-base font-bold text-ink-900">{mad(total)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-ink-800/45">{t("portal.paid")}</div>
                    <div className="mt-0.5 font-display text-base font-bold text-teal-600">{mad(paidSoFar)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-ink-800/45">{t("portal.remaining")}</div>
                    <div className="mt-0.5 font-display text-base font-bold text-amber-600">{mad(remaining)}</div>
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/5">
                  <div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600 transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
                {remaining === 0 && (
                  <div className="mt-2 flex items-center gap-1 text-xs font-medium text-teal-600">
                    <Check className="h-3.5 w-3.5" /> {t("portal.uptodate")}
                  </div>
                )}
              </div>
            </SectionCard>
          )}
        </div>

        <div className="space-y-5">
          {/* real medical vault, grouped */}
          <SectionCard title={t("portal.vault")} delay={0.08}>
            {myDocs.length ? (
              <div className="space-y-4">
                {(Object.keys(docsByCat) as DocCategory[])
                  .filter((c) => docsByCat[c].length)
                  .map((c) => {
                    const Icon = CAT_ICON[c];
                    return (
                      <div key={c}>
                        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-800/40">
                          <Icon className="h-3.5 w-3.5" /> {t(`cat.${c}`)}
                        </div>
                        <ul className="space-y-2">
                          {docsByCat[c].flatMap((d) =>
                            d.files.map((f, i) => (
                              <li key={`${d.id}-${i}`} className="flex items-center gap-3 rounded-xl border border-black/5 bg-white p-3">
                                <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal-50 text-teal-600">
                                  <Icon className="h-4 w-4" />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-medium text-ink-900">{d.title}</span>
                                  <span className="block truncate text-xs text-ink-800/45">{f.name} · {d.createdAt}</span>
                                </span>
                                <button
                                  onClick={() => openFile(f)}
                                  disabled={!f.dataUrl}
                                  className="grid h-8 w-8 place-items-center rounded-lg text-ink-800/50 hover:bg-sand-50 hover:text-teal-600 disabled:opacity-30"
                                  title={t("common.view")}
                                >
                                  <Download className="h-4 w-4" />
                                </button>
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="grid place-items-center rounded-xl border border-dashed border-black/10 py-8 text-sm text-ink-800/40">
                {t("portal.vault.empty")}
              </div>
            )}
          </SectionCard>

          {/* payments with per-payment receipts */}
          <SectionCard title={t("portal.pay")} delay={0.12}>
            <ul className="space-y-2">
              {myPays.map((p) => (
                <li key={p.id} className="flex items-center gap-2 rounded-xl border border-black/5 bg-white p-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink-900">{p.act}</div>
                    <div className="text-xs text-ink-800/50">{p.date} · {t(`pay.${p.method}`)}</div>
                  </div>
                  <span className="font-semibold text-teal-600">{mad(p.amount)}</span>
                  <button
                    onClick={() => downloadReceipt(p)}
                    className="inline-flex items-center gap-1 rounded-lg bg-sand-50 px-2 py-1.5 text-xs font-semibold text-ink-800/70 transition-colors hover:bg-teal-500 hover:text-white"
                    title={t("portal.receipt")}
                  >
                    <Receipt className="h-3.5 w-3.5" /> {t("portal.receipt")}
                  </button>
                </li>
              ))}
              <li className="flex items-center justify-between px-1 pt-1">
                <span className="flex items-center gap-1.5 text-sm text-ink-800/60">
                  <Wallet className="h-3.5 w-3.5" /> {t("col.balance")}
                </span>
                <Pill tone={me.status}>{mad(me.balance)} {t("common.mad")}</Pill>
              </li>
            </ul>
          </SectionCard>

          {/* pré-inscription */}
          <div className="rise rounded-2xl border border-dashed border-teal-300/60 bg-teal-50/40 p-5" style={{ animationDelay: "0.16s" }}>
            <div className="flex items-center gap-2 text-sm font-semibold text-ink-900">
              <UserPlus className="h-4 w-4 text-teal-600" /> {t("portal.prereg")}
            </div>
            <p className="mt-1 text-xs text-ink-800/55">{t("portal.prereg.sub")}</p>
            <button
              onClick={() => ui.openPreRegister()}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-teal-700 ring-1 ring-teal-200 transition-colors hover:bg-teal-500 hover:text-white"
            >
              <UserPlus className="h-4 w-4" /> {t("portal.prereg.cta")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
