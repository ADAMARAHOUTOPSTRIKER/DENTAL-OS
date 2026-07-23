// Clinical content helpers for the patient portal — AMO reimbursement (indicative,
// non-official demo estimates) and pre/post-op instruction sheets.
import { categorizeAct } from "./data";

export const AMO_REGIMES = ["CNOPS", "CNSS (AMO)", "CMIM", "Assurance privée", "Aucun"] as const;
export type Regime = (typeof AMO_REGIMES)[number];

// Indicative reimbursement rate by care category. NON-OFFICIAL — demo only.
const RATE: Record<string, number> = {
  conservateur: 0.7,
  detartrage: 0.8,
  ortho: 0.3,
  implant: 0.4,
  esthetique: 0, // esthetics generally not reimbursed
};

export function indicativeRate(act: string, regime: Regime): number {
  if (regime === "Aucun") return 0;
  const c = categorizeAct(act);
  const base = RATE[c.key] ?? 0.5;
  // Private insurance tends to cover a bit more; public a bit less.
  const mult = regime === "Assurance privée" ? 1.1 : regime === "CMIM" ? 1.05 : 1;
  return Math.min(0.9, base * mult);
}

// Pre/post-op instruction library, keyed by care category.
export const INSTRUCTIONS: Record<string, { before: string[]; after: string[] }> = {
  implant: {
    before: [
      "Prévenez le cabinet de tout traitement en cours (anticoagulants, bisphosphonates).",
      "Repas léger avant l'intervention ; évitez tabac et alcool 24 h avant.",
      "Prenez la prémédication éventuellement prescrite.",
    ],
    after: [
      "Mordez sur la compresse 30–60 min ; ne crachez pas, ne rincez pas le jour même.",
      "Application de froid par intermittence pour limiter l'œdème (24–48 h).",
      "Alimentation tiède et molle ; hygiène douce autour du site.",
      "Contactez le cabinet en cas de saignement persistant, fièvre ou douleur croissante.",
    ],
  },
  esthetique: {
    before: ["Évitez café, thé, tabac 24 h avant pour un meilleur résultat.", "Signalez toute sensibilité dentaire préexistante."],
    after: ["Régime « blanc » 48 h (évitez aliments et boissons colorants).", "Sensibilité passagère possible : dentifrice désensibilisant conseillé."],
  },
  ortho: {
    before: ["Brossage soigneux avant chaque rendez-vous.", "Signalez toute gêne ou élément cassé."],
    after: ["Tension normale 2–3 jours ; antalgique simple si besoin.", "Évitez aliments durs/collants ; cire orthodontique en cas d'irritation.", "Portez les élastiques comme indiqué."],
  },
  detartrage: {
    before: ["Aucune préparation particulière."],
    after: ["Sensibilité passagère possible.", "Reprenez un brossage doux et le fil dentaire dès le lendemain."],
  },
  conservateur: {
    before: ["Signalez toute allergie ou traitement en cours."],
    after: ["Attendez la fin de l'anesthésie avant de manger.", "Sensibilité au chaud/froid possible quelques jours."],
  },
};

export function instructionsFor(act: string) {
  const c = categorizeAct(act);
  const set = INSTRUCTIONS[c.key] ?? INSTRUCTIONS.conservateur;
  return { key: c.key, label: c.label, ...set };
}

// Whether an act/recall is surgical (drives the post-op follow-up card).
export function isSurgical(text: string): boolean {
  return /implant|extraction|chirurg|greffe|prothèse|couronne|pilier/i.test(text);
}

// A tailored precaution line derived from the patient's medical alerts.
export function precautionFromAlerts(alerts: string[]): string | null {
  const a = alerts.join(" ").toLowerCase();
  if (/anticoagulant/.test(a)) return "Sous anticoagulants : risque de saignement accru — à signaler avant tout acte.";
  if (/diab[eè]t/.test(a)) return "Diabète : surveillez la glycémie et la cicatrisation ; hygiène rigoureuse.";
  if (/grossesse/.test(a)) return "Grossesse : soins privilégiés au 2e trimestre ; certains médicaments à éviter.";
  if (/p[eé]nicilline|allerg/.test(a)) return "Allergie signalée : toute prescription d'antibiotique doit en tenir compte.";
  if (/pacemaker/.test(a)) return "Porteur de pacemaker : précautions avec certains appareils (bistouri électrique…).";
  if (/hypertension/.test(a)) return "Hypertension : signalez votre traitement ; contrôle de la tension recommandé.";
  return null;
}
