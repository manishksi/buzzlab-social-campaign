"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { light as F } from "@/content/strategy";
import { filmKeys } from "@/lib/film-keys";
import { PhaseHeader } from "./PhaseHeader";

/**
 * PHASE 03 — Light. The cigarette is lit and burns down as this phase scrolls by; the words keep
 * to the left of the frame, he holds the right. Then the last shot of his story, with nothing on
 * screen but him: a final drag, the drop, the boot, the ember going out, black.
 */
export function Light() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      gsap.from("[data-choose] li", { autoAlpha: 0, x: -30, stagger: 0.1, duration: 0.9, ease: "expo.out", scrollTrigger: { trigger: "[data-choose]", start: "top 80%", once: true } });
      gsap.from("[data-evo] li", { autoAlpha: 0, y: 30, stagger: 0.12, duration: 0.9, ease: "expo.out", scrollTrigger: { trigger: "[data-evo]", start: "top 80%", once: true } });

      // the last cigarette: a pinned, empty frame that the film plays out on
      const last = el.querySelector<HTMLElement>("[data-last]")!;
      const st = gsap.timeline({ scrollTrigger: { trigger: last, start: "top top", end: "+=380%", pin: true, scrub: true } }).to({}, { duration: 1 }).scrollTrigger!;
      const off = filmKeys.register("light", () => [
        { y: last.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.6, t: 0.93 },
        { y: st.start, t: 0.94 },
        { y: st.start + (st.end - st.start) * 0.92, t: 1.08 },
      ]);
      return () => off();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="light" className="relative z-10 pt-[24vh]">
      <PhaseHeader n={F.n} name={F.name} months={F.months} objective={F.objective} heat={1}>
        <p className="t-lede mt-6">{F.notLockedLede}</p>
      </PhaseHeader>

      <div className="gutter mx-auto mt-[10vh] grid max-w-[1600px] grid-cols-12 gap-x-6">
        <div className="col-span-12 md:col-span-8 lg:col-span-6">

          <p className="t-slate mb-4">How we choose</p>
          <ol data-choose className="border-b hairline">
            {F.howWeChoose.map((h, i) => (
              <li key={h.phase} className="grid grid-cols-[6.5rem_1fr] items-baseline gap-4 border-t hairline py-5">
                <span className={`t-label ${i === 2 ? "text-buzz" : "text-ash"}`}>{h.phase}</span>
                <span className="font-display text-[clamp(1.35rem,2vw,2rem)] font-bold uppercase leading-tight">{h.learn}</span>
              </li>
            ))}
          </ol>

          <p className="t-slate mb-6 mt-[12vh]">The evolution</p>
          <ol data-evo className="flex flex-wrap items-baseline gap-x-5 gap-y-3">
            {F.evolution.map((e, i) => (
              <li key={e.word} className="flex items-baseline gap-5">
                <span className="flex flex-col">
                  <span className="t-slate">{e.phase}</span>
                  <span className={`mt-1 font-display text-[clamp(2.2rem,4vw,4.2rem)] font-extrabold uppercase leading-[0.85] ${i === 2 ? "text-buzz" : ""}`}>{e.word}</span>
                </span>
                {i < F.evolution.length - 1 && (
                  <span aria-hidden className="font-display text-[clamp(1.6rem,3vw,3rem)] text-bone/30">
                    →
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* the last shot of his story — nothing on screen but the film */}
      <div data-last aria-hidden className="mt-[20vh] h-[100svh]" />
    </section>
  );
}
