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

/** Top-level acts. `id` is the DOM anchor; `film` is where the background film sits when this act reaches mid-screen. */
export const acts = [
  { id: "top", act: "00", label: "Cold open", film: 0 },
  { id: "problem", act: "01", label: "Where we are", film: 0.32 },
  { id: "system", act: "02", label: "The objective", film: 0.36 },
  { id: "engine", act: "03", label: "The content engine", film: 0.4 },
  { id: "phases", act: "04", label: "The plan", film: 0.46 },
  { id: "spark", act: "05", label: "Phase 01 — Spark", film: 0.5 },
  { id: "flame", act: "06", label: "Phase 02 — Flame", film: 0.6 },
  { id: "fire", act: "07", label: "Phase 03 — Fire", film: 0.76 },
  { id: "what-we-post", act: "08", label: "What we post", film: 1.0 },
  { id: "rhythm", act: "09", label: "The publishing system", film: 1.04 },
  { id: "pipeline", act: "10", label: "The pipeline", film: 1.07 },
  { id: "measure", act: "11", label: "How we know it's working", film: 1.09 },
  { id: "road-ahead", act: "12", label: "The road ahead", film: 1.12 },
] as const;

/** The index menu (kept short on purpose; the lighter is the main navigation). */
export const menu = [
  { label: "BuzzLab", target: "top", note: "Cold open" },
  { label: "The problem", target: "problem", note: "Where the page is today" },
  { label: "The system", target: "system", note: "Objective and content engine" },
  { label: "Spark", target: "spark", note: "Month 01–02" },
  { label: "Flame", target: "flame", note: "Month 03–06" },
  { label: "Fire", target: "fire", note: "Month 07–12" },
  { label: "Content engine", target: "what-we-post", note: "Pillars, rhythm, pipeline" },
  { label: "The road ahead", target: "measure", note: "Measurement and finale" },
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
  gridNote: "Illustrative feed pattern, not a screenshot.",
  gridPosts: [
    { kind: "notice", text: "We're hiring", age: "2d" },
    { kind: "empty", text: "", age: "" },
    { kind: "logo", text: "BL", age: "3w" },
    { kind: "event", text: "Event recap", age: "5w" },
    { kind: "quote", text: "“Creativity is…”", age: "7w" },
    { kind: "empty", text: "", age: "" },
    { kind: "notice", text: "Announcement", age: "9w" },
    { kind: "repost", text: "Repost", age: "11w" },
    { kind: "logo", text: "BL", age: "14w" },
  ],
  question: ["So what happens if we stop treating Instagram like a", "notice board", "?"],
};

export const objective = {
  eyebrow: "Act 02 — The objective",
  statement: ["Make BuzzLab", "worth following."],
  chain: ["Attention", "Identity", "Community", "IP"],
  explain: [
    "We are not trying to post more.",
    "We are building a recognisable media identity: a page people choose to follow, come back to, and talk about.",
  ],
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

export type PhaseKey = "spark" | "flame" | "fire";

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
    key: "fire",
    n: "03",
    name: "Fire",
    months: "Month 07–12",
    duration: "The horizon",
    objective: "Build original BuzzLab IP.",
    preview: ["Something only BuzzLab owns", "Chosen by what the audience returns to", "Formats → IP"],
    heat: 1,
  },
];

