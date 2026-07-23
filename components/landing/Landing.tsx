"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  CalendarDays,
  FileText,
  Images,
  Wallet,
  Users,
  BellRing,
  ArrowRight,
  ArrowDown,
  Check,
  Sparkles,
  ShieldCheck,
  Star,
} from "lucide-react";
import { useApp } from "@/lib/i18n";
import { Logo, Button } from "@/components/ui/primitives";
import LangToggle from "./LangToggle";
import Reveal from "@/components/Reveal";
import DashboardPreview from "./DashboardPreview";
import { cn } from "@/lib/utils";

const ToothScene = dynamic(() => import("@/components/three/ToothScene"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center">
      <div className="h-40 w-40 animate-pulse rounded-full bg-teal-400/20 blur-2xl" />
    </div>
  ),
});

/* ============================ NAV ============================ */
function Nav() {
  const { t } = useApp();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "#features", label: t("nav.features") },
    { href: "#workflow", label: t("nav.workflow") },
    { href: "#pricing", label: t("nav.pricing") },
  ];

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled ? "py-2.5" : "py-4"
      )}
    >
      <div className="mx-auto max-w-7xl px-5">
        <div
          className={cn(
            "flex items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-500",
            scrolled
              ? "glass shadow-card"
              : "bg-transparent"
          )}
        >
          <Link href="/">
            <Logo light={!scrolled} />
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  scrolled
                    ? "text-ink-800/70 hover:text-ink-900"
                    : "text-white/70 hover:text-white"
                )}
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2.5">
            <LangToggle light={!scrolled} />
            <Link href="/app">
              <Button variant={scrolled ? "primary" : "dark"} className="hidden sm:inline-flex">
                {t("nav.launch")}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ============================ HERO ============================ */
