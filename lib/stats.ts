import { CATEGORIES, CATEGORY_IDS, CERT_BAR, type CategoryId } from "./scenarios";
import { BASE_CALIBRATION, LOCATIONS, readinessOf, type Audience, type DemoData, type Employee } from "./data";

export const readiness = (e: Employee) => readinessOf(e.scores);
export const meetsBar = (e: Employee) => CATEGORY_IDS.every((c) => e.scores[c] >= CERT_BAR);

export type Status = "certified" | "awaiting" | "progress" | "new";
export function statusOf(e: Employee): Status {
  if (e.signedOff && meetsBar(e)) return "certified";
  if (meetsBar(e)) return "awaiting";
  if (e.weeks < 5 && readiness(e) < 55) return "new";
  return "progress";
}
export const STATUS_LABEL: Record<Status, string> = {
  certified: "Certified",
  awaiting: "Awaiting sign-off",
  progress: "In progress",
  new: "New hire",
};

export const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export const empsAt = (d: DemoData, locId: string) => d.employees.filter((e) => e.locationId === locId);

export function locCategoryAvg(d: DemoData, locId: string, cat: CategoryId) {
  return Math.round(avg(empsAt(d, locId).map((e) => e.scores[cat])));
}
export function companyCategoryAvg(d: DemoData, cat: CategoryId) {
  return Math.round(avg(d.employees.map((e) => e.scores[cat])));
}
export const locReadiness = (d: DemoData, locId: string) =>
  Math.round(avg(empsAt(d, locId).map(readiness)));

export function locSummary(d: DemoData, locId: string) {
  const emps = empsAt(d, locId);
  const certified = emps.filter((e) => statusOf(e) === "certified").length;
  const awaiting = emps.filter((e) => statusOf(e) === "awaiting").length;
  const weakest = [...CATEGORY_IDS].sort((a, b) => locCategoryAvg(d, locId, a) - locCategoryAvg(d, locId, b))[0];
  return {
    employees: emps.length,
    certified,
    awaiting,
    readiness: locReadiness(d, locId),
    weakest,
    atRisk: emps.filter((e) => readiness(e) < 45).length,
  };
}

// Weekly readiness trend for a set of employees
export function trend(emps: Employee[]) {
  return Array.from({ length: 12 }, (_, i) => Math.round(avg(emps.map((e) => e.history[i] ?? 0))));
}

export const BASELINE_WEEKS_TO_INDEPENDENT = 9;
export const MANAGER_RATE = 26; // $/hr, manager coaching time
export const MINUTES_SAVED_PER_SESSION = 14;

export function companyStats(d: DemoData) {
  const emps = d.employees;
  const certified = emps.filter((e) => statusOf(e) === "certified");
  const weeksToCert = avg(certified.map((e) => e.weeksToCert ?? 6));
  const sessions = emps.reduce((a, e) => a + e.sessions, 0) + d.sessions.length;
  const hoursSaved = Math.round((sessions * MINUTES_SAVED_PER_SESSION) / 60);
  return {
    employees: emps.length,
    certified: certified.length,
    awaiting: emps.filter((e) => statusOf(e) === "awaiting").length,
    readiness: Math.round(avg(emps.map(readiness))),
    weeksToCert: Math.round(weeksToCert * 10) / 10,
    baselineWeeks: BASELINE_WEEKS_TO_INDEPENDENT,
    sessions,
    hoursSaved,
    dollarsSaved: hoursSaved * MANAGER_RATE,
    atRisk: emps.filter((e) => readiness(e) < 45).length,
  };
}

// Rank of an employee within their location and the company
export function rankOf(d: DemoData, e: Employee) {
  const sorted = (list: Employee[]) => [...list].sort((a, b) => readiness(b) - readiness(a)).findIndex((x) => x.id === e.id) + 1;
  const loc = empsAt(d, e.locationId);
  return { atLocation: sorted(loc), locationSize: loc.length, company: sorted(d.employees), companySize: d.employees.length };
}

// Who would receive a training pushed to these locations (skips people who already have it open)
export function audienceTargets(d: DemoData, moduleId: string, categoryId: CategoryId, locationIds: string[], audience: Audience) {
  return d.employees.filter((e) => {
    if (!locationIds.includes(e.locationId)) return false;
    if (d.assignments.some((a) => a.employeeId === e.id && a.moduleId === moduleId && a.status === "assigned")) return false;
    if (audience === "outdated") return (e.trained?.[categoryId] ?? 1) < d.handbook.catVersion[categoryId];
    if (audience === "below-bar") return e.scores[categoryId] < CERT_BAR;
    if (audience === "new-hires") return e.weeks < 8;
    return true;
  });
}

// ---- Policy sheet versions: who hasn't practiced since a skill's content last changed ----
export const outdatedCats = (d: DemoData, e: Employee) => CATEGORY_IDS.filter((c) => (e.trained?.[c] ?? 1) < d.handbook.catVersion[c]);

export function outdatedBySkill(d: DemoData, locationIds: string[]) {
  return CATEGORIES.map((c) => {
    const people = d.employees.filter((e) => locationIds.includes(e.locationId) && (e.trained?.[c.id] ?? 1) < d.handbook.catVersion[c.id]);
    const change = d.handbook.log.find((l) => l.affects?.includes(c.id));
    return { cat: c, people, since: d.handbook.catVersion[c.id], change };
  }).filter((x) => x.people.length > 0);
}

// ---- Grade reviews: how often managers agree with the AI ----
export function agreement(d: DemoData) {
  const reviewed = d.sessions.filter((s) => s.review);
  const agreedLive = reviewed.filter((s) => s.review!.status === "agreed").length;
  const total = BASE_CALIBRATION.reviewed + reviewed.length;
  const agreed = BASE_CALIBRATION.agreed + agreedLive;
  return { rate: Math.round((agreed / total) * 100), total, agreed, adjustedLive: reviewed.length - agreedLive, pending: d.sessions.filter((s) => !s.review).length };
}

// Recent manager corrections, sent to the grader so it learns this company's standards
export function calibrationExamples(d: DemoData) {
  const out: { criterion: string; employeeSaid: string; aiSaid: string; managerSaid: string }[] = [];
  for (const s of d.sessions) {
    if (s.review?.status !== "adjusted") continue;
    s.results.forEach((r, i) => {
      const ai = s.review!.aiResults[i];
      if (ai && ai.passed !== r.passed) {
        out.push({
          criterion: r.text,
          employeeSaid: s.transcript.filter((t) => t.role === "employee").map((t) => t.text).join(" / ").slice(0, 300),
          aiSaid: ai.passed ? "pass" : "fail",
          managerSaid: r.passed ? "pass" : "fail",
        });
      }
    });
  }
  return out.slice(0, 5);
}

export function locationName(id: string) {
  return LOCATIONS.find((l) => l.id === id)?.name ?? id;
}

export function scoreTone(score: number): "good" | "warn" | "bad" {
  return score >= CERT_BAR ? "good" : score >= 70 ? "warn" : "bad";
}

export function daysSince(iso: string) {
  return Math.max(0, Math.round((Date.now() - new Date(iso + "T12:00:00").getTime()) / 86400000));
}
export function fmtDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
export function fmtLongDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}
