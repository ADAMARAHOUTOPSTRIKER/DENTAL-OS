import { jsPDF } from "jspdf";
import type { Patient, TreatmentPlan, Payment, ClinicDocument } from "./data";

const TEAL: [number, number, number] = [46, 196, 182];
const INK: [number, number, number] = [8, 34, 46];
const MUTE: [number, number, number] = [110, 130, 138];

function fmtMad(n: number) {
  return new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 0 }).format(n);
}

export interface DevisResult {
  filename: string;
  dataUrl: string; // data:application/pdf;...
  blob: Blob;
}

/**
 * Render a clean, professional dental quote (devis) as a PDF.
 * Returns both a Blob (for download) and a data URL (to persist to the
 * patient's document vault so it's downloadable from their portal).
 */
export function generateDevisPDF(
  plan: TreatmentPlan,
  patient: Patient | undefined,
  opts?: { clinic?: string; practitioner?: string; date?: string }
): DevisResult {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const clinic = opts?.clinic ?? "Cabinet Dentaire DentalOS";
  const practitioner = opts?.practitioner ?? "Dr. Bennani";
  const date = opts?.date ?? plan.createdAt;
  const ref = `DEV-${plan.id.toUpperCase()}-${(patient?.id ?? "").toUpperCase()}`;

  // ---- Header band ----
  doc.setFillColor(...INK);
  doc.rect(0, 0, W, 34, "F");
  doc.setFillColor(...TEAL);
  doc.rect(0, 34, W, 1.6, "F");

  // Logo mark
  doc.setFillColor(...TEAL);
  doc.roundedRect(14, 10, 14, 14, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("D", 21, 19.6, { align: "center" });

  doc.setFontSize(15);
  doc.text(clinic, 32, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize?.(9);
  doc.setFontSize(9);
  doc.setTextColor(190, 205, 210);
  doc.text("Casablanca, Maroc  ·  +212 5 22 00 00 00  ·  contact@dentalos.ma", 32, 22);

  // ---- Title block ----
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("DEVIS", 14, 50);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...MUTE);
  doc.text(`Référence : ${ref}`, W - 14, 44, { align: "right" });
  doc.text(`Date : ${date}`, W - 14, 49.5, { align: "right" });
  doc.text(`Praticien : ${practitioner}`, W - 14, 55, { align: "right" });

  // ---- Patient box ----
  const boxY = 60;
  doc.setDrawColor(230, 234, 236);
  doc.setFillColor(250, 251, 251);
  doc.roundedRect(14, boxY, W - 28, 22, 2.5, 2.5, "FD");
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTE);
  doc.text("PATIENT", 19, boxY + 7);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...INK);
  doc.text(patient?.name ?? plan.patient, 19, boxY + 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTE);
  const meta = [
    patient?.phone,
    patient?.city,
    patient ? `${patient.age} ans` : null,
  ]
    .filter(Boolean)
    .join("   ·   ");
  if (meta) doc.text(meta, 19, boxY + 19);

  // ---- Table header ----
  let y = boxY + 34;
  doc.setFillColor(...INK);
  doc.roundedRect(14, y - 6, W - 28, 9, 1.5, 1.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("DENT", 19, y);
  doc.text("ACTE", 36, y);
  doc.text("PRIX (MAD)", W - 19, y, { align: "right" });

  // ---- Table rows ----
  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const total = plan.lines.reduce((s, l) => s + l.price, 0);
  plan.lines.forEach((l, i) => {
    if (i % 2 === 1) {
      doc.setFillColor(247, 249, 249);
      doc.rect(14, y - 5.5, W - 28, 9, "F");
    }
    doc.setTextColor(...INK);
    doc.text(l.tooth && l.tooth !== "—" ? l.tooth : "—", 19, y);
    doc.text(l.act, 36, y, { maxWidth: W - 70 });
    doc.text(`${fmtMad(l.price)}`, W - 19, y, { align: "right" });
    y += 9;
  });

  // ---- Total ----
  y += 2;
  doc.setDrawColor(...TEAL);
  doc.setLineWidth(0.5);
  doc.line(W - 90, y, W - 14, y);
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...INK);
  doc.text("TOTAL DU DEVIS", W - 90, y);
  doc.setTextColor(...TEAL);
  doc.setFontSize(14);
  doc.text(`${fmtMad(total)} MAD`, W - 14, y, { align: "right" });

  // ---- Notes / validity ----
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTE);
  doc.text(
    "Devis valable 30 jours. Les soins peuvent être réglés en plusieurs échéances (espèces, chèque, carte ou virement).",
    14,
    y,
    { maxWidth: W - 28 }
  );
  y += 6;
  doc.text(
    "Ce document est un devis estimatif et ne constitue pas une facture. Une partie des soins peut être prise en charge par votre mutuelle / AMO.",
    14,
    y,
    { maxWidth: W - 28 }
  );

  // ---- Signatures ----
  y += 20;
  doc.setDrawColor(210, 216, 219);
  doc.line(20, y, 80, y);
  doc.line(W - 80, y, W - 20, y);
  doc.setFontSize(8.5);
  doc.text("Signature du patient", 20, y + 5);
  doc.text("Cachet du cabinet", W - 80, y + 5);

  // ---- Footer ----
  const fy = doc.internal.pageSize.getHeight() - 12;
  doc.setDrawColor(235, 238, 239);
  doc.line(14, fy - 4, W - 14, fy - 4);
  doc.setFontSize(8);
  doc.setTextColor(...MUTE);
  doc.text("DentalOS — Le système d'exploitation de votre cabinet dentaire", W / 2, fy, {
    align: "center",
  });

  const filename = `Devis-${(patient?.name ?? plan.patient).replace(/\s+/g, "-")}.pdf`;
  const blob = doc.output("blob");
  const dataUrl = doc.output("datauristring");
  return { filename, dataUrl, blob };
}

