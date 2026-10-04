"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { ip as I } from "@/content/strategy";
import { machineClock } from "@/lib/machine-clock";
import { playSwell } from "@/lib/audio";

/**
 * ACT 09 — Original BuzzLab IP. The last reel opens into a world (machine/scene.ts), and over it:
 * WHAT IF WE DIDN'T JUST MAKE CONTENT? / WHAT IF WE MADE WORLDS? / ORIGINAL BUZZLAB IP.
 * Then, quietly: this isn't a content plan — it's a media engine. The world fades to black.
 */
export function OriginalIP() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const q = (s: string) => el.querySelectorAll(s);
      gsap.set([q("[data-b]"), q("[data-r]"), q("[data-poss] li"), q("[data-nl]"), q("[data-f]")], { autoAlpha: 0 });
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
            machineClock.w = 0.8 + Math.min(1, p / 0.97) * 0.2;
            machineClock.fade = 1 - gsap.utils.clamp(0, 1, (p - 0.965) / 0.03);
            const now = p > 0.7;
            if (now && !swelled && self.direction > 0) playSwell();
            swelled = now;
          },
        },
      });
      const [b1, b2] = q("[data-b]");
      // silence while the reel opens into the world, then the two questions
      tl.to({}, { duration: 0.4 })
        .fromTo(b1, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.05 }, 0.42)
        .to(b1, { autoAlpha: 0, y: -30, filter: "blur(8px)", duration: 0.04 }, 0.52)
        .fromTo(b2, { autoAlpha: 0, scale: 1.12, filter: "blur(16px)" }, { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 0.06 }, 0.57)
        .to(b2, { autoAlpha: 0, scale: 0.94, duration: 0.04 }, 0.66)
        // the reveal
        .fromTo("[data-r1]", { autoAlpha: 0, yPercent: 60, letterSpacing: "0.4em" }, { autoAlpha: 1, yPercent: 0, letterSpacing: "0.02em", duration: 0.05 }, 0.7)
        .fromTo("[data-r2]", { autoAlpha: 0, scale: 0.7, filter: "blur(30px)" }, { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 0.07 }, 0.72)
        .set(q("[data-r]"), { autoAlpha: 1 }, 0.7)
        .to("[data-reveal]", { y: () => -window.innerHeight * 0.16, scale: 0.7, duration: 0.05, ease: "power2.inOut" }, 0.8)
        .fromTo(q("[data-poss] li"), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.025, stagger: 0.004 }, 0.81)
        .fromTo(q("[data-nl]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.02 }, 0.85)
        // clear the stage for the last two lines
        .to(["[data-reveal]", q("[data-poss] li"), q("[data-nl]")], { autoAlpha: 0, duration: 0.025 }, 0.875)
        .fromTo("[data-f1]", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.03 }, 0.89)
        .fromTo("[data-f2]", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.03 }, 0.92)
        .to(q("[data-f]"), { autoAlpha: 0, duration: 0.02 }, 0.965)
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
        <p data-b className="t-big absolute max-w-[16ch] balance">
          {I.beats[0]}
        </p>
        <p data-b className="t-huge absolute max-w-[14ch] balance">
          What if we made <span className="text-buzz">worlds?</span>
        </p>

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

        <div className="absolute inset-x-0 bottom-[10vh] mx-auto max-w-[56rem] px-[var(--gutter)]">
          <ul data-poss className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-left md:grid-cols-3 md:gap-y-2">
            {I.possibilities.map((p) => (
              <li key={p} className="font-serif text-[0.95rem] italic leading-snug text-bone/85 md:text-[clamp(1rem,1.25vw,1.2rem)]">
                {p}
              </li>
            ))}
          </ul>
          <p data-nl className="t-label mt-6 text-left text-buzz">
            {I.notLocked}
          </p>
        </div>

        <div className="absolute flex flex-col items-center">
          <p data-f data-f1 className="t-big text-bone/75">
            {I.final[0]}
          </p>
          <p data-f data-f2 className="t-mega mt-3">
            {I.final[1]}
          </p>
        </div>
      </div>
    </section>
  );
}
