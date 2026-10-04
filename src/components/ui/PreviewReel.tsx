"use client";

import "./reels.css";

export type ReelKind = "intro" | "cast" | "process" | "brain" | "afterdark" | "portrait" | "grid" | "timer" | "versus" | "doc";

/**
 * Designed placeholders for footage that hasn't been shot yet. Each kind sketches what the real
 * clip will show, so the founders can read the idea before the footage exists.
 */
export function PreviewReel({ kind, playing, title }: { kind: ReelKind; playing: boolean; title: string }) {
  return (
    <div className={`reel reel--${kind} ${playing ? "is-playing" : ""}`} aria-hidden>
      {kind === "intro" && <Intro />}
      {kind === "cast" && <Cast />}
      {kind === "process" && <Process />}
      {kind === "brain" && <Brain />}
      {kind === "afterdark" && <AfterDark />}
      {kind === "portrait" && <Portrait title={title} />}
      {kind === "grid" && <GridCard title={title} />}
      {kind === "timer" && <Timer title={title} />}
      {kind === "versus" && <Versus title={title} />}
      {kind === "doc" && <Doc title={title} />}
      <div className="reel__scan" />
    </div>
  );
}

function Intro() {
  return (
    <div className="cuts">
      <div className="cut cut--1">
        <div className="vf" />
        <span className="rec">● REC</span>
        <span className="big">Action</span>
      </div>
      <div className="cut cut--2">
        {Array.from({ length: 5 }).map((_, i) => (
          <i key={i} style={{ top: `${18 + i * 14}%`, left: `${8 + ((i * 17) % 30)}%`, width: `${40 + ((i * 23) % 40)}%` }} />
        ))}
        <b />
      </div>
      <div className="cut cut--3">
        <div className="spot" />
        <div className="who" />
      </div>
      <div className="cut cut--4" />
      <div className="cut cut--5">
        <span className="stack">Buzz<br />Lab</span>
      </div>
      <div className="cut cut--6">
        <span className="serif">losing their minds</span>
      </div>
    </div>
  );
}

const CAST = ["The Director", "The Editor", "The “one more take” guy", "The Camera Guy", "The Designer"];
function Cast() {
  return (
    <div className="cast">
      {CAST.map((c, i) => (
        <div key={c} className="cast__card" style={{ animationDelay: `${-(6 - i * 1.2)}s` }}>
          <div className="cast__fig" data-variant={i} />
          <span className="cast__no">0{i + 1}</span>
          <span className="cast__name">{c}</span>
        </div>
      ))}
    </div>
  );
}

function Process() {
  const steps = ["Idea", "Shoot", "Edit", "Final"];
  return (
    <div className="proc">
      {steps.map((s, i) => (
        <div key={s} className={`proc__frame proc__frame--${i}`}>
          <div className="proc__art" />
          <span className="proc__label">{s}</span>
        </div>
      ))}
      <div className="proc__bar">
        <i />
      </div>
    </div>
  );
}

function Brain() {
  return (
    <div className="brain">
      <div className="brain__blob" />
      <div className="brain__grid" />
      <span className="brain__q">Too much<br />freedom?</span>
      <span className="brain__q brain__q--r">Too much<br />freedom?</span>
      <span className="brain__q brain__q--b">Too much<br />freedom?</span>
    </div>
  );
}

function AfterDark() {
  return (
    <div className="night">
      <div className="night__screen" />
      <div className="night__desk" />
      <span className="night__clock">02:47</span>
      <span className="night__take">Take 37</span>
    </div>
  );
}

function Portrait({ title }: { title: string }) {
  return (
    <div className="tc tc--portrait">
      <div className="tc__spot" />
      <div className="tc__fig" />
      <span className="tc__title serif">{title}</span>
    </div>
  );
}

function GridCard({ title }: { title: string }) {
  return (
    <div className="tc tc--grid">
      <div className="tc__frames">
        {Array.from({ length: 9 }).map((_, i) => (
          <i key={i} />
        ))}
      </div>
      <div className="tc__mark" />
      <span className="tc__title">{title}</span>
    </div>
  );
}

function Timer({ title }: { title: string }) {
  return (
    <div className="tc tc--timer">
      <div className="tc__ring" />
      <span className="tc__clock">60:00</span>
      <span className="tc__title">{title}</span>
    </div>
  );
}

function Versus({ title }: { title: string }) {
  return (
    <div className="tc tc--versus">
      <div className="tc__half tc__half--a">A</div>
      <div className="tc__half tc__half--b">B</div>
      <span className="tc__vs serif">vs</span>
      <span className="tc__title">{title}</span>
    </div>
  );
}

function Doc({ title }: { title: string }) {
  return (
    <div className="tc tc--doc">
      <div className="tc__paper">
        {Array.from({ length: 7 }).map((_, i) => (
          <i key={i} style={{ width: `${55 + ((i * 29) % 40)}%` }} />
        ))}
      </div>
      <div className="tc__film" />
      <span className="tc__title">{title}</span>
    </div>
  );
}
