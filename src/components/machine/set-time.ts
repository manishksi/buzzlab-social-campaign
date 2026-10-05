/** When the camera is with each role on the miniature set (Act 09), in set time (0 → 1). No three.js: the section reads it too. */
export const SET = { first: 0.08, slot: 0.144, back: 0.8 };
export const roleAt = (w: number) => (w < SET.first || w >= SET.back ? -1 : Math.min(4, Math.floor((w - SET.first) / SET.slot)));
