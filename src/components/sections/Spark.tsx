"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { spark as S } from "@/content/strategy";
import { PhaseHeader } from "./PhaseHeader";
import { FootageSlot } from "@/components/ui/FootageSlot";
import type { ReelKind } from "@/components/ui/PreviewReel";

const WEEKS = 8;

/** PHASE 01 — five hero pieces on a film strip that runs sideways as you scroll. */
export function Spark() {
  const root = useRef<HTMLElement>(null);
  const [playing, setPlaying] = useState<number | null>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 900px)", () => {
        const track = root.current!.querySelector<HTMLElement>("[data-track]")!;
        const viewport = root.current!.querySelector<HTMLElement>("[data-strip]")!;
        const dist = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
        // cards lean into the motion with scroll velocity
        const cards = gsap.utils.toArray<HTMLElement>("[data-card]");
        const skew = gsap.quickTo(cards, "skewX", { duration: 0.6, ease: "power3" });
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: viewport,
            start: "top top",
            end: () => `+=${dist() + window.innerHeight * 0.4}`,
            pin: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
            onUpdate: (self) => skew(gsap.utils.clamp(-5, 5, self.getVelocity() / -450)),
            onLeave: () => skew(0),
            onLeaveBack: () => skew(0),
          },
        });
        tl.to(track, { x: () => -dist(), ease: "none" }, 0).fromTo("[data-playhead]", { scaleX: 0 }, { scaleX: 1, ease: "none" }, 0);
      });
      gsap.from("[data-card]", { autoAlpha: 0, y: 60, stagger: 0.08, duration: 1, ease: "expo.out", scrollTrigger: { trigger: "[data-strip]", start: "top 75%", once: true } });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="spark" className="relative z-10 pt-[20vh]">
      <PhaseHeader n={S.n} name={S.name} months={S.months} objective={S.objective} heat={0.35} />
      <div className="gutter mx-auto mt-10 max-w-[1600px]">
        <p className="t-lede md:ml-[25%]">{S.line}</p>
      </div>

      <div data-strip className="relative mt-[12vh] flex min-h-[100svh] flex-col justify-center overflow-hidden py-16">
        <div className="gutter mb-6 flex items-end justify-between">
          <span className="t-slate">The first eight weeks · hover a frame to roll it</span>
          <span className="t-slate hidden md:inline">5 hero pieces</span>
        </div>
        <div className="overflow-x-auto md:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory md:snap-none">
          <div data-track className="gutter flex w-max gap-5 md:gap-8">
            {S.pieces.map((p, i) => {
              const on = playing === i;
              return (
                <article
                  data-card
                  key={p.slot}
                  data-cursor={on ? "Rolling" : "Play"}
                  className="group relative w-[min(72vw,300px)] shrink-0 snap-center md:w-[min(24vw,330px)]"
                  onMouseEnter={() => setPlaying(i)}
                  onMouseLeave={() => setPlaying((v) => (v === i ? null : v))}
                  onClick={() => setPlaying((v) => (v === i ? null : i))}
                >
                  <div className="flex items-baseline justify-between pb-3">
                    <span className={`t-label transition-colors ${on ? "text-ember" : "text-bone"}`}>{p.week}</span>
                    <span className="t-slate">{p.length}</span>
                  </div>
                  <div className="relative border-y-[14px] border-[#100e0c] bg-[#100e0c] px-2.5">
                    <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-[11px] h-[8px] opacity-70" style={{ background: "repeating-linear-gradient(90deg, transparent 0 8px, rgba(239,232,222,.22) 8px 18px, transparent 18px 26px)" }} />
                    <div aria-hidden className="pointer-events-none absolute inset-x-0 -bottom-[11px] h-[8px] opacity-70" style={{ background: "repeating-linear-gradient(90deg, transparent 0 8px, rgba(239,232,222,.22) 8px 18px, transparent 18px 26px)" }} />
                    <div className="relative aspect-[9/16] overflow-hidden transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.015]">
                      <FootageSlot slot={p.slot} kind={p.reel as ReelKind} playing={on} title={p.title} />
                      <div
                        className={`absolute inset-x-0 bottom-0 z-10 flex flex-col gap-2 bg-gradient-to-t from-ink via-ink/85 to-transparent p-4 pt-20 transition-all duration-500 ${
                          on ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                        }`}
                      >
                        <p className="font-serif text-[1.05rem] italic leading-snug text-bone/90">“{p.hook}”</p>
                        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-bone/15 pt-3">
                          <div>
                            <dt className="t-slate">Format</dt>
                            <dd className="t-label mt-0.5">{p.format}</dd>
                          </div>
                          <div>
                            <dt className="t-slate">Objective</dt>
                            <dd className="t-label mt-0.5 text-amber">{p.objective}</dd>
                          </div>
                        </dl>
                        <p className="t-slate mt-1 leading-relaxed">{p.shows.join(" · ")}</p>
                      </div>
                    </div>
                  </div>
                  <h3 className="mt-4 font-display text-[clamp(1.6rem,2.2vw,2.3rem)] font-extrabold uppercase leading-none">{p.title}</h3>
                </article>
              );
            })}
            <div className="flex w-[min(72vw,300px)] shrink-0 snap-center flex-col justify-end pb-16 md:w-[min(24vw,330px)]">
              <p className="t-slate">End of phase 01</p>
              <p className="mt-3 font-display text-[clamp(2rem,3vw,3rem)] font-extrabold uppercase leading-[0.9]">
                The voice is <span className="t-serif text-ember">established.</span>
              </p>
              <p className="t-lede mt-4 text-base">Now we give people a reason to come back.</p>
            </div>
          </div>
        </div>

        {/* timeline ruler: Week 01 → Week 08 */}
        <div className="gutter mt-12 hidden md:block">
          <div className="relative h-8">
            <div className="absolute inset-x-0 top-3 h-px bg-bone/15" />
            <div data-playhead className="absolute left-0 right-0 top-3 h-px origin-left bg-ember" />
            {Array.from({ length: WEEKS }).map((_, i) => {
              const hasPiece = S.pieces.some((p) => p.week.endsWith(String(i + 1).padStart(2, "0")));
              return (
                <div key={i} className="absolute top-0 -translate-x-1/2" style={{ left: `${(i / (WEEKS - 1)) * 100}%` }}>
                  <div className={`mx-auto h-[7px] w-[7px] translate-y-[9px] rounded-full ${hasPiece ? "bg-ember" : "bg-bone/30"}`} />
                  <div className="t-slate mt-4 whitespace-nowrap">W{String(i + 1).padStart(2, "0")}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
