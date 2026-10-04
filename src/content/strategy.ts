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
  { id: "phases", act: "04", label: "The lighter", film: 0.46 },
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
  { label: "Original IP", target: "machine", note: "What if we made worlds?" },
  { label: "The pipeline", target: "pipeline", note: "Post, measure, learn, improve" },
  { label: "The set", target: "set", note: "Everyone, doing their job" },
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
  eyebrow: "Act 02 — Worth noticing",
  /** MAKE / BUZZLAB / WORTH / NOTICING. — one word at a time, the last one carries the weight. */
  statement: ["Make", "BuzzLab", "worth", "noticing."],
  /** what that sentence sets off */
  chain: ["Content", "Formats", "Media", "Attention", "Identity", "Community", "Original IP"],
};

/** ACT 02 → 03: the editor at his desk, then the room keeps going (machine/studio.ts). */
export const studio = {
  act2: {
    eyebrow: "Act 02 — Worth noticing",
    title: ["The page isn't just inactive.", "It's invisible."],
    sub: "We don't need more content. We need something people actually want to notice.",
    hand: "Hours in. Still cutting.",
    handNote: "It starts with someone who cares about every frame.",
  },
  act3: {
    eyebrow: "Act 03 — The studio",
    ladder: ["Editing", "Creative", "Production"],
    title: ["Content doesn't become a media brand", "because you post more."],
    titleB: ["It becomes one when people", "want to come back."],
    layers: [
      { n: "01", name: "Attention", job: "Stop the scroll." },
      { n: "02", name: "Identity", job: "Make people understand BuzzLab." },
      { n: "03", name: "IP", job: "Make them come back." },
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
    duration: "6 months",
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
  eyebrow: "Act 07 — Original BuzzLab IP",
  /** one short line per shot of the machine (machine time); the ladder word sits above it */
  shots: [
    { at: 0.1, rung: 0, line: "One idea. One click." },
    { at: 0.22, rung: 1, line: "Then a camera. Then a crew." },
    { at: 0.37, rung: 1, line: "Every cut becomes something." },
    { at: 0.52, rung: 2, line: "One shoot. A whole feed." },
    { at: 0.66, rung: 2, line: "Every role. One machine." },
  ],
  shotsEnd: 0.775,
  ladder: ["Content", "Creative", "Media", "IP"],
};

/** ORIGINAL BUZZLAB IP — the reveal that closes the machine. */
export const ip = {
  eyebrow: "Act 07 — Original BuzzLab IP",
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

/** The weekly broadcast schedule and the monthly output it adds up to. */
export const rhythm = {
  label: "The broadcast schedule",
  title: "A rhythm the audience can learn.",
  week: [
    { day: "Mon", slot: "Hero / entertainment", note: "The week's big swing." },
    { day: "Tue", slot: null, note: "Stories" },
    { day: "Wed", slot: "BTS / process", note: "How the work gets made." },
    { day: "Thu", slot: null, note: "Stories" },
    { day: "Fri", slot: "People / culture", note: "The faces of BuzzLab." },
    { day: "Sat", slot: null, note: "Stories" },
    { day: "Sun", slot: "Creative / experiment", note: "Where new formats start." },
  ],
  month: [
    { display: "1", label: "Hero piece" },
    { display: "4–8", label: "Supporting pieces" },
    { display: "8–15", label: "Stories" },
  ],
  footnote: "Targets, not promises. Volume follows quality.",
};

/** ACT 09 — the miniature set: everyone on the job, in the order the camera visits them. */
export const set = {
  eyebrow: "Act 09 — The set",
  title: ["Everyone has a job.", "Every job makes the work."],
  roles: [
    { key: "director", role: "Director", does: "Calls the shot at the monitor." },
    { key: "dop", role: "DOP", does: "Frames it, lights it, rolls." },
    { key: "lighting", role: "Lighting", does: "Shapes the light on the talent." },
    { key: "producer", role: "Producer", does: "Keeps the day on schedule." },
    { key: "editor", role: "Editor", does: "Cuts it while it's still warm." },
    { key: "creative", role: "Creative", does: "Holds the idea on the board." },
    { key: "social", role: "Social", does: "Posts it, then reads the numbers." },
    { key: "talent", role: "Talent", does: "Makes you stop scrolling." },
  ],
  final: ["This isn't a content plan.", "It's a media engine."],
};

/** The last character. Tanishka stares, opens wide, and eats the whole presentation. */
export const tanishka = {
  name: "Tanishka",
};
