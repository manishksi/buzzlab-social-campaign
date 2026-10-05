import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { anchorWorld, applyPose, blink, breathe, makePerson, orientHand, POSES, reach, type Person } from "./people";
import { cinemaCamera, directorsChair, mats, microphone, softbox } from "./props";
import { sonyA7S3 } from "./gear";
import { contentTextures } from "./textures";
import type { Label } from "./worlds";

/**
 * THE STUDIO — ACT 02 → ACT 03 as one continuous camera move through one physical place.
 *
 * Directed as a handful of motivated moves, each from one focal point to the next, each starting
 * and ending softly, and never through anything:
 *   .00  hold: a wide on the editor at his desk in the dark, the monitor the brightest thing
 *   .10  a slow push over his right shoulder onto the edit and the timeline
 *   .26  a lateral glide along the desk to the camera body beside the lamp
 *   .36  rise and pull back: the desk becomes foreground, the room beyond starts to light up
 *   .50  a high crane forward down the middle of the studio (above the table, clear of every
 *        board, stand and lamp): the second bay, the storyboard wall, the production table
 *   .76  down to eye level on the set: camera, DOP, talent, director, producer
 *   .88  a slow widen while the lights go out, zone by zone (into ACT 04)
 *
 * Driven by `t` (0 → 1) from scroll, plus a clock for life. Units are metres.
 */

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sm = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** a part of the room that lights up as the camera reaches it (`at`, in world time) */
type Zone = { at: number; lights: { l: THREE.Light; i: number }[]; glows: THREE.MeshBasicMaterial[]; tints: { m: THREE.MeshStandardMaterial; c: THREE.Color }[] };
type V3 = [number, number, number];
/** the shot list: where the camera is (p), what it looks at (l), and an optional arc control point */
const SHOTS: { t: number; p: V3; l: V3; via?: V3 }[] = [
  { t: 0.0, p: [2.15, 1.72, 3.05], l: [0.0, 1.0, -0.2] },
  { t: 0.1, p: [2.0, 1.68, 2.85], l: [0.0, 1.02, -0.22] },
  { t: 0.26, p: [0.52, 1.45, 1.22], l: [-0.02, 1.12, -0.24] },
  { t: 0.36, p: [0.98, 1.16, 0.62], l: [0.6, 0.84, -0.04] },
  { t: 0.5, p: [1.75, 2.15, 2.4], l: [0.2, 0.95, -2.6] },
  { t: 0.64, p: [0.6, 2.8, -0.6], l: [0.3, 0.9, -4.8], via: [1.95, 2.6, 0.9] },
  { t: 0.76, p: [0.05, 3.1, -3.4], l: [0.0, 1.0, -8.6] },
  { t: 0.88, p: [1.65, 1.68, -6.2], l: [-0.15, 1.2, -8.7], via: [1.4, 2.8, -5.0] },
  { t: 1.0, p: [2.6, 3.4, -2.6], l: [-0.3, 0.9, -7.2], via: [2.4, 2.4, -4.8] },
];
const DOWN = new THREE.Vector3(0, -1, 0);
/** the editor faces -z: "away" is forward for him; his elbows go out, down and back */
const AWAY = new THREE.Vector3(0, -0.15, -1);
const POLE_R = new THREE.Vector3(1, -1, 1);
const POLE_L = new THREE.Vector3(-1, -1, 1);

function officeChair(steel: THREE.Material) {
  const chair = new THREE.Group();
  const cmat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.7 });
  const seat = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.08, 0.48, 3, 0.03), cmat);
  seat.position.y = 0.47;
  const backrest = new THREE.Mesh(new RoundedBoxGeometry(0.46, 0.6, 0.07, 3, 0.03), cmat);
  backrest.position.set(0, 0.86, -0.27);
  backrest.rotation.x = -0.12;
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.32, 10), steel);
  post.position.y = 0.26;
  chair.add(seat, backrest, post);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const legc = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.03, 0.04), steel);
    legc.position.set(Math.cos(a) * 0.15, 0.08, Math.sin(a) * 0.15);
    legc.rotation.y = -a;
    chair.add(legc);
    const caster = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), cmat);
    caster.position.set(Math.cos(a) * 0.3, 0.025, Math.sin(a) * 0.3);
    chair.add(caster);
  }
  chair.traverse((n) => ((n as THREE.Mesh).castShadow = true));
  return chair;
}

/** Each move eases in and out (smootherstep), so the camera settles on every focal point. */
function camAt(t: number, p: THREE.Vector3, l: THREE.Vector3) {
  let i = 0;
  while (i < SHOTS.length - 2 && t > SHOTS[i + 1].t) i++;
  const a = SHOTS[i];
  const b = SHOTS[i + 1];
  const u = clamp((t - a.t) / (b.t - a.t));
  const e = u * u * u * (u * (u * 6 - 15) + 10);
  for (let k = 0; k < 3; k++) {
    const v = b.via ? (1 - e) * (1 - e) * a.p[k] + 2 * (1 - e) * e * b.via[k] + e * e * b.p[k] : lerp(a.p[k], b.p[k], e);
    p.setComponent(k, v);
    l.setComponent(k, lerp(a.l[k], b.l[k], e));
  }
}

