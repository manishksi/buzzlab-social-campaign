import type { ScenePreview } from "@/components/film/character";

/**
 * The background film's time, shared with the 3D lighter scene (ACT 04). ScrollFilm writes `t` and
 * `preview` every frame; once the 3D scene has loaded it sets `lighter3d`, and the 2D figure stands
 * down (it stays as the fallback when WebGL isn't there). The 3D scene writes `heat` back — the
 * warmth of the page while the flame is lit.
 */
export const filmClock: { t: number; preview: ScenePreview; lighter3d: boolean; heat: number } = { t: 0, preview: null, lighter3d: false, heat: 0 };
