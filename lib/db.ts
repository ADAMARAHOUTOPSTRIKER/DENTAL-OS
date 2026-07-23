import { supabase } from "./supabase";
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
      lastVisit: r.last_visit,
      nextVisit: r.next_visit,
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
      day: r.day ?? "2026-07-23",
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
      createdAt: r.created_at,
      status: r.status,
      lines: linesByPlan.get(r.id) ?? [],
    }));

    const payments: Payment[] = (payRes.data ?? []).map((r: any) => ({
      id: r.id,
      patientId: r.patient_id,
      patient: r.patient,
      date: r.date,
      amount: r.amount,
      method: r.method,
      act: r.act,
    }));

    const recalls: Recall[] = (rRes.data ?? []).map((r: any) => ({
      patientId: r.patient_id,
      patient: r.patient,
      reason: r.reason,
      due: r.due,
      reminderSent: r.reminder_sent,
    }));

    const documents: ClinicDocument[] = (dRes.data ?? []).map((r: any) => ({
      id: r.id,
      patientId: r.patient_id,
      patient: r.patient,
      title: r.title,
      category: r.category,
      files: Array.isArray(r.files) ? r.files : [],
      createdAt: r.created_at,
    }));

    // If a table came back empty for any reason, prefer seed for that slice.
    return {
      patients: patients.length ? patients : SEED.patients,
      appointments: appointments.length ? appointments : SEED.appointments,
      treatmentPlans: treatmentPlans.length ? treatmentPlans : SEED.treatmentPlans,
      payments: payments.length ? payments : SEED.payments,
      recalls: recalls.length ? recalls : SEED.recalls,
      documents: documents.length ? documents : SEED.documents,
    };
  } catch {
    return SEED;
  }
}
