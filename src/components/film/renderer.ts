import { band, clamp, hash, invLerp, lerp, smooth } from "@/lib/math";

/**
 * The background film, drawn procedurally on a 2D canvas.
 * `t` is film time: 0 = dead feed … 1.0 = the IP world … 1.2 = finale (black).
 * Every scene is a pure function of (t, clock) so scrolling backwards plays the film backwards.
 */

type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; kind: 0 | 1 | 2; seed: number };

const SPRITE_BINS = 24;
const FLAME_STOPS: [number, number, number][] = [
  [255, 236, 200],
  [255, 206, 140],
  [247, 150, 70],
  [239, 106, 42],
  [180, 52, 18],
  [90, 22, 10],
];

function rampColor(u: number): [number, number, number] {
  const p = clamp(u) * (FLAME_STOPS.length - 1);
  const i = Math.floor(p);
  const f = p - i;
  const a = FLAME_STOPS[i];
  const b = FLAME_STOPS[Math.min(i + 1, FLAME_STOPS.length - 1)];
  return [lerp(a[0], b[0], f), lerp(a[1], b[1], f), lerp(a[2], b[2], f)];
}

export type FilmFrame = { t: number; clock: number; dt: number; velocity: number };

export class FilmRenderer {
  private ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private sprites: HTMLCanvasElement[] = [];
  private particles: Particle[] = [];
  private frames: { x: number; y: number; z: number; r: number; tall: boolean }[] = [];
  private lowPower: boolean;
  private seed = 1;

  constructor(private canvas: HTMLCanvasElement, opts: { lowPower: boolean }) {
    this.ctx = canvas.getContext("2d", { alpha: false })!;
    this.lowPower = opts.lowPower;
    this.buildSprites();
    for (let i = 0; i < (this.lowPower ? 28 : 56); i++) {
      this.frames.push({ x: hash(i) * 2 - 1, y: hash(i + 99) * 2 - 1, z: hash(i + 7), r: hash(i + 3), tall: hash(i + 11) > 0.45 });
    }
  }

  resize(w: number, h: number, dpr: number) {
    this.w = w;
    this.h = h;
    this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
  }

  /** Pre-tinted soft dots: drawing these is far cheaper than a gradient per particle. */
  private buildSprites() {
    const size = 64;
    for (let i = 0; i < SPRITE_BINS; i++) {
      const c = document.createElement("canvas");
      c.width = c.height = size;
      const g = c.getContext("2d")!;
      const [r, gg, b] = rampColor(i / (SPRITE_BINS - 1));
      const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      grad.addColorStop(0, `rgba(${r | 0},${gg | 0},${b | 0},1)`);
      grad.addColorStop(0.35, `rgba(${r | 0},${gg | 0},${b | 0},0.55)`);
      grad.addColorStop(1, `rgba(${r | 0},${gg | 0},${b | 0},0)`);
      g.fillStyle = grad;
      g.fillRect(0, 0, size, size);
      this.sprites.push(c);
    }
  }

