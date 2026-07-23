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
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { isoToLabel } from "@/lib/utils";
import {
  categorizeAct,
  TODAY_LABEL,
  TODAY_FULL,
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

  markRecallSent: (patientId: string) => Promise<void>;
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

// Fire-and-forget Supabase write — never blocks the UI, never throws.
function persist(fn: () => unknown) {
  if (!supabase) return;
  Promise.resolve()
    .then(() => fn())
    .catch(() => {});
}

/* ------------------------------------------------------------------ */
/* Provider                                                            */
/* ------------------------------------------------------------------ */

export function DataProvider({ children }: { children: React.ReactNode }) {
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
      lastVisit: TODAY_FULL,
      nextVisit: null,
      balance: 0,
      status: "paid",
      alerts: input.alerts ?? [],
      family: [],
      tags: input.tags ?? [],
    };
    setData((d) => ({ ...d, patients: [...d.patients, p] }));
    persist(() =>
      supabase!.from("patients").insert({
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
      })
    );
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
      const visitLabel = isoToLabel(input.day);
      setData((d) => ({
        ...d,
        appointments: [...d.appointments, a].sort(
          (x, y) => x.day.localeCompare(y.day) || x.time.localeCompare(y.time)
        ),
        // Only advance "next visit" if this appointment is sooner than the current one.
        patients: d.patients.map((p) =>
          p.id === input.patientId ? { ...p, nextVisit: visitLabel } : p
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
        createdAt: TODAY_FULL,
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
        date: TODAY_LABEL,
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
        createdAt: TODAY_FULL,
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
    let next: DocFile[] = [];
    setData((d) => ({
      ...d,
      documents: d.documents.map((doc) => {
        if (doc.id !== docId) return doc;
        next = [...doc.files, ...files];
        return { ...doc, files: next };
      }),
    }));
    persist(() => supabase!.from("documents").update({ files: next }).eq("id", docId));
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

  const stats = useMemo<Stats>(() => {
    const { patients, appointments, treatmentPlans, payments } = data;
    const collected = payments.reduce((s, p) => s + p.amount, 0);
    const outstanding = patients.reduce((s, p) => s + p.balance, 0);
    const totalPlans = treatmentPlans.length;
    const accepted = treatmentPlans.filter((p) => p.status === "accepted").length;
    const acceptance = totalPlans ? Math.round((accepted / totalPlans) * 100) : 0;
    const appointmentsCount = appointments.length;
    const cancelled = appointments.filter((a) => a.status === "cancelled").length;
    const noShow = appointmentsCount
      ? +((cancelled / appointmentsCount) * 100).toFixed(1)
      : 0;
    const dueToday = patients
      .filter((p) => appointments.some((a) => a.patientId === p.id))
      .reduce((s, p) => s + p.balance, 0);

    const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun"];
    const base = [7200, 7900, 7600, 8300, 8800, 8600];
    const revenueTrend = [
      ...base.map((v, i) => ({ m: months[i], v })),
      { m: "Jul", v: collected },
    ];

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
      activePatients: patients.length,
      acceptance,
      appointmentsCount,
      noShow,
      dueToday,
      revenue: collected,
      revenueDelta: 10.1,
      appointmentsDelta: 6,
      noShowDelta: -1.8,
      acceptanceDelta: 5,
      revenueTrend,
      actsMix,
    };
  }, [data]);

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
      addTreatmentPlan,
      setPlanStatus,
      recordPayment,
      addDocument,
      addFilesToDocument,
      markRecallSent,
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
      addTreatmentPlan,
      setPlanStatus,
      recordPayment,
      addDocument,
      addFilesToDocument,
      markRecallSent,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useData() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
