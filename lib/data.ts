// Mock domain data for the Dental Clinic OS demo.
// All figures in MAD. Names are common Moroccan names. Purely fictional.

export type ApptStatus =
  | "confirmed"
  | "pending"
  | "arrived"
  | "completed"
  | "cancelled";
export type PayStatus = "paid" | "partial" | "unpaid";
export type PlanStatus = "accepted" | "proposed";

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: "M" | "F";
  phone: string;
  city: string;
  lastVisit: string;
  nextVisit: string | null;
  balance: number; // outstanding MAD
  status: PayStatus;
  alerts: string[];
  family: string[]; // patient ids
  tags: string[];
}

export interface Appointment {
  id: string;
  patientId: string;
  patient: string;
  time: string; // HH:MM
  duration: number; // minutes
  act: string;
  status: ApptStatus;
  reminderSent: boolean;
  practitioner: string;
}

export interface PlanLine {
  tooth: string;
  act: string;
  price: number;
}
export interface TreatmentPlan {
  id: string;
  patientId: string;
  patient: string;
  createdAt: string;
  status: PlanStatus;
  lines: PlanLine[];
}

export interface Payment {
  id: string;
  patientId: string;
  patient: string;
  date: string;
  amount: number;
  method: "cash" | "card" | "cheque" | "transfer";
  act: string;
}

export const PRACTITIONERS = ["Dr. Bennani", "Dr. El Amrani"];

export const patients: Patient[] = [
  {
    id: "p1",
    name: "Yasmine Alaoui",
    age: 34,
    gender: "F",
    phone: "+212 661 20 44 18",
    city: "Casablanca",
    lastVisit: "12 Jun 2026",
    nextVisit: "24 Jul 2026",
    balance: 1200,
    status: "partial",
    alerts: ["Allergie pénicilline"],
    family: ["p7", "p8"],
    tags: ["Ortho", "Fidèle"],
  },
  {
    id: "p2",
    name: "Mehdi Benali",
    age: 41,
    gender: "M",
    phone: "+212 662 55 09 71",
    city: "Casablanca",
    lastVisit: "02 Jul 2026",
    nextVisit: "23 Jul 2026",
    balance: 0,
    status: "paid",
    alerts: ["Diabète type 2"],
    family: [],
    tags: ["Implant"],
  },
  {
    id: "p3",
    name: "Salma Cherkaoui",
    age: 28,
    gender: "F",
    phone: "+212 663 71 32 55",
    city: "Rabat",
    lastVisit: "18 May 2026",
    nextVisit: "23 Jul 2026",
    balance: 3400,
    status: "unpaid",
    alerts: [],
    family: [],
    tags: ["Blanchiment"],
  },
  {
    id: "p4",
    name: "Omar Idrissi",
    age: 52,
    gender: "M",
    phone: "+212 661 04 88 12",
    city: "Casablanca",
    lastVisit: "28 Jun 2026",
    nextVisit: null,
    balance: 0,
    status: "paid",
    alerts: ["Anticoagulants", "Hypertension"],
    family: [],
    tags: ["Prothèse"],
  },
  {
    id: "p5",
    name: "Nawal Fassi",
    age: 39,
    gender: "F",
    phone: "+212 662 33 90 47",
    city: "Fès",
    lastVisit: "09 Jul 2026",
    nextVisit: "23 Jul 2026",
    balance: 800,
    status: "partial",
    alerts: [],
    family: [],
    tags: ["Détartrage"],
  },
  {
    id: "p6",
    name: "Karim Tazi",
    age: 45,
    gender: "M",
    phone: "+212 663 12 76 30",
    city: "Casablanca",
    lastVisit: "15 Apr 2026",
    nextVisit: "24 Jul 2026",
    balance: 0,
    status: "paid",
    alerts: [],
    family: [],
    tags: ["Contrôle"],
  },
  {
    id: "p7",
    name: "Lina Alaoui",
    age: 9,
    gender: "F",
    phone: "+212 661 20 44 18",
    city: "Casablanca",
    lastVisit: "12 Jun 2026",
    nextVisit: "24 Jul 2026",
    balance: 0,
    status: "paid",
    alerts: [],
    family: ["p1"],
    tags: ["Enfant", "Ortho"],
  },
  {
    id: "p8",
    name: "Adam Alaoui",
    age: 12,
    gender: "M",
    phone: "+212 661 20 44 18",
    city: "Casablanca",
    lastVisit: "12 Jun 2026",
    nextVisit: null,
    balance: 0,
    status: "paid",
    alerts: [],
    family: ["p1"],
    tags: ["Enfant"],
  },
  {
    id: "p9",
    name: "Hajar Bouazza",
    age: 31,
    gender: "F",
    phone: "+212 662 88 41 09",
    city: "Marrakech",
    lastVisit: "20 Jun 2026",
    nextVisit: "25 Jul 2026",
    balance: 2100,
    status: "partial",
    alerts: ["Grossesse (2e trimestre)"],
    family: [],
    tags: ["Suivi"],
  },
  {
    id: "p10",
    name: "Youssef Berrada",
    age: 60,
    gender: "M",
    phone: "+212 661 55 27 63",
    city: "Casablanca",
    lastVisit: "30 Jun 2026",
    nextVisit: "28 Jul 2026",
    balance: 5600,
    status: "unpaid",
    alerts: ["Pacemaker"],
    family: [],
    tags: ["Implant", "Prothèse"],
  },
];

