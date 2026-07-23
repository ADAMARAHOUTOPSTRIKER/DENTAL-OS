export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function mad(n: number) {
  return new Intl.NumberFormat("fr-MA", {
    maximumFractionDigits: 0,
  }).format(n);
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

// Deterministic pastel from a string (stable across renders/SSR)
export function avatarColor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return `hsl(${h} 55% 42%)`;
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// ---------- Dates ----------
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-07-24" -> "24 Jul 2026" (matches the demo's display style)
export function isoToLabel(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MON[m - 1]} ${y}`;
}

// "2026-07-24" -> short "24 Jul" (used in reminder templates)
export function isoToShort(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MON[m - 1]}`;
}

// ---------- WhatsApp ----------
// Normalize a Moroccan phone to international digits for wa.me.
// "+212 661 20 44 18" -> "212661204418"; "0661-204418" -> "212661204418".
export function toIntlDigits(phone: string) {
  let d = (phone || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("212")) return d;
  if (d.startsWith("0")) return "212" + d.slice(1);
  // bare local number like "661204418"
  if (d.length === 9) return "212" + d;
  return d;
}

// Build a click-to-chat WhatsApp URL with a prefilled message.
export function waLink(phone: string, text: string) {
  const digits = toIntlDigits(phone);
  const msg = encodeURIComponent(text);
  return digits
    ? `https://wa.me/${digits}?text=${msg}`
    : `https://wa.me/?text=${msg}`;
}
