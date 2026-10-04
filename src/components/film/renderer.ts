import { band, clamp, hash, invLerp, smooth } from "@/lib/math";
import { CharacterScene, type ScenePreview } from "./character";

/**
 * The background film, drawn procedurally on a 2D canvas.
 * `t` is film time: 0 = dead feed … 0.46 the character steps out of the dark … 1.2 = black.
 * Every scene is a pure function of (t, clock) so scrolling backwards plays the film backwards.
 */

export type FilmFrame = { t: number; clock: number; dt: number; velocity: number; preview: ScenePreview };

export class FilmRenderer {
  private ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private character: CharacterScene;

  constructor(private canvas: HTMLCanvasElement, opts: { lowPower: boolean }) {
    this.ctx = canvas.getContext("2d", { alpha: false })!;
    this.character = new CharacterScene(opts.lowPower);
  }

  resize(w: number, h: number, dpr: number) {
    this.w = w;
    this.h = h;
    this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.character.resize(w, h, dpr);
  }

  render({ t, clock, dt, velocity, preview }: FilmFrame) {
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
    const engineW = band(0.39, 0.42, 0.44, 0.465, t);

    if (feedW > 0.01) this.drawFeed(feedW, breakP, clock, velocity);
    if (engineW > 0.01) this.drawEngine(engineW, clock, t);
    if (camW > 0.01) this.drawCamera(camW, powerP, clock, t);
    if (tlW > 0.01) this.drawTimeline(tlW, t, clock);

    // from ACT 04 on: one continuous shot of the character, the lighter and the cigarette
    return this.character.render(ctx, { t, clock, dt, velocity, preview });
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