const METHOD_FR: Record<Payment["method"], string> = {
  cash: "Espèces",
  card: "Carte bancaire",
  cheque: "Chèque",
  transfer: "Virement",
};

/**
 * Render a clean payment RECEIPT (reçu) as a PDF — mirrors the devis styling.
 * Not a fiscal invoice; a proof-of-payment the patient can download/keep.
 */
export function generateReceiptPDF(
  payment: Payment,
  patient: Patient | undefined,
  opts?: { clinic?: string; balanceAfter?: number }
): DevisResult {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const clinic = opts?.clinic ?? "Cabinet Dentaire DentalOS";
  const ref = `RECU-${payment.id.toUpperCase()}`;

  // ---- Header band ----
  doc.setFillColor(...INK);
  doc.rect(0, 0, W, 34, "F");
  doc.setFillColor(...TEAL);
  doc.rect(0, 34, W, 1.6, "F");
  doc.setFillColor(...TEAL);
  doc.roundedRect(14, 10, 14, 14, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("D", 21, 19.6, { align: "center" });
  doc.setFontSize(15);
  doc.text(clinic, 32, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(190, 205, 210);
  doc.text("Casablanca, Maroc  ·  +212 5 22 00 00 00  ·  contact@dentalos.ma", 32, 22);

  // ---- Title ----
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("REÇU DE PAIEMENT", 14, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...MUTE);
  doc.text(`Référence : ${ref}`, W - 14, 44, { align: "right" });
  doc.text(`Date : ${payment.date}`, W - 14, 49.5, { align: "right" });

  // ---- Patient box ----
  const boxY = 60;
  doc.setDrawColor(230, 234, 236);
  doc.setFillColor(250, 251, 251);
  doc.roundedRect(14, boxY, W - 28, 22, 2.5, 2.5, "FD");
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTE);
  doc.text("REÇU DE", 19, boxY + 7);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...INK);
  doc.text(patient?.name ?? payment.patient, 19, boxY + 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTE);
  const meta = [patient?.phone, patient?.city].filter(Boolean).join("   ·   ");
  if (meta) doc.text(meta, 19, boxY + 19);

  // ---- Amount hero ----
  let y = boxY + 40;
  doc.setFillColor(...INK);
  doc.roundedRect(14, y - 10, W - 28, 30, 3, 3, "F");
  doc.setTextColor(190, 205, 210);
  doc.setFontSize(9);
  doc.text("MONTANT REÇU", 22, y - 1);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text(`${fmtMad(payment.amount)} MAD`, 22, y + 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(190, 205, 210);
  doc.text(METHOD_FR[payment.method], W - 22, y - 1, { align: "right" });
  if (payment.act) doc.text(payment.act, W - 22, y + 11, { align: "right", maxWidth: 80 });

  // ---- Balance line ----
  y += 34;
  if (typeof opts?.balanceAfter === "number") {
    doc.setDrawColor(230, 234, 236);
    doc.setFillColor(250, 251, 251);
    doc.roundedRect(14, y - 6, W - 28, 12, 2, 2, "FD");
    doc.setTextColor(...MUTE);
    doc.setFontSize(9.5);
    doc.text("Solde restant après ce paiement", 19, y + 1.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...(opts.balanceAfter > 0 ? MUTE : TEAL));
    doc.text(`${fmtMad(opts.balanceAfter)} MAD`, W - 19, y + 1.5, { align: "right" });
    doc.setFont("helvetica", "normal");
    y += 16;
  }

  // ---- Note ----
  y += 6;
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTE);
  doc.text(
    "Ce reçu atteste d'un paiement encaissé par le cabinet. Il ne constitue pas une facture fiscale.",
    14,
    y,
    { maxWidth: W - 28 }
  );

  // ---- Footer ----
  const fy = doc.internal.pageSize.getHeight() - 12;
  doc.setDrawColor(235, 238, 239);
  doc.line(14, fy - 4, W - 14, fy - 4);
  doc.setFontSize(8);
  doc.setTextColor(...MUTE);
  doc.text("DentalOS — Le système d'exploitation de votre cabinet dentaire", W / 2, fy, {
    align: "center",
  });

  const filename = `Recu-${(patient?.name ?? payment.patient).replace(/\s+/g, "-")}-${payment.id}.pdf`;
  const blob = doc.output("blob");
  const dataUrl = doc.output("datauristring");
  return { filename, dataUrl, blob };
}

