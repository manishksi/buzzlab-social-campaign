"use client";

import { phases } from "@/content/strategy";
import { useStore } from "@/lib/store";
import { scrollToId, useLenis } from "./SmoothScroll";

/** A slim fixed rail that appears while the phases play, so Spark → Flame → Light is always one click away. */
export function PhaseRail() {
  const act = useStore((s) => s.act);
  const lenis = useLenis();
  // acts: 5 = spark, 6 = flame, 7 = light
  const visible = act >= 5 && act <= 7;
  const active = act - 5;
  return (
    <nav
      aria-label="Phases"
      className="fixed right-[max(10px,calc(var(--gutter)*0.3))] top-1/2 z-40 hidden flex-col items-center gap-4 transition-all duration-700 md:flex"
      style={{ opacity: visible ? 1 : 0, transform: `translate(${visible ? 0 : 16}px, -50%)`, pointerEvents: visible ? "auto" : "none" }}
    >
      {phases.map((p, i) => (
        <button
          key={p.key}
          type="button"
          data-cursor={p.name}
          onClick={() => scrollToId(lenis, p.key)}
          className="group relative flex flex-col items-center gap-1.5"
          aria-current={i === active ? "step" : undefined}
          aria-label={`Phase ${p.n}: ${p.name}`}
        >
          <span className="relative flex h-6 w-3 items-end justify-center" aria-hidden>
            <span className={`absolute bottom-0 h-[2px] w-3 ${i <= active ? "bg-ember" : "bg-bone/25"}`} />
            <span
              className="absolute bottom-1 h-3 w-2 origin-bottom rounded-[50%_50%_45%_45%/65%_65%_35%_35%] bg-gradient-to-t from-ember via-amber to-glow transition-transform duration-500"
              style={{ transform: `scale(${i === active ? 1 + i * 0.25 : 0})` }}
            />
          </span>
          <span className={`t-slate transition-colors ${i === active ? "text-bone" : "group-hover:text-bone"}`}>{p.n}</span>
          <span className="t-slate pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap bg-ink/90 px-2 py-1 text-bone opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            {p.name}
          </span>
        </button>
      ))}
    </nav>
  );
}
