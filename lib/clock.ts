/**
 * L'horloge de la démo.
 *
 * Le jeu de données a été écrit à la main autour d'un jour précis (l'ancre).
 * Sans traitement, la démo vieillit : trois mois plus tard on montre à un
 * cabinet un agenda dont « aujourd'hui » est un jour déjà passé, des rappels
 * en retard et des paiements du mois dernier. C'est le genre de détail qui
 * tue une démo commerciale en trois secondes.
 *
 * La parade : toutes les dates du jeu de données restent écrites par rapport
 * à l'ancre, et on les décale à la volée du nombre de jours qui sépare
 * l'ancre du jour réel. Les écarts relatifs sont donc préservés pour
 * toujours — le détartrage d'« il y a trois semaines » reste à trois
 * semaines, et « aujourd'hui » est toujours vraiment aujourd'hui.
 */

/** Le jour autour duquel tout le jeu de données a été écrit. Ne jamais changer. */
export const SEED_ANCHOR_ISO = "2026-07-23";

const MS_PER_DAY = 86_400_000;

/** Le jour courant à Casablanca, en ISO (`2026-07-25`). */
export function todayIso(): string {
  // en-CA donne nativement le format AAAA-MM-JJ. Le fuseau est explicite pour
  // que le serveur et le navigateur tombent sur le même jour.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Casablanca",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function toUtcMs(iso: string) {
  return Date.parse(iso + "T00:00:00Z");
}

/** Nombre de jours entre l'ancre du jeu de données et le jour réel. */
export function driftDays(): number {
  return Math.round((toUtcMs(todayIso()) - toUtcMs(SEED_ANCHOR_ISO)) / MS_PER_DAY);
}

/**
 * Calculé une seule fois au chargement du module : le décalage est le même
 * pour tout le rendu, donc l'agenda, les KPI et le portail restent cohérents
 * entre eux même si l'onglet reste ouvert au passage de minuit.
 */
export const DRIFT_DAYS = driftDays();

/** Décale une date du jeu de données sur la ligne de temps réelle. */
export function rebase(iso: string): string {
  if (!iso) return iso;
  const ms = toUtcMs(iso);
  if (Number.isNaN(ms)) return iso;
  return new Date(ms + DRIFT_DAYS * MS_PER_DAY).toISOString().slice(0, 10);
}

/* ------------------------------------------------------------------ */
/* Lecture des dates écrites « à l'ancienne » dans le jeu de données   */
/* ------------------------------------------------------------------ */

const EN_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Accepte aussi bien `2026-06-30` que les anciennes étiquettes anglaises
 * (`30 Jun 2026`, `23 Jul`) encore présentes dans la base Supabase, et rend
 * toujours de l'ISO. L'année est déduite de l'ancre quand elle manque.
 */
export function parseLooseIso(value: string | null | undefined): string | null {
  if (!value) return null;
  const raw = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const m = raw.match(/^(\d{1,2})\s+([A-Za-z]{3})[a-z]*\.?\s*(\d{4})?$/);
  if (!m) return null;
  const day = Number(m[1]);
  const monthIndex = EN_MONTHS.findIndex((x) => x.toLowerCase() === m[2].toLowerCase());
  if (monthIndex < 0) return null;
  const year = m[3] ? Number(m[3]) : Number(SEED_ANCHOR_ISO.slice(0, 4));
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Lit une date du jeu de données (quel que soit son format) et la décale. */
export function rebaseLoose(value: string | null | undefined): string | null {
  const iso = parseLooseIso(value);
  return iso ? rebase(iso) : null;
}

/* ------------------------------------------------------------------ */
/* Les repères « aujourd'hui » que le reste de l'app consomme           */
/* ------------------------------------------------------------------ */

export const TODAY_ISO = todayIso();
