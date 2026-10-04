"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { gsap } from "@/lib/gsap";

export type LighterHandle = {
  /** Spin the wheel and throw sparks; resolves when the flame has caught. */
  ignite: () => Promise<void>;
  /** Screen position of the flame tip (for transitions that grow out of it). */
  flamePoint: () => { x: number; y: number };
};

type Props = {
  /** 0 = closed and cold · 0.35 spark · 0.7 flame · 1 fire · up to 1.8 when ignited */
  heat: number;
  open: boolean;
  className?: string;
  label?: string;
};

/**
 * An original flip-top lighter drawn in SVG. Lid, wheel, sparks and a three-layer flame are
 * animated with GSAP; flicker is CSS so it costs nothing when idle.
 */
export const Lighter = forwardRef<LighterHandle, Props>(function Lighter({ heat, open, className, label }, ref) {
  const svg = useRef<SVGSVGElement>(null);
  const lid = useRef<SVGGElement>(null);
  const wheel = useRef<SVGGElement>(null);
  const flame = useRef<SVGGElement>(null);
  const glow = useRef<SVGCircleElement>(null);
  const sparks = useRef<SVGGElement>(null);
  const wheelAngle = useRef(0);

  // initial state set through GSAP so every later transform shares the same SVG origin
  useEffect(() => {
    gsap.set(flame.current, { scale: 0, opacity: 0, svgOrigin: "100 98" });
    gsap.set(lid.current, { rotate: 0, svgOrigin: "170 176" });
    gsap.set(wheel.current, { rotate: 0, svgOrigin: "128 103" });
  }, []);

  useEffect(() => {
    gsap.to(lid.current, { rotate: open ? 128 : 0, duration: open ? 0.55 : 0.4, ease: open ? "back.out(1.6)" : "power3.in", svgOrigin: "170 176" });
    if (open) spin(150, 0.5);
  }, [open]);

  useEffect(() => {
    const h = Math.max(0, heat);
    gsap.to(flame.current, { scale: h > 0 ? 0.25 + h * 0.85 : 0, opacity: h > 0 ? 1 : 0, duration: h > 0 ? 0.5 : 0.25, ease: h > 0 ? "elastic.out(1, 0.55)" : "power2.in", svgOrigin: "100 98" });
    gsap.to(glow.current, { attr: { r: 40 + h * 120 }, opacity: h > 0 ? 0.35 + h * 0.35 : 0, duration: 0.6, ease: "power2.out" });
    if (h > 0 && h < 0.5) burst(6, 0.6);
  }, [heat]);

  function spin(deg: number, dur: number) {
    wheelAngle.current += deg;
    gsap.to(wheel.current, { rotate: wheelAngle.current, svgOrigin: "128 103", duration: dur, ease: "power3.out" });
  }

  function burst(n: number, power: number) {
    const g = sparks.current;
    if (!g) return;
    for (let i = 0; i < n; i++) {
      const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("cx", "116");
      c.setAttribute("cy", "100");
      c.setAttribute("r", String(1 + Math.random() * 1.6));
      c.setAttribute("fill", Math.random() > 0.4 ? "#ffd6a0" : "#f5a54a");
      g.appendChild(c);
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
      const d = (30 + Math.random() * 70) * power;
      gsap.to(c, {
        attr: { cx: 116 + Math.cos(a) * d, cy: 100 + Math.sin(a) * d + 40 * power },
        opacity: 0,
        duration: 0.5 + Math.random() * 0.5,
        ease: "power2.out",
        onComplete: () => c.remove(),
      });
    }
  }

  useImperativeHandle(ref, () => ({
    ignite: () =>
      new Promise<void>((resolve) => {
        spin(720, 0.8);
        burst(22, 1.3);
        gsap.fromTo(flame.current, { scale: 0.4 }, { scale: 1.9, duration: 0.7, ease: "elastic.out(1, 0.45)", svgOrigin: "100 98", onComplete: () => resolve() });
        gsap.to(glow.current, { attr: { r: 260 }, opacity: 1, duration: 0.7 });
      }),
    flamePoint: () => {
      const r = svg.current?.getBoundingClientRect();
      if (!r) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      return { x: r.left + (100 / 200) * r.width, y: r.top + (70 / 420) * r.height };
    },
  }));

  return (
    <svg ref={svg} viewBox="0 0 200 420" className={className} role="img" aria-label={label ?? "Lighter"} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="lt-body" x1="0" x2="1">
          <stop offset="0" stopColor="#141210" />
          <stop offset="0.18" stopColor="#3b3631" />
          <stop offset="0.32" stopColor="#6d665d" />
          <stop offset="0.42" stopColor="#2a2622" />
          <stop offset="0.78" stopColor="#1f1c19" />
          <stop offset="0.92" stopColor="#4a443d" />
          <stop offset="1" stopColor="#121010" />
        </linearGradient>
        <linearGradient id="lt-lid" x1="0" x2="1">
          <stop offset="0" stopColor="#181614" />
          <stop offset="0.2" stopColor="#4a443d" />
          <stop offset="0.34" stopColor="#7c746a" />
          <stop offset="0.45" stopColor="#2c2824" />
          <stop offset="0.9" stopColor="#3a352f" />
          <stop offset="1" stopColor="#141210" />
        </linearGradient>
        <radialGradient id="lt-glow">
          <stop offset="0" stopColor="#ffb45e" stopOpacity="0.9" />
          <stop offset="0.4" stopColor="#ef6a2a" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ef6a2a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="lt-outer" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#ef6a2a" stopOpacity="0.95" />
          <stop offset="0.55" stopColor="#ef6a2a" stopOpacity="0.55" />
          <stop offset="1" stopColor="#b43412" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lt-mid" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#ffd6a0" />
          <stop offset="0.5" stopColor="#f5a54a" />
          <stop offset="1" stopColor="#ef6a2a" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="lt-core" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#7fa8ff" stopOpacity="0.75" />
          <stop offset="0.35" stopColor="#fff4e0" />
          <stop offset="1" stopColor="#ffe0b0" stopOpacity="0.4" />
        </linearGradient>
        <pattern id="lt-holes" width="12" height="12" patternUnits="userSpaceOnUse">
          <circle cx="6" cy="6" r="3" fill="#0b0a09" />
        </pattern>
      </defs>

      <circle ref={glow} cx="100" cy="70" r="40" fill="url(#lt-glow)" opacity="0" style={{ mixBlendMode: "screen" }} />

      {/* flame */}
      <g ref={flame} opacity="0">
        <g className="lt-flicker-a">
          <path d="M100 98 C 70 80, 76 40, 100 -6 C 124 40, 130 80, 100 98 Z" fill="url(#lt-outer)" />
        </g>
        <g className="lt-flicker-b">
          <path d="M100 98 C 82 84, 86 56, 100 22 C 114 56, 118 84, 100 98 Z" fill="url(#lt-mid)" />
        </g>
        <g className="lt-flicker-c">
          <path d="M100 98 C 91 90, 92 74, 100 56 C 108 74, 109 90, 100 98 Z" fill="url(#lt-core)" />
        </g>
      </g>
      <g ref={sparks} />

      {/* chimney + wick + wheel */}
      <rect x="58" y="108" width="84" height="68" rx="3" fill="#2b2723" stroke="#5a534b" strokeWidth="1" />
      <rect x="62" y="114" width="76" height="56" fill="url(#lt-holes)" opacity="0.85" />
      <rect x="95" y="96" width="10" height="14" rx="2" fill="#d8cfc2" />
      <g ref={wheel}>
        <circle cx="128" cy="103" r="15" fill="#3b3631" stroke="#8a8278" strokeWidth="1.2" />
        {Array.from({ length: 18 }).map((_, i) => {
          const a = (i / 18) * Math.PI * 2;
          return <line key={i} x1={128 + Math.cos(a) * 9} y1={103 + Math.sin(a) * 9} x2={128 + Math.cos(a) * 15} y2={103 + Math.sin(a) * 15} stroke="#9a9186" strokeWidth="1" />;
        })}
        <circle cx="128" cy="103" r="4" fill="#1a1714" />
      </g>

      {/* body */}
      <rect x="30" y="174" width="140" height="230" rx="16" fill="url(#lt-body)" stroke="#5a534b" strokeWidth="1" />
      <rect x="38" y="182" width="124" height="214" rx="11" fill="none" stroke="#ffffff" strokeOpacity="0.07" />
      <text x="100" y="300" textAnchor="middle" fill="#efe8de" fillOpacity="0.16" style={{ font: "800 15px var(--font-display)", letterSpacing: "0.32em" }} transform="rotate(-90 100 300)">
        BUZZLAB
      </text>
      <rect x="30" y="172" width="140" height="6" fill="#0b0a09" opacity="0.6" />

      {/* lid (hinged on the right) */}
      <g ref={lid}>
        <rect x="30" y="76" width="140" height="100" rx="16" fill="url(#lt-lid)" stroke="#5a534b" strokeWidth="1" />
        <rect x="38" y="84" width="124" height="84" rx="11" fill="none" stroke="#ffffff" strokeOpacity="0.07" />
        <path d="M44 92 Q 100 84 156 92" stroke="#ffffff" strokeOpacity="0.12" fill="none" />
        <circle cx="166" cy="174" r="5" fill="#2a2622" stroke="#6d665d" />
      </g>

      <style>{`
        .lt-flicker-a { transform-origin: 100px 98px; animation: ltA 0.9s ease-in-out infinite alternate; }
        .lt-flicker-b { transform-origin: 100px 98px; animation: ltB 0.6s ease-in-out infinite alternate; }
        .lt-flicker-c { transform-origin: 100px 98px; animation: ltC 0.45s ease-in-out infinite alternate; }
        @keyframes ltA { 0% { transform: scale(1, 1) skewX(0deg) } 40% { transform: scale(0.94, 1.06) skewX(3deg) } 100% { transform: scale(1.04, 0.95) skewX(-3deg) } }
        @keyframes ltB { 0% { transform: scale(1, 1) skewX(2deg) } 100% { transform: scale(0.92, 1.08) skewX(-2deg) } }
        @keyframes ltC { 0% { transform: scale(1, 0.96) } 100% { transform: scale(0.95, 1.05) } }
        @media (prefers-reduced-motion: reduce) { .lt-flicker-a, .lt-flicker-b, .lt-flicker-c { animation: none } }
      `}</style>
    </svg>
  );
});
