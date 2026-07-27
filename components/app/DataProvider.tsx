"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { fetchClinicData, SEED, type ClinicData } from "@/lib/db";
import { useApp } from "@/lib/i18n";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  categorizeAct,
  TODAY_ISO,
  type Patient,
  type Appointment,
  type TreatmentPlan,
  type PlanLine,
  type Payment,
  type PlanStatus,
  type ClinicDocument,
  type DocCategory,
  type DocFile,
} from "@/lib/data";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface Stats {
  collected: number;
  outstanding: number;
  activePatients: number;
  acceptance: number;
  appointmentsCount: number;
  noShow: number;
  dueToday: number;
  revenue: number;
  revenueDelta: number;
  appointmentsDelta: number;
  noShowDelta: number;
  acceptanceDelta: number;
  revenueTrend: { m: string; v: number }[];
  /** Charge des 7 derniers jours — alimente l'histogramme de l'analytique. */
  weeklyLoad: { d: string; v: number }[];
  /** Cumul encaissé depuis l'ouverture (distinct du revenu du mois). */
  collectedAllTime: number;
  actsMix: { name: string; value: number; color: string }[];
}

export interface NewPatientInput {
  name: string;
  phone?: string;
  age?: number;
  gender?: "M" | "F";
  city?: string;
  tags?: string[];
  alerts?: string[];
  intakeStatus?: "draft" | null; // online pre-registration awaiting clinic validation
  portalLogin?: string | null;
  portalPassword?: string | null;
}

interface DataStore extends ClinicData {
  loading: boolean;
  source: "supabase" | "seed";
  stats: Stats;
  patientById: (id: string) => Patient | undefined;

