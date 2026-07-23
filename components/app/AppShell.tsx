"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
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
  Globe,
  Menu,
  X,
} from "lucide-react";
import { useApp, type Role } from "@/lib/i18n";
import { Logo, Avatar } from "@/components/ui/primitives";
import { useData } from "@/components/app/DataProvider";
import { cn } from "@/lib/utils";

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
  const { role, t } = useApp();
  const router = useRouter();
  return (
    <div className="mt-auto space-y-3 border-t border-black/5 pt-4">
      <div className="flex items-center gap-3 rounded-xl bg-sand-50 p-3">
        <Avatar name={ROLE_USER[role]} size={38} />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-ink-900">{ROLE_USER[role]}</div>
          <div className="truncate text-xs text-ink-800/50">{t(`role.${role}`)}</div>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => router.push("/app")}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-black/5 bg-white px-2 py-2 text-xs font-medium text-ink-800/70 transition-colors hover:text-teal-600"
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
          {t("nav.switchrole")}
        </button>
        <Link
          href="/"
          className="flex items-center justify-center gap-1.5 rounded-lg border border-black/5 bg-white px-2.5 py-2 text-xs font-medium text-ink-800/70 transition-colors hover:text-teal-600"
        >
          <Globe className="h-3.5 w-3.5" />
        </Link>
      </div>
      <DbStatus />
    </div>
  );
}

function Topbar({ onMenu }: { onMenu: () => void }) {
  const { t, toggleLang, lang } = useApp();
  const today = new Intl.DateTimeFormat(lang === "ar" ? "ar-MA" : "fr-MA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(2026, 6, 23));

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-black/5 bg-white/80 px-4 py-3 backdrop-blur-md lg:px-8">
      <button onClick={onMenu} className="grid h-9 w-9 place-items-center rounded-lg text-ink-800/60 hover:bg-ink-900/5 lg:hidden">
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex flex-1 items-center gap-2 rounded-xl border border-black/5 bg-sand-50 px-3 py-2 text-sm text-ink-800/50 sm:max-w-sm">
        <Search className="h-4 w-4" />
        <span className="truncate">{t("app.search")}</span>
      </div>

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

      <button className="relative grid h-9 w-9 place-items-center rounded-lg text-ink-800/60 hover:bg-ink-900/5">
        <Bell className="h-5 w-5" />
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white" />
      </button>

      <button className="hidden items-center gap-1.5 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 px-3.5 py-2 text-sm font-semibold text-white shadow-glow transition-all hover:brightness-105 active:scale-95 sm:inline-flex">
        <Plus className="h-4 w-4" />
        {t("app.new")}
      </button>
    </header>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-sand-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-64 flex-col border-e border-black/5 bg-white p-4 lg:flex">
        <div className="px-2 py-2">
          <Link href="/app/dashboard">
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
