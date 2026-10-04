"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

/** Counts every number inside `display` up from zero when scrolled into view ("4–8" animates both ends). */
export function Counter({ display, className, suffix = "" }: { display: string; className?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useGSAP(() => {
    const el = ref.current;
    if (!el) return;
    const parts = display.split(/(\d+)/);
    const nums = parts.map((p) => (/^\d+$/.test(p) ? Number(p) : null));
    const obj = { p: 0 };
    const render = () => {
      el.textContent = parts.map((p, i) => (nums[i] !== null ? String(Math.round((nums[i] as number) * obj.p)) : p)).join("") + suffix;
    };
    render();
    ScrollTrigger.create({
      trigger: el,
      start: "top 90%",
      once: true,
      onEnter: () => gsap.to(obj, { p: 1, duration: 1.6, ease: "power3.out", onUpdate: render }),
    });
  });
  return (
    <span ref={ref} className={`tabular ${className ?? ""}`} aria-label={display + suffix}>
      {display}
      {suffix}
    </span>
  );
}
