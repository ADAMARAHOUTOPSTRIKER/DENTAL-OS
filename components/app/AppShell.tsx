"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  FileText,
  Images,
  Wallet,
  BarChart3,
  UserCircle,
  Search,
  Bell,
  Plus,
  ArrowLeftRight,
  Menu,
  X,
  UserPlus,
  CalendarPlus,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import { useApp, type Role } from "@/lib/i18n";
import { Logo, Avatar } from "@/components/ui/primitives";
import { useData } from "@/components/app/DataProvider";
import { useUI } from "@/components/app/ModalProvider";
import { cn, mad, isoToWeekday } from "@/lib/utils";
import { TODAY_ISO } from "@/lib/data";

function DbStatus() {
  const { source, loading } = useData();
  const live = source === "supabase";
  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-sand-50 px-2.5 py-1.5 text-[11px] font-medium text-ink-800/60">
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          loading ? "bg-amber-400 animate-pulse" : live ? "bg-teal-500" : "bg-ink-800/30"
        )}
      />
      {loading ? "Connexion…" : live ? "Supabase · live" : "Données locales"}
    </div>
  );
}

interface NavItem {
  href: string;
  labelKey: string;
  icon: typeof LayoutDashboard;
  roles: Role[];
}

const NAV: NavItem[] = [
  { href: "/app/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard, roles: ["dentist", "secretary"] },
  { href: "/app/calendar", labelKey: "nav.calendar", icon: CalendarDays, roles: ["dentist", "secretary"] },
  { href: "/app/patients", labelKey: "nav.patients", icon: Users, roles: ["dentist", "secretary"] },
  { href: "/app/treatments", labelKey: "nav.treatments", icon: FileText, roles: ["dentist"] },
  { href: "/app/imaging", labelKey: "nav.imaging", icon: Images, roles: ["dentist"] },
  { href: "/app/payments", labelKey: "nav.payments", icon: Wallet, roles: ["dentist", "secretary"] },
  { href: "/app/analytics", labelKey: "nav.analytics", icon: BarChart3, roles: ["dentist"] },
  { href: "/app/portal", labelKey: "nav.portal", icon: UserCircle, roles: ["patient"] },
];

const ROLE_USER: Record<Role, string> = {
  dentist: "Dr. Bennani",
  secretary: "Imane (Accueil)",
  patient: "Yasmine Alaoui",
};

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { role, t } = useApp();
  const pathname = usePathname();
  const items = NAV.filter((n) => n.roles.includes(role));
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              active
                ? "bg-gradient-to-r from-teal-500/15 to-transparent text-teal-700"
                : "text-ink-800/60 hover:bg-ink-900/[0.04] hover:text-ink-900"
            )}
          >
            <span
              className={cn(
                "grid h-8 w-8 place-items-center rounded-lg transition-colors",
                active ? "bg-gradient-to-br from-teal-400 to-teal-600 text-white shadow-glow" : "bg-ink-900/[0.04] text-ink-800/50 group-hover:text-ink-800"
              )}
            >
              <item.icon className="h-4 w-4" />
            </span>
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter() {
  const { role, t, patientId, setPatientId } = useApp();
  const { patientById, resetDemo } = useData();
  const { toast } = useUI();
  const [resetting, setResetting] = useState(false);
  const router = useRouter();
  const displayName =
    role === "patient" && patientId ? patientById(patientId)?.name ?? ROLE_USER[role] : ROLE_USER[role];
  const switchRole = () => {
    setPatientId(null);
    router.push("/app");
  };
  return (
    <div className="mt-auto space-y-3 border-t border-black/5 pt-4">
      <div className="flex items-center gap-3 rounded-xl bg-sand-50 p-3">
        <Avatar name={displayName} size={38} />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-ink-900">{displayName}</div>
          <div className="truncate text-xs text-ink-800/50">{t(`role.${role}`)}</div>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={switchRole}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-black/5 bg-white px-2 py-2 text-xs font-medium text-ink-800/70 transition-colors hover:text-teal-600"
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
          {t("nav.switchrole")}
        </button>
        {/* Une presentation se rejoue : ce bouton efface tout ce que le
            visiteur a saisi et remet le cabinet dans son etat d'origine. */}
        <button
          onClick={async () => {
            if (resetting) return;
            setResetting(true);
            await resetDemo();
            setResetting(false);
            toast(t("demo.reset.done"));
          }}
          title={t("demo.reset")}
          aria-label={t("demo.reset")}
          className="grid h-[34px] w-9 place-items-center rounded-lg border border-black/5 bg-white text-ink-800/60 transition-colors hover:text-teal-600 disabled:opacity-40"
          disabled={resetting}
        >
          <RotateCcw className={cn("h-3.5 w-3.5", resetting && "animate-spin")} />
        </button>
      </div>
      <DbStatus />
    </div>
  );
}

