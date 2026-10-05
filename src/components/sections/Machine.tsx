"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { machine as M } from "@/content/strategy";
import { worldClock } from "@/lib/world-clock";
import { playClick } from "@/lib/audio";

const ladderAt = (w: number) => (w < 0.22 ? 0 : w < 0.578 ? 1 : w < 0.8 ? 2 : 3);

/**
 * ACT 07 — Original BuzzLab IP, part one. After the cigarette goes out: black, a yellow dot, a
 * play button, and content pouring out of it into a production world (machine/scene.ts). No
 * paragraphs: the ladder at the top tracks Content → Creative → Media → IP and each shot gets
 * one line.
 */
export function Machine() {
  const root = useRef<HTMLElement>(null);
  const [shot, setShot] = useState(-1);
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
          worldClock.machine.w = w;
          worldClock.machine.fade = 1;
          let s = -1;
          M.shots.forEach((x, i) => {
            if (w >= x.at) s = i;
          });
          if (w >= M.shotsEnd) s = -1;
          setShot(s);
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

  const s = shot >= 0 ? M.shots[shot] : null;

  return (
    <section ref={root} id="machine" className="relative z-10 h-[100svh] overflow-hidden" aria-label={M.eyebrow}>
      {/* CONTENT → CREATIVE → MEDIA → IP */}
      <ol data-ladder className="gutter absolute inset-x-0 top-[calc(env(safe-area-inset-top,0px)+5.5rem)] flex justify-end gap-x-3 md:gap-x-5" aria-label="Content to IP">
        {M.ladder.map((r, i) => (
          <li key={r} className={`t-slate transition-colors duration-500 ${i === rung ? "text-buzz" : i < rung ? "text-bone/60" : "text-ash/50"}`}>
            {r}
            {i < M.ladder.length - 1 && <span className="ml-3 text-bone/25 md:ml-5">→</span>}
          </li>
        ))}
      </ol>

      {/* shade under the captions so the world never fights the words */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[44vh] bg-gradient-to-t from-black via-black/60 to-transparent" />
      {/* act label → the rung → one line */}
      <div className="gutter absolute inset-x-0 bottom-[8vh] md:bottom-[10vh]">
        <div className="max-w-[34rem]">
          <p className="t-slate mb-4">{M.eyebrow}</p>
          <AnimatePresence mode="wait">
            {s?.line && (
              <motion.div key={s.line} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }}>
                <p className="t-label text-buzz">{M.ladder[s.rung]}</p>
                <h3 className="t-big mt-2">{s.line}</h3>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
