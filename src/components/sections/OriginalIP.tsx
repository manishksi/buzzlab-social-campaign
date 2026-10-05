"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { ip as I } from "@/content/strategy";
import { worldClock } from "@/lib/world-clock";
import { playSwell } from "@/lib/audio";

/**
 * ACT 07 — Original BuzzLab IP, part two. The post opens into a world (machine/scene.ts), and
 * over it one reveal: ORIGINAL BUZZLAB IP. Under it, the people behind the IP engine — founder,
 * director, producer, DOP, strategist, editors, interns. Then the world fades to black.
 */
export function OriginalIP() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const q = (s: string) => el.querySelectorAll(s);
      gsap.set([q("[data-r]"), q("[data-team] li"), q("[data-tl]"), q("[data-wire]")], { autoAlpha: 0 });
      let swelled = false;
      const tl = gsap.timeline({
        defaults: { ease: "power2.out" },
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "+=720%",
          pin: true,
          scrub: 0.6,
          onUpdate: (self) => {
            const p = self.progress;
            worldClock.machine.w = 0.8 + Math.min(1, p / 0.97) * 0.2;
            worldClock.machine.fade = 1 - gsap.utils.clamp(0, 1, (p - 0.965) / 0.03);
            const now = p > 0.44;
            if (now && !swelled && self.direction > 0) playSwell();
            swelled = now;
          },
        },
      });
      // silence while the post opens into the world, then the reveal
      tl.to({}, { duration: 0.42 })
        .fromTo("[data-r1]", { autoAlpha: 0, yPercent: 60, letterSpacing: "0.4em" }, { autoAlpha: 1, yPercent: 0, letterSpacing: "0.02em", duration: 0.05 }, 0.44)
        .fromTo("[data-r2]", { autoAlpha: 0, scale: 0.7, filter: "blur(30px)" }, { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 0.07 }, 0.46)
        .set(q("[data-r]"), { autoAlpha: 1 }, 0.44)
        .to("[data-reveal]", { y: () => -window.innerHeight * 0.16, scale: 0.7, duration: 0.05, ease: "power2.inOut" }, 0.6)
        // the people behind it, one at a time, joined by one line
        .fromTo(q("[data-tl]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.02 }, 0.62)
        .fromTo(q("[data-wire]"), { autoAlpha: 1, scaleX: 0 }, { scaleX: 1, duration: 0.12, ease: "none" }, 0.63)
        .fromTo(q("[data-team] li"), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.03, stagger: 0.016 }, 0.63)
        // hold, then everything leaves before the world goes dark (the pipeline is next)
        .to(["[data-reveal]", q("[data-team] li"), q("[data-tl]"), q("[data-wire]")], { autoAlpha: 0, duration: 0.03 }, 0.93)
        .to({}, { duration: 0.01 }, 0.99);
    },
    { scope: root },
  );

  return (
    <section ref={root} id="ip" className="relative z-10 h-[100svh] overflow-hidden" aria-label={I.eyebrow}>
      {/* a little shade so type always reads over the bright horizon */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_42%,rgba(0,0,0,.45),transparent_70%)]" />
      <p className="t-slate gutter absolute inset-x-0 top-[calc(env(safe-area-inset-top,0px)+5.5rem)]">{I.eyebrow}</p>

      <div className="gutter absolute inset-0 flex items-center justify-center text-center">
        <div data-reveal className="absolute flex flex-col items-center">
          <h2>
            <span data-r data-r1 className="t-serif block text-[clamp(1.8rem,3.4vw,3.4rem)] leading-none text-buzz">
              {I.reveal[0]}
            </span>
            <span data-r data-r2 className="mt-3 block font-display text-[clamp(4.2rem,15vw,17rem)] font-extrabold uppercase leading-[0.84]" style={{ textShadow: "0 0 80px rgba(0,0,0,.6)" }}>
              {I.reveal[1]}
            </span>
          </h2>
        </div>

        <div className="absolute inset-x-0 bottom-[11vh] mx-auto max-w-[1400px] px-[var(--gutter)]">
          <p data-tl className="t-slate mb-5 text-center text-buzz">
            {I.teamLabel}
          </p>
          <div className="relative">
            <span data-wire aria-hidden className="absolute inset-x-[4%] top-[7px] hidden h-px origin-left bg-gradient-to-r from-bone/10 via-buzz to-bone/10 md:block" />
            <ol data-team className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4 md:flex md:justify-between md:gap-0">
              {I.team.map((t, i) => (
                <li key={t} className="relative flex flex-col items-center gap-2 text-center">
                  <span aria-hidden className={`hidden h-[15px] w-[15px] rounded-full border md:block ${i === 0 ? "border-buzz bg-buzz shadow-[0_0_24px_rgba(249,254,2,.7)]" : "border-bone/60 bg-ink"}`} />
                  <span className="t-slate">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-display text-[clamp(1.35rem,2.1vw,2.4rem)] font-extrabold uppercase leading-none">{t}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
