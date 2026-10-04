import * as THREE from "three";
import type { WorldId } from "@/lib/world-clock";

/**
 * Everything three.js-side of the WebGL host: one renderer for every world, and a lazy loader per
 * world so each scene's code only downloads when the reader is about to reach it.
 */
export type Label = { id: string; text: string; x: number; y: number; a: number };
export type World = {
  render(w: number, clock: number, pointer: { x: number; y: number }): void;
  resize(w: number, h: number): void;
  labels?(w: number): Label[];
  dispose(): void;
};
type Opts = { lowPower: boolean };

export function createRenderer(canvas: HTMLCanvasElement, opts: Opts) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: !opts.lowPower, alpha: false, powerPreference: "high-performance" });
  r.setClearColor(0x000000, 1);
  r.toneMapping = THREE.NeutralToneMapping;
  r.toneMappingExposure = 1;
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.shadowMap.enabled = !opts.lowPower;
  r.shadowMap.type = THREE.PCFShadowMap;
  return r;
}

export const loaders: Record<WorldId, (r: THREE.WebGLRenderer, o: Opts) => Promise<World>> = {
  studio: async (r, o) => new (await import("./studio")).StudioScene(r, o),
  machine: async (r, o) => new (await import("./scene")).MachineScene(r, o),
  pipeline: async (r, o) => new (await import("./pipeline")).PipelineScene(r, o),
  set: async (r, o) => new (await import("./set")).SetScene(r, o),
  tanishka: async (r, o) => new (await import("./tanishka")).TanishkaScene(r, o),
};
