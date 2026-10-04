"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { set as S } from "@/content/strategy";
import { worldClock } from "@/lib/world-clock";
import { SET, roleAt } from "@/components/machine/set-time";

/**
 * ACT 09 — the miniature set (machine/set.ts). The camera visits each role in turn: director,
 * DOP, lighting, producer, editor, creative, social, talent. Then it pulls back over the whole
 * model and says it plainly: this isn't a content plan. It's a media engine.
 */
export function ProductionSet() {
  const root = useRef<HTMLElement>(null);
  const [role, setRole] = useState(-1);
  const [phase, setPhase] = useState<"intro" | "tour" | "final">("intro");

  useGSAP(
    () => {
      const el = root.current!;
      gsap.set("[data-final] [data-l]", { autoAlpha: 0 });
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top top", end: "+=900%", scrub: 0.6 } });
      tl.to({}, { duration: 1 }, 0)
        .fromTo("[data-final] [data-l]", { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.04, stagger: 0.035, ease: "power2.out" }, 0.86)
        .to("[data-final] [data-l]", { autoAlpha: 0, duration: 0.025 }, 0.965);
      const st = ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "+=900%",
        pin: true,
        onUpdate: (self) => {
          const w = self.progress;
          worldClock.set.w = w;
          // the model steps back under the last line, then goes to black
          const under = gsap.utils.clamp(0, 1, (w - 0.84) / 0.04) * 0.65;
          worldClock.set.fade = Math.min(1, w / 0.02) * (1 - under) * (1 - Math.max(0, (w - 0.975) / 0.022));
          setRole(roleAt(w));
          setPhase(w < SET.first ? "intro" : w < SET.back ? "tour" : "final");
        },
      });
      return () => st.kill();
    },
    { scope: root },
  );

  const r = role >= 0 ? S.roles[role] : null;

  return (
    <section ref={root} id="set" className="relative z-10 h-[100svh] overflow-hidden" aria-label={S.eyebrow}>
      <div aria-hidden className="studio-shade pointer-events-none absolute inset-0" />
      <div className="gutter mx-auto grid h-full max-w-[1600px] grid-cols-12 gap-x-6">
        <div className="relative col-span-12 md:col-span-6 lg:col-span-5">
          <div className="studio-beat">
            <AnimatePresence mode="wait">
              {phase === "intro" && (
                <motion.div key="intro" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.45 }}>
                  <p className="t-slate mb-4">{S.eyebrow}</p>
                  <h2 className="t-big">
                    {S.title[0]}
                    <span className="block text-bone/45">{S.title[1]}</span>
                  </h2>
                </motion.div>
              )}
              {r && (
                <motion.div key={r.key} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }}>
                  <p className="t-slate mb-4">{S.eyebrow}</p>
                  <p className="t-label text-buzz">Role {String(role + 1).padStart(2, "0")} / 08</p>
                  <h3 className="t-big mt-2">{r.role}</h3>
                  <p className="t-lede mt-3">{r.does}</p>
                </motion.div>
              )}
            </AnimatePresence>
            {phase !== "final" && (
              <ol className="mt-6 flex gap-1.5" aria-hidden>
                {S.roles.map((x, i) => (
                  <li key={x.key} className={`h-[3px] w-6 transition-colors duration-500 md:w-8 ${i === role ? "bg-buzz" : i < role ? "bg-bone/50" : "bg-bone/15"}`} />
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
      {/* the line the whole deck has been building to */}
      <div data-final className="gutter pointer-events-none absolute inset-x-0 bottom-[14vh] mx-auto max-w-[1600px]">
        <p data-l className="t-big text-bone/70">
          {S.final[0]}
        </p>
        <p data-l className="t-mega mt-2">
          It&apos;s a <span className="text-buzz">media engine.</span>
        </p>
      </div>
    </section>
  );
}
