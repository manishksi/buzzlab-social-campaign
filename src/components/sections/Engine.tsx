"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { engine as E } from "@/content/strategy";
import { Reveal } from "@/components/ui/Reveal";

/** ACT 03 — the three layers, then the loop they make together. */
export function Engine() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      gsap.utils.toArray<HTMLElement>("[data-layer]").forEach((row) => {
        const fill = row.querySelector("[data-fill]");
        gsap.fromTo(fill, { backgroundPositionX: "100%" }, { backgroundPositionX: "0%", ease: "none", scrollTrigger: { trigger: row, start: "top 80%", end: "top 35%", scrub: true } });
        gsap.from(row.querySelectorAll("[data-ex]"), { autoAlpha: 0, y: 14, stagger: 0.04, duration: 0.6, ease: "power3.out", scrollTrigger: { trigger: row, start: "top 70%", once: true } });
      });
      // the flywheel: arrows flow, nodes light in order
      const loop = gsap.timeline({ scrollTrigger: { trigger: "[data-loop]", start: "top 75%", end: "bottom 60%", scrub: true } });
      loop.fromTo("[data-loop-path]", { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: "none", duration: 1 }, 0);
      gsap.utils.toArray<HTMLElement>("[data-loop-node]").forEach((n, i) => {
        loop.fromTo(n, { autoAlpha: 0.15, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 0.15 }, 0.1 + i * 0.22);
      });
    },
    { scope: root },
  );

  const nodes = [
    { x: 50, y: 6 },
    { x: 94, y: 50 },
    { x: 50, y: 94 },
    { x: 6, y: 50 },
  ];

  return (
    <section ref={root} id="engine" className="relative z-10 py-[18vh]">
      <div className="gutter mx-auto max-w-[1600px]">
        <p className="t-slate mb-6">{E.eyebrow}</p>
        <Reveal as="h2" by="chars" className="t-huge">
          {E.title}
        </Reveal>
        <Reveal as="p" className="t-lede mt-6">
          {E.sub}
        </Reveal>

        <div className="mt-16 border-t hairline">
          {E.layers.map((l) => (
            <article data-layer key={l.n} className="grid gap-6 border-b hairline py-10 md:grid-cols-12 md:items-end md:gap-8 md:py-14">
              <div className="md:col-span-7">
                <span className="t-slate">{l.n} — layer</span>
                <h3
                  data-fill
                  className="font-display text-[clamp(4rem,14vw,13rem)] font-extrabold uppercase leading-[0.82]"
                  style={{
                    backgroundImage: "linear-gradient(90deg, var(--color-buzz) 0 50%, var(--color-bone) 50% 100%)",
                    backgroundSize: "200% 100%",
                    backgroundPositionX: "100%",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  {l.name}
                </h3>
              </div>
              <div className="md:col-span-5 md:pb-4">
                <p className="font-display text-[clamp(1.4rem,2vw,2rem)] font-bold uppercase leading-tight">{l.job}</p>
                <ul className="mt-5 flex flex-wrap gap-x-1 gap-y-2">
                  {l.examples.map((x, i) => (
                    <li data-ex key={x} className="group t-label cursor-default text-ash">
                      <span className="transition-colors duration-300 group-hover:text-buzz">{x}</span>
                      {i < l.examples.length - 1 && <span className="mx-2 text-bone/20">/</span>}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>

        <div data-loop className="mt-[16vh] grid items-center gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="t-slate mb-4">The flywheel</p>
            <ol className="t-big">
              {E.loop.map((x, i) => (
                <li key={x} className={i === E.loop.length - 1 ? "text-buzz" : ""}>
                  {i > 0 && <span className="mr-3 text-bone/30" aria-hidden>↓</span>}
                  {x}
                </li>
              ))}
            </ol>
            <p className="t-lede mt-6">{E.loopNote}</p>
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-[560px] md:col-span-7">
            <div className="absolute inset-x-[14%] inset-y-[8%] md:inset-0">
            <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                  <path d="M0 0 L10 5 L0 10 z" fill="#f9fe02" />
                </marker>
              </defs>
              <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(239,232,222,.08)" strokeWidth="0.3" />
              <circle data-loop-path cx="50" cy="50" r="44" fill="none" stroke="#f9fe02" strokeWidth="0.45" pathLength={1} strokeDasharray="1" transform="rotate(-90 50 50)" />
              {[45, 135, 225, 315].map((a) => {
                const r = (a - 90) * (Math.PI / 180);
                const x = 50 + Math.cos(r) * 44;
                const y = 50 + Math.sin(r) * 44;
                const tx = x + Math.cos(r + Math.PI / 2) * 2;
                const ty = y + Math.sin(r + Math.PI / 2) * 2;
                return <line key={a} x1={x} y1={y} x2={tx} y2={ty} stroke="#f9fe02" strokeWidth="0.45" markerEnd="url(#arrow)" />;
              })}
            </svg>
            {E.loop.map((name, i) => (
              <div
                data-loop-node
                key={name}
                className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center bg-ink px-3 py-1 text-center"
                style={{ left: `${nodes[i].x}%`, top: `${nodes[i].y}%` }}
              >
                <span className="t-slate">0{i + 1}</span>
                <span className={`font-display text-[clamp(1.3rem,2.6vw,2.4rem)] font-extrabold uppercase leading-none ${i === 3 ? "text-buzz" : ""}`}>{name}</span>
              </div>
            ))}
            <div className="absolute inset-[30%] flex items-center justify-center text-center">
              <span className="t-serif text-[clamp(1.2rem,2vw,1.8rem)] leading-tight text-bone/80">feeds itself</span>
            </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