  private rnd() {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  private emit(n: number, make: () => Particle) {
    const cap = this.lowPower ? 380 : 900;
    for (let i = 0; i < n && this.particles.length < cap; i++) this.particles.push(make());
  }

  render({ t, clock, dt, velocity }: FilmFrame) {
    const { ctx, w, h } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#0b0a09";
    ctx.fillRect(0, 0, w, h);

    // ---- scene weights (all pure functions of t) ----
    const feedW = 1 - smooth(0.19, 0.27, t);
    const breakP = invLerp(0.12, 0.24, t);
    const camW = band(0.15, 0.2, 0.27, 0.315, t);
    const powerP = invLerp(0.15, 0.21, t);
    const tlW = band(0.205, 0.245, 0.29, 0.325, t);
    const engineW = band(0.39, 0.425, 0.445, 0.475, t);
    const sparkW = band(0.45, 0.49, 0.58, 0.64, t);
    const flameW = band(0.55, 0.62, 0.74, 0.8, t);
    const flameH = smooth(0.55, 0.76, t);
    const energyW = band(0.66, 0.72, 0.8, 0.86, t);
    const fireW = band(0.76, 0.82, 0.9, 0.96, t);
    const worldW = band(0.89, 0.95, 0.995, 1.02, t);
    const emberW = band(0.98, 1.02, 1.09, 1.13, t);

    if (feedW > 0.01) this.drawFeed(feedW, breakP, clock, velocity);
    if (engineW > 0.01) this.drawEngine(engineW, clock, t);
    if (camW > 0.01) this.drawCamera(camW, powerP, clock, t);
    if (tlW > 0.01) this.drawTimeline(tlW, t, clock);

    // ---- particles (spark → flame → fire → world → embers) ----
    const heat = Math.max(sparkW * 0.25, flameW * (0.35 + flameH * 0.5), fireW, worldW * 0.6, emberW * 0.3);
    if (energyW > 0.01) this.drawFrames(energyW, dt, velocity);
    this.updateParticles({ t, dt, clock, sparkW, flameW, flameH, fireW, worldW, emberW });
    this.drawGlow(heat, fireW, worldW);
    this.drawParticles();
    if (worldW > 0.01) this.drawWorld(worldW, clock, t);
    return heat;
  }

  // ======================================================================
  // Scene A: the dead feed
  // ======================================================================
  private drawFeed(alpha: number, breakP: number, clock: number, velocity: number) {
    const { ctx, w, h } = this;
    const mobile = w < 700;
    const pw = mobile ? w * 0.78 : Math.min(400, w * 0.3);
    const ph = pw * 1.38;
    const gap = pw * 0.08;
    const pitch = ph + gap;
    const drift = clock * 14 + velocity * 0.02;
    const columns = mobile ? [{ dx: 0, s: 1, a: 1 }] : [
      { dx: -(pw + gap * 3) * 1.02, s: 0.86, a: 0.32 },
      { dx: 0, s: 1, a: 1 },
      { dx: (pw + gap * 3) * 1.02, s: 0.86, a: 0.32 },
    ];
    ctx.save();
    columns.forEach((col, ci) => {
      const cx = w / 2 + col.dx;
      const off = (drift * (ci === 1 ? 1 : 0.7) + ci * 230) % pitch;
      const startIndex = Math.floor((drift * (ci === 1 ? 1 : 0.7) + ci * 230) / pitch);
      for (let k = -1; k < Math.ceil(h / (pitch * col.s)) + 1; k++) {
        const idx = startIndex + k + ci * 40;
        const y = k * pitch * col.s - off * col.s;
        const pwS = pw * col.s;
        const x = cx - pwS / 2;
        if (breakP > 0.02) this.drawPostFragments(x, y, pwS, ph * col.s, idx, alpha * col.a, breakP);
        else this.drawPost(x, y, pwS, ph * col.s, idx, alpha * col.a, clock);
      }
    });
    ctx.restore();

    // a lonely notification that barely registers
    const cycle = (clock % 7) / 7;
    const na = band(0.05, 0.12, 0.3, 0.42, cycle) * alpha * (1 - breakP);
    if (na > 0.01) {
      const nx = w / 2 + (mobile ? w * 0.18 : pw * 0.62);
      const ny = h * 0.16 - cycle * 18;
      ctx.globalAlpha = na * 0.85;
      ctx.fillStyle = "#1d1a17";
      this.roundRect(nx - 34, ny - 15, 68, 30, 15);
      ctx.fill();
      ctx.strokeStyle = "rgba(239,232,222,0.25)";
      ctx.lineWidth = 1;
      ctx.stroke();
      this.heart(nx - 14, ny, 6, "rgba(239,232,222,0.7)", false);
      ctx.fillStyle = "rgba(239,232,222,0.75)";
      ctx.font = `500 12px "IBM Plex Mono", monospace`;
      ctx.textBaseline = "middle";
      ctx.fillText("1", nx + 4, ny + 1);
      ctx.globalAlpha = 1;
    }
  }

  private drawPost(x: number, y: number, pw: number, ph: number, idx: number, alpha: number, clock: number) {
    const { ctx } = this;
    if (y > this.h || y + ph < 0) return;
    const head = pw * 0.13;
    const media = pw;
    ctx.globalAlpha = alpha;
    // header
    ctx.fillStyle = "#24201c";
    ctx.beginPath();
    ctx.arc(x + head * 0.4, y + head * 0.5, head * 0.24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(239,232,222,0.22)";
    ctx.fillRect(x + head * 0.8, y + head * 0.38, pw * 0.26, head * 0.12);
    ctx.fillStyle = "rgba(239,232,222,0.1)";
    ctx.fillRect(x + head * 0.8, y + head * 0.58, pw * 0.16, head * 0.09);
    // media: flat, undistinguished
    const tone = 18 + Math.floor(hash(idx) * 14);
    ctx.fillStyle = `rgb(${tone + 4},${tone + 2},${tone})`;
    ctx.fillRect(x, y + head, pw, media);
    const kind = Math.floor(hash(idx + 5) * 4);
    ctx.fillStyle = "rgba(239,232,222,0.08)";
    if (kind === 0) {
      ctx.fillRect(x + pw * 0.2, y + head + media * 0.42, pw * 0.6, media * 0.06);
      ctx.fillRect(x + pw * 0.3, y + head + media * 0.52, pw * 0.4, media * 0.04);
    } else if (kind === 1) {
      ctx.beginPath();
      ctx.arc(x + pw / 2, y + head + media / 2, media * 0.14, 0, Math.PI * 2);
      ctx.fill();
    } else if (kind === 2) {
      ctx.strokeStyle = "rgba(239,232,222,0.06)";
      ctx.strokeRect(x + pw * 0.15, y + head + media * 0.15, pw * 0.7, media * 0.7);
    }
    // play badge for "reels" with tiny view counts
    if (hash(idx + 9) > 0.5) {
      ctx.fillStyle = "rgba(239,232,222,0.35)";
      ctx.font = `500 ${Math.max(10, pw * 0.032)}px "IBM Plex Mono", monospace`;
      ctx.textBaseline = "alphabetic";
      ctx.fillText(`▷ ${1 + Math.floor(hash(idx + 2) * 40)}`, x + pw * 0.04, y + head + media - pw * 0.04);
    }
    // footer
    const fy = y + head + media + pw * 0.07;
    this.heart(x + pw * 0.05, fy, pw * 0.026, "rgba(239,232,222,0.4)", false);
    ctx.strokeStyle = "rgba(239,232,222,0.4)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(x + pw * 0.15, fy, pw * 0.024, 0, Math.PI * 1.75);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + pw * 0.22, fy + pw * 0.02);
    ctx.lineTo(x + pw * 0.27, fy - pw * 0.022);
    ctx.lineTo(x + pw * 0.245, fy + pw * 0.024);
    ctx.stroke();
    ctx.fillStyle = "rgba(239,232,222,0.42)";
    ctx.font = `500 ${Math.max(10, pw * 0.032)}px "IBM Plex Mono", monospace`;
    const likes = Math.floor(hash(idx + 1) * 9);
    ctx.fillText(`${likes} like${likes === 1 ? "" : "s"}`, x, fy + pw * 0.08);
    ctx.fillStyle = "rgba(239,232,222,0.12)";
    ctx.fillRect(x, fy + pw * 0.11, pw * (0.5 + hash(idx + 4) * 0.4), pw * 0.018);
    ctx.fillStyle = "rgba(239,232,222,0.22)";
    ctx.font = `400 ${Math.max(9, pw * 0.026)}px "IBM Plex Mono", monospace`;
    ctx.fillText(`${2 + Math.floor(hash(idx + 6) * 10)} weeks ago`, x, fy + pw * 0.19);
    ctx.globalAlpha = 1;
    void clock;
  }

  private drawPostFragments(x: number, y: number, pw: number, ph: number, idx: number, alpha: number, p: number) {
    const { ctx, w, h } = this;
    if (y > h + 400 || y + ph < -400) return;
    const cols = 2;
    const rows = 3;
    const fw = pw / cols;
    const fh = ph / rows;
    const e = p * p;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const s = idx * 13 + r * 3 + c;
        const fx = x + c * fw;
        const fy = y + r * fh;
        const dirX = fx + fw / 2 - w / 2 + (hash(s) - 0.5) * 300;
        const dirY = fy + fh / 2 - h / 2 + 200 + hash(s + 1) * 300;
        const len = Math.hypot(dirX, dirY) || 1;
        const dist = e * (500 + hash(s + 2) * 900);
        const ox = (dirX / len) * dist;
        const oy = (dirY / len) * dist + e * 260;
        const rot = (hash(s + 3) - 0.5) * 2.4 * e;
        const sc = 1 - e * 0.55;
        ctx.save();
        ctx.translate(fx + fw / 2 + ox, fy + fh / 2 + oy);
        ctx.rotate(rot);
        ctx.scale(sc, sc);
        ctx.globalAlpha = alpha * (1 - p) * (0.85 - hash(s + 4) * 0.3);
        const tone = 20 + Math.floor(hash(idx) * 14);
        ctx.fillStyle = `rgb(${tone + 4},${tone + 2},${tone})`;
        ctx.fillRect(-fw / 2, -fh / 2, fw - 2, fh - 2);
        ctx.strokeStyle = "rgba(239,232,222,0.12)";
        ctx.lineWidth = 1;
        ctx.strokeRect(-fw / 2, -fh / 2, fw - 2, fh - 2);
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  }

  // ======================================================================
  // Scene B: the camera powers on
  // ======================================================================
  private drawCamera(alpha: number, power: number, clock: number, t: number) {
    const { ctx, w, h } = this;
    const on = smooth(0.25, 1, power);
    // CRT-style power line
    if (power < 0.6) {
      const k = invLerp(0, 0.35, power);
      const lw = w * smooth(0, 1, k);
      ctx.globalAlpha = alpha * (1 - smooth(0.3, 0.6, power));
      const g = ctx.createLinearGradient(w / 2 - lw / 2, 0, w / 2 + lw / 2, 0);
      g.addColorStop(0, "rgba(255,214,160,0)");
      g.addColorStop(0.5, "rgba(255,236,210,0.95)");
      g.addColorStop(1, "rgba(255,214,160,0)");
      ctx.fillStyle = g;
      const lh = 2 + smooth(0.3, 0.6, power) * h * 0.4;
      ctx.fillRect(w / 2 - lw / 2, h / 2 - lh / 2, lw, lh);
    }
    const a = alpha * on;
    if (a < 0.01) return;
    const m = Math.min(w, h) * 0.07;
    ctx.globalAlpha = a;
    ctx.strokeStyle = "rgba(239,232,222,0.7)";
    ctx.lineWidth = 1.5;
    const L = Math.min(w, h) * 0.05;
    const corners: [number, number, number, number][] = [
      [m, m, 1, 1],
      [w - m, m, -1, 1],
      [m, h - m, 1, -1],
      [w - m, h - m, -1, -1],
    ];
    for (const [cx, cy, sx, sy] of corners) {
      ctx.beginPath();
      ctx.moveTo(cx, cy + L * sy);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx + L * sx, cy);
      ctx.stroke();
    }
    // rule of thirds
    ctx.strokeStyle = "rgba(239,232,222,0.06)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(m + ((w - 2 * m) * i) / 3, m);
      ctx.lineTo(m + ((w - 2 * m) * i) / 3, h - m);
      ctx.moveTo(m, m + ((h - 2 * m) * i) / 3);
      ctx.lineTo(w - m, m + ((h - 2 * m) * i) / 3);
      ctx.stroke();
    }
    // focus box hunting then locking
    const lock = smooth(0.2, 0.3, t);
    const hunt = (1 - lock) * Math.sin(clock * 9) * 0.12;
    const fs = Math.min(w, h) * (0.16 + hunt);
    ctx.strokeStyle = lock > 0.9 ? "rgba(245,165,74,0.9)" : "rgba(239,232,222,0.55)";
    ctx.lineWidth = 1.2;
    const fx = w / 2;
    const fy = h / 2;
    const q = fs * 0.22;
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
      ctx.beginPath();
      ctx.moveTo(fx + (sx * fs) / 2, fy + (sy * fs) / 2 - sy * q);
      ctx.lineTo(fx + (sx * fs) / 2, fy + (sy * fs) / 2);
      ctx.lineTo(fx + (sx * fs) / 2 - sx * q, fy + (sy * fs) / 2);
      ctx.stroke();
    }
    // readouts
    const fsz = Math.max(10, Math.min(13, w * 0.011));
    ctx.font = `500 ${fsz}px "IBM Plex Mono", monospace`;
    ctx.textBaseline = "middle";
    const recording = t > 0.205;
    const blink = Math.sin(clock * 5) > -0.2;
    ctx.fillStyle = recording ? (blink ? "#ef6a2a" : "rgba(239,106,42,0.25)") : "rgba(239,232,222,0.4)";
    ctx.beginPath();
    ctx.arc(m + 10, m + 26, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(239,232,222,0.85)";
    ctx.fillText(recording ? "REC" : "STBY", m + 22, m + 27);
    const secs = Math.max(0, (t - 0.205) * 420);
    const tc = recording ? this.timecode(secs) : "00:00:00:00";
    ctx.textAlign = "right";
    ctx.fillText(`4K · 25P   ${tc}`, w - m - 4, m + 27);
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(239,232,222,0.55)";
    ctx.fillText("ISO 800    1/50    F2.8    5600K", m + 4, h - m - 22);
    // battery + audio meters
    ctx.strokeStyle = "rgba(239,232,222,0.55)";
    ctx.strokeRect(w - m - 40, h - m - 30, 30, 14);
    ctx.fillStyle = "rgba(239,232,222,0.55)";
    ctx.fillRect(w - m - 10, h - m - 26, 3, 6);
    ctx.fillRect(w - m - 37, h - m - 27, 18, 8);
    for (let i = 0; i < 2; i++) {
      const lvl = 0.3 + 0.5 * Math.abs(Math.sin(clock * (3 + i) + i));
      ctx.fillStyle = "rgba(239,232,222,0.15)";
      ctx.fillRect(w - m - 140, h - m - 30 + i * 8, 80, 4);
      ctx.fillStyle = lvl > 0.7 ? "#f5a54a" : "rgba(239,232,222,0.6)";
      ctx.fillRect(w - m - 140, h - m - 30 + i * 8, 80 * lvl, 4);
    }
    ctx.globalAlpha = 1;
  }