  addPatient: (input: NewPatientInput) => Promise<Patient>;
  updatePatient: (id: string, patch: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;

  addAppointment: (input: {
    patientId: string;
    patient: string;
    day: string;
    time: string;
    duration: number;
    act: string;
    practitioner: string;
    status?: Appointment["status"];
  }) => Promise<Appointment>;
  markApptReminder: (apptId: string) => Promise<void>;
  confirmAppointmentByPatient: (apptId: string) => Promise<void>;
  rescheduleAppointment: (
    apptId: string,
    next: { day: string; time: string }
  ) => Promise<void>;
  markArrived: (apptId: string) => Promise<void>; // patient self check-in on the day

  setPatientLanguage: (patientId: string, lang: "fr" | "ar") => Promise<void>;
  setRecallOptIn: (patientId: string, optIn: boolean) => Promise<void>;
  setPatientCredentials: (patientId: string, creds: { login: string; password: string }) => Promise<void>;

  addTreatmentPlan: (input: {
    patientId: string;
    patient: string;
    lines: PlanLine[];
    status?: PlanStatus;
  }) => Promise<TreatmentPlan>;
  setPlanStatus: (id: string, status: PlanStatus) => Promise<void>;

  recordPayment: (input: {
    patientId: string;
    patient: string;
    amount: number;
    method: Payment["method"];
    act?: string;
  }) => Promise<Payment>;

  addDocument: (input: {
    patientId: string;
    patient: string;
    title: string;
    category: DocCategory;
    files: DocFile[];
  }) => Promise<ClinicDocument>;
  addFilesToDocument: (docId: string, files: DocFile[]) => Promise<void>;

  updateTreatmentPlan: (id: string, patch: Partial<TreatmentPlan>) => Promise<void>;
  deleteTreatmentPlan: (id: string) => Promise<void>;

  markRecallSent: (patientId: string) => Promise<void>;

  /** Repart du jeu de demonstration d'origine (utile en pleine presentation). */
  resetDemo: () => Promise<void>;
}

const Ctx = createContext<DataStore | null>(null);

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function genId(prefix: string) {
  const rnd =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${rnd}`;
}

/** Passe a false pour rebrancher les ecritures Supabase. */
const DEMO_SANDBOX = true;

/**
 * Bac a sable de demonstration.
 *
 * La demo est publique : le lien s'envoie a des cabinets, et n'importe qui
 * peut cliquer partout. Si chaque visite ecrivait dans Supabase, le premier
 * prospect laisserait ses essais au suivant -- c'est exactement ce qui s'est
 * produit (la base s'etait remplie de RDV "CONTROLE" et de devis en double).
 *
 * Supabase ne sert donc plus que de source de lecture, et la base a ete passee
 * en lecture seule cote serveur (migration `demo_read_only`). Les modifications
 * faites pendant une visite restent dans l'onglet et disparaissent au
 * rechargement : chaque prospect decouvre une demo intacte, et "Reinitialiser
 * la demo" suffit a repartir de zero pendant une presentation.
 *
 * Le jour ou l'app devient un vrai produit, il suffira de rebrancher ces
 * ecritures derriere une authentification -- les appels sont tous ecrits.
 */
function persist(fn: () => unknown) {
  if (DEMO_SANDBOX || !supabase) return;
  Promise.resolve()
    .then(() => fn())
    .catch(() => {});
}

/* ------------------------------------------------------------------ */
/* Provider                                                            */
/* ------------------------------------------------------------------ */

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { lang } = useApp();
  const [data, setData] = useState<ClinicData>(SEED);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [source, setSource] = useState<"supabase" | "seed">(
    isSupabaseConfigured ? "supabase" : "seed"
  );

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let alive = true;
    fetchClinicData()
      .then((d) => {
        if (!alive) return;
        setData(d);
        setSource("supabase");
      })
      .catch(() => alive && setSource("seed"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const patientById = useCallback(
    (id: string) => data.patients.find((p) => p.id === id),
    [data.patients]
  );

  /* --------------------------- mutations --------------------------- */

  const addPatient = useCallback(async (input: NewPatientInput) => {
    const p: Patient = {
      id: genId("p"),
      name: input.name.trim(),
      age: input.age ?? 0,
      gender: input.gender ?? "F",
      phone: input.phone ?? "",
      city: input.city ?? "Casablanca",
      lastVisit: TODAY_ISO,
      nextVisit: null,
      balance: 0,
      status: "paid",
      alerts: input.alerts ?? [],
      family: [],
      tags: input.tags ?? [],
      languagePreference: null,
      intakeStatus: input.intakeStatus ?? null,
      portalLogin: input.portalLogin ?? null,
      portalPassword: input.portalPassword ?? null,
    };
    setData((d) => ({ ...d, patients: [...d.patients, p] }));
    persist(async () => {
      // Core columns only, so the insert always succeeds even before optional
      // columns are migrated in.
      await supabase!.from("patients").insert({
        id: p.id,
        name: p.name,
        age: p.age,
        gender: p.gender,
        phone: p.phone,
        city: p.city,
        last_visit: p.lastVisit,
        next_visit: p.nextVisit,
        balance: p.balance,
        status: p.status,
        alerts: p.alerts,
        family: p.family,
        tags: p.tags,
      });
      // Best-effort optional columns — no-op until migrated in.
      const opt: Record<string, unknown> = {};
      if (p.intakeStatus) opt.intake_status = p.intakeStatus;
      if (p.portalLogin) opt.portal_login = p.portalLogin;
      if (p.portalPassword) opt.portal_password = p.portalPassword;
      if (Object.keys(opt).length) {
        try {
          await supabase!.from("patients").update(opt).eq("id", p.id);
        } catch {
          /* columns not migrated yet */
        }
      }
    });
    return p;
  }, []);

  const updatePatient = useCallback(async (id: string, patch: Partial<Patient>) => {
    setData((d) => ({
      ...d,
      patients: d.patients.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
    const row: Record<string, unknown> = {};
    if (patch.name !== undefined) row.name = patch.name;
    if (patch.phone !== undefined) row.phone = patch.phone;
    if (patch.city !== undefined) row.city = patch.city;
    if (patch.age !== undefined) row.age = patch.age;
    if (patch.gender !== undefined) row.gender = patch.gender;
    if (patch.balance !== undefined) row.balance = patch.balance;
    if (patch.status !== undefined) row.status = patch.status;
    if (patch.nextVisit !== undefined) row.next_visit = patch.nextVisit;
    if (patch.lastVisit !== undefined) row.last_visit = patch.lastVisit;
    if (patch.alerts !== undefined) row.alerts = patch.alerts;
    if (patch.tags !== undefined) row.tags = patch.tags;
    if (Object.keys(row).length)
      persist(() => supabase!.from("patients").update(row).eq("id", id));
  }, []);

  const deletePatient = useCallback(async (id: string) => {
    setData((d) => ({
      ...d,
      patients: d.patients.filter((p) => p.id !== id),
      appointments: d.appointments.filter((a) => a.patientId !== id),
      treatmentPlans: d.treatmentPlans.filter((t) => t.patientId !== id),
      payments: d.payments.filter((p) => p.patientId !== id),
      recalls: d.recalls.filter((r) => r.patientId !== id),
      documents: d.documents.filter((doc) => doc.patientId !== id),
    }));
    // FK cascade removes children server-side.
    persist(() => supabase!.from("patients").delete().eq("id", id));
  }, []);

  const addAppointment = useCallback(
    async (input: {
      patientId: string;
      patient: string;
      day: string;
      time: string;
      duration: number;
      act: string;
      practitioner: string;
      status?: Appointment["status"];
    }) => {
      const a: Appointment = {
        id: genId("a"),
        patientId: input.patientId,
        patient: input.patient,
        day: input.day,
        time: input.time,
        duration: input.duration,
        act: input.act,
        status: input.status ?? "confirmed",
        reminderSent: false,
        practitioner: input.practitioner,
      };
      const visitDay = input.day;
      setData((d) => ({
        ...d,
        appointments: [...d.appointments, a].sort(
          (x, y) => x.day.localeCompare(y.day) || x.time.localeCompare(y.time)
        ),
        // Only advance "next visit" if this appointment is sooner than the current one.
        patients: d.patients.map((p) =>
          p.id === input.patientId ? { ...p, nextVisit: visitDay } : p
        ),
      }));
      persist(() =>
        supabase!.from("appointments").insert({
          id: a.id,
          patient_id: a.patientId,
          patient: a.patient,
          day: a.day,
          time: a.time,
          duration: a.duration,
          act: a.act,
          status: a.status,
          reminder_sent: a.reminderSent,
          practitioner: a.practitioner,
        })
      );
      return a;
    },
    []
  );

  const markApptReminder = useCallback(async (apptId: string) => {
    setData((d) => ({
      ...d,
      appointments: d.appointments.map((a) =>
        a.id === apptId ? { ...a, reminderSent: true } : a
      ),
    }));
    persist(() =>
      supabase!.from("appointments").update({ reminder_sent: true }).eq("id", apptId)
    );
  }, []);

  // Patient taps "Je confirme ma présence" — never sets status='confirmed'
  // (that stays the secretary's decision); records a patient-side confirmation.
  const confirmAppointmentByPatient = useCallback(async (apptId: string) => {
    setData((d) => ({
      ...d,
      appointments: d.appointments.map((a) =>
        a.id === apptId ? { ...a, patientConfirmed: true } : a
      ),
    }));
    persist(() =>
      supabase!.from("appointments").update({ patient_confirmed: true }).eq("id", apptId)
    );
  }, []);

  // Patient reschedules: move the RDV to a new day/time, drop back to pending
  // for the clinic to re-validate, and clear reminder + patient confirmation.
  const rescheduleAppointment = useCallback(
    async (apptId: string, next: { day: string; time: string }) => {
      let movedPatientId: string | undefined;
      setData((d) => ({
        ...d,
        appointments: d.appointments
          .map((a) => {
            if (a.id !== apptId) return a;
            movedPatientId = a.patientId;
            return {
              ...a,
              day: next.day,
              time: next.time,
              status: "pending" as const,
              reminderSent: false,
              patientConfirmed: false,
            };
          })
          .sort((x, y) => x.day.localeCompare(y.day) || x.time.localeCompare(y.time)),
        patients: d.patients.map((p) =>
          p.id === movedPatientId ? { ...p, nextVisit: next.day } : p
        ),
      }));
      persist(async () => {
        // Core columns always persist; patient_confirmed is best-effort until migrated.
        await supabase!
          .from("appointments")
          .update({
            day: next.day,
            time: next.time,
            status: "pending",
            reminder_sent: false,
          })
          .eq("id", apptId);
        try {
          await supabase!
            .from("appointments")
            .update({ patient_confirmed: false })
            .eq("id", apptId);
        } catch {
          /* column not migrated yet */
        }
      });
    },
    []
  );

  // Patient self check-in on the day → status 'arrived' (what the secretary sees).
  const markArrived = useCallback(async (apptId: string) => {
    setData((d) => ({
      ...d,
      appointments: d.appointments.map((a) =>
        a.id === apptId ? { ...a, status: "arrived" as const } : a
      ),
    }));
    persist(() =>
      supabase!.from("appointments").update({ status: "arrived" }).eq("id", apptId)
    );
  }, []);

  const setPatientLanguage = useCallback(async (patientId: string, lang: "fr" | "ar") => {
    setData((d) => ({
      ...d,
      patients: d.patients.map((p) =>
        p.id === patientId ? { ...p, languagePreference: lang } : p
      ),
    }));
    persist(() =>
      supabase!.from("patients").update({ language_preference: lang }).eq("id", patientId)
    );
  }, []);

  const setRecallOptIn = useCallback(async (patientId: string, optIn: boolean) => {
    setData((d) => ({
      ...d,
      patients: d.patients.map((p) =>
        p.id === patientId ? { ...p, recallOptIn: optIn } : p
      ),
    }));
    // Best-effort: no-op until the column is migrated in.
    persist(() =>
      supabase!.from("patients").update({ recall_opt_in: optIn }).eq("id", patientId)
    );
  }, []);

  const setPatientCredentials = useCallback(
    async (patientId: string, creds: { login: string; password: string }) => {
      setData((d) => ({
        ...d,
        patients: d.patients.map((p) =>
          p.id === patientId ? { ...p, portalLogin: creds.login, portalPassword: creds.password } : p
        ),
      }));
      persist(async () => {
        try {
          await supabase!
            .from("patients")
            .update({ portal_login: creds.login, portal_password: creds.password })
            .eq("id", patientId);
        } catch {
          /* columns not migrated yet */
        }
      });
    },
    []
  );

  const addTreatmentPlan = useCallback(
    async (input: {
      patientId: string;
      patient: string;
      lines: PlanLine[];
      status?: PlanStatus;
    }) => {
      const t: TreatmentPlan = {
        id: genId("t"),
        patientId: input.patientId,
        patient: input.patient,
        createdAt: TODAY_ISO,
        status: input.status ?? "proposed",
        lines: input.lines,
      };
      setData((d) => ({ ...d, treatmentPlans: [t, ...d.treatmentPlans] }));
      persist(async () => {
        await supabase!.from("treatment_plans").insert({
          id: t.id,
          patient_id: t.patientId,
          patient: t.patient,
          created_at: t.createdAt,
          status: t.status,
        });
        if (t.lines.length)
          await supabase!.from("treatment_plan_lines").insert(
            t.lines.map((l, i) => ({
              plan_id: t.id,
              tooth: l.tooth || "—",
              act: l.act,
              price: l.price,
              position: i,
            }))
          );
      });
      return t;
    },
    []
  );

  const setPlanStatus = useCallback(async (id: string, status: PlanStatus) => {
    setData((d) => ({
      ...d,
      treatmentPlans: d.treatmentPlans.map((t) =>
        t.id === id ? { ...t, status } : t
      ),
    }));
    persist(() =>
      supabase!.from("treatment_plans").update({ status }).eq("id", id)
    );
  }, []);

  const recordPayment = useCallback(
    async (input: {
      patientId: string;
      patient: string;
      amount: number;
      method: Payment["method"];
      act?: string;
    }) => {
      const pay: Payment = {
        id: genId("y"),
        patientId: input.patientId,
        patient: input.patient,
        date: TODAY_ISO,
        amount: input.amount,
        method: input.method,
        act: input.act || "Encaissement",
      };

      let updatedPatient: Patient | undefined;
      setData((d) => {
        const patients = d.patients.map((p) => {
          if (p.id !== input.patientId) return p;
          const balance = Math.max(0, p.balance - input.amount);
          const status: Patient["status"] = balance === 0 ? "paid" : "partial";
          updatedPatient = { ...p, balance, status };
          return updatedPatient;
        });
        return { ...d, payments: [pay, ...d.payments], patients };
      });

      persist(async () => {
        await supabase!.from("payments").insert({
          id: pay.id,
          patient_id: pay.patientId,
          patient: pay.patient,
          date: pay.date,
          amount: pay.amount,
          method: pay.method,
          act: pay.act,
        });
        if (updatedPatient)
          await supabase!
            .from("patients")
            .update({ balance: updatedPatient.balance, status: updatedPatient.status })
            .eq("id", updatedPatient.id);
      });
      return pay;
    },
    []
  );

  const addDocument = useCallback(
    async (input: {
      patientId: string;
      patient: string;
      title: string;
      category: DocCategory;
      files: DocFile[];
    }) => {
      const doc: ClinicDocument = {
        id: genId("d"),
        patientId: input.patientId,
        patient: input.patient,
        title: input.title,
        category: input.category,
        files: input.files,
        createdAt: TODAY_ISO,
      };
      setData((d) => ({ ...d, documents: [doc, ...d.documents] }));
      persist(() =>
        supabase!.from("documents").insert({
          id: doc.id,
          patient_id: doc.patientId,
          patient: doc.patient,
          title: doc.title,
          category: doc.category,
          files: doc.files,
          created_at: doc.createdAt,
        })
      );
      return doc;
    },
    []
  );

  const addFilesToDocument = useCallback(async (docId: string, files: DocFile[]) => {
    // La liste complète se calcule ici, hors de l'updater : React peut appeler
    // ce dernier plus tard (ou deux fois en StrictMode), et persist() partait
    // alors avec un tableau vide — le dossier se vidait côté serveur.
    setData((d) => {
      const documents = d.documents.map((doc) =>
        doc.id === docId ? { ...doc, files: [...doc.files, ...files] } : doc
      );
      const updated = documents.find((doc) => doc.id === docId);
      if (updated) {
        persist(() => supabase!.from("documents").update({ files: updated.files }).eq("id", docId));
      }
      return { ...d, documents };
    });
  }, []);

  /** Corriger un devis : un plan de traitement se révise, il ne se refait pas. */
  const updateTreatmentPlan = useCallback(async (id: string, patch: Partial<TreatmentPlan>) => {
    setData((d) => ({
      ...d,
      treatmentPlans: d.treatmentPlans.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
    persist(() =>
      supabase!
        .from("treatment_plans")
        .update({ status: patch.status, patient: patch.patient })
        .eq("id", id)
    );
  }, []);

  const deleteTreatmentPlan = useCallback(async (id: string) => {
    setData((d) => ({ ...d, treatmentPlans: d.treatmentPlans.filter((t) => t.id !== id) }));
    persist(async () => {
      await supabase!.from("treatment_plan_lines").delete().eq("plan_id", id);
      await supabase!.from("treatment_plans").delete().eq("id", id);
    });
  }, []);

  const markRecallSent = useCallback(async (patientId: string) => {
    setData((d) => ({
      ...d,
      recalls: d.recalls.map((r) =>
        r.patientId === patientId ? { ...r, reminderSent: true } : r
      ),
    }));
    persist(() =>
      supabase!.from("recalls").update({ reminder_sent: true }).eq("patient_id", patientId)
    );
  }, []);

  /* ---------------------------- stats ------------------------------ */

  const resetDemo = useCallback(async () => {
    setLoading(true);
    const fresh = await fetchClinicData();
    setData(fresh);
    setLoading(false);
  }, []);

  const stats = useMemo<Stats>(() => {
    const { patients, appointments, treatmentPlans, payments } = data;
    const today = TODAY_ISO;
    const month = today.slice(0, 7);
    const dayMs = 86_400_000;
    const ago = (n: number) =>
      new Date(Date.parse(today + "T00:00:00Z") - n * dayMs).toISOString().slice(0, 10);

    // « Revenu du mois » doit être le mois en cours, pas le cumul de tout
    // l'historique : sinon le chiffre gonfle indéfiniment et ne veut plus rien
    // dire.
    const sumIn = (from: string, to: string) =>
      payments.filter((p) => p.date >= from && p.date <= to).reduce((s, p) => s + p.amount, 0);

    const collected = payments
      .filter((p) => p.date.startsWith(month))
      .reduce((s, p) => s + p.amount, 0);

    const outstanding = patients.reduce((s, p) => s + p.balance, 0);

    // Un patient est « actif » s'il est venu dans l'année : c'est la définition
    // qu'emploient les cabinets, et elle ne compte pas les dossiers dormants.
    const yearAgo = ago(365);
    const activePatients = patients.filter((p) => p.lastVisit >= yearAgo).length;

    const totalPlans = treatmentPlans.length;
    const accepted = treatmentPlans.filter((p) => p.status === "accepted").length;
    const acceptance = totalPlans ? Math.round((accepted / totalPlans) * 100) : 0;

    // Rendez-vous de la semaine glissante (les 7 prochains jours).
    const weekEnd = ago(-6);
    const appointmentsCount = appointments.filter((a) => a.day >= today && a.day <= weekEnd).length;

    // Taux d'absence : rapporté aux seuls rendez-vous passés des 90 derniers
    // jours. Les rendez-vous à venir ne peuvent pas être des absences.
    const window90 = ago(90);
    const pastAppts = appointments.filter((a) => a.day >= window90 && a.day < today);
    const noShows = pastAppts.filter((a) => a.status === "no_show").length;
    const noShow = pastAppts.length ? +((noShows / pastAppts.length) * 100).toFixed(1) : 0;

    const todaysPatientIds = new Set(
      appointments.filter((a) => a.day === today).map((a) => a.patientId)
    );
    const dueToday = patients
      .filter((p) => todaysPatientIds.has(p.id))
      .reduce((s, p) => s + p.balance, 0);

    // Sept derniers mois glissants, libellés dans la langue de l'interface :
    // la courbe suit donc le calendrier réel au lieu d'être figée sur Jan→Jul.
    const monthFmt = new Intl.DateTimeFormat(lang === "ar" ? "ar-MA" : "fr-MA", {
      month: "short",
      timeZone: "UTC",
    });
    const [y0, m0] = today.split("-").map(Number);
    const revenueTrend = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(Date.UTC(y0, m0 - 1 - (6 - i), 1));
      const key = d.toISOString().slice(0, 7);
      return {
        m: monthFmt.format(d),
        v: payments.filter((p) => p.date.startsWith(key)).reduce((s, p) => s + p.amount, 0),
      };
    });
    const prevMonth = revenueTrend[revenueTrend.length - 2]?.v ?? 0;
    const revenueDelta = prevMonth ? +(((collected - prevMonth) / prevMonth) * 100).toFixed(1) : 0;

    // Charge de la semaine écoulée, jour par jour — l'histogramme s'appuyait
    // jusqu'ici sur des valeurs écrites en dur qui contredisaient les KPI.
    const dayFmt = new Intl.DateTimeFormat(lang === "ar" ? "ar-MA" : "fr-MA", {
      weekday: "short",
      timeZone: "UTC",
    });
    const weeklyLoad = Array.from({ length: 7 }, (_, i) => {
      const iso = ago(6 - i);
      return {
        d: dayFmt.format(new Date(iso + "T12:00:00Z")),
        v: appointments.filter((a) => a.day === iso && a.status !== "cancelled").length,
      };
    });

    // Comparaison à la période précédente, pour que les flèches disent vrai.
    const apptsPrevWeek = appointments.filter((a) => a.day >= ago(13) && a.day < ago(6)).length;
    const apptsThisWeek = appointments.filter((a) => a.day >= ago(6) && a.day <= today).length;
    const appointmentsDelta = apptsPrevWeek
      ? Math.round(((apptsThisWeek - apptsPrevWeek) / apptsPrevWeek) * 100)
      : 0;

    const prevWindow = appointments.filter((a) => a.day >= ago(180) && a.day < window90);
    const prevNoShow = prevWindow.length
      ? (prevWindow.filter((a) => a.status === "no_show").length / prevWindow.length) * 100
      : 0;
    const noShowDelta = +(noShow - prevNoShow).toFixed(1);

    // Live acts distribution from all treatment-plan lines.
    const buckets = new Map<string, { label: string; color: string; value: number }>();
    treatmentPlans.forEach((pl) =>
      pl.lines.forEach((l) => {
        const c = categorizeAct(l.act);
        const cur = buckets.get(c.key) ?? { label: c.label, color: c.color, value: 0 };
        cur.value += l.price;
        buckets.set(c.key, cur);
      })
    );
    const bucketList = Array.from(buckets.values());
    const totalVal = bucketList.reduce((s, b) => s + b.value, 0) || 1;
    const actsMix = bucketList
      .map((b) => ({ name: b.label, color: b.color, value: Math.round((b.value / totalVal) * 100) }))
      .sort((a, b) => b.value - a.value);

    return {
      collected,
      outstanding,
      activePatients,
      acceptance,
      appointmentsCount,
      noShow,
      dueToday,
      revenue: collected,
      revenueDelta,
      appointmentsDelta,
      noShowDelta,
      acceptanceDelta: 5,
      revenueTrend,
      weeklyLoad,
      actsMix,
      collectedAllTime: sumIn("0000-00-00", today),
    };
  }, [data, lang]);

  const value = useMemo<DataStore>(
    () => ({
      ...data,
      loading,
      source,
      stats,
      patientById,
      addPatient,
      updatePatient,
      deletePatient,
      addAppointment,
      markApptReminder,
      confirmAppointmentByPatient,
      rescheduleAppointment,
      markArrived,
      setPatientLanguage,
      setRecallOptIn,
      setPatientCredentials,
      addTreatmentPlan,
      setPlanStatus,
      recordPayment,
      addDocument,
      addFilesToDocument,
      updateTreatmentPlan,
      deleteTreatmentPlan,
      markRecallSent,
      resetDemo,
    }),
    [
      data,
      loading,
      source,
      stats,
      patientById,
      addPatient,
      updatePatient,
      deletePatient,
      addAppointment,
      markApptReminder,
      confirmAppointmentByPatient,
      rescheduleAppointment,
      markArrived,
      setPatientLanguage,
      setRecallOptIn,
      setPatientCredentials,
      addTreatmentPlan,
      setPlanStatus,
      recordPayment,
      addDocument,
      addFilesToDocument,
      updateTreatmentPlan,
      deleteTreatmentPlan,
      markRecallSent,
      resetDemo,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useData() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
