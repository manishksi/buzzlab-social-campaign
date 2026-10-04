"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { acts, menu, meta } from "@/content/strategy";
import { useStore, store } from "@/lib/store";
import { scrollToId, useLenis } from "./SmoothScroll";

export function MenuOverlay() {
  const open = useStore((s) => s.menuOpen);
  const lenis = useLenis();

  useEffect(() => {
    if (!open) return;
    lenis?.stop();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && store.set({ menuOpen: false });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      lenis?.start();
    };
  }, [open, lenis]);

  const go = (id: string) => {
    store.set({ menuOpen: false });
    lenis?.start();
    setTimeout(() => scrollToId(lenis, id), 80);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Index"
          className="fixed inset-0 z-[70] flex flex-col bg-ink"
          initial={{ clipPath: "inset(0 0 100% 0)" }}
          animate={{ clipPath: "inset(0 0 0% 0)" }}
          exit={{ clipPath: "inset(100% 0 0 0)" }}
          transition={{ duration: 0.7, ease: [0.77, 0, 0.18, 1] }}
        >
          <div className="gutter flex items-center justify-between py-5" style={{ paddingTop: "max(1.25rem, env(safe-area-inset-top, 0px))" }}>
            <span className="font-display text-[1.35rem] font-extrabold uppercase">{meta.brand}</span>
            <button type="button" data-cursor="Close" onClick={() => store.set({ menuOpen: false })} className="t-label border border-bone/25 px-3 py-1.5 hover:border-buzz hover:text-buzz">
              Close
            </button>
          </div>
          <nav className="gutter flex flex-1 flex-col justify-center gap-1 overflow-y-auto pb-10">
            {menu.map((m, i) => {
              const a = acts.find((x) => x.id === m.target);
              return (
                <motion.button
                  key={m.label}
                  type="button"
                  data-cursor="Go"
                  onClick={() => go(m.target)}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.25 + i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="group flex items-baseline gap-4 border-b border-line py-2 text-left md:gap-8"
                >
                  <span className="t-slate w-10 shrink-0 tabular">{a?.act ?? "—"}</span>
                  <span className="font-display text-[clamp(2rem,6vw,4.6rem)] font-extrabold uppercase leading-[0.95] transition-[color,transform] duration-500 group-hover:translate-x-3 group-hover:text-buzz">
                    {m.label}
                  </span>
                  <span className="t-slate ml-auto hidden text-right opacity-0 transition-opacity group-hover:opacity-100 md:block">{m.note}</span>
                </motion.button>
              );
            })}
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
