"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { rhythm } from "@/content/strategy";

/**
 * The weekly rhythm as a broadcast schedule: four programmed slots (Mon hero, Wed BTS, Fri people,
 * Sun experiment) with stories in between, and an on-air playhead running across the week as you
 * scroll. Below it, what a month adds up to: 1 hero, 4–8 supporting pieces, 8–15 stories.
 */
export function Broadcast() {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      gsap.from("[data-slot]", { autoAlpha: 0, y: 24, stagger: 0.06, duration: 0.8, ease: "expo.out", scrollTrigger: { trigger: "[data-week]", start: "top 78%", once: true } });
      gsap.from("[data-month] li", { autoAlpha: 0, y: 24, stagger: 0.1, duration: 0.8, ease: "expo.out", scrollTrigger: { trigger: "[data-month]", start: "top 85%", once: true } });
      // ON AIR: the playhead crosses the week, each programmed slot lights as it passes
      const days = gsap.utils.toArray<HTMLElement>("[data-day]");
      gsap.fromTo(
        "[data-onair]",
        { left: "0%" },
        {
          left: "100%",
          ease: "none",
          scrollTrigger: {
            trigger: "[data-week]",
            start: "top 70%",
            end: "bottom 35%",
            scrub: 0.5,
            onUpdate: (self) => {
              const at = Math.min(days.length - 1, Math.floor(self.progress * days.length));
              days.forEach((d, i) => d.classList.toggle("is-on", i === at && self.progress > 0 && self.progress < 1));
            },
          },
        },
      );
    },
    { scope: root },
  );

  return (
    <div ref={root} data-dim="0.3" className="gutter mx-auto mt-[18vh] grid max-w-[1600px] grid-cols-12 gap-x-6">
      <div className="col-span-12 lg:col-span-8">
        <p className="t-slate mb-4">{rhythm.label}</p>
        <h3 className="t-big max-w-[18ch]">{rhythm.title}</h3>

        <div data-week className="relative mt-10 border-y hairline">
          <ol className="grid grid-cols-1 md:grid-cols-7">
            {rhythm.week.map((d, i) => (
              <li
                key={d.day}
                data-day
                className={`broadcast-day relative flex items-center gap-4 border-t hairline py-2 first:border-t-0 md:block md:border-l md:border-t-0 md:px-3 md:pb-4 md:pt-3 md:first:border-l-0 ${d.slot ? "" : "opacity-70"}`}
              >
                <span className="t-slate w-9 shrink-0 md:w-auto">{d.day}</span>
                {d.slot ? (
                  <div data-slot className={`flex-1 border p-2 md:mt-3 md:min-h-[clamp(84px,12vh,120px)] md:p-3 ${i === 0 ? "border-buzz bg-buzz text-ink" : "border-bone/25 bg-char"}`}>
                    <p className="font-display text-[clamp(0.8rem,1.1vw,1.2rem)] font-extrabold uppercase leading-[0.95] [overflow-wrap:anywhere]">{d.slot}</p>
                    <p className={`mt-2 hidden text-[0.75rem] leading-snug md:block ${i === 0 ? "text-ink/75" : "text-ash"}`}>{d.note}</p>
                  </div>
                ) : (
                  <div data-slot className="flex flex-1 items-center gap-3 md:mt-3 md:min-h-[clamp(84px,12vh,120px)] md:items-end">
                    <span className="block h-1.5 w-full bg-bone/15" />
                    <span className="t-slate shrink-0 text-ash/70 md:hidden">Stories</span>
                  </div>
                )}
                {!d.slot && <span className="t-slate mt-2 hidden text-ash/70 md:block">Stories</span>}
              </li>
            ))}
          </ol>
          {/* the on-air playhead */}
          <div data-onair aria-hidden className="pointer-events-none absolute bottom-0 top-0 hidden w-px bg-buzz md:block">
            <span className="t-slate absolute -top-6 left-1 whitespace-nowrap text-buzz">● On air</span>
          </div>
        </div>

        <ol data-month className="mt-10 grid grid-cols-3 gap-6" aria-label="Every month">
          {rhythm.month.map((m, i) => (
            <li key={m.label}>
              <span className={`font-display text-[clamp(2.6rem,5vw,4.8rem)] font-extrabold leading-none tabular ${i === 0 ? "text-buzz" : ""}`}>{m.display}</span>
              <span className="t-label mt-2 block">{m.label}</span>
            </li>
          ))}
        </ol>
        <p className="t-slate mt-6">Every month · {rhythm.footnote}</p>
      </div>
    </div>
  );
}
