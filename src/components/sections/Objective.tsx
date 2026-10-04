"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { objective as O } from "@/content/strategy";
import { playSwell } from "@/lib/audio";

/** ACT 02 — everything disappears except one sentence, then the chain that sentence sets off. */
export function Objective() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const el = root.current!;
      const mm = gsap.matchMedia();
      mm.add({ desktop: "(min-width: 768px)", mobile: "(max-width: 767px)" }, () => {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: el, start: "top top", end: "+=220%", pin: true, scrub: 0.8, onEnter: () => playSwell() },
        });
        tl.fromTo("[data-st-a]", { autoAlpha: 0, yPercent: 30, letterSpacing: "0.12em" }, { autoAlpha: 1, yPercent: 0, letterSpacing: "-0.01em", duration: 0.2, ease: "power3.out" }, 0)
          .fromTo("[data-st-b]", { autoAlpha: 0, yPercent: 40, filter: "blur(16px)" }, { autoAlpha: 1, yPercent: 0, filter: "blur(0px)", duration: 0.2, ease: "power3.out" }, 0.12)
          .to("[data-statement]", { scale: 0.62, yPercent: -62, duration: 0.2, ease: "power2.inOut" }, 0.42)
          .fromTo("[data-chain-line]", { autoAlpha: 0, scaleX: 0, scaleY: 0 }, { autoAlpha: 1, scaleX: 1, scaleY: 1, duration: 0.3, ease: "none" }, 0.5);
        gsap.utils.toArray<HTMLElement>("[data-chain-node]", el).forEach((n, i) => {
          tl.fromTo(n, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.07, ease: "power2.out" }, 0.52 + i * 0.07)
            .fromTo(n.querySelector("[data-dot]"), { scale: 0 }, { scale: 1, duration: 0.05 }, 0.52 + i * 0.07);
        });
        tl.fromTo("[data-explain]", { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.12 }, 0.84).to({}, { duration: 0.1 });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="system" className="relative z-10 flex h-[100svh] flex-col items-center justify-center overflow-hidden text-center">
      <p className="t-slate absolute top-[calc(env(safe-area-inset-top,0px)+6rem)]">{O.eyebrow}</p>
      <h2 data-statement className="gutter relative">
        <span data-st-a className="t-mega block">{O.statement[0]}</span>
        <span data-st-b className="t-serif ember-text block text-[clamp(3.2rem,11vw,12rem)] leading-[0.95]" style={{ textShadow: "0 0 80px rgba(239,106,42,.25)" }}>
          {O.statement[1]}
        </span>
      </h2>

      <div className="gutter absolute inset-x-0 top-[52%] md:top-[50%]">
        <ol className="relative mx-auto flex max-w-[1200px] flex-col items-center gap-6 md:flex-row md:justify-between md:gap-0">
          <span data-chain-line aria-hidden className="absolute left-1/2 top-0 h-full w-px origin-top bg-gradient-to-b from-bone/10 via-ember to-amber md:left-[6%] md:right-[6%] md:top-[11px] md:h-px md:w-auto md:origin-left md:bg-gradient-to-r" />
          {O.chain.map((c, i) => (
            <li key={c} data-chain-node className="relative z-10 flex flex-col items-center gap-3 bg-ink px-3">
              <span data-dot className={`h-[22px] w-[22px] rounded-full border ${i === O.chain.length - 1 ? "border-ember bg-ember shadow-[0_0_30px_rgba(239,106,42,.8)]" : "border-bone/60 bg-ink"}`} />
              <span className="t-slate">0{i + 1}</span>
              <span className={`font-display text-[clamp(1.8rem,3.4vw,3.4rem)] font-extrabold uppercase leading-none ${i === O.chain.length - 1 ? "text-ember" : ""}`}>{c}</span>
            </li>
          ))}
        </ol>
        <div data-explain className="mx-auto mt-10 max-w-[44rem] md:mt-14">
          <p className="font-display text-[clamp(1.4rem,2.2vw,2rem)] font-bold uppercase leading-tight">{O.explain[0]}</p>
          <p className="t-lede mx-auto mt-3">{O.explain[1]}</p>
        </div>
      </div>
    </section>
  );
}
