import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { BONE, INK, Y } from "./textures";

/**
 * ACT 07's second half, painted: the raw footage on the edit's program monitor, the phone the
 * finished Reel is posted to, and the future BuzzLab Instagram page it lands on — a curated feed
 * of what BuzzLab could look like (originals, BTS, people, production, campaigns, experiments).
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
// raw footage (16:9) for the program monitor: no titles, just pictures and a timecode
// ---------------------------------------------------------------------------------------------
export function footageTextures() {
  const tc = (g: CanvasRenderingContext2D, w: number, h: number, clip: string, code: string) => {
    text(g, clip, 22, h - 22, 18, "rgba(238,235,227,.75)", 500, MONO);
    text(g, code, w - 22, h - 22, 18, "rgba(238,235,227,.75)", 500, MONO, "right");
  };
  const f = [
    // the set, wide: a softbox, the talent, a camera on sticks
    canvas(640, 360, (g, w, h) => {
      g.fillStyle = "#0c0c0c";
      g.fillRect(0, 0, w, h);
      softbox(g, 70, 60, 120, 90);
      person(g, w * 0.55, h * 0.78, 230, "#050505");
      g.fillStyle = "#151515";
      g.fillRect(w * 0.78, h * 0.36, 70, 46);
      g.fillRect(w * 0.83, h * 0.48, 6, h * 0.5);
      grain(g, w, h);
      tc(g, w, h, "A001_C004", "01:04:12:08");
    }),
    // the close-up, rim-lit in yellow
    canvas(640, 360, (g, w, h) => {
      g.fillStyle = "#070707";
      g.fillRect(0, 0, w, h);
      glow(g, w * 0.7, h * 0.4, 260, "rgba(249,254,2,.35)");
      person(g, w * 0.5, h * 1.08, 520, "#030303");
      g.strokeStyle = "rgba(249,254,2,.7)";
      g.lineWidth = 3;
      g.beginPath();
      g.arc(w * 0.5, h * 1.08 - 520 * 0.62, 520 * 0.2, -1.1, 0.4);
      g.stroke();
      grain(g, w, h);
      tc(g, w, h, "A002_C011", "01:09:47:21");
    }),
    // the crew between takes
    canvas(640, 360, (g, w, h) => {
      g.fillStyle = "#101010";
      g.fillRect(0, 0, w, h);
      glow(g, w * 0.5, h * 0.2, 300, "rgba(238,235,227,.14)");
      for (let i = 0; i < 5; i++) person(g, 90 + i * 115, h * 0.86 + (i % 2) * 14, 170, i === 2 ? "#d9d400" : "#1c1c1c");
      grain(g, w, h);
      tc(g, w, h, "B001_C002", "01:15:03:02");
    }),
    // the hero frame: the light behind him, the shot the edit was looking for
    canvas(640, 360, (g, w, h) => {
      g.fillStyle = "#0d0d0d";
      g.fillRect(0, 0, w, h);
      glow(g, w * 0.5, h * 0.42, 300, "rgba(249,254,2,.5)");
      person(g, w * 0.5, h * 0.92, 300, "#050505");
      grain(g, w, h);
      tc(g, w, h, "A003_C017", "01:22:30:16");
    }),
  ];
  return f.map(texOf);
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
export function profileTexture(T: Record<string, THREE.CanvasTexture>) {
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
    text(g, "Creative studio · Media", 240, 312, 26, "rgba(255,255,255,.55)", 500, SANS);
    text(g, "Original formats, every week", 240, 350, 26, "rgba(255,255,255,.55)", 500, SANS);
    // bio
    text(g, "We make things worth noticing.", 40, 440, 30, "#fff", 600, SANS);
    text(g, "Originals · BTS · People · Campaigns · Experiments", 40, 484, 26, "rgba(255,255,255,.8)", 500, SANS);
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
    ["BTS", "PEOPLE", "FORMATS", "SETS", "LAB"].forEach((l, i) => {
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
      "reelHero", "bts", "reelCrowd",
      "postPortrait", "reelTimer", "campaign",
      "thumb", "experiment", "people",
      "format", null, "meme",
      "clap", "story", "set",
      "script", "storyboard", "ad",
    ];
    const reels = new Set(["reelHero", "reelCrowd", "reelTimer", "story", "people"]);
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
      if (k && T[k]) cover(g, img(k), x, y, P.tileW, P.tileH);
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
