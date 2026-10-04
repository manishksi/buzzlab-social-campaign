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
  { id: "system", act: "02", label: "The objective", film: 0.36 },
  { id: "engine", act: "03", label: "The content engine", film: 0.4 },
  { id: "phases", act: "04", label: "The plan", film: 0.46 },
  { id: "spark", act: "05", label: "Phase 01 — Spark", film: 0.5 },
  { id: "flame", act: "06", label: "Phase 02 — Flame", film: 0.6 },
  { id: "light", act: "07", label: "Phase 03 — Light", film: 0.76 },
  { id: "machine", act: "08", label: "The creative machine", film: 1.12 },
  { id: "ip", act: "09", label: "Original BuzzLab IP", film: 1.16 },
  { id: "landy", act: "??", label: "Not in the deck", film: 1.2 },
] as const;

/** The index menu (kept short on purpose; the lighter is the main navigation). */
export const menu = [
  { label: "BuzzLab", target: "top", note: "Cold open" },
  { label: "The problem", target: "problem", note: "Where the page is today" },
  { label: "The system", target: "system", note: "Objective and content engine" },
  { label: "Spark", target: "spark", note: "Month 01–02" },
  { label: "Flame", target: "flame", note: "Month 03–06" },
  { label: "Light", target: "light", note: "Month 07–12" },
  { label: "The machine", target: "machine", note: "How the work keeps moving" },
  { label: "Original IP", target: "ip", note: "What if we made worlds?" },
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
    { label: "Content", status: "Inconsistent", glyph: "flat" },
    { label: "Posting", status: "Unpredictable", glyph: "gaps" },
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
  eyebrow: "Act 02 — The objective",
  /** MAKE / BUZZLAB / WORTH / NOTICING. — one word at a time, the last one carries the weight. */
  statement: ["Make", "BuzzLab", "worth", "noticing."],
  chain: ["Attention", "Identity", "Community", "IP"],
  explain: [
    "We are not trying to post more.",
    "We are building a recognisable media identity: a page people choose to follow, come back to, and talk about.",
  ],
};

/** ACT 02 → 03: the page looks back at you. */
export const watching = {
  caption: "Now it's noticing you.",
};

export const engine = {
  eyebrow: "Act 03",
  title: "The content engine",
  sub: "Three layers. Each one does a different job, and each one feeds the next.",
  layers: [
    {
      n: "01",
      name: "Attention",
      job: "Content designed to stop people scrolling.",
      examples: ["Strong hooks", "Trends", "Visual experiments", "Short-form entertainment", "Unexpected edits", "Creative concepts"],
    },
    {
      n: "02",
      name: "Identity",
      job: "Content that makes people understand BuzzLab.",
      examples: ["Team", "Creatives", "BTS", "Campaigns", "Office culture", "Client work", "Personality"],
    },
    {
      n: "03",
      name: "IP",
      job: "Content that makes people come back.",
      examples: ["Recurring characters", "Series", "Shows", "Original concepts", "Recurring formats", "Original BuzzLab IP"],
    },
  ],
  loop: ["Attention", "Identity", "IP", "Community"],
  loopNote: "Community brings new attention. The engine feeds itself.",
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
    objective: "Establish BuzzLab's voice.",
    preview: ["5 hero pieces", "Prove people want to watch", "Week 01 → Week 08"],
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
    duration: "The horizon",
    objective: "Build original BuzzLab IP.",
    preview: ["Something only BuzzLab owns", "Chosen by what the audience returns to", "Formats → IP"],
    heat: 1,
  },
];

export const lighterSection = {
  eyebrow: "Act 04 — The plan",
  title: ["One lighter.", "Three moments."],
  sub: "Six months of committed work, and the horizon it opens up. Hover a phase to watch it play out, click to go there.",
  hint: "Hover · click to go there",
};

