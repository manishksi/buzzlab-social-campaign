"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { rhythm as R } from "@/content/strategy";
import { Reveal } from "@/components/ui/Reveal";
import { Counter } from "@/components/ui/Counter";

/** ACT 09 — the publishing rhythm: four fixed weekly slots, and the monthly volume targets. */
export function Rhythm() {
  const [view, setView] = useState<"week" | "month">("week");
  const [day, setDay] = useState(0);
  const d = R.week[day];

  return (
    <section id="rhythm" data-dim="0.4" className="relative z-10 py-[18vh]">
      <div className="gutter mx-auto max-w-[1600px]">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <p className="t-slate mb-6">{R.eyebrow}</p>
            <Reveal as="h2" by="chars" className="t-huge">
              {R.title}
            </Reveal>
            <Reveal as="p" className="t-lede mt-6">
              {R.sub}
            </Reveal>
          </div>
          <div role="tablist" aria-label="Calendar view" className="flex border hairline">
            {(["week", "month"] as const).map((v) => (
              <button
                key={v}
                role="tab"
                type="button"
                aria-selected={view === v}
                data-cursor={v === "week" ? "Week" : "Month"}
                onClick={() => setView(v)}
                className={`t-label px-5 py-3 transition-colors ${view === v ? "bg-bone text-ink" : "text-bone/60 hover:text-bone"}`}
              >
                Every {v}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-14 min-h-[32rem]">
          <AnimatePresence mode="wait">
            {view === "week" ? (
              <motion.div key="week" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
                <div className="grid grid-cols-1 gap-[2px] overflow-hidden border hairline bg-line/60 md:grid-cols-7">
                  {R.week.map((w, i) => {
                    const on = i === day;
                    return (
                      <button
                        key={w.day}
                        type="button"
                        data-cursor={w.day}
                        onMouseEnter={() => setDay(i)}
                        onFocus={() => setDay(i)}
                        onClick={() => setDay(i)}
                        aria-pressed={on}
                        className={`relative flex items-center justify-between gap-4 p-4 text-left transition-colors duration-300 md:min-h-[20rem] md:flex-col md:items-start md:p-4 ${
                          w.slot ? (on ? "bg-[#24160e]" : "bg-char") : on ? "bg-[#1a1714]" : "bg-ink"
                        }`}
                      >
                        {w.slot && <span aria-hidden className={`absolute bottom-0 left-0 top-0 w-[3px] md:bottom-auto md:right-0 md:h-[3px] md:w-auto ${on ? "bg-ember" : "bg-ember/50"}`} />}
                        <span className={`t-label ${on ? "text-bone" : "text-ash"}`}>{w.day}</span>
                        {w.slot ? (
                          <span className={`text-right font-display text-[1.5rem] font-extrabold uppercase leading-[0.92] md:text-left md:text-[clamp(1rem,1.45vw,1.65rem)] ${on ? "text-amber" : "text-bone"}`}>
                            {w.slot.split(" / ").map((s) => (
                              <span key={s} className="block">
                                {s}
                              </span>
                            ))}
                          </span>
                        ) : (
                          <span className="t-slate">Stories</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-6 grid gap-6 border-b hairline pb-6 md:grid-cols-12" aria-live="polite">
                  <p className="t-slate md:col-span-2">{d.day}</p>
                  <p className="text-[1.1rem] leading-relaxed text-bone/85 md:col-span-7">{d.note}</p>
                  <p className="t-label text-amber md:col-span-3 md:text-right">{d.pillar || "Community"}</p>
                </div>
              </motion.div>
            ) : (
              <motion.div key="month" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
                <div className="grid gap-px overflow-hidden border hairline bg-line/60 md:grid-cols-3">
                  {R.month.map((m, i) => {
                    const [min, max] = m.display.includes("–") ? m.display.split("–").map(Number) : [m.value, m.value];
                    return (
                      <div key={m.label} className="flex flex-col gap-6 bg-ink p-6 md:p-8">
                        <div className="flex items-baseline justify-between">
                          <span className="t-slate">{m.note}</span>
                          <span className="t-slate">Target</span>
                        </div>
                        <span className={`font-display text-[clamp(4.5rem,9vw,9rem)] font-extrabold leading-[0.85] ${i === 0 ? "text-ember" : ""}`}>
                          <Counter display={m.display} />
                        </span>
                        <span className="font-display text-[1.8rem] font-bold uppercase leading-none">{m.label}</span>
                        {/* solid = minimum, outline = stretch */}
                        <div className="flex flex-wrap gap-1.5" aria-label={`${min} to ${max}`}>
                          {Array.from({ length: max }).map((_, k) => (
                            <span
                              key={k}
                              className={i === 0 ? "h-10 w-7 rounded-[4px] bg-ember shadow-[0_0_24px_rgba(239,106,42,.6)]" : i === 1 ? "h-8 w-[18px] rounded-[3px]" : "h-3 w-3 rounded-full"}
                              style={i === 0 ? undefined : k < min ? { background: "var(--color-bone)" } : { border: "1px solid rgba(239,232,222,.45)" }}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="t-slate mt-4">Filled = minimum · outlined = stretch</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <p className="t-slate mt-6 max-w-[60ch] normal-case tracking-normal text-[0.85rem]">{R.footnote}</p>
      </div>
    </section>
  );
}
