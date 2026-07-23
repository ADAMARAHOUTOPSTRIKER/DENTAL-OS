"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  UserPlus,
  CalendarPlus,
  FileText,
  Images,
  Wallet,
  MessageSquare,
  Trash2,
  Plus,
  Check,
  Upload,
  X as XIcon,
  AlertTriangle,
} from "lucide-react";
import { useApp } from "@/lib/i18n";
import { useData } from "@/components/app/DataProvider";
import { Button, Avatar } from "@/components/ui/primitives";
import { Modal, Field, Input, Select, Textarea } from "@/components/app/modals/ui";
import { toDocFile } from "@/lib/files";
import { generateDevisPDF } from "@/lib/pdf";
import { cn, mad, waLink, isoToShort, isoToLabel } from "@/lib/utils";
import {
  PRACTITIONERS,
  TODAY_ISO,
  type Patient,
  type Appointment,
  type PlanLine,
  type TreatmentPlan,
  type DocCategory,
  type Payment,
} from "@/lib/data";

/* ------------------------------------------------------------------ */
/* Context                                                             */
/* ------------------------------------------------------------------ */

type Tone = "success" | "info";
interface UICtx {
  toast: (text: string, tone?: Tone) => void;
  openNewPatient: () => void;
  openPreRegister: () => void;
  openReschedule: (appointment: Appointment) => void;
  openNewAppointment: (patientId?: string) => void;
  openNewPlan: (patientId?: string) => void;
  openNewDocument: (prefill?: { patientId?: string; docId?: string }) => void;
  openPayment: (patientId?: string) => void;
  openMessage: (
    patient: Patient,
    opts?: { reminder?: boolean; recallReason?: string; onSent?: () => void }
  ) => void;
  openDelete: (patient: Patient) => void;
  sendDevis: (plan: TreatmentPlan, patient?: Patient) => Promise<void>;
}

const Ctx = createContext<UICtx | null>(null);
export function useUI() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useUI must be used within ModalProvider");
  return c;
}

type Modal =
  | { kind: "patient"; intake?: boolean }
  | { kind: "reschedule"; appointment: Appointment }
  | { kind: "appointment"; patientId?: string }
  | { kind: "plan"; patientId?: string }
  | { kind: "document"; patientId?: string; docId?: string }
  | { kind: "payment"; patientId?: string }
  | {
      kind: "message";
      patient: Patient;
      reminder?: boolean;
      recallReason?: string;
      onSent?: () => void;
    }
  | { kind: "delete"; patient: Patient }
  | null;

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

