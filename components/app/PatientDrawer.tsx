"use client";

import { useEffect, useRef, useState } from "react";
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
  Images,
  Download,
  Trash2,
  ScanLine,
  ImageIcon,
  KeyRound,
} from "lucide-react";
import { useApp } from "@/lib/i18n";
import { Avatar, Pill, Button } from "@/components/ui/primitives";
import { cn, mad, waLink, suggestLogin, genPassword } from "@/lib/utils";
import { useData } from "@/components/app/DataProvider";
import { useUI } from "@/components/app/ModalProvider";
import { type Patient, type ClinicDocument, type DocFile } from "@/lib/data";

const TABS = [
  { key: "overview", labelKey: "detail.overview", icon: Activity },
  { key: "plan", labelKey: "detail.plan", icon: FileText },
  { key: "documents", labelKey: "detail.imaging", icon: Images },
  { key: "payments", labelKey: "detail.payments", icon: Wallet },
  { key: "family", labelKey: "detail.family", icon: Users },
];

const CAT_ICON = { xray: ScanLine, photo: ImageIcon, doc: FileText } as const;

function openFile(f: DocFile) {
  if (!f.dataUrl) return;
  const w = window.open();
  if (w) {
    if (f.kind === "image") {
      w.document.write(
        `<img src="${f.dataUrl}" style="max-width:100%;height:auto;display:block;margin:auto" />`
      );
    } else {
      w.location.href = f.dataUrl;
    }
  }
}