function SearchBox() {
  const { t } = useApp();
  const { patients } = useData();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const query = q.trim().toLowerCase();
  const results = query
    ? patients
        .filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            p.phone.includes(query) ||
            p.city.toLowerCase().includes(query) ||
            p.tags.some((tag) => tag.toLowerCase().includes(query))
        )
        .slice(0, 6)
    : [];

  const go = (id: string) => {
    router.push(`/app/patients?id=${id}`);
    setQ("");
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative flex-1 sm:max-w-sm">
      <div className="flex items-center gap-2 rounded-xl border border-black/5 bg-sand-50 px-3 py-2 text-sm focus-within:border-teal-400 focus-within:bg-white">
        <Search className="h-4 w-4 text-ink-800/40" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={t("app.search")}
          className="w-full bg-transparent outline-none placeholder:text-ink-800/40"
        />
      </div>
      {open && query && (
        <div className="pop-in absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-black/5 bg-white shadow-float">
          {results.length ? (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => go(p.id)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-start transition-colors hover:bg-sand-50"
                  >
                    <Avatar name={p.name} size={34} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink-900">{p.name}</span>
                      <span className="block truncate text-xs text-ink-800/50">{p.city} · {p.phone}</span>
                    </span>
                    {p.balance > 0 && (
                      <span className="shrink-0 text-xs font-semibold text-amber-600">{mad(p.balance)} MAD</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-6 text-center text-sm text-ink-800/40">{t("search.none")}</div>
          )}
        </div>
      )}
    </div>
  );
}

function NewMenu() {
  const { t, role } = useApp();
  const ui = useUI();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const items = [
    { icon: UserPlus, label: t("new.patient"), run: () => ui.openNewPatient(), roles: ["dentist", "secretary"] },
    { icon: CalendarPlus, label: t("new.appointment"), run: () => ui.openNewAppointment(), roles: ["dentist", "secretary"] },
    { icon: FileText, label: t("new.plan"), run: () => ui.openNewPlan(), roles: ["dentist"] },
    { icon: Wallet, label: t("new.payment"), run: () => ui.openPayment(), roles: ["dentist", "secretary"] },
    { icon: Images, label: t("new.document"), run: () => ui.openNewDocument(), roles: ["dentist"] },
  ].filter((i) => i.roles.includes(role));

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 px-3.5 py-2 text-sm font-semibold text-white shadow-glow transition-all hover:brightness-105 active:scale-95"
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">{t("app.new")}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="pop-in absolute end-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-black/5 bg-white p-1 shadow-float">
          {items.map((it) => (
            <button
              key={it.label}
              onClick={() => {
                setOpen(false);
                it.run();
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start text-sm font-medium text-ink-800/80 transition-colors hover:bg-sand-50 hover:text-ink-900"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-50 text-teal-600">
                <it.icon className="h-4 w-4" />
              </span>
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Ce qui demande une action, maintenant.
 *
 * La cloche était décorative : un bouton sans clic, avec une pastille « non
 * lu » qui ne s'effaçait jamais. Elle se nourrit désormais des vraies données
 * du cabinet — présences à confirmer, rappels arrivés à échéance, impayés — et
 * chaque ligne mène à l'écran concerné.
 */
function NotificationsMenu() {
  const { t, lang, role } = useApp();
  const { appointments, recalls, patients, patientById } = useData();
  const ui = useUI();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const items = useMemo(() => {
    if (role === "patient") return [];
    const optedOut = new Set(patients.filter((p) => p.recallOptIn === false).map((p) => p.id));

    const unconfirmed = appointments
      .filter((a) => a.day === TODAY_ISO && a.status === "pending")
      .map((a) => ({
        id: `appt-${a.id}`,
        tone: "amber" as const,
        icon: CalendarDays,
        title: t("notif.unconfirmed"),
        body: `${a.patient} · ${a.time}`,
        run: () => router.push("/app/calendar"),
      }));

    const due = recalls
      .filter((r) => !r.reminderSent && !optedOut.has(r.patientId) && r.due <= TODAY_ISO)
      .map((r) => ({
        id: `recall-${r.patientId}-${r.reason}`,
        tone: "teal" as const,
        icon: Bell,
        title: t("notif.recall"),
        body: `${r.patient} · ${r.reason}`,
        run: () => {
          const p = patientById(r.patientId);
          if (p) ui.openMessage(p, { recallReason: r.reason });
        },
      }));

    const debts = patients
      .filter((p) => p.balance > 3000)
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 3)
      .map((p) => ({
        id: `debt-${p.id}`,
        tone: "rose" as const,
        icon: Wallet,
        title: t("notif.unpaid"),
        body: `${p.name} · ${mad(p.balance)} ${t("common.mad")}`,
        run: () => router.push(`/app/patients?id=${p.id}`),
      }));

    return [...unconfirmed, ...due, ...debts].filter((n) => !dismissed.includes(n.id));
  }, [role, appointments, recalls, patients, patientById, dismissed, t, ui, router]);

  const TONE = {
    amber: "bg-amber-50 text-amber-600",
    teal: "bg-teal-50 text-teal-600",
    rose: "bg-rose-50 text-rose-600",
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t("notif.title")}
        className="relative grid h-9 w-9 place-items-center rounded-lg text-ink-800/60 transition-colors hover:bg-ink-900/5"
      >
        <Bell className="h-5 w-5" />
        {/* La pastille ne s'allume que s'il reste vraiment quelque chose à traiter. */}
        {items.length > 0 && (
          <span className="absolute end-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {items.length}
          </span>
        )}
      </button>

      {open && (
        <div className="pop-in absolute end-0 top-full z-50 mt-2 w-[21rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-black/5 bg-white shadow-float">
          <div className="flex items-center justify-between border-b border-black/5 px-4 py-2.5">
            <span className="text-sm font-semibold text-ink-900">{t("notif.title")}</span>
            <span className="text-xs text-ink-800/40">{isoToWeekday(TODAY_ISO, lang)}</span>
          </div>
          {items.length ? (
            <ul className="max-h-96 overflow-y-auto p-1">
              {items.map((n) => (
                <li key={n.id} className="flex items-start gap-2 rounded-lg p-1 hover:bg-sand-50">
                  <button
                    onClick={() => {
                      setOpen(false);
                      n.run();
                    }}
                    className="flex min-w-0 flex-1 items-start gap-2.5 rounded-lg px-2 py-1.5 text-start"
                  >
                    <span className={cn("mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg", TONE[n.tone])}>
                      <n.icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-ink-900">{n.title}</span>
                      <span className="block truncate text-xs text-ink-800/50">{n.body}</span>
                    </span>
                  </button>
                  <button
                    onClick={() => setDismissed((d) => [...d, n.id])}
                    title={t("notif.dismiss")}
                    aria-label={t("notif.dismiss")}
                    className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded text-ink-800/30 hover:text-ink-900"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-8 text-center text-sm text-ink-800/40">{t("notif.empty")}</div>
          )}
        </div>
      )}
    </div>
  );
}

function Topbar({ onMenu }: { onMenu: () => void }) {
  const { toggleLang, lang, role } = useApp();
  const today = isoToWeekday(TODAY_ISO, lang);
  const canCreate = role === "dentist" || role === "secretary";

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-black/5 bg-white/80 px-4 py-3 backdrop-blur-md lg:px-8">
      <button onClick={onMenu} className="grid h-9 w-9 place-items-center rounded-lg text-ink-800/60 hover:bg-ink-900/5 lg:hidden">
        <Menu className="h-5 w-5" />
      </button>

      {canCreate ? (
        <SearchBox />
      ) : (
        <div className="flex-1" />
      )}

      <div className="hidden items-center gap-1.5 rounded-lg bg-sand-50 px-3 py-1.5 text-xs font-medium text-ink-800/60 md:flex">
        <CalendarDays className="h-3.5 w-3.5 text-teal-500" />
        <span className="capitalize">{today}</span>
      </div>

      <button
        onClick={toggleLang}
        className="grid h-9 w-9 place-items-center rounded-lg text-xs font-bold text-ink-800/60 hover:bg-ink-900/5"
        title="FR / ع"
      >
        {lang === "fr" ? "ع" : "FR"}
      </button>

      <NotificationsMenu />

      {canCreate && <NewMenu />}
    </header>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { role } = useApp();
  // Le logo ramène à l'accueil de CHAQUE rôle : un patient n'a rien à faire
  // sur le tableau de bord du cabinet.
  const home = role === "patient" ? "/app/portal" : "/app/dashboard";

  return (
    <div className="min-h-screen bg-sand-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-64 flex-col border-e border-black/5 bg-white p-4 lg:flex">
        <div className="px-2 py-2">
          <Link href={home}>
            <Logo />
          </Link>
        </div>
        <div className="mt-4 flex flex-1 flex-col">
          <NavLinks />
          <SidebarFooter />
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 start-0 flex w-72 flex-col bg-white p-4 shadow-float">
            <div className="flex items-center justify-between px-2 py-2">
              <Logo />
              <button onClick={() => setMobileOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-ink-900/5">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 flex flex-1 flex-col">
              <NavLinks onNavigate={() => setMobileOpen(false)} />
              <SidebarFooter />
            </div>
          </aside>
        </div>
      )}

      {/* Content */}
      <div className="lg:ps-64">
        <Topbar onMenu={() => setMobileOpen(true)} />
        <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
