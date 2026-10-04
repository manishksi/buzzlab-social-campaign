import { clamp, hash, invLerp, lerp, smooth } from "@/lib/math";

/**
 * THE CHARACTER — one continuous shot from ACT 04 to the end.
 *
 * An original noir figure in profile on the right of the frame: a flip-top lighter in his hand,
 * an unlit cigarette in his mouth. Spark → Flame → Light plays out on him:
 *   spark  — the thumb rolls the wheel, a few sparks, no flame
 *   flame  — the lighter catches; warm light finds his face
 *   light  — he lights the cigarette, and it burns down as the presentation goes on
 * and at the end he takes a final drag, drops it and steps on it.
 *
 * His story ends with Phase 03; after FINALE_B the shot is black and the film hands over.
 * Everything is drawn in "units": 1 unit = the height of his head. All scroll-driven states are pure
 * functions of film time `t`, so scrubbing backwards plays the shot backwards. ACT 04 can also
 * preview a phase on hover, which blends in on top of the scroll state.
 */

export type ScenePreview = "spark" | "flame" | "light" | null;
export type SceneFrame = { t: number; clock: number; dt: number; velocity: number; preview: ScenePreview };

/** Screen-space points other components can aim at (the ignite transition grows out of the flame). */
export const scenePoints = { flame: { x: -1, y: -1 }, ember: { x: -1, y: -1 } };

// ---------------------------------------------------------------------------------------------
// Timeline (film time). The film sits at: 0.46 ACT 04 · 0.5 Spark · 0.6 Flame · 0.76 Light ·
// 0.94 the last cigarette · 1.08 black.
// ---------------------------------------------------------------------------------------------
export const DRAGS: [number, number][] = [
  [0.662, 0.68], // the first pull that lights it
  [0.795, 0.81],
  [0.852, 0.868],
  [0.902, 0.916],
  [0.957, 0.974], // the final drag
];
export const EXHALES: [number, number, number][] = [
  [0.68, 0.73, 1],
  [0.81, 0.845, 0.75],
  [0.868, 0.9, 0.85],
  [0.916, 0.94, 0.6],
  [0.975, 0.998, 1.1],
];
const BURN: [number, number][] = [
  [0.676, 0],
  [0.76, 0.1],
  [0.93, 0.78],
  [0.974, 0.9],
  [1.2, 0.9],
];
// the end of his story: final drag → drop → boot → ember out → black
export const FINALE_A = 0.94;
export const FINALE_B = 1.08;

export type P = {
  present: number; // the shot fades up from black
  hand: number; // lighter hand in frame
  pose: number; // 0 rest · 1 spark · 2 flame · 3 at the cigarette
  lid: number;
  strike: number; // wheel strikes per second
  flame: number;
  lit: number;
  burn: number;
  drag: number;
  lean: number; // head dips toward the flame
  take: number; // ending: fingers come up and take the cigarette
  away: number; // …take it from his lips
  lower: number; // …lower it
  fall: number; // …drop it
  tilt: number; // the camera follows it down
  land: number;
  step: number;
  stub: number;
  out: number; // ember extinguished
  lift: number;
  fade: number;
};
export const P_KEYS: (keyof P)[] = ["present", "hand", "pose", "lid", "strike", "flame", "lit", "burn", "drag", "lean", "take", "away", "lower", "fall", "tilt", "land", "step", "stub", "out", "lift", "fade"];
export const blank = (): P => Object.fromEntries(P_KEYS.map((k) => [k, 0])) as P;

function piecewise(pts: [number, number][], t: number) {
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 0; i < pts.length - 1; i++) {
    const [a, va] = pts[i];
    const [b, vb] = pts[i + 1];
    if (t <= b) return lerp(va, vb, (t - a) / (b - a));
  }
  return pts[pts.length - 1][1];
}
const pulse = (a: number, b: number, t: number) => {
  const d = b - a;
  return smooth(a, a + d * 0.35, t) * (1 - smooth(a + d * 0.6, b, t));
};

/** Every state of his story as a pure function of film time (shared with the 3D version, machine/lighter.ts). */
export function scrollParams(t: number): P {
  const p = blank();
  p.present = smooth(0.435, 0.468, t);
  p.hand = smooth(0.44, 0.475, t) * (1 - smooth(0.7, 0.735, t));
  p.pose = smooth(0.497, 0.515, t) + smooth(0.586, 0.6, t) + smooth(0.625, 0.66, t) - smooth(0.69, 0.705, t);
  p.lid = smooth(0.497, 0.507, t) * (1 - smooth(0.698, 0.708, t));
  p.strike = t > 0.507 && t < 0.586 ? 0.42 : 0;
  p.flame = smooth(0.591, 0.603, t) * (1 - smooth(0.69, 0.699, t));
  p.lit = smooth(0.66, 0.676, t);
  p.burn = piecewise(BURN, t);
  p.drag = Math.max(...DRAGS.map(([a, b]) => pulse(a, b, t)));
  p.lean = smooth(0.625, 0.655, t) * (1 - smooth(0.68, 0.705, t));
  // the ending
  const u = invLerp(FINALE_A, FINALE_B, t);
  p.take = smooth(0.05, 0.16, u);
  p.away = smooth(0.22, 0.3, u);
  p.lower = smooth(0.3, 0.42, u);
  p.fall = invLerp(0.42, 0.5, u);
  p.tilt = smooth(0.34, 0.53, u);
  p.land = invLerp(0.495, 0.54, u);
  p.step = invLerp(0.55, 0.65, u);
  p.stub = invLerp(0.65, 0.78, u);
  p.out = smooth(0.7, 0.8, u);
  p.lift = smooth(0.8, 0.88, u);
  p.fade = smooth(0.86, 1, u);
  return p;
}

export function previewParams(kind: Exclude<ScenePreview, null>, s: number): P {
  const p = blank();
  p.present = 1;
  p.hand = 1;
  p.lid = 1;
  if (kind === "spark") {
    p.pose = 1;
    p.strike = 1.7;
  } else if (kind === "flame") {
    p.pose = 2;
    p.flame = 1;
  } else {
    // the payoff: up to the cigarette, it catches, the lighter closes, the first exhale
    p.pose = 2 + smooth(0.05, 0.75, s) - smooth(1.75, 2.3, s);
    p.flame = 1 - smooth(1.55, 1.68, s);
    p.lid = 1 - smooth(1.7, 1.82, s);
    p.lit = smooth(0.62, 0.8, s);
    p.drag = pulse(0.6, 1.3, s);
    p.lean = smooth(0.1, 0.6, s) * (1 - smooth(1.3, 1.8, s));
  }
  return p;
}

// ---------------------------------------------------------------------------------------------
// The figure, in head units. He faces left. (0,0) is the front of the hairline/top of the skull,
// the chin sits at y≈1, the floor at y=FLOOR.
// ---------------------------------------------------------------------------------------------
const FLOOR = 7.4;
const HEAD_CENTER = { x: 0.38, y: 0.5 };
const NECK_PIVOT = { x: 0.46, y: 1.1 };
const LIPS = { x: -0.036, y: 0.79 };
const CIG_ANGLE = Math.PI - 0.2; // pointing left, a little down
const CIG = { len: 0.36, filter: 0.1, width: 0.034 };
const EYE = { x: 0.045, y: 0.469 };

const HEAD_BOX = { x0: -0.24, y0: -0.18, x1: 1.02, y1: 1.5 };

function headPath() {
  const p = new Path2D();
  p.moveTo(0.17, 1.5);
  p.bezierCurveTo(0.15, 1.32, 0.14, 1.17, 0.11, 1.07); // throat
  p.bezierCurveTo(0.08, 1.02, 0.03, 0.995, -0.005, 0.985); // under the chin
  p.bezierCurveTo(-0.035, 0.977, -0.052, 0.945, -0.05, 0.905); // chin
  p.bezierCurveTo(-0.048, 0.878, -0.032, 0.864, -0.016, 0.857); // into the fold under the lip
  p.bezierCurveTo(-0.03, 0.846, -0.051, 0.83, -0.051, 0.813); // lower lip
  p.bezierCurveTo(-0.051, 0.8, -0.041, 0.792, -0.032, 0.789);
  p.bezierCurveTo(-0.046, 0.783, -0.055, 0.77, -0.051, 0.756); // upper lip
  p.bezierCurveTo(-0.047, 0.742, -0.039, 0.729, -0.041, 0.716); // philtrum
  p.bezierCurveTo(-0.07, 0.713, -0.106, 0.707, -0.124, 0.686); // under the nose
  p.bezierCurveTo(-0.134, 0.673, -0.13, 0.652, -0.118, 0.632); // tip
  p.bezierCurveTo(-0.096, 0.585, -0.062, 0.532, -0.043, 0.477); // bridge
  p.bezierCurveTo(-0.037, 0.461, -0.031, 0.451, -0.035, 0.436); // nasion
  p.bezierCurveTo(-0.043, 0.419, -0.046, 0.396, -0.04, 0.372); // brow ridge
  p.bezierCurveTo(-0.031, 0.31, -0.02, 0.22, 0.012, 0.15); // forehead
  p.bezierCurveTo(-0.012, 0.118, -0.024, 0.07, -0.004, 0.03); // the front of the hair
  p.bezierCurveTo(0.03, -0.045, 0.16, -0.095, 0.34, -0.095);
  p.bezierCurveTo(0.56, -0.095, 0.74, -0.035, 0.845, 0.075);
  p.bezierCurveTo(0.935, 0.18, 0.955, 0.36, 0.935, 0.5); // back of the skull
  p.bezierCurveTo(0.915, 0.66, 0.855, 0.78, 0.795, 0.88);
  p.bezierCurveTo(0.762, 0.95, 0.742, 1.1, 0.752, 1.25); // back of the neck
  p.lineTo(0.79, 1.5);
  p.closePath();
  return p;
}

