"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { landy as L, whereWeAre } from "@/content/strategy";

/** Pieces of the presentation that get eaten: words, marks, UI, content. */
const WORDS = [
  "The page is dead.",
  "Where we are",
  "Noticing.",
  "Spark",
  "Flame",
  "Light",
  "Content",
  "Formats",
  "IP",
  "Attention",
  "Identity",
  "Community",
  "01 Idea",
  "04 Shoot",
  "05 Edit",
  "07 Post",
  "Month 01–02",
  "Act 04 — The plan",
  "Original BuzzLab IP",
  "It's a media engine.",
  "Now it's noticing you.",
  "REC ●",
  "Index",
  "Sound off",
];
const MARKS = ["dot", "play", "reel", "grid", "clip", "clip", "dot", "shot", "cursor", "dot", "reel", "play"] as const;

type Frag = { el: HTMLElement; x: number; y: number; r: number; start: number; spin: number };

/** Landy's face as a function of how far the jaw has dropped (0 → 1). */
function headPath(j: number) {
  const c = 610 + j * 300;
  return `M 300 110 C 424 110 502 194 502 334 C 502 ${470 + j * 140} ${476 + j * 6} ${c - 50} ${404 - j * 6} ${c} C ${362} ${c + 28} ${238} ${c + 28} ${196 + j * 6} ${c} C ${124 - j * 6} ${c - 50} 98 ${470 + j * 140} 98 334 C 98 194 176 110 300 110 Z`;
}

/**
 * The last character, and the last joke. Landy appears in the dark and stares. As you scroll,
 * Landy very slowly opens wide — and the presentation is pulled in: words, yellow marks, UI,
 * the top bar itself. One enormous gulp. Landy shrinks to a yellow dot; the dot goes out.
 * Black. Then, without a reload or a flash, the film starts again: THE PAGE IS DEAD.
 */
