# BuzzLab — Light It Up

An interactive, scroll-driven presentation of BuzzLab's 6-month Instagram growth and content strategy.
It plays like one continuous film that loops: **the dead page → where we are → make BuzzLab worth noticing → the page notices you back → Spark → Flame → Light → the creative machine → Original BuzzLab IP → Landy eats the presentation → the page is dead.**

Black, off-white and BuzzLab yellow (`--color-buzz` in `src/app/globals.css`).

## Run it

```bash
npm install
npm run dev        # http://localhost:3000 while editing
npm run build      # static site written to /out
npm start          # serves /out on http://localhost:3000
```

`/out` is a plain static site. Deploy it anywhere (Vercel, Netlify, S3) or open it from a USB stick with any static server.
For the pitch, present on a laptop in Chrome or Safari, full screen, scrolling with a trackpad.
Turn **Sound on** (top right) for the lighter in ACT 04, the play-button click and the reveals.

## Edit the words

All copy (phases, series, pipeline stages, the IP reveal, the final lines) lives in
`src/content/strategy.ts`. Components only render it.

## Add real footage

Every place footage can go is listed in `src/content/media.ts`. While a slot's `src` is `null`, the
site shows a designed animated placeholder with a small "Footage slot" tag (turn the tags off with
`SHOW_SLOT_LABELS = false`). See `public/assets/video/README.md` for file names, shapes and the
ffmpeg commands that keep scroll-scrubbing smooth.

## How it is built

- **Next.js (App Router, static export) + React + Tailwind CSS**
- **GSAP + ScrollTrigger** for pinned acts and scrubbed timelines, **SplitText** for text reveals
- **Lenis** smooth scrolling on GSAP's ticker
- **Motion** (Framer Motion) for the index menu, act indicator and preview swaps
- **Background film**: `src/components/film/renderer.ts` draws the opening on a 2D canvas as a pure
  function of scroll position (dead feed, camera power-on, edit timeline). From ACT 04 it hands over
  to `src/components/film/character.ts`: one continuous shot of an original noir figure on the right of
  frame — the lighter is sparked, catches, lights his cigarette, the cigarette burns down through
  Phase 03 and ends on the floor under his boot. Hovering a phase in ACT 04 plays that moment on him.
  When `film.src` is set the site scrubs your real video instead.
- **The eyes** (`sections/Watching.tsx`, between ACT 02 and 03) track the cursor, blink, get curious,
  and react to scroll speed.
- **The creative machine** (`src/components/machine/`) is a three.js world, loaded only when it is
  about to be seen: a yellow dot becomes a play button, content pours out, cameras catch it, it is cut
  on a giant timeline, multiplies into a feed, turns to chaos, stops, and the last reel opens into a
  world. The pipeline stages caption each shot (`sections/Machine.tsx`); the IP reveal plays over the
  world (`sections/OriginalIP.tsx`).
- **Landy** (`sections/Landy.tsx`) eats the presentation, then the page loops back to the top under a
  black veil — no reload.
- Sound effects are synthesised with Web Audio, so there are no audio files.

```
src/
  app/                  layout, global styles and design tokens
  content/strategy.ts   every word on the page
  content/media.ts      footage slots
  components/
    film/               scroll-scrubbed background film and the character shot
    machine/            the creative machine (three.js) and its painted content
    chrome/             top bar, index menu, cursor, phase rail, intro slate, ignite transition
    sections/           the acts, in order
    ui/                 reveals, footage slots, placeholder reels
public/assets/
  video/ images/ icons/ fonts/
```

Respects `prefers-reduced-motion` (no smooth scrolling, intro skipped, flicker and grain still).

`portfolio-recreation/` holds an earlier, unrelated single-file page and is not part of this site.
