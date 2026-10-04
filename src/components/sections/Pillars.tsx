"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { pillars as P } from "@/content/strategy";
import { Reveal } from "@/components/ui/Reveal";
import { Counter } from "@/components/ui/Counter";

const STRIP = 20; // one month of feed posts, drawn to scale (40/20/20/10/10 → 8/4/4/2/2)
const MAX = 40;
const LEDS = 12;

/** ACT 08 — the content mix as a mixing desk, plus a month of posts drawn to scale. */
export function Pillars() {
  const root = useRef<HTMLElement>(null);
  const [hot, setHot] = useState(0);

  useGSAP(
    () => {
      gsap.utils.toArray<HTMLElement>("[data-channel]").forEach((ch, i) => {
        const share = Number(ch.dataset.share);
        const st = { trigger: "[data-desk]", start: "top 70%", once: true } as const;
        gsap.fromTo(ch.querySelector("[data-cap]"), { bottom: "0%" }, { bottom: `${(share / MAX) * 100}%`, duration: 1.6, delay: i * 0.08, ease: "expo.out", scrollTrigger: st });
        gsap.fromTo(ch.querySelector("[data-fill]"), { scaleY: 0 }, { scaleY: share / MAX, duration: 1.6, delay: i * 0.08, ease: "expo.out", scrollTrigger: st });
      });
      gsap.from("[data-cell]", { scaleY: 0, transformOrigin: "bottom", stagger: 0.03, duration: 0.6, ease: "power3.out", scrollTrigger: { trigger: "[data-strip]", start: "top 85%", once: true } });
    },
    { scope: root },
  );

  // build the strip: contiguous groups per pillar
  const cells: number[] = [];
  P.list.forEach((p, i) => {
    for (let k = 0; k < Math.round((p.share / 100) * STRIP); k++) cells.push(i);
  });

  return (
    <section ref={root} id="what-we-post" data-dim="0.45" className="relative z-10 py-[18vh]">
      <div className="gutter mx-auto max-w-[1600px]">
        <p className="t-slate mb-6">{P.eyebrow}</p>
        <Reveal as="h2" by="chars" className="t-huge">
          {P.title}
        </Reveal>
        <Reveal as="p" className="t-lede mt-6">
          {P.sub}
        </Reveal>

        <div className="mt-16 grid gap-12 lg:grid-cols-12">
          <div data-desk className="lg:col-span-8">
            <div className="grid grid-cols-5 gap-2 border hairline bg-char/70 p-3 md:gap-4 md:p-6" onMouseLeave={() => setHot(0)}>
              {P.list.map((p, i) => {
                const on = hot === i;
                return (
                  <button
                    type="button"
                    data-channel
                    data-share={p.share}
                    key={p.name}
                    data-cursor={p.name}
                    onMouseEnter={() => setHot(i)}
                    onFocus={() => setHot(i)}
                    onClick={() => setHot(i)}
                    aria-pressed={on}
                    aria-label={`${p.name}: ${p.share} percent of posts`}
                    className="flex flex-col items-center gap-3 text-center"
                  >
                    <span className="t-slate">{p.n}</span>
                    <span className={`font-display text-[clamp(1.8rem,3.6vw,3.6rem)] font-extrabold leading-none transition-colors ${on ? "text-ember" : "text-bone"}`}>
                      <Counter display={String(p.share)} suffix="%" />
                    </span>
                    <span className="relative flex h-[clamp(180px,30vh,300px)] w-full justify-center gap-2 md:gap-3">
                      {/* LED meter */}
                      <span className="flex h-full w-2 flex-col-reverse gap-[2px] md:w-2.5" aria-hidden>
                        {Array.from({ length: LEDS }).map((_, k) => {
                          const lit = k < Math.round((p.share / MAX) * LEDS);
                          return (
                            <span
                              key={k}
                              className="flex-1 rounded-[1px] transition-colors duration-500"
                              style={{ background: lit ? (on ? (k > LEDS * 0.75 ? "var(--color-glow)" : "var(--color-ember)") : "rgba(239,232,222,.5)") : "rgba(239,232,222,.07)" }}
                            />
                          );
                        })}
                      </span>
                      {/* fader */}
                      <span className="relative h-full w-[3px] rounded-full bg-bone/10">
                        <span data-fill className="absolute inset-x-0 bottom-0 h-full origin-bottom rounded-full" style={{ background: on ? "var(--color-ember)" : "rgba(239,232,222,.35)" }} />
                        <span
                          data-cap
                          className={`absolute left-1/2 h-4 w-9 -translate-x-1/2 translate-y-1/2 rounded-[3px] border transition-colors md:w-11 ${on ? "border-ember bg-ember" : "border-bone/40 bg-[#2a2622]"}`}
                          style={{ bottom: `${(p.share / MAX) * 100}%` }}
                        >
                          <span className="absolute inset-x-1.5 top-1/2 h-px bg-ink/60" />
                        </span>
                      </span>
                    </span>
                    <span className={`font-display text-[clamp(1rem,1.8vw,1.7rem)] font-extrabold uppercase leading-none ${on ? "text-ember" : ""}`}>{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-4 lg:pt-6" aria-live="polite">
            <p className="t-slate">Pillar {P.list[hot].n}</p>
            <p className="mt-2 font-display text-[clamp(3rem,6vw,6rem)] font-extrabold uppercase leading-[0.85] text-ember">{P.list[hot].name}</p>
            <ul className="mt-6 border-t hairline">
              {P.list[hot].items.map((x) => (
                <li key={x} className="flex items-baseline justify-between border-b hairline py-3">
                  <span className="font-display text-[1.6rem] font-bold uppercase leading-none">{x}</span>
                </li>
              ))}
            </ul>
            <p className="t-slate mt-4">
              {P.list[hot].share}% of the feed · about {Math.round((P.list[hot].share / 100) * STRIP)} of every {STRIP} posts
            </p>
          </div>
        </div>

        {/* a month of posts, to scale */}
        <figure data-strip className="mt-16">
          <figcaption className="t-slate mb-3 flex justify-between">
            <span>{P.stripNote}</span>
            <span>{STRIP} posts</span>
          </figcaption>
          <div className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${STRIP}, minmax(0, 1fr))` }}>
            {cells.map((pi, i) => (
              <span
                data-cell
                key={i}
                onMouseEnter={() => setHot(pi)}
                className="block aspect-[9/16] rounded-[4px] transition-colors duration-300"
                style={{ background: pi === hot ? "var(--color-ember)" : `rgba(239,232,222,${0.08 + (4 - pi) * 0.035})` }}
                title={P.list[pi].name}
              />
            ))}
          </div>
          <div className="mt-2 grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${STRIP}, minmax(0, 1fr))` }} aria-hidden>
            {P.list.map((p, i) => (
              <span key={p.name} className={`t-slate truncate border-t pt-2 ${i === hot ? "border-ember text-ember" : "border-bone/20"}`} style={{ gridColumn: `span ${Math.round((p.share / 100) * STRIP)}` }}>
                {p.name}
              </span>
            ))}
          </div>
        </figure>
      </div>
    </section>
  );
}
