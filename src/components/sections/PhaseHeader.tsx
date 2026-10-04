"use client";

import { Reveal } from "@/components/ui/Reveal";

/**
 * Shared title card for the three phases, on the editorial grid: act label row → headline →
 * objective → details (children), all in one left column so the figure keeps the right.
 */
export function PhaseHeader({ n, name, months, objective, heat, children }: { n: string; name: string; months: string; objective: string; heat: number; children?: React.ReactNode }) {
  return (
    <header className="gutter mx-auto max-w-[1600px]">
      <div className="flex items-center justify-between border-b hairline pb-4">
        <span className="t-slate">Phase {n}</span>
        <span className="t-slate text-buzz-soft">{months}</span>
      </div>
      {/* one column, top to bottom: headline → objective → details */}
      <div className="mt-8 grid grid-cols-12 gap-x-6">
        <div className="col-span-12 md:col-span-8 lg:col-span-6">
          <div className="flex items-end gap-5 md:gap-8">
            <Reveal as="h2" by="chars" className="t-mega">
              {name}
            </Reveal>
            <span
              aria-hidden
              className="mb-[2vw] block shrink-0 origin-bottom rounded-[50%_50%_45%_45%/65%_65%_35%_35%] bg-gradient-to-t from-buzz via-buzz-soft to-buzz-pale"
              style={{
                width: `${1 + heat * 1.6}vw`,
                height: `${2 + heat * 4}vw`,
                minWidth: 12,
                minHeight: 22,
                boxShadow: `0 0 ${20 + heat * 60}px rgba(249,254,2,${0.3 + heat * 0.3})`,
                animation: "phaseFlicker .7s ease-in-out infinite alternate",
              }}
            />
          </div>
          <p className="t-slate mt-10">Objective</p>
          <Reveal as="p" by="words" className="t-big mt-3 max-w-[16ch]">
            {objective}
          </Reveal>
          {children}
        </div>
      </div>
      <style>{`@keyframes phaseFlicker { from { transform: scale(1,1) skewX(0) } to { transform: scale(.92,1.06) skewX(-3deg) } }`}</style>
    </header>
  );
}