  // ======================================================================
  // Scene C: the edit timeline, and a video starts playing
  // ======================================================================
  private drawTimeline(alpha: number, t: number, clock: number) {
    const { ctx, w, h } = this;
    const mobile = w < 700;
    const left = w * (mobile ? 0.04 : 0.07);
    const right = w - left;
    const top = h * (mobile ? 0.7 : 0.66);
    const tw = right - left;
    const trackH = Math.max(14, h * 0.038);
    const build = invLerp(0.205, 0.27, t);
    const play = invLerp(0.235, 0.32, t);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(21,19,17,0.82)";
    ctx.fillRect(left, top, tw, trackH * 5.6);
    ctx.strokeStyle = "rgba(239,232,222,0.12)";
    ctx.strokeRect(left + 0.5, top + 0.5, tw - 1, trackH * 5.6 - 1);
    // ruler
    ctx.fillStyle = "rgba(239,232,222,0.35)";
    ctx.font = `500 ${Math.max(9, trackH * 0.42)}px "IBM Plex Mono", monospace`;
    ctx.textBaseline = "middle";
    for (let i = 0; i <= 24; i++) {
      const x = left + 52 + ((tw - 60) * i) / 24;
      ctx.fillRect(x, top + 4, 1, i % 4 === 0 ? 8 : 4);
      if (i % 4 === 0 && !mobile) ctx.fillText(`00:${String(i * 2).padStart(2, "0")}`, x + 3, top + 10);
    }
    const labels = ["V2", "V1", "A1", "A2"];
    for (let r = 0; r < 4; r++) {
      const y = top + trackH * (1 + r * 1.12);
      ctx.fillStyle = "rgba(239,232,222,0.4)";
      ctx.fillText(labels[r], left + 12, y + trackH / 2);
      ctx.fillStyle = "rgba(239,232,222,0.04)";
      ctx.fillRect(left + 50, y, tw - 58, trackH);
      // clips slide in from the right as the timeline "builds"
      let cursor = left + 52 + hash(r * 7) * 30;
      for (let c = 0; c < 7; c++) {
        const s = r * 17 + c;
        const len = (tw - 60) * (0.07 + hash(s) * 0.12);
        const appear = clamp((build * 1.6 - c * 0.12 - r * 0.05) * 1.4);
        if (appear > 0) {
          const off = (1 - smooth(0, 1, appear)) * w * 0.4;
          const isEmber = (r === 1 && c === 2) || (r === 0 && c === 4);
          ctx.globalAlpha = alpha * smooth(0, 1, appear);
          ctx.fillStyle = r < 2 ? (isEmber ? "rgba(239,106,42,0.75)" : "rgba(239,232,222,0.22)") : "rgba(245,165,74,0.18)";
          const cx = cursor + off;
          if (cx < right - 8) {
            ctx.fillRect(cx, y + 2, Math.min(len - 3, right - 8 - cx), trackH - 4);
            if (r >= 2) {
              ctx.fillStyle = "rgba(245,165,74,0.55)";
              for (let k = 0; k < len - 6; k += 4) {
                const amp = (0.2 + 0.8 * Math.abs(Math.sin(k * 0.13 + s))) * (trackH - 8) * 0.5;
                if (cx + k < right - 8) ctx.fillRect(cx + k + 2, y + trackH / 2 - amp / 2, 2, amp);
              }
            }
          }
        }
        cursor += len + 4 + hash(s + 1) * 18;
        if (cursor > right) break;
      }
      ctx.globalAlpha = alpha;
    }
    // playhead (scroll drives it, the clock nudges it)
    const ph = left + 52 + (tw - 60) * clamp(play * 0.92 + 0.02 + Math.sin(clock * 0.8) * 0.002);
    ctx.fillStyle = "#ef6a2a";
    ctx.fillRect(ph, top + 2, 1.5, trackH * 5.5);
    ctx.beginPath();
    ctx.moveTo(ph - 5, top + 2);
    ctx.lineTo(ph + 6.5, top + 2);
    ctx.lineTo(ph + 0.75, top + 10);
    ctx.fill();

    // program monitor: the first video plays
    const mw = mobile ? w * 0.56 : Math.min(w * 0.3, 520);
    const mh = (mw * 9) / 16;
    const mx = mobile ? (w - mw) / 2 : w * 0.66 - mw / 2;
    const my = mobile ? top - mh - 14 : top - mh - h * 0.06;
    const mA = alpha * smooth(0.225, 0.25, t);
    if (mA > 0.01) {
      ctx.globalAlpha = mA;
      ctx.fillStyle = "#050404";
      ctx.fillRect(mx, my, mw, mh);
      ctx.save();
      ctx.beginPath();
      ctx.rect(mx, my, mw, mh);
      ctx.clip();
      // abstract footage: light sweeping across a figure-like silhouette, moving with the playhead
      const p = play * 6 + clock * 0.35;
      for (let i = 0; i < 5; i++) {
        const bx = mx + ((p * 0.18 + i * 0.27) % 1.2) * mw - mw * 0.1;
        const g = ctx.createLinearGradient(bx - mw * 0.2, 0, bx + mw * 0.2, 0);
        g.addColorStop(0, "rgba(239,106,42,0)");
        g.addColorStop(0.5, `rgba(${i % 2 ? "245,165,74" : "239,106,42"},${0.18 + 0.1 * i / 5})`);
        g.addColorStop(1, "rgba(239,106,42,0)");
        ctx.fillStyle = g;
        ctx.fillRect(mx, my, mw, mh);
      }
      ctx.fillStyle = "rgba(11,10,9,0.85)";
      const sx = mx + mw * (0.42 + Math.sin(p * 0.6) * 0.05);
      ctx.beginPath();
      ctx.arc(sx, my + mh * 0.38, mh * 0.12, 0, Math.PI * 2);
      ctx.fill();
      this.roundRect(sx - mh * 0.2, my + mh * 0.52, mh * 0.4, mh * 0.6, mh * 0.12);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = "rgba(239,232,222,0.3)";
      ctx.strokeRect(mx + 0.5, my + 0.5, mw - 1, mh - 1);
      ctx.fillStyle = "rgba(239,232,222,0.6)";
      ctx.font = `500 11px "IBM Plex Mono", monospace`;
      ctx.textBaseline = "alphabetic";
      ctx.fillText(`PROGRAM  ▶  ${this.timecode(play * 48)}`, mx, my - 8);
    }
    ctx.globalAlpha = 1;
  }

