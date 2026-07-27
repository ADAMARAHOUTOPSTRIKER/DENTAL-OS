// Mock domain data for the Dental Clinic OS demo.
// All figures in MAD. Names are common Moroccan names. Purely fictional.
//
// Toutes les dates ci-dessous sont écrites par rapport à l'ancre du jeu de
// données (voir lib/clock.ts). Elles sont normalisées en ISO puis décalées sur
// le jour réel au bas de ce fichier : la démo ne vieillit donc jamais.

import { rebase, rebaseLoose, SEED_ANCHOR_ISO, TODAY_ISO as LIVE_TODAY } from "./clock";

export type ApptStatus =
  | "confirmed"
  | "pending"
  | "arrived"
  | "completed"
  | "cancelled"
  /** Le patient n'est pas venu et n'a pas prevenu — c'est ce que mesure le taux de no-show. */
  | "no_show";
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
  languagePreference?: "fr" | "ar" | null; // patient's preferred contact language
  intakeStatus?: "draft" | null; // 'draft' = pre-registered online, awaiting clinic validation
  recallOptIn?: boolean; // patient wants clinical recall reminders (default true)
  portalLogin?: string | null; // credentials the clinic hands to the patient for their online space
  portalPassword?: string | null; // demo only — a real product would never store this in plaintext
}

// The clinic's own WhatsApp number — patients message the cabinet here.
export const CLINIC_WHATSAPP = "+212 661 00 00 00";

