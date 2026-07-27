"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  Upload, ScanLine, ImageIcon, FileText, Plus, X, ChevronLeft, ChevronRight,
  GripVertical, Maximize2, Download,
} from "lucide-react";
import { useApp } from "@/lib/i18n";
import { Button, Avatar } from "@/components/ui/primitives";
import { PageHeader } from "@/components/app/blocks";
import { ScanImage, SmileArt } from "@/components/app/DentalArt";
import { useData } from "@/components/app/DataProvider";
import { useUI } from "@/components/app/ModalProvider";
import { cn, isoToLabel } from "@/lib/utils";
import { catLabel, isKnownCategory, type ClinicDocument, type DocCategory, type DocFile } from "@/lib/data";

const CAT_ICON: Record<string, typeof ScanLine> = { xray: ScanLine, photo: ImageIcon, doc: FileText };
/** Les categories libres saisies par le cabinet retombent sur l'icone document. */
const catIcon = (c: string) => CAT_ICON[c] ?? FileText;

/* Render a file's visual — real image if present, else on-brand placeholder art. */
function Visual({
  file, category, bright = false, className,
}: { file: DocFile; category: DocCategory; bright?: boolean; className?: string }) {
  if (file.dataUrl && file.kind === "image")
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={file.dataUrl} alt={file.name} className={cn("h-full w-full object-cover", className)} />;
  // Radiographies : de vrais clichés. Un dentiste reconnaît une radio en une
  // demi-seconde, et un dessin lui dit « ce logiciel n'a jamais vu un patient ».
  if (file.kind === "image" && category === "xray")
    return <ScanImage seed={file.name} alt={file.name} className={className} />;
  if (file.kind === "image")
    return <SmileArt bright={bright} className={cn("h-full w-full", className)} />;
  return (
    <div className={cn("grid h-full w-full place-items-center bg-gradient-to-br from-rose-50 to-rose-100 text-rose-400", className)}>
      <FileText className="h-10 w-10" />
    </div>
  );
}

/* ---------------- Before / After drag slider ---------------- */
function BeforeAfter({ before, after }: { before: DocFile; after: DocFile }) {
  const { t } = useApp();
  const [pos, setPos] = useState(52);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const setFromX = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos(Math.max(2, Math.min(98, ((clientX - r.left) / r.width) * 100)));
  };
  const down = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    setFromX(e.clientX);
  };
  const move = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragging.current) setFromX(e.clientX);
  };
  const up = () => { dragging.current = false; };

  return (
    <div
      ref={ref}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      className="group relative aspect-[16/10] w-full cursor-ew-resize touch-none select-none overflow-hidden rounded-xl ring-1 ring-black/5"
    >
      <div className="absolute inset-0"><Visual file={after} category="photo" bright /></div>
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <Visual file={before} category="photo" />
      </div>

      <span className="pointer-events-none absolute left-2 top-2 rounded-md bg-ink-950/70 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">{t("imaging.before")}</span>
      <span className="pointer-events-none absolute right-2 top-2 rounded-md bg-teal-500 px-2 py-0.5 text-[11px] font-semibold text-white">{t("imaging.after")}</span>

      <div className="pointer-events-none absolute inset-y-0 z-10 w-0.5 -translate-x-1/2 bg-white/90 shadow-[0_0_10px_rgba(0,0,0,0.3)]" style={{ left: `${pos}%` }}>
        <span className="absolute top-1/2 left-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-ink-800 shadow-float transition-transform group-hover:scale-110">
          <GripVertical className="h-4 w-4" />
        </span>
      </div>
      <span className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-ink-950/55 px-2.5 py-1 text-[11px] text-white/90 backdrop-blur">
        {t("imaging.compare")}
      </span>
    </div>
  );
}

/**
 * Enregistre un fichier sur le poste.
 *
 * `window.open` sur une URL `data:` est bloqué par tous les navigateurs
 * récents — le bouton « Télécharger » ne faisait donc strictement rien. On
 * repasse par un Blob et un lien `download`, qui reste autorisé.
 */
