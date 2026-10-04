"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { pipeline as P } from "@/content/strategy";
import { Reveal } from "@/components/ui/Reveal";
import { filmKeys } from "@/lib/film-keys";

const N = P.stages.length;

/**
 * ACT 08 — the circular pipeline. Scrolling drives a playhead round the loop.
 * It opens on a breath: he takes a pull, lets out a long cloud of smoke, and the pipeline
 * comes up through it.
 */
export function Pipeline() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? active;

  // Below the pinned breakpoint the playhead walks the loop by itself while on screen.
  useEffect(() => {
    if (window.matchMedia("(min-width: 900px)").matches) return;
    let id: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(id);
      if (e.isIntersecting) id = setInterval(() => setActive((a) => (a + 1) % N), 1800);
    });
    if (root.current) io.observe(root.current);
    return () => {
      clearInterval(id);
      io.disconnect();
    };
  }, []);
  const st = P.stages[shown];

  useGSAP(
    () => {
      const el = root.current!;
      const stage = el.querySelector<HTMLElement>("[data-ring-stage]")!;
      // the pipeline surfaces out of the smoke
      gsap.fromTo(
        "[data-surface]",
        { autoAlpha: 0, y: 50, filter: "blur(14px)" },
        { autoAlpha: 1, y: 0, filter: "blur(0px)", ease: "power1.out", scrollTrigger: { trigger: stage, start: "top 92%", end: "top 25%", scrub: 0.6 } },
      );
      const off = filmKeys.register("pipeline", () => {
        const top = stage.getBoundingClientRect().top + window.scrollY;
        const vh = window.innerHeight;
        return [
          { y: top - vh * 0.1, t: 1.02 },
          // end of the pinned loop (desktop) or of the stage (no pin below 900px)
          { y: window.matchMedia("(min-width: 900px)").matches ? top + vh * 1.6 : top + Math.max(vh * 0.6, stage.offsetHeight - vh * 0.5), t: 1.05 },
        ];
      });
      const mm = gsap.matchMedia();
      mm.add("(min-width: 900px)", () => {
        const head = root.current!.querySelector("[data-head]");
        const arc = root.current!.querySelector("[data-arc]");
        gsap.timeline({
          scrollTrigger: {
            trigger: "[data-ring-stage]",
            start: "top top",
            end: "+=160%",
            pin: true,
            scrub: 0.6,
            onUpdate: (self) => {
              const p = self.progress;
              setActive(Math.min(N - 1, Math.floor(p * N)));
              gsap.set(head, { rotate: p * 360, svgOrigin: "50 50" });
              gsap.set(arc, { strokeDashoffset: 1 - p });
            },
          },
        });
      });
      return () => {
        off();
        mm.revert();
      };
    },
    { scope: root },
  );

  return (
    <section ref={root} id="pipeline" className="relative z-10">
      {/* a breath between acts: nothing on screen but him and the smoke */}
      <div aria-hidden className="h-[80svh]" />
      <div data-ring-stage data-dim="0.38" className="flex min-h-[100svh] items-center py-[12vh]">
        <div data-surface className="gutter mx-auto grid w-full max-w-[1600px] items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="t-slate mb-6">{P.eyebrow}</p>
            <Reveal as="h2" by="chars" className="t-big">
              {P.title}
            </Reveal>
            <p className="t-lede mt-6">{P.sub}</p>
            <ol className="mt-8 flex flex-wrap gap-x-3 gap-y-2">
              {P.groups.map((g, i) => (
                <li key={g} className={`t-label transition-colors ${i === st.group ? "text-ember" : "text-ash"}`}>
                  {g}
                  {i < P.groups.length - 1 && <span className="ml-3 text-bone/25">→</span>}
                </li>
              ))}
            </ol>
          </div>

          <ol className="border-t hairline sm:hidden">
            {P.stages.map((s, i) => (
              <li key={s.name} className={`grid grid-cols-[2.5rem_1fr] gap-x-3 border-b hairline py-3 transition-colors ${i === active ? "bg-[#1b130e]" : ""}`}>
                <span className={`t-slate pt-1 ${i === active ? "text-ember" : ""}`}>{String(i + 1).padStart(2, "0")}</span>
                <span>
                  <span className="font-display text-[1.5rem] font-extrabold uppercase leading-none">{s.name}</span>
                  <span className="t-slate ml-2 text-amber">{P.groups[s.group]}</span>
                  <span className="mt-1 block text-[0.95rem] leading-snug text-bone/75">{s.note}</span>
                </span>
              </li>
            ))}
            <li className="t-slate pt-3">↺ Iterate feeds the next idea</li>
          </ol>
          <div className="relative mx-auto hidden aspect-square w-full max-w-[640px] sm:block lg:col-span-8">
            <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(239,232,222,.1)" strokeWidth="0.3" />
              <circle data-arc cx="50" cy="50" r="40" fill="none" stroke="#ef6a2a" strokeWidth="0.5" pathLength={1} strokeDasharray="1" strokeDashoffset="1" transform="rotate(-90 50 50)" />
              <g data-head>
                <circle cx="50" cy="10" r="1.6" fill="#ffd6a0" />
                <circle cx="50" cy="10" r="4" fill="#ef6a2a" opacity="0.25" />
              </g>
              <path d="M57 4.5 A 46 46 0 0 1 64 6.5" stroke="rgba(239,232,222,.4)" strokeWidth="0.3" fill="none" />
            </svg>
            {P.stages.map((s, i) => {
              const a = (i / N) * Math.PI * 2 - Math.PI / 2;
              const x = 50 + Math.cos(a) * 40;
              const y = 50 + Math.sin(a) * 40;
              const on = i === shown;
              const done = i <= active;
              return (
                <button
                  key={s.name}
                  type="button"
                  data-cursor={s.name}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <span className={`h-3 w-3 rounded-full border transition-all duration-300 ${on ? "scale-150 border-ember bg-ember shadow-[0_0_18px_rgba(239,106,42,.9)]" : done ? "border-ember bg-ember/40" : "border-bone/40 bg-ink"}`} />
                  <span className={`whitespace-nowrap bg-ink/70 px-1 font-display text-[clamp(.85rem,1.4vw,1.25rem)] font-bold uppercase leading-none transition-colors ${on ? "text-bone" : "text-bone/50"}`}>
                    {String(i + 1).padStart(2, "0")} {s.name}
                  </span>
                </button>
              );
            })}
            <div className="absolute inset-[22%] flex flex-col items-center justify-center text-center" aria-live="polite">
              <span className="t-slate">Stage {String(shown + 1).padStart(2, "0")} / {N}</span>
              <span className="mt-3 font-display text-[clamp(2.2rem,5vw,4.6rem)] font-extrabold uppercase leading-[0.85] text-ember">{P.groups[st.group]}</span>
              <span className="mt-4 max-w-[20rem] text-[clamp(.95rem,1.1vw,1.1rem)] leading-snug text-bone/80">
                <span className="font-display text-[1.25em] font-bold uppercase text-bone">{st.name}.</span> {st.note}
              </span>
              <span className="t-slate mt-4">↺ Iterate feeds the next idea</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
