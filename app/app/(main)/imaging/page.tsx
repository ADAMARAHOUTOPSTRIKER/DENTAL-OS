"use client";

import { useMemo, useState } from "react";
import { Upload, ScanLine, ImageIcon, FileText, Plus, Eye } from "lucide-react";
import { useApp } from "@/lib/i18n";
import { Button, Avatar } from "@/components/ui/primitives";
import { PageHeader } from "@/components/app/blocks";
import { XrayArt, SmileArt } from "@/components/app/DentalArt";
import { useData } from "@/components/app/DataProvider";
import { useUI } from "@/components/app/ModalProvider";
import { cn } from "@/lib/utils";
import type { ClinicDocument, DocCategory, DocFile } from "@/lib/data";

const CAT_ICON = { xray: ScanLine, photo: ImageIcon, doc: FileText } as const;

function openFile(f: DocFile) {
  if (!f.dataUrl) return;
  const w = window.open();
  if (!w) return;
  if (f.kind === "image")
    w.document.write(`<img src="${f.dataUrl}" style="max-width:100%;height:auto;display:block;margin:auto"/>`);
  else w.location.href = f.dataUrl;
}

function FileThumb({ file, category }: { file: DocFile; category: DocCategory }) {
  const clickable = !!file.dataUrl;
  const body =
    file.dataUrl && file.kind === "image" ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={file.dataUrl} alt={file.name} className="h-28 w-full object-cover" />
    ) : file.kind === "image" && category === "xray" ? (
      <XrayArt className="h-28 w-full object-cover" />
    ) : file.kind === "image" ? (
      <SmileArt className="h-28 w-full" />
    ) : (
      <div className="grid h-28 w-full place-items-center bg-rose-50 text-rose-400">
        <FileText className="h-8 w-8" />
      </div>
    );

  return (
    <button
      onClick={() => openFile(file)}
      disabled={!clickable}
      className="group relative overflow-hidden rounded-xl border border-black/5 bg-sand-50 text-start"
      title={file.name}
    >
      {body}
      {clickable && (
        <span className="absolute inset-0 grid place-items-center bg-ink-950/0 opacity-0 transition-all group-hover:bg-ink-950/30 group-hover:opacity-100">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-ink-900"><Eye className="h-4 w-4" /></span>
        </span>
      )}
      <span className="block truncate px-2 py-1.5 text-[11px] text-ink-800/60">{file.name}</span>
    </button>
  );
}

export default function ImagingPage() {
  const { t } = useApp();
  const { documents } = useData();
  const ui = useUI();
  const [cat, setCat] = useState<"all" | DocCategory>("all");

  const cats: { key: "all" | DocCategory; label: string; icon?: typeof ScanLine }[] = [
    { key: "all", label: t("app.viewall") },
    { key: "xray", label: t("imaging.xray"), icon: ScanLine },
    { key: "photo", label: t("imaging.photos"), icon: ImageIcon },
    { key: "doc", label: t("imaging.docs"), icon: FileText },
  ];

  // Group documents by patient (respecting the category filter).
  const groups = useMemo(() => {
    const filtered = documents.filter((d) => cat === "all" || d.category === cat);
    const map = new Map<string, { patient: string; docs: ClinicDocument[] }>();
    filtered.forEach((d) => {
      const g = map.get(d.patientId) ?? { patient: d.patient, docs: [] };
      g.docs.push(d);
      map.set(d.patientId, g);
    });
    return Array.from(map.entries()).map(([patientId, g]) => ({ patientId, ...g }));
  }, [documents, cat]);

  return (
    <>
      <PageHeader
        title={t("imaging.title")}
        subtitle={t("f.imaging.d")}
        action={<Button variant="primary" onClick={() => ui.openNewDocument()}><Upload className="h-4 w-4" /> {t("imaging.upload")}</Button>}
      />

      <div className="rise mb-5 flex flex-wrap gap-1 rounded-xl border border-black/5 bg-white p-1" style={{ width: "fit-content" }}>
        {cats.map((c) => (
          <button
            key={c.key}
            onClick={() => setCat(c.key)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              cat === c.key ? "bg-ink-900 text-white" : "text-ink-800/60 hover:text-ink-900"
            )}
          >
            {c.icon && <c.icon className="h-4 w-4" />} {c.label}
          </button>
        ))}
      </div>

      {groups.length === 0 && (
        <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-black/10 py-20 text-center">
          <span className="text-sm text-ink-800/40">{t("doc.empty")}</span>
          <Button variant="outline" onClick={() => ui.openNewDocument()}><Upload className="h-4 w-4" /> {t("imaging.upload")}</Button>
        </div>
      )}

      <div className="space-y-5">
        {groups.map((g, gi) => (
          <section
            key={g.patientId}
            className="rise rounded-2xl border border-black/5 bg-white p-5 shadow-card"
            style={{ animationDelay: `${gi * 0.05}s` }}
          >
            <div className="mb-4 flex items-center gap-3">
              <Avatar name={g.patient} size={38} />
              <div className="flex-1">
                <div className="font-display text-base font-semibold text-ink-900">{g.patient}</div>
                <div className="text-xs text-ink-800/50">{g.docs.length} {t("imaging.docs").toLowerCase()}</div>
              </div>
            </div>

            <div className="space-y-4">
              {g.docs.map((d) => {
                const Icon = CAT_ICON[d.category];
                return (
                  <div key={d.id} className="rounded-xl border border-black/5 bg-sand-50/60 p-3">
                    <div className="mb-2.5 flex items-center gap-2">
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-teal-50 text-teal-600"><Icon className="h-3.5 w-3.5" /></span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-ink-900">{d.title}</div>
                        <div className="truncate text-[11px] text-ink-800/50">{t(`cat.${d.category}`)} · {d.createdAt} · {d.files.length} {t("doc.files.count")}</div>
                      </div>
                      <button
                        onClick={() => ui.openNewDocument({ patientId: g.patientId, docId: d.id })}
                        className="inline-flex items-center gap-1 rounded-lg border border-black/5 bg-white px-2.5 py-1.5 text-xs font-medium text-ink-800/70 transition-colors hover:border-teal-300 hover:text-teal-600"
                      >
                        <Plus className="h-3.5 w-3.5" /> {t("imaging.upload")}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                      {d.files.map((f, i) => (
                        <FileThumb key={i} file={f} category={d.category} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
