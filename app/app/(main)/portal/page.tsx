"use client";

import { useMemo, useState } from "react";
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
  CalendarPlus,
  MessageCircle,
  Home,
  HeartPulse,
  FolderClosed,
  BellRing,
  BellOff,
  ShieldAlert,
  ArrowRight,
  History,
  MapPinCheck,
} from "lucide-react";
import { useApp, type Lang } from "@/lib/i18n";
import { Button, Pill } from "@/components/ui/primitives";
import { PageHeader, SectionCard } from "@/components/app/blocks";
import { useData } from "@/components/app/DataProvider";
import { useUI } from "@/components/app/ModalProvider";
import { generateReceiptPDF, generateDevisPDF } from "@/lib/pdf";
import { mad, isoToLabel, waLink } from "@/lib/utils";
import {
  TODAY_ISO,
  CLINIC_WHATSAPP,
  type DocFile,
  type Payment,
  type DocCategory,
  type TreatmentPlan,
} from "@/lib/data";

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

const CAT_ICON: Record<DocCategory, typeof FileText> = { xray: ScanLine, photo: ImageIcon, doc: FileText };
const fill = (tmpl: string, map: Record<string, string>) => tmpl.replace(/\{(\w+)\}/g, (_, k) => map[k] ?? "");

type Tab = "home" | "care" | "file";

