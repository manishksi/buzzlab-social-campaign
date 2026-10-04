/** A standalone flame (same drawing as the lighter's), used where the lighter body isn't wanted. */
export function FlameMark({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="40 -20 120 130" className={className} style={{ overflow: "visible", ...style }} aria-hidden>
      <defs>
        <radialGradient id="fm-glow">
          <stop offset="0" stopColor="#ffb45e" stopOpacity="0.85" />
          <stop offset="0.45" stopColor="#ef6a2a" stopOpacity="0.25" />
          <stop offset="1" stopColor="#ef6a2a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="fm-outer" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#ef6a2a" stopOpacity="0.95" />
          <stop offset="0.55" stopColor="#ef6a2a" stopOpacity="0.55" />
          <stop offset="1" stopColor="#b43412" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="fm-mid" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#ffd6a0" />
          <stop offset="0.5" stopColor="#f5a54a" />
          <stop offset="1" stopColor="#ef6a2a" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="fm-core" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#7fa8ff" stopOpacity="0.75" />
          <stop offset="0.35" stopColor="#fff4e0" />
          <stop offset="1" stopColor="#ffe0b0" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="60" r="90" fill="url(#fm-glow)" />
      <g className="fm-a"><path d="M100 98 C 70 80, 76 40, 100 -6 C 124 40, 130 80, 100 98 Z" fill="url(#fm-outer)" /></g>
      <g className="fm-b"><path d="M100 98 C 82 84, 86 56, 100 22 C 114 56, 118 84, 100 98 Z" fill="url(#fm-mid)" /></g>
      <g className="fm-c"><path d="M100 98 C 91 90, 92 74, 100 56 C 108 74, 109 90, 100 98 Z" fill="url(#fm-core)" /></g>
      <style>{`
        .fm-a { transform-origin: 100px 98px; animation: fmA .9s ease-in-out infinite alternate }
        .fm-b { transform-origin: 100px 98px; animation: fmB .6s ease-in-out infinite alternate }
        .fm-c { transform-origin: 100px 98px; animation: fmC .45s ease-in-out infinite alternate }
        @keyframes fmA { 0% { transform: scale(1,1) skewX(0) } 50% { transform: scale(.94,1.06) skewX(3deg) } 100% { transform: scale(1.04,.95) skewX(-3deg) } }
        @keyframes fmB { 0% { transform: scale(1,1) skewX(2deg) } 100% { transform: scale(.92,1.08) skewX(-2deg) } }
        @keyframes fmC { 0% { transform: scale(1,.96) } 100% { transform: scale(.95,1.05) } }
        @media (prefers-reduced-motion: reduce) { .fm-a, .fm-b, .fm-c { animation: none } }
      `}</style>
    </svg>
  );
}
