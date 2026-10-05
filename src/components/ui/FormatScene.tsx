"use client";

import "./formats.css";

export type FormatKind = "skits" | "vlogs" | "talking" | "podcast" | "pov";

/**
 * PHASE 02 — one small animated scene per content format, so each reads at a glance:
 * skits (two characters, a double take, a cut-in), vlogs (handheld, walking, rolling),
 * talking head (direct to camera, framed and lit), podcast (two mics, a conversation),
 * POV (first person, moving forward with the camera in your hands). Plays while shown.
 */
export function FormatScene({ kind }: { kind: FormatKind }) {
  return (
    <div className={`fs fs--${kind}`} aria-hidden>
      {kind === "skits" && <Skits />}
      {kind === "vlogs" && <Vlogs />}
      {kind === "talking" && <Talking />}
      {kind === "podcast" && <Podcast />}
      {kind === "pov" && <Pov />}
      <div className="fs__grain" />
    </div>
  );
}

const Y = "#f9fe02";
const BONE = "#eeebe3";

function Fig({ x, y, s, fill, className }: { x: number; y: number; s: number; fill: string; className?: string }) {
  return (
    <g className={className}>
      <path d={`M${x - s * 0.36} ${y + s * 0.4} Q${x - s * 0.34} ${y - s * 0.32} ${x} ${y - s * 0.36} Q${x + s * 0.34} ${y - s * 0.32} ${x + s * 0.36} ${y + s * 0.4} Z`} fill={fill} />
      <circle cx={x} cy={y - s * 0.62} r={s * 0.2} fill={fill} />
    </g>
  );
}

function Slate({ text }: { text: string }) {
  return (
    <text x="22" y="40" className="fs__mono" fill="rgba(238,235,227,.6)">
      {text}
    </text>
  );
}

function Skits() {
  return (
    <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="500" fill="#101010" />
      <g className="fs-skit-cam">
        <rect x="0" y="392" width="400" height="108" fill="#161616" />
        <Fig x={118} y={360} s={250} fill="#2b2b2b" />
        <g className="fs-skit-right">
          <path d="M213 460 Q216 270 292 266 Q368 270 372 460 Z" fill={Y} />
          <g className="fs-skit-head">
            <circle cx="292" cy="205" r="50" fill={Y} />
            <circle cx="276" cy="200" r="5" fill="#111" />
            <circle cx="306" cy="200" r="5" fill="#111" />
            <rect x="279" y="224" width="26" height="5" rx="2.5" fill="#111" />
          </g>
          <g className="fs-skit-bang">
            <rect x="286" y="104" width="12" height="40" rx="5" fill={BONE} />
            <circle cx="292" cy="158" r="7" fill={BONE} />
          </g>
        </g>
        <g className="fs-skit-bubble">
          <rect x="34" y="70" width="196" height="76" rx="14" fill={BONE} />
          <path d="M96 146 L108 166 L120 146 Z" fill={BONE} />
          <text x="132" y="104" textAnchor="middle" className="fs__display" fill="#111">
            CAN THE LOGO
          </text>
          <text x="132" y="132" textAnchor="middle" className="fs__display" fill="#111">
            BE BIGGER?
          </text>
        </g>
      </g>
      <rect className="fs-skit-whip" x="-200" y="0" width="200" height="500" fill="url(#fsWhip)" />
      <defs>
        <linearGradient id="fsWhip" x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".5" stopColor="#fff" stopOpacity=".9" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <Slate text="SKIT · SC 04 · TK 2" />
    </svg>
  );
}

