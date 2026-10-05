/**
 * All presentation copy lives here.
 * Edit words, phases, formats and numbers in this file; components only render it.
 */

export const meta = {
  brand: "BuzzLab",
  handle: "@buzzlab.global",
  instagramUrl: "https://www.instagram.com/buzzlab.global/",
  title: "BuzzLab — Light It Up",
  kicker: "Instagram strategy · 6 months + the road to IP",
  year: "2026",
};

/** Top-level acts. `id` is the DOM anchor; `film` is where the background film sits when the act's top reaches the top of the screen. */
export const acts = [
  { id: "top", act: "00", label: "Cold open", film: 0 },
  { id: "problem", act: "01", label: "Where we are", film: 0.32 },
  { id: "system", act: "02", label: "Worth noticing", film: 0.36 },
  { id: "engine", act: "03", label: "The studio", film: 0.4 },
  { id: "phases", act: "04", label: "The plan", film: 0.46 },
  { id: "spark", act: "04", label: "Phase 01 — Spark", film: 0.5 },
  { id: "flame", act: "05", label: "Phase 02 — Flame", film: 0.6 },
  { id: "light", act: "06", label: "Phase 03 — Light", film: 0.76 },
  { id: "machine", act: "07", label: "Original BuzzLab IP", film: 1.12 },
  { id: "pipeline", act: "08", label: "The pipeline", film: 1.16 },
  { id: "set", act: "09", label: "The set", film: 1.18 },
  { id: "tanishka", act: "??", label: "Not in the deck", film: 1.2 },
] as const;

/** The index menu (kept short on purpose; the lighter is the main navigation). */
export const menu = [
  { label: "BuzzLab", target: "top", note: "Cold open" },
  { label: "The problem", target: "problem", note: "Where the page is today" },
  { label: "Worth noticing", target: "system", note: "The objective, and the editor" },
  { label: "The studio", target: "engine", note: "Editing → creative → production" },
  { label: "Spark", target: "spark", note: "2 months" },
  { label: "Flame", target: "flame", note: "4 months" },
  { label: "Light", target: "light", note: "6 months" },
  { label: "Original IP", target: "machine", note: "The people behind it" },
  { label: "The pipeline", target: "pipeline", note: "Post, measure, learn, improve" },
  { label: "The people", target: "set", note: "Every person can become the IP" },
];

export const hero = {
  slate: ["BuzzLab", "Instagram strategy", "Take 01"],
  lines: ["The page is dead.", "Not the creative.", "The system."],
  thesis: ["BuzzLab doesn't have a creative problem.", "It has a content system problem."],
  scrollCue: "Scroll to roll the film",
};

export const whereWeAre = {
  eyebrow: "Act 01",
  title: "Where we are",
  intro:
    "The talent is here. The work is good. The feed just doesn't show it, because nothing makes it happen on a schedule.",
  diagnostics: [
    { label: "Content", status: "Unpredictable", glyph: "flat" },
    { label: "Posting", status: "Inconsistent", glyph: "gaps" },
    { label: "Identity", status: "Unclear", glyph: "blur" },
    { label: "Reach", status: "↓", glyph: "down" },
    { label: "Engagement", status: "↓", glyph: "down" },
    { label: "Audience", status: "?", glyph: "unknown" },
  ],
  /** The real profile, as it stands. Only what is visible in the screenshot is described. */
  profile: {
    src: "/assets/images/buzzlab-instagram.jpg",
    width: 738,
    height: 1600,
    alt: "Screenshot of the buzzlab.global Instagram profile: 90 posts, 1,139 followers, 15 following. Bio: Content Scientist. Trusted by Supermoney by Flipkart, Wakefit, Practo, Acko, Stable money, Snitch, Snabbit etc. www.buzzlab.in",
    slate: "@buzzlab.global · Instagram",
    caption: "This is where BuzzLab is right now.",
  },
  question: ["So what happens if we stop treating Instagram like a", "notice board", "?"],
};

export const objective = {
  eyebrow: "Act 02 — Worth noticing",
  /** MAKE / BUZZLAB / WORTH / NOTICING. — one word at a time, the last one carries the weight. */
  statement: ["Make", "BuzzLab", "worth", "noticing."],
  /** what that sentence sets off */
  chain: ["Content", "Formats", "Identity", "Original IP"],
};

/** ACT 02 → 03: the editor at his desk, then the room keeps going (machine/studio.ts). */
export const studio = {
  act2: {
    eyebrow: "Act 02 — Worth noticing",
    title: ["The page isn't just inactive.", "It's invisible."],
    sub: "We don't need more content. We need something people actually want to notice.",
  },
  act3: {
    eyebrow: "Act 03 — The studio",
    ladder: ["Editing", "Creative", "Production"],
    title: ["Content doesn't mean", "posting more."],
    titleB: ["Attention follows", "quality, not quantity."],
    /** 4 layers, 1 engine */
    layers: [
      { n: "01", name: "Content", job: "What we make." },
      { n: "02", name: "Formats", job: "How we package it." },
      { n: "03", name: "Identity", job: "What makes it recognisable." },
      { n: "04", name: "IP", job: "What makes people come back." },
    ],
  },
};

