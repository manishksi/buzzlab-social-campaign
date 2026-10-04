"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { light as F } from "@/content/strategy";
import { filmKeys } from "@/lib/film-keys";
import { playSwell } from "@/lib/audio";

/**
 * PHASE 03 — Light. Pinned for four screens while the cigarette burns down in the film: two
 * questions, the turn, then ORIGINAL BUZZLAB IP as he takes a long pull on it. The words keep to
 * the left of the frame; he holds the right.
 */
export function Light() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const stage = root.current!.querySelector<HTMLElement>("[data-stage]")!;
      const beats = gsap.utils.toArray<HTMLElement>("[data-beat]", stage);
      const orbit = gsap.utils.toArray<HTMLElement>("[data-orbit]", stage);
      gsap.set([...beats, "[data-reveal]", "[data-notlocked]", ...orbit], { autoAlpha: 0 });

      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: stage,
          start: "top top",
          end: "+=420%",
          pin: true,
          scrub: 0.8,
          onEnter: () => playSwell(),
        },
      });
      tl.fromTo("[data-intro]", { autoAlpha: 1 }, { autoAlpha: 0, y: -30, duration: 0.05 }, 0.1)
        .fromTo(beats[0], { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.06 }, 0.13)
        .to(beats[0], { autoAlpha: 0, y: -40, filter: "blur(10px)", duration: 0.05 }, 0.27)
        .fromTo(beats[1], { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.06 }, 0.32)
        .to(beats[1], { autoAlpha: 0, y: -40, filter: "blur(10px)", duration: 0.05 }, 0.44)
        .fromTo(beats[2], { autoAlpha: 0, scale: 1.4, filter: "blur(20px)" }, { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 0.07 }, 0.48)
        .to(beats[2], { autoAlpha: 0, scale: 0.8, duration: 0.05 }, 0.6)
        .fromTo("[data-reveal] [data-r1]", { autoAlpha: 0, yPercent: 60, letterSpacing: "0.4em" }, { autoAlpha: 1, yPercent: 0, letterSpacing: "0.02em", duration: 0.08 }, 0.63)
        .set("[data-reveal]", { autoAlpha: 1 }, 0.63)
        .fromTo("[data-reveal] [data-r2]", { autoAlpha: 0, scale: 0.6, filter: "blur(24px)" }, { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 0.1 }, 0.66)
        .to("[data-reveal]", { y: () => -window.innerHeight * 0.2, scale: 0.62, transformOrigin: () => (window.innerWidth >= 768 ? "0% 50%" : "50% 50%"), duration: 0.08 }, 0.82);
      orbit.forEach((o, i) => tl.fromTo(o, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.03 }, 0.84 + i * 0.01));
      tl.fromTo("[data-notlocked]", { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.04 }, 0.95);

      // keep the film in step with the beats: the long pull on the cigarette lands with the reveal
      const st = tl.scrollTrigger!;
      const off = filmKeys.register("light", () => {
        const a = st.start;
        const span = st.end - st.start;
        return [
          { y: a + span * 0.62, t: 0.862 },
          { y: st.end, t: 0.93 },
        ];
      });
      ScrollTrigger.refresh();
      return () => {
        off();
      };
    },
    { scope: root },
  );

  return (
    <section ref={root} id="light" className="relative z-10">
      <div data-stage className="relative h-[100svh] overflow-hidden">
        <div data-intro className="gutter absolute inset-x-0 top-[calc(env(safe-area-inset-top,0px)+6rem)] flex justify-between">
          <span className="t-slate">Phase {F.n} — {F.name}</span>
          <span className="t-slate text-amber">{F.months}</span>
        </div>

        <div className="absolute inset-0 flex items-center justify-center md:justify-start">
          {F.beats.map((b, i) => (
            <p
              data-beat
              key={b}
              className={`gutter absolute text-center balance md:max-w-[56vw] md:text-left ${i === 2 ? "t-mega ember-text" : "t-big max-w-[18ch]"}`}
              style={i === 2 ? { textShadow: "0 0 60px rgba(239,106,42,.3)" } : undefined}
            >
              {i === 1 ? (
                <>
                  And created something <span className="t-serif text-amber">of our own?</span>
                </>
              ) : (
                b
              )}
            </p>
          ))}
          <h2 data-reveal className="gutter absolute text-center md:max-w-[60vw] md:text-left">
            <span data-r1 className="t-serif block text-[clamp(1.6rem,3vw,3rem)] leading-none text-amber">{F.reveal[0]}</span>
            <span data-r2 className="t-mega mt-3 block md:text-[clamp(3rem,10vw,10.5rem)]" style={{ textShadow: "0 0 70px rgba(239,106,42,.4)" }}>
              {F.reveal[1]}
            </span>
          </h2>
        </div>

        {/* what the IP could be: a loose list, kept clear of him */}
        <ul className="gutter absolute inset-x-0 bottom-20 grid grid-cols-2 gap-x-4 gap-y-1.5 md:bottom-[16%] md:max-w-[58vw] md:gap-x-10 md:gap-y-2.5">
          {F.possibilities.map((p) => (
            <li data-orbit key={p} className="font-serif text-[0.95rem] italic leading-snug text-bone/85 md:text-[clamp(1rem,1.35vw,1.3rem)]">
              {p}
            </li>
          ))}
        </ul>
        <p data-notlocked className="gutter absolute inset-x-0 bottom-10 text-center md:text-left">
          <span className="t-label text-amber">{F.notLocked}</span>
        </p>
      </div>

      <div data-dim="0.25" className="relative bg-gradient-to-b from-transparent via-ink/70 to-ink pb-[18vh] pt-[14vh]">
        <div className="gutter mx-auto grid max-w-[1600px] gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="t-slate">Objective</p>
            <p className="t-big mt-4">{F.objective}</p>
            <p className="t-lede mt-6">
              We don&apos;t lock the IP today. The first six months tell us what the audience wants more of; the IP grows out of that.
            </p>
          </div>
          <ol className="lg:col-span-7 lg:pt-10">
            {F.howWeChoose.map((h, i) => (
              <li key={h.phase} className="grid grid-cols-[7rem_1fr] items-baseline gap-4 border-t hairline py-5">
                <span className={`t-label ${i === 2 ? "text-ember" : "text-ash"}`}>{h.phase}</span>
                <span className="font-display text-[clamp(1.4rem,2.2vw,2.2rem)] font-bold uppercase leading-tight">{h.learn}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="gutter mx-auto mt-[14vh] max-w-[1600px]">
          <p className="t-slate mb-6">The evolution</p>
          <ol className="grid gap-px overflow-hidden border hairline md:grid-cols-3">
            {F.evolution.map((e, i) => (
              <li key={e.word} className="relative bg-ink/80 p-6 md:p-8">
                <span className="t-slate">{e.phase}</span>
                <span className={`mt-2 block font-display text-[clamp(3rem,7vw,7rem)] font-extrabold uppercase leading-[0.85] ${i === 2 ? "text-ember" : i === 1 ? "text-amber" : ""}`}>{e.word}</span>
                {i < 2 && <span aria-hidden className="t-big absolute right-6 top-1/2 hidden -translate-y-1/2 text-bone/25 md:block">→</span>}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