/* ------------------------------------------------------------------ */
/* Provider                                                            */
/* ------------------------------------------------------------------ */

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const { t } = useApp();
  const data = useData();
  const [modal, setModal] = useState<Modal>(null);
  const [toasts, setToasts] = useState<{ id: number; text: string; tone: Tone }[]>([]);
  const idRef = useRef(0);

  const toast = useCallback((text: string, tone: Tone = "success") => {
    const id = ++idRef.current;
    setToasts((ts) => [...ts, { id, text, tone }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 3400);
  }, []);

  const sendDevis = useCallback(
    async (plan: TreatmentPlan, patient?: Patient) => {
      const who = patient ?? data.patientById(plan.patientId);
      const { blob, dataUrl, filename } = generateDevisPDF(plan, who);
      download(blob, filename);
      await data.addDocument({
        patientId: plan.patientId,
        patient: plan.patient,
        title: `Devis — ${plan.createdAt}`,
        category: "doc",
        files: [{ name: filename, kind: "pdf", dataUrl }],
      });
      toast(t("plan.sent"));
    },
    [data, t, toast]
  );

  const api = useMemo<UICtx>(
    () => ({
      toast,
      openNewPatient: () => setModal({ kind: "patient" }),
      openPreRegister: () => setModal({ kind: "patient", intake: true }),
      openReschedule: (appointment) => setModal({ kind: "reschedule", appointment }),
      openNewAppointment: (patientId) => setModal({ kind: "appointment", patientId }),
      openNewPlan: (patientId) => setModal({ kind: "plan", patientId }),
      openNewDocument: (prefill) => setModal({ kind: "document", ...prefill }),
      openPayment: (patientId) => setModal({ kind: "payment", patientId }),
      openMessage: (patient, opts) =>
        setModal({
          kind: "message",
          patient,
          reminder: opts?.reminder,
          recallReason: opts?.recallReason,
          onSent: opts?.onSent,
        }),
      openDelete: (patient) => setModal({ kind: "delete", patient }),
      sendDevis,
    }),
    [toast, sendDevis]
  );

  const close = () => setModal(null);

  return (
    <Ctx.Provider value={api}>
      {children}

      {modal?.kind === "patient" && (
        <PatientModal onClose={close} toast={toast} intake={modal.intake} />
      )}
      {modal?.kind === "reschedule" && (
        <RescheduleModal onClose={close} toast={toast} appointment={modal.appointment} />
      )}
      {modal?.kind === "appointment" && (
        <AppointmentModal onClose={close} toast={toast} prefill={modal.patientId} />
      )}
      {modal?.kind === "plan" && (
        <PlanModal onClose={close} toast={toast} prefill={modal.patientId} sendDevis={sendDevis} />
      )}
      {modal?.kind === "document" && (
        <DocumentModal onClose={close} toast={toast} prefill={modal} />
      )}
      {modal?.kind === "payment" && (
        <PaymentModal onClose={close} toast={toast} prefill={modal.patientId} />
      )}
      {modal?.kind === "message" && (
        <MessageModal
          onClose={close}
          toast={toast}
          patient={modal.patient}
          reminder={modal.reminder}
          recallReason={modal.recallReason}
          onSent={modal.onSent}
        />
      )}
      {modal?.kind === "delete" && <DeleteModal onClose={close} toast={toast} patient={modal.patient} />}

      {/* Toasts */}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex flex-col items-center gap-2 px-4">
        {toasts.map((tt) => (
          <div
            key={tt.id}
            className="toast-in pointer-events-auto flex items-center gap-2.5 rounded-xl bg-ink-950 px-4 py-3 text-sm font-medium text-white shadow-float"
          >
            <span className="grid h-5 w-5 place-items-center rounded-full bg-teal-500">
              <Check className="h-3.5 w-3.5" />
            </span>
            {tt.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

interface Common {
  onClose: () => void;
  toast: (text: string, tone?: Tone) => void;
}

function parseList(s: string) {
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function PatientPicker({
  value,
  onChange,
  patients,
  placeholder,
}: {
  value: string;
  onChange: (id: string) => void;
  patients: Patient[];
  placeholder: string;
}) {
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {patients.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
          {p.balance > 0 ? ` · ${mad(p.balance)} MAD` : ""}
        </option>
      ))}
    </Select>
  );
}

/* Toggle between existing / new patient — used by appointment & plan modals. */
function usePatientTarget(prefill?: string) {
  const [mode, setMode] = useState<"existing" | "new">(prefill ? "existing" : "existing");
  const [patientId, setPatientId] = useState(prefill ?? "");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  return { mode, setMode, patientId, setPatientId, name, setName, phone, setPhone };
}

function PatientTargetFields({
  target,
  patients,
  t,
}: {
  target: ReturnType<typeof usePatientTarget>;
  patients: Patient[];
  t: (k: string) => string;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => target.setMode("existing")}
          className={cn(
            "rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
            target.mode === "existing"
              ? "border-teal-400 bg-teal-50 text-teal-700"
              : "border-black/10 text-ink-800/60 hover:border-teal-200"
          )}
        >
          {t("appt.existing")}
        </button>
        <button
          type="button"
          onClick={() => target.setMode("new")}
          className={cn(
            "rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
            target.mode === "new"
              ? "border-teal-400 bg-teal-50 text-teal-700"
              : "border-black/10 text-ink-800/60 hover:border-teal-200"
          )}
        >
          + {t("appt.newpatient")}
        </button>
      </div>
      {target.mode === "existing" ? (
        <Field label={t("appt.existing")} required>
          <PatientPicker
            value={target.patientId}
            onChange={target.setPatientId}
            patients={patients}
            placeholder={t("pay.selectpatient")}
          />
        </Field>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("field.name")} required>
            <Input value={target.name} onChange={(e) => target.setName(e.target.value)} placeholder="Nom Prénom" />
          </Field>
          <Field label={t("field.phone")} hint={t("field.phone.hint")}>
            <Input value={target.phone} onChange={(e) => target.setPhone(e.target.value)} placeholder="+212 6…" inputMode="tel" />
          </Field>
        </div>
      )}
    </div>
  );
}

// Resolve the patient target into {patientId, patient}, creating an account if needed.
async function resolveTarget(
  target: ReturnType<typeof usePatientTarget>,
  addPatient: ReturnType<typeof useData>["addPatient"]
): Promise<{ patientId: string; patient: string } | null> {
  if (target.mode === "existing") {
    if (!target.patientId) return null;
    return { patientId: target.patientId, patient: "" }; // patient name filled by caller
  }
  if (!target.name.trim()) return null;
  const p = await addPatient({ name: target.name, phone: target.phone });
  return { patientId: p.id, patient: p.name };
}

/* ------------------------------------------------------------------ */
/* New patient                                                         */
/* ------------------------------------------------------------------ */

function PatientModal({ onClose, toast, intake = false }: Common & { intake?: boolean }) {
  const { t } = useApp();
  const { addPatient } = useData();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"M" | "F">("F");
  const [city, setCity] = useState("Casablanca");
  const [tags, setTags] = useState("");
  const [alerts, setAlerts] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    await addPatient({
      name,
      phone,
      age: age ? Number(age) : 0,
      gender,
      city,
      tags: parseList(tags),
      alerts: parseList(alerts),
      intakeStatus: intake ? "draft" : null,
    });
    toast(intake ? t("prereg.done") : `${name} — ${t("new.patient").toLowerCase()} ✓`);
    onClose();
  };

  return (
    <Modal
      title={intake ? t("prereg.title") : t("new.patient")}
      subtitle={intake ? t("prereg.sub") : t("role.dentist.desc")}
      icon={<UserPlus className="h-5 w-5" />}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>{t("common.cancel")}</Button>
          <Button variant="primary" onClick={submit} disabled={!name.trim() || busy}>
            <Check className="h-4 w-4" /> {intake ? t("prereg.submit") : t("common.create")}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label={t("field.name")} required>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom Prénom" autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("field.phone")} hint={t("field.phone.hint")}>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+212 6…" inputMode="tel" />
          </Field>
          <Field label={t("field.city")}>
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("field.age")}>
            <Input value={age} onChange={(e) => setAge(e.target.value)} inputMode="numeric" placeholder="0" />
          </Field>
          <Field label={t("field.gender")}>
            <Select value={gender} onChange={(e) => setGender(e.target.value as "M" | "F")}>
              <option value="F">{t("field.female")}</option>
              <option value="M">{t("field.male")}</option>
            </Select>
          </Field>
        </div>
        <Field label={t("field.tags")} hint={t("field.commalist")}>
          <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Ortho, Fidèle" />
        </Field>
        <Field label={t("field.alerts")} hint={t("field.commalist")}>
          <Input value={alerts} onChange={(e) => setAlerts(e.target.value)} placeholder="Allergie pénicilline" />
        </Field>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* New appointment                                                     */
/* ------------------------------------------------------------------ */

function AppointmentModal({ onClose, toast, prefill }: Common & { prefill?: string }) {
  const { t } = useApp();
  const { patients, addAppointment, addPatient, patientById } = useData();
  const target = usePatientTarget(prefill);
  const [day, setDay] = useState(TODAY_ISO);
  const [time, setTime] = useState("09:30");
  const [duration, setDuration] = useState("30");
  const [act, setAct] = useState("");
  const [practitioner, setPractitioner] = useState(PRACTITIONERS[0]);
  const [busy, setBusy] = useState(false);

  const canSubmit =
    !!act.trim() &&
    !!day &&
    (target.mode === "existing" ? !!target.patientId : !!target.name.trim());

  const submit = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    const resolved = await resolveTarget(target, addPatient);
    if (!resolved) {
      setBusy(false);
      return;
    }
    const patientName =
      resolved.patient || patientById(resolved.patientId)?.name || "Patient";
    await addAppointment({
      patientId: resolved.patientId,
      patient: patientName,
      day,
      time,
      duration: Number(duration) || 30,
      act,
      practitioner,
    });
    toast(`${t("appt.created")} · ${isoToLabel(day)}`);
    onClose();
  };

  return (
    <Modal
      title={t("new.appointment")}
      icon={<CalendarPlus className="h-5 w-5" />}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>{t("common.cancel")}</Button>
          <Button variant="primary" onClick={submit} disabled={!canSubmit || busy}>
            <Check className="h-4 w-4" /> {t("common.create")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <PatientTargetFields target={target} patients={patients} t={t} />
        <Field label={t("appt.day")} required hint={isoToLabel(day)}>
          <Input type="date" value={day} onChange={(e) => setDay(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("appt.time")} required>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </Field>
          <Field label={t("appt.duration")}>
            <Select value={duration} onChange={(e) => setDuration(e.target.value)}>
              {[15, 30, 45, 60, 90].map((d) => (
                <option key={d} value={d}>{d} min</option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label={t("appt.act")} required>
          <Input value={act} onChange={(e) => setAct(e.target.value)} placeholder="Contrôle, détartrage, implant…" />
        </Field>
        <Field label={t("appt.practitioner")}>
          <Select value={practitioner} onChange={(e) => setPractitioner(e.target.value)}>
            {PRACTITIONERS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </Select>
        </Field>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* New treatment plan                                                  */
/* ------------------------------------------------------------------ */

function PlanModal({
  onClose,
  toast,
  prefill,
  sendDevis,
}: Common & { prefill?: string; sendDevis: UICtx["sendDevis"] }) {
  const { t } = useApp();
  const { patients, addTreatmentPlan, addPatient, patientById } = useData();
  const target = usePatientTarget(prefill);
  const [lines, setLines] = useState<PlanLine[]>([{ tooth: "", act: "", price: 0 }]);
  const [busy, setBusy] = useState(false);

  const setLine = (i: number, patch: Partial<PlanLine>) =>
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const addLine = () => setLines((ls) => [...ls, { tooth: "", act: "", price: 0 }]);
  const removeLine = (i: number) => setLines((ls) => ls.filter((_, idx) => idx !== i));

  const cleanLines = lines
    .filter((l) => l.act.trim())
    .map((l) => ({ tooth: l.tooth.trim() || "—", act: l.act.trim(), price: Number(l.price) || 0 }));
  const total = cleanLines.reduce((s, l) => s + l.price, 0);
  const canSubmit =
    cleanLines.length > 0 &&
    (target.mode === "existing" ? !!target.patientId : !!target.name.trim());

  const build = async () => {
    const resolved = await resolveTarget(target, addPatient);
    if (!resolved) return null;
    const patientName =
      resolved.patient || patientById(resolved.patientId)?.name || "Patient";
    const plan = await addTreatmentPlan({
      patientId: resolved.patientId,
      patient: patientName,
      lines: cleanLines,
    });
    return { plan, patientId: resolved.patientId };
  };

  const submit = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    const res = await build();
    if (!res) return setBusy(false);
    toast(t("plan.created"));
    onClose();
  };

  const submitAndSend = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    const res = await build();
    if (!res) return setBusy(false);
    await sendDevis(res.plan, patientById(res.patientId));
    onClose();
  };

  return (
    <Modal
      title={t("new.plan")}
      icon={<FileText className="h-5 w-5" />}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>{t("common.cancel")}</Button>
          <Button variant="outline" onClick={submitAndSend} disabled={!canSubmit || busy}>
            <FileText className="h-4 w-4" /> {t("plan.preparepdf")}
          </Button>
          <Button variant="primary" onClick={submit} disabled={!canSubmit || busy}>
            <Check className="h-4 w-4" /> {t("common.create")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <PatientTargetFields target={target} patients={patients} t={t} />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-ink-800/55">{t("plan.lines")}</span>
            <button onClick={addLine} className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700">
              <Plus className="h-3.5 w-3.5" /> {t("plan.addline")}
            </button>
          </div>
          <div className="space-y-2">
            {lines.map((l, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={l.tooth}
                  onChange={(e) => setLine(i, { tooth: e.target.value })}
                  placeholder={t("treat.tooth")}
                  className="w-16 shrink-0 text-center"
                />
                <Input
                  value={l.act}
                  onChange={(e) => setLine(i, { act: e.target.value })}
                  placeholder={t("appt.act")}
                  className="flex-1"
                />
                <Input
                  value={l.price ? String(l.price) : ""}
                  onChange={(e) => setLine(i, { price: Number(e.target.value) || 0 })}
                  inputMode="numeric"
                  placeholder="MAD"
                  className="w-24 shrink-0 text-right"
                />
                <button
                  onClick={() => removeLine(i)}
                  disabled={lines.length === 1}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-800/40 hover:bg-rose-50 hover:text-rose-500 disabled:opacity-30"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-sand-50 px-4 py-3">
          <span className="text-sm font-semibold text-ink-900">{t("treat.total")}</span>
          <span className="font-display text-xl font-bold text-teal-600">
            {mad(total)} <span className="text-sm font-medium text-ink-800/50">{t("common.mad")}</span>
          </span>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Document (imaging vault)                                            */
/* ------------------------------------------------------------------ */

const CATS: DocCategory[] = ["xray", "photo", "doc"];

function DocumentModal({
  onClose,
  toast,
  prefill,
}: Common & { prefill: { patientId?: string; docId?: string } }) {
  const { t } = useApp();
  const { patients, documents, addDocument, addFilesToDocument, patientById } = useData();
  const [mode, setMode] = useState<"new" | "add">(prefill.docId ? "add" : "new");
  const [patientId, setPatientId] = useState(prefill.patientId ?? "");
  const [docId, setDocId] = useState(prefill.docId ?? "");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<DocCategory>("xray");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  const canSubmit =
    files.length > 0 &&
    (mode === "new" ? !!patientId && !!title.trim() : !!docId);

  const submit = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    const docFiles = await Promise.all(files.map(toDocFile));
    if (mode === "new") {
      const p = patientById(patientId);
      await addDocument({
        patientId,
        patient: p?.name ?? "Patient",
        title: title.trim(),
        category,
        files: docFiles,
      });
      toast(t("doc.created"));
    } else {
      await addFilesToDocument(docId, docFiles);
      toast(t("doc.added"));
    }
    onClose();
  };

  return (
    <Modal
      title={t("new.document")}
      icon={<Images className="h-5 w-5" />}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>{t("common.cancel")}</Button>
          <Button variant="primary" onClick={submit} disabled={!canSubmit || busy}>
            <Check className="h-4 w-4" /> {mode === "new" ? t("common.create") : t("common.save")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode("new")}
            className={cn(
              "rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
              mode === "new" ? "border-teal-400 bg-teal-50 text-teal-700" : "border-black/10 text-ink-800/60 hover:border-teal-200"
            )}
          >
            {t("doc.mode.new")}
          </button>
          <button
            type="button"
            onClick={() => setMode("add")}
            className={cn(
              "rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
              mode === "add" ? "border-teal-400 bg-teal-50 text-teal-700" : "border-black/10 text-ink-800/60 hover:border-teal-200"
            )}
          >
            {t("doc.mode.add")}
          </button>
        </div>

        {mode === "new" ? (
          <>
            <Field label={t("col.name")} required>
              <PatientPicker value={patientId} onChange={setPatientId} patients={patients} placeholder={t("pay.selectpatient")} />
            </Field>
            <Field label={t("doc.title")} required>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Radio panoramique, consentement…" />
            </Field>
            <Field label={t("doc.category")}>
              <Select value={category} onChange={(e) => setCategory(e.target.value as DocCategory)}>
                {CATS.map((c) => (
                  <option key={c} value={c}>{t(`cat.${c}`)}</option>
                ))}
              </Select>
            </Field>
          </>
        ) : (
          <Field label={t("doc.pick")} required>
            <Select value={docId} onChange={(e) => setDocId(e.target.value)}>
              <option value="">{t("doc.pick")}</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.patient} — {d.title}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Field label={t("doc.files")} required>
          <FileDrop files={files} setFiles={setFiles} label={t("doc.choosefiles")} />
        </Field>
      </div>
    </Modal>
  );
}

function FileDrop({
  files,
  setFiles,
  label,
}: {
  files: File[];
  setFiles: (f: File[]) => void;
  label: string;
}) {
  return (
    <div>
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-black/15 bg-sand-50 px-4 py-6 text-center transition-colors hover:border-teal-400">
        <Upload className="h-6 w-6 text-teal-500" />
        <span className="text-sm font-medium text-ink-800/70">{label}</span>
        <input
          type="file"
          multiple
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
        />
      </label>
      {files.length > 0 && (
        <ul className="mt-2 space-y-1">
          {files.map((f, i) => (
            <li key={i} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs text-ink-800/70 ring-1 ring-black/5">
              <FileText className="h-3.5 w-3.5 text-teal-500" />
              <span className="flex-1 truncate">{f.name}</span>
              <span className="text-ink-800/40">{Math.round(f.size / 1024)} Ko</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Record payment                                                      */
/* ------------------------------------------------------------------ */

const METHODS: Payment["method"][] = ["cash", "card", "cheque", "transfer"];

function PaymentModal({ onClose, toast, prefill }: Common & { prefill?: string }) {
  const { t } = useApp();
  const { patients, recordPayment, patientById } = useData();
  const [patientId, setPatientId] = useState(prefill ?? "");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<Payment["method"]>("cash");
  const [act, setAct] = useState("");
  const [busy, setBusy] = useState(false);

  const p = patientById(patientId);
  const amt = Number(amount) || 0;
  const canSubmit = !!patientId && amt > 0;

  const submit = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    await recordPayment({ patientId, patient: p?.name ?? "Patient", amount: amt, method, act });
    toast(`${t("pay.recorded")} · +${mad(amt)} MAD`);
    onClose();
  };

  return (
    <Modal
      title={t("pay.record")}
      icon={<Wallet className="h-5 w-5" />}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>{t("common.cancel")}</Button>
          <Button variant="primary" onClick={submit} disabled={!canSubmit || busy}>
            <Check className="h-4 w-4" /> {t("pay.record")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label={t("col.name")} required>
          <PatientPicker value={patientId} onChange={setPatientId} patients={patients} placeholder={t("pay.selectpatient")} />
        </Field>
        {p && p.balance > 0 && (
          <div className="flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2 text-sm">
            <span className="text-amber-700">{t("col.balance")}</span>
            <span className="font-semibold text-amber-700">{mad(p.balance)} {t("common.mad")}</span>
          </div>
        )}
        <Field label={`${t("field.amount")} (${t("common.mad")})`} required>
          <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" placeholder="0" autoFocus />
        </Field>
        <Field label={t("pay.method")}>
          <div className="grid grid-cols-4 gap-2">
            {METHODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={cn(
                  "rounded-xl border px-2 py-2 text-[11px] font-medium transition-all",
                  method === m ? "border-teal-400 bg-teal-50 text-teal-700" : "border-black/5 text-ink-800/60 hover:border-teal-200"
                )}
              >
                {t(`pay.${m}`)}
              </button>
            ))}
          </div>
        </Field>
        <Field label={t("appt.act")} hint={t("common.optional")}>
          <Input value={act} onChange={(e) => setAct(e.target.value)} placeholder="Détartrage, acompte implant…" />
        </Field>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Message / reminder                                                  */
/* ------------------------------------------------------------------ */

function fillTemplate(tmpl: string, map: Record<string, string>) {
  return tmpl.replace(/\{(\w+)\}/g, (_, k) => map[k] ?? "");
}

function MessageModal({
  onClose,
  toast,
  patient,
  reminder,
  recallReason,
  onSent,
}: Common & {
  patient: Patient;
  reminder?: boolean;
  recallReason?: string;
  onSent?: () => void;
}) {
  const { t, tIn, lang } = useApp();
  const { appointments } = useData();

  // Compose the message in the PATIENT's preferred language (falls back to the
  // language the staff member is currently using) — an Arabic-speaking patient
  // gets Arabic even if the secretary works in French.
  const msgLang = patient.languagePreference ?? lang;
  const tp = (key: string) => tIn(msgLang, key);

  // Find this patient's soonest upcoming appointment (today or later) for context.
  const nextAppt = useMemo(() => {
    return appointments
      .filter((a) => a.patientId === patient.id && a.day >= TODAY_ISO && a.status !== "cancelled")
      .sort((a, b) => a.day.localeCompare(b.day) || a.time.localeCompare(b.time))[0];
  }, [appointments, patient.id]);

  const firstName = patient.name.split(" ")[0] || patient.name;
  const clinic = tp("msg.clinic");

  const initial = useMemo(() => {
    if (recallReason) {
      return fillTemplate(tp("msg.tmpl.recall"), { name: firstName, reason: recallReason, clinic });
    }
    if (reminder) {
      if (nextAppt) {
        return fillTemplate(tp("msg.tmpl.reminder"), {
          name: firstName,
          date: isoToShort(nextAppt.day),
          time: nextAppt.time,
          act: nextAppt.act ? ` — ${nextAppt.act}` : "",
          clinic,
        });
      }
      return fillTemplate(tp("msg.tmpl.reminder.noappt"), { name: firstName, clinic });
    }
    return fillTemplate(tp("msg.tmpl.blank"), { name: firstName });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reminder, recallReason, nextAppt, firstName, msgLang]);

  const [text, setText] = useState(initial);
  const [busy, setBusy] = useState(false);
  const hasPhone = !!patient.phone.replace(/\D/g, "");

  const submit = () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    // Open WhatsApp click-to-chat with the prefilled message.
    window.open(waLink(patient.phone, text), "_blank", "noopener,noreferrer");
    onSent?.();
    toast(t("msg.sent"));
    onClose();
  };

  return (
    <Modal
      title={t("msg.title")}
      subtitle={`${t("msg.to")} ${patient.name}${patient.phone ? ` · ${patient.phone}` : ""}`}
      icon={<MessageSquare className="h-5 w-5" />}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>{t("common.cancel")}</Button>
          <Button variant="primary" onClick={submit} disabled={!text.trim() || busy}>
            <MessageSquare className="h-4 w-4" /> {t("msg.send")}
          </Button>
        </>
      }
    >
      {!hasPhone && (
        <div className="mb-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {t("msg.nophone")}
        </div>
      )}
      <Textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder={t("msg.placeholder")} autoFocus />
      <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-800/45">
        <span className="grid h-4 w-4 place-items-center rounded bg-[#25D366] text-[9px] font-bold text-white">W</span>
        {t("msg.whatsapphint")}
      </p>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Reschedule (patient-facing)                                         */
/* ------------------------------------------------------------------ */

function RescheduleModal({
  onClose,
  toast,
  appointment,
}: Common & { appointment: Appointment }) {
  const { t } = useApp();
  const { rescheduleAppointment } = useData();
  const [day, setDay] = useState(appointment.day);
  const [time, setTime] = useState(appointment.time);
  const [busy, setBusy] = useState(false);

  const unchanged = day === appointment.day && time === appointment.time;

  const submit = async () => {
    if (busy || unchanged || !day) return;
    setBusy(true);
    await rescheduleAppointment(appointment.id, { day, time });
    toast(t("resched.done"));
    onClose();
  };

  return (
    <Modal
      title={t("resched.title")}
      icon={<CalendarPlus className="h-5 w-5" />}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>{t("common.cancel")}</Button>
          <Button variant="primary" onClick={submit} disabled={busy || unchanged || !day}>
            <Check className="h-4 w-4" /> {t("resched.confirm")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-black/5 bg-sand-50 p-3">
          <div className="text-xs font-medium uppercase tracking-wide text-ink-800/45">
            {t("resched.current")}
          </div>
          <div className="mt-1 text-sm font-semibold text-ink-900">
            {isoToLabel(appointment.day)} · {appointment.time} — {appointment.act}
          </div>
          <div className="text-xs text-ink-800/50">{appointment.practitioner}</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("resched.newday")} required hint={isoToLabel(day)}>
            <Input type="date" value={day} onChange={(e) => setDay(e.target.value)} />
          </Field>
          <Field label={t("resched.newtime")} required>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </Field>
        </div>
        <p className="text-xs text-ink-800/45">{t("resched.note")}</p>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Delete confirmation                                                 */
/* ------------------------------------------------------------------ */

function DeleteModal({ onClose, toast, patient }: Common & { patient: Patient }) {
  const { t } = useApp();
  const { deletePatient } = useData();
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    await deletePatient(patient.id);
    toast(`${patient.name} — ${t("act.delete").toLowerCase()} ✓`);
    onClose();
  };

  return (
    <Modal
      title={t("del.title")}
      icon={<Trash2 className="h-5 w-5" />}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>{t("common.cancel")}</Button>
          <Button
            variant="dark"
            className="!bg-rose-600 hover:!bg-rose-700"
            onClick={submit}
            disabled={busy}
          >
            <Trash2 className="h-4 w-4" /> {t("act.delete")}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3 rounded-xl bg-rose-50 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
        <div>
          <div className="flex items-center gap-2">
            <Avatar name={patient.name} size={30} />
            <span className="text-sm font-semibold text-ink-900">{patient.name}</span>
          </div>
          <p className="mt-2 text-sm text-ink-800/60">{t("del.desc")}</p>
        </div>
      </div>
    </Modal>
  );
}