export type PhaseKey = "spark" | "flame" | "light";

export const phases: {
  key: PhaseKey;
  n: string;
  name: string;
  months: string;
  duration: string;
  objective: string;
  preview: string[];
  heat: number;
}[] = [
  {
    key: "spark",
    n: "01",
    name: "Spark",
    months: "Month 01–02",
    duration: "2 months",
    objective: "Establish BuzzLab's presence.",
    preview: ["5 videos", "8 weeks", "Prove people want to watch"],
    heat: 0.35,
  },
  {
    key: "flame",
    n: "02",
    name: "Flame",
    months: "Month 03–06",
    duration: "4 months",
    objective: "Move from random content to recurring formats.",
    preview: ["5 recurring series", "Give people a reason to return", "Content → Formats"],
    heat: 0.68,
  },
  {
    key: "light",
    n: "03",
    name: "Light",
    months: "Month 07–12",
    duration: "6 months",
    objective: "Build original BuzzLab IP.",
    preview: ["Something only BuzzLab owns", "Chosen by what the audience returns to", "Formats → IP"],
    heat: 1,
  },
];

export const lighterSection = {
  eyebrow: "Act 04",
  title: ["The plan"],
  sub: "Six months of committed work, and the horizon it opens up. Hover a phase to watch it play out, click to go there.",
  hint: "Hover · click to go there",
};

export const spark = {
  n: "01",
  name: "Spark",
  months: "Month 01–02",
  objective: "Establish BuzzLab's presence.",
  line: "The first 8 weeks prove one thing: BuzzLab can consistently make content people want to watch.",
  /** 5 videos · 8 weeks */
  count: ["5 videos.", "8 weeks."],
  /** the five Phase 01 videos (the real clips are in content/media.ts, spark-01 … spark-05) */
  pieces: [
    { week: "Week 01", slot: "spark-01", title: "Police or politician?", format: "Hook / idea", objective: "Stop the scroll", reel: "intro" },
    { week: "Week 03", slot: "spark-02", title: "The creative mind", format: "People / story", objective: "Connection", reel: "cast" },
    { week: "Week 05", slot: "spark-03", title: "Out of the screen", format: "VFX / craft", objective: "Shares", reel: "process" },
    { week: "Week 07", slot: "spark-04", title: "Creative block", format: "Shot on iPhone", objective: "Saves", reel: "brain" },
    { week: "Week 08", slot: "spark-05", title: "You've got three seconds", format: "Studio / POV", objective: "Reach", reel: "afterdark" },
  ],
};

export const flame = {
  n: "02",
  name: "Flame",
  months: "Month 03–06",
  objective: "Move from random content to recurring formats.",
  quote: ["People don't just follow brands.", "They follow things they recognise and want to return to."],
  /** the lineup: five content formats (hover each one for its scene) */
  series: [
    {
      n: "01",
      kind: "skits",
      title: "Skits",
      tag: "Scripted comedy",
      logline: "Short, scripted, character-led. The agency life everyone recognises, played for laughs.",
      episodes: ["The client who wants the logo bigger", "The editor's 3 a.m. export", "“One more take”"],
    },
    {
      n: "02",
      kind: "vlogs",
      title: "Vlogs",
      tag: "Handheld · BTS",
      logline: "Handheld, behind the scenes, in the room. A shoot day, an edit night, the people in between.",
      episodes: ["A shoot day, start to wrap", "Inside the edit bay", "The week of a big launch"],
    },
    {
      n: "03",
      kind: "talking",
      title: "Talking head",
      tag: "Direct to camera",
      logline: "One person, straight to camera, one sharp point of view. Expertise people can save and share.",
      episodes: ["Why most hooks fail", "What we'd change about this ad", "The edit rule we never break"],
    },
    {
      n: "04",
      kind: "podcast",
      title: "Podcast",
      tag: "Conversation",
      logline: "Two mics, a real conversation about the work. Long form, cut into the moments worth clipping.",
      episodes: ["Founders on the first big client", "Director vs. editor: whose cut?", "What creative really costs"],
    },
    {
      n: "05",
      kind: "pov",
      title: "POV",
      tag: "First person",
      logline: "You are on set, behind the camera, in the edit. The work, seen through the eyes of the person doing it.",
      episodes: ["POV: you're the DOP on a car shoot", "POV: your first day at BuzzLab", "POV: the cut that saved the film"],
    },
  ],
  shift: { from: "Content", to: "Formats", note: "A random post starts from zero every time. A format compounds: every episode makes the next one easier to recognise." },
};

export const light = {
  n: "03",
  name: "Light",
  months: "Month 07–12",
  objective: "Build original BuzzLab IP.",
  notLockedLede: "The system now starts creating its own identity.",
  howWeChoose: [
    { phase: "Phase 01", learn: "shows us what people will watch." },
    { phase: "Phase 02", learn: "shows us what people come back for." },
    { phase: "Phase 03", learn: "turns the strongest of those into a world BuzzLab owns." },
  ],
  evolution: [
    { phase: "Phase 01", word: "Content" },
    { phase: "Phase 02", word: "Formats" },
    { phase: "Phase 03", word: "IP" },
  ],
};

