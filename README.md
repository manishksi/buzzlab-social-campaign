# BuzzLab — Light It Up

An interactive, scroll-driven presentation of BuzzLab's 6-month Instagram growth and content strategy.
It plays like one continuous film: **Dead feed → Creation → Spark → Flame → Light**, then the cigarette is put out and the next chapter begins.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000 while editing
npm run build      # static site written to /out
npm start          # serves /out on http://localhost:3000
```

`/out` is a plain static site. Deploy it anywhere (Vercel, Netlify, S3) or open it from a USB stick with any static server.
For the pitch, present on a laptop in Chrome or Safari, full screen, scrolling with a trackpad.
Turn **Sound on** (top right) for the lighter wheel and ignition in ACT 04.

## Edit the words

All copy, phases, series, pipeline stages and the final lines live in
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
- **Background film**: `src/components/film/renderer.ts` draws the whole film on a 2D canvas as a pure
  function of scroll position (dead feed, camera power-on, edit timeline). From ACT 04 on it hands over
  to `src/components/film/character.ts`: one continuous shot of an original noir figure on the right of
  frame — the lighter is sparked, catches, lights his cigarette, the cigarette burns down with the scroll,
  and at the end he drops it and steps on it. Hovering a phase in ACT 04 plays that moment on him.
  When `film.src` is set the site scrubs your real video instead.
- Sound effects are synthesised with Web Audio, so there are no audio files.

```
src/
  app/                  layout, global styles and design tokens
  content/strategy.ts   every word on the page
  content/media.ts      footage slots
  components/
    film/               scroll-scrubbed background film and the character shot
    chrome/             top bar, index menu, cursor, phase rail, intro slate, ignite transition
    sections/           the ten acts (00–09)
    ui/                 reveals, footage slots, placeholder reels
public/assets/
  video/ images/ icons/ fonts/
```

Respects `prefers-reduced-motion` (no smooth scrolling, intro skipped, flicker and grain still).

`portfolio-recreation/` holds an earlier, unrelated single-file page and is not part of this site.
