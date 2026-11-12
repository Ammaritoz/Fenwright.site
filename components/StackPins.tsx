"use client";

import { useLayoutEffect } from "react";

/**
 * Sets the sticky `top` of each `[data-stack]` panel inside `#containerId` so
 * the panels stack as you scroll, on every screen size.
 *
 * A panel that fits the screen pins just under the nav, each one a little
 * lower than the last so the one behind shows as a lip. A panel taller than
 * the screen (the usual case on phones) would hide its own bottom half if it
 * pinned at the top, so it pins only once its bottom edge reaches the bottom
 * of the screen: you read all of it, then the next panel slides over.
 */
export function StackPins({ containerId }: { containerId: string }) {
  useLayoutEffect(() => {
    const root = document.getElementById(containerId);
    if (!root) return;
    const panels = Array.from(root.querySelectorAll<HTMLElement>("[data-stack]"));
    const NAV = 88;
    const LIP = 24;
    const BOTTOM_GAP = 16;

    const place = () => {
      const vh = window.innerHeight;
      panels.forEach((p, i) => {
        const fitsTop = NAV + i * LIP;
        const fitsBottom = vh - p.offsetHeight - BOTTOM_GAP;
        p.style.top = `${Math.min(fitsTop, fitsBottom)}px`;
      });
    };

    place();
    const ro = new ResizeObserver(place);
    panels.forEach((p) => ro.observe(p));
    window.addEventListener("resize", place);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", place);
    };
  }, [containerId]);

  return null;
}