// ---------------------------------------------------------------------------------------------
// the edit on the monitor: a dark NLE with a program monitor, bins and a moving timeline
// ---------------------------------------------------------------------------------------------
class EditScreen {
  canvas = document.createElement("canvas");
  tex: THREE.CanvasTexture;
  private g: CanvasRenderingContext2D;
  private last = -1;
  constructor(private footage: HTMLCanvasElement[]) {
    this.canvas.width = 1024;
    this.canvas.height = 576;
    this.g = this.canvas.getContext("2d")!;
    this.tex = new THREE.CanvasTexture(this.canvas);
    this.tex.colorSpace = THREE.SRGBColorSpace;
  }
  update(time: number, head: number) {
    // ~15 fps is plenty for a screen in the distance
    const frame = Math.floor(time * 15);
    if (frame === this.last) return;
    this.last = frame;
    const g = this.g;
    const W = 1024;
    const H = 576;
    g.fillStyle = "#121212";
    g.fillRect(0, 0, W, H);
    g.fillStyle = "#1a1a1a";
    g.fillRect(0, 0, W, 22);
    g.fillStyle = "#6d6d6d";
    g.font = "500 11px monospace";
    g.fillText("BUZZLAB_INTRO_v07  ·  Edit  ·  Color  ·  Audio", 12, 15);
    // bins
    g.fillStyle = "#161616";
    g.fillRect(6, 28, 250, 300);
    for (let i = 0; i < 6; i++) {
      const x = 14 + (i % 2) * 120;
      const y = 38 + Math.floor(i / 2) * 96;
      g.drawImage(this.footage[i % this.footage.length], x, y, 110, 62);
      g.fillStyle = "#777";
      g.fillText(`A00${i + 1}_C0${(i * 7) % 9}`, x, y + 76);
    }
    // program monitor: the footage, slowly panning
    const px = 270;
    const pw = 600;
    const ph = 300;
    g.fillStyle = "#000";
    g.fillRect(px, 28, pw, ph);
    const src = this.footage[Math.floor(head * 7) % this.footage.length];
    const pan = (time * 0.04) % 1;
    g.save();
    g.beginPath();
    g.rect(px, 28, pw, ph);
    g.clip();
    g.drawImage(src, px - pan * 60, 28 - 10, pw + 80, ph + 30);
    g.restore();
    g.strokeStyle = "rgba(255,255,255,.15)";
    g.strokeRect(px + 0.5, 28.5, pw - 1, ph - 1);
    g.fillStyle = "#f9fe02";
    g.fillText(`00:00:${String(Math.floor(head * 48)).padStart(2, "0")}:${String(Math.floor((head * 48 * 25) % 25)).padStart(2, "0")}`, px + pw - 92, 28 + ph + 16);
    // inspector
    g.fillStyle = "#161616";
    g.fillRect(884, 28, 134, 300);
    for (let i = 0; i < 9; i++) {
      g.fillStyle = "#2a2a2a";
      g.fillRect(894, 44 + i * 30, 110, 6);
      g.fillStyle = i === 3 ? "#f9fe02" : "#555";
      g.fillRect(894, 44 + i * 30, 30 + ((i * 37) % 70), 6);
    }
    // timeline
    const ty = 350;
    g.fillStyle = "#0e0e0e";
    g.fillRect(6, ty, W - 12, H - ty - 6);
    for (let i = 0; i <= 40; i++) {
      g.fillStyle = "#3a3a3a";
      g.fillRect(70 + i * 23.5, ty + 4, 1, i % 5 ? 4 : 9);
    }
    const tracks = ["V3", "V2", "V1", "A1", "A2", "A3"];
    tracks.forEach((name, r) => {
      const y = ty + 20 + r * 33;
      g.fillStyle = "#666";
      g.fillText(name, 18, y + 18);
      g.fillStyle = "#181818";
      g.fillRect(64, y, W - 76, 28);
      let x = 66 + ((r * 53) % 40);
      let k = 0;
      while (x < W - 20) {
        const len = 50 + ((r * 31 + k * 17) % 90);
        const video = r < 3;
        g.fillStyle = video ? (r === 1 && k % 3 === 1 ? "#d9d400" : k % 2 ? "#4a4a4a" : "#8a8780") : "#2f3a2f";
        if (r === 2 || (r === 0 && k % 2)) g.fillStyle = video ? "#5a5a58" : g.fillStyle;
        g.fillRect(x, y + 2, Math.min(len - 3, W - 20 - x), 24);
        if (!video) {
          g.fillStyle = "#6f8a6f";
          for (let q = 0; q < len - 6; q += 3) {
            const a = (0.2 + 0.8 * Math.abs(Math.sin(q * 0.21 + k + r))) * 10;
            g.fillRect(x + q + 2, y + 14 - a / 2, 1.5, a);
          }
        }
        x += len;
        k++;
      }
    });
    const hx = 66 + head * (W - 90);
    g.fillStyle = "#f9fe02";
    g.fillRect(hx, ty + 2, 2, H - ty - 10);
    g.beginPath();
    g.moveTo(hx - 6, ty + 2);
    g.lineTo(hx + 8, ty + 2);
    g.lineTo(hx + 1, ty + 12);
    g.fill();
    this.tex.needsUpdate = true;
  }
}

