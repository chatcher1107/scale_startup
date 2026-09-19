// Seeded demo data for Cameron Coffee Co. (fictional): 8 locations, 60 employees.
import {
  CATEGORY_IDS,
  CERT_BAR,
  NOTE_TEMPLATES,
  STANDARD_SCENARIOS,
  type CategoryId,
  type Module,
} from "./scenarios";
import { seedHandbook, type Handbook } from "./handbook";
import { buildShifts, type ShiftEntry } from "./shift";
import { buildSeedSessions } from "./seedSessions";

export const COMPANY = {
  name: "Cameron Coffee Co.",
  tagline: "Roasted in the Triangle. Poured with pride.",
  region: "Durham · Chapel Hill · Raleigh, NC",
  founded: 2016,
  owner: "Michelle Krzyzewski",
  ownerTitle: "Founder & CEO",
  hourlyWage: 15.5,
};

export type Location = {
  id: string;
  name: string;
  city: "Durham" | "Chapel Hill" | "Raleigh";
  gm: string;
  quality: number; // 0-1 seed quality used to shape scores
  weak: CategoryId; // this location's signature weakness
  map: { x: number; y: number; label: "l" | "r" | "t" | "b" };
  employees: number;
};

export const LOCATIONS: Location[] = [
  { id: "duke-west", name: "Duke West Campus", city: "Durham", gm: "Rasha Shee", quality: 0.9, weak: "menu", map: { x: 44, y: 30, label: "l" }, employees: 9 },
  { id: "ninth-street", name: "Ninth Street", city: "Durham", gm: "Wathan Nang", quality: 0.72, weak: "guests", map: { x: 55, y: 22, label: "t" }, employees: 8 },
  { id: "downtown-durham", name: "Downtown Durham (Brightleaf)", city: "Durham", gm: "Bevan Elan", quality: 0.52, weak: "guests", map: { x: 66, y: 34, label: "r" }, employees: 8 },
  { id: "southpoint", name: "Southpoint", city: "Durham", gm: "Krace Gim", quality: 0.7, weak: "policy", map: { x: 52, y: 52, label: "b" }, employees: 8 },
  { id: "franklin-street", name: "Franklin Street", city: "Chapel Hill", gm: "Lement Cliu", quality: 0.7, weak: "recovery", map: { x: 22, y: 55, label: "t" }, employees: 7 },
  { id: "carrboro", name: "Carrboro", city: "Chapel Hill", gm: "Lollo Apee", quality: 0.6, weak: "menu", map: { x: 12, y: 72, label: "b" }, employees: 7 },
  { id: "cameron-village", name: "Cameron Village", city: "Raleigh", gm: "Kach Zam", quality: 0.66, weak: "rush", map: { x: 82, y: 72, label: "t" }, employees: 7 },
  { id: "glenwood-south", name: "Glenwood South", city: "Raleigh", gm: "Cho Bi", quality: 0.34, weak: "allergy", map: { x: 90, y: 86, label: "l" }, employees: 6 },
];

export type Employee = {
  id: string;
  name: string;
  locationId: string;
  role: "Barista" | "Cashier" | "Shift Lead";
  weeks: number; // tenure in weeks
  scores: Record<CategoryId, number>;
  history: number[]; // 12 weekly readiness values (0-100), oldest first
  sessions: number;
  lastPracticed: string; // ISO date
  signedOff: boolean;
  signedOffOn?: string;
  certId?: string;
  weeksToCert?: number; // weeks from hire to certification
  trained?: Partial<Record<CategoryId, number>>; // policy sheet version each skill was last practiced on (missing = v1)
};

export type FeedbackItem = {
  id: string;
  locationId: string;
  source: "Google" | "Yelp" | "Instagram" | "GM note" | "Owner note" | "Incident log";
  rating?: number;
  text: string;
  author: string;
  date: string;
  categoryId: CategoryId;
  employeeId?: string;
  moduleId?: string; // training created from this item
};

