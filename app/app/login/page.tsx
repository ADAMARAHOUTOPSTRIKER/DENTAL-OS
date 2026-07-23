"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, KeyRound, LogIn, User, Lock } from "lucide-react";
import { useApp } from "@/lib/i18n";
import { useData } from "@/components/app/DataProvider";
import { Logo, Button } from "@/components/ui/primitives";
import LangToggle from "@/components/landing/LangToggle";
import { patients as seedPatients } from "@/lib/data";

export default function PatientLoginPage() {
  const { t, setPatientId, setRole, dir } = useApp();
  const { patients, patientById } = useData();
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const Back = dir === "rtl" ? ArrowRight : ArrowLeft;

  // Match live credentials first; fall back to seed demo credentials so the
  // flow works even before the portal_login/portal_password columns exist.
  const authenticate = (l: string, p: string) => {
    const live = patients.find((x) => x.portalLogin && x.portalLogin === l && x.portalPassword === p);
    if (live) return live;
    const seed = seedPatients.find((x) => x.portalLogin === l && x.portalPassword === p);
    return seed ? patientById(seed.id) ?? seed : null;
  };

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (busy) return;
    setBusy(true);
    const found = authenticate(login.trim(), password);
    if (found) {
      setRole("patient");
      setPatientId(found.id);
      router.push("/app/portal");
    } else {
      setError(true);
      setBusy(false);
    }
  };

  const useDemo = () => {
    setLogin("yasmine.alaoui");
    setPassword("demo1234");
    setError(false);
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-ink-950 px-5 text-white">
      <div className="pointer-events-none absolute inset-0 bg-aurora animate-aurora opacity-70" />
      <div className="pointer-events-none absolute inset-0 bg-grid bg-[size:44px_44px] opacity-[0.12] mask-fade-b" />

      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 py-6">
        <Link href="/app" className="inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white">
          <Back className="h-4 w-4" />
          <Logo light />
        </Link>
        <LangToggle light />
      </div>

      <div className="rise relative w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-sky-400 to-teal-500 text-white shadow-glow">
            <KeyRound className="h-7 w-7" />
          </div>
          <h1 className="font-display text-2xl font-bold">{t("login.title")}</h1>
          <p className="mx-auto mt-2 max-w-xs text-sm text-white/55">{t("login.sub")}</p>
        </div>

        <form onSubmit={submit} className="glass-dark rounded-2xl p-5 shadow-float">
          <label className="mb-1.5 block text-xs font-medium text-white/60">{t("login.login")}</label>
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 focus-within:border-teal-400/50">
            <User className="h-4 w-4 text-white/40" />
            <input
              value={login}
              onChange={(e) => { setLogin(e.target.value); setError(false); }}
              placeholder="prenom.nom"
              autoFocus
              className="w-full bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-white/30"
            />
          </div>

          <label className="mb-1.5 block text-xs font-medium text-white/60">{t("login.password")}</label>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 focus-within:border-teal-400/50">
            <Lock className="h-4 w-4 text-white/40" />
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              placeholder="••••••••"
              className="w-full bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-white/30"
            />
          </div>

          {error && (
            <p className="mt-3 rounded-lg bg-rose-500/15 px-3 py-2 text-xs text-rose-200">{t("login.error")}</p>
          )}

          <Button type="submit" variant="primary" className="mt-4 w-full" disabled={!login.trim() || !password || busy}>
            <LogIn className="h-4 w-4" /> {t("login.submit")}
          </Button>
          <p className="mt-3 text-center text-[11px] text-white/40">{t("login.help")}</p>
        </form>

        {/* demo account */}
        <button
          onClick={useDemo}
          className="mt-4 flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-start transition-colors hover:border-teal-400/40 hover:bg-white/[0.07]"
        >
          <span className="min-w-0">
            <span className="block text-[11px] uppercase tracking-wide text-teal-200">{t("login.demo")}</span>
            <span className="block truncate font-mono text-sm text-white/70">yasmine.alaoui · demo1234</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-teal-300">
            {t("login.demo.fill")} <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </span>
        </button>
      </div>
    </main>
  );
}
