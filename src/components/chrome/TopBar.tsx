"use client";

import { AnimatePresence, motion } from "motion/react";
import { acts, meta } from "@/content/strategy";
import { useStore, store } from "@/lib/store";
import { unlockAudio, playClick } from "@/lib/audio";
import { scrollToId, useLenis } from "./SmoothScroll";

const FILM_SECONDS = 6 * 60; // the "running time" shown in the timecode

function timecode(p: number) {
  const s = p * FILM_SECONDS;
  const mm = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  const ff = Math.floor((s % 1) * 25);
  return `00:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}:${String(ff).padStart(2, "0")}`;
}

export function TopBar() {
  const act = useStore((s) => s.act);
  const progress = useStore((s) => s.progress);
  const sound = useStore((s) => s.sound);
  const lenis = useLenis();
  const current = acts[act] ?? acts[0];

  return (
    <header className="fixed inset-x-0 top-0 z-50" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <div className="pointer-events-none absolute inset-0 -bottom-10 bg-gradient-to-b from-ink/85 via-ink/40 to-transparent" />
      <div className="gutter relative flex items-center justify-between gap-4 py-4 md:py-5">
        <button
          type="button"
          data-cursor="Top"
          onClick={() => scrollToId(lenis, "top")}
          className="flex items-baseline gap-3 text-left"
          aria-label="Back to the start"
        >
          <span className="font-display text-[1.35rem] font-extrabold uppercase leading-none tracking-[0.02em]">{meta.brand}</span>
          <span className="t-slate hidden sm:inline">Social strategy</span>
        </button>

        <div className="t-slate pointer-events-none absolute left-1/2 hidden -translate-x-1/2 overflow-hidden md:block" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={current.id}
              initial={{ y: "110%" }}
              animate={{ y: 0 }}
              exit={{ y: "-110%" }}
              transition={{ duration: 0.45, ease: [0.77, 0, 0.18, 1] }}
              className="block whitespace-nowrap"
            >
              <span className="text-ember">Act {current.act}</span>
              <span className="mx-2 opacity-40">—</span>
              <span className="text-bone/80">{current.label}</span>
            </motion.span>
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-3 md:gap-5">
          <span className="t-slate hidden tabular lg:inline" aria-hidden>
            TC {timecode(progress)}
          </span>
          <button
            type="button"
            data-cursor={sound ? "Mute" : "Sound"}
            onClick={() => {
              unlockAudio();
              const next = !sound;
              store.set({ sound: next });
              if (next) setTimeout(() => playClick(0.7), 60);
            }}
            className="t-label flex items-center gap-2 text-bone/70 transition-colors hover:text-bone"
            aria-pressed={sound}
            aria-label={sound ? "Turn sound off" : "Turn sound on"}
          >
            <span className="flex h-3 items-end gap-[2px]" aria-hidden>
              {[0.5, 1, 0.7, 0.35].map((h, i) => (
                <span
                  key={i}
                  className="w-[2px] bg-current transition-all duration-300"
                  style={{ height: sound ? `${h * 100}%` : "2px", animation: sound ? `eq 0.${7 + i}s ease-in-out ${i * 0.1}s infinite alternate` : "none" }}
                />
              ))}
            </span>
            <span className="hidden sm:inline">{sound ? "Sound on" : "Sound off"}</span>
          </button>
          <button
            type="button"
            data-cursor="Index"
            onClick={() => store.set({ menuOpen: true })}
            className="t-label flex items-center gap-2 border border-bone/25 px-3 py-1.5 transition-colors hover:border-ember hover:text-ember"
            aria-haspopup="dialog"
          >
            Index
          </button>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px bg-bone/10">
        <div className="h-full origin-left bg-ember" style={{ transform: `scaleX(${progress})` }} />
      </div>
      <style>{`@keyframes eq { from { transform: scaleY(0.35) } to { transform: scaleY(1) } }`}</style>
    </header>
  );
}