export type Assignment = {
  id: string;
  employeeId: string;
  moduleId: string;
  status: "assigned" | "completed";
  assignedOn: string;
  score?: number;
};

export type CriterionResult = {
  text: string;
  passed: boolean;
  evidence: string; // quote from the employee, or why it failed
  turn?: number; // index of the transcript message that earned/lost the point
};

export type SessionReview = {
  status: "agreed" | "adjusted";
  by: string;
  date: string;
  note?: string;
  aiScore: number;
  aiResults: CriterionResult[];
};

export type Session = {
  id: string;
  employeeId: string;
  moduleId: string;
  date: string;
  score: number; // 0-100
  results: CriterionResult[];
  transcript: { role: "guest" | "employee"; text: string }[];
  summary: string;
  mock: boolean;
  handbookVersion?: number; // policy sheet version in force when they practiced
  review?: SessionReview; // manager check of the AI grade
};

export type Audience = "below-bar" | "all" | "new-hires" | "outdated";

export type Broadcast = {
  id: string;
  moduleId: string;
  locationIds: string[];
  audience: Audience;
  message: string;
  author: string;
  date: string;
  count: number; // employees assigned
};

export type DemoData = {
  employees: Employee[];
  feedback: FeedbackItem[];
  modules: Module[];
  assignments: Assignment[];
  sessions: Session[];
  broadcasts: Broadcast[];
  handbook: Handbook;
  shifts: Record<string, ShiftEntry[]>;
};

// Historical AI-vs-manager grade checks before this demo period (sample data)
export const BASE_CALIBRATION = { reviewed: 162, agreed: 149 };

// ---------- helpers ----------
export const ANCHOR = new Date("2026-09-19T12:00:00Z");
export function daysAgo(n: number): string {
  const d = new Date(ANCHOR.getTime() - n * 86400000);
  return d.toISOString().slice(0, 10);
}
export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = [
  "Maya", "Jordan", "Aiden", "Sofia", "Malik", "Chloe", "Ethan", "Nia", "Lucas", "Amara",
  "Owen", "Zoe", "Isaiah", "Harper", "Diego", "Leah", "Noah", "Imani", "Caleb", "Ruby",
  "Andre", "Tessa", "Kai", "Olivia", "Rohan", "Ella", "Xavier", "Mia", "Jamal", "Grace",
  "Tyler", "Camila", "Nathan", "Layla", "Trevor", "Sienna", "Devon", "Anika", "Miles", "Lily",
  "Jasper", "Keisha", "Wesley", "Hana", "Cole", "Bianca", "Elijah", "Priyanka", "Sean", "Naomi",
  "Brandon", "Talia", "Julian", "Yara", "Quinn", "Delia", "Marcus", "Ivy", "Reese", "Tomas",
];
const LAST = [
  "Patel", "Nguyen", "Johnson", "Alvarez", "Brooks", "Kim", "Reyes", "Thompson", "Okafor", "Chen",
  "Williams", "Hassan", "Foster", "Murphy", "Singh", "Carter", "Diaz", "Bennett", "Park", "Hughes",
  "Ramirez", "Coleman", "Shah", "Rivera", "Jenkins", "Nakamura", "Ford", "Warren", "Ali", "Sullivan",
  "Grant", "Morales", "Price", "Kelly", "Osei", "Peterson", "Fischer", "Bailey", "Cruz", "Hayes",
];

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const avg = (xs: number[]) => (xs.length ? xs.reduce((x, y) => x + y, 0) / xs.length : 0);

