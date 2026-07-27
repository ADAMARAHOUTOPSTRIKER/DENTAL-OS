"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Modal({
  title,
  subtitle,
  icon,
  onClose,
  children,
  footer,
  size = "md",
}: {
  title: string;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    // Échap ferme la modale. On ignore la touche si un enfant l'a déjà
    // consommée (le Combo appelle preventDefault pour fermer sa propre liste).
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) closeRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    // Verrou du défilement du fond ; on compense la barre de défilement pour
    // éviter que la page « saute » à l'ouverture (inline-end : côté barre en RTL aussi).
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevPad = body.style.paddingInlineEnd;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingInlineEnd = `${gap}px`;
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingInlineEnd = prevPad;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4">
      <div
        className="fade-in absolute inset-0 bg-ink-950/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "pop-in relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-float",
          size === "lg" ? "max-w-2xl" : size === "sm" ? "max-w-sm" : "max-w-lg"
        )}
      >
        <header className="flex items-start gap-3 border-b border-black/5 p-5">
          {icon && (
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-600">
              {icon}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-bold text-ink-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-ink-800/55">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-800/50 hover:bg-ink-900/5"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && (
          <footer className="flex items-center justify-end gap-2 border-t border-black/5 bg-sand-50 p-4">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
  required,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1 text-xs font-medium text-ink-800/55">
        {label}
        {required && <span className="text-rose-500">*</span>}
        {hint && <span className="font-normal text-ink-800/35">· {hint}</span>}
      </span>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-ink-900 outline-none transition-colors focus:border-teal-400 placeholder:text-ink-800/35";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputCls, props.className)} />;
}
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="relative block">
      <select {...props} className={cn(inputCls, "appearance-none pe-9", props.className)} />
      <ChevronDown className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-800/35" />
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Combo : on tape, on est aidé — mais on n'est jamais enfermé          */
/* ------------------------------------------------------------------ */

export interface ComboOption {
  /** Valeur technique renvoyée à onPick (identifiant patient, clé de catégorie…). */
  value: string;
  /** Ce que l'utilisateur lit et sur quoi porte la recherche. */
  label: string;
  /** Complément affiché à droite (solde, ville…). */
  hint?: string;
}

/** Recherche insensible à la casse ET aux accents : « detartrage » trouve « Détartrage ». */
function fold(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * Champ texte avec suggestions.
 *
 * Une liste déroulante enferme : le praticien ne peut saisir que ce qui a été
 * prévu. Ici il tape ce qu'il veut — les entrées existantes remontent au fur
 * et à mesure, et s'il tape autre chose, cette valeur est acceptée telle
 * quelle. C'est le comportement attendu au fauteuil : on note d'abord, on
 * range ensuite.
 */
export function Combo({
  text,
  onText,
  options,
  onPick,
  placeholder,
  autoFocus,
  createLabel,
  emptyLabel,
  className,
}: {
  text: string;
  onText: (value: string) => void;
  options: ComboOption[];
  /** Appelé quand une suggestion est retenue. */
  onPick: (option: ComboOption) => void;
  placeholder?: string;
  autoFocus?: boolean;
  /** Libellé de la ligne « créer » quand la saisie ne correspond à rien. */
  createLabel?: (value: string) => string;
  emptyLabel?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const query = fold(text.trim());
  const matches = useMemo(() => {
    if (!query) return options.slice(0, 8);
    return options
      .filter((o) => fold(o.label).includes(query) || fold(o.hint ?? "").includes(query))
      .slice(0, 8);
  }, [options, query]);

  const exact = matches.some((o) => fold(o.label) === query);
  const showCreate = Boolean(createLabel) && query.length > 0 && !exact;

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const choose = (o: ComboOption) => {
    onPick(o);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => {
        const n = matches.length;
        if (!n) return 0;
        return e.key === "ArrowDown" ? (i + 1) % n : (i - 1 + n) % n;
      });
      return;
    }
    if (e.key === "Enter" && open && matches[active]) {
      e.preventDefault();
      choose(matches[active]);
      return;
    }
    if (e.key === "Escape" && open) {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <input
        value={text}
        onChange={(e) => {
          onText(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        className={cn(inputCls, "pe-9")}
      />
      <ChevronDown
        className={cn(
          "pointer-events-none absolute end-3 top-[1.15rem] h-4 w-4 -translate-y-1/2 text-ink-800/35 transition-transform",
          open && "rotate-180"
        )}
      />

      {open && (matches.length > 0 || showCreate || emptyLabel) && (
        <ul
          id={listId}
          role="listbox"
          className="pop-in absolute inset-x-0 top-full z-[80] mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-black/5 bg-white p-1 shadow-float"
        >
          {matches.map((o, i) => (
            <li key={o.value}>
              <button
                type="button"
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(o)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm transition-colors",
                  i === active ? "bg-teal-50 text-teal-800" : "text-ink-800/80"
                )}
              >
                <span className="min-w-0 flex-1 truncate font-medium">{o.label}</span>
                {o.hint && <span className="shrink-0 text-xs text-ink-800/45">{o.hint}</span>}
                {fold(o.label) === query && <Check className="h-3.5 w-3.5 shrink-0 text-teal-600" />}
              </button>
            </li>
          ))}

          {showCreate && (
            <li>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm font-medium text-teal-700 transition-colors hover:bg-teal-50"
              >
                <Plus className="h-3.5 w-3.5 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{createLabel!(text.trim())}</span>
              </button>
            </li>
          )}

          {!matches.length && !showCreate && emptyLabel && (
            <li className="px-3 py-4 text-center text-sm text-ink-800/40">{emptyLabel}</li>
          )}
        </ul>
      )}
    </div>
  );
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputCls, "resize-none", props.className)} />;
}
