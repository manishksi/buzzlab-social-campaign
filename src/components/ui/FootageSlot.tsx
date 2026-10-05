"use client";

import { useEffect, useRef } from "react";
import { slots, SHOW_SLOT_LABELS } from "@/content/media";
import { PreviewReel, type ReelKind } from "./PreviewReel";

/**
 * A footage slot: plays the real clip from content/media.ts when one is set,
 * otherwise an animated placeholder designed for that concept.
 */
export function FootageSlot({ slot, kind, playing, title }: { slot: string; kind: ReelKind; playing: boolean; title: string }) {
  const media = slots[slot];
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (playing) void v.play().catch(() => {});
    else v.pause();
  }, [playing]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-char">
      {media?.src ? (
        media.fit === "contain" ? (
          <>
            {/* a landscape clip in a vertical frame: letterboxed over a blurred, darkened fill */}
            {media.poster && <img src={media.poster} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-125 object-cover opacity-60 blur-xl" />}
            <video ref={video} className="relative h-full w-full object-contain" src={media.src} poster={media.poster ?? undefined} muted loop playsInline preload="metadata" />
          </>
        ) : (
          <video ref={video} className="h-full w-full object-cover" src={media.src} poster={media.poster ?? undefined} muted loop playsInline preload="metadata" />
        )
      ) : (
        <PreviewReel kind={kind} playing={playing} title={title} />
      )}
      {!media?.src && SHOW_SLOT_LABELS && (
        <span className="t-slate absolute left-2 top-2 z-10 border border-bone/20 bg-ink/70 px-1.5 py-0.5 text-[0.58rem] text-bone/60" title={media?.brief}>
          Footage slot · {slot}
        </span>
      )}
    </div>
  );
}
