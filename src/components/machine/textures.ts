import * as THREE from "three";

/**
 * Every piece of "content" in the machine is painted here on a canvas: reels, posts, thumbnails,
 * memes, ads, stories, script pages, a storyboard, the REC readout. Black, off-white, BuzzLab yellow.
 */

export const Y = "#f9fe02";
export const BONE = "#eeebe3";
export const INK = "#050505";
const DISPLAY = '"Big Shoulders Display", "Arial Narrow", sans-serif';
const MONO = '"IBM Plex Mono", ui-monospace, monospace';
const SERIF = '"Bodoni Moda", Georgia, serif';

type Painter = (g: CanvasRenderingContext2D, w: number, h: number) => void;

function canvasTex(w: number, h: number, paint: Painter, scale = 1) {
  const c = document.createElement("canvas");
  c.width = Math.round(w * scale);
  c.height = Math.round(h * scale);
  const g = c.getContext("2d")!;
  g.scale(scale, scale);
  paint(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function grain(g: CanvasRenderingContext2D, w: number, h: number, a = 0.05) {
  for (let i = 0; i < (w * h) / 90; i++) {
    g.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a * 1.6})`;
    g.fillRect(Math.random() * w, Math.random() * h, 1.4, 1.4);
  }
}

function type(g: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color: string, weight = 800, font = DISPLAY, align: CanvasTextAlign = "left") {
  g.font = `${weight} ${size}px ${font}`;
  g.fillStyle = color;
  g.textAlign = align;
  g.textBaseline = "alphabetic";
  g.fillText(text, x, y);
}

function figure(g: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
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

/** Reel/story chrome (progress bar, icons). Painted on its own layer so it can fade away. */
export function reelUI() {
  return canvasTex(360, 640, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const grad = g.createLinearGradient(0, h * 0.62, 0, h);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0,0.75)");
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(238,235,227,0.9)";
    g.beginPath();
    g.arc(30, h - 76, 13, 0, Math.PI * 2);
    g.fill();
    type(g, "buzzlab.global", 52, h - 70, 15, BONE, 500, MONO);
    type(g, "Original audio", 30, h - 42, 12, "rgba(238,235,227,.7)", 400, MONO);
    for (let i = 0; i < 3; i++) {
      g.strokeStyle = BONE;
      g.lineWidth = 2.4;
      g.beginPath();
      g.arc(w - 32, h - 230 + i * 58, 12, 0, Math.PI * 2);
      g.stroke();
    }
    g.fillStyle = "rgba(238,235,227,.25)";
    g.fillRect(0, h - 4, w, 4);
    g.fillStyle = Y;
    g.fillRect(0, h - 4, w * 0.38, 4);
  });
}

export function contentTextures() {
  const T: Record<string, THREE.CanvasTexture> = {};

  T.reelHero = canvasTex(360, 640, (g, w, h) => {
    g.fillStyle = "#0d0d0d";
    g.fillRect(0, 0, w, h);
    const r = g.createRadialGradient(w * 0.5, h * 0.38, 10, w * 0.5, h * 0.38, h * 0.55);
    r.addColorStop(0, "rgba(249,254,2,.45)");
    r.addColorStop(1, "rgba(249,254,2,0)");
    g.fillStyle = r;
    g.fillRect(0, 0, w, h);
    figure(g, w * 0.5, h * 0.52, 190, "#050505");
    type(g, "BEHIND EVERY", 24, 92, 46, BONE);
    type(g, "SCROLL.", 24, 140, 46, Y);
    grain(g, w, h);
  });

  T.reelTimer = canvasTex(360, 640, (g, w, h) => {
    g.fillStyle = Y;
    g.fillRect(0, 0, w, h);
    type(g, "1 IDEA", w / 2, h * 0.3, 92, INK, 800, DISPLAY, "center");
    type(g, "1 HOUR", w / 2, h * 0.44, 92, INK, 800, DISPLAY, "center");
    g.strokeStyle = INK;
    g.lineWidth = 10;
    g.beginPath();
    g.arc(w / 2, h * 0.68, 78, -Math.PI / 2, Math.PI * 0.9);
    g.stroke();
    type(g, "00:37:12", w / 2, h * 0.7, 26, INK, 500, MONO, "center");
    grain(g, w, h, 0.04);
  });

  T.postPortrait = canvasTex(400, 400, (g, w, h) => {
    g.fillStyle = "#171717";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(238,235,227,.08)";
    for (let i = 0; i < 9; i++) g.fillRect(i * 46, 0, 2, h);
    figure(g, w * 0.5, h * 0.66, 210, "#000");
    g.strokeStyle = Y;
    g.lineWidth = 6;
    g.strokeRect(w * 0.62, h * 0.18, 92, 60);
    type(g, "WHO'S BEHIND", 22, 54, 40, BONE);
    type(g, "THE CAMERA?", 22, 92, 40, Y);
    grain(g, w, h);
  });

  T.thumb = canvasTex(640, 360, (g, w, h) => {
    g.fillStyle = "#101010";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#1d1d1d";
    g.fillRect(w * 0.48, 0, w * 0.52, h);
    figure(g, w * 0.72, h * 0.72, 250, "#000");
    type(g, "THE SHOT WE", 28, 92, 62, BONE);
    type(g, "ALMOST DIDN'T", 28, 160, 62, BONE);
    type(g, "GET.", 28, 228, 62, Y);
    g.strokeStyle = Y;
    g.lineWidth = 7;
    g.beginPath();
    g.ellipse(w * 0.72, h * 0.32, 70, 48, -0.2, 0, Math.PI * 2);
    g.stroke();
    grain(g, w, h);
  });

  T.meme = canvasTex(400, 400, (g, w, h) => {
    g.fillStyle = BONE;
    g.fillRect(0, 0, w, h);
    g.fillStyle = INK;
    g.fillRect(0, 0, w, 96);
    type(g, "CLIENT: CAN THE LOGO", w / 2, 44, 30, BONE, 800, DISPLAY, "center");
    type(g, "BE BIGGER?", w / 2, 80, 30, Y, 800, DISPLAY, "center");
    g.fillStyle = Y;
    g.beginPath();
    g.arc(w / 2, h * 0.62, 120, 0, Math.PI * 2);
    g.fill();
    type(g, "Buzzlab", w / 2, h * 0.66, 58, INK, 700, SERIF, "center");
    type(g, "US:", 18, 130, 26, INK, 800);
    grain(g, w, h, 0.04);
  });

  T.ad = canvasTex(400, 500, (g, w, h) => {
    g.fillStyle = "#0e0e0e";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#1c1c1c";
    g.beginPath();
    g.ellipse(w / 2, h * 0.47, 120, 120, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = BONE;
    g.fillRect(w / 2 - 34, h * 0.3, 68, 150);
    g.fillStyle = Y;
    g.fillRect(w / 2 - 34, h * 0.3, 68, 26);
    type(g, "SPONSORED", 24, 40, 15, "rgba(238,235,227,.6)", 500, MONO);
    type(g, "MADE TO BE NOTICED.", 24, h - 96, 34, BONE);
    g.fillStyle = Y;
    g.fillRect(24, h - 72, w - 48, 46);
    type(g, "SHOP NOW", w / 2, h - 40, 24, INK, 800, DISPLAY, "center");
  });

  T.story = canvasTex(360, 640, (g, w, h) => {
    g.fillStyle = "#121212";
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) {
      g.fillStyle = i < 2 ? BONE : "rgba(238,235,227,.3)";
      g.fillRect(14 + i * 84, 16, 76, 4);
    }
    figure(g, w * 0.5, h * 0.62, 230, "#000");
    g.fillStyle = BONE;
    g.fillRect(40, h * 0.2, w - 80, 150);
    type(g, "FUNNY OR", w / 2, h * 0.2 + 54, 40, INK, 800, DISPLAY, "center");
    type(g, "EMOTIONAL?", w / 2, h * 0.2 + 98, 40, INK, 800, DISPLAY, "center");
    g.fillStyle = Y;
    g.fillRect(40, h * 0.2 + 116, (w - 80) * 0.62, 26);
    type(g, "62%", 52, h * 0.2 + 136, 18, INK, 500, MONO);
  });

  T.reelCrowd = canvasTex(360, 640, (g, w, h) => {
    g.fillStyle = "#0b0b0b";
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 5; i++) figure(g, 40 + i * 70, h * 0.66 + (i % 2) * 20, 120, i === 2 ? Y : "#1e1e1e");
    type(g, "MEET THE", 24, 96, 52, BONE);
    type(g, "PEOPLE.", 24, 150, 52, Y);
    grain(g, w, h);
  });

  T.script = canvasTex(420, 560, (g, w, h) => {
    g.fillStyle = "#f2efe7";
    g.fillRect(0, 0, w, h);
    const lines = [
      ["INT. BUZZLAB — NIGHT", 1],
      ["", 0],
      ["A desk lamp. Six people. One idea", 0],
      ["that refuses to die.", 0],
      ["", 0],
      ["DIRECTOR", 2],
      ["One more take.", 3],
      ["", 0],
      ["EDITOR", 2],
      ["Cut the first two seconds.", 3],
      ["", 0],
      ["They look at each other.", 0],
      ["It works.", 0],
    ] as const;
    lines.forEach(([t, k], i) => {
      const y = 60 + i * 34;
      if (k === 1) type(g, t, 36, y, 18, INK, 500, MONO);
      else if (k === 2) type(g, t, w / 2, y, 16, INK, 500, MONO, "center");
      else if (k === 3) type(g, t, w / 2, y, 16, "#333", 400, MONO, "center");
      else type(g, t, 36, y, 16, "#333", 400, MONO);
    });
    g.fillStyle = Y;
    g.fillRect(34, 46, 6, 22);
  });

  T.storyboard = canvasTex(720, 480, (g, w, h) => {
    g.fillStyle = "#e9e5dc";
    g.fillRect(0, 0, w, h);
    for (let r = 0; r < 2; r++)
      for (let c = 0; c < 3; c++) {
        const x = 24 + c * 228;
        const y = 24 + r * 226;
        g.strokeStyle = INK;
        g.lineWidth = 3;
        g.strokeRect(x, y, 210, 150);
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(x + 20, y + 120);
        g.quadraticCurveTo(x + 80 + c * 20, y + 30 + r * 20, x + 190, y + 110);
        g.stroke();
        figure(g, x + 70 + c * 30, y + 130, 60, "#222");
        if (r === 0 && c === 1) {
          g.fillStyle = Y;
          g.beginPath();
          g.arc(x + 160, y + 40, 18, 0, Math.PI * 2);
          g.fill();
        }
        type(g, `0${r * 3 + c + 1}`, x, y + 182, 16, INK, 500, MONO);
      }
  });

  T.rec = canvasTex(256, 96, (g, w, h) => {
    g.fillStyle = "#050505";
    g.fillRect(0, 0, w, h);
    g.fillStyle = Y;
    g.beginPath();
    g.arc(30, h / 2, 12, 0, Math.PI * 2);
    g.fill();
    type(g, "REC", 54, h / 2 + 11, 32, BONE, 500, MONO);
    type(g, "00:00:12", 136, h / 2 + 9, 20, "rgba(238,235,227,.6)", 500, MONO);
  });

  T.chair = canvasTex(256, 96, (g, w, h) => {
    g.fillStyle = Y;
    g.fillRect(0, 0, w, h);
    type(g, "DIRECTOR", w / 2, h / 2 + 14, 40, INK, 800, DISPLAY, "center");
  });

  T.monitor = canvasTex(320, 200, (g, w, h) => {
    g.fillStyle = "#0a0a0a";
    g.fillRect(0, 0, w, h);
    figure(g, w * 0.55, h * 0.95, 160, "#1f1f1f");
    g.strokeStyle = "rgba(238,235,227,.35)";
    g.lineWidth = 1;
    g.strokeRect(w / 3, 0, 0.1, h);
    g.strokeRect((w * 2) / 3, 0, 0.1, h);
    g.fillStyle = Y;
    g.fillRect(14, 14, 12, 12);
    type(g, "A CAM", 34, 26, 14, BONE, 500, MONO);
  });

  return T;
}

/** A little roughness noise and a few scratches, so the play button doesn't look like a render. */
export function imperfections() {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = "#6a6a6a";
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) {
      const v = 80 + Math.random() * 60;
      g.fillStyle = `rgba(${v},${v},${v},0.35)`;
      g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
    g.strokeStyle = "rgba(200,200,200,0.5)";
    for (let i = 0; i < 14; i++) {
      g.lineWidth = 0.6 + Math.random();
      g.beginPath();
      const x = Math.random() * w;
      const y = Math.random() * h;
      g.moveTo(x, y);
      g.lineTo(x + (Math.random() - 0.5) * 120, y + (Math.random() - 0.5) * 40);
      g.stroke();
    }
  });
}

/** The world inside the last reel, painted as a quick thumbnail for the multiplied copies. */
export function tileSet(T: Record<string, THREE.CanvasTexture>) {
  return [
    { tex: T.reelHero, w: 0.9, h: 1.6, kind: "Reel" },
    { tex: T.postPortrait, w: 1.2, h: 1.2, kind: "Post" },
    { tex: T.thumb, w: 1.6, h: 0.9, kind: "Thumbnail" },
    { tex: T.meme, w: 1.2, h: 1.2, kind: "Meme" },
    { tex: T.ad, w: 1.1, h: 1.375, kind: "Ad" },
    { tex: T.story, w: 0.9, h: 1.6, kind: "Story" },
    { tex: T.reelTimer, w: 0.9, h: 1.6, kind: "Reel" },
    { tex: T.reelCrowd, w: 0.9, h: 1.6, kind: "Reel" },
  ];
}