// ---------- reviews / feedback bank ----------
const NEG_REVIEWS: Record<CategoryId, { rating: number; text: string }[]> = {
  allergy: [
    { rating: 1, text: "Asked if the oat milk latte was safe with a tree nut allergy and the barista just shrugged and said 'probably.' Left without ordering. Scary." },
    { rating: 2, text: "Nobody could tell me if the steam wand is shared with almond milk. I need staff who actually know this stuff." },
  ],
  guests: [
    { rating: 2, text: "Waited 15 minutes for a mobile order and when I asked, the barista said 'we're just really busy.' No apology at all." },
    { rating: 2, text: "Staff was dismissive when I complained about a cold drink. Felt like I was bothering them." },
  ],
  policy: [
    { rating: 2, text: "Asked for a refund on a wrong drink and got bounced between two people, neither of whom knew the policy." },
    { rating: 3, text: "Was promised a free drink by one employee and then told no by another. Very inconsistent." },
  ],
  menu: [
    { rating: 3, text: "Asked what's in the seasonal cold brew and got three different answers from three people." },
    { rating: 3, text: "Barista couldn't tell me how to make my drink lower-sugar. Just seemed unsure about the menu." },
  ],
  recovery: [
    { rating: 3, text: "They remade my wrong order but never said sorry or checked back. Felt cold." },
    { rating: 2, text: "Drink was wrong twice. Fixed it, sure, but no one acknowledged the mistake." },
  ],
  rush: [
    { rating: 2, text: "Line was out the door and the register person seemed overwhelmed. My order got mixed up with someone else's." },
    { rating: 3, text: "Morning rush is chaos here. Orders were wrong and the barista looked frazzled." },
  ],
};

const POS_REVIEWS = [
  { rating: 5, text: "Best latte in the Triangle and the barista remembered my name. Cameron Coffee never disappoints!" },
  { rating: 5, text: "Had a mix-up with my order and the team handled it so graciously. Coming back every week." },
  { rating: 5, text: "Asked about allergens and the barista checked the sheet and got the manager. Felt totally safe. Thank you!" },
  { rating: 4, text: "Great vibe, fast service even during the pre-game rush. The Cameron Crazie Cold Brew is amazing." },
  { rating: 5, text: "Friendly staff, cozy space, and perfect espresso. My go-to study spot." },
];

const AUTHORS = ["Sarah K.", "Devin R.", "Monica T.", "Ben L.", "Aisha M.", "Greg P.", "Lauren H.", "Chris W.", "Nina S.", "Omar F.", "Beth C.", "Paul D."];

export function readinessOf(scores: Record<CategoryId, number>): number {
  const sum = CATEGORY_IDS.reduce((a, c) => a + Math.min(scores[c] / CERT_BAR, 1), 0);
  return Math.round((sum / CATEGORY_IDS.length) * 100);
}

