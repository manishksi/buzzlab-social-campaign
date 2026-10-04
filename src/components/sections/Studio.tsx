"use client";

import { useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { studio } from "@/content/strategy";

const C = studio.act3;
/** world time (machine/studio.ts) → EDITING / CREATIVE / PRODUCTION */
const rungAt = (p: number) => (p < 0.1 ? 0 : p < 0.32 ? 1 : 2);

/**
 * ACT 03 — the studio. Same room, same camera, no cut: past the monitor the space keeps going.
 * A second edit bay, a storyboard wall, the production table, then the set — camera, DOP,
 * lights, talent on a stool, the director at a monitor — and a crane up over the whole machine.
 * Then the lights go out, one zone at a time, and ACT 04 starts in the dark.
 */
export function Studio() {
  const root = useRef<HTMLElement>(null);
  const [rung, setRung] = useState(0);

  useGSAP(
    () => {
      const el = root.current!;
      const beats = gsap.utils.toArray<HTMLElement>("[data-beat]", el);
      gsap.set(beats, { autoAlpha: 0 });
      const tl = gsap.timeline({ defaults: { ease: "power2.out" }, scrollTrigger: { trigger: el, start: "top top", end: "bottom bottom", scrub: 0.6 } });
      tl.to({}, { duration: 1 }, 0);
      const show = (b: HTMLElement, a: number, z: number) => {
        const lines = b.querySelectorAll("[data-l]");
        tl.set(b, { autoAlpha: 1 }, a)
          .fromTo(lines, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.04, stagger: 0.02 }, a)
          .to(lines, { autoAlpha: 0, y: -18, duration: 0.035, stagger: 0.008, ease: "power2.in" }, z)
          .set(b, { autoAlpha: 0 }, z + 0.06);
      };
      show(beats[0], 0.02, 0.18);
      show(beats[1], 0.24, 0.46);
      show(beats[2], 0.5, 0.7);
      show(beats[3], 0.72, 0.86);
      tl.fromTo("[data-ladder]", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.04 }, 0).to("[data-ladder]", { autoAlpha: 0, duration: 0.04 }, 0.86);
      const st = ScrollTrigger.create({ trigger: el, start: "top top", end: "bottom bottom", onUpdate: (s) => setRung(rungAt(s.progress)) });
      return () => st.kill();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="engine" className="relative z-10 h-[750vh]" aria-label={C.eyebrow}>
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div aria-hidden className="studio-shade pointer-events-none absolute inset-0" />
        {/* EDITING → CREATIVE → PRODUCTION */}
        <ol data-ladder className="gutter absolute inset-x-0 top-[calc(env(safe-area-inset-top,0px)+5.5rem)] flex justify-end gap-x-3 md:gap-x-5" aria-label="Editing to production">
          {C.ladder.map((r, i) => (
            <li key={r} className={`t-slate transition-colors duration-500 ${i === rung ? "text-buzz" : i < rung ? "text-bone/60" : "text-ash/50"}`}>
              {r}
              {i < C.ladder.length - 1 && <span className="ml-3 text-bone/25 md:ml-5">→</span>}
            </li>
          ))}
        </ol>

        <div className="gutter mx-auto grid h-full max-w-[1600px] grid-cols-12 gap-x-6">
          <div className="relative col-span-12 md:col-span-6 lg:col-span-5">
            <div data-beat className="studio-beat">
              <p data-l className="t-slate mb-5">
                {C.eyebrow}
              </p>
              <p data-l className="t-big max-w-[14ch]">
                The room keeps going.
              </p>
            </div>

            <div data-beat className="studio-beat">
              <p data-l className="t-slate mb-5">
                {C.eyebrow}
              </p>
              <h2 className="t-big">
                <span data-l className="block">
                  {C.title[0]}
                </span>
                <span data-l className="block text-bone/45">
                  {C.title[1]}
                </span>
              </h2>
            </div>

            <div data-beat className="studio-beat">
              <p data-l className="t-slate mb-5">
                {C.eyebrow}
              </p>
              <h2 className="t-big">
                <span data-l className="block">
                  {C.titleB[0]}
                </span>
                <span data-l className="block">
                  want to <span className="text-buzz">come back.</span>
                </span>
              </h2>
            </div>

            <div data-beat className="studio-beat">
              <p data-l className="t-slate mb-6">
                Three layers, one engine
              </p>
              <ol className="grid grid-cols-3 gap-x-5 border-t hairline">
                {C.layers.map((l, i) => (
                  <li data-l key={l.n} className="pt-4">
                    <span className="t-slate">{l.n}</span>
                    <span className={`mt-2 block font-display text-[clamp(1.5rem,2.2vw,2.4rem)] font-extrabold uppercase leading-none ${i === 2 ? "text-buzz" : ""}`}>{l.name}</span>
                    <span className="t-label mt-3 block text-ash">{l.job}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