/** Second screen: scopes and a waveform. */
function scopesTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 320;
  const g = c.getContext("2d")!;
  g.fillStyle = "#101010";
  g.fillRect(0, 0, 512, 320);
  g.strokeStyle = "rgba(255,255,255,.08)";
  for (let i = 0; i < 6; i++) g.strokeRect(10, 10 + i * 24, 236, 0.1);
  for (let x = 0; x < 236; x += 2) {
    for (let k = 0; k < 6; k++) {
      const y = 140 - (Math.sin(x * 0.05 + k) * 0.5 + 0.5) * 110 * Math.random();
      g.fillStyle = `rgba(${k % 2 ? "249,254,2" : "220,220,210"},0.25)`;
      g.fillRect(10 + x, y, 1.5, 1.5);
    }
  }
  g.fillStyle = "#151515";
  g.fillRect(262, 10, 240, 140);
  g.strokeStyle = "#f9fe02";
  g.beginPath();
  g.arc(382, 80, 54, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = "#1a1a1a";
  g.fillRect(10, 166, 492, 144);
  g.fillStyle = "#555";
  g.font = "500 12px monospace";
  g.fillText("SEQUENCE · 1920×1080 · 25p", 20, 190);
  for (let i = 0; i < 6; i++) {
    g.fillStyle = i === 2 ? "#f9fe02" : "#3a3a3a";
    g.fillRect(20, 206 + i * 16, 80 + ((i * 53) % 300), 8);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function paperTexture(lines: string[], opts: { w?: number; h?: number; bg?: string; ink?: string; hand?: boolean; title?: string } = {}) {
  const c = document.createElement("canvas");
  c.width = opts.w ?? 360;
  c.height = opts.h ?? 480;
  const g = c.getContext("2d")!;
  g.fillStyle = opts.bg ?? "#ece9e1";
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = opts.ink ?? "#1a1a1a";
  if (opts.title) {
    g.font = '800 34px "Big Shoulders Display", sans-serif';
    g.fillText(opts.title, 24, 52);
  }
  g.font = opts.hand ? 'italic 500 22px "Bodoni Moda", serif' : '500 15px "IBM Plex Mono", monospace';
  lines.forEach((l, i) => g.fillText(l, 24, (opts.title ? 92 : 44) + i * (opts.hand ? 34 : 26)));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function boardTexture(T: Record<string, THREE.CanvasTexture>) {
  const c = document.createElement("canvas");
  c.width = 1200;
  c.height = 700;
  const g = c.getContext("2d")!;
  g.fillStyle = "#1c1b19";
  g.fillRect(0, 0, 1200, 700);
  // storyboard frames on the left, a moodboard on the right
  const sb = T.storyboard.image as HTMLCanvasElement;
  g.drawImage(sb, 30, 40, 600, 400);
  const mood = [T.reelHero, T.thumb, T.postPortrait, T.reelCrowd, T.meme];
  mood.forEach((m, i) => {
    const img = m.image as HTMLCanvasElement;
    const x = 680 + (i % 3) * 170;
    const y = 50 + Math.floor(i / 3) * 230 + (i % 2) * 20;
    g.save();
    g.translate(x + 75, y + 100);
    g.rotate((i % 2 ? -1 : 1) * 0.04);
    g.drawImage(img, -75, -100, 150, img.height * (150 / img.width));
    g.restore();
  });
  // sticky notes
  const notes = ["HOOK IN 2s", "FACES > LOGOS", "EP.01", "SHOOT WED", "SOUND!"];
  notes.forEach((n, i) => {
    const x = 60 + i * 210;
    const y = 520 + (i % 2) * 40;
    g.fillStyle = "#f9fe02";
    g.fillRect(x, y, 150, 120);
    g.fillStyle = "#111";
    g.font = '800 26px "Big Shoulders Display", sans-serif';
    g.fillText(n, x + 14, y + 66);
  });
  g.fillStyle = "#e9e5dc";
  g.font = '500 18px "IBM Plex Mono", monospace';
  g.fillText("EP.01 — THE BUZZLAB INTRO · BOARDS / MOOD", 30, 26);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// ---------------------------------------------------------------------------------------------

export class StudioScene {
  private scene = new THREE.Scene();
  private cam = new THREE.PerspectiveCamera(38, 1, 0.03, 120);
  private w = 1;
  private h = 1;
  private T = contentTextures();
  private edit: EditScreen;
  private editor!: Person;
  private crew: { p: Person; seed: number; pose: (k: number) => void }[] = [];
  private V = new THREE.Vector3();
  private mouse!: THREE.Object3D;
  private zones: Zone[] = [];
  private master!: THREE.HemisphereLight;
  private steam: THREE.Mesh[] = [];
  private p = new THREE.Vector3();
  private l = new THREE.Vector3();
  private tmp = new THREE.Vector3();
  /** small captions pinned to things in the room, each on screen for a stretch of the move */
  private marks: { id: string; text: string; o: THREE.Object3D; dy: number; a: number; b: number; pin?: boolean }[] = [];
  private mark(id: string, text: string, o: THREE.Object3D, dy: number, a: number, b: number, pin = false) {
    this.marks.push({ id, text, o, dy, a, b, pin });
  }

  constructor(private renderer: THREE.WebGLRenderer, private opts: { lowPower: boolean }) {
    RectAreaLightUniformsLib.init();
    const pm = new THREE.PMREMGenerator(renderer);
    this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.12;
    this.scene.background = new THREE.Color(0x000000);
    this.scene.fog = new THREE.FogExp2(0x000000, 0.075);
    const footage = [this.T.reelHero, this.T.thumb, this.T.postPortrait, this.T.reelCrowd, this.T.story, this.T.reelTimer].map((t) => t.image as HTMLCanvasElement);
    this.edit = new EditScreen(footage);
    this.build();
  }

  /** everything in `o` stays dark until its zone comes up (only for objects with their own materials) */
  private dimWith(o: THREE.Object3D, z: Zone) {
    o.traverse((n) => {
      const m = (n as THREE.Mesh).material as THREE.Material | undefined;
      if (!m) return;
      if ((m as THREE.MeshBasicMaterial).isMeshBasicMaterial) z.glows.push(m as THREE.MeshBasicMaterial);
      else if ((m as THREE.MeshStandardMaterial).isMeshStandardMaterial) z.tints.push({ m: m as THREE.MeshStandardMaterial, c: (m as THREE.MeshStandardMaterial).color.clone() });
    });
  }

  private zone(at: number) {
    const z: Zone = { lights: [], at, glows: [], tints: [] };
    this.zones.push(z);
    return z;
  }

  private build() {
    const s = this.scene;
    const T = this.T;
    const low = this.opts.lowPower;
    this.master = new THREE.HemisphereLight(0x9a9a9a, 0x050505, 0.12);
    s.add(this.master);

    // floor: dark polished concrete; far walls lost in the dark
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.55, metalness: 0.1 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    s.add(floor);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: 0.95 });
    const back = new THREE.Mesh(new THREE.PlaneGeometry(30, 8), wallMat);
    back.position.set(0, 4, -12.5);
    s.add(back);

    // ================= ZONE A: the editor's desk =================
    const A = this.zone(0);
    const wood = new THREE.MeshStandardMaterial({ color: 0x1b1815, roughness: 0.6 });
    const steel = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.4, metalness: 0.7 });
    const desk = new THREE.Mesh(new RoundedBoxGeometry(1.9, 0.045, 0.85, 3, 0.012), wood);
    desk.position.set(0, 0.74, -0.05);
    desk.castShadow = desk.receiveShadow = true;
    s.add(desk);
    for (const x of [-0.88, 0.88])
      for (const z of [-0.4, 0.3]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.72, 0.04), steel);
        leg.position.set(x, 0.36, z);
        s.add(leg);
      }
    // the yellow desk mat — BuzzLab, quietly
    const mat = new THREE.Mesh(new RoundedBoxGeometry(0.95, 0.006, 0.42, 2, 0.003), new THREE.MeshStandardMaterial({ color: 0xe8e000, roughness: 0.85 }));
    mat.position.set(0.05, 0.765, 0.16);
    mat.receiveShadow = true;
    s.add(mat);
    // main monitor running the edit
    const mon = new THREE.Group();
    const bezel = new THREE.Mesh(new RoundedBoxGeometry(0.76, 0.46, 0.035, 2, 0.01), new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.4 }));
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.73, 0.41), new THREE.MeshBasicMaterial({ map: this.edit.tex, toneMapped: false }));
    screen.position.z = 0.019;
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.28, 0.03), steel);
    neck.position.set(0, -0.3, -0.04);
    const foot = new THREE.Mesh(new RoundedBoxGeometry(0.28, 0.015, 0.2, 2, 0.005), steel);
    foot.position.set(0, -0.44, 0.02);
    mon.add(bezel, screen, neck, foot);
    A.glows.push(screen.material as THREE.MeshBasicMaterial);
    mon.position.set(0, 1.205, -0.24);
    s.add(mon);
    this.mark("edit", "The edit — v07", mon, 0.3, 0.16, 0.28);
    const glow = new THREE.RectAreaLight(0xcfe0ff, 3.2, 0.73, 0.41);
    glow.position.set(0, 1.205, -0.21);
    glow.lookAt(0, 1.0, 1);
    s.add(glow);
    A.lights.push({ l: glow, i: 3.2 });
    // a couple of yellow sticky notes on the bezel
    for (let i = 0; i < 2; i++) {
      const note = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.06), new THREE.MeshStandardMaterial({ color: 0xf2ea10, roughness: 0.9 }));
      note.position.set(0.31 + i * 0.05, 0.99 + i * 0.02, -0.219);
      note.rotation.z = (i ? -1 : 1) * 0.08;
      s.add(note);
    }
    // second screen, angled in
    const mon2 = new THREE.Group();
    const bez2 = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.31, 0.03, 2, 0.008), new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.4 }));
    const scr2 = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.29), new THREE.MeshBasicMaterial({ map: scopesTexture(), toneMapped: false }));
    scr2.position.z = 0.016;
    const n2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.03), steel);
    n2.position.set(0, -0.22, -0.03);
    mon2.add(bez2, scr2, n2);
    A.glows.push(scr2.material as THREE.MeshBasicMaterial);
    mon2.position.set(-0.68, 1.1, -0.1);
    mon2.rotation.y = 0.5;
    s.add(mon2);
    // keyboard and mouse
    const kb = new THREE.Mesh(new RoundedBoxGeometry(0.44, 0.022, 0.14, 2, 0.006), new THREE.MeshStandardMaterial({ color: 0x161616, roughness: 0.5 }));
    kb.position.set(-0.06, 0.778, 0.17);
    kb.castShadow = true;
    s.add(kb);
    const keyGeo = new THREE.BoxGeometry(0.022, 0.008, 0.022);
    const keys = new THREE.InstancedMesh(keyGeo, new THREE.MeshStandardMaterial({ color: 0x232323, roughness: 0.6 }), 60);
    const m4 = new THREE.Matrix4();
    let ki = 0;
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 12 && ki < 60; c++) {
        m4.makeTranslation(-0.06 - 0.195 + c * 0.0355 + (r % 2) * 0.008, 0.793, 0.115 + r * 0.027);
        keys.setMatrixAt(ki++, m4);
      }
    s.add(keys);
    const mouseG = new THREE.Group();
    const mouseBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.026, 0.05, 6, 14), new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.35 }));
    mouseBody.rotation.x = Math.PI / 2;
    mouseBody.scale.set(1, 1, 0.55);
    mouseG.add(mouseBody);
    mouseG.position.set(0.32, 0.783, 0.18);
    s.add(mouseG);
    this.mouse = mouseG;
    // the desk lamp: a warm yellow pool of light
    const lamp = new THREE.Group();
    const lb = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.02, 24), steel);
    const a1 = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.42, 8), steel);
    a1.position.set(0.0, 0.21, 0);
    a1.rotation.z = 0.25;
    const a2 = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.34, 8), steel);
    a2.position.set(-0.13, 0.46, 0);
    a2.rotation.z = 1.2;
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.11, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0xf2ea10, roughness: 0.5, side: THREE.DoubleSide }));
    shade.position.set(-0.3, 0.52, 0);
    shade.rotation.z = 2.3;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 10), new THREE.MeshBasicMaterial({ color: 0xfff6c0 }));
    bulb.position.set(-0.27, 0.49, 0);
    lamp.add(lb, a1, a2, shade, bulb);
    A.glows.push(bulb.material as THREE.MeshBasicMaterial);
    lamp.position.set(0.82, 0.77, -0.25);
    s.add(lamp);
    const lampLight = new THREE.SpotLight(0xffe27a, 6, 3.5, 0.9, 0.7, 1.4);
    lampLight.position.set(0.55, 1.26, -0.25);
    lampLight.target.position.set(0.25, 0.75, 0.2);
    lampLight.castShadow = !low;
    lampLight.shadow.mapSize.set(1024, 1024);
    lampLight.shadow.bias = -0.0008;
    s.add(lampLight, lampLight.target);
    A.lights.push({ l: lampLight, i: 6 });
    // drives, cards, a lens, a notebook, notes, coffee, water, a clapper, cables
    const driveMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.45, metalness: 0.4 });
    for (let i = 0; i < 3; i++) {
      const d = new THREE.Mesh(new RoundedBoxGeometry(0.08, 0.025, 0.12, 2, 0.006), i === 1 ? new THREE.MeshStandardMaterial({ color: 0xf2ea10, roughness: 0.5 }) : driveMat);
      d.position.set(-0.62 + i * 0.002, 0.776 + i * 0.026, 0.22);
      d.rotation.y = 0.2 * i;
      d.castShadow = true;
      s.add(d);
    }
    for (let i = 0; i < 4; i++) {
      const card = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.003, 0.024), new THREE.MeshStandardMaterial({ color: i % 2 ? 0x222222 : 0x3a3a3a, roughness: 0.5 }));
      card.position.set(-0.46 + i * 0.04, 0.765, 0.3 - (i % 2) * 0.02);
      card.rotation.y = i * 0.4;
      s.add(card);
    }
    // a spare prime standing on its rear cap beside the camera (real size)
    const lens = new THREE.Group();
    const lensMat = new THREE.MeshStandardMaterial({ color: 0x121213, roughness: 0.45, metalness: 0.4 });
    const lb1 = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.07, 32), lensMat);
    lb1.position.y = 0.045;
    const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.0348, 0.0348, 0.024, 32), new THREE.MeshStandardMaterial({ color: 0x0b0b0c, roughness: 0.9 }));
    rib.position.y = 0.052;
    const rearCap = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.01, 32), new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.6 }));
    rearCap.position.y = 0.005;
    const frontCap = new THREE.Mesh(new THREE.CylinderGeometry(0.0335, 0.0335, 0.006, 32), new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.55 }));
    frontCap.position.y = 0.083;
    const badge = new THREE.Mesh(new THREE.CircleGeometry(0.003, 16), new THREE.MeshStandardMaterial({ color: 0xd2452a, roughness: 0.4 }));
    badge.position.set(0.0342, 0.07, 0);
    badge.rotation.y = Math.PI / 2;
    lens.add(lb1, rib, rearCap, frontCap, badge);
    lens.traverse((n) => ((n as THREE.Mesh).castShadow = true));
    lens.position.set(0.47, 0.7625, -0.12);
    s.add(lens);
    const nb = new THREE.Mesh(new RoundedBoxGeometry(0.17, 0.018, 0.23, 2, 0.004), new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.8 }));
    nb.position.set(0.58, 0.773, 0.3);
    nb.rotation.y = -0.3;
    s.add(nb);
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.02, 0.232), new THREE.MeshStandardMaterial({ color: 0xf2ea10, roughness: 0.6 }));
    band.position.set(0.63, 0.774, 0.32);
    band.rotation.y = -0.3;
    s.add(band);
    const notes = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.21), new THREE.MeshStandardMaterial({ map: paperTexture(["hook: faces first", "cut 0:02 → 0:01", "music drop on the reveal", "logo LAST", "export 4:5 + 9:16"], { hand: true }), roughness: 0.9 }));
    notes.rotation.x = -Math.PI / 2;
    notes.rotation.z = 0.25;
    notes.position.set(-0.3, 0.7655, 0.31);
    s.add(notes);
    const mug = new THREE.Group();
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.09, 24), new THREE.MeshStandardMaterial({ color: 0xeeebe3, roughness: 0.4 }));
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.006, 8, 16), new THREE.MeshStandardMaterial({ color: 0xeeebe3, roughness: 0.4 }));
    handle.position.set(0.045, 0, 0);
    const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.036, 20), new THREE.MeshStandardMaterial({ color: 0x2a160a, roughness: 0.2 }));
    coffee.rotation.x = -Math.PI / 2;
    coffee.position.y = 0.038;
    const coaster = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.005, 32), new THREE.MeshStandardMaterial({ color: 0xf2ea10, roughness: 0.7 }));
    coaster.position.y = -0.047;
    mug.add(cup, handle, coffee, coaster);
    mug.position.set(0.3, 0.81, -0.1);
    s.add(mug);
    for (let i = 0; i < 3; i++) {
      const st = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.12), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.05, depthWrite: false }));
      st.position.set(0.3 + (i - 1) * 0.01, 0.92, -0.1);
      s.add(st);
      this.steam.push(st);
    }
    const clap = new THREE.Group();
    const cb = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.085, 0.008), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 }));
    const ct = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.008), new THREE.MeshStandardMaterial({ color: 0xeeebe3, roughness: 0.6 }));
    ct.position.y = 0.055;
    ct.rotation.z = 0.25;
    clap.add(cb, ct);
    clap.position.set(-0.86, 0.81, -0.32);
    clap.rotation.y = 0.5;
    s.add(clap);
    const cableMat = new THREE.MeshStandardMaterial({ color: 0x0b0b0b, roughness: 0.6 });
    const cable = (pts: [number, number, number][]) => {
      const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
      const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.006, 6), cableMat);
      s.add(m);
    };
    cable([[0, 0.95, -0.28], [0.05, 0.8, -0.34], [0.2, 0.76, -0.38], [0.6, 0.6, -0.42], [0.9, 0.05, -0.45]]);
    cable([[-0.68, 0.92, -0.14], [-0.6, 0.77, -0.3], [-0.3, 0.765, -0.36], [0, 0.4, -0.42], [0.2, 0.02, -0.5]]);
    cable([[-0.62, 0.79, 0.17], [-0.75, 0.77, 0.0], [-0.9, 0.5, -0.1], [-1.0, 0.02, 0.1]]);
    // office chair
    const chair = new THREE.Group();
    const cmat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.7 });
    const seat = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.08, 0.48, 3, 0.03), cmat);
    seat.position.y = 0.47;
    const backrest = new THREE.Mesh(new RoundedBoxGeometry(0.46, 0.6, 0.07, 3, 0.03), cmat);
    backrest.position.set(0, 0.86, -0.27);
    backrest.rotation.x = -0.12;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.32, 10), steel);
    post.position.y = 0.26;
    chair.add(seat, backrest, post);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const legc = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.03, 0.04), steel);
      legc.position.set(Math.cos(a) * 0.15, 0.08, Math.sin(a) * 0.15);
      legc.rotation.y = -a;
      chair.add(legc);
      const caster = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), cmat);
      caster.position.set(Math.cos(a) * 0.3, 0.025, Math.sin(a) * 0.3);
      chair.add(caster);
    }
    chair.traverse((n) => ((n as THREE.Mesh).castShadow = true));
    chair.position.set(0.02, 0, 0.62);
    chair.rotation.y = Math.PI;
    s.add(chair);
    // the editor
    this.editor = makePerson({ sex: "m", outfit: "tee", top: 0xf2e300, bottom: 0x121212, hair: "short02", hairColor: 0x2d241d, shoes: "sneakers", headphones: true });
    this.editor.root.position.set(0.02, 0, 0.62);
    this.editor.root.rotation.y = Math.PI;
    s.add(this.editor.root);
    // the camera on the desk beside the lamp: a Sony A7S III with a 35 mm prime, at real size
    const deskCam = sonyA7S3();
    deskCam.position.set(0.62, 0.7625, -0.02);
    deskCam.rotation.y = 0.55;
    s.add(deskCam);
    this.mark("gear", "Sony A7S III", deskCam, 0.06, 0.27, 0.42, true);
    // a gear shelf behind the desk
    const shelf = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.025, 0.35), wood);
      b.position.y = 0.3 + i * 0.42;
      shelf.add(b);
    }
    for (const x of [-0.8, 0.8]) {
      const up = new THREE.Mesh(new THREE.BoxGeometry(0.025, 1.2, 0.35), wood);
      up.position.set(x, 0.62, 0);
      shelf.add(up);
    }
    for (let i = 0; i < 9; i++) {
      const bx = new THREE.Mesh(new RoundedBoxGeometry(0.14 + (i % 3) * 0.05, 0.12 + (i % 2) * 0.08, 0.2, 2, 0.01), i % 4 === 1 ? new THREE.MeshStandardMaterial({ color: 0xf2ea10, roughness: 0.6 }) : driveMat);
      bx.position.set(-0.65 + (i % 5) * 0.32, 0.38 + Math.floor(i / 5) * 0.42 + (bx.geometry as RoundedBoxGeometry).parameters.height / 2 - 0.06, 0);
      shelf.add(bx);
    }
    shelf.position.set(0.1, 0, -1.25);
    s.add(shelf);

    // ================= ZONE B: second bay, storyboard wall, production table =================
    const B = this.zone(0.4);
    const bay = new THREE.Group();
    const bayDesk = new THREE.Mesh(new RoundedBoxGeometry(1.4, 0.04, 0.7, 2, 0.01), wood);
    bayDesk.position.y = 0.74;
    bay.add(bayDesk);
    for (const x of [-0.65, 0.65]) {
      const lg2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.72, 0.6), steel);
      lg2.position.set(x, 0.36, 0);
      bay.add(lg2);
    }
    const bm = new THREE.Mesh(new RoundedBoxGeometry(0.6, 0.36, 0.03, 2, 0.008), new THREE.MeshStandardMaterial({ color: 0x0a0a0a }));
    bm.position.set(0, 1.1, -0.2);
    const bs = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.33), new THREE.MeshBasicMaterial({ map: T.thumb, toneMapped: false }));
    bs.position.set(0, 1.1, -0.183);
    bay.add(bm, bs);
    B.glows.push(bs.material as THREE.MeshBasicMaterial);
    bay.position.set(-2.7, 0, -3.1);
    bay.rotation.y = 0.9;
    s.add(bay);
    const bayGlow = new THREE.RectAreaLight(0xdfe8ff, 0, 0.58, 0.33);
    bayGlow.position.set(-2.55, 1.1, -2.98);
    bayGlow.lookAt(-1.8, 1.0, -2.3);
    s.add(bayGlow);
    B.lights.push({ l: bayGlow, i: 2.4 });
    const bayLamp = new THREE.SpotLight(0xffe2a0, 0, 4, 0.7, 0.7, 1.3);
    bayLamp.position.set(-2.3, 2.6, -2.6);
    bayLamp.target.position.set(-2.6, 0.75, -3.0);
    s.add(bayLamp, bayLamp.target);
    B.lights.push({ l: bayLamp, i: 7 });
    if (!low) {
      const ac = officeChair(steel);
      ac.position.set(-2.3, 0, -2.75);
      ac.rotation.y = 0.9 + Math.PI;
      s.add(ac);
      const assistant = makePerson({ sex: "f", outfit: "tee", top: 0x2b2b2b, bottom: 0x1d2330, hair: "ponytail01", hairColor: 0x221a14, shoes: "sneakers" });
      assistant.root.position.set(-2.3, 0, -2.75);
      assistant.root.rotation.y = 0.9 + Math.PI;
      s.add(assistant.root);
      const kL = assistant.root.localToWorld(new THREE.Vector3(0.14, 0.8, 0.36));
      const kR = assistant.root.localToWorld(new THREE.Vector3(-0.2, 0.8, 0.34));
      const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(assistant.root.quaternion);
      this.crew.push({
        p: assistant,
        seed: 1,
        pose: (k) => {
          applyPose(assistant, POSES.sit, { spine: [0.18, 0, 0], head: [0.12, 0, 0] });
          reach(assistant, "L", this.V.copy(kL).add(new THREE.Vector3(0, Math.max(0, Math.sin(k * 9)) * 0.01, 0)), new THREE.Vector3(1, -1, -1).applyQuaternion(assistant.root.quaternion));
          reach(assistant, "R", kR, new THREE.Vector3(-1, -1, -1).applyQuaternion(assistant.root.quaternion));
          orientHand(assistant, "L", fwd, DOWN);
          orientHand(assistant, "R", fwd, DOWN);
        },
      });
    }
    // storyboard + moodboard wall
    const wallMat2 = new THREE.MeshStandardMaterial({ map: boardTexture(T), roughness: 0.85 });
    B.tints.push({ m: wallMat2, c: new THREE.Color(0xffffff) });
    const wall = new THREE.Mesh(new RoundedBoxGeometry(2.6, 1.52, 0.04, 2, 0.01), wallMat2);
    wall.position.set(1.85, 1.35, -3.7);
    wall.rotation.y = -0.5;
    s.add(wall);
    this.mark("boards", "Boards & mood — the idea gets a shape", wall, 0.9, 0.56, 0.68);
    for (const dx of [-1.2, 1.2]) {
      const st = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.4, 0.04), steel);
      st.position.set(1.85 + dx * Math.cos(0.5), 0.3, -3.7 + dx * Math.sin(0.5));
      s.add(st);
    }
    const wallLight = new THREE.SpotLight(0xfff0d0, 0, 6, 0.6, 0.6, 1.2);
    wallLight.position.set(0.6, 3.2, -2.4);
    wallLight.target.position.set(1.85, 1.3, -3.7);
    s.add(wallLight, wallLight.target);
    B.lights.push({ l: wallLight, i: 14 });
    if (!low) {
      const creative = makePerson({ sex: "m", outfit: "whitetee", hair: "short01", hairColor: 0x1d1612, shoes: "navy", skin: "skin_m_deep" });
      creative.root.position.set(2.45, 0, -2.75);
      creative.root.rotation.y = 2.45;
      s.add(creative.root);
      // the card he's about to move on the board
      const onBoard = wall.localToWorld(new THREE.Vector3(0.62, 0.05, 0.05));
      this.crew.push({
        p: creative,
        seed: 2,
        pose: (k) => {
          const up = 0.5 + 0.5 * Math.sin(k * 0.45);
          applyPose(creative, POSES.stand, { head: [0.05, 0.15, 0], spine: [0, 0.15, 0] });
          reach(creative, "R", this.V.copy(onBoard).add(new THREE.Vector3(0, up * 0.12, 0)).lerp(creative.root.localToWorld(new THREE.Vector3(-0.2, 1.0, 0.25)), 1 - up), new THREE.Vector3(1, -1, 0).applyQuaternion(creative.root.quaternion));
        },
      });
    }
    // the production table
    const table = new THREE.Group();
    const top = new THREE.Mesh(new RoundedBoxGeometry(2.0, 0.05, 0.95, 2, 0.01), wood);
    top.position.y = 0.76;
    top.receiveShadow = true;
    table.add(top);
    for (const x of [-0.92, 0.92])
      for (const z of [-0.4, 0.4]) {
        const lg3 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.74, 0.05), steel);
        lg3.position.set(x, 0.37, z);
        table.add(lg3);
      }
    for (let i = 0; i < 4; i++) {
      const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.28), new THREE.MeshStandardMaterial({ map: T.script, roughness: 0.9 }));
      sc.rotation.x = -Math.PI / 2;
      sc.rotation.z = (i - 1.5) * 0.18;
      sc.position.set(-0.7 + i * 0.26, 0.787 + i * 0.001, 0.15 + (i % 2) * 0.06);
      table.add(sc);
    }
    const prods: [number, number, number, number][] = [
      [0.35, 0.05, 0.24, 0xeeebe3],
      [0.5, 0.06, 0.18, 0xf2ea10],
      [0.66, 0.045, 0.28, 0x1a1a1a],
      [0.82, 0.07, 0.12, 0xd8d4ca],
    ];
    prods.forEach(([x, r, hgt, col], i) => {
      const pr = i % 2 ? new THREE.Mesh(new RoundedBoxGeometry(r * 2, hgt, r * 1.4, 2, 0.01), new THREE.MeshStandardMaterial({ color: col, roughness: 0.4 })) : new THREE.Mesh(new THREE.CylinderGeometry(r, r, hgt, 24), new THREE.MeshStandardMaterial({ color: col, roughness: 0.3 }));
      pr.position.set(x, 0.785 + hgt / 2, -0.15 + (i % 2) * 0.1);
      pr.castShadow = true;
      table.add(pr);
    });
    const laptop = new THREE.Group();
    const lbase = new THREE.Mesh(new RoundedBoxGeometry(0.33, 0.015, 0.23, 2, 0.005), steel);
    const lscr = new THREE.Mesh(new THREE.PlaneGeometry(0.31, 0.2), new THREE.MeshBasicMaterial({ map: T.postPortrait, toneMapped: false }));
    lscr.position.set(0, 0.11, -0.12);
    lscr.rotation.x = -0.25;
    laptop.add(lbase, lscr);
    B.glows.push(lscr.material as THREE.MeshBasicMaterial);
    laptop.position.set(-0.25, 0.79, -0.25);
    table.add(laptop);
    table.position.set(0.05, 0, -4.75);
    s.add(table);
    this.mark("table", "Production table — scripts, products, the plan", table, 1.0, 0.64, 0.76);
    this.mark("bay", "Second edit bay", bay, 1.5, 0.52, 0.64);
    for (const x of [-0.5, 0.6]) {
      const cordL = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 1.6, 6), cableMat);
      cordL.position.set(x, 3.0, -4.75);
      const pendant = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.16, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0x0f0f0f, roughness: 0.5, side: THREE.DoubleSide }));
      pendant.position.set(x, 2.15, -4.75);
      const pb = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 10), new THREE.MeshBasicMaterial({ color: 0xfff1b0 }));
      pb.position.set(x, 2.09, -4.75);
      s.add(cordL, pendant, pb);
      B.glows.push(pb.material as THREE.MeshBasicMaterial);
      const sp = new THREE.SpotLight(0xffe7a0, 0, 4, 0.75, 0.6, 1.3);
      sp.position.set(x, 2.08, -4.75);
      sp.target.position.set(x, 0.7, -4.75);
      s.add(sp, sp.target);
      B.lights.push({ l: sp, i: 9 });
    }

    // ================= ZONE C: the set =================
    const C = this.zone(0.64);
    // a cyc: floor sweeping up into a wall
    const cycMat = new THREE.MeshStandardMaterial({ color: 0xd9d6cf, roughness: 0.9 });
    C.tints.push({ m: cycMat, c: new THREE.Color(0xd9d6cf) });
    const cycFloor = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 2.4), cycMat);
    cycFloor.rotation.x = -Math.PI / 2;
    cycFloor.position.set(0, 0.005, -9.4);
    cycFloor.receiveShadow = true;
    const cove = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 5.6, 24, 1, true, Math.PI, Math.PI / 2), cycMat);
    cove.rotation.z = Math.PI / 2;
    cove.position.set(0, 0.8, -10.6);
    cove.material.side = THREE.DoubleSide;
    const cycWall = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 3.4), cycMat);
    cycWall.position.set(0, 2.5, -11.4);
    s.add(cycFloor, cove, cycWall);
    // talent on a stool
    const stool = new THREE.Group();
    const stTop = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.04, 24), new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.5 }));
    stTop.position.y = 0.66;
    stool.add(stTop);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const sl = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.68, 6), steel);
      sl.position.set(Math.cos(a) * 0.12, 0.33, Math.sin(a) * 0.12);
      sl.rotation.z = Math.cos(a) * 0.15;
      sl.rotation.x = -Math.sin(a) * 0.15;
      stool.add(sl);
    }
    stool.position.set(0, 0, -9.2);
    s.add(stool);
    const talent = makePerson({ sex: "f", outfit: "tee", top: 0x101010, bottom: 0x2a2626, hair: "bob01", hairColor: 0x2a1d14, shoes: "boots", skin: "skin_f_light", trimFringe: true });
    talent.root.position.set(0, 0, -9.12);
    s.add(talent.root);
    const kneeL = talent.root.localToWorld(new THREE.Vector3(0.12, 0.7, 0.36));
    const kneeR = talent.root.localToWorld(new THREE.Vector3(-0.12, 0.7, 0.36));
    this.crew.push({
      p: talent,
      seed: 3,
      pose: (k) => {
        applyPose(talent, POSES.sit, { hipY: 0.76, hipL: [0.12, 0, 0.12], kneeL: [-0.18, 0, 0], hipR: [0.12, 0, -0.1], kneeR: [-0.12, 0, 0], ankleL: [-0.1, 0, 0], ankleR: [-0.1, 0, 0], head: [0, Math.sin(k * 0.4) * 0.15, 0], spine: [0.04, 0, 0] });
        reach(talent, "L", kneeL, new THREE.Vector3(1, -0.5, -1));
        reach(talent, "R", kneeR, new THREE.Vector3(-1, -0.5, -1));
      },
    });
    this.mark("talent", "Talent", talent.root, 1.55, 0.8, 0.92);
    // camera on sticks + DOP
    const setCam = cinemaCamera(T);
    setCam.group.position.set(0.1, 1.45, -7.2);
    setCam.group.rotation.y = -Math.PI / 2;
    s.add(setCam.group);
    this.dimWith(setCam.group, C);
    const dop = makePerson({ sex: "m", outfit: "jacket", hair: "short04", hairColor: 0x1d1612, shoes: "sneakers" });
    dop.root.position.set(0.34, 0, -6.45);
    dop.root.rotation.y = Math.PI;
    s.add(dop.root);
    this.crew.push({
      p: dop,
      seed: 4,
      pose: () => {
        applyPose(dop, POSES.stand, { spine: [0.14, 0.12, 0], neck: [0.1, 0, 0], head: [0.08, 0.2, 0], gripR: 0.6, gripL: 0.5 });
        reach(dop, "R", new THREE.Vector3(0.36, 1.38, -6.92), new THREE.Vector3(1, -1, 1));
        reach(dop, "L", new THREE.Vector3(0.08, 1.7, -7.08), new THREE.Vector3(-1, -0.6, 1));
      },
    });
    this.mark("dop", "DOP", dop.root, 1.95, 0.8, 0.92);
    // two softboxes and an LED panel
    for (const sx of [-1, 1]) {
      const sb = softbox();
      sb.group.position.set(sx * 1.75, 1.75, -8.3);
      sb.group.lookAt(0, 1.2, -9.15);
      s.add(sb.group);
      C.glows.push(sb.face.material as THREE.MeshBasicMaterial);
      const ra = new THREE.RectAreaLight(0xfff6e8, 0, 0.76, 0.76);
      ra.position.copy(sb.group.position);
      ra.lookAt(0, 1.2, -9.15);
      s.add(ra);
      C.lights.push({ l: ra, i: 9 });
    }
    const led = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.9), new THREE.MeshBasicMaterial({ color: 0xf9fe02, toneMapped: false }));
    led.position.set(-2.6, 1.4, -9.8);
    led.rotation.y = 0.9;
    s.add(led);
    C.glows.push(led.material as THREE.MeshBasicMaterial);
    const ledL = new THREE.RectAreaLight(0xf9fe02, 0, 0.5, 0.9);
    ledL.position.copy(led.position);
    ledL.lookAt(0, 1.2, -9.15);
    s.add(ledL);
    C.lights.push({ l: ledL, i: 4 });
    const boom = microphone();
    boom.position.set(-0.2, 2.25, -9.0);
    boom.rotation.y = -Math.PI / 2;
    boom.rotation.z = 0.2;
    s.add(boom);
    // the director at a monitor on a stand
    const dirMon = new THREE.Group();
    const dm = new THREE.Mesh(new RoundedBoxGeometry(0.46, 0.28, 0.04, 2, 0.008), new THREE.MeshStandardMaterial({ color: 0x0a0a0a }));
    const dms = new THREE.Mesh(new THREE.PlaneGeometry(0.43, 0.25), new THREE.MeshBasicMaterial({ map: T.monitor, toneMapped: false }));
    dms.position.z = 0.021;
    const dst = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.3, 8), steel);
    dst.position.y = -0.7;
    dirMon.add(dm, dms, dst);
    C.glows.push(dms.material as THREE.MeshBasicMaterial);
    dirMon.position.set(-1.55, 1.38, -6.1);
    dirMon.rotation.y = 0.35;
    s.add(dirMon);
    const dChair = directorsChair(T);
    dChair.position.set(-1.35, 0, -5.4);
    dChair.rotation.y = Math.PI + 0.35;
    s.add(dChair);
    this.dimWith(dChair, C);
    const director = makePerson({ sex: "m", outfit: "shirt", hair: "short01", hairColor: 0x2a2a2a, shoes: "boots", skin: "skin_m_deep" });
    director.root.position.set(-1.33, 0, -5.4);
    director.root.rotation.y = Math.PI + 0.35;
    s.add(director.root);
    const dKnee = director.root.localToWorld(new THREE.Vector3(-0.1, 0.92, 0.42));
    this.crew.push({
      p: director,
      seed: 5,
      pose: (k) => {
        applyPose(director, POSES.sit, { hipY: 0.9, spine: [0.22, 0, 0], head: [-0.05, 0, 0], kneeL: [-0.1, 0, 0], kneeR: [-0.1, 0, 0] });
        // a hand at his chin, watching the monitor; the other on his knee
        reach(director, "L", anchorWorld(director, "mouth", this.V).add(new THREE.Vector3(0, -0.085, 0).applyQuaternion(director.root.quaternion)).addScaledVector(new THREE.Vector3(0, 0, 1).applyQuaternion(director.root.quaternion), 0.02), new THREE.Vector3(0.6, -1, 0.3).applyQuaternion(director.root.quaternion));
        reach(director, "R", dKnee, new THREE.Vector3(-1, -0.4, -0.5).applyQuaternion(director.root.quaternion));
        void k;
      },
    });
    this.mark("director", "Director — the monitor", dirMon, 0.3, 0.8, 0.92);
    // C-stands
    for (const [x, z] of [
      [2.4, -7.2],
      [-2.5, -7.0],
    ]) {
      const cs = new THREE.Group();
      const up = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 2.3, 8), steel);
      up.position.y = 1.15;
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 1.2, 8), steel);
      arm.rotation.z = Math.PI / 2;
      arm.position.set(-0.4, 2.2, 0);
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.4), new THREE.MeshStandardMaterial({ color: 0x050505, side: THREE.DoubleSide }));
      flag.position.set(-0.9, 2.05, 0);
      cs.add(up, arm, flag);
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        const lg4 = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.6, 6), steel);
        lg4.position.set(Math.cos(a) * 0.2, 0.15, Math.sin(a) * 0.2);
        lg4.rotation.z = Math.cos(a) * 1.1;
        lg4.rotation.x = -Math.sin(a) * 1.1;
        cs.add(lg4);
      }
      cs.position.set(x, 0, z);
      cs.rotation.y = x > 0 ? 0 : Math.PI;
      s.add(cs);
    }
    if (!low) {
      const producer = makePerson({ sex: "f", outfit: "blouse", hair: "ponytail01", hairColor: 0x2b1a12, shoes: "boots", glasses: true });
      producer.root.position.set(-2.05, 0, -6.45);
      producer.root.rotation.y = 2.5;
      s.add(producer.root);
      this.mark("producer", "Producer — the call sheet", producer.root, 1.95, 0.8, 0.92);
      const clip = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.27, 0.008), new THREE.MeshStandardMaterial({ map: paperTexture(["CALL SHEET", "DAY 03 · 09:00", "EP.01 INTRO", "SET A · CYC", "TALENT: 2", "WRAP 18:30"], { title: "SHOOT" }), roughness: 0.8 }));
      clip.position.copy(producer.root.localToWorld(new THREE.Vector3(0.04, 1.1, 0.3)));
      clip.quaternion.copy(producer.root.quaternion).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.95, 0, 0)));
      s.add(clip);
      const holdL = producer.root.localToWorld(new THREE.Vector3(0.12, 1.02, 0.28));
      const pen = producer.root.localToWorld(new THREE.Vector3(-0.02, 1.12, 0.32));
      this.crew.push({
        p: producer,
        seed: 6,
        pose: (k) => {
          applyPose(producer, POSES.stand, { neck: [0.25, 0, 0], head: [0.2, 0, 0], gripL: 0.7 });
          reach(producer, "L", holdL, new THREE.Vector3(1, -1, 0).applyQuaternion(producer.root.quaternion));
          reach(producer, "R", this.V.copy(pen).add(new THREE.Vector3(Math.sin(k * 1.7) * 0.02, 0, 0)), new THREE.Vector3(-1, -1, 0).applyQuaternion(producer.root.quaternion));
        },
      });
    }

    // a key light over the whole place that only matters for the wide shot at the end
    const overhead = new THREE.DirectionalLight(0xfff2dc, 0);
    overhead.position.set(2, 8, 0);
    overhead.target.position.set(0, 0, -5);
    s.add(overhead, overhead.target);
    const all = this.zone(0.84);
    all.lights.push({ l: overhead, i: 0.9 });

    s.traverse((n) => {
      const m = n as THREE.Mesh;
      if (m.isMesh) m.receiveShadow = true;
    });
  }

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.cam.aspect = w / h;
    // the subject sits right of centre on wide screens (copy lives on the left columns) and
    // above centre on tall ones (copy lives at the bottom)
    const tall = w / h < 1;
    this.cam.fov = tall ? 60 : 38;
    this.cam.setViewOffset(w, h, tall ? 0 : -w * 0.11, tall ? h * 0.12 : 0, w, h);
    this.cam.updateProjectionMatrix();
  }

  labels(t: number): Label[] {
    const out: Label[] = [];
    for (const m of this.marks) {
      const a = sm(m.a, m.a + 0.02, t) * (1 - sm(m.b - 0.02, m.b, t));
      if (a <= 0.01) continue;
      m.o.getWorldPosition(this.tmp);
      this.tmp.y += m.dy;
      this.tmp.project(this.cam);
      if (this.tmp.z > 1 || Math.abs(this.tmp.x) > 0.95 || Math.abs(this.tmp.y) > 0.9) continue;
      const x = (this.tmp.x * 0.5 + 0.5) * this.w;
      const y = (-this.tmp.y * 0.5 + 0.5) * this.h;
      // never on top of the copy: the left columns on wide screens, the bottom on tall ones
      if (this.w >= 768 ? x < this.w * 0.46 : y > this.h * 0.56) continue;
      out.push({ id: m.id, text: m.text, x, y, a, pin: m.pin });
    }
    return out;
  }

  // ------------------------------------------------------------------------------------------
  render(t: number, clock: number, pointer: { x: number; y: number }) {
    const out = sm(0.93, 1.0, t); // lights out
    // camera
    camAt(t, this.p, this.l);
    this.p.x += pointer.x * 0.08;
    this.p.y += pointer.y * 0.05 + Math.sin(clock * 0.5) * 0.008;
    this.cam.position.copy(this.p);
    this.cam.lookAt(this.l);

    // zones come up as the camera reaches them, and all go out at the end
    for (const z of this.zones) {
      const lit = z.at === 0 ? 1 : sm(z.at, z.at + 0.1, t);
      for (const { l, i } of z.lights) l.intensity = i * lit * (1 - out);
      for (const g of z.glows) g.color.setScalar((0.08 + 0.92 * lit) * (1 - out));
      for (const { m, c } of z.tints) m.color.copy(c).multiplyScalar((0.06 + 0.94 * lit) * (1 - out));
    }
    this.scene.environmentIntensity = 0.12 * (1 - out);
    this.master.intensity = 0.12 * (1 - out) + sm(0.6, 0.8, t) * 0.1 * (1 - out);
    (this.scene.fog as THREE.FogExp2).density = lerp(0.075, 0.045, sm(0.4, 0.9, t));

    // the edit keeps playing; the playhead creeps and gets scrubbed
    const scrub = Math.sin(clock * 0.9) * 0.03 + Math.sin(clock * 2.3) * 0.008;
    const head = ((clock * 0.012) % 0.8) + 0.1 + scrub;
    this.edit.update(clock, head);

    // the editor: right hand on the mouse, scrubbing; left on the keys; now and then a hand up to the headphones
    const e = this.editor;
    const adjust = Math.max(0, Math.sin(((clock % 14) / 14) * Math.PI * 2 - 4.9)) ** 3; // one slow reach every ~14 s
    const typing = Math.sin(clock * 0.21) > 0.4 ? Math.max(0, Math.sin(clock * 11)) : 0;
    applyPose(e, POSES.sit, { hipY: 0.6, spine: [0.16, 0, 0], neck: [0.04, 0, 0], head: [0.08, Math.sin(clock * 0.31) * 0.05, 0], gripR: 0.35, gripL: 0.3 });
    breathe(e, clock, 0, 0.6);
    this.mouse.position.x = 0.32 - scrub * 0.35;
    reach(e, "R", this.V.set(this.mouse.position.x + 0.01, 0.81, 0.27), POLE_R);
    orientHand(e, "R", AWAY, DOWN);
    const keys = this.V.set(-0.17, 0.81 + typing * 0.012, 0.3);
    if (adjust > 0.001) keys.lerp(anchorWorld(e, "earL", this.tmp).add(new THREE.Vector3(-0.06, -0.02, 0.02)), adjust);
    reach(e, "L", keys, POLE_L);
    if (adjust < 0.5) orientHand(e, "L", AWAY, DOWN);
    blink(e, clock, 0);
    // crew: small, believable business
    for (const c of this.crew) {
      const k = clock + c.seed * 3.1;
      c.pose(k);
      breathe(c.p, k, c.seed);
      blink(c.p, k, c.seed);
    }
    this.steam.forEach((st, i) => {
      st.position.y = 0.9 + ((clock * 0.05 + i * 0.33) % 1) * 0.12;
      (st.material as THREE.MeshBasicMaterial).opacity = 0.05 * Math.sin(((clock * 0.05 + i * 0.33) % 1) * Math.PI) * (1 - out);
      st.lookAt(this.cam.position);
    });

    this.renderer.setRenderTarget(null);
    this.renderer.render(this.scene, this.cam);
  }

  dispose() {
    this.scene.traverse((n) => {
      const m = n as THREE.Mesh;
      if (m.isMesh) m.geometry.dispose();
    });
  }
}