export const spark = {
  n: "01",
  name: "Spark",
  months: "Month 01–02",
  objective: "Establish BuzzLab's voice.",
  line: "Prove that BuzzLab can make content people actually want to watch. Five hero pieces, one every two weeks or so, each with one job.",
  pieces: [
    {
      week: "Week 01",
      slot: "spark-01",
      title: "The BuzzLab Intro",
      length: "45–60 sec",
      format: "Brand / personality",
      objective: "First impression",
      hook: "Behind every scroll-stopping piece of content is a bunch of people losing their minds.",
      shows: ["Cameras", "Editors", "Shoots", "BTS", "Chaos", "Final output"],
      reel: "intro",
    },
    {
      week: "Week 03",
      slot: "spark-02",
      title: "Meet the People",
      length: "5 × 20–30 sec",
      format: "People / culture",
      objective: "Connection",
      hook: "Team members introduced as characters, not job titles.",
      shows: ["The Director", "The Editor", "The “one more take” guy", "The Camera Guy", "The Designer"],
      reel: "cast",
    },
    {
      week: "Week 05",
      slot: "spark-03",
      title: "How It's Made",
      length: "30–40 sec",
      format: "Process / proof",
      objective: "Saves & shares",
      hook: "One real project, fast and satisfying: idea, shoot, edit, final.",
      shows: ["Idea", "Shoot", "Edit", "Final"],
      reel: "process",
    },
    {
      week: "Week 07",
      slot: "spark-04",
      title: "The BuzzLab Brain",
      length: "30–45 sec",
      format: "Entertainment / brand",
      objective: "Reach",
      hook: "What happens when you give our creatives too much freedom?",
      shows: ["AI", "VFX", "Editing", "Camera tricks", "Motion graphics", "Experiments"],
      reel: "brain",
    },
    {
      week: "Week 08",
      slot: "spark-05",
      title: "BuzzLab After Dark",
      length: "15–30 sec + Stories",
      format: "Culture / BTS",
      objective: "Community",
      hook: "Late-night edits, failed takes, shoot days. The people behind the work.",
      shows: ["Late-night edits", "Shoot days", "Failed takes", "Funny moments", "Creative chaos"],
      reel: "afterdark",
    },
  ],
};

export const flame = {
  n: "02",
  name: "Flame",
  months: "Month 03–06",
  objective: "Move from random content to recurring formats.",
  quote: ["People don't just follow brands.", "They follow things they recognise and want to return to."],
  series: [
    {
      n: "01",
      slot: "flame-01",
      title: "Who's Behind the Camera?",
      logline: "One person, one camera, everything you didn't know about the people making the work.",
      cadence: "Every 2 weeks",
      format: "30–45 sec reel",
      episodes: ["The one who storyboards on napkins", "The editor who hears music in silence", "The one who always says “one more take”"],
      style: "portrait",
    },
    {
      n: "02",
      slot: "flame-02",
      title: "BuzzLab Breakdown",
      logline: "A finished campaign taken apart frame by frame: the decisions, the cuts, why it worked.",
      cadence: "Monthly",
      format: "60 sec reel + carousel",
      episodes: ["Why we cut this in 0.8 seconds", "The shot we almost didn't get", "Three versions of one hook"],
      style: "grid",
    },
    {
      n: "03",
      slot: "flame-03",
      title: "1 Idea / 1 Hour",
      logline: "A ridiculous brief and a 60-minute timer. Whatever exists when it hits zero gets posted.",
      cadence: "Monthly",
      format: "45–60 sec reel",
      episodes: ["Sell a stapler like a sports car", "A trailer for a Monday", "An ad for silence"],
      style: "timer",
    },
    {
      n: "04",
      slot: "flame-04",
      title: "Creative War Room",
      logline: "Two creatives pitch competing ideas for the same brief. The comments pick the winner.",
      cadence: "Monthly",
      format: "Reel + Story poll",
      episodes: ["Funny vs. emotional", "One take vs. 100 cuts", "Real vs. AI"],
      style: "versus",
    },
    {
      n: "05",
      slot: "flame-05",
      title: "Client Brief → Final Film",
      logline: "The whole journey of one project, from the first email to the final cut.",
      cadence: "Per major project",
      format: "60–90 sec mini-doc",
      episodes: ["Day 0: the brief", "Day 6: the pivot", "Day 14: the final film"],
      style: "doc",
    },
  ],
  shift: { from: "Content", to: "Formats", note: "A random post starts from zero every time. A format compounds: every episode makes the next one easier to recognise." },
};

