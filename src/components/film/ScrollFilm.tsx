"use client";

import { useEffect, useRef } from "react";
import { acts } from "@/content/strategy";
import { film } from "@/content/media";
import { ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";
import { store } from "@/lib/store";
import { FilmRenderer } from "./renderer";
import { filmKeys } from "@/lib/film-keys";

const FILM_END = 1.2;

/**
 * The fixed background film. Scroll position is mapped to film time through the act anchors in
 * strategy.ts, so each act always lands on the right moment of the film.
 * With `film.src` set (content/media.ts) a real video is scrubbed instead of the canvas.
 */
export function ScrollFilm() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const reduced = prefersReducedMotion();
    const lowPower = window.innerWidth < 768 || (navigator.hardwareConcurrency || 8) <= 4;
    const renderer = canvas && !film.src ? new FilmRenderer(canvas, { lowPower }) : null;

    // --- scroll → film-time mapping -------------------------------------------------
    let keys: { y: number; t: number }[] = [];
    let dimEls: HTMLElement[] = [];
    const compute = () => {
      const sy = window.scrollY;
      dimEls = Array.from(document.querySelectorAll<HTMLElement>("[data-dim]"));
      const base: { y: number; t: number }[] = [];
      acts.forEach((a) => {
        const el = document.getElementById(a.id);
        if (el) base.push({ y: el.getBoundingClientRect().top + sy, t: a.film });
      });
      keys = base.concat(filmKeys.all()).sort((a, b) => a.y - b.y);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      keys.push({ y: Math.max(max, (keys.at(-1)?.y ?? 0) + 1), t: FILM_END });
    };
    const filmAt = (y: number) => {
      if (!keys.length) return 0;
      if (y <= keys[0].y) return keys[0].t;
      for (let i = 0; i < keys.length - 1; i++) {
        const a = keys[i];
        const b = keys[i + 1];
        if (y <= b.y) return a.t + ((b.t - a.t) * (y - a.y)) / Math.max(1, b.y - a.y);
      }
      return keys[keys.length - 1].t;
    };
    const actAt = (y: number) => {
      let idx = 0;
      acts.forEach((a, i) => {
        const el = document.getElementById(a.id);
        if (el && el.getBoundingClientRect().top + window.scrollY <= y) idx = i;
      });
      return idx;
    };

    compute();
    ScrollTrigger.addEventListener("refresh", compute);
    const onResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1.25 : 1.6);
      renderer?.resize(window.innerWidth, window.innerHeight, dpr);
      compute();
    };
    onResize();
    window.addEventListener("resize", onResize);

    // --- render loop ---------------------------------------------------------------------
    let raf = 0;
    let last = performance.now();
    let filmT = filmAt(window.scrollY);
    let lastY = window.scrollY;
    let velocity = 0;
    let heatShown = -1;
    let actShown = -1;
    let frameSkip = 0;
    let dim = 1;
    const root = document.documentElement;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const y = window.scrollY;
      velocity = velocity * 0.85 + ((y - lastY) / Math.max(dt, 0.001)) * 0.15;
      lastY = y;
      const target = filmAt(y);
      filmT += (target - filmT) * (reduced ? 1 : Math.min(1, dt * 7));

      // global readouts for the chrome
      const max = Math.max(1, root.scrollHeight - window.innerHeight);
      const act = actAt(y + window.innerHeight * 0.5);
      if (act !== actShown) {
        actShown = act;
        store.set({ act });
      }
      store.set({ progress: Math.round((y / max) * 1000) / 1000 });

      // breathe the film down behind reading-heavy blocks
      let dimTarget = 1;
      const vh = window.innerHeight;
      for (const el of dimEls) {
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.7 && r.bottom > vh * 0.3) dimTarget = Math.min(dimTarget, Number(el.dataset.dim) || 0.4);
      }
      dim += (dimTarget - dim) * Math.min(1, dt * 3);
      if (wrapRef.current) wrapRef.current.style.opacity = dim.toFixed(3);

      if (document.hidden) return;
      if (video && film.src) {
        if (video.readyState >= 1 && video.duration) {
          const want = (filmT / FILM_END) * video.duration;
          if (Math.abs(video.currentTime - want) > 1 / 30) video.currentTime = want;
        }
        return;
      }
      if (!renderer) return;
      // halve the frame rate when nothing is moving and the scene is calm
      frameSkip = (frameSkip + 1) % 2;
      const calm = Math.abs(velocity) < 2 && filmT > 0.34 && filmT < 0.45;
      if (calm && frameSkip) return;
      const heat = renderer.render({ t: filmT, clock: now / 1000, dt: calm ? dt * 2 : dt, velocity });
      if (Math.abs(heat - heatShown) > 0.01) {
        heatShown = heat;
        root.style.setProperty("--heat", heat.toFixed(3));
      }
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ScrollTrigger.removeEventListener("refresh", compute);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div ref={wrapRef} aria-hidden className="pointer-events-none fixed inset-0 z-0">
      {film.src ? (
        <video
          ref={videoRef}
          className="h-full w-full object-cover opacity-80"
          src={film.src}
          poster={film.poster ?? undefined}
          muted
          playsInline
          preload="auto"
        />
      ) : (
        <canvas ref={canvasRef} className="block h-full w-full" />
      )}
    </div>
  );
}
