"use client";

import { Reveal } from "@/components/ui/Reveal";

/** Shared title card for Spark / Flame / Fire. `heat` sizes the flame glyph. */
export function PhaseHeader({ n, name, months, objective, heat }: { n: string; name: string; months: string; objective: string; heat: number }) {
  return (
    <header className="gutter mx-auto max-w-[1600px]">
      <div className="flex items-center justify-between border-b hairline pb-4">
        <span className="t-slate">Phase {n}</span>
        <span className="t-slate text-amber">{months}</span>
      </div>
      <div className="mt-8 flex items-end gap-5 md:gap-8">
        <Reveal as="h2" by="chars" className="t-mega">
          {name}
        </Reveal>
        <span
          aria-hidden
          className="mb-[2vw] block shrink-0 origin-bottom rounded-[50%_50%_45%_45%/65%_65%_35%_35%] bg-gradient-to-t from-ember via-amber to-glow"
          style={{
            width: `${1 + heat * 1.6}vw`,
            height: `${2 + heat * 4}vw`,
            minWidth: 12,
            minHeight: 22,
            boxShadow: `0 0 ${20 + heat * 60}px rgba(239,106,42,${0.4 + heat * 0.4})`,
            animation: "phaseFlicker .7s ease-in-out infinite alternate",
          }}
        />
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-12">
        <p className="t-slate md:col-span-3">Objective</p>
        <Reveal as="p" by="words" className="t-big md:col-span-9">
          {objective}
        </Reveal>
      </div>
      <style>{`@keyframes phaseFlicker { from { transform: scale(1,1) skewX(0) } to { transform: scale(.92,1.06) skewX(-3deg) } }`}</style>
    </header>
  );
}
