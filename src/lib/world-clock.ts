/**
 * Scroll time for each 3D world (0 → 1). Pinned sections write it from their scroll progress; the
 * WebGL host reads it every frame. `fade` dims the whole layer (to black at a world's edges).
 */
export type WorldId = "studio" | "machine" | "pipeline" | "set" | "tanishka";

export const worldClock: Record<WorldId, { w: number; fade: number }> = {
  studio: { w: 0, fade: 0 },
  machine: { w: 0, fade: 1 },
  pipeline: { w: 0, fade: 1 },
  set: { w: 0, fade: 1 },
  tanishka: { w: 0, fade: 1 },
};

/** Where each world lives in the page: from the top of the first section to the bottom of the last. */
export const worldSpans: { id: WorldId; from: string; to: string }[] = [
  { id: "studio", from: "workstation", to: "engine" },
  { id: "machine", from: "machine", to: "ip" },
  { id: "pipeline", from: "pipeline", to: "pipeline" },
  { id: "set", from: "set", to: "set" },
  { id: "tanishka", from: "tanishka", to: "tanishka" },
];