function header(doc: jsPDF, W: number, clinic: string) {
  doc.setFillColor(...INK);
  doc.rect(0, 0, W, 34, "F");
  doc.setFillColor(...TEAL);
  doc.rect(0, 34, W, 1.6, "F");
  doc.setFillColor(...TEAL);
  doc.roundedRect(14, 10, 14, 14, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("D", 21, 19.6, { align: "center" });
  doc.setFontSize(15);
  doc.text(clinic, 32, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(190, 205, 210);
  doc.text("Casablanca, Maroc  ·  +212 5 22 00 00 00  ·  contact@dentalos.ma", 32, 22);
}

function patientBox(doc: jsPDF, W: number, y: number, patient: Patient | undefined, label = "PATIENT") {
  doc.setDrawColor(230, 234, 236);
  doc.setFillColor(250, 251, 251);
  doc.roundedRect(14, y, W - 28, 22, 2.5, 2.5, "FD");
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTE);
  doc.text(label, 19, y + 7);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...INK);
  doc.text(patient?.name ?? "—", 19, y + 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTE);
  const meta = [patient?.phone, patient?.city, patient ? `${patient.age} ans` : null].filter(Boolean).join("   ·   ");
  if (meta) doc.text(meta, 19, y + 19);
}

/** Signed consent form embedding the patient's captured signature. */
export function generateConsentPDF(
  patient: Patient | undefined,
  opts: { title: string; signatureDataUrl: string; signedAt: string; lines?: { act: string; price: number }[] }
): DevisResult {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const clinic = "Cabinet Dentaire DentalOS";
  header(doc, W, clinic);

  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("CONSENTEMENT AUX SOINS", 14, 50);

  patientBox(doc, W, 58, patient);

  let y = 92;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  doc.text(
    `Je soussigné(e) ${patient?.name ?? ""}, reconnais avoir été informé(e) de la nature des soins proposés (${opts.title}), de leur déroulement et de leur coût, et donne mon consentement libre et éclairé pour leur réalisation.`,
    14, y, { maxWidth: W - 28 }
  );
  y += 20;

  if (opts.lines?.length) {
    const total = opts.lines.reduce((s, l) => s + l.price, 0);
    doc.setFillColor(...INK);
    doc.roundedRect(14, y - 6, W - 28, 9, 1.5, 1.5, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("ACTE", 19, y);
    doc.text("PRIX (MAD)", W - 19, y, { align: "right" });
    y += 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    opts.lines.forEach((l) => {
      doc.setTextColor(...INK);
      doc.text(l.act, 19, y, { maxWidth: W - 60 });
      doc.text(fmtMad(l.price), W - 19, y, { align: "right" });
      y += 8;
    });
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...TEAL);
    doc.text(`TOTAL : ${fmtMad(total)} MAD`, W - 19, y + 2, { align: "right" });
    y += 14;
  }

  // Signature block
  y = Math.max(y, 200);
  doc.setDrawColor(230, 234, 236);
  doc.setFillColor(250, 251, 251);
  doc.roundedRect(W - 94, y, 80, 42, 2.5, 2.5, "FD");
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTE);
  doc.text("Signature du patient", W - 90, y + 6);
  try {
    doc.addImage(opts.signatureDataUrl, "PNG", W - 92, y + 8, 76, 26);
  } catch {
    /* ignore bad image */
  }
  doc.setFontSize(8);
  doc.setTextColor(...MUTE);
  doc.text(`Signé le ${opts.signedAt}`, W - 90, y + 39);

  const fy = doc.internal.pageSize.getHeight() - 12;
  doc.setDrawColor(235, 238, 239);
  doc.line(14, fy - 4, W - 14, fy - 4);
  doc.setFontSize(8);
  doc.setTextColor(...MUTE);
  doc.text("DentalOS — Le système d'exploitation de votre cabinet dentaire", W / 2, fy, { align: "center" });

  const filename = `Consentement-signe-${(patient?.name ?? "").replace(/\s+/g, "-")}.pdf`;
  return { filename, blob: doc.output("blob"), dataUrl: doc.output("datauristring") };
}

