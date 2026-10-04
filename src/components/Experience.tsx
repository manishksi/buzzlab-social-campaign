"use client";

import { SmoothScroll } from "./chrome/SmoothScroll";
import { ScrollFilm } from "./film/ScrollFilm";
import { Atmosphere } from "./chrome/Atmosphere";
import { TopBar } from "./chrome/TopBar";
import { MenuOverlay } from "./chrome/MenuOverlay";
import { Cursor } from "./chrome/Cursor";
import { PhaseRail } from "./chrome/PhaseRail";
import { IntroSlate } from "./chrome/IntroSlate";
import { IgniteOverlay } from "./chrome/IgniteOverlay";
import { Hero } from "./sections/Hero";
import { WhereWeAre } from "./sections/WhereWeAre";
import { Objective } from "./sections/Objective";
import { Workstation } from "./sections/Workstation";
import { Studio } from "./sections/Studio";
import { LighterSelector } from "./sections/LighterSelector";
import { Spark } from "./sections/Spark";
import { Flame } from "./sections/Flame";
import { Light } from "./sections/Light";
import { Machine } from "./sections/Machine";
import { OriginalIP } from "./sections/OriginalIP";
import { Pipeline } from "./sections/Pipeline";
import { ProductionSet } from "./sections/ProductionSet";
import { Tanishka } from "./sections/Tanishka";
import { WorldFilm } from "./machine/WorldFilm";

/**
 * The whole presentation is one page: a fixed scroll-scrubbed film at the back,
 * the acts scrolling over it, a WebGL layer for the 3D worlds, and a thin layer of chrome on top.
 * The end loops back to the beginning.
 */
export function Experience() {
  return (
    <SmoothScroll>
      <ScrollFilm />
      <WorldFilm />
      <Atmosphere />
      <TopBar />
      <PhaseRail />
      <main className="relative">
        <Hero />
        <WhereWeAre />
        <Objective />
        <Workstation />
        <Studio />
        <LighterSelector />
        <Spark />
        <Flame />
        <Light />
        <Machine />
        <OriginalIP />
        <Pipeline />
        <ProductionSet />
        <Tanishka />
      </main>
      <IgniteOverlay />
      {/* the black the loop hides behind while it goes back to the top */}
      <div id="loop-veil" aria-hidden className="pointer-events-none fixed inset-0 z-[95] bg-ink opacity-0" />
      <MenuOverlay />
      <IntroSlate />
      <Cursor />
    </SmoothScroll>
  );
}
