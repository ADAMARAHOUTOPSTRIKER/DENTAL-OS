"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Filter } from "lucide-react";
import { useApp } from "@/lib/i18n";
import { Avatar, Pill, Button } from "@/components/ui/primitives";
import { PageHeader } from "@/components/app/blocks";
import PatientDrawer from "@/components/app/PatientDrawer";
import { useData } from "@/components/app/DataProvider";
import { cn, mad } from "@/lib/utils";

type FilterKey = "all" | "balance" | "upcoming";

export default function PatientsPage() {
  const { t } = useApp();
  const { patients, patientById } = useData();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Deep-link support (?id=) without useSearchParams Suspense constraint.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (id && patientById(id)) setSelectedId(id);
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
        subtitle={`${patients.length} ${t("patients.count")}`}
        action={
          <Button variant="primary">
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
        <div className="flex items-center gap-1 rounded-xl border border-black/5 bg-white p-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                filter === f.key ? "bg-ink-900 text-white" : "text-ink-800/60 hover:text-ink-900"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* table */}
      <div className="rise overflow-hidden rounded-2xl border border-black/5 bg-white shadow-card" style={{ animationDelay: "0.05s" }}>
        {/* head */}
        <div className="hidden grid-cols-[2fr_1.3fr_1fr_1fr_1fr] gap-4 border-b border-black/5 bg-sand-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-800/45 md:grid">
          <span>{t("col.name")}</span>
          <span>{t("col.phone")}</span>
          <span>{t("col.last")}</span>
          <span>{t("col.balance")}</span>
          <span>{t("col.status")}</span>
        </div>
        <ul className="divide-y divide-black/5">
          {filtered.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => setSelectedId(p.id)}
                className="grid w-full grid-cols-1 items-center gap-2 px-5 py-3 text-start transition-colors hover:bg-sand-50 md:grid-cols-[2fr_1.3fr_1fr_1fr_1fr] md:gap-4"
              >
                <span className="flex items-center gap-3">
                  <Avatar name={p.name} size={40} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-ink-900">{p.name}</span>
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
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="grid place-items-center gap-2 py-16 text-sm text-ink-800/40">
              <Filter className="h-5 w-5" />
              —
            </li>
          )}
        </ul>
      </div>

      {selected && <PatientDrawer patient={selected} onClose={() => setSelectedId(null)} />}
    </>
  );
}
