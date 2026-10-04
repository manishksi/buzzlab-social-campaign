/** When each stage of the pipeline (Act 08) is on screen, in pipeline time (0 → 1). No three.js here: the section reads it too. */
export const PIPE = { first: 0.07, slot: 0.072, back: 0.718, loopA: 0.79, loopB: 0.97 };
export const stageAt = (w: number) => (w < PIPE.first || w >= PIPE.back ? -1 : Math.min(8, Math.floor((w - PIPE.first) / PIPE.slot)));
