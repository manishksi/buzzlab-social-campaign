"use client";

/**
 * Synthesized sound effects (Web Audio, no files). Silent unless the visitor turns sound on;
 * browsers only allow audio after a click, so the toggle doubles as the unlock gesture.
 */
import { store } from "./store";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

export function unlockAudio() {
  if (typeof window === "undefined") return;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
}

function ready() {
  return store.get().sound && ctx && master && ctx.state === "running";
}

function noiseBuffer(seconds: number) {
  const c = ctx!;
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * seconds), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

/** The dry metallic click of a lighter wheel. */
export function playClick(intensity = 1) {
  if (!ready()) return;
  const c = ctx!;
  const t = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(0.08);
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 3200;
  bp.Q.value = 3;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.9 * intensity, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
  src.connect(bp).connect(g).connect(master!);
  src.start(t);
  // tiny metallic ping
  const o = c.createOscillator();
  o.type = "triangle";
  o.frequency.setValueAtTime(5200, t);
  o.frequency.exponentialRampToValueAtTime(2400, t + 0.05);
  const og = c.createGain();
  og.gain.setValueAtTime(0.06 * intensity, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  o.connect(og).connect(master!);
  o.start(t);
  o.stop(t + 0.08);
}

/** Flint scrape + gas catching. */
export function playIgnite() {
  if (!ready()) return;
  playClick(1);
  const c = ctx!;
  const t = c.currentTime + 0.03;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(1.4);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(400, t);
  lp.frequency.exponentialRampToValueAtTime(2600, t + 0.18);
  lp.frequency.exponentialRampToValueAtTime(700, t + 1.2);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.5, t + 0.08);
  g.gain.exponentialRampToValueAtTime(0.12, t + 0.5);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.35);
  src.connect(lp).connect(g).connect(master!);
  src.start(t);
}

/** Low cinematic swell for big reveals. */
export function playSwell() {
  if (!ready()) return;
  const c = ctx!;
  const t = c.currentTime;
  const o = c.createOscillator();
  o.type = "sawtooth";
  o.frequency.setValueAtTime(55, t);
  o.frequency.exponentialRampToValueAtTime(82, t + 2.2);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(120, t);
  lp.frequency.exponentialRampToValueAtTime(900, t + 1.6);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.22, t + 1.2);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 2.8);
  o.connect(lp).connect(g).connect(master!);
  o.start(t);
  o.stop(t + 3);
}