  // ======================================================================
  // Engine: slow concentric rings behind the content-engine act
  // ======================================================================
  private drawEngine(alpha: number, clock: number, t: number) {
    const { ctx, w, h } = this;
    const cx = w * 0.72;
    const cy = h * 0.52;
    const R = Math.min(w, h) * 0.42;
    ctx.globalAlpha = alpha * 0.5;
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = i === 1 ? "rgba(239,106,42,0.35)" : "rgba(239,232,222,0.14)";
      ctx.setLineDash([2 + i * 4, 10 + i * 6]);
      ctx.lineDashOffset = clock * (12 + i * 8) * (i % 2 ? -1 : 1) + t * 600;
      ctx.beginPath();
      ctx.arc(cx, cy, R * (0.45 + i * 0.25), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }

  // ======================================================================
  // Energy: frames rushing toward the lens
  // ======================================================================
  private drawFrames(alpha: number, dt: number, velocity: number) {
    const { ctx, w, h } = this;
    const speed = (0.12 + Math.min(Math.abs(velocity) * 0.0004, 0.5)) * dt;
    ctx.lineWidth = 1;
    for (const f of this.frames) {
      f.z -= speed * (0.6 + f.r);
      if (f.z <= 0.02) {
        f.z = 1;
        f.x = this.rnd() * 2 - 1;
        f.y = this.rnd() * 2 - 1;
      }
      const persp = 1 / (f.z * 2.2 + 0.08);
      const x = w / 2 + f.x * w * 0.5 * persp * 0.35;
      const y = h / 2 + f.y * h * 0.5 * persp * 0.35;
      const s = 40 * persp;
      const fw = f.tall ? s * 0.5625 : s;
      const fh = f.tall ? s : s;
      const a = alpha * smooth(1, 0.6, f.z) * (1 - smooth(0.1, 0.02, f.z));
      if (a < 0.01) continue;
      ctx.globalAlpha = a;
      ctx.fillStyle = f.r > 0.7 ? "rgba(239,106,42,0.18)" : "rgba(239,232,222,0.05)";
      ctx.fillRect(x - fw / 2, y - fh / 2, fw, fh);
      ctx.strokeStyle = f.r > 0.7 ? "rgba(245,165,74,0.7)" : "rgba(239,232,222,0.35)";
      ctx.strokeRect(x - fw / 2, y - fh / 2, fw, fh);
    }
    ctx.globalAlpha = 1;
  }

  // ======================================================================
  // Particles: sparks, flame, fire, world, embers
  // ======================================================================
  private updateParticles(s: { t: number; dt: number; clock: number; sparkW: number; flameW: number; flameH: number; fireW: number; worldW: number; emberW: number }) {
    const { w, h } = this;
    const k = this.lowPower ? 0.5 : 1;
    const dt = Math.min(s.dt, 0.05);
    const scale = Math.min(w, h) / 900;

    // sparks: occasional bursts near the lower third
    if (s.sparkW > 0.02 && this.rnd() < 0.06 * s.sparkW) {
      const bx = w * (0.3 + this.rnd() * 0.4);
      const by = h * (0.62 + this.rnd() * 0.2);
      this.emit(Math.round(14 * k), () => ({
        x: bx, y: by, vx: (this.rnd() - 0.5) * 320, vy: -this.rnd() * 300 - 40,
        life: 0, max: 0.4 + this.rnd() * 0.5, size: 3 + this.rnd() * 4, kind: 0, seed: this.rnd(),
      }));
    }
    // flame: one source at bottom centre, growing with scroll
    if (s.flameW > 0.02) {
      const n = Math.round((3 + s.flameH * 10) * s.flameW * k);
      const base = Math.min(w, h) * (0.05 + s.flameH * 0.1);
      this.emit(n, () => ({
        x: w / 2 + (this.rnd() - 0.5) * base * 1.4, y: h + 20,
        vx: (this.rnd() - 0.5) * 40, vy: -(160 + this.rnd() * 180) * (0.6 + s.flameH) * scale,
        life: 0, max: 0.9 + this.rnd() * 0.8 * (0.5 + s.flameH), size: (50 + this.rnd() * 90) * (0.6 + s.flameH) * scale, kind: 1, seed: this.rnd(),
      }));
    }
    // fire: the whole bottom edge
    if (s.fireW > 0.02) {
      const n = Math.round(22 * s.fireW * k);
      this.emit(n, () => ({
        x: this.rnd() * w, y: h + 30,
        vx: (this.rnd() - 0.5) * 60, vy: -(220 + this.rnd() * 260) * scale,
        life: 0, max: 1.1 + this.rnd() * 1.2, size: (90 + this.rnd() * 160) * scale, kind: 1, seed: this.rnd(),
      }));
    }
    // embers drift everywhere warm
    const emberRate = Math.max(s.flameW * 0.6, s.fireW * 1.4, s.worldW * 0.5, s.emberW * 0.35, s.sparkW * 0.2);
    if (emberRate > 0.02 && this.rnd() < emberRate * k) {
      this.emit(1 + (this.rnd() < emberRate * 0.5 ? 1 : 0), () => ({
        x: this.rnd() * w, y: h + 10,
        vx: (this.rnd() - 0.5) * 30, vy: -(40 + this.rnd() * 120) * scale,
        life: 0, max: 3 + this.rnd() * 4, size: 2 + this.rnd() * 3.5, kind: 2, seed: this.rnd(),
      }));
    }

    const cx = w / 2;
    const cy = h * 0.46;
    const pull = smooth(0.9, 0.97, s.t) * (1 - smooth(1.0, 1.06, s.t));
    const ps = this.particles;
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.life += dt;
      if (p.life >= p.max || p.y < -200) {
        ps[i] = ps[ps.length - 1];
        ps.pop();
        continue;
      }
      if (p.kind === 0) {
        p.vy += 520 * dt;
      } else if (p.kind === 1) {
        p.vx += Math.sin(s.clock * 3 + p.seed * 20 + p.y * 0.01) * 60 * dt;
        p.vx *= 0.98;
        // flames lean toward the world when it forms
        if (pull > 0) {
          p.vx += (cx - p.x) * pull * 2.2 * dt;
          p.vy += (cy - p.y) * pull * 2.2 * dt;
        }
      } else {
        p.vx += Math.sin(s.clock * 1.3 + p.seed * 40) * 18 * dt;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  private drawParticles() {
    const { ctx } = this;
    ctx.globalCompositeOperation = "lighter";
    for (const p of this.particles) {
      const u = p.life / p.max;
      if (p.kind === 1) {
        const bin = Math.min(SPRITE_BINS - 1, Math.floor(u * u * 0.9 * SPRITE_BINS + 1));
        const size = p.size * (1 - u * 0.65);
        ctx.globalAlpha = (1 - u) * 0.42 * smooth(0, 0.12, u);
        ctx.drawImage(this.sprites[bin], p.x - size / 2, p.y - size / 2, size, size);
      } else if (p.kind === 0) {
        ctx.globalAlpha = 1 - u;
        const size = p.size * 3 * (1 - u * 0.5);
        ctx.drawImage(this.sprites[1], p.x - size / 2, p.y - size / 2, size, size);
      } else {
        const tw = 0.6 + 0.4 * Math.sin(p.life * 7 + p.seed * 30);
        ctx.globalAlpha = (1 - u) * tw * 0.9;
        const size = p.size * 3;
        ctx.drawImage(this.sprites[3], p.x - size / 2, p.y - size / 2, size, size);
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  private drawGlow(heat: number, fireW: number, worldW: number) {
    const { ctx, w, h } = this;
    if (heat < 0.01) return;
    const g = ctx.createRadialGradient(w / 2, h * 1.05, 0, w / 2, h * 1.05, Math.max(w, h) * (0.35 + heat * 0.55));
    g.addColorStop(0, `rgba(239,106,42,${0.32 * heat})`);
    g.addColorStop(0.5, `rgba(180,52,18,${0.14 * heat})`);
    g.addColorStop(1, "rgba(11,10,9,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    if (fireW > 0.05) {
      const lg = ctx.createLinearGradient(0, h, 0, h * 0.35);
      lg.addColorStop(0, `rgba(239,106,42,${0.22 * fireW})`);
      lg.addColorStop(1, "rgba(239,106,42,0)");
      ctx.fillStyle = lg;
      ctx.fillRect(0, 0, w, h);
    }
    void worldW;
  }

  // ======================================================================
  // The world: everything collapses into one place of its own
  // ======================================================================
  private drawWorld(alpha: number, clock: number, t: number) {
    const { ctx, w, h } = this;
    const cx = w / 2;
    const cy = h * 0.46;
    const R = Math.min(w, h) * 0.15 * (0.6 + 0.4 * smooth(0.89, 0.97, t));
    ctx.globalAlpha = alpha;
    // halo
    const halo = ctx.createRadialGradient(cx, cy, R * 0.8, cx, cy, R * 3.2);
    halo.addColorStop(0, "rgba(245,165,74,0.28)");
    halo.addColorStop(1, "rgba(245,165,74,0)");
    ctx.fillStyle = halo;
    ctx.fillRect(cx - R * 3.4, cy - R * 3.4, R * 6.8, R * 6.8);
    // ring (back half)
    const tilt = 0.28;
    const spin = clock * 0.25;
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = "rgba(239,232,222,0.35)";
    ctx.setLineDash([3, 7]);
    ctx.lineDashOffset = -clock * 20;
    ctx.beginPath();
    ctx.ellipse(cx, cy, R * 1.9, R * 1.9 * tilt, -0.22, Math.PI, Math.PI * 2);
    ctx.stroke();
    // sphere
    const body = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
    body.addColorStop(0, "#ffd6a0");
    body.addColorStop(0.35, "#ef6a2a");
    body.addColorStop(0.8, "#4a1708");
    body.addColorStop(1, "#160805");
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();
    // latitude lines turning
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();
    ctx.setLineDash([]);
    ctx.strokeStyle = "rgba(255,214,160,0.18)";
    for (let i = 0; i < 6; i++) {
      const ph = ((spin + i / 6) % 1) * Math.PI;
      const rx = Math.abs(Math.cos(ph)) * R;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, R, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    // ring (front half)
    ctx.strokeStyle = "rgba(255,214,160,0.7)";
    ctx.setLineDash([3, 7]);
    ctx.beginPath();
    ctx.ellipse(cx, cy, R * 1.9, R * 1.9 * tilt, -0.22, 0, Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);
    // orbiting satellites
    for (let i = 0; i < 9; i++) {
      const a = clock * (0.3 + i * 0.05) + i * 2.1;
      const rr = R * (1.35 + (i % 3) * 0.32);
      const x = cx + Math.cos(a) * rr;
      const y = cy + Math.sin(a) * rr * tilt * 1.4 - Math.cos(a) * 0.22 * rr * tilt;
      ctx.fillStyle = i % 3 === 0 ? "#f5a54a" : "rgba(239,232,222,0.8)";
      ctx.beginPath();
      ctx.arc(x, y, i % 3 === 0 ? 3 : 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ---- helpers ----
  private heart(x: number, y: number, s: number, color: string, fill: boolean) {
    const { ctx } = this;
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.9);
    ctx.bezierCurveTo(x - s * 1.6, y - s * 0.2, x - s * 0.6, y - s * 1.3, x, y - s * 0.4);
    ctx.bezierCurveTo(x + s * 0.6, y - s * 1.3, x + s * 1.6, y - s * 0.2, x, y + s * 0.9);
    if (fill) {
      ctx.fillStyle = color;
      ctx.fill();
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number) {
    const { ctx } = this;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  private timecode(seconds: number) {
    const s = Math.max(0, seconds);
    const hh = Math.floor(s / 3600);
    const mm = Math.floor((s % 3600) / 60);
    const ss = Math.floor(s % 60);
    const ff = Math.floor((s % 1) * 25);
    return [hh, mm, ss, ff].map((n) => String(n).padStart(2, "0")).join(":");
  }
}
