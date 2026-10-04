"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { tanishka as N, whereWeAre } from "@/content/strategy";
import { worldClock } from "@/lib/world-clock";
import { TAN, tanishkaMouth } from "@/components/machine/tanishka-time";

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
  "Post again",
  "Director",
  "REC ●",
  "Index",
  "Sound off",
];
const MARKS = ["dot", "play", "reel", "grid", "clip", "clip", "dot", "shot", "cursor", "dot", "reel", "play"] as const;

type Frag = { el: HTMLElement; x: number; y: number; start: number; spin: number };

/**
 * The last character, and the last joke (machine/tanishka.ts). Tanishka appears in the dark and
 * looks at you. As you scroll she very slowly opens her mouth — her cigarette falls out — and the
 * presentation is pulled in: words, yellow marks, UI, the top bar itself, and in 3D every object
 * the film was made of. The camera goes in after them. Black. Then, with no reload, no flash and
 * no cut, the page is back at its first frame: THE PAGE IS DEAD.
 */
export function Tanishka() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const caption = el.querySelector<HTMLElement>("[data-caption]")!;
      const frags: Frag[] = Array.from(el.querySelectorAll<HTMLElement>("[data-frag]")).map((f, i) => {
        const a = (i / 36) * Math.PI * 2 + (i % 3) * 0.4;
        const r = 0.36 + (((i * 37) % 23) / 23) * 0.42;
        return { el: f, x: Math.cos(a) * r, y: Math.sin(a) * r * 0.9, start: TAN.open + 0.06 + (1 - r) * 0.16 + ((i * 13) % 7) * 0.012, spin: (i % 2 ? 1 : -1) * (0.6 + (i % 5) * 0.2) };
      });
      const header = document.querySelector<HTMLElement>("header");
      let looping = false;

      const apply = (p: number) => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        worldClock.tanishka.w = p;
        worldClock.tanishka.fade = 1;
        caption.style.opacity = String(gsap.utils.clamp(0, 1, (p - 0.08) / 0.04) * (1 - gsap.utils.clamp(0, 1, (p - TAN.open + 0.02) / 0.04)));
        // where her mouth is right now (the 3D scene writes it every frame)
        const mx = tanishkaMouth.x > 0 ? tanishkaMouth.x : vw * 0.6;
        const my = tanishkaMouth.y > 0 ? tanishkaMouth.y : vh * 0.5;
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
          const vis = gsap.utils.clamp(0, 1, (p - TAN.open + 0.02) / 0.08);
          f.el.style.opacity = String(vis * (u >= 1 ? 0 : 1) * (0.55 + 0.45 * Math.min(1, u * 4)));
          f.el.style.transform = `translate(${(x - f.el.offsetWidth / 2).toFixed(1)}px, ${(y - f.el.offsetHeight / 2).toFixed(1)}px) rotate(${(k * f.spin * 300).toFixed(1)}deg) scale(${(1 - k * 0.94).toFixed(3)})`;
        });
        // the interface goes in too
        const ui = Math.pow(gsap.utils.clamp(0, 1, (p - 0.52) / 0.22), 2.2);
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
        document.documentElement.classList.toggle("is-swallowed", p > TAN.enter);
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
        end: "+=620%",
        pin: true,
        onUpdate: (self) => {
          apply(self.progress);
          if (self.progress > TAN.loop && self.direction > 0 && !looping) loop();
        },
        onLeaveBack: () => apply(0),
      });
      // keep the DOM glued to the mouth between scroll events too (the mouth moves as she breathes)
      const tick = () => {
        if (st.isActive) apply(st.progress);
      };
      gsap.ticker.add(tick);
      apply(0);
      return () => {
        gsap.ticker.remove(tick);
        st.kill();
        if (header) header.style.transform = header.style.opacity = "";
        document.documentElement.classList.remove("is-swallowed");
      };
    },
    { scope: root },
  );

  return (
    <section ref={root} id="tanishka" className="relative z-10 h-[100svh] overflow-hidden" aria-label={`${N.name} — the real blocker`}>
      {/* everything she's about to eat */}
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

      <div className="gutter mx-auto grid h-full max-w-[1600px] grid-cols-12 gap-x-6">
        <div className="relative col-span-12 md:col-span-6 lg:col-span-5">
          <div data-caption className="studio-beat" style={{ opacity: 0 }}>
            <p className="t-slate mb-4">?? — Not in the deck</p>
            <p className="t-big">The real blocker</p>
          </div>
        </div>
      </div>
    </section>
  );
}
