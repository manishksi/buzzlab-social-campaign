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
import { Engine } from "./sections/Engine";
import { LighterSelector } from "./sections/LighterSelector";
import { Spark } from "./sections/Spark";
import { Flame } from "./sections/Flame";
import { Light } from "./sections/Light";
import { Pipeline } from "./sections/Pipeline";
import { Finale } from "./sections/Finale";

/**
 * The whole presentation is one page: a fixed scroll-scrubbed film at the back,
 * ten acts scrolling over it, and a thin layer of chrome on top.
 */
export function Experience() {
  return (
    <SmoothScroll>
      <ScrollFilm />
      <Atmosphere />
      <TopBar />
      <PhaseRail />
      <main className="relative">
        <Hero />
        <WhereWeAre />
        <Objective />
        <Engine />
        <LighterSelector />
        <Spark />
        <Flame />
        <Light />
        <Pipeline />
        <Finale />
      </main>
      <IgniteOverlay />
      <MenuOverlay />
      <IntroSlate />
      <Cursor />
    </SmoothScroll>
  );
}
