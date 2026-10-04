# Footage slots

Drop BuzzLab footage here, then point the matching slot in `src/content/media.ts` at it
(set `src` to e.g. `"/assets/video/spark-01-intro.mp4"`). Until a slot has a `src`, the site shows a
designed animated placeholder in its place.

| Slot | Suggested file | Shape | What to shoot |
|---|---|---|---|
| `film` (background) | `film.mp4` | 16:9, 60–90 s | One continuous piece: dead feed → camera powers on → edit timeline → then one man in profile, right of frame, low-key: a lighter sparked, it catches, he lights a cigarette, smokes it down, drops it and steps on it. Dark and minimal; text sits on top. |
| `spark-01` | `spark-01-intro.mp4` | 9:16 loop | The BuzzLab Intro: cameras, editors, shoots, chaos, final output. |
| `spark-02` | `spark-02-meet-the-people.mp4` | 9:16 loop | Team members framed as characters with title cards. |
| `spark-03` | `spark-03-how-its-made.mp4` | 9:16 loop | One project: idea → shoot → edit → final. |
| `spark-04` | `spark-04-brain.mp4` | 9:16 loop | AI, VFX, camera tricks, motion graphics. |
| `spark-05` | `spark-05-after-dark.mp4` | 9:16 loop | Late-night edits, failed takes, shoot-day chaos. |
| `flame-01` … `flame-05` | `flame-0X-*.mp4` | 4:5 loop | Title-card loops for the five recurring series. |

## Encoding

Use H.264 MP4 (plays in Chrome, Safari, Edge and Firefox). Keep loops short and muted.

**Background film:** it is scrubbed by scrolling, so it needs frequent keyframes or seeking stutters:

```bash
ffmpeg -i source.mov -vf "scale=1920:-2" -c:v libx264 -preset slow -crf 23 \
  -g 6 -keyint_min 6 -an -movflags +faststart -pix_fmt yuv420p film.mp4
```

**Reels / title cards:**

```bash
ffmpeg -i source.mov -vf "scale=720:-2" -c:v libx264 -preset slow -crf 26 \
  -an -movflags +faststart -pix_fmt yuv420p spark-01-intro.mp4
```

Optional poster stills go in `/public/assets/images/` and are set with `poster` in the same slot.
