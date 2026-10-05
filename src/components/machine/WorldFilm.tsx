"use client";

import { useEffect, useRef } from "react";
import { worldClock, worldSpans, type WorldId } from "@/lib/world-clock";
import { prefersReducedMotion } from "@/lib/gsap";
import type { World } from "./worlds";

/**
 * The fixed WebGL layer every 3D world plays on: the studio (Acts 02–03), the creative machine and
 * Original IP (Act 07), the pipeline (Act 08), the miniature set (Act 09) and Tanishka.
 *
 * One renderer, one canvas. three.js loads the first time a world comes near; each world's code
 * loads just before it's reached and only the world on screen renders. Role labels are DOM,
 * pinned to their objects every frame.
 */
export function WorldFilm() {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const labels = useRef<HTMLDivElement>(null);

  useEffect(() => {
    type Mod = typeof import("./worlds");
    let mod: Mod | null = null;
    let renderer: import("three").WebGLRenderer | null = null;
    let booting = false;
    const worlds = new Map<WorldId, World>();
    const loading = new Set<WorldId>();
    const smooth = Object.fromEntries(worldSpans.map((s) => [s.id, 0])) as Record<WorldId, number>;
    let raf = 0;
    let last = performance.now();
    let shown: WorldId | null = null;
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
      if (!renderer) return;
      const dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1 : 1.5);
      renderer.setPixelRatio(dpr);
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      worlds.forEach((w) => w.resize(window.innerWidth, window.innerHeight));
    };
    window.addEventListener("resize", size);

    const extent = (id: string) => {
      const node = document.getElementById(id);
      if (!node) return null;
      const box = node.parentElement?.classList.contains("pin-spacer") ? node.parentElement : node;
      return box.getBoundingClientRect();
    };

    const load = (id: WorldId) => {
      if (worlds.has(id) || loading.has(id)) return;
      if (!mod) {
        if (!booting) {
          booting = true;
          import("./worlds").then((m) => {
            mod = m;
            renderer = m.createRenderer(canvas.current!, { lowPower });
            size();
          });
        }
        return;
      }
      const loader = mod.loaders[id];
      if (!renderer || !loader || loading.size) return; // one world at a time
      loading.add(id);
      loader(renderer, { lowPower }).then(async (w) => {
        await document.fonts?.ready;
        w.resize(window.innerWidth, window.innerHeight);
        worlds.set(id, w);
        smooth[id] = worldClock[id].w; // start where the scroll already is, not from 0
        loading.delete(id);
      });
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const el = wrap.current;
      if (!el) return;
      const vh = window.innerHeight;
      // which world holds the middle of the screen, and which are close enough to warm up
      let active: WorldId | null = null;
      for (const s of worldSpans) {
        const a = extent(s.from);
        const b = extent(s.to);
        if (!a || !b) continue;
        if (a.top < vh * 3 && b.bottom > -vh) load(s.id);
        if (a.top <= vh * 0.5 && b.bottom > vh * 0.5) active = s.id;
      }
      if (active !== shown) {
        shown = active;
        el.style.visibility = active ? "visible" : "hidden";
      }
      pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 2);
      pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 2);
      const world = active ? worlds.get(active) : undefined;
      if (!active || !world || document.hidden) return;
      const clock = worldClock[active];
      smooth[active] += (clock.w - smooth[active]) * (reduced ? 1 : Math.min(1, dt * 6));
      const w = smooth[active];
      el.style.opacity = clock.fade.toFixed(3);
      world.render(w, now / 1000, pointer);

      // labels pinned to objects
      const box = labels.current!;
      const seen = new Set<string>();
      for (const l of world.labels?.(w) ?? []) {
        const key = `${active}:${l.id}`;
        seen.add(key);
        let s = spans.get(key);
        if (!s) {
          s = document.createElement("span");
          s.className = l.pin ? "machine-label machine-label--pin" : "machine-label";
          s.textContent = l.text;
          box.appendChild(s);
          spans.set(key, s);
        }
        s.style.opacity = l.a.toFixed(3);
        // keep the whole label on screen
        const x = Math.min(Math.max(8, l.x), window.innerWidth - s.offsetWidth - 8);
        s.style.transform = `translate3d(${x.toFixed(1)}px, ${l.y.toFixed(1)}px, 0)`;
      }
      spans.forEach((s, id) => {
        if (!seen.has(id)) s.style.opacity = "0";
      });
    };
    raf = requestAnimationFrame(loop);
    const snap = () => {
      for (const s of worldSpans) smooth[s.id] = worldClock[s.id].w;
    };
    window.addEventListener("film:snap", snap);

    return () => {
      window.removeEventListener("film:snap", snap);
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", size);
      worlds.forEach((w) => w.dispose());
      renderer?.dispose();
    };
  }, []);

  return (
    <div ref={wrap} aria-hidden className="pointer-events-none fixed inset-0 z-0" style={{ visibility: "hidden" }}>
      <canvas ref={canvas} className="block h-full w-full" />
      <div ref={labels} className="absolute inset-0 overflow-hidden" />
    </div>
  );
}