export const patientById = (id: string) => patients.find((p) => p.id === id);

export const todaysAppointments: Appointment[] = [
  {
    id: "a1",
    patientId: "p5",
    patient: "Nawal Fassi",
    time: "09:00",
    duration: 30,
    act: "Détartrage",
    status: "completed",
    reminderSent: true,
    practitioner: "Dr. Bennani",
  },
  {
    id: "a2",
    patientId: "p3",
    patient: "Salma Cherkaoui",
    time: "09:45",
    duration: 45,
    act: "Blanchiment — séance 1",
    status: "arrived",
    reminderSent: true,
    practitioner: "Dr. Bennani",
  },
  {
    id: "a3",
    patientId: "p2",
    patient: "Mehdi Benali",
    time: "10:45",
    duration: 60,
    act: "Pose implant (pilier)",
    status: "confirmed",
    reminderSent: true,
    practitioner: "Dr. El Amrani",
  },
  {
    id: "a4",
    patientId: "p1",
    patient: "Yasmine Alaoui",
    time: "11:30",
    duration: 30,
    act: "Contrôle orthodontie",
    status: "confirmed",
    reminderSent: false,
    practitioner: "Dr. Bennani",
  },
  {
    id: "a5",
    patientId: "p9",
    patient: "Hajar Bouazza",
    time: "14:00",
    duration: 30,
    act: "Consultation",
    status: "pending",
    reminderSent: false,
    practitioner: "Dr. El Amrani",
  },
  {
    id: "a6",
    patientId: "p10",
    patient: "Youssef Berrada",
    time: "15:00",
    duration: 60,
    act: "Empreinte prothèse",
    status: "confirmed",
    reminderSent: true,
    practitioner: "Dr. El Amrani",
  },
  {
    id: "a7",
    patientId: "p6",
    patient: "Karim Tazi",
    time: "16:15",
    duration: 30,
    act: "Contrôle annuel",
    status: "confirmed",
    reminderSent: false,
    practitioner: "Dr. Bennani",
  },
];