function Vlogs() {
  const props = Array.from({ length: 2 });
  return (
    <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="500" fill="#0d0d0d" />
      <g className="fs-vlog-shake">
        {/* the studio passing by: lights, stands, a wall of boards */}
        <g className="fs-vlog-bg">
          {props.map((_, k) => (
            <g key={k} transform={`translate(${k * 400} 0)`}>
              <rect x="20" y="120" width="90" height="64" fill="#f2efe8" opacity=".85" />
              <rect x="62" y="184" width="5" height="190" fill="#2a2a2a" />
              <rect x="150" y="150" width="110" height="80" fill="#1d1d1d" />
              <rect x="160" y="160" width="40" height="28" fill={Y} opacity=".8" />
              <rect x="206" y="160" width="44" height="28" fill="#3a3a3a" />
              <rect x="160" y="194" width="90" height="26" fill="#3a3a3a" />
              <path d="M300 374 L330 250 L360 374" stroke="#333" strokeWidth="4" fill="none" />
              <rect x="312" y="226" width="40" height="26" rx="4" fill="#262626" />
            </g>
          ))}
        </g>
        <rect x="0" y="374" width="400" height="126" fill="#151515" />
        <g className="fs-vlog-lines">
          {Array.from({ length: 12 }).map((_, i) => (
            <rect key={i} x={i * 70} y="420" width="34" height="3" fill="#2c2c2c" />
          ))}
        </g>
        {/* someone walking ahead of the camera, looking back */}
        <g className="fs-vlog-walk">
          <path d="M152 500 Q156 318 210 314 Q264 318 268 500 Z" fill="#222" />
          <circle cx="210" cy="262" r="44" fill="#222" />
          <path d="M200 255 a10 10 0 0 0 20 0" stroke={Y} strokeWidth="4" fill="none" />
        </g>
      </g>
      <circle className="fs-rec" cx="30" cy="34" r="7" fill="#e5322d" />
      <text x="46" y="40" className="fs__mono" fill={BONE}>
        VLOG 12 · SHOOT DAY
      </text>
      <text x="378" y="476" textAnchor="end" className="fs__mono" fill="rgba(238,235,227,.7)">
        00:04:12
      </text>
    </svg>
  );
}

function Talking() {
  return (
    <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="500" fill="#0b0b0b" />
      <radialGradient id="fsKey" cx=".2" cy=".35" r=".6">
        <stop offset="0" stopColor="#f2efe8" stopOpacity=".28" />
        <stop offset="1" stopColor="#f2efe8" stopOpacity="0" />
      </radialGradient>
      <rect width="400" height="500" fill="url(#fsKey)" />
      <g className="fs-th-push">
        <path d="M70 500 Q76 330 200 322 Q324 330 330 500 Z" fill="#232323" />
        <circle cx="200" cy="232" r="72" fill="#2e2e2e" />
        <path d="M128 232 a72 72 0 0 1 72 -72" stroke="#cfcac0" strokeWidth="5" fill="none" opacity=".55" />
        <circle cx="216" cy="372" r="5" fill="#111" stroke={Y} strokeWidth="2" />
      </g>
      {/* framing guides and the focus box on the face */}
      <g stroke="rgba(238,235,227,.12)" strokeWidth="1">
        <line x1="133" y1="0" x2="133" y2="500" />
        <line x1="267" y1="0" x2="267" y2="500" />
        <line x1="0" y1="167" x2="400" y2="167" />
        <line x1="0" y1="333" x2="400" y2="333" />
      </g>
      <g className="fs-th-focus" stroke={Y} strokeWidth="3" fill="none">
        <path d="M140 172 v-22 h22" />
        <path d="M260 172 v-22 h-22" />
        <path d="M140 292 v22 h22" />
        <path d="M260 292 v22 h-22" />
      </g>
      <g className="fs-th-third">
        <rect x="22" y="398" width="6" height="52" fill={Y} />
        <text x="40" y="420" className="fs__display" fill={BONE}>
          THE STRATEGIST
        </text>
        <text x="40" y="444" className="fs__mono" fill="rgba(238,235,227,.7)">
          Why most hooks fail
        </text>
      </g>
      <g className="fs-meter">
        {Array.from({ length: 6 }).map((_, i) => (
          <rect key={i} x={340 + i * 8} y="430" width="5" height="40" fill={i > 3 ? Y : BONE} style={{ animationDelay: `${i * -0.13}s` }} />
        ))}
      </g>
      <Slate text="TALKING HEAD · A CAM" />
    </svg>
  );
}

