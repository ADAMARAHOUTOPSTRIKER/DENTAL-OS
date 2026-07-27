import { supabase } from "./supabase";
import { rebase, rebaseLoose, SEED_ANCHOR_ISO } from "./clock";
import {
  patients as seedPatients,
  todaysAppointments as seedAppointments,
  treatmentPlans as seedPlans,
  payments as seedPayments,
  recalls as seedRecalls,
  documents as seedDocuments,
  type Patient,
  type Appointment,
  type TreatmentPlan,
  type Payment,
  type Recall,
  type ClinicDocument,
  BACKGROUND,
} from "./data";

export interface ClinicData {
  patients: Patient[];
  appointments: Appointment[];
  treatmentPlans: TreatmentPlan[];
  payments: Payment[];
  recalls: Recall[];
  documents: ClinicDocument[];
}

// The seed export doubles as the fallback when Supabase is unreachable.
export const SEED: ClinicData = {
  patients: seedPatients,
  appointments: seedAppointments,
  treatmentPlans: seedPlans,
  payments: seedPayments,
  recalls: seedRecalls,
  documents: seedDocuments,
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function fetchClinicData(): Promise<ClinicData> {
  if (!supabase) return SEED;
  try {
    const [pRes, aRes, plRes, plLineRes, payRes, rRes, dRes] = await Promise.all([
      supabase.from("patients").select("*").order("id"),
      supabase.from("appointments").select("*").order("time"),
      supabase.from("treatment_plans").select("*").order("id"),
      supabase.from("treatment_plan_lines").select("*").order("position"),
      supabase.from("payments").select("*").order("id"),
      supabase.from("recalls").select("*").order("id"),
      supabase.from("documents").select("*").order("id"),
    ]);

    if (pRes.error || aRes.error || plRes.error || plLineRes.error || payRes.error || rRes.error || dRes.error) {
      return SEED;
    }

    const patients: Patient[] = (pRes.data ?? []).map((r: any) => ({
      id: r.id,
      name: r.name,
      age: r.age,
      gender: r.gender,
      phone: r.phone,
      city: r.city,
      lastVisit: rebaseLoose(r.last_visit) ?? r.last_visit,
      nextVisit: rebaseLoose(r.next_visit),
      balance: r.balance,
      status: r.status,
      alerts: r.alerts ?? [],
      family: r.family ?? [],
      tags: r.tags ?? [],
      languagePreference: r.language_preference ?? null,
      intakeStatus: r.intake_status ?? null,
      recallOptIn: r.recall_opt_in ?? true,
      portalLogin: r.portal_login ?? null,
      portalPassword: r.portal_password ?? null,
    }));

    const appointments: Appointment[] = (aRes.data ?? []).map((r: any) => ({
      id: r.id,
      patientId: r.patient_id,
      patient: r.patient,
      day: rebase(r.day ?? SEED_ANCHOR_ISO),
      time: r.time,
      duration: r.duration,
      act: r.act,
      status: r.status,
      reminderSent: r.reminder_sent,
      practitioner: r.practitioner,
      patientConfirmed: r.patient_confirmed ?? false,
    }));

    const linesByPlan = new Map<string, { tooth: string; act: string; price: number }[]>();
    (plLineRes.data ?? []).forEach((l: any) => {
      const arr = linesByPlan.get(l.plan_id) ?? [];
      arr.push({ tooth: l.tooth, act: l.act, price: l.price });
      linesByPlan.set(l.plan_id, arr);
    });

    const treatmentPlans: TreatmentPlan[] = (plRes.data ?? []).map((r: any) => ({
      id: r.id,
      patientId: r.patient_id,
      patient: r.patient,
      createdAt: rebaseLoose(r.created_at) ?? r.created_at,
      status: r.status,
      lines: linesByPlan.get(r.id) ?? [],
    }));

    const payments: Payment[] = (payRes.data ?? []).map((r: any) => ({
      id: r.id,
      patientId: r.patient_id,
      patient: r.patient,
      date: rebaseLoose(r.date) ?? r.date,
      amount: r.amount,
      method: r.method,
      act: r.act,
    }));

    const recalls: Recall[] = (rRes.data ?? []).map((r: any) => ({
      patientId: r.patient_id,
      patient: r.patient,
      reason: r.reason,
      due: rebaseLoose(r.due) ?? r.due,
      reminderSent: r.reminder_sent,
    }));

    const documents: ClinicDocument[] = (dRes.data ?? []).map((r: any) => ({
      id: r.id,
      patientId: r.patient_id,
      patient: r.patient,
      title: r.title,
      category: r.category,
      files: Array.isArray(r.files) ? r.files : [],
      createdAt: rebaseLoose(r.created_at) ?? r.created_at,
    }));

    // Si une table revient vide, on préfère le jeu local pour cette tranche.
    // Et dans tous les cas on rajoute la patientèle de fond : elle ne vit pas
    // en base (voir BACKGROUND dans lib/data.ts), mais sans elle la démo live
    // retomberait à dix dossiers — des indicateurs qu'aucun dentiste ne croit.
    return {
      patients: [...(patients.length ? patients : SEED.patients), ...BACKGROUND.patients],
      appointments: [...(appointments.length ? appointments : SEED.appointments), ...BACKGROUND.appointments],
      treatmentPlans: treatmentPlans.length ? treatmentPlans : SEED.treatmentPlans,
      payments: [...(payments.length ? payments : SEED.payments), ...BACKGROUND.payments],
      recalls: recalls.length ? recalls : SEED.recalls,
      documents: documents.length ? documents : SEED.documents,
    };
  } catch {
    return SEED;
  }
}