export const treatmentPlans: TreatmentPlan[] = [
  {
    id: "t1",
    patientId: "p10",
    patient: "Youssef Berrada",
    createdAt: "30 Jun 2026",
    status: "proposed",
    lines: [
      { tooth: "16", act: "Implant titane", price: 7500 },
      { tooth: "16", act: "Couronne céramique", price: 3800 },
      { tooth: "—", act: "Radio panoramique", price: 400 },
    ],
  },
  {
    id: "t2",
    patientId: "p3",
    patient: "Salma Cherkaoui",
    createdAt: "18 May 2026",
    status: "accepted",
    lines: [
      { tooth: "—", act: "Blanchiment (2 séances)", price: 2800 },
      { tooth: "21", act: "Facette composite", price: 1600 },
    ],
  },
  {
    id: "t3",
    patientId: "p1",
    patient: "Yasmine Alaoui",
    createdAt: "12 Jun 2026",
    status: "accepted",
    lines: [
      { tooth: "—", act: "Traitement orthodontique (bagues)", price: 18000 },
      { tooth: "—", act: "Contrôles mensuels (12)", price: 3600 },
    ],
  },
];

export const payments: Payment[] = [
  { id: "y1", patientId: "p5", patient: "Nawal Fassi", date: "23 Jul", amount: 400, method: "cash", act: "Détartrage" },
  { id: "y2", patientId: "p2", patient: "Mehdi Benali", date: "23 Jul", amount: 3800, method: "card", act: "Couronne" },
  { id: "y3", patientId: "p1", patient: "Yasmine Alaoui", date: "22 Jul", amount: 300, method: "cash", act: "Ortho — mensualité" },
  { id: "y4", patientId: "p6", patient: "Karim Tazi", date: "22 Jul", amount: 350, method: "cheque", act: "Contrôle" },
  { id: "y5", patientId: "p9", patient: "Hajar Bouazza", date: "21 Jul", amount: 900, method: "transfer", act: "Consultation + radio" },
  { id: "y6", patientId: "p3", patient: "Salma Cherkaoui", date: "20 Jul", amount: 1400, method: "card", act: "Blanchiment séance 1" },
  { id: "y7", patientId: "p10", patient: "Youssef Berrada", date: "19 Jul", amount: 2000, method: "cheque", act: "Acompte implant" },
];

export interface Recall {
  patientId: string;
  patient: string;
  reason: string;
  due: string;
  reminderSent: boolean;
}
export const recalls: Recall[] = [
  { patientId: "p4", patient: "Omar Idrissi", reason: "Détartrage 6 mois", due: "Cette semaine", reminderSent: false },
  { patientId: "p1", patient: "Yasmine Alaoui", reason: "Contrôle ortho", due: "Demain", reminderSent: false },
  { patientId: "p8", patient: "Adam Alaoui", reason: "Contrôle annuel", due: "3 jours", reminderSent: false },
  { patientId: "p2", patient: "Mehdi Benali", reason: "Suivi implant", due: "5 jours", reminderSent: true },
];

// Analytics series
export const revenueTrend = [
  { m: "Jan", v: 168 },
  { m: "Fév", v: 182 },
  { m: "Mar", v: 175 },
  { m: "Avr", v: 201 },
  { m: "Mai", v: 224 },
  { m: "Jun", v: 238 },
  { m: "Jul", v: 262 },
];

export const actsMix = [
  { name: "Soins conservateurs", value: 34, color: "#2ec4b6" },
  { name: "Orthodontie", value: 26, color: "#14a89a" },
  { name: "Implants / Prothèse", value: 22, color: "#0f6e68" },
  { name: "Esthétique", value: 11, color: "#ffa02e" },
  { name: "Détartrage", value: 7, color: "#96ebe0" },
];

export const weeklyLoad = [
  { d: "Lun", v: 18 },
  { d: "Mar", v: 22 },
  { d: "Mer", v: 15 },
  { d: "Jeu", v: 24 },
  { d: "Ven", v: 20 },
  { d: "Sam", v: 12 },
];

export const kpis = {
  revenue: 262000,
  revenueDelta: 10.1,
  appointments: 111,
  appointmentsDelta: 6,
  noShow: 4.2,
  noShowDelta: -1.8,
  acceptance: 78,
  acceptanceDelta: 5,
  activePatients: 1284,
  pendingPayments: 12900,
  dueToday: 2450,
};

// Calendar grid slots for the week view
export const calendarSlots = todaysAppointments;
