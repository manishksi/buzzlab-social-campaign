"use client";

import { useEffect, useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useLenis } from "@/components/chrome/SmoothScroll";
import { watching as W } from "@/content/strategy";

type Eye = { cx: number; cy: number; r: number };
const EYES: Eye[] = [
  { cx: 292, cy: 258, r: 92 },
  { cx: 512, cy: 246, r: 106 },
];

/**
 * ACT 02 → 03 — the website notices you back. Two mismatched eyes open in the dark and follow
 * the cursor. They get curious when you stop, startled when you scroll fast, and glance down to
 * the next act as you leave. Playful, not spooky.
 */
export function Watching() {
  const root = useRef<HTMLElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const lenis = useLenis();
  const lenisRef = useRef(lenis);
  lenisRef.current = lenis;
  // scroll-driven values the tracking loop reads
  const scrollState = useRef({ open: 0, look: 0 });

  useGSAP(
    () => {
      const el = root.current!;
      gsap.set(["[data-caption]", "[data-face]"], { autoAlpha: 0 });
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: el, start: "top top", end: "+=180%", pin: true, scrub: 0.6 },
      });
      tl.to("[data-face]", { autoAlpha: 1, duration: 0.06 }, 0.02)
        .to(scrollState.current, { open: 1, duration: 0.08, ease: "power2.out" }, 0.06)
        .fromTo("[data-caption]", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.06 }, 0.2)
        // leaving: a look down to what's next, then the face drifts up and away
        .to(scrollState.current, { look: 1, duration: 0.14 }, 0.68)
        .to("[data-caption]", { autoAlpha: 0, duration: 0.05 }, 0.74)
        .to("[data-face]", { yPercent: -28, scale: 0.86, autoAlpha: 0, duration: 0.18, ease: "power2.in" }, 0.82);
    },
    { scope: root },
  );

  // the eyes: cursor tracking, blinks, curiosity, surprise
  useEffect(() => {
    const s = svg.current;
    if (!s) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const q = <T extends Element>(sel: string) => Array.from(s.querySelectorAll<T>(sel));
    const irises = q<SVGGElement>("[data-iris]");
    const pupils = q<SVGCircleElement>("[data-pupil]");
    const lids = q<SVGEllipseElement>("[data-lid]");
    const brows = q<SVGPathElement>("[data-brow]");
    const mouth = s.querySelector<SVGPathElement>("[data-mouth]")!;
    const face = s.querySelector<SVGGElement>("[data-head]")!;

    const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2, t: performance.now(), has: false };
    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.t = performance.now();
      pointer.has = true;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const st = { px: 0, py: 0, curious: 0, startle: 0, blink: 0, nextBlink: performance.now() + 1800, blinks: 0, dilate: 1, tilt: 0, hx: 0, hy: 0 };
    let raf = 0;
    let visible = false;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(loop);
    });
    io.observe(s);

    let last = performance.now();
    function loop(now: number) {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const r = s!.getBoundingClientRect();
      const scale = r.width / 800;
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const { open, look } = scrollState.current;

      // where to look: the cursor (or a slow wander on touch), then down to the next act
      let tx = pointer.x;
      let ty = pointer.y;
      if (!pointer.has || reduced) {
        tx = cx + Math.sin(now / 1900) * r.width * 0.3;
        ty = cy + Math.sin(now / 1300) * r.height * 0.15;
      }
      tx += (cx - tx) * look;
      ty += (cy + window.innerHeight * 0.9 - ty) * look;

      const idle = (now - pointer.t) / 1000;
      const curiousT = pointer.has && idle > 1.6 && look < 0.2 ? 1 : 0;
      st.curious += (curiousT - st.curious) * Math.min(1, dt * 2.5);
      const v = Math.abs(lenisRef.current?.velocity ?? 0);
      st.startle = Math.max(st.startle * Math.exp(-dt * 3), Math.min(1, v / 40));

      // blinking: now and then, sometimes twice; and when poked
      if (now > st.nextBlink) {
        st.blink = 1;
        st.blinks = Math.random() < 0.25 ? 1 : 0;
        st.nextBlink = now + 2600 + Math.random() * 3600;
      }
      st.blink = Math.max(0, st.blink - dt * 7);
      if (st.blink === 0 && st.blinks > 0) {
        st.blinks--;
        st.blink = 1;
      }
      const blinkAmt = Math.sin(st.blink * Math.PI);

      // head: drifts and tilts toward the cursor
      const dxs = (tx - cx) / Math.max(1, window.innerWidth);
      const dys = (ty - cy) / Math.max(1, window.innerHeight);
      st.hx += (dxs * 26 - st.hx) * Math.min(1, dt * 4);
      st.hy += (dys * 18 - st.hy) * Math.min(1, dt * 4);
      st.tilt += (dxs * 7 + st.curious * 6 - st.tilt) * Math.min(1, dt * 3);
      face.setAttribute("transform", `translate(${st.hx.toFixed(2)} ${st.hy.toFixed(2)}) rotate(${st.tilt.toFixed(2)} 400 250)`);

      EYES.forEach((e, i) => {
        const ex = r.left + e.cx * scale;
        const ey = r.top + e.cy * scale;
        const ax = tx - ex;
        const ay = ty - ey;
        const d = Math.hypot(ax, ay) || 1;
        const reach = Math.min(1, d / (r.width * 0.55));
        const max = e.r * 0.42;
        const ox = (ax / d) * max * reach;
        const oy = (ay / d) * max * reach;
        irises[i].setAttribute("transform", `translate(${ox.toFixed(2)} ${oy.toFixed(2)})`);
        // pupils open up when curious, shrink when startled
        const dil = 1 + st.curious * 0.28 - st.startle * 0.3;
        pupils[i].setAttribute("r", (e.r * 0.2 * dil).toFixed(2));
        // poke: cursor right on the eye makes it wince
        const poke = pointer.has && Math.hypot(pointer.x - ex, pointer.y - ey) < e.r * scale * 0.9 ? 1 : 0;
        const openAmt = open * (1 - blinkAmt) * (1 - poke * 0.75) * (1 + st.startle * 0.12) * (1 - st.curious * 0.12 * (i === 0 ? 1 : -0.4));
        lids[i].setAttribute("ry", Math.max(0.6, e.r * 1.02 * openAmt).toFixed(2));
      });

      // brows and mouth: surprise lifts both, curiosity cocks one
      const lift = st.startle * 26 + st.curious * 10;
      brows[0].setAttribute("transform", `translate(0 ${(-lift - st.curious * 8).toFixed(2)}) rotate(${(-6 - st.curious * 10).toFixed(2)} 292 140)`);
      brows[1].setAttribute("transform", `translate(0 ${(-lift + st.curious * 6).toFixed(2)}) rotate(${(5 + st.startle * 4).toFixed(2)} 512 120)`);
      const m = st.startle;
      mouth.setAttribute("d", `M ${380 - 18 + m * 6} ${400} Q 400 ${404 + m * 22 - st.curious * 6} ${420 + 18 - m * 6} ${400}`);
      mouth.setAttribute("stroke-width", (6 + m * 5).toFixed(1));
    }

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <section ref={root} id="watching" className="relative z-10 flex h-[100svh] items-center justify-center overflow-hidden bg-ink" aria-label={W.caption}>
      <div data-face className="relative w-[min(92vw,820px)]">
        <svg ref={svg} viewBox="0 0 800 500" className="block h-auto w-full overflow-visible" aria-hidden>
          <defs>
            <radialGradient id="w-sclera" cx="0.38" cy="0.32" r="0.75">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.55" stopColor="#eeebe3" />
              <stop offset="0.86" stopColor="#bdb9b0" />
              <stop offset="1" stopColor="#7f7c76" />
            </radialGradient>
            <radialGradient id="w-iris" cx="0.45" cy="0.42" r="0.6">
              <stop offset="0" stopColor="#fffbb8" />
              <stop offset="0.45" stopColor="#f9fe02" />
              <stop offset="0.9" stopColor="#bdb800" />
              <stop offset="1" stopColor="#5e5b00" />
            </radialGradient>
            <radialGradient id="w-glow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#f9fe02" stopOpacity="0.1" />
              <stop offset="1" stopColor="#f9fe02" stopOpacity="0" />
            </radialGradient>
            {EYES.map((e, i) => (
              <clipPath key={i} id={`w-lid-${i}`}>
                <ellipse data-lid cx={e.cx} cy={e.cy} rx={e.r * 1.02} ry={0.6} />
              </clipPath>
            ))}
          </defs>
          <ellipse cx="400" cy="260" rx="420" ry="230" fill="url(#w-glow)" />
          <g data-head>
            {EYES.map((e, i) => (
              <g key={i}>
                {/* a soft shadow under each eye so they sit in the dark */}
                <ellipse cx={e.cx} cy={e.cy + e.r * 0.92} rx={e.r * 0.8} ry={e.r * 0.12} fill="#000" opacity="0.6" />
                <g clipPath={`url(#w-lid-${i})`}>
                  <circle cx={e.cx} cy={e.cy} r={e.r} fill="url(#w-sclera)" />
                  <g data-iris>
                    <circle cx={e.cx} cy={e.cy} r={e.r * 0.47} fill="url(#w-iris)" />
                    <circle cx={e.cx} cy={e.cy} r={e.r * 0.47} fill="none" stroke="#3a3800" strokeWidth={e.r * 0.03} opacity="0.7" />
                    {Array.from({ length: 18 }).map((_, k) => {
                      const a = (k / 18) * Math.PI * 2;
                      return (
                        <line
                          key={k}
                          x1={e.cx + Math.cos(a) * e.r * 0.24}
                          y1={e.cy + Math.sin(a) * e.r * 0.24}
                          x2={e.cx + Math.cos(a) * e.r * 0.43}
                          y2={e.cy + Math.sin(a) * e.r * 0.43}
                          stroke="#8a8700"
                          strokeWidth={e.r * 0.012}
                          opacity="0.45"
                        />
                      );
                    })}
                    <circle data-pupil cx={e.cx} cy={e.cy} r={e.r * 0.2} fill="#050505" />
                    <circle cx={e.cx - e.r * 0.14} cy={e.cy - e.r * 0.16} r={e.r * 0.07} fill="#ffffff" opacity="0.95" />
                    <circle cx={e.cx + e.r * 0.12} cy={e.cy + e.r * 0.1} r={e.r * 0.025} fill="#ffffff" opacity="0.7" />
                  </g>
                  {/* lid shading at the top of the eyeball */}
                  <ellipse cx={e.cx} cy={e.cy - e.r * 0.92} rx={e.r * 1.1} ry={e.r * 0.42} fill="#000" opacity="0.28" />
                </g>
              </g>
            ))}
            <path data-brow d="M 226 140 Q 292 112 358 138" fill="none" stroke="#eeebe3" strokeWidth="16" strokeLinecap="round" />
            <path data-brow d="M 440 122 Q 512 92 590 118" fill="none" stroke="#eeebe3" strokeWidth="18" strokeLinecap="round" />
            <path data-mouth d="M 362 400 Q 400 404 438 400" fill="none" stroke="#eeebe3" strokeWidth="6" strokeLinecap="round" opacity="0.85" />
          </g>
        </svg>
      </div>
      <p data-caption className="t-slate absolute bottom-[12vh] left-1/2 -translate-x-1/2 whitespace-nowrap text-center">
        {W.caption}
      </p>
    </section>
  );
}
