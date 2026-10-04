"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";
import { measure, pipeline as P } from "@/content/strategy";
import { worldClock } from "@/lib/world-clock";
import { PIPE, stageAt } from "@/components/machine/pipeline-time";

type Beat = { kind: "intro" } | { kind: "stage"; i: number } | { kind: "back" } | { kind: "loop"; word: number };

/**
 * ACT 08 — the pipeline (machine/pipeline.ts). A yellow piece of content travels a closed track:
 * idea, script, pre-production, shoot, edit, approval, post, analyse, iterate — and back to a new
 * idea. At ANALYSE the eight signals we read on every piece. Then the camera cranes up and the
 * piece runs the loop again: post, measure, learn, improve, new idea, post again.
 */
export function Pipeline() {
  const root = useRef<HTMLElement>(null);
  const [beat, setBeat] = useState<Beat>({ kind: "intro" });

  useGSAP(
    () => {
      const el = root.current!;
      let key = "";
      const st = ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "+=900%",
        pin: true,
        onUpdate: (self) => {
          const w = self.progress;
          worldClock.pipeline.w = w;
          worldClock.pipeline.fade = Math.min(1, w / 0.02) * (1 - Math.max(0, (w - 0.975) / 0.022));
          let b: Beat;
          const i = stageAt(w);
          if (i >= 0) b = { kind: "stage", i };
          else if (w < PIPE.first) b = { kind: "intro" };
          else if (w < PIPE.loopA) b = { kind: "back" };
          else b = { kind: "loop", word: Math.min(P.loop.length - 1, Math.floor(((w - PIPE.loopA) / (PIPE.loopB - PIPE.loopA - 0.03)) * P.loop.length)) };
          const k = JSON.stringify(b);
          if (k !== key) {
            key = k;
            setBeat(b);
          }
        },
      });
      return () => st.kill();
    },
    { scope: root },
  );

  const s = beat.kind === "stage" ? P.stages[beat.i] : null;
  const stage = beat.kind === "stage" ? beat.i : beat.kind === "intro" ? -1 : 9;

  return (
    <section ref={root} id="pipeline" className="relative z-10 h-[100svh] overflow-hidden" aria-label={P.eyebrow}>
      <div aria-hidden className="studio-shade pointer-events-none absolute inset-0" />
      <div className="gutter mx-auto grid h-full max-w-[1600px] grid-cols-12 gap-x-6">
        <div className="relative col-span-12 md:col-span-6 lg:col-span-5">
          <div className="studio-beat">
            <p className="t-slate mb-4">{P.eyebrow}</p>
            <AnimatePresence mode="wait">
              {beat.kind === "intro" && (
                <motion.div key="intro" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.45 }}>
                  <h2 className="t-big">{P.title}</h2>
                  <p className="t-lede mt-4 max-w-[30rem]">{P.sub}</p>
                </motion.div>
              )}
              {s && (
                <motion.div key={s.name} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }}>
                  <p className="t-label text-buzz">{s.does}</p>
                  <h3 className="t-big mt-2">
                    <span className="mr-3 text-bone/35">{String(stage + 1).padStart(2, "0")}</span>
                    {s.name}
                  </h3>
                  <p className="t-lede mt-3 max-w-[30rem]">{s.note}</p>
                  {stage === 7 && (
                    <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 border-t hairline pt-4">
                      {measure.metrics.map((m, i) => (
                        <div key={m.name}>
                          <dt className={`t-label ${i === 1 ? "text-buzz" : "text-bone"}`}>{m.name}</dt>
                          <dd className="mt-0.5 text-[0.8rem] leading-snug text-ash">{m.asks}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </motion.div>
              )}
              {beat.kind === "back" && (
                <motion.div key="back" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }}>
                  <p className="t-label text-buzz">↺ Iterate feeds the next idea</p>
                  <h3 className="t-big mt-2">{measure.title[0]}</h3>
                  <p className="t-big text-bone/45">{measure.title[1]}</p>
                  <p className="t-slate mt-4">{measure.cadence}</p>
                </motion.div>
              )}
              {beat.kind === "loop" && (
                <motion.div key="loop" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }}>
                  <ol className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-1" aria-label="The loop">
                    {P.loop.map((x, i) => (
                      <li key={x} className={`t-label transition-colors duration-300 ${i === beat.word ? "text-buzz" : i < beat.word ? "text-bone/70" : "text-ash/50"}`}>
                        {x}
                        {i < P.loop.length - 1 && <span className="ml-3 text-bone/25">→</span>}
                      </li>
                    ))}
                  </ol>
                  <h3 className="t-big">
                    {P.line[0]}
                    <span className="block text-bone/60">{P.line[1]}</span>
                    <span className="block text-buzz">{P.line[2]}</span>
                  </h3>
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
      </div>
    </section>
  );
}
