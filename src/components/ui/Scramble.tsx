"use client";

import { useRef } from "react";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";

const GLYPHS = "▮▯░▒▓/\\|_-=+*#%01ABCDEFX";

/** Decodes a word from noise when it enters the viewport. */
export function Scramble({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useGSAP(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const run = () => {
      const start = performance.now() + delay * 1000;
      const dur = 700 + text.length * 40;
      const tick = (now: number) => {
        const p = Math.max(0, (now - start) / dur);
        const reveal = Math.floor(p * text.length);
        let out = "";
        for (let i = 0; i < text.length; i++) {
          if (i < reveal || text[i] === " ") out += text[i];
          else out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
        el.textContent = out;
        if (p < 1) raf = requestAnimationFrame(tick);
        else el.textContent = text;
      };
      raf = requestAnimationFrame(tick);
    };
    const st = ScrollTrigger.create({ trigger: el, start: "top 88%", once: true, onEnter: run });
    return () => {
      cancelAnimationFrame(raf);
      st.kill();
    };
  });
  return (
    <span ref={ref} className={className} aria-label={text}>
      {text}
    </span>
  );
}
