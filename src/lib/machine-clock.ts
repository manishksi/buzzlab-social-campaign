/**
 * World time for the creative machine (0 → 1), written by the pinned machine and IP sections from
 * their scroll progress and read every frame by the WebGL layer.
 */
export const machineClock = {
  w: 0,
  /** true while either section is on or near the screen */
  near: false,
  /** 0..1 fade of the whole layer (to black at the very end) */
  fade: 1,
};