export const light = {
  n: "03",
  name: "Light",
  months: "Month 07–12",
  objective: "Build original BuzzLab IP.",
  notLockedLede: "We don't lock the IP today. The first six months tell us what the audience wants more of; the IP grows out of that.",
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
 * The creative machine: after the cigarette goes out, a yellow dot becomes a play button and the
 * whole pipeline plays out as a production world. Each stage is a caption over its shot.
 */
export const machine = {
  eyebrow: "Act 08 — The creative machine",
  title: "Content → Creative → Media → IP",
  sub: "The problem isn't only generating ideas. The system has to keep moving every single week.",
  shots: [
    { key: "idea", label: "Idea", group: "Idea" },
    { key: "shoot", label: "Shoot", group: "Execution" },
    { key: "edit", label: "Edit", group: "Execution" },
    { key: "post", label: "Post", group: "Publishing" },
    { key: "chaos", label: "Iterate", group: "Learning" },
  ],
  roles: [
    { role: "DOP", object: "Camera" },
    { role: "Director", object: "Monitor" },
    { role: "Editor", object: "Timeline" },
    { role: "Copywriter", object: "Script" },
    { role: "Social", object: "Feed" },
    { role: "Producer", object: "Kit" },
    { role: "Creative director", object: "Storyboard" },
    { role: "Designer", object: "Frames" },
  ],
};

/** ORIGINAL BUZZLAB IP — the reveal that closes the machine. */
export const ip = {
  eyebrow: "Act 09 — Original BuzzLab IP",
  beats: ["What if we didn't just make content?", "What if we made worlds?"],
  reveal: ["Original", "BuzzLab IP"],
  possibilities: [
    "A character",
    "An animated universe",
    "A short-form show",
    "A fictional creative-agency universe",
    "A recurring comedy series",
    "An automotive series",
    "A creative competition",
    "A documentary format",
    "Fictional characters",
    "An original entertainment property",
  ],
  notLocked: "Not locked. On purpose.",
  final: ["This isn't a content plan.", "It's a media engine."],
};

export const pipeline = {
  eyebrow: "Act 08 — The pipeline",
  title: "The pipeline",
  sub: "The problem isn't only generating ideas. The system has to keep moving every single week.",
  stages: [
    { name: "Idea", group: 0, note: "Every idea goes into one shared bank, not into someone's head." },
    { name: "Script", group: 0, note: "Hook, beats and ending on one page." },
    { name: "Pre-production", group: 1, note: "Shot list, cast, location, props. Booked, not hoped for." },
    { name: "Shoot", group: 1, note: "Batch days: one shoot, several pieces." },
    { name: "Edit", group: 1, note: "Cut the first two seconds first." },
    { name: "Approval", group: 2, note: "One reviewer, one round, a fixed turnaround." },
    { name: "Post", group: 2, note: "Scheduled into the weekly rhythm." },
    { name: "Analyse", group: 3, note: "A 48-hour and a 7-day check on every piece." },
    { name: "Iterate", group: 3, note: "What worked gets a sequel. What didn't gets a fix." },
  ],
  groups: ["Idea", "Execution", "Publishing", "Learning"],
};

/** The last character. Landy stares, opens wide, and eats the whole presentation. */
export const landy = {
  name: "Landy",
};
