"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { lighterSection as L, phases, type PhaseKey } from "@/content/strategy";
import { Lighter, type LighterHandle } from "@/components/lighter/Lighter";
import { Reveal } from "@/components/ui/Reveal";
import { playClick, playIgnite } from "@/lib/audio";
import { useStore } from "@/lib/store";

/**
 * ACT 04 — the lighter is the phase selector.
 * Hover a phase: the lid flips, the wheel turns, a flame sized to that phase lights the UI.
 * Click: it ignites and the screen burns through to the phase.
 */
export function LighterSelector() {
  const [hover, setHover] = useState<PhaseKey | null>(null);
  const [lit, setLit] = useState(false);
  const igniting = useStore((s) => s.igniting);
  const lighter = useRef<LighterHandle>(null);
  const busy = useRef(false);

  const active = phases.find((p) => p.key === hover) ?? null;
  const index = active ? phases.indexOf(active) : 1;
  const heat = lit ? 1.7 : active ? active.heat : 0;

  const preview = (k: PhaseKey | null) => {
    if (busy.current) return;
    if (k && k !== hover) playClick(0.5);
    setHover(k);
  };

  const ignite = async (k: PhaseKey) => {
    if (busy.current) return;
    busy.current = true;
    setHover(k);
    setLit(true);
    playIgnite();
    await lighter.current?.ignite();
    const p = lighter.current?.flamePoint() ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    window.dispatchEvent(new CustomEvent("ignite:go", { detail: { ...p, target: k } }));
    setTimeout(() => {
      setLit(false);
      setHover(null);
      busy.current = false;
    }, 1400);
  };

  return (
    <section
      id="phases"
      className="relative z-10 flex min-h-[100svh] items-center py-[16vh]"
      style={{ ["--lit" as string]: heat, ["--lx" as string]: "68%", ["--ly" as string]: "34%" }}
    >
      {/* the flame lights the room */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-[opacity] duration-700"
        style={{
          opacity: heat > 0 ? 1 : 0,
          background: "radial-gradient(circle at var(--lx) var(--ly), rgba(245,165,74,calc(var(--lit) * .16)), rgba(239,106,42,calc(var(--lit) * .06)) 35%, transparent 62%)",
        }}
      />
      <div className="gutter relative mx-auto grid w-full max-w-[1600px] items-center gap-12 lg:grid-cols-12">
        <div className="order-2 lg:order-1 lg:col-span-6">
          <p className="t-slate mb-6">{L.eyebrow}</p>
          <Reveal as="h2" by="chars" className="t-big">
            <span className="block">{L.title[0]}</span>
            <span className="block">{L.title[1]}</span>
          </Reveal>
          <p className="t-lede mt-6 max-w-[30em]">{L.sub}</p>

          <ul className="mt-12 border-t hairline" onMouseLeave={() => preview(null)}>
            {phases.map((p, i) => {
              const on = hover === p.key;
              return (
                <li key={p.key} className="border-b hairline">
                  <button
                    type="button"
                    data-cursor="Ignite"
                    onMouseEnter={() => preview(p.key)}
                    onFocus={() => preview(p.key)}
                    onClick={() => ignite(p.key)}
                    disabled={igniting}
                    className="group grid w-full grid-cols-[4.5rem_1fr_auto] items-center gap-4 py-5 text-left md:grid-cols-[6rem_1fr_auto] md:py-6"
                    aria-label={`Phase ${p.n}, ${p.name}, ${p.months}. Ignite to jump there.`}
                  >
                    <span className="t-slate">Phase {p.n}</span>
                    <span
                      className="font-display text-[clamp(2.8rem,6vw,5.6rem)] font-extrabold uppercase leading-[0.85] transition-[color,text-shadow,transform] duration-500"
                      style={{
                        color: on ? "var(--color-amber)" : undefined,
                        textShadow: on ? `0 0 ${20 + p.heat * 40}px rgba(239,106,42,${0.25 + p.heat * 0.35})` : "none",
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
                  {i === 2 && null}
                </li>
              );
            })}
          </ul>
          <p className="t-slate mt-5">{L.hint}</p>
        </div>

        <div className="order-1 flex flex-col items-center lg:order-2 lg:col-span-6">
          <div
            className="relative w-[min(46vw,230px)] transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] md:w-[min(30vw,300px)]"
            style={{ transform: `translateY(${(index - 1) * 18}px) rotate(${active ? (index - 1) * 3 - 2 : -6}deg)` }}
          >
            <Lighter ref={lighter} heat={heat} open={!!active || lit} className="h-auto w-full" label="Phase lighter" />
          </div>
          <div className="mt-8 min-h-[9.5rem] w-full max-w-[26rem] text-center" aria-live="polite">
            <AnimatePresence mode="wait">
              {active ? (
                <motion.div key={active.key} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }}>
                  <p className="t-slate text-amber">
                    Phase {active.n} · {active.months}
                  </p>
                  <p className="mt-2 font-display text-[clamp(1.5rem,2.4vw,2.2rem)] font-bold uppercase leading-tight">{active.objective}</p>
                  <ul className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1">
                    {active.preview.map((x) => (
                      <li key={x} className="t-label text-bone/70">
                        {x}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ) : (
                <motion.p key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="t-slate pt-6">
                  Spark → Flame → Fire
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
