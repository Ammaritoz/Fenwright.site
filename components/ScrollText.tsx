"use client";

import { useEffect, useRef } from "react";

/**
 * A statement paragraph whose words light up as it scrolls through the
 * viewport. Rendered fully lit, and only dimmed once JS is running, so it never
 * ships half-visible; left fully lit under reduced motion.
 */
export function ScrollText({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const words = Array.from(el.querySelectorAll<HTMLSpanElement>("[data-word]"));
    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 as the paragraph enters near the bottom, 1 once it sits mid-screen.
      const progress = Math.min(1, Math.max(0, (vh * 0.92 - rect.top) / (vh * 0.5 + rect.height * 0.5)));
      const lit = progress * words.length;
      words.forEach((w, i) => {
        w.style.opacity = i < lit ? "1" : "0.3";
      });
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <p ref={ref} className={className}>
      {text.split(" ").map((word, i) => (
        <span key={i} data-word="" className="transition-opacity duration-300">
          {word}{" "}
        </span>
      ))}
    </p>
  );
}
