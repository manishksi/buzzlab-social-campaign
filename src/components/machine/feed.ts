import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { BONE, INK, Y } from "./textures";

/**
 * ACT 07's second half, from real pictures (public/assets/act07): BuzzLab's own footage on the
 * edit's program monitor, the phone the finished Reel is posted to, and the BuzzLab Instagram page
 * it lands on — the work it could be known for, with the post the page stops on.
 */

const DISPLAY = '"Big Shoulders Display", "Arial Narrow", sans-serif';
const MONO = '"IBM Plex Mono", ui-monospace, monospace';
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

// ---------------------------------------------------------------------------------------------
// the pictures: BuzzLab's own footage in the edit, the work on the page
// ---------------------------------------------------------------------------------------------
const pics = new Map<string, Promise<HTMLImageElement>>();
/** a picture from /public, fetched once however many textures paint it */
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

/** a canvas texture that is dark until its pictures arrive, then painted with them */
function picTex(w: number, h: number, srcs: string[], paint: (g: CanvasRenderingContext2D, w: number, h: number, imgs: HTMLImageElement[]) => void) {
  const c = canvas(w, h, (g) => {
    g.fillStyle = "#050505";
    g.fillRect(0, 0, w, h);
  });
  const t = texOf(c);
  Promise.all(srcs.map(pic))
    .then((imgs) => {
      paint(c.getContext("2d")!, w, h, imgs);
      t.needsUpdate = true;
    })
    .catch(() => {});
  return t;
}

/** the edit: three frames of "The creative mind" (Phase 01, video 02), then the frame its Reel opens on */
const REEL = "/assets/act07/reel.jpg";
const CUTS = ["/assets/act07/cut-1.jpg", "/assets/act07/cut-2.jpg", "/assets/act07/cut-3.jpg", REEL];

// ---------------------------------------------------------------------------------------------
// the program monitor (16:9): the vertical footage as the editor sees it, pillarboxed, timecoded
// ---------------------------------------------------------------------------------------------
export function footageTextures() {
  const codes = [
    ["A001_C004", "01:04:12:08"],
    ["A002_C011", "01:09:47:21"],
    ["B001_C002", "01:15:03:02"],
    ["A003_C017", "01:22:30:16"],
  ];
  return CUTS.map((src, i) =>
    picTex(640, 360, [src], (g, w, h, [img]) => {
      const fw = (h * img.width) / img.height;
      g.drawImage(img, (w - fw) / 2, 0, fw, h);
      g.strokeStyle = "rgba(238,235,227,.16)";
      g.lineWidth = 1;
      g.strokeRect((w - fw) / 2 + 0.5, 0.5, fw - 1, h - 1);
      text(g, codes[i][0], 22, h - 22, 18, "rgba(238,235,227,.75)", 500, MONO);
      text(g, codes[i][1], w - 22, h - 22, 18, "rgba(238,235,227,.75)", 500, MONO, "right");
    }),
  );
}

/** the finished Reel (9:16) */
export function heroReel() {
  return picTex(540, 960, [REEL], (g, w, h, [img]) => cover(g, img, 0, 0, w, h));
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
export const PROFILE = { cw: 900, view: 1950, header: 980, cell: 301, tileW: 298, tileH: 398, rows: 4, hero: { row: 2, col: 1 } };
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

/**
 * The page: header (name, bio, highlights) and a 3-column grid of real work, newest first: the
 * Reel just posted, eight posts, and the Phase 01 videos at the bottom. The post the page stops
 * on (row 2, the middle: the yellow world) is a post of its own — a live mesh laid over its cell.
 */
const GRID = [
  REEL, "/assets/act07/post-01.jpg", "/assets/act07/post-02.jpg",
  "/assets/act07/post-03.jpg", "/assets/act07/post-04.jpg", "/assets/act07/post-05.jpg",
  "/assets/act07/post-06.jpg", null, "/assets/act07/post-07.jpg",
  "/assets/act07/post-08.jpg", "/assets/video/phase01-03.jpg", "/assets/video/phase01-04.jpg",
];

export function profileTexture() {
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
  });
  const t = texOf(c);
  const g = c.getContext("2d")!;
  GRID.forEach((src, i) => {
    const x = (i % 3) * P.cell;
    const y = P.header + Math.floor(i / 3) * (P.tileH + 3);
    g.fillStyle = "#0a0a0a";
    g.fillRect(x, y, P.tileW, P.tileH);
    if (!src) return;
    pic(src)
      .then((img) => {
        cover(g, img, x, y, P.tileW, P.tileH);
        reelMark(g, x + P.tileW - 26, y + 28);
        t.needsUpdate = true;
      })
      .catch(() => {});
  });
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