function Hero() {
  const { t } = useApp();

  const stats = [
    { v: "4 500+", l: t("hero.stat1") },
    { v: "−32%", l: t("hero.stat2") },
    { v: "FR · ع", l: t("hero.stat3") },
  ];

  return (
    <section className="noise relative overflow-hidden bg-ink-950 pb-24 pt-32 text-white md:pb-32 md:pt-40">
      {/* Animated aurora backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-aurora animate-aurora opacity-80" />
      <div className="pointer-events-none absolute inset-0 bg-grid bg-[size:44px_44px] opacity-[0.15] mask-fade-b" />
      <div className="pointer-events-none absolute -left-40 top-10 h-96 w-96 rounded-full bg-teal-500/30 blur-[120px]" />
      <div className="pointer-events-none absolute -right-20 top-40 h-96 w-96 rounded-full bg-amber-500/20 blur-[120px]" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Left: copy */}
        <div className="rtl:text-right">
          <div
            className="rise mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-teal-200 backdrop-blur"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-400" />
            </span>
            {t("hero.badge")}
          </div>

          <h1 className="font-display text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-[4.2rem]">
            <span className="rise block" style={{ animationDelay: "0.1s" }}>
              {t("hero.title1")}
            </span>
            <span
              className="rise block text-gradient-soft"
              style={{ animationDelay: "0.22s" }}
            >
              {t("hero.titleaccent")}
            </span>
            <span
              className="rise block text-white/90"
              style={{ animationDelay: "0.34s" }}
            >
              {t("hero.title2")}
            </span>
          </h1>

          <p
            className="rise mt-6 max-w-xl text-lg leading-relaxed text-white/60 rtl:ml-auto"
            style={{ animationDelay: "0.5s" }}
          >
            {t("hero.subtitle")}
          </p>

          <div
            className="rise mt-8 flex flex-wrap items-center gap-3"
            style={{ animationDelay: "0.62s" }}
          >
            <Link href="/app">
              <Button variant="primary" className="px-5 py-3 text-base">
                <Sparkles className="h-4 w-4" />
                {t("hero.cta")}
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" className="border-white/20 bg-white/5 px-5 py-3 text-base text-white hover:border-teal-300 hover:text-teal-200">
                {t("hero.cta2")}
              </Button>
            </a>
          </div>

          <div className="mt-12 grid max-w-lg grid-cols-3 gap-4 border-t border-white/10 pt-6">
            {stats.map((s, i) => (
              <div
                key={s.l}
                className="rise"
                style={{ animationDelay: `${0.74 + i * 0.1}s` }}
              >
                <div className="font-display text-2xl font-bold text-white">{s.v}</div>
                <div className="mt-1 text-xs leading-snug text-white/45">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: 3D tooth */}
        <div
          className="scale-in relative h-[380px] sm:h-[460px] lg:h-[540px]"
          style={{ animationDelay: "0.3s" }}
        >
          {/* Ambient glow fallback — always visible, sits behind the 3D canvas */}
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="h-64 w-64 animate-float rounded-full bg-gradient-to-br from-teal-400/40 via-teal-300/20 to-amber-300/20 blur-[60px]" />
          </div>
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="h-52 w-52 rounded-full border border-white/10" />
            <div className="absolute h-72 w-72 rounded-full border border-white/5" />
          </div>
          <div className="absolute inset-0 rounded-[2rem]">
            <ToothScene />
          </div>
          {/* Floating glass chips around the tooth */}
          <FloatingChip
            className="left-2 top-10"
            icon={<CalendarDays className="h-4 w-4 text-teal-500" />}
            title="Rappel WhatsApp"
            sub="Envoyé ✓ · 11:30"
            delay={1.1}
          />
          <FloatingChip
            className="right-0 top-1/2"
            icon={<Wallet className="h-4 w-4 text-amber-500" />}
            title="Paiement enregistré"
            sub="3 800 MAD · Carte"
            delay={1.35}
          />
          <FloatingChip
            className="bottom-6 left-6"
            icon={<Check className="h-4 w-4 text-teal-500" />}
            title="Devis accepté"
            sub="Youssef B. · Implant"
            delay={1.6}
          />
        </div>
      </div>

      {/* Scroll cue */}
      <div className="relative mx-auto mt-14 flex max-w-7xl justify-center px-5">
        <a
          href="#features"
          className="inline-flex flex-col items-center gap-1 text-xs text-white/40 transition-colors hover:text-white/70"
        >
          {t("hero.scroll")}
          <ArrowDown className="h-4 w-4 animate-bounce" />
        </a>
      </div>
    </section>
  );
}

function FloatingChip({
  className,
  icon,
  title,
  sub,
  delay,
}: {
  className: string;
  icon: React.ReactNode;
  title: string;
  sub: string;
  delay: number;
}) {
  return (
    <div
      className={cn(
        "rise absolute z-10 flex items-center gap-2.5 rounded-2xl bg-white/95 px-3.5 py-2.5 shadow-float backdrop-blur",
        className
      )}
      style={{ animationDelay: `${delay}s` }}
    >
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink-900/5">{icon}</span>
      <span className="text-left rtl:text-right">
        <span className="block text-xs font-semibold text-ink-900">{title}</span>
        <span className="block text-[11px] text-ink-800/50">{sub}</span>
      </span>
    </div>
  );
}

/* ============================ MARQUEE ============================ */
function Marquee() {
  const { t } = useApp();
  const items = [
    "Agenda", "WhatsApp", "Devis", "Radios", "Espèces & chèques",
    "Comptes famille", "Rappels", "Orthodontie", "Implants", "Analytique",
    "Avant / Après", "AMO", "Prothèse", "Fidélité",
  ];
  return (
    <section className="border-y border-black/5 bg-white py-6">
      <p className="mb-4 text-center text-xs font-medium uppercase tracking-widest text-ink-800/40">
        {t("marquee.label")}
      </p>
      <div className="relative overflow-hidden">
        <div className="flex w-max animate-marquee gap-3">
          {[...items, ...items].map((it, i) => (
            <span
              key={i}
              className="flex items-center gap-2 rounded-full border border-black/5 bg-sand-50 px-4 py-2 text-sm font-medium text-ink-800/70"
            >
              <Star className="h-3.5 w-3.5 text-teal-400" /> {it}
            </span>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent" />
      </div>
    </section>
  );
}

/* ============================ FEATURES (bento) ============================ */
function Features() {
  const { t } = useApp();
  const feats = [
    { icon: CalendarDays, t: "f.booking.t", d: "f.booking.d", big: true },
    { icon: FileText, t: "f.plans.t", d: "f.plans.d" },
    { icon: Images, t: "f.imaging.t", d: "f.imaging.d" },
    { icon: Wallet, t: "f.billing.t", d: "f.billing.d" },
    { icon: Users, t: "f.family.t", d: "f.family.d" },
    { icon: BellRing, t: "f.loyalty.t", d: "f.loyalty.d", big: true },
  ];
  return (
    <section id="features" className="relative bg-sand-50 py-24 sm:py-32">
      <div className="zellige pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative mx-auto max-w-7xl px-5">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-teal-600">
            {t("features.kicker")}
          </span>
          <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl text-balance">
            {t("features.title")}
          </h2>
          <p className="mt-4 text-lg text-ink-800/55 text-balance">{t("features.subtitle")}</p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {feats.map((f, i) => (
            <Reveal key={f.t} delay={i * 0.05} className={cn(f.big && "sm:col-span-2 lg:col-span-1")}>
              <div className="group h-full rounded-2xl border border-black/5 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-float">
                <div className="mb-5 inline-grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-teal-400/15 to-teal-600/10 text-teal-600 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-semibold text-ink-900">{t(f.t)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-800/55">{t(f.d)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================ WORKFLOW ============================ */
function Workflow() {
  const { t } = useApp();
  const steps = [
    { n: "01", t: "wf.1.t", d: "wf.1.d", icon: CalendarDays },
    { n: "02", t: "wf.2.t", d: "wf.2.d", icon: Users },
    { n: "03", t: "wf.3.t", d: "wf.3.d", icon: FileText },
    { n: "04", t: "wf.4.t", d: "wf.4.d", icon: BellRing },
  ];
  return (
    <section id="workflow" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-teal-600">
            {t("workflow.kicker")}
          </span>
          <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl text-balance">
            {t("workflow.title")}
          </h2>
        </Reveal>

        <div className="relative mt-16">
          <div className="absolute left-0 right-0 top-9 hidden h-px bg-gradient-to-r from-transparent via-teal-300/50 to-transparent lg:block" />
          <div className="grid gap-8 lg:grid-cols-4">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.1} className="relative text-center">
                <div className="relative z-10 mx-auto mb-5 grid h-18 w-18 place-items-center">
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 text-white shadow-glow">
                    <s.icon className="h-7 w-7" />
                  </div>
                </div>
                <div className="font-display text-xs font-bold tracking-widest text-teal-500">
                  {s.n}
                </div>
                <h3 className="mt-1 font-display text-lg font-semibold text-ink-900">{t(s.t)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-800/55">{t(s.d)}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================ PRODUCT PREVIEW ============================ */
function Preview() {
  return (
    <section id="product" className="relative overflow-hidden bg-ink-950 py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0 bg-aurora opacity-40" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-[40rem] -translate-x-1/2 rounded-full bg-teal-500/20 blur-[120px]" />
      <div className="relative mx-auto max-w-6xl px-5">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center text-white">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-teal-200">
            <ShieldCheck className="h-3.5 w-3.5" /> Interface réelle · démo interactive
          </span>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl text-balance">
            Une interface pensée pour l’accueil
          </h2>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="relative rounded-[1.6rem] border border-white/10 bg-white/5 p-2 shadow-float backdrop-blur">
            <DashboardPreview />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ============================ PRICING ============================ */
function Pricing() {
  const { t } = useApp();
  const tiers = [
    { name: "Solo", price: "300", desc: "Cabinet à un praticien", feats: ["Agenda & rappels", "Dossiers patients", "Devis & paiements", "1 utilisateur"], featured: false },
    { name: "Cabinet", price: "600", desc: "Le choix des cabinets qui grandissent", feats: ["Tout Solo, plus :", "Coffre d’imagerie", "Comptes famille & rappels", "Analytique complète", "Jusqu’à 6 utilisateurs"], featured: true },
    { name: "Groupe", price: "Sur devis", desc: "Plusieurs sites & spécialités", feats: ["Tout Cabinet, plus :", "Multi-cabinets", "Intégrations AMO", "Support prioritaire"], featured: false },
  ];
  return (
    <section id="pricing" className="bg-sand-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-teal-600">
            {t("nav.pricing")}
          </span>
          <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl text-balance">
            Un prix simple, en dirhams
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {tiers.map((tier, i) => (
            <Reveal key={tier.name} delay={i * 0.08}>
              <div
                className={cn(
                  "relative flex h-full flex-col rounded-2xl border p-7 transition-all duration-300",
                  tier.featured
                    ? "border-teal-400/40 bg-ink-950 text-white shadow-float scale-[1.02]"
                    : "border-black/5 bg-white shadow-card hover:-translate-y-1 hover:shadow-float"
                )}
              >
                {tier.featured && (
                  <span className="absolute -top-3 left-7 rounded-full bg-gradient-to-r from-teal-400 to-amber-400 px-3 py-1 text-xs font-bold text-ink-950">
                    Populaire
                  </span>
                )}
                <h3 className="font-display text-xl font-bold">{tier.name}</h3>
                <p className={cn("mt-1 text-sm", tier.featured ? "text-white/50" : "text-ink-800/50")}>
                  {tier.desc}
                </p>
                <div className="mt-5 flex items-end gap-1.5">
                  <span className="font-display text-4xl font-bold">{tier.price}</span>
                  {tier.price !== "Sur devis" && (
                    <span className={cn("mb-1.5 text-sm", tier.featured ? "text-white/50" : "text-ink-800/50")}>
                      MAD / mois
                    </span>
                  )}
                </div>
                <ul className="mt-6 flex-1 space-y-3">
                  {tier.feats.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check className={cn("mt-0.5 h-4 w-4 shrink-0", tier.featured ? "text-teal-300" : "text-teal-500")} />
                      <span className={tier.featured ? "text-white/80" : "text-ink-800/70"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/app" className="mt-7">
                  <Button variant={tier.featured ? "primary" : "outline"} className="w-full">
                    {t("nav.demo")}
                  </Button>
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================ CTA + FOOTER ============================ */
function CTA() {
  const { t } = useApp();
  return (
    <section className="relative overflow-hidden bg-white py-24">
      <div className="mx-auto max-w-5xl px-5">
        <Reveal>
          <div className="noise relative overflow-hidden rounded-[2rem] bg-ink-950 px-8 py-16 text-center sm:px-16">
            <div className="pointer-events-none absolute inset-0 bg-aurora animate-aurora opacity-70" />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl font-display text-4xl font-bold tracking-tight text-white sm:text-5xl text-balance">
                {t("cta.title")}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-white/60">{t("cta.subtitle")}</p>
              <Link href="/app" className="mt-8 inline-block">
                <Button variant="primary" className="px-6 py-3.5 text-base">
                  <Sparkles className="h-5 w-5" />
                  {t("cta.button")}
                  <ArrowRight className="h-5 w-5 rtl:rotate-180" />
                </Button>
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  const { t } = useApp();
  return (
    <footer className="border-t border-black/5 bg-sand-50 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 sm:flex-row">
        <Logo />
        <p className="text-sm text-ink-800/50">{t("footer.rights")}</p>
        <p className="text-xs text-ink-800/40">{t("footer.note")}</p>
      </div>
    </footer>
  );
}

/* ============================ PAGE ============================ */
export default function Landing() {
  return (
    <main className="overflow-x-hidden">
      <Nav />
      <Hero />
      <Marquee />
      <Features />
      <Workflow />
      <Preview />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  );
}
