"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { meta } from "@/content/strategy";
import { useLenis } from "./SmoothScroll";

/** Opening slate: a clapperboard snap, then the curtain lifts on the dead feed. */
export function IntroSlate() {
  const root = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);
  const lenis = useLenis();

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const finish = () => {
      setDone(true);
      window.dispatchEvent(new Event("intro:done"));
    };
    if (prefersReducedMotion()) {
      finish();
      return;
    }
    lenis?.stop();
    window.scrollTo(0, 0);
    const tl = gsap.timeline({
      onComplete: () => {
        lenis?.start();
        finish();
      },
    });
    tl.from(el.querySelectorAll("[data-slate-row]"), { yPercent: 110, duration: 0.7, stagger: 0.06, ease: "expo.out" }, 0.1)
      .fromTo(el.querySelector("[data-clap]"), { rotate: -24 }, { rotate: 0, duration: 0.22, ease: "power4.in" }, 0.75)
      .to(el.querySelector("[data-flash]"), { opacity: 0.9, duration: 0.04 }, 0.97)
      .to(el.querySelector("[data-flash]"), { opacity: 0, duration: 0.3 }, 1.01)
      .to(el, { yPercent: -100, duration: 0.9, ease: "expo.inOut" }, 1.25);
    // A visitor who clicks or presses a key skips straight in.
    const skip = () => tl.progress(1);
    window.addEventListener("keydown", skip, { once: true });
    el.addEventListener("click", skip, { once: true });
    return () => {
      window.removeEventListener("keydown", skip);
      tl.kill();
    };
  }, [lenis]);

  if (done) return null;
  return (
    <div ref={root} className="fixed inset-0 z-[90] flex items-center justify-center bg-ink" aria-hidden>
      <div data-flash className="pointer-events-none absolute inset-0 bg-bone opacity-0" />
      <div className="w-[min(560px,86vw)] text-bone">
        <div className="relative mb-3 h-10 overflow-hidden">
          <div data-clap className="absolute inset-x-0 top-1 h-8 origin-bottom-left" style={{ background: "repeating-linear-gradient(115deg, #efe8de 0 22px, #000000 22px 44px)" }} />
        </div>
        <div className="grid grid-cols-3 border border-bone/40 font-mono text-[0.72rem] uppercase tracking-[0.14em]">
          {[
            ["Production", meta.brand],
            ["Scene", "Instagram"],
            ["Take", "01"],
          ].map(([k, v]) => (
            <div key={k} className="overflow-hidden border-r border-bone/40 p-3 last:border-r-0">
              <div data-slate-row className="text-ash">{k}</div>
              <div data-slate-row className="mt-1 font-display text-2xl font-extrabold tracking-normal text-bone">{v}</div>
            </div>
          ))}
        </div>
        <div className="flex justify-between overflow-hidden border-x border-b border-bone/40 p-3 font-mono text-[0.72rem] uppercase tracking-[0.14em] text-ash">
          <span data-slate-row>{meta.kicker}</span>
          <span data-slate-row>{meta.year}</span>
        </div>
      </div>
    </div>
  );
}
