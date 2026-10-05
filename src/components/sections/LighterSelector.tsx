"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { lighterSection as L, phases, type PhaseKey } from "@/content/strategy";
import { Reveal } from "@/components/ui/Reveal";
import { playClick, playIgnite } from "@/lib/audio";
import { store, useStore } from "@/lib/store";
import { scenePoints } from "@/components/film/character";

/**
 * ACT 04 — THE PLAN, and the first time we meet him.
 * The figure on the right lives in the background film; hovering a phase plays it out on him:
 *   Spark — his thumb rolls the wheel, a few sparks, no flame
 *   Flame — the lighter catches and the light finds his face
 *   Light — he brings it up and lights the cigarette
 * Click a phase to go there.
 */
export function LighterSelector() {
  const [hover, setHover] = useState<PhaseKey | null>(null);
  const igniting = useStore((s) => s.igniting);
  const busy = useRef(false);

  const active = phases.find((p) => p.key === hover) ?? null;

  // never leave a preview running once this act is gone
  useEffect(() => () => store.set({ preview: null }), []);

  const preview = (k: PhaseKey | null) => {
    if (busy.current) return;
    if (k && k !== hover) {
      if (k === "spark") playClick(0.5);
      else playIgnite();
    }
    setHover(k);
    store.set({ preview: k });
  };

  const go = (k: PhaseKey) => {
    if (busy.current) return;
    busy.current = true;
    if (k !== hover) playIgnite();
    setHover(k);
    store.set({ preview: k });
    // let the moment play for a beat, then dissolve through the light into the phase
    window.setTimeout(
      () => {
        const pt = k === "light" && scenePoints.ember.x > 0 ? scenePoints.ember : scenePoints.flame;
        const p = pt.x > 0 ? pt : { x: window.innerWidth * 0.7, y: window.innerHeight * 0.5 };
        window.dispatchEvent(new CustomEvent("ignite:go", { detail: { x: p.x, y: p.y, target: k } }));
        window.setTimeout(() => {
          setHover(null);
          store.set({ preview: null });
          busy.current = false;
        }, 900);
      },
      k === "light" ? 1100 : 650,
    );
  };

  return (
    <section id="phases" className="relative z-10 flex min-h-[100svh] items-center py-[16vh]">
      <div className="gutter relative mx-auto grid w-full max-w-[1600px] items-center gap-12 lg:grid-cols-12">
        <div className="lg:col-span-6 xl:col-span-5">
          <p className="t-slate mb-6">{L.eyebrow}</p>
          <Reveal as="h2" by="chars" className="t-big">
            {L.title.map((t) => (
              <span key={t} className="block">
                {t}
              </span>
            ))}
          </Reveal>
          <p className="t-lede mt-6 max-w-[30em]">{L.sub}</p>

          <ul className="mt-12 border-t hairline" onMouseLeave={() => preview(null)}>
            {phases.map((p) => {
              const on = hover === p.key;
              return (
                <li key={p.key} className="border-b hairline">
                  <button
                    type="button"
                    data-cursor={p.name}
                    onMouseEnter={() => preview(p.key)}
                    onFocus={() => preview(p.key)}
                    onBlur={() => preview(null)}
                    onClick={() => go(p.key)}
                    disabled={igniting}
                    className="group grid w-full grid-cols-[4.5rem_1fr_auto] items-center gap-4 py-5 text-left md:grid-cols-[6rem_1fr_auto] md:py-6"
                    aria-label={`Phase ${p.n}, ${p.name}, ${p.months}. Go to this phase.`}
                  >
                    <span className="t-slate">Phase {p.n}</span>
                    <span
                      className="font-display text-[clamp(2.8rem,6vw,5.6rem)] font-extrabold uppercase leading-[0.85] transition-[color,text-shadow,transform] duration-700"
                      style={{
                        color: on ? "var(--color-buzz-soft)" : undefined,
                        textShadow: on ? `0 0 ${16 + p.heat * 24}px rgba(249,254,2,${0.15 + p.heat * 0.2})` : "none",
                        transform: on ? "translateX(10px)" : "none",
                      }}
                    >
                      {p.name}
                    </span>
                    <span className="flex flex-col items-end gap-1 text-right">
                      <span className="t-label">{p.months}</span>
                      <span className="t-slate">{p.duration}</span>
                    </span>
                  </button>
                  <span className="sr-only">Preview: {p.objective}</span>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 min-h-[7.5rem]" aria-live="polite">
            <AnimatePresence mode="wait">
              {active ? (
                <motion.div key={active.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35 }}>
                  <p className="t-slate text-buzz-soft">
                    Phase {active.n} · {active.months}
                  </p>
                  <p className="mt-2 font-display text-[clamp(1.4rem,2.2vw,2rem)] font-bold uppercase leading-tight">{active.objective}</p>
                  <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    {active.preview.map((x) => (
                      <li key={x} className="t-label text-bone/70">
                        {x}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ) : (
                <motion.p key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="t-slate pt-2">
                  {L.hint} · Spark → Flame → Light
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