function Podcast() {
  return (
    <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="500" fill="#0e0e0e" />
      <g className="fs-onair">
        <rect x="150" y="56" width="100" height="34" rx="6" fill="none" stroke="#e5322d" strokeWidth="3" />
        <text x="200" y="80" textAnchor="middle" className="fs__mono" fill="#e5322d">
          ON AIR
        </text>
      </g>
      {/* two people, two mics, a desk */}
      <g>
        <path d="M30 400 Q34 270 104 266 Q170 270 176 400 Z" fill="#262626" />
        <circle cx="104" cy="216" r="44" fill="#262626" />
        <path d="M58 214 a46 46 0 0 1 92 0" stroke="#111" strokeWidth="9" fill="none" />
        <rect x="52" y="204" width="14" height="28" rx="6" fill="#111" />
        <rect x="142" y="204" width="14" height="28" rx="6" fill="#111" />
        <path d="M224 400 Q230 270 296 266 Q366 270 370 400 Z" fill={Y} opacity=".92" />
        <circle cx="296" cy="216" r="44" fill={Y} opacity=".92" />
        <path d="M250 214 a46 46 0 0 1 92 0" stroke="#111" strokeWidth="9" fill="none" />
        <rect x="244" y="204" width="14" height="28" rx="6" fill="#111" />
        <rect x="334" y="204" width="14" height="28" rx="6" fill="#111" />
      </g>
      <g stroke="#3a3a3a" strokeWidth="5" fill="none">
        <path d="M150 380 L176 300 L168 262" />
        <path d="M250 380 L224 300 L232 262" />
      </g>
      <rect className="fs-mic fs-mic--a" x="156" y="232" width="22" height="40" rx="11" fill="#1b1b1b" />
      <rect className="fs-mic fs-mic--b" x="222" y="232" width="22" height="40" rx="11" fill="#1b1b1b" />
      <rect x="0" y="380" width="400" height="120" fill="#1a1612" />
      <g className="fs-wave">
        {Array.from({ length: 16 }).map((_, i) => (
          <rect key={i} className={i < 8 ? "fs-wave--a" : "fs-wave--b"} x={72 + i * 16} y="420" width="8" height="44" rx="3" fill={i < 8 ? BONE : Y} style={{ animationDelay: `${(i % 8) * -0.11}s` }} />
        ))}
      </g>
      <Slate text="PODCAST · EP 07" />
    </svg>
  );
}

function Pov() {
  return (
    <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="500" fill="#0a0a0a" />
      <g className="fs-pov-bob">
        {/* the corridor rushing at you */}
        <g stroke="#2a2a2a" strokeWidth="2">
          <line x1="200" y1="230" x2="-120" y2="520" />
          <line x1="200" y1="230" x2="520" y2="520" />
          <line x1="200" y1="230" x2="-120" y2="-60" />
          <line x1="200" y1="230" x2="520" y2="-60" />
        </g>
        <g className="fs-pov-rush" stroke="#3a3a3a" strokeWidth="3" fill="none">
          {[0, 1, 2].map((k) => (
            <rect key={k} className="fs-pov-ring" x="160" y="200" width="80" height="60" style={{ animationDelay: `${k * -0.9}s` }} />
          ))}
        </g>
        {/* the door at the end, lit yellow: the set */}
        <g className="fs-pov-door">
          <rect x="180" y="206" width="40" height="52" fill={Y} />
          <rect x="196" y="226" width="8" height="32" fill="#111" />
        </g>
        {/* your hands and the camera */}
        <path d="M60 500 Q78 420 132 404 L168 412 Q150 450 150 500 Z" fill="#c9a07c" />
        <path d="M340 500 Q322 420 268 404 L232 412 Q250 450 250 500 Z" fill="#c9a07c" />
        <rect x="140" y="380" width="120" height="78" rx="10" fill="#151515" />
        <circle cx="200" cy="420" r="26" fill="#0a0a0a" stroke="#2c2c2c" strokeWidth="6" />
        <circle cx="210" cy="410" r="6" fill="rgba(238,235,227,.35)" />
        <circle className="fs-rec" cx="244" cy="392" r="4" fill="#e5322d" />
      </g>
      <Slate text="POV · YOU'RE ON SET" />
    </svg>
  );
}