export default function PatientDrawer({
  patient,
  onClose,
}: {
  patient: Patient;
  onClose: () => void;
}) {
  const { t } = useApp();
  const { treatmentPlans, payments, documents, patientById, setPatientCredentials } = useData();
  const ui = useUI();
  const [tab, setTab] = useState("overview");

  const setAccess = (login: string) => setPatientCredentials(patient.id, { login, password: genPassword() });
  const shareCreds = () => {
    const text = t("cred.tmpl")
      .replace("{name}", patient.name.split(" ")[0])
      .replace("{clinic}", t("msg.clinic"))
      .replace("{login}", patient.portalLogin ?? "")
      .replace("{password}", patient.portalPassword ?? "");
    window.open(waLink(patient.phone, text), "_blank", "noopener,noreferrer");
  };

  // Measured sliding tab indicator.
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [ind, setInd] = useState({ left: 0, width: 0 });
  useEffect(() => {
    const el = tabRefs.current[tab];
    if (el) setInd({ left: el.offsetLeft, width: el.offsetWidth });
  }, [tab]);

  const plan = treatmentPlans.find((p) => p.patientId === patient.id);
  const pays = payments.filter((p) => p.patientId === patient.id);
  const docs = documents.filter((d) => d.patientId === patient.id);
  const family = patient.family.map((id) => patientById(id)).filter(Boolean) as Patient[];

  return (
    <div className="fixed inset-0 z-50">
      <div className="fade-in absolute inset-0 bg-ink-950/40 backdrop-blur-sm" onClick={onClose} />
      <aside className="drawer-in absolute inset-y-0 end-0 flex w-full max-w-md flex-col bg-sand-50 shadow-float">
        {/* header */}
        <div className="noise relative overflow-hidden bg-ink-950 p-5 text-white">
          <div className="pointer-events-none absolute inset-0 bg-aurora animate-aurora opacity-50" />
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-teal-500/25 blur-[80px]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background:radial-gradient(120%_80%_at_50%_-10%,white,transparent)]" />
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
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => ui.openDelete(patient)}
                  className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-white/80 hover:bg-rose-500/80 hover:text-white"
                  title={t("act.delete")}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 hover:bg-white/20">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {patient.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/80">
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="primary" className="flex-1" onClick={() => ui.openNewAppointment(patient.id)}>
                <CalendarPlus className="h-4 w-4" /> {t("detail.book")}
              </Button>
              <Button
                variant="outline"
                className="border-white/20 bg-white/5 text-white hover:border-teal-300 hover:text-teal-200"
                onClick={() => ui.openMessage(patient)}
              >
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

        {/* tabs — sliding indicator */}
        <div className="relative flex gap-1 overflow-x-auto border-b border-black/5 bg-white px-3">
          {TABS.map((tb) => (
            <button
              key={tb.key}
              ref={(el) => { tabRefs.current[tb.key] = el; }}
              onClick={() => setTab(tb.key)}
              className={cn(
                "relative flex shrink-0 items-center gap-1.5 px-3 py-3 text-sm font-medium transition-colors",
                tab === tb.key ? "text-teal-700" : "text-ink-800/50 hover:text-ink-900"
              )}
            >
              <tb.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{t(tb.labelKey)}</span>
            </button>
          ))}
          <span
            className="pointer-events-none absolute bottom-0 h-0.5 rounded-full bg-teal-500"
            style={{ left: ind.left, width: ind.width, transition: "left 0.3s cubic-bezier(0.16,1,0.3,1), width 0.3s cubic-bezier(0.16,1,0.3,1)" }}
          />
        </div>

        {/* content */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === "overview" && (
            <div className="space-y-3">
              <InfoRow icon={<Phone className="h-4 w-4" />} label={t("col.phone")} value={patient.phone} />
              <InfoRow icon={<MapPin className="h-4 w-4" />} label={t("field.city")} value={patient.city} />
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
                {patient.balance > 0 && (
                  <Button variant="outline" className="mt-3 w-full" onClick={() => ui.openPayment(patient.id)}>
                    <Wallet className="h-4 w-4" /> {t("pay.record")}
                  </Button>
                )}
              </div>

              {/* portal access */}
              <div className="rounded-xl border border-black/5 bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-ink-900">
                  <KeyRound className="h-4 w-4 text-teal-600" /> {t("cred.manage")}
                </div>
                {patient.portalLogin ? (
                  <>
                    <div className="mt-3 space-y-2 rounded-lg bg-sand-50 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-ink-800/50">{t("cred.login")}</span>
                        <span className="rounded-md bg-white px-2 py-1 text-sm font-semibold text-ink-900 ring-1 ring-black/5">{patient.portalLogin}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-ink-800/50">{t("cred.password")}</span>
                        <span className="rounded-md bg-white px-2 py-1 font-mono text-sm font-semibold tracking-wide text-ink-900 ring-1 ring-black/5">{patient.portalPassword}</span>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button variant="primary" className="flex-1" onClick={shareCreds}><MessageSquare className="h-4 w-4" /> {t("cred.share")}</Button>
                      <Button variant="outline" onClick={() => setAccess(patient.portalLogin!)} title={t("cred.regen")}><KeyRound className="h-4 w-4" /></Button>
                    </div>
                  </>
                ) : (
                  <div className="mt-2">
                    <p className="text-xs text-ink-800/50">{t("cred.none")}</p>
                    <Button variant="outline" className="mt-2 w-full" onClick={() => setAccess(suggestLogin(patient.name, patient.phone))}>
                      <KeyRound className="h-4 w-4" /> {t("cred.create")}
                    </Button>
                  </div>
                )}
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
                <Button variant="outline" className="mt-4 w-full" onClick={() => ui.sendDevis(plan, patient)}>
                  <FileText className="h-4 w-4" /> {t("plan.preparepdf")}
                </Button>
              </div>
            ) : (
              <EmptyCta label={t("doc.empty")} onClick={() => ui.openNewPlan(patient.id)} cta={t("new.plan")} />
            ))}

          {tab === "documents" &&
            (docs.length ? (
              <div className="space-y-3">
                {docs.map((d) => (
                  <DocCard key={d.id} doc={d} />
                ))}
                <Button variant="outline" className="w-full" onClick={() => ui.openNewDocument({ patientId: patient.id })}>
                  <Images className="h-4 w-4" /> {t("imaging.upload")}
                </Button>
              </div>
            ) : (
              <EmptyCta label={t("doc.empty")} onClick={() => ui.openNewDocument({ patientId: patient.id })} cta={t("imaging.upload")} />
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

function DocCard({ doc }: { doc: ClinicDocument }) {
  const { t } = useApp();
  const Icon = CAT_ICON[doc.category];
  return (
    <div className="rounded-xl border border-black/5 bg-white p-3">
      <div className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal-50 text-teal-600">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-ink-900">{doc.title}</div>
          <div className="truncate text-xs text-ink-800/50">{t(`cat.${doc.category}`)} · {doc.createdAt}</div>
        </div>
      </div>
      <ul className="mt-2 space-y-1">
        {doc.files.map((f, i) => (
          <li key={i} className="flex items-center gap-2 rounded-lg bg-sand-50 px-2.5 py-1.5 text-xs">
            <FileText className="h-3.5 w-3.5 text-ink-800/40" />
            <span className="flex-1 truncate text-ink-800/70">{f.name}</span>
            {f.dataUrl && (
              <button onClick={() => openFile(f)} className="grid h-6 w-6 place-items-center rounded text-ink-800/50 hover:text-teal-600" title={t("common.view")}>
                <Download className="h-3.5 w-3.5" />
              </button>
            )}
          </li>
        ))}
      </ul>
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

function EmptyCta({ label, onClick, cta }: { label: string; onClick: () => void; cta: string }) {
  return (
    <div className="grid place-items-center gap-3 rounded-xl border border-dashed border-black/10 py-10 text-center">
      <span className="text-sm text-ink-800/40">{label}</span>
      <Button variant="outline" onClick={onClick}>{cta}</Button>
    </div>
  );
}
