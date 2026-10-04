"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";

const LenisContext = createContext<Lenis | null>(null);
export const useLenis = () => useContext(LenisContext);

/** Smooth scrolling (Lenis) wired into GSAP's ticker so ScrollTrigger and Lenis share one clock. */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const rafRef = useRef<((t: number) => void) | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const l = new Lenis({
      duration: 1.25,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.4,
    });
    l.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => l.raf(time * 1000);
    rafRef.current = tick;
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    setLenis(l);
    (window as unknown as { __buzzlab?: { lenis: Lenis } }).__buzzlab = { lenis: l };
    return () => {
      if (rafRef.current) gsap.ticker.remove(rafRef.current);
      l.destroy();
      setLenis(null);
    };
  }, []);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}

/** Scroll to an element id, smoothly when Lenis is running. */
export function scrollToId(lenis: Lenis | null, id: string, opts: { immediate?: boolean; offset?: number } = {}) {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: opts.offset ?? 0, immediate: opts.immediate, duration: 1.6, force: true });
  else el.scrollIntoView({ behavior: opts.immediate ? "auto" : "smooth" });
}
