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
