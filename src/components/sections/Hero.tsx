"use client";

import { useRef } from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { hero } from "@/content/strategy";
import { playClick } from "@/lib/audio";
import { filmKeys } from "@/lib/film-keys";

/**
 * ACT 00 — Cold open. Pinned for three screens while the film plays the dead feed breaking apart,
 * the camera powering on and the first video starting.
 */
export function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const lines = gsap.utils.toArray<HTMLElement>("[data-line]", el);
      const thesis = el.querySelector("[data-thesis]");
      const cue = el.querySelector("[data-cue]");

      // Line one arrives once the slate lifts.
      const first = SplitText.create(lines[0], { type: "chars", mask: "chars" });
      gsap.set(first.chars, { yPercent: 110 });
      const intro = () =>
        gsap.to(first.chars, { yPercent: 0, duration: 1.1, ease: "expo.out", stagger: 0.035, delay: 0.15 });
      window.addEventListener("intro:done", intro, { once: true });
      // Safety: never leave the opening line hidden.
      const fallback = setTimeout(intro, 3200);

      gsap.set(lines.slice(1), { autoAlpha: 0 });
      gsap.set(thesis, { autoAlpha: 0, y: 40 });

      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "+=300%",
          pin: true,
          scrub: 0.8,
          onUpdate: (self) => {
            // a dry click each time a new line lands
            const p = self.progress;
            const step = p > 0.5 ? 2 : p > 0.27 ? 1 : 0;
            if (step !== (el as HTMLElement & { _step?: number })._step) {
              (el as HTMLElement & { _step?: number })._step = step;
              if (step > 0) playClick(0.6);
            }
          },
        },
      });
      tl.to(cue, { autoAlpha: 0, y: 20, duration: 0.05 }, 0.02)
        .to(lines[0], { yPercent: -40, autoAlpha: 0, filter: "blur(14px)", duration: 0.07 }, 0.2)
        .fromTo(lines[1], { autoAlpha: 0, yPercent: 40, filter: "blur(14px)" }, { autoAlpha: 1, yPercent: 0, filter: "blur(0px)", duration: 0.07 }, 0.27)
        .to(lines[1], { yPercent: -40, autoAlpha: 0, filter: "blur(14px)", duration: 0.06 }, 0.44)
        .fromTo(lines[2], { autoAlpha: 0, scale: 1.25, filter: "blur(18px)" }, { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 0.08 }, 0.5)
        .to(lines[2], { autoAlpha: 0, scale: 0.85, filter: "blur(10px)", duration: 0.07 }, 0.64)
        .to(thesis, { autoAlpha: 1, y: 0, duration: 0.1 }, 0.7)
        .to({}, { duration: 0.2 });

      // film beats inside the pin: feed breaks as "The system." lands, camera powers on under the thesis
      const st = tl.scrollTrigger!;
      const off = filmKeys.register("hero", () => [
        { y: st.start + (st.end - st.start) * 0.5, t: 0.12 },
        { y: st.start + (st.end - st.start) * 0.72, t: 0.2 },
        { y: st.end, t: 0.29 },
      ]);

      return () => {
        off();
        clearTimeout(fallback);
        window.removeEventListener("intro:done", intro);
      };
    },
    { scope: root },
  );

  return (
    <section ref={root} id="top" className="relative z-10 h-[100svh] overflow-hidden">
      <div className="gutter absolute inset-x-0 top-[calc(env(safe-area-inset-top,0px)+5.5rem)] flex items-start justify-between">
        <div className="t-slate flex gap-4">
          {hero.slate.map((s, i) => (
            <span key={s}>
              {i > 0 && <span className="mr-4 opacity-40">/</span>}
              {s}
            </span>
          ))}
        </div>
        <span className="t-slate hidden md:block">Ext. Instagram — Night</span>
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        {hero.lines.map((l, i) => (
          <h1
            key={l}
            data-line
            aria-hidden={i > 0}
            className={`t-mega gutter absolute text-center balance ${i === 2 ? "buzz-text buzz-glow" : ""}`}
            style={i === 2 ? { textShadow: "0 0 60px rgba(249,254,2,.35)" } : undefined}
          >
            {l}
          </h1>
        ))}
      </div>

      <div data-thesis className="gutter absolute inset-x-0 top-[15%] md:top-[24%]">
        <p className="t-label mb-5 text-buzz">{hero.lines[2]}</p>
        <p className="t-big max-w-[16ch] md:max-w-[22ch]">{hero.thesis[0]}</p>
        <p className="t-serif buzz-text mt-2 max-w-[13ch] text-[clamp(2.2rem,5.2vw,5.4rem)] leading-[1.02]">{hero.thesis[1]}</p>
      </div>

      <div data-cue className="gutter absolute inset-x-0 bottom-8 flex items-end justify-between">
        <span className="t-slate">{hero.scrollCue}</span>
        <span className="relative block h-14 w-px overflow-hidden bg-bone/15" aria-hidden>
          <span className="absolute inset-x-0 top-0 h-1/2 animate-[cue_1.8s_cubic-bezier(.77,0,.18,1)_infinite] bg-buzz" />
        </span>
      </div>
      <style>{`@keyframes cue { 0% { transform: translateY(-100%) } 100% { transform: translateY(200%) } }`}</style>
    </section>
  );
}
