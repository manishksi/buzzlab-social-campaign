"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";
import { measure as M } from "@/content/strategy";
import { Reveal } from "@/components/ui/Reveal";
import { Counter } from "@/components/ui/Counter";

/** A live-looking signal trace. Decorative: it has no values and is labelled as illustrative. */
function Trace({ seed, active }: { seed: number; active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const visible = useRef(false);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const g = c.getContext("2d")!;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => (visible.current = e.isIntersecting));
    io.observe(c);
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!visible.current) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = c.clientWidth;
      const h = c.clientHeight;
      if (c.width !== Math.round(w * dpr)) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(h * dpr);
      }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, w, h);
      // recessive baseline
      g.strokeStyle = "rgba(239,232,222,0.1)";
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(0, h - 1);
      g.lineTo(w, h - 1);
      g.stroke();
      const t = now / 1000;
      const pts: [number, number][] = [];
      for (let x = 0; x <= w; x += 3) {
        const u = x / w;
        const y = 0.55 + 0.18 * Math.sin(u * 9 + seed + t * 0.9) + 0.08 * Math.sin(u * 23 + seed * 3 - t * 1.7);
        pts.push([x, h * (1 - y * 0.85)]);
      }
      const grad = g.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, active ? "rgba(239,106,42,0.28)" : "rgba(239,232,222,0.12)");
      grad.addColorStop(1, "rgba(239,106,42,0)");
      g.beginPath();
      g.moveTo(0, h);
      pts.forEach(([x, y]) => g.lineTo(x, y));
      g.lineTo(w, h);
      g.closePath();
      g.fillStyle = grad;
      g.fill();
      g.beginPath();
      pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.strokeStyle = active ? "#ef6a2a" : "rgba(239,232,222,0.55)";
      g.lineWidth = 2;
      g.lineJoin = "round";
      g.stroke();
      const [ex, ey] = pts[pts.length - 1];
      g.fillStyle = active ? "#ffd6a0" : "#efe8de";
      g.beginPath();
      g.arc(ex - 2, ey, 3.5, 0, Math.PI * 2);
      g.fill();
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [seed, active]);
  return <canvas ref={ref} className="block h-16 w-full" aria-hidden />;
}

/** ACT 11 — what we watch, grouped by the question each signal answers, and the loop that uses them. */
export function Measure() {
  const root = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);
  const [inView, setInView] = useState(false);

  useGSAP(
    () => {
      ScrollTrigger.create({ trigger: root.current, start: "top 70%", end: "bottom 30%", onToggle: (s) => setInView(s.isActive) });
    },
    { scope: root },
  );

  // the loop advances on its own while the section is on screen
  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => setStep((s) => (s + 1) % M.loop.length), 2200);
    return () => clearInterval(id);
  }, [inView]);

  // which group lights up at each loop step (post → measure all → learn: hold → improve: stop → post again)
  const focusGroup = [-1, 99, 1, 0, -1][step];

  return (
    <section ref={root} id="measure" data-dim="0.4" className="relative z-10 py-[18vh]">
      <div className="gutter mx-auto max-w-[1600px]">
        <p className="t-slate mb-6">{M.eyebrow}</p>
        <Reveal as="h2" by="chars" className="t-huge max-w-[14ch]">
          {M.title}
        </Reveal>
        <Reveal as="p" className="t-lede mt-6">
          {M.sub}
        </Reveal>

        {/* the loop */}
        <ol className="mt-14 flex flex-wrap items-center gap-x-4 gap-y-3 border-y hairline py-6" aria-label="Feedback loop">
          {M.loop.map((l, i) => (
            <li key={l} className="flex items-center gap-4">
              <button
                type="button"
                data-cursor={l}
                onClick={() => setStep(i)}
                className={`font-display text-[clamp(1.6rem,3.4vw,3.4rem)] font-extrabold uppercase leading-none transition-colors duration-500 ${step === i ? "text-ember" : "text-bone/35 hover:text-bone/70"}`}
                aria-current={step === i ? "step" : undefined}
              >
                {l}
              </button>
              {i < M.loop.length - 1 && <span className="t-big text-bone/25" aria-hidden>→</span>}
            </li>
          ))}
          <li className="t-slate ml-auto hidden md:block">↺ weekly</li>
        </ol>

        {/* the dashboard */}
        <div className="mt-10 grid gap-px overflow-hidden border hairline bg-line/70 md:grid-cols-2 xl:grid-cols-4">
          {M.groups.map((g, gi) => {
            const on = focusGroup === 99 || focusGroup === gi;
            return (
              <div key={g.name} className={`flex flex-col gap-6 p-5 transition-colors duration-700 md:p-6 ${on ? "bg-[#1b130e]" : "bg-ink"}`}>
                <div className="flex items-baseline justify-between">
                  <span className={`font-display text-[2.4rem] font-extrabold uppercase leading-none ${on ? "text-ember" : ""}`}>{g.name}</span>
                  <span className="t-slate">0{gi + 1}</span>
                </div>
                <p className="font-serif text-[1.15rem] italic text-bone/80">{g.question}</p>
                {g.metrics.map((m, mi) => (
                  <div key={m.name} className="border-t hairline pt-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="t-label">{m.name}</span>
                      <span className="t-slate">{on ? "Reading" : "Tracked"}</span>
                    </div>
                    <Trace seed={gi * 3 + mi * 1.7} active={on} />
                    <p className="mt-2 text-[0.92rem] text-ash">{m.asks}</p>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        <p className="t-slate mt-3">{M.sparkNote}</p>

        <div className="mt-16 grid grid-cols-2 gap-px overflow-hidden border hairline bg-line/70 md:grid-cols-4">
          {M.cadence.map((c) => (
            <div key={c.label} className="bg-ink p-5 md:p-6">
              <span className="font-display text-[clamp(3rem,6vw,5.5rem)] font-extrabold leading-none">
                <Counter display={String(c.value)} suffix={c.suffix ?? ""} />
              </span>
              <p className="t-label mt-3 text-ash">{c.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
