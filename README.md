# BuzzLab — Light It Up

An interactive, scroll-driven presentation of BuzzLab's 6-month Instagram growth and content strategy.
It plays like one continuous film: **Dead feed → Creation → Spark → Flame → Fire → Original IP.**

## Run it

```bash
npm install
npm run dev        # http://localhost:3000 while editing
npm run build      # static site written to /out
npm start          # serves /out on http://localhost:3000
```

`/out` is a plain static site. Deploy it anywhere (Vercel, Netlify, S3) or open it from a USB stick with any static server.
For the pitch, present on a laptop in Chrome or Safari, full screen, scrolling with a trackpad.
Turn **Sound on** (top right) for the lighter clicks and ignition.

## Edit the words

All copy, phases, series, pillars, the weekly rhythm, pipeline stages and metrics live in
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
  function of scroll position (dead feed, camera power-on, edit timeline, sparks, flame, fire, the IP
  world). When `film.src` is set it scrubs your real video instead.
- **The lighter** (`src/components/lighter/Lighter.tsx`) is an SVG with a hinged lid, knurled wheel,
  three-layer flame and spark bursts; it is the phase selector.
- Sound effects are synthesised with Web Audio, so there are no audio files.

```
src/
  app/                  layout, global styles and design tokens
  content/strategy.ts   every word on the page
  content/media.ts      footage slots
  components/
    film/               scroll-scrubbed background film
    lighter/            the lighter
    chrome/             top bar, index menu, cursor, phase rail, intro slate, ignite transition
    sections/           the twelve acts
    ui/                 reveals, counters, footage slots, placeholder reels
public/assets/
  video/ images/ icons/ fonts/
```

Respects `prefers-reduced-motion` (no smooth scrolling, intro skipped, flicker and grain still).

`portfolio-recreation/` holds an earlier, unrelated single-file page and is not part of this site.