export const lighterSection = {
  eyebrow: "Act 04 — The plan",
  title: ["One lighter.", "Three temperatures."],
  sub: "Six months of committed work, and the horizon it opens up. Hover a phase to preview it, click to ignite.",
  hint: "Hover · click to ignite",
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

export const fire = {
  n: "03",
  name: "Fire",
  months: "Month 07–12",
  objective: "Build original BuzzLab IP.",
  beats: [
    "What if we stopped creating content for other people?",
    "And created something of our own?",
    "Build our own world.",
  ],
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

export const pillars = {
  eyebrow: "Act 08",
  title: "What we post",
  sub: "Five pillars, mixed like a track. People carry the page; everything else gives it range.",
  list: [
    { n: "01", name: "People", share: 40, items: ["Team", "Personality", "Culture", "Characters"] },
    { n: "02", name: "Process", share: 20, items: ["BTS", "Production", "Editing", "Creative process"] },
    { n: "03", name: "Proof", share: 20, items: ["Client work", "Campaigns", "Results", "Case studies"] },
    { n: "04", name: "Play", share: 10, items: ["Experiments", "Trends", "Entertainment", "Creative challenges"] },
    { n: "05", name: "IP", share: 10, items: ["Original formats", "Characters", "Series", "Shows", "Original concepts"] },
  ],
  stripNote: "A month of feed posts at this mix",
};

export const rhythm = {
  eyebrow: "Act 09",
  title: "The publishing system",
  sub: "A rhythm the audience can learn, and the team can plan around.",
  week: [
    { day: "Mon", slot: "Hero / entertainment", note: "The week's big swing. Built to travel. Once a month this slot carries the hero piece.", pillar: "People · Play · IP" },
    { day: "Tue", slot: null, note: "Stories: polls, reposts, community replies.", pillar: "" },
    { day: "Wed", slot: "BTS / process", note: "How the work gets made. Cut-downs from shoot days keep this cheap to produce.", pillar: "Process · Proof" },
    { day: "Thu", slot: null, note: "Stories: work-in-progress, team moments.", pillar: "" },
    { day: "Fri", slot: "People / culture", note: "The faces of BuzzLab. Characters, rituals, the office.", pillar: "People" },
    { day: "Sat", slot: null, note: "Stories: weekend shoots, behind the scenes.", pillar: "" },
    { day: "Sun", slot: "Creative / experiment", note: "Tests, trends and ideas we're curious about. Where new formats start.", pillar: "Play · IP" },
  ],
  month: [
    { value: 1, display: "1", label: "Hero piece", note: "The month's tentpole" },
    { value: 8, display: "4–8", label: "Supporting pieces", note: "Reels and carousels" },
    { value: 15, display: "8–15", label: "Stories", note: "Daily texture" },
  ],
  footnote: "Targets, not promises. Volume follows quality: we scale up once the pipeline holds.",
};

export const pipeline = {
  eyebrow: "Act 10",
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

export const measure = {
  eyebrow: "Act 11",
  title: "How we know it's working",
  sub: "No follower promises. A feedback loop instead, read every week.",
  groups: [
    {
      name: "Stop",
      question: "Did it stop the scroll?",
      metrics: [
        { name: "Reach", asks: "How many new people saw it?" },
        { name: "3-second views", asks: "Did the hook work?" },
      ],
    },
    {
      name: "Hold",
      question: "Did they stay?",
      metrics: [
        { name: "Average watch time", asks: "How long did they watch?" },
        { name: "Completion rate", asks: "Did they reach the end?" },
      ],
    },
    {
      name: "Spread",
      question: "Was it worth passing on?",
      metrics: [
        { name: "Shares", asks: "Did they send it to someone?" },
        { name: "Saves", asks: "Will they come back to it?" },
      ],
    },
    {
      name: "Stay",
      question: "Did they choose BuzzLab?",
      metrics: [
        { name: "Profile visits", asks: "Did they want to know who made it?" },
        { name: "Followers gained", asks: "Did they decide to stay?" },
      ],
    },
  ],
  loop: ["Post", "Measure", "Learn", "Improve", "Post again"],
  cadence: [
    { value: 8, label: "Signals tracked" },
    { value: 48, label: "Hour first check", suffix: "h" },
    { value: 7, label: "Day review", suffix: "d" },
    { value: 1, label: "Monthly deep dive" },
  ],
  sparkNote: "Trend lines are illustrative. They show the review loop, not a forecast.",
};

export const finale = {
  clicks: ["Click.", "Nothing.", "Click.", "Nothing.", "Click."],
  ignite: "Let's light BuzzLab up.",
  lines: ["6 months.", "Hundreds of pieces.", "A recognisable voice.", "And eventually…", "Something only BuzzLab owns."],
  final: ["This isn't a content plan.", "It's a media engine."],
  credits: "BuzzLab · Instagram strategy · Spark → Flame → Fire",
};
