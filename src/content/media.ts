/**
 * FOOTAGE SLOTS
 * -------------
 * Every place real BuzzLab footage can go. Nothing here is required: while `src` is null the
 * site renders a designed, animated placeholder in that slot.
 *
 * To use your own footage:
 *   1. Drop the file into /public/assets/video/ (or /public/assets/images/ for posters).
 *   2. Set `src` (and optionally `poster`) below to the public path, e.g. "/assets/video/spark-01-intro.mp4".
 *   3. Rebuild. The placeholder in that slot is replaced automatically.
 *
 * Encoding tips are in /public/assets/video/README.md (the background film needs a
 * keyframe-dense encode so scroll scrubbing stays smooth).
 */

export type MediaSlot = {
  id: string;
  /** Public path to an .mp4/.webm, or null to keep the placeholder. */
  src: string | null;
  /** Optional still shown before the video loads. */
  poster: string | null;
  /** Recommended file name and what to shoot. */
  file: string;
  brief: string;
};

/** Show a small "footage slot" tag on placeholders (handy while assembling, switch off for the final pitch). */
export const SHOW_SLOT_LABELS = true;

/** The scroll-scrubbed background film. Scrubbed from 0% (top of page) to 100% (finale). */
export const film: MediaSlot = {
  id: "film",
  src: null,
  poster: null,
  file: "/assets/video/film.mp4",
  brief:
    "One continuous 60–90s piece, landscape 16:9. Dead feed → camera powers on → edit timeline → first spark → flame → everything on fire → a single glowing world. Dark, slow, low-key; text sits on top of it.",
};

export const slots: Record<string, MediaSlot> = {
  "spark-01": {
    id: "spark-01",
    src: null,
    poster: null,
    file: "/assets/video/spark-01-intro.mp4",
    brief: "Vertical 9:16 preview of The BuzzLab Intro. Fast cuts: cameras, editors, shoots, chaos, final output.",
  },
  "spark-02": {
    id: "spark-02",
    src: null,
    poster: null,
    file: "/assets/video/spark-02-meet-the-people.mp4",
    brief: "Vertical 9:16. Each team member framed as a character with a title card.",
  },
  "spark-03": {
    id: "spark-03",
    src: null,
    poster: null,
    file: "/assets/video/spark-03-how-its-made.mp4",
    brief: "Vertical 9:16. One project: idea → shoot → edit → final, satisfying match cuts.",
  },
  "spark-04": {
    id: "spark-04",
    src: null,
    poster: null,
    file: "/assets/video/spark-04-brain.mp4",
    brief: "Vertical 9:16. AI, VFX, camera tricks, motion graphics. The weirdest experiments.",
  },
  "spark-05": {
    id: "spark-05",
    src: null,
    poster: null,
    file: "/assets/video/spark-05-after-dark.mp4",
    brief: "Vertical 9:16. Late-night edits, failed takes, shoot-day chaos.",
  },
  "flame-01": {
    id: "flame-01",
    src: null,
    poster: null,
    file: "/assets/video/flame-01-behind-the-camera.mp4",
    brief: "4:5 title-card loop for the series. A portrait of one team member behind a camera.",
  },
  "flame-02": {
    id: "flame-02",
    src: null,
    poster: null,
    file: "/assets/video/flame-02-breakdown.mp4",
    brief: "4:5 loop. A campaign frame paused, annotated, scrubbed.",
  },
  "flame-03": {
    id: "flame-03",
    src: null,
    poster: null,
    file: "/assets/video/flame-03-one-idea-one-hour.mp4",
    brief: "4:5 loop. A countdown timer over frantic making.",
  },
  "flame-04": {
    id: "flame-04",
    src: null,
    poster: null,
    file: "/assets/video/flame-04-war-room.mp4",
    brief: "4:5 loop. Two creatives, split screen, face-off.",
  },
  "flame-05": {
    id: "flame-05",
    src: null,
    poster: null,
    file: "/assets/video/flame-05-brief-to-film.mp4",
    brief: "4:5 loop. Brief document dissolving into the final film.",
  },
};
