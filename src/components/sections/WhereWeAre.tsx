"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { whereWeAre as W } from "@/content/strategy";
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
      // the real profile: starts small and far off in the dark, comes forward to be read, then drifts on
      const wrap = el.querySelector("[data-profile-wrap]");
      gsap
        .timeline({ scrollTrigger: { trigger: wrap, start: "top bottom", end: "center 52%", scrub: 0.6 } })
        .fromTo(
          "[data-profile]",
          { scale: 0.58, rotateX: 16, rotateY: -24, yPercent: 16, autoAlpha: 0.2, filter: "blur(4px) brightness(0.45)" },
          { scale: 1, rotateX: 4, rotateY: -7, yPercent: 0, autoAlpha: 1, filter: "blur(0px) brightness(1)", ease: "power1.out" },
        )
        .fromTo("[data-profile-glow]", { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, ease: "none" }, 0);
      gsap.fromTo("[data-profile]", { rotateY: -7, rotateX: 4, yPercent: 0 }, { rotateY: 3, rotateX: -2, yPercent: -7, ease: "none", immediateRender: false, scrollTrigger: { trigger: wrap, start: "center 52%", end: "bottom top", scrub: 0.6 } });
      // soft light sliding across the glass
      gsap.fromTo("[data-sheen]", { xPercent: -70 }, { xPercent: 70, ease: "none", scrollTrigger: { trigger: wrap, start: "top bottom", end: "bottom top", scrub: true } });
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

        <div className="flex items-center justify-center lg:col-span-5" style={{ perspective: "1600px" }}>
          <figure data-profile-wrap className="relative w-full max-w-[300px] md:max-w-[340px]">
            <div
              aria-hidden
              data-profile-glow
              className="pointer-events-none absolute -inset-[35%] -z-10"
              style={{ background: "radial-gradient(closest-side, rgba(239,232,222,.09), rgba(239,232,222,.03) 55%, transparent)" }}
            />
            <div
              data-profile
              className="relative overflow-hidden rounded-[2.1rem] border border-bone/12 bg-black p-[6px] shadow-[0_50px_140px_-30px_rgba(0,0,0,.95),0_0_0_1px_rgba(0,0,0,.6)] will-change-transform"
            >
              <div className="relative overflow-hidden rounded-[1.7rem]">
                {/* the actual screenshot, shown as-is (static export, so a plain img) */}
                <img
                  src={W.profile.src}
                  alt={W.profile.alt}
                  width={W.profile.width}
                  height={W.profile.height}
                  draggable={false}
                  decoding="async"
                  className="block h-auto w-full select-none"
                />
                {/* soft light across the glass, a little falloff at the edges, a breath of grain */}
                <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
                  <div data-sheen className="absolute inset-y-0 -left-1/2 w-[200%]" style={{ background: "linear-gradient(105deg, transparent 38%, rgba(255,236,214,.11) 48%, transparent 58%)" }} />
                </div>
                <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(130% 90% at 50% 38%, transparent 58%, rgba(0,0,0,.42))" }} />
                <div aria-hidden className="profile-grain pointer-events-none absolute inset-0" />
              </div>
            </div>
            <figcaption className="mt-7 text-center">
              <span className="t-slate block">{W.profile.slate}</span>
              <span className="mt-2 block font-display text-[clamp(1.35rem,2vw,1.9rem)] font-bold uppercase leading-tight">{W.profile.caption}</span>
            </figcaption>
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
