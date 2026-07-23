"use client";

import { useMemo, useState } from "react";
import {
  CalendarClock, Check, RefreshCw, FileText, Download, MapPin, Clock, Sparkles,
  ScanLine, ImageIcon, Receipt, Globe, UserPlus, CalendarX, Wallet, CalendarPlus,
  MessageCircle, Home, HeartPulse, FolderClosed, BellRing, BellOff, ShieldAlert,
  ArrowRight, History, MapPinCheck, Users, FileSignature, PenLine, CalendarPlus2,
  RotateCw, FileDown, Plane, Stethoscope, ShieldPlus, ClipboardList,
} from "lucide-react";
import { useApp, type Lang } from "@/lib/i18n";
import { Button, Pill, Avatar } from "@/components/ui/primitives";
import { PageHeader, SectionCard } from "@/components/app/blocks";
import { useData } from "@/components/app/DataProvider";
import { useUI } from "@/components/app/ModalProvider";
import {
  generateReceiptPDF, generateDevisPDF, generateDossierPDF,
  generateFeuilleSoinsPDF, generateInstructionsPDF,
} from "@/lib/pdf";
import { mad, isoToLabel, waLink, buildICS, addDaysIso } from "@/lib/utils";
import {
  AMO_REGIMES, type Regime, indicativeRate, instructionsFor, precautionFromAlerts, isSurgical,
} from "@/lib/care";
import {
  TODAY_ISO, CLINIC_WHATSAPP,
  type DocFile, type Payment, type DocCategory, type TreatmentPlan,
} from "@/lib/data";

function openFile(f: DocFile) {
  if (!f.dataUrl) return;
  const w = window.open();
  if (!w) return;
  if (f.kind === "image") w.document.write(`<img src="${f.dataUrl}" style="max-width:100%;height:auto;display:block;margin:auto"/>`);
  else w.location.href = f.dataUrl;
}
function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
const CAT_ICON: Record<DocCategory, typeof FileText> = { xray: ScanLine, photo: ImageIcon, doc: FileText };
const fill = (tmpl: string, map: Record<string, string>) => tmpl.replace(/\{(\w+)\}/g, (_, k) => map[k] ?? "");

type Tab = "home" | "care" | "file";
const GUARDIAN_ID = "p1"; // Yasmine Alaoui — the logged-in guardian