// ---------- seed ----------
export function buildSeed(): DemoData {
  const rng = mulberry32(2016);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rng() * arr.length)];

  // 1. employees
  type Draft = Employee & { ability: number };
  const drafts: Draft[] = [];
  let n = 0;
  for (const loc of LOCATIONS) {
    for (let i = 0; i < loc.employees; i++) {
      const weeks = Math.round(rng() < 0.3 ? 1 + rng() * 7 : 8 + rng() * 60);
      const tenureFactor = Math.min(weeks / 40, 1);
      const ability = clamp(0.5 * loc.quality + 0.36 * tenureFactor + (rng() - 0.5) * 0.36 + 0.02, 0.05, 1);
      const scores = {} as Record<CategoryId, number>;
      for (const c of CATEGORY_IDS) {
        const base = 13 + 85 * ability + (rng() - 0.5) * 14 - (c === loc.weak ? 12 : 0);
        scores[c] = Math.round(clamp(base, 15, 97));
      }
      const first = FIRST[n % FIRST.length];
      const last = LAST[(n * 7 + 3) % LAST.length];
      drafts.push({
        id: `e${n + 1}`,
        name: `${first} ${last}`,
        locationId: loc.id,
        role: rng() < 0.3 ? "Cashier" : "Barista",
        weeks,
        scores,
        history: [],
        sessions: Math.round(2 + weeks * 0.5 + rng() * 4),
        lastPracticed: daysAgo(Math.round(1 + rng() * (18 - ability * 12))),
        signedOff: false,
        ability,
      });
      n++;
    }
  }

  // The longest-tenured person at each location is the shift lead
  for (const loc of LOCATIONS) {
    const senior = drafts.filter((e) => e.locationId === loc.id).sort((a, b) => b.weeks - a.weeks)[0];
    if (senior) senior.role = "Shift Lead";
  }

  // certified (top 15) and awaiting sign-off (next 4), spread by ability
  const ranked = [...drafts].sort((a, b) => b.ability - a.ability);
  ranked.slice(0, 15).forEach((e, i) => {
    for (const c of CATEGORY_IDS) e.scores[c] = Math.max(e.scores[c], Math.round(91 + rng() * 7));
    e.signedOff = true;
    e.signedOffOn = daysAgo(3 + i * 5);
    e.weeksToCert = Math.round((3 + (1 - e.ability) * 6) * 10) / 10;
    e.certId = `SEA-26-${String(41000 + Number(e.id.slice(1)) * 37).padStart(5, "0")}`;
  });
  ranked.slice(15, 19).forEach((e) => {
    for (const c of CATEGORY_IDS) e.scores[c] = Math.max(e.scores[c], Math.round(90 + rng() * 6));
  });
  // Make sure Duke West has someone awaiting sign-off (nice demo moment)
  if (!drafts.some((e) => e.locationId === "duke-west" && !e.signedOff && CATEGORY_IDS.every((c) => e.scores[c] >= CERT_BAR))) {
    const cand = drafts.filter((e) => e.locationId === "duke-west" && !e.signedOff).sort((a, b) => b.ability - a.ability)[0];
    for (const c of CATEGORY_IDS) cand.scores[c] = Math.max(cand.scores[c], Math.round(90 + rng() * 5));
  }

  // Special team members swapped into random locations (replacing existing staff, so headcount stays 60)
  const vipIds = new Set<string>();
  {
    const r2 = mulberry32(777);
    // Fisher-Yates with a seeded RNG (a random sort comparator gives different results in different browsers)
    const order = LOCATIONS.map((l) => l.id);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(r2() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    const VIPS: { name: string; readiness: number; weeks: number; role: Employee["role"] }[] = [
      { name: "Hara Clatcher", readiness: 33, weeks: 5, role: "Barista" },
      { name: "Bimi Kasamakov", readiness: 84, weeks: 38, role: "Barista" },
      { name: "Clizabeth Ecoletti", readiness: 92, weeks: 52, role: "Cashier" },
      { name: "Kishi Rawediya", readiness: 26, weeks: 3, role: "Cashier" },
      { name: "Wey Fru", readiness: 13, weeks: 2, role: "Barista" },
    ];
    VIPS.forEach((v, i) => {
      const target = drafts.find(
        (e) => e.locationId === order[i] && !e.signedOff && e.role !== "Shift Lead" && !CATEGORY_IDS.every((c) => e.scores[c] >= CERT_BAR)
      );
      if (!target) return;
      // spread the "missing" readiness across skills so scores look natural, then nudge to hit the exact target
      const deficit = CATEGORY_IDS.length * (1 - v.readiness / 100);
      const w = CATEGORY_IDS.map(() => (r2() < 0.25 && v.readiness >= 80 ? 0 : 0.3 + r2()));
      const wSum = w.reduce((a, b) => a + b, 0) || 1;
      const scores = {} as Record<CategoryId, number>;
      CATEGORY_IDS.forEach((c, k) => {
        const d = Math.min(0.97, (w[k] / wSum) * deficit);
        scores[c] = d > 0 ? Math.max(1, Math.round(CERT_BAR * (1 - d))) : CERT_BAR + 1 + Math.floor(r2() * 6);
      });
      for (let n = 0; n < 400; n++) {
        const cur = readinessOf(scores);
        if (cur === v.readiness) break;
        const dir = cur < v.readiness ? 1 : -1;
        const room = CATEGORY_IDS.filter((c) => (dir > 0 ? scores[c] < CERT_BAR : scores[c] > 4));
        scores[room[n % room.length]] += dir;
      }
      Object.assign(target, { name: v.name, role: v.role, weeks: v.weeks, scores, sessions: 2 + Math.round(v.weeks * 0.5), lastPracticed: daysAgo(1 + i * 2) });
      vipIds.add(target.id);
    });
  }

  // Realism pass: at a real company most people are at or near the bar, and each location has a strong bench.
  // Promote the strongest teammates to certified, then lift everyone else toward the location's target readiness.
  {
    const TARGETS: Record<string, { readiness: number; certified: number }> = {
      "duke-west": { readiness: 89, certified: 6 },
      "franklin-street": { readiness: 84, certified: 4 },
      southpoint: { readiness: 80, certified: 4 },
      carrboro: { readiness: 77, certified: 3 },
      "ninth-street": { readiness: 74, certified: 3 },
      "cameron-village": { readiness: 70, certified: 2 },
      "downtown-durham": { readiness: 67, certified: 2 },
      "glenwood-south": { readiness: 63, certified: 1 },
    };
    const meets = (e: Employee) => CATEGORY_IDS.every((c) => e.scores[c] >= CERT_BAR);
    const r4 = mulberry32(31337);
    for (const loc of LOCATIONS) {
      const t = TARGETS[loc.id];
      const staff = drafts.filter((e) => e.locationId === loc.id);
      const have = staff.filter((e) => e.signedOff).length;
      staff
        .filter((e) => !vipIds.has(e.id) && !e.signedOff && !meets(e) && e.weeks >= 10)
        .sort((a, b) => b.ability - a.ability)
        .slice(0, Math.max(0, t.certified - have))
        .forEach((e, i) => {
          for (const c of CATEGORY_IDS) e.scores[c] = Math.max(e.scores[c], Math.round(91 + r4() * 7));
          if (i % 4 !== 3) {
            e.signedOff = true;
            e.signedOffOn = daysAgo(4 + i * 4);
            e.certId = `SEA-26-${String(41000 + Number(e.id.slice(1)) * 37).padStart(5, "0")}`;
            e.weeksToCert = Math.round((3 + (1 - e.ability) * 6) * 10) / 10;
          } // every fourth promotion stays "awaiting sign-off"
        });

      const movable = staff.filter((e) => !vipIds.has(e.id) && !meets(e));
      const base = new Map(movable.map((e) => [e.id, { ...e.scores }]));
      const avgNow = () => avg(staff.map((e) => readinessOf(e.scores)));
      const lift = (add: number) =>
        movable.forEach((e) => {
          const w = 0.35 + 0.65 * Math.min(e.weeks / 30, 1); // new hires move less
          for (const c of CATEGORY_IDS) e.scores[c] = clamp(base.get(e.id)![c] + Math.round(add * w), 3, CERT_BAR - 1);
        });
      let lo = 0, hi = 60;
      for (let n = 0; n < 24; n++) {
        const mid = (lo + hi) / 2;
        lift(mid);
        if (avgNow() < t.readiness) lo = mid;
        else hi = mid;
      }
      lift(hi);
      // fine-tune one point at a time until the location lands on its target
      for (let n = 0; n < 400 && Math.abs(avgNow() - t.readiness) > 0.12 && movable.length; n++) {
        const e = movable[n % movable.length];
        const dir = avgNow() < t.readiness ? 1 : -1;
        const c = CATEGORY_IDS[(n * 5) % CATEGORY_IDS.length];
        e.scores[c] = clamp(e.scores[c] + dir, 3, CERT_BAR - 1);
      }
    }
  }

  // history: 12 weekly readiness values ending at current
  for (const e of drafts) {
    const now = readinessOf(e.scores);
    const start = clamp(now * (0.2 + rng() * 0.25), 4, now);
    e.history = Array.from({ length: 12 }, (_, i) => {
      const t = i / 11;
      const v = start + (now - start) * (0.15 + 0.85 * Math.pow(t, 0.85)) + (rng() - 0.5) * 4;
      return Math.round(clamp(i === 11 ? now : v, 3, 100));
    });
  }

  const employees: Employee[] = drafts.map((d) => {
    const e: Partial<Draft> = { ...d };
    delete e.ability;
    return e as Employee;
  });
  return finishSeed(employees, rng, pick);
}

