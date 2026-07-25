"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animated count-up. Eases from 0 to `value` when it scrolls into view.
 * Respects prefers-reduced-motion (renders the final value instantly).
 */
export function Counter({
  value,
  format = (n) => Math.round(n).toLocaleString("fr-MA"),
  duration = 1100,
  className,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }

    let raf = 0;
    let safety = 0;
    let startTs = 0;
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    const tick = (ts: number) => {
      if (!startTs) startTs = ts;
      const p = Math.min(1, (ts - startTs) / duration);
      setDisplay(value * easeOutCubic(p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (started.current) return;
      started.current = true;
      setDisplay(0);
      raf = requestAnimationFrame(tick);
      // Filet de sécurité : dans un onglet en arrière-plan le navigateur gèle
      // requestAnimationFrame, et le compteur resterait bloqué sur 0 — soit
      // exactement l'écran qu'un prospect ne doit jamais voir. Passé le temps
      // de l'animation, on affiche la vraie valeur quoi qu'il arrive.
      safety = window.setTimeout(() => setDisplay(value), duration + 400);
    };

    const el = ref.current;
    const cleanup = () => {
      cancelAnimationFrame(raf);
      clearTimeout(safety);
    };

    if (el && "IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            start();
            io.disconnect();
          }
        },
        { threshold: 0.35 }
      );
      io.observe(el);
      return () => {
        io.disconnect();
        cleanup();
      };
    }
    start();
    return cleanup;
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {format(display)}
    </span>
  );
}
