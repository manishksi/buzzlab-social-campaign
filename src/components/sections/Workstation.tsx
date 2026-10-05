"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { studio } from "@/content/strategy";
import { worldClock } from "@/lib/world-clock";

const C = studio.act2;

/**
 * ACT 02, continued — the editor's workstation. The studio (machine/studio.ts) fades up from the
 * black the objective leaves behind: an editor at his desk in the dark, the monitor the brightest
 * thing in the room. The camera pushes in, goes over his shoulder, round the desk, and finds his
 * face just as the line lands: the editor is only one part of the system.
 *
 * This section and the next (Studio, ACT 03) share one scroll clock, so the camera move never
 * stops between the acts. The copy holds the left columns; the 3D frames its subject right.
 */
export function Workstation() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const next = document.getElementById("engine")!;
      const clock = ScrollTrigger.create({
        trigger: el,
        start: "top top",
        endTrigger: next,
        end: "bottom bottom",
        onUpdate: (s) => void (worldClock.studio.w = s.progress),
        onRefresh: (s) => void (worldClock.studio.w = s.progress),
      });
      // the room fades up out of the objective's black
      const fade = ScrollTrigger.create({
        trigger: el,
        start: "top bottom",
        end: "top top",
        onUpdate: (s) => void (worldClock.studio.fade = s.progress),
        onRefresh: (s) => void (worldClock.studio.fade = s.progress),
      });

      const beats = gsap.utils.toArray<HTMLElement>("[data-beat]", el);
      gsap.set(beats, { autoAlpha: 0 });
      const tl = gsap.timeline({ defaults: { ease: "power2.out" }, scrollTrigger: { trigger: el, start: "top top", end: "bottom bottom", scrub: 0.6 } });
      tl.to({}, { duration: 1 }, 0);
      const show = (b: HTMLElement, a: number, z: number) => {
        const lines = b.querySelectorAll("[data-l]");
        tl.set(b, { autoAlpha: 1 }, a)
          .fromTo(lines, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.05, stagger: 0.025 }, a)
          .to(lines, { autoAlpha: 0, y: -18, duration: 0.04, stagger: 0.01, ease: "power2.in" }, z)
          .set(b, { autoAlpha: 0 }, z + 0.06);
      };
      show(beats[0], 0.04, 0.3);
      show(beats[1], 0.76, 0.95);
      return () => {
        clock.kill();
        fade.kill();
      };
    },
    { scope: root },
  );

  return (
    <section ref={root} id="workstation" className="relative z-10 h-[650vh]" aria-label={C.eyebrow}>
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* shade the copy side, never the subject */}
        <div aria-hidden className="studio-shade pointer-events-none absolute inset-0" />
        <div className="gutter mx-auto grid h-full max-w-[1600px] grid-cols-12 gap-x-6">
          <div className="relative col-span-12 md:col-span-6 lg:col-span-5">
            <div data-beat className="studio-beat">
              <p data-l className="t-slate mb-5">
                {C.eyebrow}
              </p>
              <h2 className="t-big">
                <span data-l className="block">
                  {C.title[0]}
                </span>
                <span data-l className="block text-bone/35">
                  {C.title[1]}
                </span>
              </h2>
              <p data-l className="t-lede mt-6 max-w-[30rem]">
                {C.sub}
              </p>
            </div>

            <div data-beat className="studio-beat">
              <p data-l className="t-slate mb-5">
                {C.eyebrow}
              </p>
              <h3 data-l className="t-big max-w-[16ch]">
                The editor is only <span className="text-buzz">one part</span> of the system.
              </h3>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
