"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { mix } from "@/content/strategy";

/**
 * The content mix as a mixing desk, not a pie: five channel faders pushed up to their level as
 * you scroll in (People 40, Process 20, Proof 20, Play 10, IP 10), and the master strip below
 * showing what a month sounds like at this mix.
 */
export function ContentMix() {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: "top 75%", end: "center 50%", scrub: 0.6 } });
      gsap.utils.toArray<HTMLElement>("[data-fader]").forEach((f, i) => {
        const level = Number(f.dataset.level);
        tl.fromTo(f, { bottom: "0%" }, { bottom: `${level}%`, ease: "power2.out", duration: 0.5 }, i * 0.08);
      });
      tl.fromTo("[data-meter]", { scaleY: 0 }, { scaleY: 1, ease: "none", duration: 0.5, stagger: 0.08 }, 0)
        .fromTo("[data-master] span", { scaleX: 0 }, { scaleX: 1, ease: "power2.out", duration: 0.3, stagger: 0.06 }, 0.4);
    },
    { scope: root },
  );

  // the faders read on a 0–50% scale so 10% still has some travel
  const level = (share: number) => (share / 50) * 100;

  return (
    <div ref={root} data-dim="0.3" className="gutter mx-auto mt-[16vh] grid max-w-[1600px] grid-cols-12 gap-x-6 pb-[6vh]">
      <div className="col-span-12 lg:col-span-7">
        <p className="t-slate mb-4">{mix.label}</p>
        <h3 className="t-big max-w-[18ch]">{mix.title}</h3>

        <div className="mt-10 grid grid-cols-5 gap-2 border-y hairline py-6 md:gap-4" role="list" aria-label="Content mix">
          {mix.channels.map((c, i) => (
            <div key={c.name} role="listitem" className="flex flex-col items-center text-center" aria-label={`${c.name}: ${c.share}%`}>
              <span className={`font-display text-[clamp(1.8rem,3.4vw,3.4rem)] font-extrabold leading-none tabular ${i === 0 ? "text-buzz" : ""}`}>
                {c.share}
                <span className="text-[0.5em] text-bone/50">%</span>
              </span>
              {/* the channel: a track, a level meter, a fader cap */}
              <div className="relative mt-4 h-[clamp(140px,22vh,220px)] w-full">
                <div aria-hidden className="absolute bottom-0 left-1/2 top-0 w-px -translate-x-1/2 bg-bone/20" />
                {[0, 25, 50, 75, 100].map((t) => (
                  <div key={t} aria-hidden className="absolute left-1/2 h-px w-3 -translate-x-[calc(50%+14px)] bg-bone/25" style={{ bottom: `${t}%` }} />
                ))}
                <div aria-hidden data-meter className={`absolute bottom-0 left-1/2 w-[3px] origin-bottom translate-x-[6px] ${i === 0 ? "bg-buzz" : "bg-bone/60"}`} style={{ height: `${level(c.share)}%` }} />
                <div
                  aria-hidden
                  data-fader
                  data-level={level(c.share)}
                  className={`absolute left-1/2 h-[14px] w-[clamp(26px,3vw,40px)] -translate-x-1/2 translate-y-1/2 rounded-[3px] border ${i === 0 ? "border-buzz bg-buzz" : "border-bone/70 bg-char"}`}
                  style={{ bottom: `${level(c.share)}%` }}
                >
                  <span className={`absolute inset-x-1 top-1/2 h-px ${i === 0 ? "bg-ink" : "bg-bone/70"}`} />
                </div>
              </div>
              <span className={`t-label mt-5 ${i === 0 ? "text-buzz" : ""}`}>{c.name}</span>
              <span className="mt-2 hidden text-[0.78rem] leading-snug text-ash md:block">{c.items}</span>
            </div>
          ))}
        </div>

        {/* master: a month at this mix */}
        <div className="mt-6">
          <div data-master className="flex h-3 w-full gap-[3px]" aria-hidden>
            {mix.channels.map((c, i) => (
              <span key={c.name} className={`block h-full origin-left ${i === 0 ? "bg-buzz" : "bg-bone/50"}`} style={{ width: `${c.share}%`, opacity: i === 0 ? 1 : 1 - i * 0.13 }} />
            ))}
          </div>
          <p className="t-slate mt-3">Master · a month of posts at this mix</p>
        </div>
      </div>
    </div>
  );
}