export default function PortalPage() {
  const { t, lang, setLang } = useApp();
  const data = useData();
  const {
    patientById, treatmentPlans, payments, documents, appointments, recalls,
    confirmAppointmentByPatient, markArrived, setPatientLanguage, setRecallOptIn,
    setPlanStatus, addDocument,
  } = data;
  const ui = useUI();
  const [tab, setTab] = useState<Tab>("home");

  const guardian = patientById(GUARDIAN_ID)!;
  const familyIds = useMemo(() => [GUARDIAN_ID, ...guardian.family], [guardian.family]);
  const [activeId, setActiveId] = useState(GUARDIAN_ID);
  const [regime, setRegime] = useState<Regime>("CNSS (AMO)");
  const [stayFrom, setStayFrom] = useState(TODAY_ISO);
  const [stayTo, setStayTo] = useState(addDaysIso(TODAY_ISO, 14));
  const me = patientById(activeId) ?? guardian;
  const firstName = me.name.split(" ")[0];
  const isGuardian = me.id === GUARDIAN_ID;

  const myAppts = useMemo(() => appointments.filter((a) => a.patientId === me.id), [appointments, me.id]);
  const nextAppt = useMemo(
    () => myAppts.filter((a) => a.day >= TODAY_ISO && a.status !== "cancelled")
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

  // Consents awaiting signature (excludes already-signed ones).
  const signedLabel = t("consent.signed");
  const signedSet = useMemo(
    () => new Set(myDocs.filter((d) => d.title.startsWith(signedLabel)).map((d) => d.title.replace(`${signedLabel} — `, ""))),
    [myDocs, signedLabel]
  );
  const toSign = myDocs.filter(
    (d) => d.category === "doc" && /consentement/i.test(d.title) && !d.title.startsWith(signedLabel) && !signedSet.has(d.title)
  );

  const isToday = nextAppt?.day === TODAY_ISO;
  const consolidatedBalance = familyIds.reduce((s, id) => s + (patientById(id)?.balance ?? 0), 0);

  // Backlog features
  const precaution = precautionFromAlerts(me.alerts);
  const showPostop = myRecalls.some((r) => isSurgical(r.reason)) || pastVisits.some((v) => isSurgical(v.act));
  const careActs = Array.from(new Set([...(acceptedPlan?.lines.map((l) => l.act) ?? []), ...(nextAppt ? [nextAppt.act] : [])]));
  const mreItems = [
    ...myRecalls.filter(() => me.recallOptIn !== false).map((r) => ({ key: `r-${r.reason}`, label: r.reason, sub: r.due })),
    ...(acceptedPlan?.lines ?? []).map((l, i) => ({ key: `l-${i}`, label: l.act, sub: l.tooth !== "—" ? `Dent ${l.tooth}` : "" })),
  ];
  const amoRemb = acceptedPlan ? acceptedPlan.lines.reduce((s, l) => s + Math.round(l.price * indicativeRate(l.act, regime)), 0) : 0;
  const amoReste = total - amoRemb;

  // Per-member household summary
  const household = familyIds.map((id) => {
    const m = patientById(id)!;
    const na = appointments.filter((a) => a.patientId === id && a.day >= TODAY_ISO && a.status !== "cancelled")
      .sort((a, b) => a.day.localeCompare(b.day) || a.time.localeCompare(b.time))[0];
    const rc = recalls.filter((r) => r.patientId === id && m.recallOptIn !== false).length;
    return { m, na, rc };
  });

  const setMyLang = (l: Lang) => { setPatientLanguage(me.id, l); setLang(l); ui.toast(t("portal.language.saved")); };
  const downloadReceipt = (p: Payment) => { const { blob, filename } = generateReceiptPDF(p, me); download(blob, filename); ui.toast(t("portal.receipt.done")); };
  const viewDevis = (plan: TreatmentPlan) => { const { blob, filename } = generateDevisPDF(plan, me); download(blob, filename); };
  const acceptPlan = async (plan: TreatmentPlan) => {
    await setPlanStatus(plan.id, "accepted");
    const { dataUrl } = generateDevisPDF(plan, me);
    await addDocument({ patientId: me.id, patient: me.name, title: t("consent.title"), category: "doc", files: [{ name: `consentement-${plan.id}.pdf`, kind: "pdf", dataUrl }] });
    ui.toast(t("plan.accepted.done"));
  };
  const waClinic = (tmplKey: string, extra: Record<string, string> = {}) => {
    window.open(waLink(CLINIC_WHATSAPP, fill(t(tmplKey), { name: firstName, ...extra })), "_blank", "noopener,noreferrer");
  };
  const exportDossier = () => {
    const { blob, filename } = generateDossierPDF(me, acceptedPlan, myPays, myDocs);
    download(blob, filename);
    ui.toast(t("portal.export.done"));
  };
  const addToCalendar = () => {
    if (!nextAppt) return;
    const ics = buildICS({
      uid: `${nextAppt.id}@dentalos`, title: `${nextAppt.act} — ${nextAppt.practitioner}`,
      day: nextAppt.day, time: nextAppt.time, durationMin: nextAppt.duration,
      location: `Cabinet Dentaire, ${me.city}`, description: `Rendez-vous ${me.name}`,
    });
    download(new Blob([ics], { type: "text/calendar" }), "rendez-vous.ics");
    ui.toast(t("portal.addcal.done"));
  };
  const genFeuille = async () => {
    if (!acceptedPlan) return;
    const { blob, filename, dataUrl } = generateFeuilleSoinsPDF(me, acceptedPlan, regime);
    download(blob, filename);
    await addDocument({ patientId: me.id, patient: me.name, title: `Feuille de soins (${regime})`, category: "doc", files: [{ name: filename, kind: "pdf", dataUrl }] });
    ui.toast(t("portal.amo.done"));
  };
  const genInstructions = (act: string) => {
    const info = instructionsFor(act);
    const { blob, filename } = generateInstructionsPDF(me, { act, before: info.before, after: info.after, precaution });
    download(blob, filename);
    ui.toast(t("portal.instructions.done"));
  };

  const TABS: { key: Tab; label: string; icon: typeof Home }[] = [
    { key: "home", label: t("portal.tab.home"), icon: Home },
    { key: "care", label: t("portal.tab.care"), icon: HeartPulse },
    { key: "file", label: t("portal.tab.file"), icon: FolderClosed },
  ];

  return (
    <>
      <PageHeader
        title={isGuardian ? `${t("portal.welcome")}, ${firstName} ✨` : `${t("portal.viewing")} ${me.name}`}
        subtitle={lang === "ar" ? "كل ما يخص علاجك في مكان واحد." : "Tout votre suivi de soins, au même endroit."}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl border border-black/5 bg-white p-1 shadow-sm">
              <Globe className="ms-1.5 h-3.5 w-3.5 text-ink-800/40" />
              {(["fr", "ar"] as Lang[]).map((l) => (
                <button key={l} onClick={() => setMyLang(l)}
                  className={"rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors " + ((me.languagePreference ?? lang) === l ? "bg-ink-900 text-white" : "text-ink-800/60 hover:text-ink-900")}>
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

      {/* family member switcher */}
      {familyIds.length > 1 && (
        <div className="rise mb-4 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-800/40">
            <Users className="h-3.5 w-3.5" /> {t("portal.family")}
          </span>
          {familyIds.map((id) => {
            const m = patientById(id)!;
            const active = id === activeId;
            return (
              <button key={id} onClick={() => setActiveId(id)}
                className={"flex items-center gap-2 rounded-full border py-1 pe-3 ps-1 text-sm font-medium transition-all " + (active ? "border-teal-400 bg-teal-50 text-teal-700 shadow-sm" : "border-black/5 bg-white text-ink-800/60 hover:border-teal-200")}>
                <Avatar name={m.name} size={26} />
                {id === GUARDIAN_ID ? t("portal.member.you") : m.name.split(" ")[0]}
              </button>
            );
          })}
        </div>
      )}

      {/* tab bar */}
      <div className="rise mb-5 flex gap-1 rounded-xl border border-black/5 bg-white p-1" style={{ width: "fit-content" }}>
        {TABS.map((tb) => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            className={"flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors " + (tab === tb.key ? "bg-ink-900 text-white" : "text-ink-800/60 hover:text-ink-900")}>
            <tb.icon className="h-4 w-4" /> {tb.label}
          </button>
        ))}
      </div>

      {/* ============================= HOME ============================= */}
      {tab === "home" && (
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-5">
            {cancelledAppt && (
              <div className="rise flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-100 text-amber-600"><CalendarX className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-ink-900">{t("portal.missed")}</div>
                  <div className="text-xs text-ink-800/55">{cancelledAppt.act} · {t("portal.missed.sub")}</div>
                </div>
                <Button variant="dark" onClick={() => ui.openPatientBooking(me.id, { act: cancelledAppt.act })}>{t("portal.missed.cta")}</Button>
              </div>
            )}

            <div className="rise relative overflow-hidden rounded-2xl bg-ink-950 p-6 text-white shadow-float">
              <div className="pointer-events-none absolute inset-0 bg-aurora opacity-40" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-teal-200"><CalendarClock className="h-4 w-4" /> {t("portal.next")}</div>
                  {nextAppt && <Pill tone={nextAppt.status}>{t(`status.${nextAppt.status}`)}</Pill>}
                </div>
                {nextAppt ? (
                  <>
                    {isToday && <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-teal-400/20 px-2.5 py-1 text-xs font-semibold text-teal-200"><Sparkles className="h-3 w-3" /> {t("portal.todaybadge")}</span>}
                    <div className="mt-2 font-display text-3xl font-bold capitalize">{isoToLabel(nextAppt.day)} · {nextAppt.time}</div>
                    <div className="mt-1 text-white/70">{nextAppt.act} · {nextAppt.practitioner}</div>
                    <div className="mt-2 flex items-center gap-4 text-sm text-white/50">
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {nextAppt.duration} min</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Cabinet, {me.city}</span>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {isToday ? (
                        <Button variant="primary" onClick={() => markArrived(nextAppt.id)} disabled={nextAppt.status === "arrived"}>
                          <MapPinCheck className="h-4 w-4" /> {nextAppt.status === "arrived" ? t("portal.checkedin") : t("portal.checkin")}
                        </Button>
                      ) : (
                        <Button variant="primary" onClick={() => confirmAppointmentByPatient(nextAppt.id)} disabled={nextAppt.patientConfirmed}>
                          <Check className="h-4 w-4" /> {nextAppt.patientConfirmed ? t("portal.confirmed") : t("portal.confirm")}
                        </Button>
                      )}
                      <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:border-teal-300 hover:text-teal-200" onClick={() => ui.openReschedule(nextAppt)}>
                        <RefreshCw className="h-4 w-4" /> {t("portal.reschedule")}
                      </Button>
                      <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:border-teal-300 hover:text-teal-200" onClick={addToCalendar}>
                        <CalendarPlus2 className="h-4 w-4" /> {t("portal.addcal")}
                      </Button>
                    </div>
                    {nextAppt.status === "pending" && <div className="mt-3 text-xs text-amber-200/80">{t("portal.awaiting")}</div>}
                  </>
                ) : (
                  <div className="mt-4 flex flex-col items-start gap-2 py-4">
                    <CalendarX className="h-8 w-8 text-white/30" />
                    <div className="font-display text-lg font-bold">{t("portal.noappt")}</div>
                    <div className="text-sm text-white/50">{t("portal.noappt.sub")}</div>
                    <Button variant="primary" className="mt-1" onClick={() => ui.openPatientBooking(me.id)}><CalendarPlus className="h-4 w-4" /> {t("portal.book")}</Button>
                  </div>
                )}
              </div>
            </div>

            {total > 0 && (
              <SectionCard title={t("portal.plan.accepted")} delay={0.06}>
                <div className="rounded-xl bg-sand-50 p-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div><div className="text-[11px] uppercase tracking-wide text-ink-800/45">{t("portal.total")}</div><div className="mt-0.5 font-display text-base font-bold text-ink-900">{mad(total)}</div></div>
                    <div><div className="text-[11px] uppercase tracking-wide text-ink-800/45">{t("portal.paid")}</div><div className="mt-0.5 font-display text-base font-bold text-teal-600">{mad(paidSoFar)}</div></div>
                    <div><div className="text-[11px] uppercase tracking-wide text-ink-800/45">{t("portal.remaining")}</div><div className="mt-0.5 font-display text-base font-bold text-amber-600">{mad(remaining)}</div></div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/5"><div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600 transition-all duration-500" style={{ width: `${pct}%` }} /></div>
                  {remaining === 0 && <div className="mt-2 flex items-center gap-1 text-xs font-medium text-teal-600"><Check className="h-3.5 w-3.5" /> {t("portal.uptodate")}</div>}
                </div>
              </SectionCard>
            )}
          </div>

          <div className="space-y-5">
            {/* household */}
            {familyIds.length > 1 && (
              <SectionCard title={t("portal.household")} delay={0.07}>
                <ul className="space-y-2">
                  {household.map(({ m, na, rc }) => (
                    <li key={m.id}>
                      <button onClick={() => setActiveId(m.id)} className="flex w-full items-center gap-3 rounded-xl border border-black/5 bg-white p-2.5 text-start transition-colors hover:bg-sand-50">
                        <Avatar name={m.name} size={36} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-ink-900">{m.id === GUARDIAN_ID ? `${m.name.split(" ")[0]} · ${t("portal.member.you")}` : m.name}</div>
                          <div className="truncate text-xs text-ink-800/50">
                            {na ? `${t("portal.household.nextrdv")}: ${isoToLabel(na.day)}` : t("portal.household.noappt")}
                            {rc > 0 ? ` · ${rc} ${t("portal.household.recallsdue")}` : ""}
                          </div>
                        </div>
                        {m.balance > 0 && <Pill tone={m.status}>{mad(m.balance)}</Pill>}
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex items-center justify-between border-t border-black/5 pt-3">
                  <span className="text-sm text-ink-800/60">{t("portal.household.balance")}</span>
                  <span className="font-display text-lg font-bold text-ink-900">{mad(consolidatedBalance)} {t("common.mad")}</span>
                </div>
              </SectionCard>
            )}

            <SectionCard title={t("portal.recalls")} delay={0.1}>
              {myRecalls.length ? (
                <ul className="space-y-2">
                  {myRecalls.map((r) => (
                    <li key={r.patientId + r.reason} className="flex items-center gap-3 rounded-xl border border-black/5 bg-sand-50 p-2.5">
                      <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal-50 text-teal-600"><BellRing className="h-4 w-4" /></span>
                      <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium text-ink-900">{r.reason}</div><div className="truncate text-xs text-ink-800/50">{r.due}</div></div>
                      <button onClick={() => ui.openPatientBooking(me.id, { act: r.reason })} className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-teal-700 ring-1 ring-teal-200 hover:bg-teal-500 hover:text-white">{t("portal.recall.book")}</button>
                    </li>
                  ))}
                </ul>
              ) : <div className="grid place-items-center rounded-xl border border-dashed border-black/10 py-6 text-sm text-ink-800/40">{t("portal.recalls.empty")}</div>}
            </SectionCard>

            {showPostop && (
              <SectionCard title={t("portal.postop")} delay={0.12}>
                <div className="flex items-start gap-3 rounded-xl bg-teal-50 p-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-teal-100 text-teal-600"><Stethoscope className="h-4 w-4" /></span>
                  <p className="text-sm text-ink-800/70">{t("portal.postop.body")}</p>
                </div>
                {precaution && (
                  <div className="mt-2 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {precaution}
                  </div>
                )}
                <button onClick={() => waClinic("portal.postop.tmpl")} className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-rose-600 ring-1 ring-rose-200 hover:bg-rose-500 hover:text-white">
                  <MessageCircle className="h-4 w-4" /> {t("portal.postop.escalate")}
                </button>
              </SectionCard>
            )}
          </div>
        </div>
      )}

      {/* ============================= CARE ============================= */}
      {tab === "care" && (
        <div className="grid gap-5 lg:grid-cols-2">
          {proposedPlans.map((plan, idx) => {
            const tot = plan.lines.reduce((s, l) => s + l.price, 0);
            return (
              <SectionCard key={plan.id} title={t("portal.proposed")} delay={idx * 0.05}>
                <ul className="divide-y divide-black/5">
                  {plan.lines.map((l, i) => (
                    <li key={i} className="flex items-center justify-between py-2.5 text-sm">
                      <span className="flex items-center gap-2">{l.tooth !== "—" && <span className="grid h-6 w-6 place-items-center rounded-md bg-teal-50 text-[10px] font-bold text-teal-700">{l.tooth}</span>}<span className="text-ink-800/80">{l.act}</span></span>
                      <span className="font-semibold text-ink-900">{mad(l.price)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex items-center justify-between border-t border-black/5 pt-3"><span className="text-sm font-semibold text-ink-900">{t("treat.total")}</span><span className="font-display text-lg font-bold text-teal-600">{mad(tot)} {t("common.mad")}</span></div>
                <p className="mt-3 text-xs text-ink-800/50">{t("plan.consent")}</p>
                <div className="mt-3 flex gap-2">
                  <Button variant="primary" className="flex-1" onClick={() => acceptPlan(plan)}><Check className="h-4 w-4" /> {t("plan.accept")}</Button>
                  <Button variant="outline" onClick={() => viewDevis(plan)}><FileText className="h-4 w-4" /> {t("plan.viewpdf")}</Button>
                </div>
              </SectionCard>
            );
          })}

          {acceptedPlan && (
            <SectionCard title={t("portal.continue")} delay={0.06}>
              <p className="-mt-2 mb-3 text-xs text-ink-800/50">{t("portal.continue.sub")}</p>
              <ul className="space-y-2">
                {acceptedPlan.lines.map((l, i) => (
                  <li key={i} className="flex items-center gap-3 rounded-xl border border-black/5 bg-white p-3">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-50 text-xs font-bold text-teal-700">{i + 1}</span>
                    <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium text-ink-900">{l.act}</div>{l.tooth !== "—" && <div className="text-xs text-ink-800/45">Dent {l.tooth}</div>}</div>
                    <button onClick={() => ui.openPatientBooking(me.id, { act: l.act })} className="inline-flex items-center gap-1 rounded-lg bg-sand-50 px-2.5 py-1.5 text-xs font-semibold text-ink-800/70 hover:bg-teal-500 hover:text-white"><CalendarPlus className="h-3.5 w-3.5" /> {t("portal.step.book")}</button>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          <SectionCard title={t("portal.recalls")} delay={0.1}>
            <label className="mb-3 flex items-center justify-between gap-3 rounded-xl bg-sand-50 p-3">
              <span className="flex items-center gap-2">
                {me.recallOptIn === false ? <BellOff className="h-4 w-4 text-ink-800/40" /> : <BellRing className="h-4 w-4 text-teal-600" />}
                <span className="text-sm"><span className="block font-medium text-ink-900">{t("portal.recallopt")}</span><span className="block text-xs text-ink-800/50">{t("portal.recallopt.hint")}</span></span>
              </span>
              <button role="switch" aria-checked={me.recallOptIn !== false} onClick={() => setRecallOptIn(me.id, me.recallOptIn === false)}
                className={"relative h-6 w-11 shrink-0 rounded-full transition-colors " + (me.recallOptIn !== false ? "bg-teal-500" : "bg-ink-900/15")}>
                <span className={"absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all " + (me.recallOptIn !== false ? "start-[22px]" : "start-0.5")} />
              </button>
            </label>
            {myRecalls.length && me.recallOptIn !== false ? (
              <ul className="space-y-2">
                {myRecalls.map((r) => (
                  <li key={r.patientId + r.reason} className="flex items-center gap-3 rounded-xl border border-black/5 bg-white p-3">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal-50 text-teal-600"><BellRing className="h-4 w-4" /></span>
                    <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium text-ink-900">{r.reason}</div><div className="truncate text-xs text-ink-800/50">{r.due}</div></div>
                    <button onClick={() => ui.openPatientBooking(me.id, { act: r.reason })} className="inline-flex items-center gap-1 rounded-lg bg-sand-50 px-2.5 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-500 hover:text-white">{t("portal.recall.book")}</button>
                  </li>
                ))}
              </ul>
            ) : <div className="grid place-items-center rounded-xl border border-dashed border-black/10 py-6 text-sm text-ink-800/40">{t("portal.recalls.empty")}</div>}
          </SectionCard>

          <SectionCard title={t("portal.medical")} delay={0.14}>
            {me.alerts.length ? (
              <div className="flex flex-wrap gap-2">{me.alerts.map((a) => <span key={a} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-800 ring-1 ring-amber-200"><ShieldAlert className="h-3.5 w-3.5" /> {a}</span>)}</div>
            ) : <div className="rounded-xl border border-dashed border-black/10 py-5 text-center text-sm text-ink-800/40">{t("portal.medical.none")}</div>}
            <p className="mt-3 text-xs text-ink-800/45">{t("portal.medical.hint")}</p>
            <button onClick={() => waClinic("portal.medupdate.tmpl")} className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-teal-700 ring-1 ring-teal-200 hover:bg-teal-500 hover:text-white"><MessageCircle className="h-4 w-4" /> {t("portal.medical.propose")}</button>
          </SectionCard>

          {/* feuille de soins / AMO */}
          {acceptedPlan && (
            <SectionCard title={t("portal.amo")} delay={0.16}>
              <p className="-mt-2 mb-3 text-xs text-ink-800/50">{t("portal.amo.sub")}</p>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ink-800/55">{t("portal.amo.regime")}</span>
                <select value={regime} onChange={(e) => setRegime(e.target.value as Regime)} className="w-full appearance-none rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-400">
                  {AMO_REGIMES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </label>
              <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-xl bg-teal-50 p-3"><div className="text-[11px] uppercase tracking-wide text-teal-700/70">{t("portal.amo.remb")}</div><div className="mt-0.5 font-display text-lg font-bold text-teal-600">{mad(amoRemb)}</div></div>
                <div className="rounded-xl bg-sand-50 p-3"><div className="text-[11px] uppercase tracking-wide text-ink-800/45">{t("portal.amo.reste")}</div><div className="mt-0.5 font-display text-lg font-bold text-ink-900">{mad(amoReste)}</div></div>
              </div>
              <p className="mt-2 text-[11px] text-ink-800/40">{t("portal.amo.disclaimer")}</p>
              <Button variant="primary" className="mt-3 w-full" onClick={genFeuille}><ShieldPlus className="h-4 w-4" /> {t("portal.amo.generate")}</Button>
            </SectionCard>
          )}

          {/* consignes pré/post-op */}
          {careActs.length > 0 && (
            <SectionCard title={t("portal.instructions")} delay={0.2}>
              <p className="-mt-2 mb-3 text-xs text-ink-800/50">{t("portal.instructions.sub")}</p>
              <ul className="space-y-2">
                {careActs.map((act) => (
                  <li key={act} className="flex items-center gap-3 rounded-xl border border-black/5 bg-white p-3">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal-50 text-teal-600"><ClipboardList className="h-4 w-4" /></span>
                    <div className="min-w-0 flex-1 truncate text-sm font-medium text-ink-900">{act}</div>
                    <button onClick={() => genInstructions(act)} className="inline-flex items-center gap-1 rounded-lg bg-sand-50 px-2.5 py-1.5 text-xs font-semibold text-ink-800/70 hover:bg-teal-500 hover:text-white"><Download className="h-3.5 w-3.5" /> {t("portal.instructions.get")}</button>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          {/* séjour / MRE */}
          <SectionCard title={t("portal.mre")} delay={0.24}>
            <p className="-mt-2 mb-3 text-xs text-ink-800/50">{t("portal.mre.sub")}</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="mb-1 block text-xs font-medium text-ink-800/55">{t("portal.mre.from")}</span>
                <input type="date" value={stayFrom} onChange={(e) => setStayFrom(e.target.value)} className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-400" /></label>
              <label className="block"><span className="mb-1 block text-xs font-medium text-ink-800/55">{t("portal.mre.to")}</span>
                <input type="date" value={stayTo} onChange={(e) => setStayTo(e.target.value)} className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-400" /></label>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-800/40"><Plane className="h-3.5 w-3.5" /> {t("portal.mre.plan")}</div>
            {mreItems.length ? (
              <ul className="mt-2 space-y-2">
                {mreItems.map((it) => (
                  <li key={it.key} className="flex items-center gap-3 rounded-xl border border-black/5 bg-white p-3">
                    <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium text-ink-900">{it.label}</div>{it.sub && <div className="truncate text-xs text-ink-800/45">{it.sub}</div>}</div>
                    <button onClick={() => ui.openPatientBooking(me.id, { act: it.label, day: stayFrom })} className="inline-flex items-center gap-1 rounded-lg bg-sand-50 px-2.5 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-500 hover:text-white"><CalendarPlus className="h-3.5 w-3.5" /> {t("portal.mre.book")}</button>
                  </li>
                ))}
              </ul>
            ) : <div className="mt-2 grid place-items-center rounded-xl border border-dashed border-black/10 py-5 text-sm text-ink-800/40">{t("portal.mre.empty")}</div>}
          </SectionCard>
        </div>
      )}

      {/* ============================= FILE ============================= */}
      {tab === "file" && (
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-5">
            {/* documents to sign */}
            {toSign.length > 0 && (
              <SectionCard title={t("portal.tosign")} delay={0.03}>
                <ul className="space-y-2">
                  {toSign.map((d) => (
                    <li key={d.id} className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                      <span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-100 text-amber-600"><FileSignature className="h-4 w-4" /></span>
                      <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium text-ink-900">{d.title}</div><div className="truncate text-xs text-ink-800/50">{d.createdAt}</div></div>
                      <button onClick={() => ui.openSignature(me.id, { title: d.title, lines: acceptedPlan?.lines })} className="inline-flex items-center gap-1 rounded-lg bg-ink-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink-800"><PenLine className="h-3.5 w-3.5" /> {t("portal.sign.cta")}</button>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}

            {/* vault */}
            <SectionCard title={t("portal.vault")} delay={0.05}>
              {myDocs.length ? (
                <div className="space-y-4">
                  {(Object.keys(docsByCat) as DocCategory[]).filter((c) => docsByCat[c].length).map((c) => {
                    const Icon = CAT_ICON[c];
                    return (
                      <div key={c}>
                        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-800/40"><Icon className="h-3.5 w-3.5" /> {t(`cat.${c}`)}</div>
                        <ul className="space-y-2">
                          {docsByCat[c].flatMap((d) => d.files.map((f, i) => {
                            const isOrdo = /ordonnance/i.test(d.title);
                            return (
                              <li key={`${d.id}-${i}`} className="flex items-center gap-3 rounded-xl border border-black/5 bg-white p-3">
                                <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal-50 text-teal-600"><Icon className="h-4 w-4" /></span>
                                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-ink-900">{d.title}</span><span className="block truncate text-xs text-ink-800/45">{f.name} · {d.createdAt}</span></span>
                                {isOrdo && (
                                  <button onClick={() => waClinic("portal.renew.tmpl", { doc: d.title })} className="inline-flex items-center gap-1 rounded-lg bg-sand-50 px-2 py-1.5 text-xs font-semibold text-ink-800/70 hover:bg-teal-500 hover:text-white" title={t("portal.renew")}><RotateCw className="h-3.5 w-3.5" /></button>
                                )}
                                <button onClick={() => openFile(f)} disabled={!f.dataUrl} className="grid h-8 w-8 place-items-center rounded-lg text-ink-800/50 hover:bg-sand-50 hover:text-teal-600 disabled:opacity-30" title={t("common.view")}><Download className="h-4 w-4" /></button>
                              </li>
                            );
                          }))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              ) : <div className="grid place-items-center rounded-xl border border-dashed border-black/10 py-8 text-sm text-ink-800/40">{t("portal.vault.empty")}</div>}
              <button onClick={exportDossier} className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-semibold text-ink-800/70 transition-colors hover:border-teal-400 hover:text-teal-600">
                <FileDown className="h-4 w-4" /> {t("portal.export")}
              </button>
            </SectionCard>

            <SectionCard title={t("portal.history")} delay={0.09}>
              {pastVisits.length ? (
                <ol className="relative space-y-3 ps-4">
                  <span className="absolute inset-y-1 start-[5px] w-px bg-black/10" />
                  {pastVisits.map((v) => (
                    <li key={v.id} className="relative">
                      <span className="absolute -start-4 top-1.5 h-2.5 w-2.5 rounded-full bg-teal-500 ring-4 ring-white" />
                      <div className="rounded-xl border border-black/5 bg-white p-3"><div className="flex items-center gap-2 text-sm font-medium text-ink-900"><History className="h-3.5 w-3.5 text-ink-800/40" /> {v.act}</div><div className="mt-0.5 text-xs text-ink-800/50">{isoToLabel(v.day)} · {v.practitioner}</div></div>
                    </li>
                  ))}
                </ol>
              ) : <div className="grid place-items-center rounded-xl border border-dashed border-black/10 py-8 text-sm text-ink-800/40">{t("portal.history.empty")}</div>}
            </SectionCard>
          </div>

          <div className="space-y-5">
            <SectionCard title={t("portal.pay")} delay={0.06}>
              <ul className="space-y-2">
                {myPays.map((p) => (
                  <li key={p.id} className="flex items-center gap-2 rounded-xl border border-black/5 bg-white p-3">
                    <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium text-ink-900">{p.act}</div><div className="text-xs text-ink-800/50">{p.date} · {t(`pay.${p.method}`)}</div></div>
                    <span className="font-semibold text-teal-600">{mad(p.amount)}</span>
                    <button onClick={() => downloadReceipt(p)} className="inline-flex items-center gap-1 rounded-lg bg-sand-50 px-2 py-1.5 text-xs font-semibold text-ink-800/70 hover:bg-teal-500 hover:text-white" title={t("portal.receipt")}><Receipt className="h-3.5 w-3.5" /> {t("portal.receipt")}</button>
                  </li>
                ))}
                <li className="flex items-center justify-between px-1 pt-1"><span className="flex items-center gap-1.5 text-sm text-ink-800/60"><Wallet className="h-3.5 w-3.5" /> {t("col.balance")}</span><Pill tone={me.status}>{mad(me.balance)} {t("common.mad")}</Pill></li>
              </ul>
            </SectionCard>

            {isGuardian && (
              <div className="rise rounded-2xl border border-dashed border-teal-300/60 bg-teal-50/40 p-5" style={{ animationDelay: "0.1s" }}>
                <div className="flex items-center gap-2 text-sm font-semibold text-ink-900"><UserPlus className="h-4 w-4 text-teal-600" /> {t("portal.prereg")}</div>
                <p className="mt-1 text-xs text-ink-800/55">{t("portal.prereg.sub")}</p>
                <button onClick={() => ui.openPreRegister()} className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-teal-700 ring-1 ring-teal-200 hover:bg-teal-500 hover:text-white"><UserPlus className="h-4 w-4" /> {t("portal.prereg.cta")} <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" /></button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
