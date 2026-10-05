import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { BONE, INK, Y } from "./textures";

/**
 * ACT 07's second half: the reference footage (public/assets/act07) on the edit's program
 * monitor, the finished Reel, the phone it is posted to, and the BuzzLab Instagram page it lands
 * on — painted, a curated feed (originals, BTS, people, production, campaigns, experiments).
 */

const DISPLAY = '"Big Shoulders Display", "Arial Narrow", sans-serif';
const MONO = '"IBM Plex Mono", ui-monospace, monospace';
const SERIF = '"Bodoni Moda", Georgia, serif';
const SANS = '"Archivo", "Helvetica Neue", Arial, sans-serif';

type Painter = (g: CanvasRenderingContext2D, w: number, h: number) => void;

function canvas(w: number, h: number, paint: Painter) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  paint(c.getContext("2d")!, w, h);
  return c;
}
function texOf(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function text(g: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, color: string, weight = 800, font = DISPLAY, align: CanvasTextAlign = "left") {
  g.font = `${weight} ${size}px ${font}`;
  g.fillStyle = color;
  g.textAlign = align;
  g.textBaseline = "alphabetic";
  g.fillText(s, x, y);
}

function person(g: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  g.fillStyle = color;
  g.beginPath();
  g.arc(x, y - s * 0.62, s * 0.2, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.moveTo(x - s * 0.36, y + s * 0.4);
  g.quadraticCurveTo(x - s * 0.34, y - s * 0.32, x, y - s * 0.36);
  g.quadraticCurveTo(x + s * 0.34, y - s * 0.32, x + s * 0.36, y + s * 0.4);
  g.closePath();
  g.fill();
}

function grain(g: CanvasRenderingContext2D, w: number, h: number, a = 0.05) {
  for (let i = 0; i < (w * h) / 110; i++) {
    g.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a * 1.6})`;
    g.fillRect(Math.random() * w, Math.random() * h, 1.4, 1.4);
  }
}

function glow(g: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, color);
  gr.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gr;
  g.fillRect(x - r, y - r, r * 2, r * 2);
}

function softbox(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  glow(g, x + w / 2, y + h / 2, Math.max(w, h) * 1.4, "rgba(238,235,227,.22)");
  const lg = g.createLinearGradient(x, y, x, y + h);
  lg.addColorStop(0, "#f4f1ea");
  lg.addColorStop(1, "#c9c5bb");
  g.fillStyle = lg;
  g.fillRect(x, y, w, h);
  g.fillStyle = "#222";
  g.fillRect(x + w / 2 - 3, y + h, 6, h * 1.6);
}


// ---------------------------------------------------------------------------------------------
// cinematic stills: agency / production / film work, painted (no stock): light, haze, a car,
// a set, a lens — graded dark with BuzzLab yellow where the light is
// ---------------------------------------------------------------------------------------------
function vignette(g: CanvasRenderingContext2D, w: number, h: number, a = 0.75) {
  const v = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.75);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, `rgba(0,0,0,${a})`);
  g.fillStyle = v;
  g.fillRect(0, 0, w, h);
}
/** an anamorphic streak: a thin horizontal flare through a light */
function flare(g: CanvasRenderingContext2D, x: number, y: number, len: number, rgb: string, a = 0.8) {
  const lg = g.createLinearGradient(x - len, y, x + len, y);
  lg.addColorStop(0, `rgba(${rgb},0)`);
  lg.addColorStop(0.5, `rgba(${rgb},${a})`);
  lg.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = lg;
  g.fillRect(x - len, y - 1.5, len * 2, 3);
  glow(g, x, y, len * 0.18, `rgba(${rgb},${a * 0.9})`);
}
/** a car in profile facing right, length `L`, wheels on y */
function car(g: CanvasRenderingContext2D, x: number, y: number, L: number, body: string, rim = "rgba(238,235,227,.5)") {
  const P = (u: number, v: number): [number, number] => [x + u * L, y + v * L];
  g.fillStyle = body;
  g.beginPath();
  g.moveTo(...P(0, -0.05));
  g.lineTo(...P(0.01, -0.13));
  g.bezierCurveTo(...P(0.05, -0.19), ...P(0.13, -0.2), ...P(0.22, -0.21));
  g.bezierCurveTo(...P(0.32, -0.33), ...P(0.44, -0.37), ...P(0.56, -0.37));
  g.bezierCurveTo(...P(0.66, -0.36), ...P(0.73, -0.3), ...P(0.79, -0.23));
  g.bezierCurveTo(...P(0.9, -0.215), ...P(0.98, -0.19), ...P(1.0, -0.12));
  g.lineTo(...P(1.0, -0.05));
  g.closePath();
  g.fill();
  // the roof line catching the light
  g.strokeStyle = rim;
  g.lineWidth = Math.max(1, L * 0.006);
  g.beginPath();
  g.moveTo(...P(0.22, -0.21));
  g.bezierCurveTo(...P(0.32, -0.33), ...P(0.44, -0.37), ...P(0.56, -0.37));
  g.bezierCurveTo(...P(0.66, -0.36), ...P(0.73, -0.3), ...P(0.79, -0.23));
  g.stroke();
  for (const u of [0.2, 0.82]) {
    const [cx, cy] = P(u, -0.045);
    g.fillStyle = "#050505";
    g.beginPath();
    g.arc(cx, cy, L * 0.085, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "rgba(160,160,160,.35)";
    g.lineWidth = Math.max(1, L * 0.008);
    g.beginPath();
    g.arc(cx, cy, L * 0.055, 0, Math.PI * 2);
    g.stroke();
  }
}
function wetFloor(g: CanvasRenderingContext2D, w: number, h: number, y: number) {
  const lg = g.createLinearGradient(0, y, 0, h);
  lg.addColorStop(0, "#151515");
  lg.addColorStop(1, "#050505");
  g.fillStyle = lg;
  g.fillRect(0, y, w, h - y);
}
function label(g: CanvasRenderingContext2D, w: number, h: number, s: string) {
  text(g, s, 18, h - 18, 14, "rgba(238,235,227,.72)", 500, MONO);
}

export const STILLS: Record<string, Painter> = {
  // automotive: the car on wet asphalt at night, yellow light trails behind it
  night: (g, w, h) => {
    g.fillStyle = "#060606";
    g.fillRect(0, 0, w, h);
    glow(g, w * 0.7, h * 0.42, w * 0.7, "rgba(249,254,2,.16)");
    for (let i = 0; i < 6; i++) {
      const y = h * (0.48 + i * 0.012);
      const lg = g.createLinearGradient(0, y, w, y);
      lg.addColorStop(0, "rgba(249,254,2,0)");
      lg.addColorStop(0.6, `rgba(249,254,2,${0.5 - i * 0.07})`);
      lg.addColorStop(1, "rgba(255,245,190,.9)");
      g.fillStyle = lg;
      g.fillRect(0, y, w, 2);
    }
    wetFloor(g, w, h, h * 0.62);
    car(g, w * 0.12, h * 0.62, w * 0.76, "#0b0b0b", "rgba(249,254,2,.6)");
    flare(g, w * 0.86, h * 0.565, w * 0.45, "255,244,200", 0.9);
    flare(g, w * 0.14, h * 0.57, w * 0.12, "229,50,45", 0.8);
    // the reflection
    g.save();
    g.globalAlpha = 0.18;
    g.translate(0, h * 1.24);
    g.scale(1, -1);
    car(g, w * 0.12, h * 0.62, w * 0.76, "#111", "rgba(249,254,2,.4)");
    g.restore();
    grain(g, w, h, 0.05);
    vignette(g, w, h);
  },
  // brand film: a figure backlit in haze, an anamorphic flare across the frame
  brand: (g, w, h) => {
    g.fillStyle = "#0a0907";
    g.fillRect(0, 0, w, h);
    glow(g, w * 0.62, h * 0.36, w * 0.9, "rgba(255,226,150,.38)");
    flare(g, w * 0.62, h * 0.36, w * 0.7, "180,210,255", 0.55);
    person(g, w * 0.42, h * 0.92, h * 0.75, "#060504");
    grain(g, w, h, 0.06);
    vignette(g, w, h, 0.8);
    label(g, w, h, "BRAND FILM");
  },
  // BTS: the camera on a dolly, the crew in silhouette against a softbox
  bts: (g, w, h) => {
    g.fillStyle = "#0b0b0b";
    g.fillRect(0, 0, w, h);
    softbox(g, w * 0.55, h * 0.12, w * 0.36, h * 0.2);
    g.fillStyle = "#1a1a1a";
    g.fillRect(0, h * 0.83, w, 4);
    g.fillRect(0, h * 0.86, w, 4);
    g.fillStyle = "#070707";
    g.fillRect(w * 0.18, h * 0.6, w * 0.22, h * 0.1);
    g.fillRect(w * 0.27, h * 0.7, w * 0.04, h * 0.13);
    g.fillRect(w * 0.36, h * 0.62, w * 0.1, h * 0.05);
    person(g, w * 0.66, h * 0.98, h * 0.5, "#070707");
    person(g, w * 0.86, h * 1.02, h * 0.42, "#090909");
    g.fillStyle = "#e5322d";
    g.beginPath();
    g.arc(w * 0.22, h * 0.63, 4, 0, Math.PI * 2);
    g.fill();
    grain(g, w, h);
    vignette(g, w, h);
    label(g, w, h, "BTS · DAY 03");
  },
  // a product commercial: one bottle on a plinth, rim-lit
  product: (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#141310");
    bg.addColorStop(1, "#050505");
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    glow(g, w / 2, h * 0.42, w * 0.55, "rgba(249,254,2,.2)");
    g.fillStyle = "#0d0d0d";
    g.fillRect(w * 0.28, h * 0.72, w * 0.44, h * 0.3);
    g.fillStyle = "rgba(238,235,227,.08)";
    g.fillRect(w * 0.28, h * 0.72, w * 0.44, 3);
    g.fillStyle = "#050505";
    g.beginPath();
    g.roundRect(w * 0.4, h * 0.34, w * 0.2, h * 0.38, 18);
    g.fill();
    g.fillRect(w * 0.46, h * 0.26, w * 0.08, h * 0.1);
    g.strokeStyle = "rgba(249,254,2,.85)";
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(w * 0.602, h * 0.37);
    g.lineTo(w * 0.602, h * 0.7);
    g.stroke();
    g.strokeStyle = "rgba(238,235,227,.5)";
    g.beginPath();
    g.moveTo(w * 0.398, h * 0.37);
    g.lineTo(w * 0.398, h * 0.7);
    g.stroke();
    grain(g, w, h, 0.04);
    vignette(g, w, h);
    label(g, w, h, "COMMERCIAL");
  },
  // aerial: a road from above at night, light trails
  aerial: (g, w, h) => {
    g.fillStyle = "#070707";
    g.fillRect(0, 0, w, h);
    g.save();
    g.translate(w / 2, h / 2);
    g.rotate(-0.5);
    g.fillStyle = "#121212";
    g.fillRect(-w * 0.16, -h, w * 0.32, h * 2);
    for (const [x, c] of [[-0.08, "249,254,2"], [-0.04, "255,240,200"], [0.05, "229,50,45"], [0.09, "229,50,45"]] as [number, string][]) {
      const lg = g.createLinearGradient(0, -h, 0, h);
      lg.addColorStop(0, `rgba(${c},0)`);
      lg.addColorStop(0.5, `rgba(${c},.85)`);
      lg.addColorStop(1, `rgba(${c},0)`);
      g.fillStyle = lg;
      g.fillRect(x * w, -h, 2.5, h * 2);
    }
    g.restore();
    for (let i = 0; i < 40; i++) {
      g.fillStyle = `rgba(255,${200 + (i % 3) * 20},120,${0.2 + (i % 5) * 0.08})`;
      g.fillRect(((i * 97) % w), ((i * 61) % h), 2, 2);
    }
    grain(g, w, h);
    vignette(g, w, h);
    label(g, w, h, "AERIAL · NIGHT");
  },
  // a portrait, rim-lit from behind
  portrait: (g, w, h) => {
    g.fillStyle = "#080808";
    g.fillRect(0, 0, w, h);
    glow(g, w * 0.85, h * 0.3, w * 0.8, "rgba(249,254,2,.22)");
    person(g, w * 0.5, h * 1.02, h * 0.8, "#0d0c0a");
    g.strokeStyle = "rgba(249,254,2,.75)";
    g.lineWidth = 3;
    g.beginPath();
    g.arc(w * 0.5, h * 1.02 - h * 0.8 * 0.62, h * 0.8 * 0.2, -1.2, 0.6);
    g.stroke();
    grain(g, w, h, 0.06);
    vignette(g, w, h);
    label(g, w, h, "MEET THE DOP");
  },
  // the grade: before / after, split down the middle
  grade: (g, w, h) => {
    STILLS.night(g, w, h);
    g.save();
    g.beginPath();
    g.rect(0, 0, w * 0.5, h);
    g.clip();
    g.fillStyle = "rgba(120,120,120,.55)";
    g.globalCompositeOperation = "saturation";
    g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = "source-over";
    g.fillStyle = "rgba(90,90,95,.35)";
    g.fillRect(0, 0, w * 0.5, h);
    g.restore();
    g.fillStyle = Y;
    g.fillRect(w * 0.5 - 1, 0, 2, h);
    text(g, "LOG", 18, 34, 15, BONE, 500, MONO);
    text(g, "GRADED", w - 18, 34, 15, Y, 500, MONO, "right");
  },
  // the director at the monitor, the image glowing back at them
  director: (g, w, h) => {
    g.fillStyle = "#090909";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#151515";
    g.fillRect(w * 0.12, h * 0.22, w * 0.5, h * 0.3);
    const scr = g.createLinearGradient(w * 0.14, 0, w * 0.6, 0);
    scr.addColorStop(0, "#1a1606");
    scr.addColorStop(1, "#5a5410");
    g.fillStyle = scr;
    g.fillRect(w * 0.14, h * 0.24, w * 0.46, h * 0.26);
    glow(g, w * 0.4, h * 0.38, w * 0.6, "rgba(249,254,2,.12)");
    person(g, w * 0.74, h * 0.98, h * 0.55, "#050505");
    g.fillStyle = "#050505";
    g.fillRect(w * 0.34, h * 0.52, 6, h * 0.48);
    grain(g, w, h);
    vignette(g, w, h);
    label(g, w, h, "DIRECTOR'S MONITOR");
  },
  // a slate in the dark, a beam of light
  slate: (g, w, h) => {
    g.fillStyle = "#070707";
    g.fillRect(0, 0, w, h);
    glow(g, w * 0.5, h * 0.2, w * 0.8, "rgba(238,235,227,.12)");
    g.save();
    g.translate(w * 0.5, h * 0.58);
    g.rotate(-0.12);
    g.fillStyle = "#121212";
    g.fillRect(-w * 0.34, -h * 0.1, w * 0.68, h * 0.26);
    g.fillStyle = "#e9e5dc";
    for (let i = 0; i < 6; i++) {
      g.save();
      g.translate(-w * 0.34 + i * w * 0.12, -h * 0.16);
      g.transform(1, 0, -0.5, 1, 0, 0);
      g.fillRect(w * 0.06, 0, w * 0.06, h * 0.06);
      g.restore();
    }
    text(g, "BUZZLAB", -w * 0.3, -h * 0.02, 20, BONE, 800);
    text(g, "SC 12  TK 37", -w * 0.3, h * 0.08, 18, Y, 500, MONO);
    g.restore();
    grain(g, w, h);
    vignette(g, w, h);
  },
  // yellow tubes in a black studio
  neon: (g, w, h) => {
    g.fillStyle = "#050505";
    g.fillRect(0, 0, w, h);
    for (const [x, y, len, a] of [[0.22, 0.18, 0.62, 0.15], [0.62, 0.3, 0.5, -0.2], [0.78, 0.1, 0.7, 0.05]] as number[][]) {
      g.save();
      g.translate(w * x, h * y);
      g.rotate(a);
      g.shadowColor = "rgba(249,254,2,.9)";
      g.shadowBlur = 28;
      g.fillStyle = "#fbff7a";
      g.fillRect(-4, 0, 8, h * len);
      g.restore();
    }
    person(g, w * 0.48, h * 0.98, h * 0.42, "#020202");
    grain(g, w, h);
    vignette(g, w, h, 0.6);
    label(g, w, h, "SET DESIGN");
  },
  // the edit bay: a timeline glowing in the dark
  edit: (g, w, h) => {
    g.fillStyle = "#070707";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#101010";
    g.fillRect(w * 0.06, h * 0.2, w * 0.88, h * 0.5);
    for (let t = 0; t < 4; t++) {
      let x = w * 0.08;
      let k = 0;
      while (x < w * 0.9) {
        const len = 20 + ((t * 13 + k * 29) % 60);
        g.fillStyle = t === 1 && k % 3 === 1 ? Y : t < 2 ? "#cfcbc2" : "#3a3a3a";
        g.fillRect(x, h * (0.44 + t * 0.055), len - 3, h * 0.04);
        x += len;
        k++;
      }
    }
    g.fillStyle = Y;
    g.fillRect(w * 0.52, h * 0.24, 2, h * 0.44);
    glow(g, w / 2, h * 0.45, w * 0.7, "rgba(249,254,2,.08)");
    grain(g, w, h);
    vignette(g, w, h);
    label(g, w, h, "THE EDIT · V07");
  },
  // a lens, the set reflected in its glass
  lens: (g, w, h) => {
    g.fillStyle = "#060606";
    g.fillRect(0, 0, w, h);
    const cx = w * 0.5;
    const cy = h * 0.48;
    const r = Math.min(w, h) * 0.36;
    g.fillStyle = "#111";
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.fill();
    const glass = g.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.05, cx, cy, r * 0.8);
    glass.addColorStop(0, "rgba(120,150,255,.5)");
    glass.addColorStop(0.4, "rgba(40,30,80,.6)");
    glass.addColorStop(0.75, "rgba(249,254,2,.25)");
    glass.addColorStop(1, "rgba(0,0,0,.9)");
    g.fillStyle = glass;
    g.beginPath();
    g.arc(cx, cy, r * 0.8, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "#2a2a2a";
    g.lineWidth = 6;
    g.beginPath();
    g.arc(cx, cy, r * 0.9, 0, Math.PI * 2);
    g.stroke();
    grain(g, w, h);
    vignette(g, w, h);
    label(g, w, h, "35MM · T1.5");
  },
  // a podcast set: two chairs, two mics, a key light
  pod: (g, w, h) => {
    g.fillStyle = "#0a0908";
    g.fillRect(0, 0, w, h);
    glow(g, w * 0.5, h * 0.3, w * 0.7, "rgba(255,210,140,.16)");
    for (const x of [0.28, 0.72]) {
      g.fillStyle = "#050505";
      g.beginPath();
      g.roundRect(w * x - w * 0.12, h * 0.55, w * 0.24, h * 0.22, 12);
      g.fill();
      g.strokeStyle = "#2a2a2a";
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(w * 0.5, h * 0.4);
      g.lineTo(w * x, h * 0.48);
      g.stroke();
      g.fillStyle = Y;
      g.beginPath();
      g.roundRect(w * x - 6, h * 0.46, 12, 22, 6);
      g.fill();
    }
    grain(g, w, h);
    vignette(g, w, h);
    label(g, w, h, "THE BUZZLAB PODCAST");
  },
};

// ---------------------------------------------------------------------------------------------
// the edit's footage: the reference pictures (public/assets/act07), loaded once
// ---------------------------------------------------------------------------------------------
const pics = new Map<string, Promise<HTMLImageElement>>();
function pic(src: string) {
  let p = pics.get(src);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const i = new Image();
      i.decoding = "async";
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = src;
    });
    pics.set(src, p);
  }
  return p;
}

/** a canvas texture that is dark until its picture arrives, then painted with it */
function picTex(w: number, h: number, src: string, paint: (g: CanvasRenderingContext2D, w: number, h: number, img: HTMLImageElement) => void) {
  const c = canvas(w, h, (g) => {
    g.fillStyle = "#050505";
    g.fillRect(0, 0, w, h);
  });
  const t = texOf(c);
  pic(src)
    .then((img) => {
      paint(c.getContext("2d")!, w, h, img);
      t.needsUpdate = true;
    })
    .catch(() => {});
  return t;
}

/** the footage the edit cuts through (with each one's shape) */
const FOOTAGE: [string, number][] = [
  ["/assets/act07/post-07.jpg", 735 / 919],
  ["/assets/act07/post-04.jpg", 736 / 946],
  ["/assets/act07/post-06.jpg", 736 / 1308],
  ["/assets/act07/post-01.jpg", 1200 / 1500],
  ["/assets/act07/post-05.jpg", 736 / 1308],
  ["/assets/act07/post-03.jpg", 736 / 920],
  ["/assets/act07/post-08.jpg", 736 / 1308],
];

/** the program monitor (16:9): the vertical footage as the editor sees it, pillarboxed, timecoded,
 *  then the shot the edit was looking for — the night run */
export function footageTextures() {
  const cuts = FOOTAGE.map(([src], i) =>
    picTex(640, 360, src, (g, w, h, img) => {
      const fw = (h * img.width) / img.height;
      g.drawImage(img, (w - fw) / 2, 0, fw, h);
      g.strokeStyle = "rgba(238,235,227,.16)";
      g.lineWidth = 1;
      g.strokeRect((w - fw) / 2 + 0.5, 0.5, fw - 1, h - 1);
      text(g, `A00${(i % 3) + 1}_C0${String(4 + i * 3).padStart(2, "0")}`, 22, h - 22, 18, "rgba(238,235,227,.75)", 500, MONO);
      text(g, `01:${String(4 + i * 3).padStart(2, "0")}:${String((i * 17) % 60).padStart(2, "0")}:${String((i * 7) % 24).padStart(2, "0")}`, w - 22, h - 22, 18, "rgba(238,235,227,.75)", 500, MONO, "right");
    }),
  );
  const night = texOf(
    canvas(640, 360, (g, w, h) => {
      STILLS.night(g, w, h);
      text(g, "A003_C017", 22, h - 22, 18, "rgba(238,235,227,.75)", 500, MONO);
      text(g, "01:22:30:16", w - 22, h - 22, 18, "rgba(238,235,227,.75)", 500, MONO, "right");
    }),
  );
  return [...cuts, night];
}

/** the same footage as cards, for the clips that fly out of the camera onto the timeline */
export function footageTiles() {
  return FOOTAGE.map(([src, a]) => ({ tex: picTex(360, Math.round(360 / a), src, (g, w, h, img) => cover(g, img, 0, 0, w, h)), w: a >= 0.7 ? 1.2 : 0.9, h: a >= 0.7 ? 1.2 / a : 1.6 }));
}

/** the finished Reel (9:16): the night run, graded, with a quiet title */
export function heroReel() {
  return texOf(
    canvas(540, 960, (g, w, h) => {
      g.fillStyle = "#050505";
      g.fillRect(0, 0, w, h);
      STILLS.night(g, w, h);
      const top = g.createLinearGradient(0, 0, 0, h * 0.3);
      top.addColorStop(0, "rgba(0,0,0,.7)");
      top.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = top;
      g.fillRect(0, 0, w, h * 0.3);
      text(g, "NIGHT RUN", 34, 132, 76, BONE);
      text(g, "A BUZZLAB FILM", 36, 170, 20, Y, 500, MONO);
      grain(g, w, h, 0.04);
    }),
  );
}

// ---------------------------------------------------------------------------------------------
// the phone
// ---------------------------------------------------------------------------------------------
export const PHONE = { sw: 1.8, sh: 3.9 };

export function phone() {
  const g = new THREE.Group();
  const { sw, sh } = PHONE;
  const body = new THREE.Mesh(new RoundedBoxGeometry(sw + 0.16, sh + 0.16, 0.12, 8, 0.24), new THREE.MeshStandardMaterial({ color: 0x1b1b1d, roughness: 0.32, metalness: 0.75 }));
  body.position.z = -0.065;
  const rim = new THREE.Mesh(new RoundedBoxGeometry(sw + 0.2, sh + 0.2, 0.08, 8, 0.26), new THREE.MeshStandardMaterial({ color: 0x77757a, roughness: 0.28, metalness: 0.9 }));
  rim.position.z = -0.07;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), new THREE.MeshBasicMaterial({ color: 0x000000 }));
  screen.position.z = 0.0;
  const island = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.12, 0.01, 4, 0.06), new THREE.MeshBasicMaterial({ color: 0x000000 }));
  island.position.set(0, sh / 2 - 0.13, 0.012);
  g.add(rim, body, screen, island);
  return g;
}

// ---------------------------------------------------------------------------------------------
// the future BuzzLab Instagram page
// ---------------------------------------------------------------------------------------------
/** canvas layout of the scrolling page (px; the page is 900 wide, the screen shows 1950 of it) */
export const PROFILE = { cw: 900, view: 1950, header: 980, cell: 301, tileW: 298, tileH: 398, rows: 6, hero: { row: 3, col: 1 } };
export const PROFILE_H = PROFILE.header + PROFILE.rows * (PROFILE.tileH + 3);

/** where a grid cell sits in the page (px, centre) */
export function cellAt(row: number, col: number) {
  return { x: col * PROFILE.cell + PROFILE.tileW / 2, y: PROFILE.header + row * (PROFILE.tileH + 3) + PROFILE.tileH / 2 };
}

function cover(g: CanvasRenderingContext2D, img: CanvasImageSource & { width: number; height: number }, x: number, y: number, w: number, h: number) {
  const s = Math.max(w / img.width, h / img.height);
  const sw = w / s;
  const sh = h / s;
  g.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
}

function reelMark(g: CanvasRenderingContext2D, x: number, y: number) {
  g.fillStyle = "rgba(255,255,255,.92)";
  g.beginPath();
  g.moveTo(x - 9, y - 11);
  g.lineTo(x + 11, y);
  g.lineTo(x - 9, y + 11);
  g.closePath();
  g.fill();
}

const extraTiles: Record<string, Painter> = {
  bts: (g, w, h) => {
    g.fillStyle = "#0b0b0b";
    g.fillRect(0, 0, w, h);
    softbox(g, w * 0.08, h * 0.12, w * 0.34, h * 0.2);
    person(g, w * 0.62, h * 0.86, w * 0.75, "#050505");
    g.fillStyle = Y;
    g.beginPath();
    g.arc(26, h - 40, 7, 0, Math.PI * 2);
    g.fill();
    text(g, "BTS · 04:12 AM", 42, h - 33, 18, BONE, 500, MONO);
    grain(g, w, h);
  },
  people: (g, w, h) => {
    g.fillStyle = "#151515";
    g.fillRect(0, 0, w, h);
    glow(g, w * 0.5, h * 0.4, w * 0.8, "rgba(238,235,227,.12)");
    person(g, w * 0.5, h * 0.9, w * 0.9, "#e9e100");
    g.fillStyle = "#050505";
    g.beginPath();
    g.arc(w * 0.5, h * 0.9 - w * 0.9 * 0.62, w * 0.9 * 0.2, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "#050505";
    g.lineWidth = 10;
    g.beginPath();
    g.arc(w * 0.5, h * 0.9 - w * 0.9 * 0.62, w * 0.9 * 0.24, Math.PI * 1.05, Math.PI * 1.95);
    g.stroke();
    text(g, "Meet the editor.", 22, 52, 34, BONE, 700, SERIF);
    grain(g, w, h);
  },
  format: (g, w, h) => {
    g.fillStyle = INK;
    g.fillRect(0, 0, w, h);
    text(g, "BUZZLAB", 22, 120, 74, BONE);
    text(g, "BREAKDOWN", 22, 190, 74, BONE);
    g.fillStyle = Y;
    g.fillRect(22, 224, 104, 40);
    text(g, "EP. 04", 32, 254, 26, INK, 800);
    text(g, "How the 9-second hook was built", 22, h - 36, 16, "rgba(238,235,227,.7)", 500, MONO);
  },
  experiment: (g, w, h) => {
    g.fillStyle = BONE;
    g.fillRect(0, 0, w, h);
    g.fillStyle = Y;
    g.beginPath();
    g.arc(w * 0.5, h * 0.45, w * 0.36, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = INK;
    g.beginPath();
    g.arc(w * 0.62, h * 0.4, w * 0.08, 0, Math.PI * 2);
    g.fill();
    text(g, "A REEL THAT LASTS", 22, h - 70, 30, INK);
    text(g, "ONE SECOND.", 22, h - 32, 30, INK);
  },
  clap: (g, w, h) => {
    g.fillStyle = "#121212";
    g.fillRect(0, 0, w, h);
    g.save();
    g.translate(w * 0.5, h * 0.5);
    g.rotate(-0.08);
    g.fillStyle = "#e9e5dc";
    g.fillRect(-110, -50, 220, 140);
    g.fillStyle = INK;
    for (let i = 0; i < 6; i++) {
      g.save();
      g.translate(-110 + i * 40, -80);
      g.transform(1, 0, -0.5, 1, 0, 0);
      g.fillRect(20, 0, 20, 26);
      g.restore();
    }
    g.fillStyle = INK;
    g.fillRect(-110, -80, 220, 3);
    text(g, "SCENE 12", -96, -8, 30, INK);
    text(g, "TAKE 37", -96, 34, 30, INK);
    text(g, "BUZZLAB", -96, 74, 16, "#555", 500, MONO);
    g.restore();
    grain(g, w, h);
  },
  set: (g, w, h) => {
    g.fillStyle = "#0e0e0e";
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(249,254,2,.85)";
    g.lineWidth = 4;
    g.beginPath();
    g.ellipse(w * 0.5, h * 0.72, w * 0.4, h * 0.08, 0, 0, Math.PI * 2);
    g.stroke();
    for (let i = 0; i < 4; i++) person(g, w * (0.24 + i * 0.17), h * 0.72, 90, i === 1 ? Y : "#2a2a2a");
    softbox(g, w * 0.66, h * 0.16, 60, 44);
    text(g, "DAY ONE ON SET", 22, 52, 34, BONE);
    grain(g, w, h);
  },
  campaign: (g, w, h) => {
    g.fillStyle = Y;
    g.fillRect(0, 0, w, h);
    text(g, "MADE TO BE", 22, 92, 56, INK);
    text(g, "NOTICED.", 22, 148, 56, INK);
    g.fillStyle = INK;
    g.fillRect(22, h - 120, w - 44, 4);
    text(g, "CAMPAIGN — FOR A CLIENT", 22, h - 84, 15, INK, 500, MONO);
    text(g, "Shot in one day.", 22, h - 52, 26, INK, 600, SERIF);
  },
};

/**
 * The page: header (name, bio, highlights) and a 3-column grid. `T` are the machine's content
 * textures; the hero cell is left dark — the selected post is a live mesh laid over it.
 */
export function profileTexture(T: Record<string, THREE.CanvasTexture>, hero?: HTMLCanvasElement) {
  const P = PROFILE;
  const c = canvas(P.cw, PROFILE_H, (g, w) => {
    g.fillStyle = "#000";
    g.fillRect(0, 0, w, PROFILE_H);
    // avatar: the yellow dot
    const ax = 120;
    const ay = 290;
    g.strokeStyle = Y;
    g.lineWidth = 6;
    g.beginPath();
    g.arc(ax, ay, 86, 0, Math.PI * 2);
    g.stroke();
    g.fillStyle = "#0b0b0b";
    g.beginPath();
    g.arc(ax, ay, 76, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = Y;
    g.beginPath();
    g.arc(ax, ay, 30, 0, Math.PI * 2);
    g.fill();
    text(g, "BuzzLab", 240, 268, 44, "#fff", 800, SANS);
    text(g, "Creative agency · Production · Media", 240, 312, 26, "rgba(255,255,255,.55)", 500, SANS);
    text(g, "Films, campaigns and the people who make them", 240, 350, 26, "rgba(255,255,255,.55)", 500, SANS);
    // bio
    text(g, "We make things worth noticing.", 40, 440, 30, "#fff", 600, SANS);
    text(g, "Brand films · Automotive · Commercials · BTS · Originals", 40, 484, 26, "rgba(255,255,255,.8)", 500, SANS);
    text(g, "▶  New every Friday: Who's Behind the Camera?", 40, 528, 26, Y, 600, SANS);
    // buttons
    const btn = (x: number, bw: number, label: string, bg: string, fg: string) => {
      g.fillStyle = bg;
      g.beginPath();
      g.roundRect(x, 572, bw, 70, 16);
      g.fill();
      text(g, label, x + bw / 2, 618, 28, fg, 700, SANS, "center");
    };
    btn(40, 390, "Follow", Y, INK);
    btn(446, 330, "Message", "#262626", "#fff");
    btn(792, 68, "▾", "#262626", "#fff");
    // highlights
    ["FILMS", "BTS", "PEOPLE", "SETS", "LAB"].forEach((l, i) => {
      const x = 92 + i * 180;
      g.strokeStyle = "rgba(255,255,255,.35)";
      g.lineWidth = 3;
      g.beginPath();
      g.arc(x, 740, 58, 0, Math.PI * 2);
      g.stroke();
      g.fillStyle = i === 0 ? "#1a1a1a" : i === 1 ? "#d9d400" : "#141414";
      g.beginPath();
      g.arc(x, 740, 50, 0, Math.PI * 2);
      g.fill();
      if (i !== 1) {
        g.fillStyle = i === 2 ? Y : "rgba(238,235,227,.8)";
        g.beginPath();
        g.arc(x, 740, 12 + i * 2, 0, Math.PI * 2);
        g.fill();
      }
      text(g, l, x, 840, 22, "#fff", 500, SANS, "center");
    });
    // tabs
    g.fillStyle = "rgba(255,255,255,.12)";
    g.fillRect(0, 966, w, 2);
    g.fillStyle = "#fff";
    g.fillRect(0, 963, w / 3, 4);
    const ic = (x: number, on: boolean) => {
      g.strokeStyle = on ? "#fff" : "rgba(255,255,255,.45)";
      g.lineWidth = 4;
      g.strokeRect(x - 22, 900, 44, 44);
    };
    ic(w / 6, true);
    ic(w / 2, false);
    ic((w * 5) / 6, false);
    // the grid
    const img = (k: string) => (T[k].image as HTMLCanvasElement);
    const cells: (string | null)[] = [
      "heroReel", "bts", "brand",
      "night", "product", "campaign",
      "aerial", "portrait", "grade",
      "director", null, "neon",
      "slate", "edit", "lens",
      "pod", "set", "experiment",
    ];
    const reels = new Set(["heroReel", "brand", "night", "aerial", "edit", "bts"]);
    cells.forEach((k, i) => {
      const r = Math.floor(i / 3);
      const col = i % 3;
      const x = col * P.cell;
      const y = P.header + r * (P.tileH + 3);
      g.save();
      g.beginPath();
      g.rect(x, y, P.tileW, P.tileH);
      g.clip();
      g.fillStyle = "#0a0a0a";
      g.fillRect(x, y, P.tileW, P.tileH);
      if (k === "heroReel" && hero) cover(g, hero, x, y, P.tileW, P.tileH);
      else if (k && STILLS[k]) {
        g.translate(x, y);
        STILLS[k](g, P.tileW, P.tileH);
      } else if (k && T[k]) cover(g, img(k), x, y, P.tileW, P.tileH);
      else if (k && extraTiles[k]) {
        g.translate(x, y);
        extraTiles[k](g, P.tileW, P.tileH);
      }
      g.restore();
      if (k && reels.has(k)) reelMark(g, x + P.tileW - 26, y + 28);
    });
  });
  const t = texOf(c);
  t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

/** the fixed bars over the page: status bar + the account name on top, the tab bar below */
export function profileBars() {
  const top = canvas(900, 190, (g, w, h) => {
    g.fillStyle = "#000";
    g.fillRect(0, 0, w, h);
    text(g, "9:41", 70, 62, 30, "#fff", 700, SANS);
    g.fillStyle = "#fff";
    for (let i = 0; i < 4; i++) g.fillRect(690 + i * 12, 54 - i * 7, 8, 8 + i * 7);
    g.strokeStyle = "#fff";
    g.lineWidth = 3;
    g.strokeRect(760, 36, 52, 26);
    g.fillRect(764, 40, 38, 18);
    text(g, "buzzlab.global", 40, 160, 40, "#fff", 800, SANS);
    g.strokeStyle = "#fff";
    g.lineWidth = 4;
    g.strokeRect(728, 124, 40, 40);
    for (let i = 0; i < 3; i++) g.fillRect(806, 128 + i * 14, 52, 4);
  });
  const nav = canvas(900, 130, (g, w) => {
    g.fillStyle = "#000";
    g.fillRect(0, 0, w, 130);
    g.fillStyle = "rgba(255,255,255,.12)";
    g.fillRect(0, 0, w, 2);
    g.strokeStyle = "#fff";
    g.lineWidth = 4;
    const xs = [90, 270, 450, 630, 810];
    // home, search, new, reels, profile (active)
    g.beginPath();
    g.moveTo(xs[0] - 24, 70);
    g.lineTo(xs[0], 46);
    g.lineTo(xs[0] + 24, 70);
    g.lineTo(xs[0] + 24, 90);
    g.lineTo(xs[0] - 24, 90);
    g.closePath();
    g.stroke();
    g.beginPath();
    g.arc(xs[1] - 4, 64, 18, 0, Math.PI * 2);
    g.moveTo(xs[1] + 9, 77);
    g.lineTo(xs[1] + 24, 92);
    g.stroke();
    g.strokeRect(xs[2] - 22, 46, 44, 44);
    g.fillRect(xs[2] - 12, 66, 24, 4);
    g.fillRect(xs[2] - 2, 56, 4, 24);
    g.strokeRect(xs[3] - 22, 46, 44, 44);
    g.strokeStyle = Y;
    g.beginPath();
    g.arc(xs[4], 68, 24, 0, Math.PI * 2);
    g.stroke();
    g.fillStyle = Y;
    g.beginPath();
    g.arc(xs[4], 68, 9, 0, Math.PI * 2);
    g.fill();
  });
  return { top: texOf(top), nav: texOf(nav) };
}

/** "Posting…" → "Shared" under the finished Reel */
export function postedTag() {
  return texOf(
    canvas(512, 96, (g, w, h) => {
      g.fillStyle = "rgba(0,0,0,0)";
      g.clearRect(0, 0, w, h);
      g.fillStyle = "#0b0b0b";
      g.beginPath();
      g.roundRect(4, 8, w - 8, h - 16, 40);
      g.fill();
      g.fillStyle = Y;
      g.beginPath();
      g.arc(52, h / 2, 22, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = INK;
      g.lineWidth = 6;
      g.beginPath();
      g.moveTo(41, h / 2);
      g.lineTo(50, h / 2 + 9);
      g.lineTo(64, h / 2 - 9);
      g.stroke();
      text(g, "Shared to @buzzlab.global", 92, h / 2 + 10, 28, BONE, 600, SANS);
    }),
  );
}
