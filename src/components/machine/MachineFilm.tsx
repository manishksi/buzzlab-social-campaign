"use client";

import { useEffect, useRef } from "react";
import { machineClock } from "@/lib/machine-clock";
import { prefersReducedMotion } from "@/lib/gsap";
import type { MachineScene } from "./scene";

/**
 * The fixed WebGL layer for the creative machine and the world it opens into. three.js and the
 * scene are only loaded when the machine is about to come on screen, and it only renders then.
 * Role labels ("DOP — the camera") are DOM, pinned to their objects every frame.
 */
export function MachineFilm() {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const labels = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let scene: MachineScene | null = null;
    let loading = false;
    let raf = 0;
    let w = 0;
    let last = performance.now();
    const reduced = prefersReducedMotion();
    const lowPower = window.innerWidth < 768 || (navigator.hardwareConcurrency || 8) <= 4;
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: PointerEvent) => {
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    const spans = new Map<string, HTMLSpanElement>();

    const size = () => {
      if (!scene) return;
      const dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1 : 1.5);
      scene.resize(window.innerWidth, window.innerHeight, dpr);
    };
    window.addEventListener("resize", size);

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const el = wrap.current;
      if (!el) return;
      // awake from just before the machine arrives until the IP act has gone
      const extent = (id: string) => {
        const node = document.getElementById(id);
        if (!node) return null;
        const box = node.parentElement?.classList.contains("pin-spacer") ? node.parentElement : node;
        return box.getBoundingClientRect();
      };
      const a = extent("machine");
      const b = extent("ip");
      const vh = window.innerHeight;
      const on = !!a && !!b && a.top < vh * 1.3 && b.bottom > -vh * 0.1;
      machineClock.near = on;
      el.style.visibility = on ? "visible" : "hidden";
      if (!on) return;
      if (!scene && !loading) {
        loading = true;
        import("./scene").then(async ({ MachineScene }) => {
          await document.fonts?.ready;
          if (!canvas.current) return;
          scene = new MachineScene(canvas.current, { lowPower });
          size();
        });
      }
      if (!scene || document.hidden) return;
      w += (machineClock.w - w) * (reduced ? 1 : Math.min(1, dt * 6));
      pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 2);
      pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 2);
      el.style.opacity = machineClock.fade.toFixed(3);
      scene.render(w, now / 1000, pointer);

      // role labels during the chaos
      const box = labels.current!;
      const seen = new Set<string>();
      for (const l of scene.labels(w)) {
        seen.add(l.id);
        let s = spans.get(l.id);
        if (!s) {
          s = document.createElement("span");
          s.className = "machine-label";
          s.textContent = l.text;
          box.appendChild(s);
          spans.set(l.id, s);
        }
        s.style.opacity = l.a.toFixed(3);
        s.style.transform = `translate3d(${l.x.toFixed(1)}px, ${l.y.toFixed(1)}px, 0)`;
      }
      spans.forEach((s, id) => {
        if (!seen.has(id)) s.style.opacity = "0";
      });
    };
    raf = requestAnimationFrame(loop);
    const snap = () => void (w = machineClock.w);
    window.addEventListener("film:snap", snap);

    return () => {
      window.removeEventListener("film:snap", snap);
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", size);
      scene?.dispose();
    };
  }, []);

  return (
    <div ref={wrap} aria-hidden className="pointer-events-none fixed inset-0 z-0" style={{ visibility: "hidden" }}>
      <canvas ref={canvas} className="block h-full w-full" />
      <div ref={labels} className="absolute inset-0 overflow-hidden" />
    </div>
  );
}