function hairPath() {
  const p = new Path2D();
  p.moveTo(0.012, 0.15);
  p.bezierCurveTo(-0.012, 0.118, -0.024, 0.07, -0.004, 0.03);
  p.bezierCurveTo(0.03, -0.045, 0.16, -0.095, 0.34, -0.095);
  p.bezierCurveTo(0.56, -0.095, 0.74, -0.035, 0.845, 0.075);
  p.bezierCurveTo(0.935, 0.18, 0.955, 0.36, 0.935, 0.5);
  p.bezierCurveTo(0.915, 0.66, 0.855, 0.78, 0.795, 0.88);
  p.bezierCurveTo(0.76, 0.84, 0.7, 0.74, 0.655, 0.66); // nape, behind the ear
  p.bezierCurveTo(0.63, 0.55, 0.62, 0.47, 0.585, 0.415);
  p.bezierCurveTo(0.54, 0.4, 0.49, 0.405, 0.465, 0.42); // over the ear
  p.bezierCurveTo(0.46, 0.5, 0.458, 0.56, 0.448, 0.6); // sideburn
  p.lineTo(0.415, 0.6);
  p.bezierCurveTo(0.41, 0.52, 0.4, 0.44, 0.37, 0.39);
  p.bezierCurveTo(0.3, 0.33, 0.2, 0.27, 0.13, 0.22); // temple
  p.bezierCurveTo(0.08, 0.19, 0.04, 0.17, 0.012, 0.15);
  p.closePath();
  return p;
}

function earPath() {
  const p = new Path2D();
  p.moveTo(0.478, 0.45);
  p.bezierCurveTo(0.52, 0.415, 0.6, 0.42, 0.615, 0.49);
  p.bezierCurveTo(0.628, 0.56, 0.6, 0.6, 0.585, 0.65);
  p.bezierCurveTo(0.575, 0.7, 0.55, 0.72, 0.525, 0.712);
  p.bezierCurveTo(0.5, 0.705, 0.492, 0.67, 0.49, 0.63);
  p.bezierCurveTo(0.486, 0.57, 0.47, 0.5, 0.478, 0.45);
  p.closePath();
  return p;
}

/** Coat: shoulders and body, drawn behind the head. */
function torsoPath() {
  const p = new Path2D();
  p.moveTo(0.14, 1.3);
  p.bezierCurveTo(0.06, 1.42, -0.06, 1.56, -0.16, 1.72);
  p.bezierCurveTo(-0.27, 1.92, -0.33, 2.2, -0.35, 2.6);
  p.bezierCurveTo(-0.37, 3.2, -0.35, 3.9, -0.32, 4.95);
  p.lineTo(1.18, 4.95);
  p.bezierCurveTo(1.24, 4.0, 1.36, 3.0, 1.4, 2.3);
  p.bezierCurveTo(1.43, 1.95, 1.38, 1.72, 1.24, 1.56);
  p.bezierCurveTo(1.12, 1.42, 1.0, 1.3, 0.92, 1.12);
  p.lineTo(0.8, 1.1);
  p.bezierCurveTo(0.6, 1.16, 0.34, 1.22, 0.14, 1.3);
  p.closePath();
  return p;
}

/** The turned-up collar wrapping the neck, drawn in front of it. */
function collarPath() {
  const p = new Path2D();
  p.moveTo(0.93, 0.95);
  p.bezierCurveTo(0.8, 0.99, 0.58, 1.06, 0.4, 1.14);
  p.bezierCurveTo(0.27, 1.2, 0.17, 1.27, 0.11, 1.34);
  p.bezierCurveTo(0.07, 1.42, 0.02, 1.52, -0.06, 1.64);
  p.bezierCurveTo(-0.1, 1.7, -0.13, 1.74, -0.16, 1.78);
  p.bezierCurveTo(0.0, 1.7, 0.2, 1.56, 0.42, 1.42);
  p.bezierCurveTo(0.62, 1.3, 0.82, 1.22, 1.02, 1.17);
  p.bezierCurveTo(1.0, 1.08, 0.97, 1.0, 0.93, 0.95);
  p.closePath();
  return p;
}

/** Chelsea boot pointing left, origin at the ball of the foot on the ground. */
function bootPath() {
  const p = new Path2D();
  p.moveTo(-0.3, 0);
  p.bezierCurveTo(-0.36, -0.01, -0.37, -0.06, -0.33, -0.09);
  p.bezierCurveTo(-0.28, -0.13, -0.15, -0.16, -0.02, -0.2);
  p.bezierCurveTo(0.12, -0.24, 0.22, -0.3, 0.3, -0.38);
  p.lineTo(0.34, -0.55);
  p.lineTo(0.84, -0.55);
  p.bezierCurveTo(0.86, -0.4, 0.88, -0.25, 0.87, -0.1);
  p.lineTo(0.86, 0);
  p.closePath();
  return p;
}

function trouserPath(len: number) {
  const p = new Path2D();
  p.moveTo(0.31, -0.44);
  p.bezierCurveTo(0.27, -0.9, 0.22, -0.42 - len * 0.6, 0.2, -0.42 - len);
  p.lineTo(0.98, -0.42 - len);
  p.bezierCurveTo(0.96, -0.42 - len * 0.55, 0.92, -1.0, 0.9, -0.46);
  p.bezierCurveTo(0.8, -0.4, 0.62, -0.36, 0.48, -0.38);
  p.bezierCurveTo(0.4, -0.39, 0.34, -0.42, 0.31, -0.44);
  p.closePath();
  return p;
}

// ---------------------------------------------------------------------------------------------

type Spark = { x: number; y: number; vx: number; vy: number; life: number; max: number };

export class CharacterScene {
  private w = 0;
  private h = 0;
  private dpr = 1;
  private S = 1; // px per unit
  private ax = 0;
  private ay = 0;
  private mobile = false;
  private builtFor = "";
  private head: { dark: HTMLCanvasElement; lit: HTMLCanvasElement; rimW: HTMLCanvasElement; rimC: HTMLCanvasElement } | null = null;
  private comp = document.createElement("canvas");
  private compCtx = this.comp.getContext("2d")!;
  private smoke: HTMLCanvasElement[] = [];
  private glow: HTMLCanvasElement;
  private bokeh: HTMLCanvasElement;
  private sparks: Spark[] = [];
  private paths = { head: headPath(), hair: hairPath(), ear: earPath(), torso: torsoPath(), collar: collarPath(), boot: bootPath() };

  // preview blending and discrete events
  private kind: ScenePreview = null;
  private since = 0;
  private mixW = 0;
  private prev: P = blank();
  private strikePhase = 0;
  private strikeT = 1;
  private wheel = 0;
  private flash = 0;
  private lastFlame = 0;

  constructor(private lowPower: boolean) {
    this.glow = this.makeGlow();
    this.bokeh = this.makeBokeh();
    for (let i = 0; i < 3; i++) this.smoke.push(this.makeSmoke(i));
  }

  resize(w: number, h: number, dpr: number) {
    this.w = w;
    this.h = h;
    this.dpr = dpr;
    this.mobile = w < 760;
    this.S = this.mobile ? Math.min(h * 0.2, w * 0.4) : Math.min(h * 0.31, w * 0.2);
    this.ax = this.mobile ? w * 0.7 : w * 0.765;
    this.ay = this.mobile ? h * 0.63 : h * 0.4;
    // repaint the head only when its size really changes (not on every mobile toolbar resize)
    const key = `${Math.round(this.S)}@${dpr}`;
    if (key !== this.builtFor) {
      this.builtFor = key;
      this.buildHead();
    }
  }

  // ------------------------------------------------------------------------------------------
  // Offscreen paint: the head is painted once per resize (dark, lit, two rims) and composited
  // each frame with a light mask, so the face can be lit by whatever is burning in front of it.
  // ------------------------------------------------------------------------------------------
  private layer() {
    const k = this.S * this.dpr;
    const c = document.createElement("canvas");
    c.width = Math.ceil((HEAD_BOX.x1 - HEAD_BOX.x0) * k);
    c.height = Math.ceil((HEAD_BOX.y1 - HEAD_BOX.y0) * k);
    const g = c.getContext("2d")!;
    g.setTransform(k, 0, 0, k, -HEAD_BOX.x0 * k, -HEAD_BOX.y0 * k);
    return { c, g, k };
  }

  /** Soft shape: drawn far off-canvas, only its blurred shadow lands in place. */
  private soft(g: CanvasRenderingContext2D, k: number, blur: number, color: string, draw: (g: CanvasRenderingContext2D) => void) {
    g.save();
    g.shadowColor = color;
    g.shadowBlur = blur * k;
    g.shadowOffsetX = 6000;
    g.translate(-6000 / k, 0);
    g.fillStyle = "#000";
    g.strokeStyle = "#000";
    draw(g);
    g.restore();
  }