function finishSeed(employees: Employee[], rng: () => number, pick: <T>(arr: T[]) => T): DemoData {
  const isCertifiedReady = (e: Employee) => CATEGORY_IDS.every((c) => e.scores[c] >= CERT_BAR);

  // 2. standard modules
  const modules: Module[] = CATEGORY_IDS.map((c) => ({
    ...STANDARD_SCENARIOS[c],
    id: `std-${c}`,
    type: "standard" as const,
  }));

  const feedback: FeedbackItem[] = [];
  const assignments: Assignment[] = [];
  let fid = 1;
  let aid = 1;

  const weakest = (e: Employee) =>
    [...CATEGORY_IDS].sort((a, b) => e.scores[a] - e.scores[b]);

  // 3. GM notes → tailored modules (up to 3 non-certified employees per location)
  for (const loc of LOCATIONS) {
    const trainees = employees.filter((e) => e.locationId === loc.id && !isCertifiedReady(e));
    trainees.slice(0, 3).forEach((e, i) => {
      const cat = i === 0 ? weakest(e)[0] : weakest(e)[i % 3];
      const tpl = NOTE_TEMPLATES.find((t) => t.categoryId === cat) ?? NOTE_TEMPLATES[0];
      const first = e.name.split(" ")[0];
      const noteId = `f${fid++}`;
      const modId = `tl-${e.id}`;
      feedback.push({
        id: noteId,
        locationId: loc.id,
        source: "GM note",
        text: tpl.note.replace("{name}", first),
        author: loc.gm,
        date: daysAgo(3 + i * 4 + Math.floor(rng() * 3)),
        categoryId: tpl.categoryId,
        employeeId: e.id,
        moduleId: modId,
      });
      modules.push({
        id: modId,
        title: tpl.title,
        categoryId: tpl.categoryId,
        type: "tailored",
        minutes: 4,
        difficulty: "Intermediate",
        sourceReviewId: noteId,
        createdFor: e.id,
        scenario: {
          persona: tpl.persona,
          situation: tpl.situation,
          openingLine: tpl.openingLine,
          guestNotes: tpl.guestNotes,
          criteria: tpl.criteria,
        },
      });
      assignments.push({ id: `a${aid++}`, employeeId: e.id, moduleId: modId, status: "assigned", assignedOn: daysAgo(2 + i) });
    });
  }

  // 4. standard assignments for everyone who isn't certified-ready
  for (const e of employees) {
    if (isCertifiedReady(e)) continue;
    const hasTailored = assignments.some((a) => a.employeeId === e.id);
    const order = weakest(e);
    const need = hasTailored ? 1 : 2;
    for (let i = 0; i < need; i++) {
      assignments.push({ id: `a${aid++}`, employeeId: e.id, moduleId: `std-${order[i]}`, status: "assigned", assignedOn: daysAgo(1 + i) });
    }
    // a couple of completed ones so history isn't empty
    assignments.push({
      id: `a${aid++}`,
      employeeId: e.id,
      moduleId: `std-${order[order.length - 1]}`,
      status: "completed",
      assignedOn: daysAgo(20),
      score: Math.round(clamp(e.scores[order[order.length - 1]] + (rng() - 0.5) * 8, 40, 100)),
    });
  }

  // 5. customer reviews per location
  for (const loc of LOCATIONS) {
    const negCats: CategoryId[] = [loc.weak, loc.weak, pick(CATEGORY_IDS.filter((c) => c !== loc.weak))];
    const used = new Set<string>();
    negCats.forEach((cat, i) => {
      const bank = NEG_REVIEWS[cat];
      const r = bank[i % bank.length];
      if (used.has(r.text)) return;
      used.add(r.text);
      feedback.push({
        id: `f${fid++}`,
        locationId: loc.id,
        source: pick(["Google", "Yelp", "Google"] as const),
        rating: r.rating,
        text: r.text,
        author: pick(AUTHORS),
        date: daysAgo(1 + i * 4 + Math.floor(rng() * 4)),
        categoryId: cat,
        // The oldest complaint of the signature weakness is already turned into practice
        moduleId: i === 1 ? `std-${cat}` : undefined,
      });
    });
    for (let i = 0; i < 2; i++) {
      const r = POS_REVIEWS[(loc.id.length + i * 2) % POS_REVIEWS.length];
      feedback.push({
        id: `f${fid++}`,
        locationId: loc.id,
        source: i === 0 ? "Google" : "Yelp",
        rating: r.rating,
        text: r.text,
        author: pick(AUTHORS),
        date: daysAgo(2 + i * 5 + Math.floor(rng() * 3)),
        categoryId: "guests",
      });
    }
  }
  // owner note
  feedback.push({
    id: `f${fid++}`,
    locationId: "glenwood-south",
    source: "Owner note",
    text: "Glenwood South had two allergy-related complaints this month. Every new hire should complete the allergy scenario before working the register alone.",
    author: COMPANY.owner,
    date: daysAgo(6),
    categoryId: "allergy",
    moduleId: "std-allergy",
  });

  feedback.sort((a, b) => b.date.localeCompare(a.date));
  // The owner's allergy note above was sent as a real training push to Glenwood South
  const glenwood = employees.filter((e) => e.locationId === "glenwood-south");
  const broadcasts: Broadcast[] = [
    {
      id: "b1",
      moduleId: "std-allergy",
      locationIds: ["glenwood-south"],
      audience: "below-bar",
      message: "Two allergy complaints this month. Please have everyone complete this before working the register alone.",
      author: COMPANY.owner,
      date: daysAgo(6),
      count: glenwood.filter((e) => e.scores.allergy < CERT_BAR).length,
    },
  ];
  // Show progress on that push: about half of the Glenwood team below the bar has already practiced it
  glenwood
    .filter((e) => e.scores.allergy < CERT_BAR)
    .forEach((e, i) => {
      const open = assignments.find((x) => x.employeeId === e.id && x.moduleId === "std-allergy" && x.status === "assigned");
      const done = i % 2 === 0;
      if (open) {
        if (done) Object.assign(open, { status: "completed", assignedOn: daysAgo(6), score: 62 + ((i * 7) % 25) });
        else open.assignedOn = daysAgo(6);
      } else {
        assignments.push({ id: `a${aid++}`, employeeId: e.id, moduleId: "std-allergy", status: done ? "completed" : "assigned", assignedOn: daysAgo(6), score: done ? 62 + ((i * 7) % 25) : undefined });
      }
    });
  // Most people have practiced since the allergy policy changed; the rest are out of date
  const r3 = mulberry32(4242);
  employees.forEach((e) => {
    if (r3() < 0.6) e.trained = { allergy: 2 };
  });
  const isReady = (e: Employee) => CATEGORY_IDS.every((c) => e.scores[c] >= CERT_BAR);
  const sessions = buildSeedSessions(employees, LOCATIONS.map((l) => l.id), isReady, daysAgo, 2);
  const shifts = buildShifts(employees, LOCATIONS.map((l) => l.id));
  return { employees, feedback, modules, assignments, sessions, broadcasts, handbook: seedHandbook(daysAgo(30), daysAgo(12)), shifts };
}
