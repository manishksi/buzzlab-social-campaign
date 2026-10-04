"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { finale as F } from "@/content/strategy";
import { filmKeys } from "@/lib/film-keys";
import { scrollToId, useLenis } from "@/components/chrome/SmoothScroll";

/**
 * ACT 09 — the last scene, played by the film: a final drag, the ember flares, he lowers it,
 * lets it drop, steps on it and grinds it out. The smoke thins to black. Then, quietly:
 * THIS ISN'T A CONTENT PLAN. / IT'S A MEDIA ENGINE.
 */
export function Finale() {
  const root = useRef<HTMLElement>(null);
  const lenis = useLenis();

  useGSAP(
    () => {
      const el = root.current!;
      gsap.set(["[data-final-a]", "[data-final-b]", "[data-credits]"], { autoAlpha: 0 });
      const tl = gsap.timeline({
        defaults: { ease: "power2.out" },
        scrollTrigger: { trigger: el, start: "top top", end: "+=440%", pin: true, scrub: 0.6 },
      });
      // the film carries the first 80%; the words wait for the dark
      tl.to({}, { duration: 0.82 })
        .fromTo("[data-final-a]", { autoAlpha: 0, y: 18, filter: "blur(8px)" }, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.05 }, 0.83)
        .fromTo("[data-final-b]", { autoAlpha: 0, y: 18, filter: "blur(8px)" }, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.05 }, 0.9)
        .fromTo("[data-credits]", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.03 }, 0.96)
        .to({}, { duration: 0.01 });

      const st = tl.scrollTrigger!;
      const off = filmKeys.register("finale", () => [
        { y: st.start, t: 1.06 },
        { y: st.start + (st.end - st.start) * 0.8, t: 1.2 },
      ]);
      return () => off();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="road-ahead" className="relative z-10 h-[100svh] overflow-hidden">
      <div className="gutter absolute inset-0 flex flex-col items-center justify-center text-center">
        <p data-final-a className="t-big text-bone/75">
          {F.final[0]}
        </p>
        <p data-final-b className="t-mega mt-3 text-bone">
          {F.final[1]}
        </p>
      </div>

      <div data-credits className="gutter absolute inset-x-0 bottom-8 flex flex-wrap items-end justify-between gap-4">
        <span className="t-slate">{F.credits}</span>
        <button type="button" data-cursor="Replay" onClick={() => scrollToId(lenis, "top")} className="t-label border border-bone/25 px-4 py-2 hover:border-ember hover:text-ember">
          ↺ Watch again
        </button>
      </div>
    </section>
  );
}
