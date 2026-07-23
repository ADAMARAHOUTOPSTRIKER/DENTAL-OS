"use client";

import { useState } from "react";
import { Upload, ScanLine, ImageIcon, FileText, Download, Eye } from "lucide-react";
import { useApp } from "@/lib/i18n";
import { Button, Avatar } from "@/components/ui/primitives";
import { PageHeader } from "@/components/app/blocks";
import { XrayArt, SmileArt } from "@/components/app/DentalArt";
import { cn } from "@/lib/utils";

const XRAYS = [
  { patient: "Youssef Berrada", date: "30 Jun 2026", type: "Panoramique" },
  { patient: "Mehdi Benali", date: "02 Jul 2026", type: "Rétro-alvéolaire 16" },
  { patient: "Salma Cherkaoui", date: "18 May 2026", type: "Panoramique" },
];
const CASES = [
  { patient: "Salma Cherkaoui", act: "Blanchiment", date: "20 Jul 2026" },
  { patient: "Yasmine Alaoui", act: "Facette 21", date: "12 Jun 2026" },
];
const DOCS = [
  { name: "Consentement — implant.pdf", patient: "Youssef Berrada", size: "240 Ko" },
  { name: "Devis orthodontie.pdf", patient: "Yasmine Alaoui", size: "180 Ko" },
  { name: "Ordonnance — amoxicilline.pdf", patient: "Nawal Fassi", size: "96 Ko" },
];

export default function ImagingPage() {
  const { t } = useApp();
  const tabs = [
    { key: "xray", label: t("imaging.xray"), icon: ScanLine },
    { key: "photos", label: t("imaging.photos"), icon: ImageIcon },
    { key: "docs", label: t("imaging.docs"), icon: FileText },
  ];
  const [tab, setTab] = useState("xray");

  return (
    <>
      <PageHeader
        title={t("imaging.title")}
        subtitle={t("f.imaging.d")}
        action={<Button variant="primary"><Upload className="h-4 w-4" /> {t("imaging.upload")}</Button>}
      />

      <div className="rise mb-5 flex gap-1 rounded-xl border border-black/5 bg-white p-1" style={{ width: "fit-content" }}>
        {tabs.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              tab === tb.key ? "bg-ink-900 text-white" : "text-ink-800/60 hover:text-ink-900"
            )}
          >
            <tb.icon className="h-4 w-4" /> {tb.label}
          </button>
        ))}
      </div>

      {tab === "xray" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {XRAYS.map((x, i) => (
            <div key={i} className="rise group overflow-hidden rounded-2xl border border-black/5 bg-white shadow-card transition-all hover:-translate-y-1 hover:shadow-float" style={{ animationDelay: `${i * 0.06}s` }}>
              <div className="relative">
                <XrayArt className="h-44 w-full object-cover" />
                <div className="absolute inset-0 grid place-items-center bg-ink-950/0 opacity-0 transition-all group-hover:bg-ink-950/30 group-hover:opacity-100">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-white/90 text-ink-900"><Eye className="h-5 w-5" /></span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-3">
                <Avatar name={x.patient} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-ink-900">{x.patient}</div>
                  <div className="truncate text-xs text-ink-800/50">{x.type} · {x.date}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "photos" && (
        <div className="grid gap-5 sm:grid-cols-2">
          {CASES.map((c, i) => (
            <div key={i} className="rise overflow-hidden rounded-2xl border border-black/5 bg-white shadow-card" style={{ animationDelay: `${i * 0.06}s` }}>
              <div className="grid grid-cols-2">
                <div className="relative">
                  <SmileArt className="h-40 w-full" />
                  <span className="absolute left-2 top-2 rounded-md bg-ink-950/70 px-2 py-0.5 text-[11px] font-semibold text-white">{t("imaging.before")}</span>
                </div>
                <div className="relative border-s border-black/5">
                  <SmileArt bright className="h-40 w-full" />
                  <span className="absolute left-2 top-2 rounded-md bg-teal-500 px-2 py-0.5 text-[11px] font-semibold text-white">{t("imaging.after")}</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-3">
                <Avatar name={c.patient} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-ink-900">{c.patient}</div>
                  <div className="truncate text-xs text-ink-800/50">{c.act} · {c.date}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "docs" && (
        <div className="rise overflow-hidden rounded-2xl border border-black/5 bg-white shadow-card">
          <ul className="divide-y divide-black/5">
            {DOCS.map((d, i) => (
              <li key={i} className="flex items-center gap-3 px-5 py-3.5 hover:bg-sand-50">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-500"><FileText className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-ink-900">{d.name}</div>
                  <div className="truncate text-xs text-ink-800/50">{d.patient} · {d.size}</div>
                </div>
                <button className="grid h-9 w-9 place-items-center rounded-lg text-ink-800/50 hover:bg-white hover:text-teal-600"><Download className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
