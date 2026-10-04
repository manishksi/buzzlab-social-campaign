"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { meta, whereWeAre as W } from "@/content/strategy";
import { Reveal } from "@/components/ui/Reveal";
import { Scramble } from "@/components/ui/Scramble";

function Glyph({ kind }: { kind: string }) {
  const common = { width: 64, height: 20, viewBox: "0 0 64 20", fill: "none", stroke: "currentColor", strokeWidth: 1.4 } as const;
  switch (kind) {
    case "flat":
      return (
        <svg {...common} aria-hidden>
          <path d="M0 12 H22 L25 8 L28 14 L31 12 H64" />
        </svg>
      );
    case "gaps":
      return (
        <svg {...common} aria-hidden>
          <path d="M0 10 H6 M14 10 H17 M30 10 H40 M55 10 H58" />
        </svg>
      );
    case "blur":
      return (
        <svg {...common} aria-hidden>
          <circle cx="32" cy="10" r="7" strokeDasharray="2 3" />
          <circle cx="32" cy="10" r="3" opacity=".4" />
        </svg>
      );
    case "down":
      return (
        <svg {...common} aria-hidden>
          <path d="M0 4 L14 6 L26 5 L38 10 L50 13 L64 17" />
          <path d="M58 17 H64 V11" />
        </svg>
      );
    default:
      return (
        <svg {...common} aria-hidden>
          <path d="M0 10 H64" strokeDasharray="1 4" />
        </svg>
      );
  }
}

/** ACT 01 — the honest diagnosis, and the question that turns it around. */
export function WhereWeAre() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      gsap.from("[data-row]", {
        autoAlpha: 0,
        x: -30,
        stagger: 0.08,
        duration: 0.9,
        ease: "expo.out",
        scrollTrigger: { trigger: "[data-rows]", start: "top 82%", once: true },
      });
      // the phone drifts against the scroll
      gsap.fromTo("[data-phone]", { yPercent: 12, rotate: -4 }, { yPercent: -10, rotate: 3, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
      gsap.from("[data-post]", {
        autoAlpha: 0,
        scale: 0.9,
        stagger: { each: 0.06, from: "random" },
        duration: 0.6,
        scrollTrigger: { trigger: "[data-phone]", start: "top 80%", once: true },
      });
      // the strike through "notice board"
      gsap.fromTo("[data-strike]", { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: "[data-question]", start: "top 60%", end: "top 20%", scrub: true } });
      gsap.fromTo("[data-question] [data-word]", { autoAlpha: 0.15 }, { autoAlpha: 1, stagger: 0.05, ease: "none", scrollTrigger: { trigger: "[data-question]", start: "top 85%", end: "top 45%", scrub: true } });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="problem" className="relative z-10 pb-[20vh] pt-[22vh]">
      <div className="gutter mx-auto grid max-w-[1600px] gap-16 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-7">
          <p className="t-slate mb-6">{W.eyebrow}</p>
          <Reveal as="h2" by="chars" className="t-huge">
            {W.title}
          </Reveal>
          <Reveal as="p" className="t-lede mt-8">
            {W.intro}
          </Reveal>

          <dl data-rows className="mt-14 border-t hairline">
            {W.diagnostics.map((d, i) => (
              <div data-row key={d.label} className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-4 border-b hairline py-4 md:grid-cols-[10rem_1fr_auto] md:py-5">
                <dt className="t-label text-ash">{d.label}</dt>
                <dd className={`font-display text-[clamp(1.6rem,3.2vw,2.8rem)] font-extrabold uppercase leading-none ${i >= 3 ? "text-ember" : ""}`}>
                  <Scramble text={d.status} delay={i * 0.08} />
                </dd>
                <dd className={`${i >= 3 ? "text-ember" : "text-ash"}`}>
                  <Glyph kind={d.glyph} />
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex items-center justify-center lg:col-span-5">
          <figure className="w-full max-w-[340px]">
            <div data-phone className="relative rounded-[2.2rem] border border-bone/15 bg-char/90 p-3 shadow-[0_40px_120px_-20px_rgba(0,0,0,.8)]">
              <div className="rounded-[1.6rem] bg-ink p-4">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-bone/20 font-display text-lg font-extrabold">BL</div>
                  <div className="min-w-0">
                    <div className="truncate font-mono text-xs text-bone/80">{meta.handle.replace("@", "")}</div>
                    <div className="mt-1 h-1.5 w-28 bg-bone/10" />
                    <div className="mt-1 h-1.5 w-16 bg-bone/10" />
                  </div>
                </div>
                <div className="mb-3 flex justify-between font-mono text-[0.6rem] uppercase tracking-widest text-ash">
                  <span>Posts</span>
                  <span>Followers</span>
                  <span>Following</span>
                </div>
                <div className="grid grid-cols-3 gap-[3px]">
                  {W.gridPosts.map((p, i) => (
                    <div
                      data-post
                      key={i}
                      className={`relative flex aspect-square items-center justify-center overflow-hidden text-center ${
                        p.kind === "empty" ? "border border-dashed border-bone/15" : "bg-[#1a1714]"
                      }`}
                    >
                      {p.kind === "logo" && <span className="font-display text-xl font-extrabold text-bone/35">{p.text}</span>}
                      {(p.kind === "notice" || p.kind === "event" || p.kind === "repost") && (
                        <span className="px-1 font-mono text-[0.55rem] uppercase leading-tight tracking-wider text-bone/40">{p.text}</span>
                      )}
                      {p.kind === "quote" && <span className="px-1 font-serif text-[0.7rem] italic text-bone/40">{p.text}</span>}
                      {p.age && <span className="absolute bottom-1 right-1 font-mono text-[0.5rem] text-bone/30">{p.age}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <figcaption className="t-slate mt-5 text-center">{W.gridNote}</figcaption>
          </figure>
        </div>
      </div>

      <div data-question className="gutter mx-auto mt-[22vh] max-w-[1600px]">
        <p className="t-big balance max-w-[18ch]">
          {W.question[0].split(" ").map((w, i) => (
            <span data-word key={i} className="inline-block pr-[0.22em]">
              {w}
            </span>
          ))}
          <span data-word className="t-serif relative inline-block whitespace-nowrap text-ember">
            {W.question[1]}
            <span data-strike className="absolute left-0 right-0 top-[54%] h-[0.07em] origin-left bg-bone" aria-hidden />
          </span>
          <span data-word className="inline-block">{W.question[2]}</span>
        </p>
      </div>
    </section>
  );
}