/**
 * The creative machine: after the cigarette goes out, a yellow dot becomes a play button, the
 * footage is shot and edited into one Reel, the Reel is posted, and the phone becomes the BuzzLab
 * page it could be. Each stage is a caption over its shot.
 */
export const machine = {
  eyebrow: "Act 07 — Original BuzzLab IP",
  /** one short line per shot of the machine (machine time); the ladder word sits above it */
  shots: [
    { at: 0.1, rung: 0, line: "One idea. One click." },
    { at: 0.22, rung: 1, line: "Then a camera. Then a crew." },
    { at: 0.4, rung: 1, line: "Then the edit finds it." },
    { at: 0.548, rung: 1, line: "One finished Reel." },
    { at: 0.578, rung: 2, line: "Posted." },
    // the page speaks for itself
    { at: 0.668, rung: 2, line: "" },
    { at: 0.756, rung: 2, line: "The post people stop for." },
  ],
  shotsEnd: 0.8,
  ladder: ["Content", "Creative", "Media", "IP"],
};

/** ORIGINAL BUZZLAB IP — the reveal that closes the machine. */
export const ip = {
  eyebrow: "Act 07 — Original BuzzLab IP",
  reveal: ["Original", "BuzzLab IP"],
  /** the people behind the IP engine */
  teamLabel: "The people behind it",
  team: ["Founder", "Director", "Producer", "DOP", "Strategist", "Editors", "Interns"],
};

export const pipeline = {
  eyebrow: "Act 08 — The pipeline",
  title: "The pipeline",
  sub: "The problem isn't only generating ideas. The system has to keep moving every single week.",
  stages: [
    { name: "Idea", does: "A concept forms", note: "Every idea goes into one shared bank, not into someone's head." },
    { name: "Script", does: "It becomes a story", note: "Hook, beats and ending on one page." },
    { name: "Pre-production", does: "It gets planned", note: "Shot list, cast, location, props. Booked, not hoped for." },
    { name: "Shoot", does: "It becomes footage", note: "Batch days: one shoot, several pieces." },
    { name: "Edit", does: "It becomes content", note: "Cut the first two seconds first." },
    { name: "Approval", does: "It gets reviewed", note: "One reviewer, one round, a fixed turnaround." },
    { name: "Post", does: "It goes out", note: "Scheduled into the weekly rhythm." },
    { name: "Analyse", does: "It gets measured", note: "A 48-hour and a 7-day check on every piece." },
    { name: "Iterate", does: "It becomes the next idea", note: "What worked gets a sequel. What didn't gets a fix." },
  ],
  loop: ["Post", "Measure", "Learn", "Improve", "New idea", "Post again"],
  line: ["We don't just make content.", "We learn from it.", "Then make it better."],
};

/** No follower promises: what we read on every piece, and what each number asks. */
export const measure = {
  title: ["We don't just post.", "We measure. We learn. We iterate."],
  metrics: [
    { name: "Reach", asks: "Did new people see it?" },
    { name: "3-second views", asks: "Did the hook work?" },
    { name: "Avg. watch time", asks: "How long did they stay?" },
    { name: "Completion rate", asks: "Did they reach the end?" },
    { name: "Shares", asks: "Was it worth passing on?" },
    { name: "Saves", asks: "Will they come back to it?" },
    { name: "Profile visits", asks: "Did they want to know who made it?" },
    { name: "Followers gained", asks: "Did they decide to stay?" },
  ],
  cadence: "48-hour check · 7-day review · monthly deep dive",
};

/** ACT 09 — the people are the IP: everyone in the studio, in the order the camera meets them, and the series each of them could carry. */
export const set = {
  eyebrow: "Act 09 — BuzzLab IP",
  title: ["The people are the IP.", "Every one of them is a series."],
  roles: [
    { key: "founder01", role: "Founder 01", does: "Founder POVs, business stories, lessons and the reality behind building BuzzLab." },
    { key: "founder02", role: "Founder 02", does: "Founder conversations, culture, decisions and the stories behind the work." },
    { key: "director", role: "Director", does: "Creative breakdowns, directing stories, visual decisions, behind-the-scenes filmmaking." },
    { key: "producer", role: "Producer", does: "Production stories, impossible deadlines, shoot days, how ideas become real." },
    { key: "dop", role: "DOP", does: "Camera craft, lighting, lenses, visual breakdowns and filmmaking experiments." },
    { key: "strategist", role: "Strategist", does: "Campaign thinking, audience insights and why ideas work." },
    { key: "editors", role: "Editors", does: "Edit breakdowns, before-and-afters, timelines, VFX and post." },
    { key: "interns", role: "Interns", does: "First projects, learning curves, experiments, the next generation of creatives." },
  ],
  /** People → Personality → Formats → Original IP */
  chain: ["People", "Personality", "Formats"],
  final: "Original IP.",
};

/** The last character. Tanishka stares, opens wide, and eats the whole presentation. */
export const tanishka = {
  name: "Tanishka",
};