function downloadFile(f: DocFile) {
  if (!f.dataUrl) return;
  const [meta, b64] = f.dataUrl.split(",");
  const mime = meta.match(/:(.*?);/)?.[1] ?? "application/octet-stream";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = f.name;
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------------- Lightbox ---------------- */
interface LightboxState { files: DocFile[]; index: number; category: DocCategory; title: string; patient: string; }

function Lightbox({ state, onClose, onIndex }: { state: LightboxState; onClose: () => void; onIndex: (i: number) => void }) {
  const { t } = useApp();
  const { files, index, category, title, patient } = state;
  const many = files.length > 1;
  const cur = files[index];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && many) onIndex((index + 1) % files.length);
      if (e.key === "ArrowLeft" && many) onIndex((index - 1 + files.length) % files.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, files.length, many, onClose, onIndex]);

  return (
    <div className="fade-in fixed inset-0 z-[70] grid place-items-center p-4 sm:p-8">
      <div className="absolute inset-0 bg-ink-950/85 backdrop-blur-md" onClick={onClose} />
      <div className="pop-in relative w-full max-w-4xl">
        <div className="flex items-center justify-between px-1 pb-3 text-white">
          <div className="flex items-center gap-3">
            <Avatar name={patient} size={34} ring />
            <div>
              <div className="text-sm font-semibold">{title}</div>
              <div className="text-xs text-white/55">{patient} · {catLabel(category, t)}{many ? ` · ${index + 1}/${files.length}` : ""}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => downloadFile(cur)} disabled={!cur.dataUrl}
              className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:opacity-30" title={t("common.download")}>
              <Download className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-white hover:bg-white/20"><X className="h-5 w-5" /></button>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-ink-900 shadow-float">
          <div className="grid max-h-[70vh] min-h-[40vh] w-full place-items-center">
            <div className="h-[60vh] w-full"><Visual file={cur} category={category} bright={index % 2 === 1} /></div>
          </div>
          {many && (
            <>
              <button onClick={() => onIndex((index - 1 + files.length) % files.length)}
                className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink-900 shadow-float transition-transform hover:scale-105">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button onClick={() => onIndex((index + 1) % files.length)}
                className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink-900 shadow-float transition-transform hover:scale-105">
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
          <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-ink-950/60 px-3 py-1 text-xs text-white/80 backdrop-blur">{cur.name}</span>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Thumbnail ---------------- */
function Thumb({ file, category, onOpen }: { file: DocFile; category: DocCategory; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="group relative overflow-hidden rounded-xl border border-black/5 bg-sand-50 text-start shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-float"
      title={file.name}
    >
      <div className="h-28 w-full overflow-hidden">
        <div className="h-full w-full transition-transform duration-500 group-hover:scale-110">
          <Visual file={file} category={category} />
        </div>
      </div>
      <span className="absolute inset-x-0 top-0 grid h-28 place-items-center bg-gradient-to-t from-ink-950/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-white/95 text-ink-900 shadow-float"><Maximize2 className="h-4 w-4" /></span>
      </span>
      <span className="block truncate px-2 py-1.5 text-[11px] text-ink-800/60">{file.name}</span>
    </button>
  );
}

/* ---------------- Page ---------------- */
export default function ImagingPage() {
  const { t, lang } = useApp();
  const { documents } = useData();
  const ui = useUI();
  const [cat, setCat] = useState<"all" | DocCategory>("all");
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

  // Les trois familles connues, puis les categories que le cabinet a lui-meme
  // creees en tapant leur nom : le filtre suit l'organisation reelle du coffre.
  const customCats = useMemo(
    () => Array.from(new Set(documents.map((d) => d.category).filter((c) => !isKnownCategory(c)))).sort(),
    [documents]
  );
  const cats: { key: "all" | DocCategory; label: string; icon?: typeof ScanLine }[] = [
    { key: "all", label: t("app.viewall") },
    { key: "xray", label: t("imaging.xray"), icon: ScanLine },
    { key: "photo", label: t("imaging.photos"), icon: ImageIcon },
    { key: "doc", label: t("imaging.docs"), icon: FileText },
    ...customCats.map((c) => ({ key: c, label: c, icon: FileText })),
  ];
  // Position du curseur, mesurée sur le bouton actif. `insetInlineStart` se
  // calcule depuis le bord de début, qui est à droite en arabe.
  const catRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [ind, setInd] = useState({ start: 0, width: 0 });
  useEffect(() => {
    const el = catRefs.current[String(cat)];
    const box = el?.parentElement;
    if (!el || !box) return;
    const rtl = getComputedStyle(box).direction === "rtl";
    const start = rtl
      ? box.clientWidth - el.offsetLeft - el.offsetWidth
      : el.offsetLeft;
    setInd({ start, width: el.offsetWidth });
  }, [cat, cats.length, lang]);

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

  const openLightbox = (d: ClinicDocument, index: number) =>
    setLightbox({ files: d.files, index, category: d.category, title: d.title, patient: d.patient });

  return (
    <>
      <PageHeader
        title={t("imaging.title")}
        subtitle={t("f.imaging.d")}
        action={<Button variant="primary" onClick={() => ui.openNewDocument()}><Upload className="h-4 w-4" /> {t("imaging.upload")}</Button>}
      />

      {/* Filtre — le curseur est MESURÉ sur l'onglet actif. Il était calculé sur
          une largeur fixe d'un quart : il débordait, masquait le libellé actif,
          et désignait le mauvais onglet en arabe. Le nombre d'onglets est en
          plus variable depuis que le cabinet crée ses propres catégories. */}
      <div className="rise relative mb-5 flex w-full overflow-x-auto rounded-xl border border-black/5 bg-white p-1 shadow-sm sm:w-fit">
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-1 top-1 rounded-lg bg-ink-900 shadow-sm"
          style={{
            insetInlineStart: ind.start,
            width: ind.width,
            transition: "inset-inline-start 0.42s cubic-bezier(0.16,1,0.3,1), width 0.42s cubic-bezier(0.16,1,0.3,1)",
          }}
        />
        {cats.map((c) => (
          <button key={c.key} onClick={() => setCat(c.key)}
            ref={(el) => { catRefs.current[String(c.key)] = el; }}
            className={cn("relative z-10 flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              cat === c.key ? "text-white" : "text-ink-800/60 hover:text-ink-900")}>
            {c.icon && <c.icon className="h-4 w-4 shrink-0" />} {c.label}
          </button>
        ))}
      </div>

      {groups.length === 0 && (
        <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-black/10 py-20 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-500"><ImageIcon className="h-6 w-6" /></span>
          <span className="text-sm text-ink-800/40">{t("doc.empty")}</span>
          <Button variant="outline" onClick={() => ui.openNewDocument()}><Upload className="h-4 w-4" /> {t("imaging.upload")}</Button>
        </div>
      )}

      <div key={cat} className="tab-panel space-y-5">
        {groups.map((g, gi) => (
          <section key={g.patientId} className="rise rounded-2xl border border-black/5 bg-white p-5 shadow-card" style={{ animationDelay: `${gi * 0.05}s` }}>
            <div className="mb-4 flex items-center gap-3">
              <Avatar name={g.patient} size={38} />
              <div className="flex-1">
                <div className="font-display text-base font-semibold text-ink-900">{g.patient}</div>
                <div className="text-xs text-ink-800/50">{g.docs.length} {t("imaging.docs").toLowerCase()}</div>
              </div>
            </div>

            <div className="space-y-4">
              {g.docs.map((d) => {
                const Icon = catIcon(d.category);
                const isPair = d.category === "photo" && d.files.filter((f) => f.kind === "image").length >= 2;
                return (
                  <div key={d.id} className="rounded-xl border border-black/5 bg-sand-50/60 p-3">
                    <div className="mb-2.5 flex items-center gap-2">
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-teal-50 text-teal-600"><Icon className="h-3.5 w-3.5" /></span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-ink-900">{d.title}</div>
                        <div className="truncate text-[11px] text-ink-800/50">{catLabel(d.category, t)} · {isoToLabel(d.createdAt, lang)} · {d.files.length} {t("doc.files.count")}</div>
                      </div>
                      <button onClick={() => ui.openNewDocument({ patientId: g.patientId, docId: d.id })}
                        className="inline-flex items-center gap-1 rounded-lg border border-black/5 bg-white px-2.5 py-1.5 text-xs font-medium text-ink-800/70 transition-colors hover:border-teal-300 hover:text-teal-600">
                        <Plus className="h-3.5 w-3.5" /> {t("imaging.upload")}
                      </button>
                    </div>

                    {isPair ? (
                      <div className="space-y-2">
                        <BeforeAfter before={d.files[0]} after={d.files[1]} />
                        {d.files.length > 2 && (
                          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                            {d.files.slice(2).map((f, i) => (
                              <Thumb key={i} file={f} category={d.category} onOpen={() => openLightbox(d, i + 2)} />
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                        {d.files.map((f, i) => (
                          <Thumb key={i} file={f} category={d.category} onOpen={() => openLightbox(d, i)} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {lightbox && (
        <Lightbox
          state={lightbox}
          onClose={() => setLightbox(null)}
          onIndex={(i) => setLightbox((s) => (s ? { ...s, index: i } : s))}
        />
      )}
    </>
  );
}
