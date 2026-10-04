"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { objective as O } from "@/content/strategy";
import { playSwell } from "@/lib/audio";

/**
 * ACT 02 — the turn. The screen goes dark, then one word at a time:
 * MAKE / BUZZLAB / WORTH / NOTICING. The last word lands hardest (a focus lock, like the camera
 * in the cold open), then the chain that sentence sets off.
 */
export function Objective() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const el = root.current!;
      const words = gsap.utils.toArray<HTMLElement>("[data-word]", el);
      const notice = el.querySelector("[data-notice]");
      const brackets = gsap.utils.toArray<HTMLElement>("[data-bracket]", el);
      gsap.set([...words, notice, ...brackets, "[data-eyebrow]"], { autoAlpha: 0 });

      let landed = false;
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "+=320%",
          pin: true,
          scrub: 0.8,
          onUpdate: (self) => {
            const now = self.progress > 0.38;
            if (now && !landed && self.direction > 0) playSwell();
            landed = now;
          },
        },
      });
      // a beat of darkness, then the words, one by one
      tl.fromTo("[data-dark]", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.06, ease: "none" }, 0)
        .to("[data-eyebrow]", { autoAlpha: 1, duration: 0.05 }, 0.06);
      words.forEach((w, i) => {
        tl.fromTo(w, { autoAlpha: 0, yPercent: 35, filter: "blur(12px)" }, { autoAlpha: 1, yPercent: 0, filter: "blur(0px)", duration: 0.06, ease: "power3.out" }, 0.1 + i * 0.09);
      });
      // NOTICING: pulled into focus, everything else steps back
      tl.fromTo(
        notice,
        { autoAlpha: 0, scale: 1.3, filter: "blur(30px)", letterSpacing: "0.22em" },
        { autoAlpha: 1, scale: 1, filter: "blur(0px)", letterSpacing: "-0.01em", duration: 0.1, ease: "power3.out" },
        0.38,
      )
        .to(words, { opacity: 0.4, duration: 0.08, ease: "none" }, 0.4)
        .fromTo(brackets, { autoAlpha: 0, scale: 1.35 }, { autoAlpha: 1, scale: 1, duration: 0.06, ease: "power2.out" }, 0.44)
        .to(brackets, { borderColor: "rgba(245,165,74,0.95)", duration: 0.02 }, 0.5)
        // hold, then the sentence makes room for what it sets off
        .to(brackets, { autoAlpha: 0, duration: 0.04 }, 0.58)
        .to(words, { opacity: 0.75, duration: 0.06 }, 0.58)
        .to("[data-statement]", { scale: 0.56, y: () => -window.innerHeight * 0.22, duration: 0.1, ease: "power2.inOut" }, 0.6)
        .fromTo("[data-chain-line]", { autoAlpha: 0, scaleX: 0, scaleY: 0 }, { autoAlpha: 1, scaleX: 1, scaleY: 1, duration: 0.24, ease: "none" }, 0.66);
      gsap.utils.toArray<HTMLElement>("[data-chain-node]", el).forEach((n, i) => {
        tl.fromTo(n, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.05, ease: "power2.out" }, 0.68 + i * 0.055)
          .fromTo(n.querySelector("[data-dot]"), { scale: 0 }, { scale: 1, duration: 0.04 }, 0.68 + i * 0.055);
      });
      tl.fromTo("[data-explain]", { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.08 }, 0.9).to({}, { duration: 0.06 });
    },
    { scope: root },
  );

  const sentence = O.statement.join(" ");
  const lead = O.statement.slice(0, -1);
  const last = O.statement[O.statement.length - 1];

  return (
    <section ref={root} id="system" className="relative z-10 flex h-[100svh] flex-col items-center justify-center overflow-hidden text-center">
      <div data-dark aria-hidden className="absolute inset-0 bg-ink" />
      <p data-eyebrow className="t-slate absolute top-[calc(env(safe-area-inset-top,0px)+6rem)]">
        {O.eyebrow}
      </p>
      <h2 data-statement className="gutter relative" aria-label={sentence}>
        <span aria-hidden className="t-huge flex flex-wrap items-baseline justify-center gap-x-[0.26em]">
          {lead.map((w) => (
            <span key={w} data-word className="inline-block">
              {w}
            </span>
          ))}
        </span>
        <span aria-hidden data-notice className="relative mx-auto mt-[0.04em] block w-max">
          <span
            className="block font-display text-[clamp(4rem,17vw,18rem)] font-extrabold uppercase leading-[0.84] text-ember"
            style={{ textShadow: "0 0 60px rgba(239,106,42,.38), 0 0 160px rgba(239,106,42,.18)" }}
          >
            {last}
          </span>
          {/* focus lock */}
          {[
            "left-[-0.1em] top-[0.02em] border-l-[1.5px] border-t-[1.5px]",
            "right-[-0.1em] top-[0.02em] border-r-[1.5px] border-t-[1.5px]",
            "bottom-[-0.03em] left-[-0.1em] border-b-[1.5px] border-l-[1.5px]",
            "bottom-[-0.03em] right-[-0.1em] border-b-[1.5px] border-r-[1.5px]",
          ].map((c) => (
            <span key={c} data-bracket className={`absolute h-[clamp(14px,2.4vw,38px)] w-[clamp(14px,2.4vw,38px)] border-bone/60 text-[clamp(4rem,17vw,18rem)] ${c}`} />
          ))}
        </span>
      </h2>

      <div className="gutter absolute inset-x-0 top-[38%] md:top-[50%]">
        <ol className="relative mx-auto flex w-max max-w-[1200px] flex-col items-start gap-4 md:w-auto md:flex-row md:items-center md:justify-between md:gap-0">
          <span data-chain-line aria-hidden className="absolute left-[23px] top-[11px] h-[calc(100%-22px)] w-px origin-top bg-gradient-to-b from-bone/10 via-ember to-amber md:left-[6%] md:right-[6%] md:top-[11px] md:h-px md:w-auto md:origin-left md:bg-gradient-to-r" />
          {O.chain.map((c, i) => (
            <li key={c} data-chain-node className="relative z-10 flex flex-row items-center gap-3 bg-ink px-3 md:flex-col">
              <span data-dot className={`h-[22px] w-[22px] shrink-0 rounded-full border ${i === O.chain.length - 1 ? "border-ember bg-ember shadow-[0_0_30px_rgba(239,106,42,.8)]" : "border-bone/60 bg-ink"}`} />
              <span className="t-slate">0{i + 1}</span>
              <span className={`font-display text-[clamp(1.8rem,3.4vw,3.4rem)] font-extrabold uppercase leading-none ${i === O.chain.length - 1 ? "text-ember" : ""}`}>{c}</span>
            </li>
          ))}
        </ol>
        <div data-explain className="mx-auto mt-8 max-w-[44rem] md:mt-14">
          <p className="font-display text-[clamp(1.4rem,2.2vw,2rem)] font-bold uppercase leading-tight">{O.explain[0]}</p>
          <p className="t-lede mx-auto mt-3">{O.explain[1]}</p>
        </div>
      </div>
    </section>
  );
}
