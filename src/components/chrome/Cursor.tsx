"use client";

import { useEffect, useRef, useState } from "react";

/** Two-part cursor: a precise dot and a lagging ring that grows and labels interactive elements (data-cursor="Label"). */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState("");
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!fine) return;
    setEnabled(true);
    document.documentElement.classList.add("has-cursor");
    const pos = { x: -100, y: -100 };
    const lag = { x: -100, y: -100 };
    let raf = 0;
    let shown = false;
    const move = (e: PointerEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      if (!shown) {
        shown = true;
        lag.x = pos.x;
        lag.y = pos.y;
      }
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-cursor], a, button");
      const text = target ? target.dataset.cursor ?? (target.tagName === "A" ? "Open" : "") : "";
      setLabel((prev) => (prev === text ? prev : text));
      ring.current?.classList.toggle("is-active", !!target);
    };
    const leave = () => {
      pos.x = pos.y = -100;
      shown = false;
    };
    const loop = () => {
      lag.x += (pos.x - lag.x) * 0.18;
      lag.y += (pos.y - lag.y) * 0.18;
      if (dot.current) dot.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      if (ring.current) ring.current.style.transform = `translate3d(${lag.x}px, ${lag.y}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
      document.documentElement.classList.remove("has-cursor");
    };
  }, []);

  if (!enabled) return null;
  return (
    <>
      <div ref={dot} data-cursor-dot aria-hidden className="pointer-events-none fixed left-0 top-0 z-[80] -ml-[3px] -mt-[3px] h-[6px] w-[6px] rounded-full bg-buzz mix-blend-normal" />
      <div ref={ring} aria-hidden className="cursor-ring pointer-events-none fixed left-0 top-0 z-[79]">
        <div className="cursor-ring__inner">
          <span>{label}</span>
        </div>
      </div>
      <style>{`
        .cursor-ring__inner { position:absolute; left:-18px; top:-18px; width:36px; height:36px; border:1px solid rgba(239,232,222,.35); border-radius:999px;
          display:flex; align-items:center; justify-content:center; transition: width .45s var(--ease-out-expo), height .45s var(--ease-out-expo), left .45s var(--ease-out-expo), top .45s var(--ease-out-expo), background-color .3s, border-color .3s; }
        .cursor-ring__inner span { font: 500 10px/1 var(--font-mono); letter-spacing:.12em; text-transform:uppercase; color: var(--color-ink); opacity:0; transition: opacity .2s; white-space:nowrap; }
        .cursor-ring.is-active .cursor-ring__inner { width:76px; height:76px; left:-38px; top:-38px; background: var(--color-bone); border-color: var(--color-bone); }
        .cursor-ring.is-active .cursor-ring__inner span { opacity:1; }
      `}</style>
    </>
  );
}
