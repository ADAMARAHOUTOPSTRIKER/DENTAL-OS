"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  CalendarPlus,
  MessageSquare,
  BellRing,
  Trash2,
} from "lucide-react";
import { useApp } from "@/lib/i18n";
import { Avatar, Pill, Button } from "@/components/ui/primitives";
import { Counter } from "@/components/ui/Counter";
import { PageHeader } from "@/components/app/blocks";
import PatientDrawer from "@/components/app/PatientDrawer";
import { useData } from "@/components/app/DataProvider";
import { useUI } from "@/components/app/ModalProvider";
import { cn, mad } from "@/lib/utils";
import type { Patient } from "@/lib/data";

type FilterKey = "all" | "balance" | "upcoming";

function RowMenu({ patient }: { patient: Patient }) {
  const { t } = useApp();
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
    { icon: CalendarPlus, label: t("act.book"), run: () => ui.openNewAppointment(patient.id) },
    { icon: MessageSquare, label: t("act.message"), run: () => ui.openMessage(patient) },
    { icon: BellRing, label: t("act.reminder"), run: () => ui.openMessage(patient, { reminder: true }) },
    { icon: Trash2, label: t("act.delete"), run: () => ui.openDelete(patient), danger: true },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="grid h-9 w-9 place-items-center rounded-lg text-ink-800/40 transition-colors hover:bg-sand-100 hover:text-ink-900"
        aria-label="actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="pop-in absolute end-0 top-full z-30 mt-1 w-52 overflow-hidden rounded-xl border border-black/5 bg-white p-1 shadow-float">
          {items.map((it) => (
            <button
              key={it.label}
              onClick={() => {
                setOpen(false);
                it.run();
              }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-start text-sm font-medium transition-colors",
                it.danger
                  ? "text-rose-600 hover:bg-rose-50"
                  : "text-ink-800/80 hover:bg-sand-50 hover:text-ink-900"
              )}
            >
              <it.icon className="h-4 w-4" />
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PatientsPage() {
  const { t } = useApp();
  const { patients, patientById } = useData();
  const ui = useUI();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Measured sliding filter indicator.
  const filterRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [find, setFind] = useState({ left: 0, width: 0 });
  useEffect(() => {
    const el = filterRefs.current[filter];
    if (el) setFind({ left: el.offsetLeft, width: el.offsetWidth });
  }, [filter]);

  // Deep-link support (?id=) without useSearchParams Suspense constraint.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (id && patientById(id)) setSelectedId(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    return patients.filter((p) => {
      const q = query.trim().toLowerCase();
      const matchQ = !q || p.name.toLowerCase().includes(q) || p.phone.includes(q) || p.city.toLowerCase().includes(q);
      const matchF =
        filter === "all" ||
        (filter === "balance" && p.balance > 0) ||
        (filter === "upcoming" && p.nextVisit);
      return matchQ && matchF;
    });
  }, [query, filter, patients]);

  const selected = selectedId ? patientById(selectedId) : null;

  const filters: { key: FilterKey; label: string }[] = [
    { key: "all", label: t("app.viewall") },
    { key: "balance", label: t("kpi.pending") },
    { key: "upcoming", label: t("col.next") },
  ];

  return (
    <>
      <PageHeader
        title={t("patients.title")}
        subtitle={<><Counter value={patients.length} format={(n) => String(Math.round(n))} /> {t("patients.count")}</>}
        action={
          <Button variant="primary" onClick={() => ui.openNewPatient()}>
            <Plus className="h-4 w-4" /> {t("patients.add")}
          </Button>
        }
      />

      {/* toolbar */}
      <div className="rise mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-black/5 bg-white px-3 py-2.5 shadow-sm">
          <Search className="h-4 w-4 text-ink-800/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("app.search")}
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink-800/40"
          />
        </div>
        <div className="relative flex items-center gap-1 rounded-xl border border-black/5 bg-white p-1">
          <span
            className="pointer-events-none absolute bottom-1 top-1 rounded-lg bg-ink-900"
            style={{ left: find.left, width: find.width, transition: "left 0.35s cubic-bezier(0.16,1,0.3,1), width 0.35s cubic-bezier(0.16,1,0.3,1)" }}
          />
          {filters.map((f) => (
            <button
              key={f.key}
              ref={(el) => { filterRefs.current[f.key] = el; }}
              onClick={() => setFilter(f.key)}
              className={cn(
                "relative z-10 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                filter === f.key ? "text-white" : "text-ink-800/60 hover:text-ink-900"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* table */}
      <div className="rise overflow-visible rounded-2xl border border-black/5 bg-white shadow-card" style={{ animationDelay: "0.05s" }}>
        {/* head */}
        <div className="hidden grid-cols-[2fr_1.3fr_1fr_1fr_1fr_auto] gap-4 border-b border-black/5 bg-sand-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-800/45 md:grid">
          <span>{t("col.name")}</span>
          <span>{t("col.phone")}</span>
          <span>{t("col.last")}</span>
          <span>{t("col.balance")}</span>
          <span>{t("col.status")}</span>
          <span className="w-9" />
        </div>
        <ul className="divide-y divide-black/5">
          {filtered.map((p) => (
            <li key={p.id} className="flex items-center gap-2 pe-3 transition-colors hover:bg-sand-50">
              <button
                onClick={() => setSelectedId(p.id)}
                className="grid flex-1 grid-cols-1 items-center gap-2 px-5 py-3 text-start md:grid-cols-[2fr_1.3fr_1fr_1fr_1fr] md:gap-4"
              >
                <span className="flex items-center gap-3">
                  <Avatar name={p.name} size={40} />
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-ink-900">{p.name}</span>
                      {p.intakeStatus === "draft" && (
                        <span className="shrink-0 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700 ring-1 ring-sky-200">
                          {t("prereg.badge")}
                        </span>
                      )}
                    </span>
                    <span className="block truncate text-xs text-ink-800/50">{p.age} {t("detail.age")} · {p.city}</span>
                  </span>
                </span>
                <span className="hidden text-sm text-ink-800/70 md:block">{p.phone}</span>
                <span className="hidden text-sm text-ink-800/60 md:block">{p.lastVisit}</span>
                <span className={cn("hidden text-sm font-semibold md:block", p.balance > 0 ? "text-amber-600" : "text-ink-800/40")}>
                  {p.balance > 0 ? `${mad(p.balance)} ${t("common.mad")}` : "—"}
                </span>
                <span className="hidden md:block">
                  <Pill tone={p.status}>{t(`status.${p.status}`)}</Pill>
                </span>
              </button>
              <RowMenu patient={p} />
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="grid place-items-center gap-2 py-16 text-sm text-ink-800/40">
              <Filter className="h-5 w-5" />
              {t("search.none")}
            </li>
          )}
        </ul>
      </div>

      {selected && <PatientDrawer patient={selected} onClose={() => setSelectedId(null)} />}
    </>
  );
}
