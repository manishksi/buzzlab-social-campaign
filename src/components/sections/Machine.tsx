"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { machine as M, pipeline as P } from "@/content/strategy";
import { machineClock } from "@/lib/machine-clock";
import { playClick } from "@/lib/audio";

/** Where each pipeline stage is on screen, in machine time (see machine/scene.ts). */
const STAGE_AT = [0.1, 0.155, 0.22, 0.29, 0.37, 0.45, 0.52, 0.6, 0.66];
const STAGE_END = 0.775;
/** CONTENT → CREATIVE → MEDIA → IP, in machine time. */
const LADDER = ["Content", "Creative", "Media", "IP"];
const ladderAt = (w: number) => (w < 0.22 ? 0 : w < 0.52 ? 1 : w < 0.8 ? 2 : 3);

/**
 * ACT 08 — the creative machine. After the cigarette goes out: black, a yellow dot, and the
 * whole pipeline plays out as a production world (machine/scene.ts). Each stage of the
 * pipeline captions its shot; the ladder at the top tracks Content → Creative → Media → IP.
 */
export function Machine() {
  const root = useRef<HTMLElement>(null);
  const [stage, setStage] = useState(-1);
  const [intro, setIntro] = useState(false);
  const [rung, setRung] = useState(0);

  useGSAP(
    () => {
      const el = root.current!;
      let clicked = false;
      const st = ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "+=1000%",
        pin: true,
        onUpdate: (self) => {
          const w = self.progress * 0.8;
          machineClock.w = w;
          machineClock.fade = 1;
          let s = -1;
          STAGE_AT.forEach((a, i) => {
            if (w >= a) s = i;
          });
          if (w >= STAGE_END) s = -1;
          setStage(s);
          setIntro(w > 0.035 && w < 0.1);
          setRung(ladderAt(w));
          if (w > 0.115 && !clicked && self.direction > 0) playClick(1);
          clicked = w > 0.115;
        },
      });
      gsap.fromTo("[data-ladder]", { autoAlpha: 0 }, { autoAlpha: 1, scrollTrigger: { trigger: el, start: "top top", end: "+=40%", scrub: true } });
      return () => st.kill();
    },
    { scope: root },
  );

  const s = stage >= 0 ? P.stages[stage] : null;

  return (
    <section ref={root} id="machine" className="relative z-10 h-[100svh] overflow-hidden" aria-label={M.eyebrow}>
      {/* CONTENT → CREATIVE → MEDIA → IP */}
      <ol data-ladder className="gutter absolute inset-x-0 top-[calc(env(safe-area-inset-top,0px)+5.5rem)] flex justify-end gap-x-3 md:gap-x-5" aria-label="Content to IP">
        {LADDER.map((r, i) => (
          <li key={r} className={`t-slate transition-colors duration-500 ${i === rung ? "text-buzz" : i < rung ? "text-bone/60" : "text-ash/50"}`}>
            {r}
            {i < LADDER.length - 1 && <span className="ml-3 text-bone/25 md:ml-5">→</span>}
          </li>
        ))}
      </ol>

      {/* shade under the captions so the world never fights the words */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[52vh] bg-gradient-to-t from-black via-black/70 to-transparent" />
      {/* the caption block: act label → headline → statement → details */}
      <div className="gutter absolute inset-x-0 bottom-[8vh] md:bottom-[10vh]">
        <div className="max-w-[34rem]">
          <p className="t-slate mb-4">{P.eyebrow}</p>
          <AnimatePresence mode="wait">
            {intro && (
              <motion.div key="intro" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.45 }}>
                <h2 className="t-big">{P.title}</h2>
                <p className="t-lede mt-4">{P.sub}</p>
              </motion.div>
            )}
            {s && (
              <motion.div key={s.name} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }}>
                <p className="t-label text-buzz">{P.groups[s.group]}</p>
                <h3 className="t-big mt-2">
                  <span className="mr-3 text-bone/35">{String(stage + 1).padStart(2, "0")}</span>
                  {s.name}
                </h3>
                <p className="t-lede mt-3">{s.note}</p>
                {stage === P.stages.length - 1 && <p className="t-slate mt-4">↺ Iterate feeds the next idea</p>}
              </motion.div>
            )}
          </AnimatePresence>
          {/* nine stages, one line */}
          <ol className="mt-6 flex gap-1.5" aria-hidden>
            {P.stages.map((x, i) => (
              <li key={x.name} className={`h-[3px] w-6 transition-colors duration-500 md:w-8 ${i === stage ? "bg-buzz" : i < stage ? "bg-bone/50" : "bg-bone/15"}`} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