export interface Appointment {
  id: string;
  patientId: string;
  patient: string;
  day: string; // ISO date "YYYY-MM-DD"
  time: string; // HH:MM
  duration: number; // minutes
  act: string;
  status: ApptStatus;
  reminderSent: boolean;
  practitioner: string;
  patientConfirmed?: boolean; // patient tapped "Je confirme ma présence" in the portal
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

const seedPatients: Patient[] = [
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
    portalLogin: "yasmine.alaoui",
    portalPassword: "demo1234",
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

const seedAppointments: Appointment[] = [
  {
    id: "a1",
    patientId: "p5",
    patient: "Nawal Fassi",
    day: "2026-07-23",
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
    day: "2026-07-23",
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
    day: "2026-07-23",
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
    day: "2026-07-23",
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
    day: "2026-07-23",
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
    day: "2026-07-23",
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
    day: "2026-07-23",
    time: "16:15",
    duration: 30,
    act: "Contrôle annuel",
    status: "confirmed",
    reminderSent: false,
    practitioner: "Dr. Bennani",
  },
];

const seedTreatmentPlans: TreatmentPlan[] = [
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
    // Devis en attente : c'est lui qui rend visible le bouton « Accepter le
    // devis » sur le compte de demonstration du portail.
    id: "t4",
    patientId: "p1",
    patient: "Yasmine Alaoui",
    createdAt: "2026-07-21",
    status: "proposed",
    lines: [
      { tooth: "36", act: "Composite (carie occlusale)", price: 650 },
      { tooth: "—", act: "Gouttière de contention", price: 1900 },
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

const seedPayments: Payment[] = [
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
  /** Échéance en ISO — l'étiquette (« Demain », « Dans 3 jours ») est calculée à l'affichage. */
  due: string;
  reminderSent: boolean;
}
const seedRecalls: Recall[] = [
  { patientId: "p4", patient: "Omar Idrissi", reason: "Détartrage 6 mois", due: "2026-07-26", reminderSent: false },
  { patientId: "p1", patient: "Yasmine Alaoui", reason: "Contrôle ortho", due: "2026-07-24", reminderSent: false },
  { patientId: "p8", patient: "Adam Alaoui", reason: "Contrôle annuel", due: "2026-07-27", reminderSent: false },
  { patientId: "p2", patient: "Mehdi Benali", reason: "Suivi implant", due: "2026-07-29", reminderSent: true },
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



// ===== Documents (patient-linked imaging / files vault) =====
/**
 * La categorie d'un document est du texte libre.
 *
 * Trois familles sont connues d'avance (radio, photo, document) : elles ont
 * leur icone et leur traduction. Mais un cabinet range aussi des « Devis »,
 * des « Ordonnances », des « Empreintes 3D »… Lui imposer une liste fermee
 * reviendrait a lui demander de plier son organisation a la notre.
 */
export type DocCategory = string;

export const DOC_CATEGORIES = ["xray", "photo", "doc"] as const;
export type KnownDocCategory = (typeof DOC_CATEGORIES)[number];

export function isKnownCategory(c: string): c is KnownDocCategory {
  return (DOC_CATEGORIES as readonly string[]).includes(c);
}

/** Traduite si c'est une des trois familles, sinon rendue telle que saisie. */
export function catLabel(c: string, t: (k: string) => string) {
  return isKnownCategory(c) ? t(`cat.${c}`) : c;
}
export interface DocFile {
  name: string;
  kind: "image" | "pdf" | "file";
  dataUrl?: string; // in-session preview / persisted small asset
}
export interface ClinicDocument {
  id: string;
  patientId: string;
  patient: string;
  title: string;
  category: DocCategory;
  files: DocFile[];
  createdAt: string;
  /**
   * Nature du document, portee par la donnee et non par son libelle.
   *
   * Le portail deduisait auparavant « ceci est un consentement » en cherchant
   * le mot dans le titre : en arabe le titre change, et la signature
   * electronique disparaissait purement et simplement de l'ecran.
   */
  kind?: "consent" | "consent-signed" | "prescription" | null;
}

const seedDocuments: ClinicDocument[] = [
  { id: "d1", patientId: "p10", patient: "Youssef Berrada", title: "Radio panoramique — implant 16", category: "xray", createdAt: "30 Jun 2026", files: [{ name: "panoramique-16.jpg", kind: "image" }] },
  { id: "d2", patientId: "p10", patient: "Youssef Berrada", title: "Consentement — implant", category: "doc", kind: "consent", createdAt: "30 Jun 2026", files: [{ name: "consentement-implant.pdf", kind: "pdf" }] },
  { id: "d3", patientId: "p2", patient: "Mehdi Benali", title: "Rétro-alvéolaire 16", category: "xray", createdAt: "02 Jul 2026", files: [{ name: "retro-16.jpg", kind: "image" }] },
  { id: "d4", patientId: "p3", patient: "Salma Cherkaoui", title: "Blanchiment — avant / après", category: "photo", createdAt: "20 Jul 2026", files: [{ name: "avant.jpg", kind: "image" }, { name: "apres.jpg", kind: "image" }] },
  { id: "d5", patientId: "p3", patient: "Salma Cherkaoui", title: "Radio panoramique", category: "xray", createdAt: "18 May 2026", files: [{ name: "panoramique.jpg", kind: "image" }] },
  { id: "d6", patientId: "p1", patient: "Yasmine Alaoui", title: "Facette 21 — avant / après", category: "photo", createdAt: "12 Jun 2026", files: [{ name: "facette-avant.jpg", kind: "image" }, { name: "facette-apres.jpg", kind: "image" }] },
  { id: "d7", patientId: "p1", patient: "Yasmine Alaoui", title: "Devis orthodontie", category: "doc", createdAt: "12 Jun 2026", files: [{ name: "devis-orthodontie.pdf", kind: "pdf" }] },
  { id: "d8", patientId: "p5", patient: "Nawal Fassi", title: "Ordonnance — amoxicilline", category: "doc", kind: "prescription", createdAt: "09 Jul 2026", files: [{ name: "ordonnance-amoxicilline.pdf", kind: "pdf" }] },
  { id: "d9", patientId: "p1", patient: "Yasmine Alaoui", title: "Consentement — gouttière de contention", category: "doc", kind: "consent", createdAt: "2026-07-21", files: [{ name: "consentement-gouttiere.pdf", kind: "pdf" }] },
];

// ===== Live-analytics helpers =====
// Bucket a treatment act into a revenue category (drives the live acts donut).
export const ACT_CATEGORIES: { key: string; label: string; color: string; re: RegExp }[] = [
  { key: "ortho", label: "Orthodontie", color: "#14a89a", re: /ortho|bague|gouttière|aligneur/i },
  { key: "implant", label: "Implants / Prothèse", color: "#0f6e68", re: /implant|prothèse|couronne|pilier|bridge|pilier/i },
  { key: "esthetique", label: "Esthétique", color: "#ffa02e", re: /blanchiment|facette|esthé/i },
  { key: "detartrage", label: "Détartrage", color: "#96ebe0", re: /détartrage|contrôle|scaling/i },
  { key: "conservateur", label: "Soins conservateurs", color: "#2ec4b6", re: /.*/ },
];

export function categorizeAct(act: string) {
  return ACT_CATEGORIES.find((c) => c.re.test(act)) ?? ACT_CATEGORIES[ACT_CATEGORIES.length - 1];
}

/* ================================================================== */
/* Patientèle de fond                                                  */
/* ================================================================== */
/*
 * Les dix dossiers écrits plus haut sont ceux qu'on ouvre pendant une
 * démonstration : ils ont une alerte médicale, une famille, une histoire.
 *
 * Mais un cabinet installé suit des centaines de patients, et des indicateurs
 * calculés sur dix dossiers affichent 9 000 MAD de chiffre d'affaires mensuel
 * et « 10 patients actifs » — des chiffres auxquels aucun dentiste ne croit,
 * et qui décrédibilisent tout le reste de l'écran.
 *
 * On ajoute donc une patientèle de fond, tirée de façon déterministe : la même
 * suite à chaque chargement, pour que le serveur et le navigateur affichent
 * exactement les mêmes nombres. Ces dossiers portent les volumes ; les
 * histoires, elles, restent écrites à la main.
 */

const MS_DAY = 86_400_000;
const ANCHOR_MS = Date.parse(SEED_ANCHOR_ISO + "T00:00:00Z");
/** Date ISO située `days` jours avant l'ancre (négatif = après). */
const isoBefore = (days: number) => new Date(ANCHOR_MS - days * MS_DAY).toISOString().slice(0, 10);

/** Générateur pseudo-aléatoire à graine fixe (mulberry32). */
function seededRandom(seed: number) {
  return function next() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST_F = ["Fatima", "Khadija", "Meryem", "Sanaa", "Imane", "Zineb", "Hanane", "Loubna", "Asmae", "Ghita", "Nada", "Sara", "Rim", "Wafa", "Chaimae", "Soukaina", "Amal", "Ikram", "Btissam", "Doha"];
const FIRST_M = ["Mohamed", "Youssef", "Anas", "Reda", "Hamza", "Ayoub", "Ilyas", "Othmane", "Bilal", "Zakaria", "Ismail", "Amine", "Nabil", "Rachid", "Hicham", "Tarik", "Yassine", "Soufiane", "Marouane", "Khalil"];
const LAST = ["Alami", "Bennis", "Chraibi", "Daoudi", "El Khattabi", "Fassi", "Guessous", "Haddadi", "Ibrahimi", "Jouahri", "Kabbaj", "Lahlou", "Mansouri", "Naciri", "Ouazzani", "Rhrib", "Sekkat", "Tahiri", "Zouiten", "Bouhlal", "Sbai", "Mrini", "Benjelloun", "Amrani"];
const CITIES = ["Casablanca", "Casablanca", "Casablanca", "Mohammedia", "Rabat", "Salé", "Marrakech", "Fès", "Tanger", "Agadir"];
const BG_ACTS: { act: string; min: number; max: number }[] = [
  { act: "Détartrage", min: 350, max: 500 },
  { act: "Contrôle annuel", min: 250, max: 400 },
  { act: "Composite", min: 500, max: 900 },
  { act: "Traitement de racine", min: 1400, max: 2200 },
  { act: "Couronne céramique", min: 3200, max: 4200 },
  { act: "Implant titane", min: 6800, max: 8500 },
  { act: "Blanchiment", min: 1800, max: 2800 },
  { act: "Extraction", min: 400, max: 900 },
  { act: "Orthodontie — mensualité", min: 300, max: 600 },
  { act: "Prothèse amovible", min: 3500, max: 5200 },
];
const METHODS: Payment["method"][] = ["cash", "cash", "card", "card", "cheque", "transfer"];

function buildBackgroundCohort() {
  const rnd = seededRandom(20260723);
  const pick = <T,>(list: T[]) => list[Math.floor(rnd() * list.length)];
  const between = (min: number, max: number) => min + Math.floor(rnd() * (max - min + 1));

  const bgPatients: Patient[] = [];
  const bgPayments: Payment[] = [];
  const bgAppointments: Appointment[] = [];

  for (let i = 0; i < 240; i++) {
    const female = rnd() < 0.54;
    const name = `${pick(female ? FIRST_F : FIRST_M)} ${pick(LAST)}`;
    const id = `bg${i + 1}`;
    const balance = rnd() < 0.68 ? 0 : between(2, 58) * 100;
    // Un tiers de la patientèle a un rendez-vous à venir dans les six semaines.
    const upcoming = rnd() < 0.32 ? isoBefore(-between(1, 42)) : null;

    bgPatients.push({
      id,
      name,
      age: between(6, 78),
      gender: female ? "F" : "M",
      phone: `+212 6${between(60, 69)} ${between(10, 99)} ${between(10, 99)} ${between(10, 99)}`,
      city: pick(CITIES),
      lastVisit: isoBefore(between(2, 340)),
      nextVisit: upcoming,
      balance,
      status: balance === 0 ? "paid" : balance > 2500 ? "unpaid" : "partial",
      alerts: [],
      family: [],
      tags: [],
    });

    // Deux à quatre encaissements sur les sept derniers mois, un peu plus
    // denses récemment : c'est ce qui donne à la courbe sa pente.
    const count = between(2, 4);
    for (let k = 0; k < count; k++) {
      const spec = pick(BG_ACTS);
      const daysAgo = Math.floor(Math.pow(rnd(), 1.25) * 205);
      bgPayments.push({
        id: `bgy${i}_${k}`,
        patientId: id,
        patient: name,
        date: isoBefore(daysAgo),
        amount: between(spec.min, spec.max),
        method: pick(METHODS),
        act: spec.act,
      });
    }

    // Historique de rendez-vous : c'est lui qui fait vivre le taux de no-show.
    const past = between(1, 3);
    for (let k = 0; k < past; k++) {
      const daysAgo = between(3, 88);
      const roll = rnd();
      bgAppointments.push({
        id: `bga${i}_${k}`,
        patientId: id,
        patient: name,
        day: isoBefore(daysAgo),
        time: `${String(between(9, 17)).padStart(2, "0")}:${rnd() < 0.5 ? "00" : "30"}`,
        duration: pick([30, 30, 45, 60]),
        act: pick(BG_ACTS).act,
        status: roll < 0.055 ? "no_show" : roll < 0.09 ? "cancelled" : "completed",
        reminderSent: true,
        practitioner: pick(PRACTITIONERS),
      });
    }

    // Les jours qui viennent doivent être remplis, sinon la vue semaine de
    // l'agenda est vide dès qu'on quitte aujourd'hui.
    if (upcoming && upcoming < isoBefore(-8)) {
      bgAppointments.push({
        id: `bgn${i}`,
        patientId: id,
        patient: name,
        day: upcoming,
        time: `${String(between(9, 16)).padStart(2, "0")}:${rnd() < 0.5 ? "00" : "30"}`,
        duration: pick([30, 30, 45, 60]),
        act: pick(BG_ACTS).act,
        status: rnd() < 0.75 ? "confirmed" : "pending",
        reminderSent: rnd() < 0.7,
        practitioner: pick(PRACTITIONERS),
      });
    }
  }

  return { bgPatients, bgPayments, bgAppointments };
}

const COHORT = buildBackgroundCohort();

/* ================================================================== */
/* Normalisation : tout en ISO, tout décalé sur le jour réel           */
/* ================================================================== */
/*
 * Les tableaux `seed*` ci-dessus sont écrits par rapport à l'ancre. Ici on
 * les relit une seule fois pour (1) ramener les vieilles étiquettes anglaises
 * (« 30 Jun 2026 ») en ISO et (2) les décaler du nombre de jours qui sépare
 * l'ancre d'aujourd'hui. Le rendu, lui, remet la date en français ou en arabe
 * via isoToLabel().
 */

const keep = (value: string, fallback: string) => rebaseLoose(value) ?? fallback;

export const patients: Patient[] = [...seedPatients, ...COHORT.bgPatients].map((p) => ({
  ...p,
  lastVisit: keep(p.lastVisit, p.lastVisit),
  nextVisit: p.nextVisit ? rebaseLoose(p.nextVisit) : null,
}));

export const todaysAppointments: Appointment[] = [...seedAppointments, ...COHORT.bgAppointments].map((a) => ({
  ...a,
  day: rebase(a.day),
}));

export const treatmentPlans: TreatmentPlan[] = seedTreatmentPlans.map((t) => ({
  ...t,
  createdAt: keep(t.createdAt, t.createdAt),
}));

export const payments: Payment[] = [...seedPayments, ...COHORT.bgPayments].map((p) => ({
  ...p,
  date: keep(p.date, p.date),
}));

export const recalls: Recall[] = seedRecalls.map((r) => ({
  ...r,
  due: keep(r.due, r.due),
}));

export const documents: ClinicDocument[] = seedDocuments.map((d) => ({
  ...d,
  createdAt: keep(d.createdAt, d.createdAt),
}));

/** Le jour courant, réel. Réexporté ici pour que les écrans n'aient qu'un import. */
export const TODAY_ISO = LIVE_TODAY;
