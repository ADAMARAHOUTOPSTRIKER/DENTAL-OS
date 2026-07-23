"use client";

import { useEffect, useRef } from "react";

// IntersectionObserver-driven reveal. Resting state is defined by the `.reveal`
// CSS class; adding `.is-visible` triggers the transition. If the observer
// never fires (edge cases), a mount fallback forces visibility so content is
// never permanently hidden.
export default function Reveal({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: keyof JSX.IntrinsicElements;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transitionDelay = `${delay}s`;

    const reveal = () => el.classList.add("is-visible");

    if (typeof IntersectionObserver === "undefined") {
      reveal();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            reveal();
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);

    // Safety net: if still hidden shortly after mount, reveal anyway.
    const t = window.setTimeout(reveal, 1200);
    return () => {
      io.disconnect();
      window.clearTimeout(t);
    };
  }, [delay]);

  const Tag2 = Tag as React.ElementType;
  return (
    <Tag2 ref={ref} className={`reveal ${className}`}>
      {children}
    </Tag2>
  );
}
