"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { store } from "@/lib/store";
import { scrollToId, useLenis } from "./SmoothScroll";

export type IgniteDetail = { x: number; y: number; target: string };

/** Listens for "ignite:go": warm light opens out of the flame, the cut happens inside it, then it dissolves. */
export function IgniteOverlay() {
  const el = useRef<HTMLDivElement>(null);
  const lenis = useLenis();

  useEffect(() => {
    const onGo = (e: Event) => {
      const { x, y, target } = (e as CustomEvent<IgniteDetail>).detail;
      const node = el.current;
      if (!node) return;
      store.set({ igniting: true });
      const at = `${x}px ${y}px`;
      gsap
        .timeline({
          onComplete: () => {
            store.set({ igniting: false });
            gsap.set(node, { autoAlpha: 0 });
          },
        })
        .set(node, { autoAlpha: 1, clipPath: `circle(0% at ${at})`, "--fx": `${x}px`, "--fy": `${y}px` })
        .to(node, { clipPath: `circle(150% at ${at})`, duration: 0.9, ease: "power2.in" })
        .add(() => scrollToId(lenis, target, { immediate: true }))
        .to(node, { autoAlpha: 0, duration: 1.1, ease: "power2.out" }, "+=0.15");
    };
    window.addEventListener("ignite:go", onGo);
    return () => window.removeEventListener("ignite:go", onGo);
  }, [lenis]);

  return (
    <div
      ref={el}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[75] opacity-0"
      style={{
        background:
          "radial-gradient(circle at var(--fx, 50%) var(--fy, 50%), rgba(255,252,214,.95) 0%, rgba(240,232,120,.6) 5%, rgba(96,92,10,.4) 14%, #0d0d06 34%, #000000 60%)",
      }}
    />
  );
}
