"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { finale as F } from "@/content/strategy";
import { FlameMark } from "@/components/ui/FlameMark";
import { playClick, playIgnite } from "@/lib/audio";
import { scrollToId, useLenis } from "@/components/chrome/SmoothScroll";

/** ACT 12 — fade to black. Click. Nothing. Click. Nothing. Click. Fire. */
export function Finale() {
  const root = useRef<HTMLElement>(null);
  const lenis = useLenis();

  useGSAP(
    () => {
      const el = root.current!;
      const clicks = gsap.utils.toArray<HTMLElement>("[data-click]", el);
      const lines = gsap.utils.toArray<HTMLElement>("[data-line]", el);
      gsap.set([...clicks, ...lines, "[data-flame]", "[data-ignite]", "[data-final]", "[data-credits]"], { autoAlpha: 0 });

      let fired = -1;
      const cues = [0.1, 0.26, 0.42];
      const tl = gsap.timeline({
        defaults: { ease: "power2.out" },
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "+=480%",
          pin: true,
          scrub: 0.6,
          onUpdate: (self) => {
            const idx = cues.filter((c) => self.progress >= c).length - 1;
            if (idx > fired && self.direction > 0) {
              if (idx === 2) playIgnite();
              else playClick(1);
            }
            fired = idx;
          },
        },
      });
      tl.to("[data-black]", { autoAlpha: 1, duration: 0.06 }, 0);
      // click · nothing · click · nothing · click
      const at = [0.1, 0.18, 0.26, 0.34, 0.42];
      clicks.forEach((c, i) => {
        tl.fromTo(c, { autoAlpha: 0, scale: i % 2 ? 1 : 1.25 }, { autoAlpha: 1, scale: 1, duration: 0.025 }, at[i]);
        if (i < clicks.length - 1) tl.to(c, { autoAlpha: 0, duration: 0.02 }, at[i] + 0.06);
        if (i % 2 === 0) tl.fromTo("[data-spark]", { autoAlpha: 0.9, scale: 0.2 }, { autoAlpha: 0, scale: 1.4, duration: 0.03 }, at[i]);
      });
      tl.to(clicks[clicks.length - 1], { autoAlpha: 0, y: -40, duration: 0.03 }, 0.47)
        .fromTo("[data-flame]", { autoAlpha: 0, scale: 0.2, yPercent: 20 }, { autoAlpha: 1, scale: 1, yPercent: 0, duration: 0.06, ease: "back.out(2)" }, 0.44)
        .fromTo("[data-ignite]", { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.04 }, 0.5)
        .to("[data-flame]", { scale: 0.42, yPercent: -95, duration: 0.06 }, 0.58)
        .to("[data-ignite]", { autoAlpha: 0, y: -30, duration: 0.03 }, 0.58);
      lines.forEach((l, i) => {
        tl.fromTo(l, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.025 }, 0.61 + i * 0.045);
      });
      tl.to(lines, { autoAlpha: 0, y: -20, duration: 0.03, stagger: 0.005 }, 0.86)
        .fromTo("[data-final]", { autoAlpha: 0, scale: 1.08 }, { autoAlpha: 1, scale: 1, duration: 0.06 }, 0.88)
        .fromTo("[data-credits]", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.03 }, 0.95);
    },
    { scope: root },
  );

  return (
    <section ref={root} id="road-ahead" className="relative z-10 h-[100svh] overflow-hidden">
      <div data-black className="absolute inset-0 bg-ink opacity-0" />
      <div data-spark aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-[40vmin] w-[40vmin] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0" style={{ background: "radial-gradient(circle, rgba(255,236,210,.9), rgba(245,165,74,.35) 25%, transparent 60%)" }} />

      <div className="absolute inset-0 flex items-center justify-center">
        {F.clicks.map((c, i) => (
          <p key={i} data-click className={`absolute text-center ${i % 2 ? "t-serif text-[clamp(2rem,4vw,4rem)] text-bone/40" : "t-mega"}`}>
            {c}
          </p>
        ))}
        <div data-flame className="absolute w-[min(34vw,260px)]">
          <FlameMark className="w-full" />
        </div>
        <p data-ignite className="t-huge gutter absolute top-[62%] text-center balance">
          {F.ignite}
        </p>
        <div className="gutter absolute top-[34%] flex flex-col items-center gap-2 text-center">
          {F.lines.map((l, i) => (
            <p key={l} data-line className={i === F.lines.length - 1 ? "t-serif text-[clamp(2.2rem,5.4vw,5.6rem)] leading-none text-amber" : "t-big"}>
              {l}
            </p>
          ))}
        </div>
        <div data-final className="gutter absolute text-center">
          <p className="t-big text-bone/70">{F.final[0]}</p>
          <p className="t-mega mt-2 text-ember" style={{ textShadow: "0 0 90px rgba(239,106,42,.5)" }}>
            {F.final[1]}
          </p>
        </div>
      </div>

      <div data-credits className="gutter absolute inset-x-0 bottom-8 flex flex-wrap items-end justify-between gap-4">
        <span className="t-slate">{F.credits}</span>
        <button type="button" data-cursor="Replay" onClick={() => scrollToId(lenis, "top")} className="t-label border border-bone/25 px-4 py-2 hover:border-ember hover:text-ember">
          ↺ Watch again
        </button>
      </div>
    </section>
  );
}
