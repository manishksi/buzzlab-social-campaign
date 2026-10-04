# BuzzLab — Light It Up

An interactive, scroll-driven presentation of BuzzLab's 6-month Instagram growth and content strategy.
It plays like one continuous film that loops: **the dead page → where we are → make BuzzLab worth noticing → the editor at his desk → the studio behind him → Spark → Flame → Light → a yellow dot becomes the creative machine → Original BuzzLab IP → the pipeline → the set → Tanishka eats the presentation → the page is dead.**

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
- **The 3D worlds** (`src/components/machine/`) all play on one fixed WebGL canvas
  (`WorldFilm.tsx`, one three.js renderer). Each world's code loads just before it is reached, and only
  the world holding the middle of the screen renders. Pinned sections write each world's scroll time
  into `src/lib/world-clock.ts`.
  - **The studio** (`studio.ts`, ACT 02–03, `sections/Workstation.tsx` + `sections/Studio.tsx`): one
    camera move from an editor at his desk (yellow tee, studio headphones) round the workstation and
    past the monitor into the rest of the studio: a second edit bay, the storyboard wall, the
    production table, the set with camera, DOP, lights, talent, director and producer. Then the
    lights go out and ACT 04 starts in the dark.
  - **The creative machine** (`scene.ts`, ACT 07, `sections/Machine.tsx` + `sections/OriginalIP.tsx`):
    a yellow dot becomes a play button, content pours out, cameras catch it, it is cut on a giant
    timeline, multiplies into a feed, turns to chaos, stops, and the last reel opens into a world —
    ORIGINAL BUZZLAB IP.
  - **The pipeline** (`pipeline.ts`, ACT 08, `sections/Pipeline.tsx`): a yellow piece of content travels
    a closed track through nine stations, from idea to iterate, with the eight signals at Analyse.
    Then it runs the loop again from above: post, measure, learn, improve, new idea, post again.
  - **The set** (`set.ts`, ACT 09, `sections/ProductionSet.tsx`): a miniature production on a plinth;
    the camera visits the director, DOP, lighting, producer, editor, creative, social and talent.
  - **Tanishka** (`tanishka.ts`, `sections/Tanishka.tsx`) opens her mouth and eats the presentation;
    the camera goes in after it, and the page loops back to the top under a black veil — no reload.
  - Everyone is built by one character builder (`people.ts`), so the crew, the editor and Tanishka
    share a look.
- **The strategy systems** sit inside the phases: the content mix as a mixing desk in Spark
  (`sections/ContentMix.tsx`), the weekly rhythm as a broadcast schedule in Flame
  (`sections/Broadcast.tsx`).
- Sound effects are synthesised with Web Audio, so there are no audio files.

```
src/
  app/                  layout, global styles and design tokens
  content/strategy.ts   every word on the page
  content/media.ts      footage slots
  components/
    film/               scroll-scrubbed background film and the character shot
    machine/            the 3D worlds (three.js), the character builder and their painted content
    chrome/             top bar, index menu, cursor, phase rail, intro slate, ignite transition
    sections/           the acts, in order
    ui/                 reveals, footage slots, placeholder reels
public/assets/
  video/ images/ icons/ fonts/
```

Respects `prefers-reduced-motion` (no smooth scrolling, intro skipped, flicker and grain still).

`portfolio-recreation/` holds an earlier, unrelated single-file page and is not part of this site.
