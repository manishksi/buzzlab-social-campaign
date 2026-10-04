"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";

type Props = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  /** lines: editorial paragraphs · chars: big display words */
  by?: "lines" | "chars" | "words";
  delay?: number;
  start?: string;
  id?: string;
};

/** Masked text reveal on scroll. Re-splits itself when fonts load or the viewport changes. */
export function Reveal({ as: Tag = "div", children, className, by = "lines", delay = 0, start = "top 86%", id }: Props) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const type = by === "chars" ? "chars,lines" : by === "words" ? "words,lines" : "lines";
      SplitText.create(el, {
        type,
        mask: "lines",
        linesClass: "split-mask-line",
        autoSplit: true,
        onSplit(self) {
          const targets = by === "chars" ? self.chars : by === "words" ? self.words : self.lines;
          return gsap.from(targets, {
            yPercent: 110,
            rotate: by === "chars" ? 4 : 0,
            duration: by === "lines" ? 1.1 : 0.9,
            ease: "expo.out",
            stagger: by === "chars" ? 0.018 : by === "words" ? 0.03 : 0.09,
            delay,
            scrollTrigger: { trigger: el, start, once: true },
          });
        },
      });
    },
    { scope: ref },
  );
  return (
    <Tag ref={ref} className={className} id={id}>
      {children}
    </Tag>
  );
}
