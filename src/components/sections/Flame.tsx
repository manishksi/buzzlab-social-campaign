"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { gsap, useGSAP } from "@/lib/gsap";
import { flame as F } from "@/content/strategy";
import { PhaseHeader } from "./PhaseHeader";
import { FootageSlot } from "@/components/ui/FootageSlot";
import { Reveal } from "@/components/ui/Reveal";
import type { ReelKind } from "@/components/ui/PreviewReel";

/** PHASE 02 — five recurring series, presented as a programme lineup. */
export function Flame() {
  const root = useRef<HTMLElement>(null);
  const [sel, setSel] = useState(0);
  const s = F.series[sel];

  useGSAP(
    () => {
      gsap.from("[data-series]", { autoAlpha: 0, x: -40, stagger: 0.08, duration: 0.9, ease: "expo.out", scrollTrigger: { trigger: "[data-lineup]", start: "top 75%", once: true } });
      const shift = gsap.timeline({ scrollTrigger: { trigger: "[data-shift]", start: "top 70%", end: "center 45%", scrub: true } });
      shift
        .fromTo("[data-from]", { opacity: 1 }, { opacity: 0.25, ease: "none" }, 0)
        .fromTo("[data-from-strike]", { scaleX: 0 }, { scaleX: 1, ease: "none" }, 0)
        .fromTo("[data-to]", { opacity: 0.15, letterSpacing: "0.2em" }, { opacity: 1, letterSpacing: "0em", ease: "none" }, 0.2);
    },
    { scope: root },
  );

  return (
    <section ref={root} id="flame" className="relative z-10 pt-[24vh]">
      <PhaseHeader n={F.n} name={F.name} months={F.months} objective={F.objective} heat={0.68} />

      <div className="gutter mx-auto mt-[16vh] max-w-[1600px]">
        <blockquote>
          <Reveal as="p" className="t-big max-w-[18ch]">
            {F.quote[0]}
          </Reveal>
          <Reveal as="p" className="t-serif mt-3 max-w-[24ch] text-[clamp(2rem,4.4vw,4.4rem)] leading-[1.02] text-amber" delay={0.15}>
            {F.quote[1]}
          </Reveal>
        </blockquote>
      </div>

      <div data-lineup data-dim="0.3" className="gutter mx-auto mt-[16vh] grid max-w-[1600px] gap-10 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <div className="flex items-baseline justify-between border-b hairline pb-4">
            <span className="t-slate">The lineup</span>
            <span className="t-slate">Proposed cadence</span>
          </div>
          <ol>
            {F.series.map((x, i) => {
              const on = i === sel;
              return (
                <li data-series key={x.n} className="border-b hairline">
                  <button
                    type="button"
                    data-cursor="Preview"
                    onMouseEnter={() => setSel(i)}
                    onFocus={() => setSel(i)}
                    onClick={() => setSel(i)}
                    aria-pressed={on}
                    className="group grid w-full grid-cols-[5.5rem_1fr] items-baseline gap-3 py-5 text-left md:grid-cols-[6.5rem_1fr_auto]"
                  >
                    <span className={`t-slate transition-colors ${on ? "text-ember" : ""}`}>Series {x.n}</span>
                    <span className={`font-display text-[clamp(1.7rem,3vw,3rem)] font-extrabold uppercase leading-[0.92] transition-all duration-500 ${on ? "translate-x-2 text-bone" : "text-bone/45 group-hover:text-bone/80"}`}>
                      {x.title}
                    </span>
                    <span className="t-label col-start-2 text-ash md:col-start-auto md:text-right">{x.cadence}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="lg:col-span-6">
          <div className="lg:sticky lg:top-[14vh]">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-[520px] overflow-hidden border border-bone/10">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={s.slot}
                  className="absolute inset-0"
                  initial={{ clipPath: "inset(0 0 0 100%)" }}
                  animate={{ clipPath: "inset(0 0 0 0%)" }}
                  exit={{ opacity: 0.4 }}
                  transition={{ duration: 0.7, ease: [0.77, 0, 0.18, 1] }}
                >
                  <FootageSlot slot={s.slot} kind={s.style as ReelKind} playing title={s.title} />
                </motion.div>
              </AnimatePresence>
              <span className="t-slate absolute right-3 top-3 z-20 bg-ink/70 px-1.5 py-0.5 text-bone/70">S{s.n}</span>
            </div>
            <div className="mx-auto mt-6 max-w-[520px]" aria-live="polite">
              <p className="text-[1.1rem] leading-relaxed text-bone/85">{s.logline}</p>
              <dl className="mt-5 grid grid-cols-2 gap-4 border-t hairline pt-4">
                <div>
                  <dt className="t-slate">Format</dt>
                  <dd className="t-label mt-1">{s.format}</dd>
                </div>
                <div>
                  <dt className="t-slate">Cadence</dt>
                  <dd className="t-label mt-1 text-amber">{s.cadence}</dd>
                </div>
              </dl>
              <ul className="mt-5 space-y-2 border-t hairline pt-4">
                {s.episodes.map((e, i) => (
                  <li key={e} className="flex gap-4">
                    <span className="t-slate w-8 shrink-0">E0{i + 1}</span>
                    <span className="font-serif text-[1.05rem] italic text-bone/80">{e}</span>
                  </li>
                ))}
              </ul>
              <p className="t-slate mt-3">Example episode ideas</p>
            </div>
          </div>
        </div>
      </div>

      <div data-shift data-dim="0.55" className="gutter mx-auto mt-[22vh] max-w-[1600px] pb-[10vh]">
        <div className="grid items-end gap-8 md:grid-cols-2">
          <div>
            <p className="t-slate mb-3">Phase 01</p>
            <p data-from className="relative inline-block font-display text-[clamp(3.5rem,11vw,11rem)] font-extrabold uppercase leading-[0.85]">
              {F.shift.from}
              <span data-from-strike aria-hidden className="absolute left-0 right-0 top-1/2 h-[0.06em] origin-left bg-ember" />
            </p>
          </div>
          <div>
            <p className="t-slate mb-3 text-amber">Phase 02</p>
            <p data-to className="font-display text-[clamp(3.5rem,11vw,11rem)] font-extrabold uppercase leading-[0.85] text-amber">
              {F.shift.to}
            </p>
          </div>
        </div>
        <p className="t-lede mt-8 md:ml-[50%]">{F.shift.note}</p>
      </div>
    </section>
  );
}