/** Full patient dossier export — info, plan, payments, documents list. */
export function generateDossierPDF(
  patient: Patient,
  plan: TreatmentPlan | undefined,
  payments: Payment[],
  documents: ClinicDocument[]
): DevisResult {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  header(doc, W, "Cabinet Dentaire DentalOS");

  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("DOSSIER PATIENT", 14, 50);

  patientBox(doc, W, 58, patient);

  let y = 90;
  const section = (t: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...TEAL);
    doc.text(t, 14, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...INK);
  };

  if (patient.alerts.length) {
    section("Alertes médicales");
    doc.text(patient.alerts.join("  ·  "), 14, y, { maxWidth: W - 28 });
    y += 10;
  }

  if (plan) {
    section("Plan de traitement");
    plan.lines.forEach((l) => {
      doc.text(`• ${l.act}`, 16, y);
      doc.text(fmtMad(l.price), W - 19, y, { align: "right" });
      y += 6;
    });
    doc.setFont("helvetica", "bold");
    doc.text(`Total : ${fmtMad(plan.lines.reduce((s, l) => s + l.price, 0))} MAD`, W - 19, y + 1, { align: "right" });
    doc.setFont("helvetica", "normal");
    y += 12;
  }

  section("Paiements");
  if (payments.length) {
    payments.forEach((p) => {
      doc.text(`• ${p.date} — ${p.act}`, 16, y);
      doc.text(`${fmtMad(p.amount)} MAD`, W - 19, y, { align: "right" });
      y += 6;
    });
  } else {
    doc.text("Aucun paiement enregistré.", 16, y);
    y += 6;
  }
  doc.setFont("helvetica", "bold");
  doc.text(`Solde : ${fmtMad(patient.balance)} MAD`, W - 19, y + 1, { align: "right" });
  doc.setFont("helvetica", "normal");
  y += 12;

  section("Documents");
  if (documents.length) {
    documents.forEach((d) => {
      doc.text(`• ${d.title} (${d.files.length})`, 16, y, { maxWidth: W - 30 });
      y += 6;
    });
  } else {
    doc.text("Aucun document.", 16, y);
    y += 6;
  }

  const fy = doc.internal.pageSize.getHeight() - 12;
  doc.setDrawColor(235, 238, 239);
  doc.line(14, fy - 4, W - 14, fy - 4);
  doc.setFontSize(8);
  doc.setTextColor(...MUTE);
  doc.text("Document généré depuis le portail patient — DentalOS", W / 2, fy, { align: "center" });

  const filename = `Dossier-${patient.name.replace(/\s+/g, "-")}.pdf`;
  return { filename, blob: doc.output("blob"), dataUrl: doc.output("datauristring") };
}
