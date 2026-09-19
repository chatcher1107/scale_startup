// Sample "outcomes" data: how practice relates to guest complaints, ratings and comp costs.
// Real customers would connect their POS and review feeds. Here outcomes are modeled from each location's
// actual weekly readiness, so the picture stays consistent with the rest of the demo.
import { CATEGORIES, type CategoryId } from "./scenarios";
import { LOCATIONS, type DemoData } from "./data";
import { avg, companyCategoryAvg, empsAt, locReadiness } from "./stats";

export const ORDERS_PER_LOCATION_WEEK = 4200;
export const AVG_COMP_COST = 6.5;

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000;
};

const rateFor = (readiness: number, locId: string, week: number) =>
  Math.max(2.2, 19.5 - 0.17 * readiness + (hash(locId) - 0.5) * 1.6 + (hash(`${locId}-${week}`) - 0.5) * 1.1);
const ratingFor = (rate: number) => Math.min(4.9, Math.max(3.8, 4.95 - 0.045 * rate));

export function correlation(xs: number[], ys: number[]) {
  const mx = avg(xs), my = avg(ys);
  const num = xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0);
  const den = Math.sqrt(xs.reduce((a, x) => a + (x - mx) ** 2, 0) * ys.reduce((a, y) => a + (y - my) ** 2, 0));
  const slope = num / xs.reduce((a, x) => a + (x - mx) ** 2, 0);
  return { r: den ? num / den : 0, slope, intercept: my - slope * mx };
}

export function impact(d: DemoData) {
  // weekly readiness and complaint rate per location
  const perLoc = LOCATIONS.map((l) => {
    const emps = empsAt(d, l.id);
    const readiness = Array.from({ length: 12 }, (_, i) => avg(emps.map((e) => e.history[i] ?? 0)));
    const complaints = readiness.map((r, i) => rateFor(r, l.id, i));
    return { id: l.id, name: l.name.replace(" (Brightleaf)", ""), readiness, complaints };
  });
  const weeks = Array.from({ length: 12 }, (_, i) => i);
  const readiness = weeks.map((i) => avg(perLoc.map((p) => p.readiness[i])));
  const complaints = weeks.map((i) => avg(perLoc.map((p) => p.complaints[i])));
  const rating = complaints.map(ratingFor);
  const weeklyOrders = ORDERS_PER_LOCATION_WEEK * LOCATIONS.length;
  const compCost = complaints.map((c) => (c * weeklyOrders * AVG_COMP_COST) / 1000);

  const first = (xs: number[]) => avg(xs.slice(0, 3));
  const last = (xs: number[]) => avg(xs.slice(-3));
  const before = { complaints: first(complaints), rating: first(rating), cost: first(compCost), readiness: first(readiness) };
  const after = { complaints: last(complaints), rating: last(rating), cost: last(compCost), readiness: last(readiness) };

  // scatter: current readiness vs recent complaint rate, one dot per location
  const dots = perLoc.map((p) => ({ id: p.id, name: p.name, x: locReadiness(d, p.id), y: last(p.complaints) }));
  const fit = correlation(dots.map((p) => p.x), dots.map((p) => p.y));

  // by skill: score then/now and complaints tagged to that skill per 1,000 orders
  const gain = after.readiness - before.readiness;
  const skills = CATEGORIES.map((c) => {
    const now = companyCategoryAvg(d, c.id as CategoryId);
    const then = Math.max(8, Math.round(now - gain * 0.9));
    return { cat: c, scoreThen: then, scoreNow: now, rateThen: 0.033 * (100 - then), rateNow: 0.033 * (100 - now) };
  });

  return { perLoc, readiness, complaints, rating, compCost, before, after, dots, fit, skills, annualSavings: Math.max(0, (before.cost - after.cost) * 52) };
}