export default function PortalPage() {
  const { t, lang, setLang } = useApp();
  const {
    patientById, treatmentPlans, payments, documents, appointments,
    confirmAppointmentByPatient, markArrived, setPatientLanguage,
    setRecallOptIn, setPlanStatus, addDocument, recalls,
  } = useData();
  const ui = useUI();
  const [tab, setTab] = useState<Tab>("home");

  const me = patientById("p1")!; // Yasmine Alaoui — the demo patient
  const firstName = me.name.split(" ")[0];

  const myAppts = useMemo(
    () => appointments.filter((a) => a.patientId === me.id),
    [appointments, me.id]
  );
  const nextAppt = useMemo(
    () =>
      myAppts
        .filter((a) => a.day >= TODAY_ISO && a.status !== "cancelled")
        .sort((a, b) => a.day.localeCompare(b.day) || a.time.localeCompare(b.time))[0],
    [myAppts]
  );
  const cancelledAppt = useMemo(() => myAppts.find((a) => a.status === "cancelled"), [myAppts]);
  const pastVisits = useMemo(
    () => myAppts.filter((a) => a.status === "completed").sort((a, b) => b.day.localeCompare(a.day) || b.time.localeCompare(a.time)),
    [myAppts]
  );

  const proposedPlans = treatmentPlans.filter((p) => p.patientId === me.id && p.status === "proposed");
  const acceptedPlan = treatmentPlans.find((p) => p.patientId === me.id && p.status === "accepted");
  const myRecalls = recalls.filter((r) => r.patientId === me.id);
  const myPays = payments.filter((p) => p.patientId === me.id);
  const myDocs = documents.filter((d) => d.patientId === me.id);

  const total = acceptedPlan?.lines.reduce((s, l) => s + l.price, 0) ?? 0;
  const remaining = Math.min(Math.max(0, me.balance), total);
  const paidSoFar = total - remaining;
  const pct = total > 0 ? Math.round((paidSoFar / total) * 100) : 0;

  const docsByCat = useMemo(() => {
    const g: Record<DocCategory, typeof myDocs> = { xray: [], photo: [], doc: [] };
    myDocs.forEach((d) => g[d.category].push(d));
    return g;
  }, [myDocs]);

  const isToday = nextAppt?.day === TODAY_ISO;

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
  const viewDevis = (plan: TreatmentPlan) => {
    const { blob, filename } = generateDevisPDF(plan, me);
    download(blob, filename);
  };
  const acceptPlan = async (plan: TreatmentPlan) => {
    await setPlanStatus(plan.id, "accepted");
    const { dataUrl } = generateDevisPDF(plan, me);
    await addDocument({
      patientId: me.id, patient: me.name,
      title: t("consent.title"), category: "doc",
      files: [{ name: `consentement-${plan.id}.pdf`, kind: "pdf", dataUrl }],
    });
    ui.toast(t("plan.accepted.done"));
  };
  const waClinic = (tmplKey: string) => {
    window.open(waLink(CLINIC_WHATSAPP, fill(t(tmplKey), { name: firstName })), "_blank", "noopener,noreferrer");
  };

  const TABS: { key: Tab; label: string; icon: typeof Home }[] = [
    { key: "home", label: t("portal.tab.home"), icon: Home },
    { key: "care", label: t("portal.tab.care"), icon: HeartPulse },
    { key: "file", label: t("portal.tab.file"), icon: FolderClosed },
  ];

  return (
    <>
      <PageHeader
        title={`${t("portal.welcome")}, ${firstName} ✨`}
        subtitle={lang === "ar" ? "كل ما يخص علاجك في مكان واحد." : "Tout votre suivi de soins, au même endroit."}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl border border-black/5 bg-white p-1 shadow-sm">
              <Globe className="ms-1.5 h-3.5 w-3.5 text-ink-800/40" />
              {(["fr", "ar"] as Lang[]).map((l) => (
                <button key={l} onClick={() => setMyLang(l)}
                  className={"rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors " +
                    ((me.languagePreference ?? lang) === l ? "bg-ink-900 text-white" : "text-ink-800/60 hover:text-ink-900")}>
                  {l === "fr" ? "FR" : "ع"}
                </button>
              ))}
            </div>
            <Button variant="outline" onClick={() => waClinic("portal.contact.tmpl")}>
              <MessageCircle className="h-4 w-4" /> {t("portal.contact")}
            </Button>
            <Button variant="primary" onClick={() => ui.openPatientBooking(me.id)}>
              <CalendarPlus className="h-4 w-4" /> {t("portal.book")}
            </Button>
          </div>
        }
      />

      {/* tab bar */}
      <div className="rise mb-5 flex gap-1 rounded-xl border border-black/5 bg-white p-1" style={{ width: "fit-content" }}>
        {TABS.map((tb) => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            className={"flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors " +
              (tab === tb.key ? "bg-ink-900 text-white" : "text-ink-800/60 hover:text-ink-900")}>
            <tb.icon className="h-4 w-4" /> {tb.label}
          </button>
        ))}
      </div>

      {/* ============================= HOME ============================= */}
      {tab === "home" && (
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-5">
            {/* reactivation banner */}
            {cancelledAppt && (
              <div className="rise flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-100 text-amber-600"><CalendarX className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-ink-900">{t("portal.missed")}</div>
                  <div className="text-xs text-ink-800/55">{cancelledAppt.act} · {t("portal.missed.sub")}</div>
                </div>
                <Button variant="dark" onClick={() => ui.openPatientBooking(me.id, { act: cancelledAppt.act })}>
                  {t("portal.missed.cta")}
                </Button>
              </div>
            )}

            {/* hero */}
            <div className="rise relative overflow-hidden rounded-2xl bg-ink-950 p-6 text-white shadow-float">
              <div className="pointer-events-none absolute inset-0 bg-aurora opacity-40" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-teal-200">
                    <CalendarClock className="h-4 w-4" /> {t("portal.next")}
                  </div>
                  {nextAppt && <Pill tone={nextAppt.status}>{t(`status.${nextAppt.status}`)}</Pill>}
                </div>

                {nextAppt ? (
                  <>
                    {isToday && (
                      <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-teal-400/20 px-2.5 py-1 text-xs font-semibold text-teal-200">
                        <Sparkles className="h-3 w-3" /> {t("portal.todaybadge")}
                      </span>
                    )}
                    <div className="mt-2 font-display text-3xl font-bold capitalize">
                      {isoToLabel(nextAppt.day)} · {nextAppt.time}
                    </div>
                    <div className="mt-1 text-white/70">{nextAppt.act} · {nextAppt.practitioner}</div>
                    <div className="mt-2 flex items-center gap-4 text-sm text-white/50">
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {nextAppt.duration} min</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Cabinet, {me.city}</span>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {isToday ? (
                        <Button variant="primary" onClick={() => markArrived(nextAppt.id)} disabled={nextAppt.status === "arrived"}>
                          <MapPinCheck className="h-4 w-4" />
                          {nextAppt.status === "arrived" ? t("portal.checkedin") : t("portal.checkin")}
                        </Button>
                      ) : (
                        <Button variant="primary" onClick={() => confirmAppointmentByPatient(nextAppt.id)} disabled={nextAppt.patientConfirmed}>
                          <Check className="h-4 w-4" />
                          {nextAppt.patientConfirmed ? t("portal.confirmed") : t("portal.confirm")}
                        </Button>
                      )}
                      <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:border-teal-300 hover:text-teal-200"
                        onClick={() => ui.openReschedule(nextAppt)}>
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
                    <Button variant="primary" className="mt-1" onClick={() => ui.openPatientBooking(me.id)}>
                      <CalendarPlus className="h-4 w-4" /> {t("portal.book")}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* échéancier */}
            {total > 0 && (
              <SectionCard title={t("portal.plan.accepted")} delay={0.06}>
                <div className="rounded-xl bg-sand-50 p-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div><div className="text-[11px] uppercase tracking-wide text-ink-800/45">{t("portal.total")}</div><div className="mt-0.5 font-display text-base font-bold text-ink-900">{mad(total)}</div></div>
                    <div><div className="text-[11px] uppercase tracking-wide text-ink-800/45">{t("portal.paid")}</div><div className="mt-0.5 font-display text-base font-bold text-teal-600">{mad(paidSoFar)}</div></div>
                    <div><div className="text-[11px] uppercase tracking-wide text-ink-800/45">{t("portal.remaining")}</div><div className="mt-0.5 font-display text-base font-bold text-amber-600">{mad(remaining)}</div></div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/5">
                    <div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600 transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                  {remaining === 0 && (
                    <div className="mt-2 flex items-center gap-1 text-xs font-medium text-teal-600"><Check className="h-3.5 w-3.5" /> {t("portal.uptodate")}</div>
                  )}
                </div>
              </SectionCard>
            )}
          </div>

          <div className="space-y-5">
            {/* recalls quick view on home */}
            <SectionCard title={t("portal.recalls")} delay={0.08}>
              {myRecalls.length ? (
                <ul className="space-y-2">
                  {myRecalls.map((r) => (
                    <li key={r.patientId + r.reason} className="flex items-center gap-3 rounded-xl border border-black/5 bg-sand-50 p-2.5">
                      <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal-50 text-teal-600"><BellRing className="h-4 w-4" /></span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-ink-900">{r.reason}</div>
                        <div className="truncate text-xs text-ink-800/50">{r.due}</div>
                      </div>
                      <button onClick={() => ui.openPatientBooking(me.id, { act: r.reason })}
                        className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-teal-700 ring-1 ring-teal-200 hover:bg-teal-500 hover:text-white">
                        {t("portal.recall.book")}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="grid place-items-center rounded-xl border border-dashed border-black/10 py-6 text-sm text-ink-800/40">{t("portal.recalls.empty")}</div>
              )}
            </SectionCard>
          </div>
        </div>
      )}

      {/* ============================= CARE ============================= */}
      {tab === "care" && (
        <div className="grid gap-5 lg:grid-cols-2">
          {/* devis à valider */}
          {proposedPlans.map((plan, idx) => {
            const tot = plan.lines.reduce((s, l) => s + l.price, 0);
            return (
              <SectionCard key={plan.id} title={t("portal.proposed")} delay={idx * 0.05}>
                <ul className="divide-y divide-black/5">
                  {plan.lines.map((l, i) => (
                    <li key={i} className="flex items-center justify-between py-2.5 text-sm">
                      <span className="flex items-center gap-2">
                        {l.tooth !== "—" && <span className="grid h-6 w-6 place-items-center rounded-md bg-teal-50 text-[10px] font-bold text-teal-700">{l.tooth}</span>}
                        <span className="text-ink-800/80">{l.act}</span>
                      </span>
                      <span className="font-semibold text-ink-900">{mad(l.price)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex items-center justify-between border-t border-black/5 pt-3">
                  <span className="text-sm font-semibold text-ink-900">{t("treat.total")}</span>
                  <span className="font-display text-lg font-bold text-teal-600">{mad(tot)} {t("common.mad")}</span>
                </div>
                <p className="mt-3 text-xs text-ink-800/50">{t("plan.consent")}</p>
                <div className="mt-3 flex gap-2">
                  <Button variant="primary" className="flex-1" onClick={() => acceptPlan(plan)}>
                    <Check className="h-4 w-4" /> {t("plan.accept")}
                  </Button>
                  <Button variant="outline" onClick={() => viewDevis(plan)}>
                    <FileText className="h-4 w-4" /> {t("plan.viewpdf")}
                  </Button>
                </div>
              </SectionCard>
            );
          })}

          {/* poursuivre mon traitement */}
          {acceptedPlan && (
            <SectionCard title={t("portal.continue")} delay={0.06}>
              <p className="-mt-2 mb-3 text-xs text-ink-800/50">{t("portal.continue.sub")}</p>
              <ul className="space-y-2">
                {acceptedPlan.lines.map((l, i) => (
                  <li key={i} className="flex items-center gap-3 rounded-xl border border-black/5 bg-white p-3">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-50 text-xs font-bold text-teal-700">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-ink-900">{l.act}</div>
                      {l.tooth !== "—" && <div className="text-xs text-ink-800/45">Dent {l.tooth}</div>}
                    </div>
                    <button onClick={() => ui.openPatientBooking(me.id, { act: l.act })}
                      className="inline-flex items-center gap-1 rounded-lg bg-sand-50 px-2.5 py-1.5 text-xs font-semibold text-ink-800/70 hover:bg-teal-500 hover:text-white">
                      <CalendarPlus className="h-3.5 w-3.5" /> {t("portal.step.book")}
                    </button>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          {/* mes rappels + opt-in */}
          <SectionCard title={t("portal.recalls")} delay={0.1}>
            <label className="mb-3 flex items-center justify-between gap-3 rounded-xl bg-sand-50 p-3">
              <span className="flex items-center gap-2">
                {me.recallOptIn === false ? <BellOff className="h-4 w-4 text-ink-800/40" /> : <BellRing className="h-4 w-4 text-teal-600" />}
                <span className="text-sm">
                  <span className="block font-medium text-ink-900">{t("portal.recallopt")}</span>
                  <span className="block text-xs text-ink-800/50">{t("portal.recallopt.hint")}</span>
                </span>
              </span>
              <button
                role="switch"
                aria-checked={me.recallOptIn !== false}
                onClick={() => setRecallOptIn(me.id, me.recallOptIn === false)}
                className={"relative h-6 w-11 shrink-0 rounded-full transition-colors " + (me.recallOptIn !== false ? "bg-teal-500" : "bg-ink-900/15")}
              >
                <span className={"absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all " + (me.recallOptIn !== false ? "start-[22px]" : "start-0.5")} />
              </button>
            </label>
            {myRecalls.length && me.recallOptIn !== false ? (
              <ul className="space-y-2">
                {myRecalls.map((r) => (
                  <li key={r.patientId + r.reason} className="flex items-center gap-3 rounded-xl border border-black/5 bg-white p-3">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal-50 text-teal-600"><BellRing className="h-4 w-4" /></span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-ink-900">{r.reason}</div>
                      <div className="truncate text-xs text-ink-800/50">{r.due}</div>
                    </div>
                    <button onClick={() => ui.openPatientBooking(me.id, { act: r.reason })}
                      className="inline-flex items-center gap-1 rounded-lg bg-sand-50 px-2.5 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-500 hover:text-white">
                      {t("portal.recall.book")}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="grid place-items-center rounded-xl border border-dashed border-black/10 py-6 text-sm text-ink-800/40">{t("portal.recalls.empty")}</div>
            )}
          </SectionCard>

          {/* profil médical */}
          <SectionCard title={t("portal.medical")} delay={0.14}>
            {me.alerts.length ? (
              <div className="flex flex-wrap gap-2">
                {me.alerts.map((a) => (
                  <span key={a} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-800 ring-1 ring-amber-200">
                    <ShieldAlert className="h-3.5 w-3.5" /> {a}
                  </span>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-black/10 py-5 text-center text-sm text-ink-800/40">{t("portal.medical.none")}</div>
            )}
            <p className="mt-3 text-xs text-ink-800/45">{t("portal.medical.hint")}</p>
            <button onClick={() => waClinic("portal.medupdate.tmpl")}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-teal-700 ring-1 ring-teal-200 hover:bg-teal-500 hover:text-white">
              <MessageCircle className="h-4 w-4" /> {t("portal.medical.propose")}
            </button>
          </SectionCard>
        </div>
      )}

      {/* ============================= FILE ============================= */}
      {tab === "file" && (
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-5">
            {/* coffre */}
            <SectionCard title={t("portal.vault")} delay={0.04}>
              {myDocs.length ? (
                <div className="space-y-4">
                  {(Object.keys(docsByCat) as DocCategory[]).filter((c) => docsByCat[c].length).map((c) => {
                    const Icon = CAT_ICON[c];
                    return (
                      <div key={c}>
                        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-800/40">
                          <Icon className="h-3.5 w-3.5" /> {t(`cat.${c}`)}
                        </div>
                        <ul className="space-y-2">
                          {docsByCat[c].flatMap((d) => d.files.map((f, i) => (
                            <li key={`${d.id}-${i}`} className="flex items-center gap-3 rounded-xl border border-black/5 bg-white p-3">
                              <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal-50 text-teal-600"><Icon className="h-4 w-4" /></span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium text-ink-900">{d.title}</span>
                                <span className="block truncate text-xs text-ink-800/45">{f.name} · {d.createdAt}</span>
                              </span>
                              <button onClick={() => openFile(f)} disabled={!f.dataUrl}
                                className="grid h-8 w-8 place-items-center rounded-lg text-ink-800/50 hover:bg-sand-50 hover:text-teal-600 disabled:opacity-30" title={t("common.view")}>
                                <Download className="h-4 w-4" />
                              </button>
                            </li>
                          )))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid place-items-center rounded-xl border border-dashed border-black/10 py-8 text-sm text-ink-800/40">{t("portal.vault.empty")}</div>
              )}
            </SectionCard>

            {/* carnet de soins */}
            <SectionCard title={t("portal.history")} delay={0.08}>
              {pastVisits.length ? (
                <ol className="relative space-y-3 ps-4">
                  <span className="absolute inset-y-1 start-[5px] w-px bg-black/10" />
                  {pastVisits.map((v) => (
                    <li key={v.id} className="relative">
                      <span className="absolute -start-4 top-1.5 h-2.5 w-2.5 rounded-full bg-teal-500 ring-4 ring-white" />
                      <div className="rounded-xl border border-black/5 bg-white p-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-ink-900">
                          <History className="h-3.5 w-3.5 text-ink-800/40" /> {v.act}
                        </div>
                        <div className="mt-0.5 text-xs text-ink-800/50">{isoToLabel(v.day)} · {v.practitioner}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="grid place-items-center rounded-xl border border-dashed border-black/10 py-8 text-sm text-ink-800/40">{t("portal.history.empty")}</div>
              )}
            </SectionCard>
          </div>

          <div className="space-y-5">
            {/* paiements + reçus */}
            <SectionCard title={t("portal.pay")} delay={0.06}>
              <ul className="space-y-2">
                {myPays.map((p) => (
                  <li key={p.id} className="flex items-center gap-2 rounded-xl border border-black/5 bg-white p-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-ink-900">{p.act}</div>
                      <div className="text-xs text-ink-800/50">{p.date} · {t(`pay.${p.method}`)}</div>
                    </div>
                    <span className="font-semibold text-teal-600">{mad(p.amount)}</span>
                    <button onClick={() => downloadReceipt(p)}
                      className="inline-flex items-center gap-1 rounded-lg bg-sand-50 px-2 py-1.5 text-xs font-semibold text-ink-800/70 hover:bg-teal-500 hover:text-white" title={t("portal.receipt")}>
                      <Receipt className="h-3.5 w-3.5" /> {t("portal.receipt")}
                    </button>
                  </li>
                ))}
                <li className="flex items-center justify-between px-1 pt-1">
                  <span className="flex items-center gap-1.5 text-sm text-ink-800/60"><Wallet className="h-3.5 w-3.5" /> {t("col.balance")}</span>
                  <Pill tone={me.status}>{mad(me.balance)} {t("common.mad")}</Pill>
                </li>
              </ul>
            </SectionCard>

            {/* pré-inscription */}
            <div className="rise rounded-2xl border border-dashed border-teal-300/60 bg-teal-50/40 p-5" style={{ animationDelay: "0.1s" }}>
              <div className="flex items-center gap-2 text-sm font-semibold text-ink-900">
                <UserPlus className="h-4 w-4 text-teal-600" /> {t("portal.prereg")}
              </div>
              <p className="mt-1 text-xs text-ink-800/55">{t("portal.prereg.sub")}</p>
              <button onClick={() => ui.openPreRegister()}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-teal-700 ring-1 ring-teal-200 hover:bg-teal-500 hover:text-white">
                <UserPlus className="h-4 w-4" /> {t("portal.prereg.cta")} <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