  private buildHead() {
    const { head, hair, ear } = this.paths;
    // --- lit: the face as warm light from the front would show it
    const L = this.layer();
    const g = L.g;
    const k = L.k;
    g.save();
    g.clip(head);
    const sk = g.createLinearGradient(-0.14, 0, 0.95, 0);
    sk.addColorStop(0, "#e2a37a");
    sk.addColorStop(0.08, "#bf7a4f");
    sk.addColorStop(0.17, "#7a4127");
    sk.addColorStop(0.3, "#361b0d");
    sk.addColorStop(0.48, "#150b06");
    sk.addColorStop(1, "#070403");
    g.fillStyle = sk;
    g.fillRect(-0.3, -0.3, 1.5, 2);
    const nv = g.createLinearGradient(0, 0.9, 0, 1.45);
    nv.addColorStop(0, "rgba(12,7,4,0)");
    nv.addColorStop(1, "rgba(12,7,4,0.9)");
    g.fillStyle = nv;
    g.fillRect(-0.3, 0.9, 1.5, 0.7);

    // planes and shadows
    this.soft(g, k, 0.035, "rgba(20,8,3,0.75)", (s) => s.fill(new Path2D("M0.02 0.44 C0.06 0.43 0.13 0.43 0.16 0.46 C0.15 0.5 0.1 0.51 0.05 0.5 Z"))); // eye socket
    this.soft(g, k, 0.02, "rgba(255,214,170,0.35)", (s) => {
      s.beginPath();
      s.ellipse(-0.03, 0.39, 0.02, 0.035, 0, 0, Math.PI * 2);
      s.fill();
    }); // brow ridge catch
    this.soft(g, k, 0.012, "rgba(255,220,180,0.45)", (s) => {
      s.lineWidth = 0.014;
      s.beginPath();
      s.moveTo(-0.05, 0.5);
      s.bezierCurveTo(-0.07, 0.56, -0.1, 0.61, -0.113, 0.66);
      s.stroke();
    }); // bridge highlight
    this.soft(g, k, 0.012, "rgba(255,226,190,0.5)", (s) => {
      s.beginPath();
      s.arc(-0.112, 0.668, 0.014, 0, Math.PI * 2);
      s.fill();
    }); // tip
    this.soft(g, k, 0.012, "rgba(18,6,2,0.85)", (s) => {
      s.beginPath();
      s.ellipse(-0.05, 0.712, 0.035, 0.009, -0.15, 0, Math.PI * 2);
      s.fill();
    }); // under the nose
    this.soft(g, k, 0.008, "rgba(30,10,4,0.7)", (s) => {
      s.lineWidth = 0.008;
      s.beginPath();
      s.moveTo(-0.008, 0.655);
      s.bezierCurveTo(0.03, 0.665, 0.035, 0.7, 0.002, 0.712);
      s.stroke();
    }); // nose wing
    this.soft(g, k, 0.018, "rgba(30,10,4,0.55)", (s) => {
      s.lineWidth = 0.012;
      s.beginPath();
      s.moveTo(0.02, 0.672);
      s.bezierCurveTo(0.05, 0.72, 0.055, 0.77, 0.045, 0.815);
      s.stroke();
    }); // nasolabial fold
    this.soft(g, k, 0.006, "rgba(110,40,28,0.55)", (s) => {
      s.beginPath();
      s.moveTo(-0.05, 0.756);
      s.bezierCurveTo(-0.03, 0.75, 0.0, 0.77, 0.028, 0.796);
      s.lineTo(-0.033, 0.79);
      s.closePath();
      s.fill();
      s.beginPath();
      s.moveTo(-0.033, 0.791);
      s.lineTo(0.026, 0.8);
      s.bezierCurveTo(0.0, 0.83, -0.03, 0.835, -0.05, 0.814);
      s.closePath();
      s.fill();
    }); // lips
    this.soft(g, k, 0.006, "rgba(15,5,2,0.9)", (s) => {
      s.lineWidth = 0.006;
      s.beginPath();
      s.moveTo(-0.034, 0.79);
      s.bezierCurveTo(-0.01, 0.792, 0.01, 0.797, 0.03, 0.8);
      s.stroke();
    }); // mouth line
    this.soft(g, k, 0.012, "rgba(255,210,170,0.3)", (s) => {
      s.beginPath();
      s.ellipse(-0.04, 0.822, 0.012, 0.008, 0, 0, Math.PI * 2);
      s.fill();
    }); // lower lip catch
    this.soft(g, k, 0.015, "rgba(20,8,3,0.6)", (s) => {
      s.beginPath();
      s.ellipse(-0.01, 0.86, 0.03, 0.012, 0, 0, Math.PI * 2);
      s.fill();
    }); // under the lip
    this.soft(g, k, 0.02, "rgba(255,210,170,0.28)", (s) => {
      s.beginPath();
      s.ellipse(-0.035, 0.93, 0.02, 0.03, 0, 0, Math.PI * 2);
      s.fill();
    }); // chin
    this.soft(g, k, 0.05, "rgba(255,200,150,0.22)", (s) => {
      s.beginPath();
      s.ellipse(0.1, 0.575, 0.07, 0.04, -0.3, 0, Math.PI * 2);
      s.fill();
    }); // cheekbone
    this.soft(g, k, 0.06, "rgba(20,8,3,0.5)", (s) => {
      s.beginPath();
      s.ellipse(0.2, 0.72, 0.09, 0.07, 0, 0, Math.PI * 2);
      s.fill();
    }); // under the cheekbone
    this.soft(g, k, 0.05, "rgba(20,8,3,0.4)", (s) => {
      s.beginPath();
      s.ellipse(0.24, 0.36, 0.08, 0.06, 0, 0, Math.PI * 2);
      s.fill();
    }); // temple
    this.soft(g, k, 0.03, "rgba(8,3,1,0.85)", (s) => {
      s.beginPath();
      s.moveTo(-0.01, 0.99);
      s.bezierCurveTo(0.15, 0.96, 0.33, 0.92, 0.46, 0.86);
      s.lineTo(0.52, 0.74);
      s.lineTo(0.7, 1.2);
      s.lineTo(0.1, 1.25);
      s.closePath();
      s.fill();
    }); // under the jaw

    // stubble
    g.save();
    const beard = new Path2D("M-0.05 0.73 L0.04 0.73 C0.07 0.78 0.12 0.8 0.2 0.8 C0.3 0.78 0.38 0.7 0.43 0.6 L0.46 0.62 C0.46 0.75 0.44 0.84 0.44 0.87 C0.3 0.93 0.15 0.97 -0.01 0.99 C-0.05 0.96 -0.055 0.9 -0.05 0.86 Z");
    g.clip(beard);
    g.fillStyle = "rgba(30,14,7,0.28)";
    g.fill(beard);
    for (let i = 0; i < 1800; i++) {
      const x = -0.06 + hash(i * 3.1) * 0.53;
      const y = 0.72 + hash(i * 7.7 + 1) * 0.28;
      g.fillStyle = `rgba(22,10,5,${0.1 + hash(i + 9) * 0.18})`;
      g.fillRect(x, y, 0.0026, 0.0026);
    }
    g.restore();

    // eye: heavy lid, a sliver of white, lashes
    g.fillStyle = "rgba(205,180,160,0.55)";
    g.beginPath();
    g.moveTo(0.034, 0.47);
    g.bezierCurveTo(0.05, 0.464, 0.075, 0.463, 0.092, 0.468);
    g.bezierCurveTo(0.075, 0.476, 0.05, 0.477, 0.034, 0.47);
    g.fill();
    g.fillStyle = "rgba(25,12,8,0.95)";
    g.beginPath();
    g.ellipse(0.043, 0.4705, 0.0075, 0.0058, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "rgba(14,6,3,0.95)";
    g.lineWidth = 0.007;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(0.03, 0.4695);
    g.bezierCurveTo(0.05, 0.4605, 0.08, 0.46, 0.1, 0.467);
    g.stroke();
    g.lineWidth = 0.004;
    g.strokeStyle = "rgba(30,12,6,0.6)";
    g.beginPath();
    g.moveTo(0.036, 0.453);
    g.bezierCurveTo(0.06, 0.446, 0.09, 0.447, 0.11, 0.456);
    g.stroke(); // lid crease
    g.beginPath();
    g.moveTo(0.038, 0.4755);
    g.bezierCurveTo(0.06, 0.479, 0.08, 0.479, 0.096, 0.474);
    g.stroke(); // lower lid
    // eyebrow
    g.strokeStyle = "rgba(16,8,4,0.95)";
    g.lineWidth = 0.022;
    g.beginPath();
    g.moveTo(-0.022, 0.415);
    g.bezierCurveTo(0.03, 0.4, 0.09, 0.398, 0.15, 0.414);
    g.stroke();
    for (let i = 0; i < 70; i++) {
      const s = hash(i + 40);
      const x = lerp(-0.025, 0.15, s);
      const y = 0.413 - Math.sin(s * Math.PI) * 0.012 + (hash(i + 90) - 0.5) * 0.012;
      g.strokeStyle = `rgba(${40 + hash(i) * 30},${22 + hash(i) * 14},12,0.7)`;
      g.lineWidth = 0.0025;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + 0.02, y - 0.006 + hash(i + 3) * 0.004);
      g.stroke();
    }
    // ear
    g.save();
    g.fillStyle = "#3a1d0f";
    g.fill(ear);
    g.clip(ear);
    this.soft(g, k, 0.015, "rgba(10,4,2,0.85)", (s) => {
      s.beginPath();
      s.ellipse(0.54, 0.58, 0.03, 0.06, 0.15, 0, Math.PI * 2);
      s.fill();
    });
    g.restore();
    g.restore();

    // hair: dark, with combed strands catching light
    g.save();
    g.clip(head);
    g.fillStyle = "#120a06";
    g.fill(hair);
    g.clip(hair);
    for (let i = 0; i < 420; i++) {
      const s = hash(i * 1.7);
      const r = hash(i * 2.3 + 5);
      const x0 = lerp(-0.01, 0.55, s);
      const y0 = lerp(-0.08, 0.2, r) + s * 0.05;
      const len = 0.12 + hash(i + 11) * 0.22;
      const warm = Math.pow(clamp(1 - s * 1.6), 1.5);
      g.strokeStyle = `rgba(${Math.round(60 + warm * 110)},${Math.round(38 + warm * 62)},${Math.round(22 + warm * 30)},${0.06 + warm * 0.3})`;
      g.lineWidth = 0.003 + hash(i + 2) * 0.003;
      g.beginPath();
      g.moveTo(x0, y0);
      g.quadraticCurveTo(x0 + len * 0.5, y0 - 0.03, x0 + len, y0 + 0.02 + s * 0.08);
      g.stroke();
    }
    g.restore();

    // --- dark: the silhouette, a faint memory of the face
    const D = this.layer();
    D.g.fillStyle = "#090909";
    D.g.fill(head);
    D.g.globalAlpha = 0.07;
    D.g.drawImage(L.c, HEAD_BOX.x0, HEAD_BOX.y0, HEAD_BOX.x1 - HEAD_BOX.x0, HEAD_BOX.y1 - HEAD_BOX.y0);

    // --- rims: crisp outer edge, soft inner falloff
    const rim = (color: string, dx: number, dy: number, blur: number) => {
      const R = this.layer();
      R.g.fillStyle = color;
      R.g.fill(head);
      R.g.globalCompositeOperation = "destination-out";
      R.g.save();
      R.g.translate(dx, dy);
      this.soft(R.g, R.k, blur, "#000", (s) => s.fill(head));
      R.g.restore();
      return R.c;
    };
    const rimW = rim("#ffd890", 0.014, -0.004, 0.012);
    const rimC = rim("#aab4bc", -0.006, 0.009, 0.014);
    {
      // the backlight catches the top of the hair and fades down the neck
      const g2 = rimC.getContext("2d")!;
      g2.globalCompositeOperation = "destination-in";
      const fade = g2.createLinearGradient(0, -0.1, 0, 1.3);
      fade.addColorStop(0, "rgba(0,0,0,1)");
      fade.addColorStop(0.45, "rgba(0,0,0,0.55)");
      fade.addColorStop(1, "rgba(0,0,0,0)");
      g2.fillStyle = fade;
      g2.fillRect(HEAD_BOX.x0, HEAD_BOX.y0, HEAD_BOX.x1 - HEAD_BOX.x0, HEAD_BOX.y1 - HEAD_BOX.y0);
      g2.globalCompositeOperation = "source-over";
      g2.lineCap = "round";
      for (let i = 0; i < 160; i++) {
        const a = lerp(-2.55, -0.12, hash(i * 1.3 + 2));
        const x = 0.44 + Math.cos(a) * 0.5;
        const y = 0.45 + Math.sin(a) * 0.545;
        const len = 0.02 + hash(i + 8) * 0.035;
        const tx = -Math.sin(a);
        const ty = Math.cos(a);
        g2.strokeStyle = `rgba(170,180,188,${0.08 + hash(i + 4) * 0.22})`;
        g2.lineWidth = 0.0018 + hash(i + 6) * 0.0016;
        g2.beginPath();
        g2.moveTo(x - tx * len * 0.3, y - ty * len * 0.3);
        g2.quadraticCurveTo(x + Math.cos(a) * 0.008, y + Math.sin(a) * 0.008, x + tx * len + Math.cos(a) * 0.01, y + ty * len + Math.sin(a) * 0.01);
        g2.stroke();
      }
    }
    this.head = { dark: D.c, lit: L.c, rimW, rimC };
    this.comp.width = L.c.width;
    this.comp.height = L.c.height;
  }