export function Landy() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const svg = el.querySelector<SVGSVGElement>("[data-landy]")!;
      const head = svg.querySelector<SVGPathElement>("[data-head]")!;
      const mouth = svg.querySelector<SVGEllipseElement>("[data-mouth]")!;
      const lip = svg.querySelector<SVGPathElement>("[data-lip]")!;
      const face = svg.querySelector<SVGGElement>("[data-face]")!;
      const eyes = Array.from(svg.querySelectorAll<SVGEllipseElement>("[data-eye]"));
      const body = el.querySelector<HTMLElement>("[data-body]")!;
      const dot = el.querySelector<HTMLElement>("[data-last-dot]")!;
      const caption = el.querySelector<HTMLElement>("[data-caption]")!;
      const frags: Frag[] = Array.from(el.querySelectorAll<HTMLElement>("[data-frag]")).map((f, i) => {
        // scattered round the screen, some already beyond its edges
        const a = (i / 36) * Math.PI * 2 + (i % 3) * 0.4;
        const r = 0.36 + ((i * 37) % 23) / 23 * 0.42;
        return { el: f, x: Math.cos(a) * r, y: Math.sin(a) * r * 0.9, r, start: 0.3 + (1 - r) * 0.18 + ((i * 13) % 7) * 0.012, spin: (i % 2 ? 1 : -1) * (0.6 + (i % 5) * 0.2) };
      });
      const header = document.querySelector<HTMLElement>("header");
      let looping = false;

      const apply = (p: number) => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        // appear, stare, open very slowly, gulp, shrink to a dot, black
        const appear = gsap.utils.clamp(0, 1, (p - 0.02) / 0.1);
        const open = Math.pow(gsap.utils.clamp(0, 1, (p - 0.26) / 0.5), 1.6);
        const close = gsap.utils.clamp(0, 1, (p - 0.79) / 0.03);
        const jaw = open * (1 - close);
        const gulp = gsap.utils.clamp(0, 1, (p - 0.81) / 0.06);
        const shrink = gsap.utils.clamp(0, 1, (p - 0.88) / 0.05);
        const out = gsap.utils.clamp(0, 1, (p - 0.935) / 0.02);
        head.setAttribute("d", headPath(jaw));
        mouth.setAttribute("cy", String(468 + jaw * 150));
        mouth.setAttribute("rx", String(Math.max(0.1, 4 + jaw * 158)));
        mouth.setAttribute("ry", String(Math.max(0.1, 1 + jaw * 176)));
        lip.style.opacity = String(1 - Math.min(1, jaw * 6));
        // the gulp: squash, stretch, settle; eyes squeeze shut on the swallow
        const sq = Math.sin(gulp * Math.PI) * (1 - gulp * 0.4);
        face.setAttribute("transform", `translate(300 520) scale(${1 + sq * 0.1} ${1 - sq * 0.14}) translate(-300 -520)`);
        eyes.forEach((e) => e.setAttribute("ry", String(Math.max(0.6, 12 * (1 - Math.sin(gulp * Math.PI) * 0.9)))));
        const s = (0.9 + appear * 0.1) * (1 - shrink);
        body.style.opacity = String(appear * (shrink < 1 ? 1 : 0));
        body.style.filter = appear < 1 ? `blur(${(1 - appear) * 16}px)` : "none";
        body.style.transform = `scale(${Math.max(0.0001, s)})`;
        dot.style.opacity = String(shrink > 0.85 ? 1 - out : 0);
        caption.style.opacity = String(gsap.utils.clamp(0, 1, (p - 0.12) / 0.04) * (1 - gsap.utils.clamp(0, 1, (p - 0.24) / 0.04)));

        // where the mouth is on screen right now
        const m = mouth.getBoundingClientRect();
        const mx = m.left + m.width / 2;
        const my = m.top + m.height / 2;
        frags.forEach((f) => {
          const u = gsap.utils.clamp(0, 1, (p - f.start) / 0.2);
          const k = u * u * u;
          const sx = vw / 2 + f.x * vw * 0.62;
          const sy = vh / 2 + f.y * vh * 0.62;
          const ang = k * f.spin * 2.2;
          const dx = (sx - mx) * (1 - k);
          const dy = (sy - my) * (1 - k);
          const x = mx + dx * Math.cos(ang) - dy * Math.sin(ang);
          const y = my + dx * Math.sin(ang) + dy * Math.cos(ang);
          const vis = gsap.utils.clamp(0, 1, (p - 0.18) / 0.08);
          f.el.style.opacity = String(vis * (u >= 1 ? 0 : 1) * (0.55 + 0.45 * Math.min(1, u * 4)));
          f.el.style.transform = `translate(${(x - f.el.offsetWidth / 2).toFixed(1)}px, ${(y - f.el.offsetHeight / 2).toFixed(1)}px) rotate(${(k * f.spin * 300).toFixed(1)}deg) scale(${(1 - k * 0.94).toFixed(3)})`;
        });
        // the interface goes in too
        const ui = Math.pow(gsap.utils.clamp(0, 1, (p - 0.55) / 0.22), 2.2);
        if (header) {
          if (ui <= 0) {
            header.style.transform = "";
            header.style.opacity = "";
          } else {
            const tx = (mx - vw / 2) * ui;
            const ty = (my - header.offsetHeight / 2) * ui;
            header.style.transformOrigin = "50% 50%";
            header.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) rotate(${(ui * 40).toFixed(1)}deg) scale(${(1 - ui * 0.95).toFixed(3)})`;
            header.style.opacity = String(1 - Math.max(0, ui - 0.85) / 0.15);
          }
        }
        document.documentElement.classList.toggle("is-swallowed", p > 0.86);
      };

      // black, hold — then back to the top as if nothing happened
      const loop = () => {
        looping = true;
        const veil = document.getElementById("loop-veil");
        const lenis = (window as unknown as { __buzzlab?: { lenis: { stop(): void; start(): void; scrollTo(y: number, o: object): void } } }).__buzzlab?.lenis;
        if (veil) veil.style.opacity = "1";
        lenis?.stop();
        window.setTimeout(() => {
          if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
          else window.scrollTo(0, 0);
          ScrollTrigger.update();
          // finish any scrub catch-up at once so nothing visibly rewinds
          ScrollTrigger.getAll().forEach((t) => {
            const tw = t.getTween?.() as unknown as { progress?: (v: number) => void } | undefined;
            if (tw && typeof tw.progress === "function") tw.progress(1);
          });
          window.dispatchEvent(new Event("film:snap"));
          apply(0);
          window.setTimeout(() => {
            lenis?.start();
            if (veil) gsap.to(veil, { opacity: 0, duration: 1.6, ease: "power2.inOut", onComplete: () => void (looping = false) });
            else looping = false;
          }, 700);
        }, 500);
      };

      const st = ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "+=520%",
        pin: true,
        onUpdate: (self) => {
          apply(self.progress);
          if (self.progress > 0.992 && self.direction > 0 && !looping) loop();
        },
        onLeaveBack: () => apply(0),
      });
      apply(0);
      return () => {
        st.kill();
        if (header) header.style.transform = header.style.opacity = "";
        document.documentElement.classList.remove("is-swallowed");
      };
    },
    { scope: root },
  );

  return (
    <section ref={root} id="landy" className="relative z-10 h-[100svh] overflow-hidden bg-ink" aria-label="Landy">
      {/* everything Landy is about to eat */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {WORDS.map((w, i) => (
          <span
            key={w}
            data-frag
            className={`absolute left-0 top-0 whitespace-nowrap ${i % 4 === 0 ? "font-display text-[clamp(1.6rem,3vw,3rem)] font-extrabold uppercase" : i % 4 === 1 ? "t-slate text-bone" : i % 4 === 2 ? "font-display text-[clamp(1.1rem,2vw,2rem)] font-bold uppercase text-buzz" : "t-serif text-[clamp(1rem,1.6vw,1.5rem)] text-bone/80"}`}
            style={{ opacity: 0 }}
          >
            {w}
          </span>
        ))}
        {MARKS.map((m, i) => (
          <span key={i} data-frag className="absolute left-0 top-0" style={{ opacity: 0 }}>
            {m === "dot" && <span className="block h-4 w-4 rounded-full bg-buzz" />}
            {m === "play" && (
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-buzz">
                <span className="ml-1 block h-0 w-0 border-y-[9px] border-l-[14px] border-y-transparent border-l-ink" />
              </span>
            )}
            {m === "reel" && <span className="block h-20 w-11 border border-bone/70 bg-char"><span className="mt-[70px] block h-[3px] w-1/2 bg-buzz" /></span>}
            {m === "grid" && (
              <span className="grid grid-cols-3 gap-[2px]">
                {Array.from({ length: 9 }).map((_, k) => (
                  <span key={k} className={`block h-3.5 w-3.5 ${k === 4 ? "bg-buzz" : "bg-bone/40"}`} />
                ))}
              </span>
            )}
            {m === "clip" && <span className={`block h-3 ${i % 2 ? "w-28 bg-bone/80" : "w-16 bg-buzz"}`} />}
            {m === "shot" && (
              // a fragment of the page itself (static export, so a plain img)
              <img src={whereWeAre.profile.src} alt="" width={56} height={121} className="block h-[121px] w-[56px] rounded-md border border-bone/20 object-cover" />
            )}
            {m === "cursor" && (
              <svg width="26" height="36" viewBox="0 0 26 36" className="block">
                <path d="M2 2 L2 30 L9 23 L14 34 L19 32 L14 21 L24 21 Z" fill="#eeebe3" stroke="#000" strokeWidth="2" />
              </svg>
            )}
          </span>
        ))}
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <div data-body className="relative w-[min(78vw,520px)] origin-center md:h-[min(86svh,860px)] md:w-auto" style={{ opacity: 0 }}>
          <svg data-landy viewBox="0 0 600 960" className="block h-auto w-full overflow-visible md:h-full md:w-auto" role="img" aria-label="Landy, a character with yellow glasses">
            <defs>
              <radialGradient id="l-skin" cx="0.42" cy="0.3" r="0.8">
                <stop offset="0" stopColor="#fbf9f3" />
                <stop offset="0.55" stopColor="#ece8de" />
                <stop offset="1" stopColor="#bdb8ad" />
              </radialGradient>
              <radialGradient id="l-void" cx="0.5" cy="0.35" r="0.7">
                <stop offset="0" stopColor="#000" />
                <stop offset="0.8" stopColor="#050505" />
                <stop offset="1" stopColor="#1a1a1a" />
              </radialGradient>
            </defs>
            <g data-face>
              {/* ears */}
              <ellipse cx="96" cy="350" rx="30" ry="44" fill="#e2ded3" />
              <ellipse cx="504" cy="350" rx="30" ry="44" fill="#e2ded3" />
              <ellipse cx="96" cy="352" rx="14" ry="24" fill="#cfcabe" />
              <ellipse cx="504" cy="352" rx="14" ry="24" fill="#cfcabe" />
              {/* the head (its jaw drops as the mouth opens) */}
              <path data-head d={headPath(0)} fill="url(#l-skin)" />
              {/* three hairs, no more */}
              <path d="M 292 114 Q 280 82 262 74 M 302 112 Q 304 72 318 58 M 312 114 Q 328 90 350 88" fill="none" stroke="#0d0d0d" strokeWidth="7" strokeLinecap="round" />
              {/* soft shading under the glasses */}
              <ellipse cx="300" cy="388" rx="170" ry="34" fill="#000" opacity="0.06" />
              {/* eyes, deadpan, a little uneven */}
              <ellipse data-eye cx="230" cy="332" rx="12" ry="12" fill="#0a0a0a" />
              <ellipse data-eye cx="366" cy="326" rx="12" ry="12" fill="#0a0a0a" />
              <circle cx="235" cy="327" r="3.4" fill="#fff" />
              <circle cx="371" cy="321" r="3.4" fill="#fff" />
              {/* the glasses */}
              <g fill="rgba(255,255,255,0.07)" stroke="#f9fe02" strokeWidth="17">
                <circle cx="226" cy="326" r="74" />
                <circle cx="372" cy="326" r="74" />
              </g>
              <path d="M 290 318 Q 299 306 308 318" fill="none" stroke="#f9fe02" strokeWidth="12" strokeLinecap="round" />
              <path d="M 152 316 L 104 302 M 446 316 L 494 302" stroke="#d6d200" strokeWidth="10" strokeLinecap="round" />
              <path d="M 178 286 L 206 262 M 326 286 L 352 262" stroke="#fff" strokeWidth="7" strokeLinecap="round" opacity="0.55" />
              {/* a nose, barely */}
              <ellipse cx="300" cy="410" rx="12" ry="7" fill="#d4cfc3" />
              {/* the mouth: a line, then a void */}
              <ellipse data-mouth cx="300" cy="468" rx="4" ry="1" fill="url(#l-void)" />
              <path data-lip d="M 268 468 Q 300 474 332 468" fill="none" stroke="#0d0d0d" strokeWidth="6" strokeLinecap="round" />
            </g>
          </svg>
          <p data-caption className="t-slate absolute inset-x-0 -bottom-2 text-center" style={{ opacity: 0 }}>
            This is {L.name}.
          </p>
        </div>
        {/* what's left after the gulp: one yellow dot, then nothing */}
        <span data-last-dot aria-hidden className="absolute h-3 w-3 rounded-full bg-buzz" style={{ opacity: 0 }} />
      </div>
    </section>
  );
}
