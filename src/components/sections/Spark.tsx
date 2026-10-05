"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ScrollTrigger, gsap, useGSAP } from "@/lib/gsap";
import { spark as S } from "@/content/strategy";
import { slots } from "@/content/media";
import { PhaseHeader } from "./PhaseHeader";

const WEEKS = 8;
const weekOf = (w: string) => Number(w.replace(/\D/g, ""));

/**
 * One Phase 01 video, full screen. When the clip's shape matches the screen it fills it edge to
 * edge; when it doesn't (a vertical clip on a wide screen, a wide clip on a phone) it plays at full
 * height (or width) over a blurred, darkened copy of itself, so the screen is still all picture.
 */
function FullVideo({ slot, on, screen }: { slot: string; on: boolean; screen: number }) {
  const media = slots[slot];
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (on) {
      v.currentTime = 0;
      void v.play().catch(() => {});
    } else v.pause();
  }, [on]);
  if (!media?.src) return null;
  const cover = Math.abs(Math.log((media.aspect ?? 9 / 16) / screen)) < 0.45;
  return (
    <div
      className="absolute inset-0 transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(.16,1,.3,1)]"
      style={{ opacity: on ? 1 : 0, transform: `scale(${on ? 1 : 1.06})` }}
      aria-hidden={!on}
    >
      {!cover && media.poster && <img src={media.poster} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-125 object-cover opacity-70 blur-2xl brightness-[.45]" />}
      <video ref={ref} className={`absolute inset-0 h-full w-full ${cover ? "object-cover" : "object-contain"}`} src={media.src} poster={media.poster ?? undefined} muted loop playsInline preload="metadata" />
    </div>
  );
}

/**
 * PHASE 01 — 5 videos, 8 weeks. The phase's five videos, full screen, one after another as you
 * scroll: each one fades up and plays, the last one goes. The week ruler along the bottom shows
 * where each lands in the eight weeks. (The clips are set in content/media.ts, spark-01 … 05.)
 */
export function Spark() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(-1);
  const [screen, setScreen] = useState(16 / 9);

  useEffect(() => {
    const on = () => setScreen(window.innerWidth / window.innerHeight);
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);

  useGSAP(
    () => {
      const el = root.current!;
      const stage = el.querySelector<HTMLElement>("[data-stage]")!;
      const st = ScrollTrigger.create({
        trigger: stage,
        start: "top top",
        end: "+=460%",
        pin: true,
        onUpdate: (s) => {
          const p = (s.progress - 0.08) / 0.9;
          setActive(p < 0 ? -1 : Math.min(S.pieces.length - 1, Math.floor(p * S.pieces.length)));
        },
        onLeaveBack: () => setActive(-1),
      });
      gsap.fromTo("[data-rule]", { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: stage, start: "top top", end: "+=460%", scrub: true } });
      return () => st.kill();
    },
    { scope: root },
  );

  const cur = active >= 0 ? S.pieces[active] : null;
  const link = cur ? slots[cur.slot]?.href : null;

  return (
    <section ref={root} id="spark" className="relative z-10 pt-[20vh]">
      <PhaseHeader n={S.n} name={S.name} months={S.months} objective={S.objective} heat={0.35}>
        <p className="t-lede mt-6 max-w-[30rem]">{S.line}</p>
      </PhaseHeader>

      <div data-stage className="relative mt-[10vh] h-[100svh] overflow-hidden bg-ink">
        {/* the videos, full screen */}
        {S.pieces.map((p, i) => (
          <FullVideo key={p.slot} slot={p.slot} on={i === active} screen={screen} />
        ))}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[30vh] bg-gradient-to-b from-black/75 to-transparent" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[42vh] bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

        {/* before the first one: the promise, big */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-700" style={{ opacity: active < 0 ? 1 : 0 }}>
          <p className="text-center font-display text-[clamp(3.5rem,11vw,12rem)] font-extrabold uppercase leading-[0.84]">
            {S.count[0]}
            <br />
            <span className="text-buzz">{S.count[1]}</span>
          </p>
        </div>

        {/* over the videos: the count, then the one playing */}
        <div className="gutter absolute inset-x-0 top-[calc(env(safe-area-inset-top,0px)+5.5rem)] flex items-baseline justify-between transition-opacity duration-500" style={{ opacity: active < 0 ? 0 : 1 }}>
          <p className="font-display text-[clamp(1.4rem,2.4vw,2.6rem)] font-extrabold uppercase leading-none">
            {S.count[0]} <span className="text-buzz">{S.count[1]}</span>
          </p>
          <p className="t-slate">Phase 01 · {S.months}</p>
        </div>
        <div className="gutter absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+2.2rem)]">
          <div className="mx-auto max-w-[1600px]">
            <div className="min-h-[7.5rem]" aria-live="polite">
              <AnimatePresence mode="wait">
                {cur && (
                  <motion.div key={cur.slot} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }}>
                    <p className="t-label text-buzz">
                      Video {String(active + 1).padStart(2, "0")} / {String(S.pieces.length).padStart(2, "0")} · {cur.week}
                    </p>
                    <p className="mt-2 font-display text-[clamp(2.2rem,4.6vw,5rem)] font-extrabold uppercase leading-[0.9]">{cur.title}</p>
                    <p className="t-slate mt-3">
                      {cur.format} · {cur.objective}
                    </p>
                    {link && (
                      <a href={link} target="_blank" rel="noreferrer" className="t-label pointer-events-auto mt-3 inline-block border-b border-buzz/60 pb-0.5 text-buzz">
                        Watch on Instagram ↗
                      </a>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* week ruler: W01 → W08, a dot where each video lands */}
            <div className="relative mt-6 h-10">
              <div className="absolute inset-x-0 top-3 h-px bg-bone/20" />
              <div data-rule className="absolute inset-x-0 top-3 h-px origin-left bg-buzz" />
              {Array.from({ length: WEEKS }).map((_, i) => {
                const k = S.pieces.findIndex((p) => weekOf(p.week) === i + 1);
                const on = k >= 0 && k === active;
                return (
                  <div key={i} className="absolute top-0 -translate-x-1/2" style={{ left: `${(i / (WEEKS - 1)) * 100}%` }}>
                    <div className={`mx-auto h-[7px] w-[7px] translate-y-[9px] rounded-full transition-all duration-500 ${k >= 0 ? "bg-buzz" : "bg-bone/30"} ${on ? "scale-[1.9] shadow-[0_0_14px_rgba(249,254,2,.9)]" : ""}`} />
                    <div className={`t-slate mt-4 whitespace-nowrap ${on ? "text-buzz" : ""}`}>W{String(i + 1).padStart(2, "0")}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
