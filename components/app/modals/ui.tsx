"use client";

import { X } from "lucide-react";
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
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4">
      <div
        className="fade-in absolute inset-0 bg-ink-950/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
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
  return <select {...props} className={cn(inputCls, "appearance-none", props.className)} />;
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputCls, "resize-none", props.className)} />;
}