  private makeGlow() {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, "rgba(255,240,180,1)");
    r.addColorStop(0.18, "rgba(250,205,90,0.55)");
    r.addColorStop(0.5, "rgba(240,180,40,0.14)");
    r.addColorStop(1, "rgba(240,180,40,0)");
    g.fillStyle = r;
    g.fillRect(0, 0, 128, 128);
    return c;
  }

  private makeBokeh() {
    const c = document.createElement("canvas");
    c.width = c.height = 96;
    const g = c.getContext("2d")!;
    const r = g.createRadialGradient(48, 48, 0, 48, 48, 46);
    r.addColorStop(0, "rgba(255,255,255,0.55)");
    r.addColorStop(0.82, "rgba(255,255,255,0.75)");
    r.addColorStop(0.92, "rgba(255,255,255,0.9)");
    r.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = r;
    g.beginPath();
    g.arc(48, 48, 46, 0, Math.PI * 2);
    g.fill();
    return c;
  }

  private makeSmoke(seed: number) {
    const c = document.createElement("canvas");
    c.width = c.height = 160;
    const g = c.getContext("2d")!;
    for (let i = 0; i < 46; i++) {
      const a = hash(seed * 100 + i) * Math.PI * 2;
      const d = Math.pow(hash(seed * 100 + i + 50), 0.7) * 44;
      const x = 80 + Math.cos(a) * d;
      const y = 80 + Math.sin(a) * d * 0.8;
      const r = 14 + hash(seed * 100 + i + 20) * 26;
      const grad = g.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, "rgba(220,214,206,0.16)");
      grad.addColorStop(1, "rgba(220,214,206,0)");
      g.fillStyle = grad;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    return c;
  }

  // ------------------------------------------------------------------------------------------

  render(ctx: CanvasRenderingContext2D, { t, clock, dt, velocity, preview }: SceneFrame) {
    if (!this.head || t < 0.42 || t >= FINALE_B) {
      this.sparks.length = 0;
      scenePoints.flame.x = scenePoints.ember.x = -1;
      return 0;
    }
    // ---- state: scroll, with ACT 04's hover preview blended over it ----
    const scroll = scrollParams(t);
    const allowPreview = t > 0.42 && t < 0.52 ? preview : null;
    if (allowPreview !== this.kind) {
      if (allowPreview) {
        this.since = allowPreview === this.kind ? this.since : 0;
        if (allowPreview === "spark") this.strikePhase = 1;
      }
      this.kind = allowPreview;
    }
    this.since += dt;
    this.mixW += ((this.kind ? 1 : 0) - this.mixW) * Math.min(1, dt * 5);
    if (this.kind) {
      const target = previewParams(this.kind, this.since);
      const r = Math.min(1, dt * 7);
      for (const key of P_KEYS) this.prev[key] += (target[key] - this.prev[key]) * r;
    }
    const p = blank();
    for (const key of P_KEYS) p[key] = lerp(scroll[key], this.prev[key], this.mixW);
    p.present = Math.max(scroll.present, this.mixW);
    if (p.present < 0.005) return 0;

    // discrete events: wheel strikes and the moment of ignition
    this.strikePhase += p.strike * dt;
    if (this.strikePhase >= 1) {
      this.strikePhase = 0;
      this.strikeT = 0;
    }
    const prevStrike = this.strikeT;
    this.strikeT = Math.min(1, this.strikeT + dt / 0.16);
    const sparkNow = prevStrike < 0.35 && this.strikeT >= 0.35;
    if (sparkNow) this.wheel += 1.4;
    this.flash *= Math.exp(-dt * 12);
    const igniting = this.lastFlame < 0.06 && p.flame >= 0.06;
    this.lastFlame = p.flame;

    const { w, h, S, dpr } = this;
    const zoom = 1 + 0.05 * smooth(0.46, 1.0, t);
    const SZ = S * zoom;
    const camX = Math.sin(clock * 0.11) * 0.012 + Math.sin(clock * 0.07 + 1) * 0.008 + clamp(velocity * 0.00001, -0.01, 0.01);
    const camY = Math.sin(clock * 0.09 + 2) * 0.01 + p.tilt * 5.95;
    const ox = this.ax - HEAD_CENTER.x * SZ - camX * SZ;
    const oy = this.ay - HEAD_CENTER.y * SZ - camY * SZ;
    const toScreen = (x: number, y: number) => ({ x: ox + x * SZ, y: oy + y * SZ });
    const world = () => ctx.setTransform(dpr * SZ, 0, 0, dpr * SZ, dpr * ox, dpr * oy);

    const breathe = Math.sin(clock * 1.15) * 0.004;
    const headA = -0.07 * p.lean + Math.sin(clock * 0.37) * 0.006 + p.take * 0.02 * (1 - p.away);
    const headDX = -0.02 * p.lean;
    const headDY = 0.015 * p.lean + breathe;
    const headXform = (x: number, y: number) => {
      const dx = x - NECK_PIVOT.x;
      const dy = y - NECK_PIVOT.y;
      const c = Math.cos(headA);
      const s = Math.sin(headA);
      return { x: NECK_PIVOT.x + dx * c - dy * s + headDX, y: NECK_PIVOT.y + dx * s + dy * c + headDY };
    };

    // ---- the cigarette: in his mouth, then in his fingers, then on the floor ----
    const burnLen = CIG.len - (CIG.len - CIG.filter - 0.02) * p.burn;
    const mouthBase = headXform(LIPS.x, LIPS.y);
    const mouthAng = CIG_ANGLE + headA;
    // the hand that takes it: a pinch point at the filter
    const pinchMouth = { x: mouthBase.x + Math.cos(mouthAng) * 0.05, y: mouthBase.y + Math.sin(mouthAng) * 0.05 };
    const pinchAway = { x: -0.32, y: 1.22 };
    const pinchLow = { x: -0.42, y: 3.1 };
    let pinch = { x: lerp(-0.1, pinchMouth.x, smooth(0, 1, p.take)), y: lerp(2.7, pinchMouth.y, smooth(0, 1, p.take)) };
    pinch = { x: lerp(pinch.x, pinchAway.x, p.away), y: lerp(pinch.y, pinchAway.y, p.away) };
    pinch = { x: lerp(pinch.x, pinchLow.x, p.lower), y: lerp(pinch.y, pinchLow.y, p.lower) };
    const handAng = lerp(mouthAng, Math.PI + 0.12, p.away) + p.lower * 0.15;
    let cig: { x: number; y: number; a: number };
    const inHand = p.away > 0;
    if (!inHand) cig = { x: mouthBase.x, y: mouthBase.y, a: mouthAng };
    else cig = { x: pinch.x - Math.cos(handAng) * 0.05, y: pinch.y - Math.sin(handAng) * 0.05, a: handAng };
    const restX = pinchLow.x - 0.95;
    const groundY = FLOOR - CIG.width * 0.5;
    if (p.fall > 0) {
      const f = p.fall;
      const startX = pinchLow.x - Math.cos(handAng) * 0.05;
      const startY = pinchLow.y - Math.sin(handAng) * 0.05;
      cig = { x: lerp(startX, restX, f), y: lerp(startY, groundY, f * f), a: handAng + f * 2.6 * (1 - p.land) + p.land * (Math.PI * 2 + 0.06 - handAng - 2.6) };
      if (p.land > 0) {
        const b = Math.sin(p.land * Math.PI) * 0.06 * (1 - p.land);
        cig = { x: restX - p.land * 0.05, y: groundY - b, a: Math.PI * 2 + 0.06 + Math.sin(p.land * 9) * 0.05 * (1 - p.land) };
      }
    }
    const tip = { x: cig.x + Math.cos(cig.a) * burnLen, y: cig.y + Math.sin(cig.a) * burnLen };

    // ---- lighter hand ----
    const tipMouth = { x: mouthBase.x + Math.cos(mouthAng) * burnLen, y: mouthBase.y + Math.sin(mouthAng) * burnLen };
    const poses = [
      { x: -0.28, y: 1.98, a: -0.04 },
      { x: -0.32, y: 1.44, a: -0.08 },
      { x: -0.34, y: 1.26, a: -0.1 },
      { x: tipMouth.x + 0.012, y: tipMouth.y + 0.085, a: -0.12 },
    ];
    const pi = clamp(p.pose, 0, 3);
    const i0 = Math.min(2, Math.floor(pi));
    const f0 = smooth(0, 1, pi - i0);
    const hx = lerp(poses[i0].x, poses[i0 + 1].x, f0);
    const hy = lerp(poses[i0].y, poses[i0 + 1].y, f0) + (1 - p.hand) * 1.9;
    const ha = lerp(poses[i0].a, poses[i0 + 1].a, f0) + Math.sin(clock * 0.8) * 0.01;

    // ---- light ----
    const flicker = 0.9 + 0.06 * Math.sin(clock * 21) + 0.04 * Math.sin(clock * 33 + 1.3);
    const flameAt = { x: hx + Math.sin(ha) * -0.06, y: hy - 0.06 };
    const If = p.flame * flicker * p.hand;
    const breathEmber = 0.05 * Math.sin(clock * 1.7) + 0.03 * Math.sin(clock * 3.1);
    const Ie = p.lit * (0.2 + 0.65 * p.drag + breathEmber) * (1 - p.out);
    const Is = this.flash;
    const Itot = If + Ie + Is;
    const light = Itot > 0.001
      ? { x: (flameAt.x * (If + Is) + tip.x * Ie) / Itot, y: (flameAt.y * (If + Is) + tip.y * Ie) / Itot, r: ((If + Is) * 1.15 + Ie * 0.55) / Itot, i: Math.min(1.1, Itot) }
      : { x: tip.x, y: tip.y, r: 1, i: 0 };

    const fs = toScreen(flameAt.x, flameAt.y);
    scenePoints.flame.x = fs.x;
    scenePoints.flame.y = fs.y;
    const es = toScreen(tip.x, tip.y);
    scenePoints.ember.x = es.x;
    scenePoints.ember.y = es.y;

    // =========================================================================================
    // Draw
    // =========================================================================================
    const pres = p.present * (1 - p.fade);

    // backdrop: a far-off haze behind his head and a few out-of-focus lights
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const hazeY = this.ay - (0.3 + p.tilt * 5.95 * 0.55) * SZ;
    const hz = ctx.createRadialGradient(this.ax + 0.35 * SZ, hazeY, 0, this.ax + 0.35 * SZ, hazeY, 2.8 * SZ);
    hz.addColorStop(0, `rgba(60,58,54,${0.36 * pres})`);
    hz.addColorStop(0.45, `rgba(36,35,32,${0.18 * pres})`);
    hz.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = hz;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 9; i++) {
      const bx = this.ax + (0.6 + hash(i + 3) * 2.4 - (this.mobile ? 0.6 : 0)) * SZ - camX * SZ * 0.4 - i * 6;
      const by = this.ay + (-1.3 + hash(i + 7) * 1.9) * SZ - p.tilt * 5.95 * SZ * 0.35 + Math.sin(clock * 0.2 + i) * 4;
      const br = (0.07 + hash(i + 13) * 0.14) * SZ;
      ctx.globalAlpha = (0.03 + hash(i + 17) * 0.05) * pres * (0.85 + 0.15 * Math.sin(clock * 0.6 + i * 2));
      ctx.filter = "none";
      const warm = hash(i + 19) > 0.4;
      ctx.drawImage(this.bokeh, bx - br, by - br, br * 2, br * 2);
      if (warm) {
        ctx.globalAlpha *= 0.6;
        ctx.drawImage(this.glow, bx - br * 1.4, by - br * 1.4, br * 2.8, br * 2.8);
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    world();
    ctx.globalAlpha = pres;

    // body: coat, with the light falling across it
    this.drawShape(ctx, this.paths.torso, light, 0.9, [
      { pts: [[1.02, 1.2], [1.14, 1.4], [1.3, 1.6], [1.39, 1.9], [1.41, 2.3]], c: "rgba(170,180,188,0.07)", w: 0.007 },
    ], pres);

    // legs and boots — only seen once the camera follows the cigarette down
    const onFloor = p.land > 0;
    if (p.tilt > 0.05) this.drawFloor(ctx, p, cig, tip, light, pres, () => {
      if (!onFloor) return;
      // on the floor the cigarette sits under the boot that comes down on it
      this.drawRibbons(ctx, tip, clock, p.lit * (1 - p.out * 0.85) * pres, p.tilt);
      this.drawCigarette(ctx, cig.x, cig.y, cig.a, burnLen, p, light, pres, p.stub);
      this.drawEmber(ctx, tip, Ie * pres, p, breathEmber);
    });

    // head
    const H = this.head;
    const bw = HEAD_BOX.x1 - HEAD_BOX.x0;
    const bh = HEAD_BOX.y1 - HEAD_BOX.y0;
    ctx.save();
    ctx.translate(NECK_PIVOT.x + headDX, NECK_PIVOT.y + headDY);
    ctx.rotate(headA);
    ctx.translate(-NECK_PIVOT.x, -NECK_PIVOT.y);
    ctx.globalAlpha = pres;
    ctx.drawImage(H.dark, HEAD_BOX.x0, HEAD_BOX.y0, bw, bh);
    ctx.globalAlpha = pres * 0.42;
    ctx.drawImage(H.rimC, HEAD_BOX.x0, HEAD_BOX.y0, bw, bh);
    if (light.i > 0.005) {
      // light position in the head's own (unrotated) space
      const dx = light.x - (NECK_PIVOT.x + headDX);
      const dy = light.y - (NECK_PIVOT.y + headDY);
      const c = Math.cos(-headA);
      const s = Math.sin(-headA);
      const lx = NECK_PIVOT.x + dx * c - dy * s;
      const ly = NECK_PIVOT.y + dx * s + dy * c;
      const k = this.S * dpr;
      const g = this.compCtx;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalCompositeOperation = "source-over";
      g.clearRect(0, 0, this.comp.width, this.comp.height);
      g.drawImage(H.lit, 0, 0);
      g.drawImage(H.rimW, 0, 0);
      g.globalCompositeOperation = "destination-in";
      const px = (lx - HEAD_BOX.x0) * k;
      const py = (ly - HEAD_BOX.y0) * k;
      const rad = g.createRadialGradient(px, py, 0, px, py, light.r * k);
      rad.addColorStop(0, "rgba(0,0,0,1)");
      rad.addColorStop(0.3, "rgba(0,0,0,0.75)");
      rad.addColorStop(0.65, "rgba(0,0,0,0.25)");
      rad.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = rad;
      g.fillRect(0, 0, this.comp.width, this.comp.height);
      ctx.globalAlpha = pres * Math.min(1, light.i);
      ctx.drawImage(this.comp, HEAD_BOX.x0, HEAD_BOX.y0, bw, bh);
    }
    // the eye catches the light (and blinks now and then)
    const blink = (clock % 6.3) < 0.13;
    if (light.i > 0.08 && !blink) {
      ctx.globalAlpha = pres * clamp(light.i * 1.2) * 0.9;
      ctx.fillStyle = "#ffe2bf";
      ctx.beginPath();
      ctx.arc(EYE.x - 0.004, EYE.y - 0.001, 0.0032, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // collar over the neck
    this.drawShape(ctx, this.paths.collar, light, 0.85, [
      { pts: [[0.93, 0.955], [0.75, 1.01], [0.55, 1.08]], c: "rgba(170,180,188,0.12)", w: 0.006 },
    ], pres);

    if (!onFloor) {
      // smoke rising off the ember, then the cigarette itself (in his mouth or his fingers)
      if (p.lit > 0.02) this.drawRibbons(ctx, tip, clock, p.lit * pres * (1 - p.fall), p.tilt);
      this.drawCigarette(ctx, cig.x, cig.y, cig.a, burnLen, p, light, pres, 0);
      this.drawEmber(ctx, tip, Ie * pres, p, breathEmber);
    }

    // fingers that take the cigarette at the end
    if (p.take > 0.001 && p.lower < 0.999) this.drawPinchHand(ctx, pinch, handAng, p, light, pres);

    // lighter hand
    if (p.hand > 0.01) {
      // a thumb roll and a few sparks
      const thumb = this.strikeT < 1 ? Math.sin(this.strikeT * Math.PI) : 0;
      if (sparkNow) {
        this.flash = Math.max(this.flash, 0.35);
        this.emitSparks(hx, hy, ha, 9);
      }
      if (igniting) {
        this.flash = 0.6;
        this.emitSparks(hx, hy, ha, 14);
      }
      this.drawLighterHand(ctx, hx, hy, ha, p, thumb, If, light, pres, clock);
    }

    // exhaled smoke (pure function of film time, so it scrubs both ways)
    const wS = 1 - this.mixW;
    for (const [a, b, size] of EXHALES) {
      if (t > a && t < b) this.drawExhale(ctx, invLerp(a, b, t), size, headXform(-0.03, 0.78), clock, pres * wS);
    }
    if (this.kind === "light" || (this.mixW > 0.01 && this.prev.lit > 0.5)) {
      const e = invLerp(1.25, 3.1, this.since);
      if (e > 0 && e < 1) this.drawExhale(ctx, e, 1, headXform(-0.03, 0.78), clock, pres * this.mixW);
    }

    // sparks
    this.updateSparks(ctx, dt, pres);

    // fade to black at the very end
    if (p.fade > 0) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = p.fade;
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, w, h);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    return clamp(If * 0.35 + Ie * 0.12) * pres;
  }

  // ------------------------------------------------------------------------------------------

  private drawEmber(ctx: CanvasRenderingContext2D, tip: { x: number; y: number }, ember: number, p: P, breathEmber: number) {
    if (p.lit < 0.01 || ember < 0.005) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const gr = 0.08 + 0.12 * p.drag + 0.02 * breathEmber;
    ctx.globalAlpha = clamp(ember * 1.4);
    ctx.drawImage(this.glow, tip.x - gr, tip.y - gr, gr * 2, gr * 2);
    if (p.tilt > 0.5) {
      // a warm pool on the floor around it
      ctx.globalAlpha = clamp(ember * 0.9);
      ctx.drawImage(this.glow, tip.x - 0.7, FLOOR - 0.12, 1.4, 0.3);
    }
    ctx.restore();
  }

  /** Dark fabric: a near-black fill, the warm light falling across it, and cool rim edges. */
  private drawShape(
    ctx: CanvasRenderingContext2D,
    path: Path2D,
    light: { x: number; y: number; r: number; i: number },
    reach: number,
    rims: { pts: [number, number][]; c: string; w: number }[],
    pres: number,
  ) {
    ctx.fillStyle = "#0a0a0a";
    ctx.fill(path);
    if (light.i > 0.01) {
      ctx.save();
      ctx.clip(path);
      const g = ctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, light.r * reach);
      g.addColorStop(0, `rgba(116,84,36,${0.4 * Math.min(1, light.i)})`);
      g.addColorStop(0.4, `rgba(56,40,16,${0.16 * Math.min(1, light.i)})`);
      g.addColorStop(1, "rgba(30,14,6,0)");
      ctx.fillStyle = g;
      ctx.fillRect(light.x - 3, light.y - 3, 6, 6);
      ctx.restore();
    }
    ctx.lineCap = "round";
    for (const r of rims) {
      ctx.strokeStyle = r.c;
      ctx.lineWidth = r.w;
      ctx.globalAlpha = pres;
      ctx.beginPath();
      ctx.moveTo(r.pts[0][0], r.pts[0][1]);
      for (let i = 1; i < r.pts.length - 1; i++) {
        const mx = (r.pts[i][0] + r.pts[i + 1][0]) / 2;
        const my = (r.pts[i][1] + r.pts[i + 1][1]) / 2;
        ctx.quadraticCurveTo(r.pts[i][0], r.pts[i][1], mx, my);
      }
      const last = r.pts[r.pts.length - 1];
      ctx.lineTo(last[0], last[1]);
      ctx.stroke();
    }
    ctx.globalAlpha = pres;
  }

  private drawCigarette(ctx: CanvasRenderingContext2D, x: number, y: number, a: number, len: number, p: P, light: { x: number; y: number; r: number; i: number }, pres: number, crush: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    const wd = CIG.width * (1 - crush * 0.35);
    const dl = Math.hypot(light.x - x, light.y - y);
    const lit = clamp(0.14 + light.i * clamp(1.2 - dl / (light.r * 1.1)));
    const shade = (r: number, g: number, b: number, k: number) => `rgb(${Math.round(r * k)},${Math.round(g * k)},${Math.round(b * k)})`;
    // filter
    const fg = ctx.createLinearGradient(0, -wd / 2, 0, wd / 2);
    fg.addColorStop(0, shade(214, 150, 92, lit * 0.9));
    fg.addColorStop(0.35, shade(196, 132, 76, lit));
    fg.addColorStop(1, shade(90, 56, 30, lit * 0.6));
    ctx.fillStyle = fg;
    ctx.fillRect(0, -wd / 2, CIG.filter, wd);
    // paper
    const paper = Math.max(0, len - CIG.filter - 0.008 * p.lit);
    const pg = ctx.createLinearGradient(0, -wd / 2, 0, wd / 2);
    pg.addColorStop(0, shade(236, 230, 220, lit * 0.95));
    pg.addColorStop(0.35, shade(245, 240, 232, lit));
    pg.addColorStop(1, shade(120, 114, 106, lit * 0.6));
    ctx.fillStyle = pg;
    ctx.fillRect(CIG.filter, -wd / 2, paper, wd);
    ctx.fillStyle = shade(160, 120, 80, lit * 0.6);
    ctx.fillRect(CIG.filter - 0.002, -wd / 2, 0.003, wd);
    // ash and ember
    if (p.lit > 0.01) {
      const ex = CIG.filter + paper;
      const glow = p.lit * (0.55 + 0.45 * p.drag) * (1 - p.out);
      const ash = 0.012 * p.lit;
      ctx.fillStyle = `rgba(${Math.round(70 + 40 * lit)},${Math.round(66 + 36 * lit)},${Math.round(62 + 32 * lit)},1)`;
      ctx.fillRect(ex, -wd / 2, ash, wd);
      ctx.fillStyle = `rgba(255,${Math.round(150 + 90 * p.drag)},${Math.round(40 + 100 * p.drag)},${glow})`;
      ctx.fillRect(ex - 0.003, -wd / 2, 0.009 + ash * 0.5, wd);
      ctx.fillStyle = `rgba(255,236,190,${glow * p.drag})`;
      ctx.fillRect(ex, -wd * 0.25, 0.006, wd * 0.5);
    }
    ctx.restore();
    void pres;
  }

  private drawLighterHand(ctx: CanvasRenderingContext2D, x: number, y: number, a: number, p: P, thumb: number, If: number, light: { i: number }, pres: number, clock: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    const L = Math.min(1.2, If + this.flash + light.i * 0.3);
    // sleeve and wrist, coming up from below the frame
    ctx.fillStyle = "#090909";
    ctx.beginPath();
    ctx.moveTo(0.1, 0.3);
    ctx.bezierCurveTo(0.16, 0.6, 0.3, 1.2, 0.46, 2.3);
    ctx.lineTo(0.98, 2.3);
    ctx.bezierCurveTo(0.74, 1.3, 0.48, 0.62, 0.36, 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = `rgba(170,180,188,${0.07 * pres})`;
    ctx.lineWidth = 0.006;
    ctx.beginPath();
    ctx.moveTo(0.37, 0.36);
    ctx.bezierCurveTo(0.48, 0.66, 0.66, 1.2, 0.9, 2.2);
    ctx.stroke();
    // shirt cuff
    ctx.fillStyle = `rgb(${Math.round(40 + 150 * L * 0.5)},${Math.round(38 + 120 * L * 0.5)},${Math.round(36 + 90 * L * 0.5)})`;
    ctx.beginPath();
    ctx.moveTo(0.1, 0.3);
    ctx.lineTo(0.36, 0.28);
    ctx.lineTo(0.37, 0.33);
    ctx.lineTo(0.11, 0.35);
    ctx.closePath();
    ctx.fill();
    const skin = (k: number) => `rgb(${Math.round(14 + 150 * k)},${Math.round(9 + 92 * k)},${Math.round(7 + 58 * k)})`;
    // back of the hand, behind the lighter
    const back = ctx.createLinearGradient(0, 0.08, 0, 0.34);
    back.addColorStop(0, skin(L * 0.32));
    back.addColorStop(1, skin(L * 0.04));
    ctx.fillStyle = back;
    ctx.beginPath();
    ctx.moveTo(0.02, 0.12);
    ctx.bezierCurveTo(0.1, 0.07, 0.22, 0.09, 0.28, 0.17);
    ctx.bezierCurveTo(0.33, 0.24, 0.34, 0.3, 0.33, 0.33);
    ctx.lineTo(0.11, 0.34);
    ctx.bezierCurveTo(0.06, 0.28, 0.03, 0.2, 0.02, 0.12);
    ctx.closePath();
    ctx.fill();

    // the lighter
    const lid = p.lid;
    const body = { x0: -0.082, x1: 0.082, y0: 0.058, y1: 0.235 };
    const metal = ctx.createLinearGradient(body.x0, 0, body.x1, 0);
    const m = (v: number, warm: number) => `rgb(${Math.round(v + warm * 120)},${Math.round(v + warm * 70)},${Math.round(v + warm * 30)})`;
    metal.addColorStop(0, m(22, L * 0.15));
    metal.addColorStop(0.22, m(70, L * 0.55));
    metal.addColorStop(0.32, m(120, L * 0.9));
    metal.addColorStop(0.45, m(40, L * 0.35));
    metal.addColorStop(0.85, m(34, L * 0.25));
    metal.addColorStop(1, m(60, L * 0.4));
    ctx.fillStyle = metal;
    this.rr(ctx, body.x0, body.y0, body.x1 - body.x0, body.y1 - body.y0, 0.014);
    ctx.fill();
    // chimney with its holes
    if (lid > 0.02) {
      ctx.fillStyle = m(52, L * 0.6);
      ctx.fillRect(-0.066, 0.0, 0.118, 0.06);
      ctx.fillStyle = "#050404";
      for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) {
        ctx.beginPath();
        ctx.arc(-0.048 + c * 0.026, 0.017 + r * 0.022, 0.0065, 0, Math.PI * 2);
        ctx.fill();
      }
      // wheel
      ctx.save();
      ctx.translate(0.062, 0.016);
      ctx.rotate(this.wheel + thumb * 1.2);
      ctx.fillStyle = m(64, L * 0.6);
      ctx.beginPath();
      ctx.arc(0, 0, 0.022, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(10,8,7,0.8)";
      ctx.lineWidth = 0.003;
      for (let i = 0; i < 10; i++) {
        const an = (i / 10) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(an) * 0.012, Math.sin(an) * 0.012);
        ctx.lineTo(Math.cos(an) * 0.022, Math.sin(an) * 0.022);
        ctx.stroke();
      }
      ctx.restore();
    }
    // lid: hinged at the top right of the body
    ctx.save();
    ctx.translate(body.x1, body.y0);
    ctx.rotate(lid * 2.05);
    ctx.fillStyle = metal;
    this.rr(ctx, -0.164, -0.08, 0.164, 0.08, 0.014);
    ctx.fill();
    ctx.strokeStyle = `rgba(255,214,170,${0.04 + 0.22 * L})`;
    ctx.lineWidth = 0.003;
    ctx.stroke();
    ctx.restore();
    // edge highlight on the body
    ctx.strokeStyle = `rgba(255,214,170,${0.12 + 0.55 * L})`;
    ctx.lineWidth = 0.004;
    ctx.beginPath();
    ctx.moveTo(body.x0 + 0.004, body.y0 + 0.01);
    ctx.lineTo(body.x0 + 0.004, body.y1 - 0.02);
    ctx.stroke();
    ctx.strokeStyle = `rgba(185,195,204,${0.15 * pres})`;
    ctx.beginPath();
    ctx.moveTo(body.x0 + 0.01, body.y0 + 0.002);
    ctx.lineTo(body.x1 - 0.01, body.y0 + 0.002);
    ctx.stroke();

    // fingers curled round the front of the body, fanning down from the index
    const fingers = [
      { y: 0.112, w: 0.044, len: 0.215, a: -0.05 },
      { y: 0.152, w: 0.046, len: 0.225, a: -0.02 },
      { y: 0.194, w: 0.043, len: 0.215, a: 0.03 },
      { y: 0.232, w: 0.036, len: 0.185, a: 0.08 },
    ];
    fingers.forEach((f, i) => {
      ctx.save();
      ctx.translate(0.14, f.y + f.w / 2);
      ctx.rotate(f.a);
      const fx = -f.len;
      const fg = ctx.createLinearGradient(0, -f.w / 2, 0, f.w / 2);
      const top = L * (0.72 - i * 0.16);
      fg.addColorStop(0, skin(top));
      fg.addColorStop(0.45, skin(top * 0.45));
      fg.addColorStop(1, skin(top * 0.08));
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.moveTo(0, -f.w / 2);
      ctx.lineTo(fx + f.w * 0.5, -f.w / 2 + 0.002);
      ctx.bezierCurveTo(fx + f.w * 0.05, -f.w / 2 + 0.004, fx - 0.004, -f.w * 0.1, fx + 0.002, f.w * 0.12);
      ctx.bezierCurveTo(fx + 0.006, f.w * 0.42, fx + f.w * 0.3, f.w / 2, fx + f.w * 0.62, f.w / 2);
      ctx.lineTo(0, f.w / 2);
      ctx.closePath();
      ctx.fill();
      // knuckle crease
      ctx.strokeStyle = `rgba(5,3,2,${0.35 + 0.3 * L})`;
      ctx.lineWidth = 0.003;
      ctx.beginPath();
      ctx.moveTo(fx + f.len * 0.42, -f.w * 0.38);
      ctx.quadraticCurveTo(fx + f.len * 0.4, 0, fx + f.len * 0.43, f.w * 0.35);
      ctx.stroke();
      ctx.restore();
    });
    // thumb along the side, tip resting by the wheel and rolling it on a strike
    const tx = 0.07 + thumb * 0.012;
    const ty = -0.016 + thumb * 0.05;
    const tg = ctx.createLinearGradient(0.06, -0.02, 0.18, 0.18);
    tg.addColorStop(0, skin(L * 0.7));
    tg.addColorStop(1, skin(L * 0.08));
    ctx.fillStyle = tg;
    ctx.beginPath();
    ctx.moveTo(0.19, 0.2);
    ctx.bezierCurveTo(0.16, 0.13, 0.12, 0.06, tx + 0.016, ty + 0.004);
    ctx.bezierCurveTo(tx + 0.008, ty - 0.014, tx - 0.018, ty - 0.012, tx - 0.017, ty + 0.008);
    ctx.bezierCurveTo(tx - 0.014, ty + 0.026, tx + 0.006, ty + 0.04, 0.09, 0.09);
    ctx.bezierCurveTo(0.1, 0.13, 0.11, 0.17, 0.12, 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = `rgba(255,186,128,${0.4 * L})`;
    ctx.lineWidth = 0.0035;
    ctx.beginPath();
    ctx.moveTo(tx - 0.015, ty - 0.002);
    ctx.bezierCurveTo(tx, ty - 0.016, 0.12, 0.04, 0.15, 0.11);
    ctx.stroke();

    // the flame
    if (If > 0.01) this.drawFlame(ctx, -0.005, 0, If, clock);
    ctx.restore();
  }

  private drawFlame(ctx: CanvasRenderingContext2D, x: number, y: number, f: number, clock: number) {
    const fl = 1 + 0.07 * Math.sin(clock * 19) + 0.04 * Math.sin(clock * 31 + 1);
    const hgt = 0.15 * f * fl;
    const wid = 0.036 * Math.sqrt(f);
    const sway = Math.sin(clock * 2.7) * 0.01 * f + Math.sin(clock * 6.9) * 0.004 * f;
    ctx.globalCompositeOperation = "lighter";
    // halo
    ctx.globalAlpha = 0.55 * f;
    const R = 0.42 * f;
    ctx.drawImage(this.glow, x - R, y - hgt * 0.45 - R, R * 2, R * 2);
    // body
    ctx.globalAlpha = Math.min(1, f * 1.2);
    const path = new Path2D();
    path.moveTo(x - wid * 0.7, y - 0.004);
    path.bezierCurveTo(x - wid * 1.05, y - hgt * 0.35, x - wid * 0.45 + sway * 0.4, y - hgt * 0.78, x + sway, y - hgt);
    path.bezierCurveTo(x + wid * 0.45 + sway * 0.4, y - hgt * 0.78, x + wid * 1.05, y - hgt * 0.35, x + wid * 0.7, y - 0.004);
    path.quadraticCurveTo(x, y + 0.012, x - wid * 0.7, y - 0.004);
    const g = ctx.createRadialGradient(x, y - hgt * 0.22, 0, x, y - hgt * 0.3, hgt * 0.85);
    g.addColorStop(0, "rgba(255,250,235,0.95)");
    g.addColorStop(0.3, "rgba(255,226,130,0.9)");
    g.addColorStop(0.65, "rgba(245,175,50,0.65)");
    g.addColorStop(1, "rgba(225,120,20,0)");
    ctx.fillStyle = g;
    ctx.fill(path);
    // blue root
    ctx.globalAlpha = 0.45 * f;
    ctx.fillStyle = "rgba(80,120,255,0.8)";
    ctx.beginPath();
    ctx.ellipse(x, y - 0.006, wid * 0.55, 0.01, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  private drawPinchHand(ctx: CanvasRenderingContext2D, at: { x: number; y: number }, a: number, p: P, light: { x: number; y: number; i: number }, pres: number) {
    const open = p.fall > 0 ? smooth(0, 0.3, p.fall) : 0;
    ctx.save();
    ctx.translate(at.x, at.y);
    ctx.rotate(a - Math.PI);
    const d = Math.hypot(light.x - at.x, light.y - at.y);
    const L = clamp(light.i * (1.1 - d * 2)) * 0.6;
    const skin = (k: number) => `rgb(${Math.round(14 + 150 * k)},${Math.round(9 + 92 * k)},${Math.round(7 + 58 * k)})`;
    // sleeve
    ctx.fillStyle = "#090909";
    ctx.beginPath();
    ctx.moveTo(0.22, 0.26);
    ctx.bezierCurveTo(0.3, 0.7, 0.46, 1.3, 0.64, 2.4);
    ctx.lineTo(1.1, 2.4);
    ctx.bezierCurveTo(0.8, 1.3, 0.56, 0.6, 0.42, 0.2);
    ctx.closePath();
    ctx.fill();
    // back of the hand, falling away to the wrist, with the curled fingers under it
    const bg = ctx.createLinearGradient(0, -0.05, 0.1, 0.3);
    bg.addColorStop(0, skin(L * 0.3));
    bg.addColorStop(1, skin(L * 0.02));
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.moveTo(0.15, -0.045);
    ctx.bezierCurveTo(0.24, -0.06, 0.34, -0.02, 0.4, 0.07);
    ctx.bezierCurveTo(0.44, 0.14, 0.44, 0.22, 0.42, 0.27);
    ctx.lineTo(0.22, 0.29);
    ctx.bezierCurveTo(0.2, 0.2, 0.15, 0.12, 0.14, 0.06);
    ctx.closePath();
    ctx.fill();
    for (let i = 0; i < 2; i++) {
      ctx.fillStyle = skin(L * (0.14 - i * 0.05));
      ctx.beginPath();
      ctx.ellipse(0.16 + i * 0.02, 0.075 + i * 0.045, 0.035, 0.024, 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    // index above the filter, middle below it
    const finger = (y0: number, y1: number, wd: number, k: number) => {
      const g = ctx.createLinearGradient(0, y1 - wd, 0, y1 + wd);
      g.addColorStop(0, skin(L * k));
      g.addColorStop(1, skin(L * k * 0.2));
      ctx.strokeStyle = g;
      ctx.lineWidth = wd;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(0.19, y0);
      ctx.quadraticCurveTo(0.09, y0 + (y1 - y0) * 0.3, 0.0, y1);
      ctx.stroke();
    };
    finger(-0.035, -0.024 - open * 0.035, 0.034, 0.75);
    finger(0.03, 0.024 + open * 0.04, 0.032, 0.5);
    ctx.strokeStyle = `rgba(255,180,120,${0.45 * L})`;
    ctx.lineWidth = 0.004;
    ctx.beginPath();
    ctx.moveTo(0.16, -0.05);
    ctx.quadraticCurveTo(0.08, -0.046 - open * 0.02, 0.004, -0.04 - open * 0.035);
    ctx.stroke();
    ctx.restore();
    void pres;
  }

  private drawRibbons(ctx: CanvasRenderingContext2D, tip: { x: number; y: number }, clock: number, strength: number, tilt: number) {
    if (strength < 0.01) return;
    const len = tilt > 0.5 ? 1.2 : 1.7;
    const n = this.lowPower ? 16 : 26;
    for (let r = 0; r < 3; r++) {
      const ph = r * 2.13;
      const spd = 0.8 + r * 0.22;
      const left: number[] = [];
      const right: number[] = [];
      for (let i = 0; i <= n; i++) {
        const s = i / n;
        const turb = Math.pow(s, 1.5);
        const x = tip.x + Math.sin(s * 6.5 - clock * spd + ph) * 0.06 * turb + Math.sin(s * 14 - clock * 1.9 + ph * 1.7) * 0.022 * turb + (r - 1) * 0.05 * s * s - 0.06 * s * s;
        const y = tip.y - 0.01 - s * len;
        const wd = 0.004 + s * (0.035 + r * 0.012);
        left.push(x - wd / 2, y);
        right.push(x + wd / 2, y);
      }
      ctx.beginPath();
      ctx.moveTo(left[0], left[1]);
      for (let i = 2; i < left.length; i += 2) ctx.lineTo(left[i], left[i + 1]);
      for (let i = right.length - 2; i >= 0; i -= 2) ctx.lineTo(right[i], right[i + 1]);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, tip.y, 0, tip.y - len);
      g.addColorStop(0, `rgba(255,226,160,${0.5 * strength})`);
      g.addColorStop(0.1, `rgba(214,206,196,${0.3 * strength})`);
      g.addColorStop(0.55, `rgba(190,186,180,${0.12 * strength})`);
      g.addColorStop(1, "rgba(180,176,170,0)");
      ctx.fillStyle = g;
      ctx.fill();
    }
    // diffuse smoke gathering above, drifting and thinning out
    const puffs = this.lowPower ? 5 : 9;
    for (let i = 0; i < puffs; i++) {
      const rate = 0.05 + hash(i + 31) * 0.04;
      const ph = (clock * rate + hash(i + 7)) % 1;
      const sz = (0.16 + ph * (0.5 + hash(i + 3) * 0.5)) * (tilt > 0.5 ? 0.7 : 1);
      const sx = tip.x - ph * (0.1 + hash(i + 5) * 0.25) + Math.sin(clock * 0.27 + i * 1.7) * 0.07 * ph;
      const sy = tip.y - 0.25 - ph * len * (0.7 + hash(i + 9) * 0.5);
      ctx.globalAlpha = strength * 0.22 * Math.sin(ph * Math.PI) * (1 - ph * 0.4);
      ctx.drawImage(this.smoke[i % 3], sx - sz / 2, sy - sz / 2, sz, sz);
    }
    ctx.globalAlpha = 1;
  }

  private drawExhale(ctx: CanvasRenderingContext2D, e: number, size: number, mouth: { x: number; y: number }, clock: number, alpha: number) {
    if (alpha < 0.01) return;
    const big = size > 2;
    const n = big ? 34 : 16;
    const ease = 1 - Math.pow(1 - e, 2.2);
    for (let i = 0; i < n; i++) {
      const hs = hash(i * 5.3 + size * 10);
      const hv = hash(i * 9.1 + size * 3);
      const delay = hs * 0.3;
      const q = clamp((ease - delay) / (1 - delay));
      if (q <= 0) continue;
      const dist = (0.35 + hv * 0.9) * size;
      const ang = Math.PI + 0.2 - hv * 0.75 - (big ? hs * 0.7 : 0);
      const x = mouth.x + Math.cos(ang) * dist * q + Math.sin(clock * 0.4 + i) * 0.04 * q;
      const y = mouth.y + Math.sin(ang) * dist * q * 0.7 - q * q * 0.3 * size;
      const sz = (0.12 + q * (0.45 + hs * 0.5)) * (big ? size * 0.85 : size);
      const a = Math.sin(Math.min(1, q * 1.6) * Math.PI * 0.5) * Math.pow(1 - e, 1.4) * (big ? 0.32 : 0.2);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang - Math.PI + (hs - 0.5) * 0.5);
      ctx.scale(1.7 - q * 0.5, 0.7 + q * 0.2);
      ctx.globalAlpha = a * alpha;
      ctx.drawImage(this.smoke[i % 3], -sz / 2, -sz / 2, sz, sz);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  private drawFloor(ctx: CanvasRenderingContext2D, p: P, cig: { x: number; y: number; a: number }, tip: { x: number; y: number }, light: { x: number; y: number; r: number; i: number }, pres: number, under: () => void) {
    // floor: dark concrete, lit only where the ember is
    const fy = FLOOR;
    const fg = ctx.createLinearGradient(0, fy - 1.6, 0, fy + 1.4);
    fg.addColorStop(0, "rgba(0,0,0,1)");
    fg.addColorStop(0.45, "rgba(20,18,16,1)");
    fg.addColorStop(1, "rgba(14,13,12,1)");
    ctx.fillStyle = fg;
    ctx.fillRect(-4, fy - 1.6, 8, 3.2);
    for (let i = 0; i < 160; i++) {
      const x = -3 + hash(i * 2.1) * 6;
      const y = fy - 1.4 + hash(i * 3.7) * 2.6;
      ctx.fillStyle = `rgba(${hash(i) > 0.5 ? "60,56,52" : "4,4,4"},${0.18 + hash(i + 1) * 0.2})`;
      ctx.fillRect(x, y, 0.01 + hash(i + 4) * 0.02, 0.004 + hash(i + 5) * 0.006);
    }
    // a faint light far behind him, low, so the legs and boots read as silhouettes
    const bl = ctx.createRadialGradient(0.6, fy - 0.7, 0, 0.6, fy - 0.7, 3.2);
    bl.addColorStop(0, `rgba(72,66,60,${0.42 * pres})`);
    bl.addColorStop(0.5, `rgba(40,37,34,${0.2 * pres})`);
    bl.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = bl;
    ctx.fillRect(-3, fy - 4, 7, 5);
    if (light.i > 0.01) {
      ctx.save();
      ctx.translate(light.x, fy);
      ctx.scale(1, 0.3);
      const lg = ctx.createRadialGradient(0, 0, 0, 0, 0, 1.2);
      lg.addColorStop(0, `rgba(240,190,70,${0.32 * light.i})`);
      lg.addColorStop(1, "rgba(240,190,70,0)");
      ctx.fillStyle = lg;
      ctx.fillRect(-1.2, -1.2, 2.4, 2.4);
      ctx.restore();
    }

    // back leg, planted
    ctx.save();
    ctx.translate(0.2, fy);
    ctx.fillStyle = "#070707";
    ctx.fill(trouserPath(2.6));
    ctx.fillStyle = "#080808";
    ctx.fill(this.paths.boot);
    ctx.strokeStyle = `rgba(170,180,188,${0.08 * pres})`;
    ctx.lineWidth = 0.008;
    ctx.beginPath();
    ctx.moveTo(0.97, -2.9);
    ctx.bezierCurveTo(0.95, -1.8, 0.92, -1.0, 0.9, -0.48);
    ctx.stroke();
    ctx.restore();

    under();

    // front leg: steps forward onto it, twists, lifts away
    const target = (cig.x + tip.x) / 2 + 0.03;
    const rest = -0.55;
    const go = smooth(0, 1, p.step) * (1 - smooth(0, 1, p.lift));
    const bx = lerp(rest, target, go);
    const lift = Math.sin(clamp(p.step) * Math.PI) * 0.32 * (1 - p.lift) + Math.sin(clamp(p.lift) * Math.PI) * 0.3;
    const press = p.step >= 1 && p.lift <= 0 ? CIG.width * 0.4 : 0;
    const twist = Math.sin(p.stub * Math.PI * 3) * 0.05 * (1 - p.lift);
    ctx.save();
    ctx.translate(bx, fy - lift - press + Math.abs(twist) * 0.2);
    // shadow on the floor
    ctx.save();
    ctx.scale(1, 0.12);
    ctx.fillStyle = `rgba(0,0,0,${0.5 - lift})`;
    ctx.beginPath();
    ctx.ellipse(0.25, (lift + press) / 0.12, 0.65, 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.rotate(-twist);
    ctx.scale(1 - Math.abs(twist) * 0.6, 1);
    ctx.fillStyle = "#0a0a0a";
    ctx.fill(trouserPath(2.6));
    ctx.fillStyle = "#0b0b0b";
    ctx.fill(this.paths.boot);
    ctx.strokeStyle = `rgba(170,180,188,${0.14 * pres})`;
    ctx.lineWidth = 0.008;
    ctx.beginPath();
    ctx.moveTo(0.97, -2.9);
    ctx.bezierCurveTo(0.95, -1.8, 0.92, -1.0, 0.9, -0.48);
    ctx.stroke();
    // leather picks up the ember and the backlight
    const Lb = clamp(light.i * (1.3 - Math.abs(light.x - bx) * 0.9));
    ctx.strokeStyle = `rgba(255,170,110,${0.55 * Lb})`;
    ctx.lineWidth = 0.012;
    ctx.beginPath();
    ctx.moveTo(-0.33, -0.09);
    ctx.bezierCurveTo(-0.28, -0.13, -0.15, -0.16, -0.02, -0.2);
    ctx.stroke();
    ctx.strokeStyle = `rgba(185,195,204,${0.3 * pres})`;
    ctx.lineWidth = 0.008;
    ctx.beginPath();
    ctx.moveTo(-0.02, -0.2);
    ctx.bezierCurveTo(0.12, -0.24, 0.22, -0.3, 0.3, -0.38);
    ctx.stroke();
    ctx.strokeStyle = `rgba(110,100,90,${0.4 * pres})`;
    ctx.lineWidth = 0.006;
    ctx.beginPath();
    ctx.moveTo(-0.3, -0.008);
    ctx.lineTo(0.86, -0.008);
    ctx.stroke();
    ctx.restore();

    // a few sparks squeezed out from under the sole
    if (p.stub > 0.02 && p.stub < 0.5 && this.rnd() < 0.25) this.emitSparksAt(tip.x, fy - 0.02, 2);
  }

  // ---- sparks ----
  private seed = 7;
  private rnd() {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  private emitSparks(hx: number, hy: number, ha: number, n: number) {
    // from the flint, just under the wheel
    const cx = hx + Math.cos(ha) * 0.05 - Math.sin(ha) * 0.01;
    const cy = hy + Math.sin(ha) * 0.05 + 0.005;
    this.emitSparksAt(cx, cy, n);
  }

  private emitSparksAt(x: number, y: number, n: number) {
    for (let i = 0; i < n && this.sparks.length < 80; i++) {
      this.sparks.push({ x, y, vx: -0.15 - this.rnd() * 0.55, vy: -0.25 - this.rnd() * 0.65, life: 0, max: 0.18 + this.rnd() * 0.32 });
    }
  }

  private updateSparks(ctx: CanvasRenderingContext2D, dt: number, pres: number) {
    if (!this.sparks.length) return;
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    const d = Math.min(dt, 0.05);
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.life += d;
      if (s.life >= s.max) {
        this.sparks[i] = this.sparks[this.sparks.length - 1];
        this.sparks.pop();
        continue;
      }
      s.vy += 1.8 * d;
      s.x += s.vx * d;
      s.y += s.vy * d;
      const u = s.life / s.max;
      ctx.globalAlpha = (1 - u) * pres;
      ctx.strokeStyle = u < 0.4 ? "#fffbd6" : "#ffd65e";
      ctx.lineWidth = 0.0045;
      ctx.beginPath();
      ctx.moveTo(s.x - s.vx * 0.03, s.y - s.vy * 0.03);
      ctx.lineTo(s.x, s.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  private rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}
