// "Tonight's shift": which scheduled teammates are cleared for the station they're working.
// A person is CLEARED for a station when every skill that station needs is at or above its minimum.
import type { Employee } from "./data";
import { CATEGORIES, CERT_BAR, type CategoryId } from "./scenarios";

export type StationId = "register" | "bar" | "handoff" | "floater";

export const STATIONS: Record<StationId, { name: string; emoji: string; blurb: string; needs: Partial<Record<CategoryId, number>> }> = {
  register: { name: "Register", emoji: "💳", blurb: "Takes orders, handles allergy questions and payments", needs: { allergy: 70, guests: 60, policy: 60 } },
  bar: { name: "Espresso bar", emoji: "☕", blurb: "Makes drinks, knows the menu and steam-wand safety", needs: { menu: 65, allergy: 70, rush: 60 } },
  handoff: { name: "Hand-off & mobile", emoji: "📦", blurb: "Calls names, fixes wrong orders, meets waiting guests", needs: { guests: 55, recovery: 55 } },
  floater: { name: "Floater", emoji: "🧺", blurb: "Supports the team. No minimum, so a great place to practice", needs: {} },
};

export const SHIFTS = [
  { id: "tonight", label: "Tonight", hours: "4 PM to close" },
  { id: "morning", label: "Tomorrow morning rush", hours: "6 to 10 AM" },
] as const;
export type ShiftId = (typeof SHIFTS)[number]["id"];

export type ShiftEntry = { employeeId: string; station: StationId };

const LAYOUT: Record<ShiftId, StationId[]> = {
  tonight: ["register", "bar", "bar", "handoff", "floater"],
  morning: ["register", "register", "bar", "bar", "handoff"],
};

export const shiftKey = (locationId: string, shift: ShiftId) => `${locationId}:${shift}`;

export type Clearance = { cleared: boolean; missing: { cat: CategoryId; need: number; have: number }[] };

export function clearance(e: Employee, station: StationId): Clearance {
  const missing = (Object.entries(STATIONS[station].needs) as [CategoryId, number][])
    .filter(([cat, need]) => e.scores[cat] < need)
    .map(([cat, need]) => ({ cat, need, have: e.scores[cat] }));
  return { cleared: missing.length === 0, missing };
}

export const skillName = (c: CategoryId) => CATEGORIES.find((x) => x.id === c)!.name;

// Sample schedule (a real customer's would sync from their scheduling tool).
// Managers mostly schedule people who are cleared for a station, keep some strong teammates on the bench, and now and then have a gap to fix.
export function buildShifts(employees: Employee[], locationIds: string[]): Record<string, ShiftEntry[]> {
  const out: Record<string, ShiftEntry[]> = {};
  let seed = 90210;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const strength = (e: Employee) => CATEGORIES.reduce((a, c) => a + Math.min(e.scores[c.id] / CERT_BAR, 1), 0);
  const ok = (e: Employee, s: StationId) => clearance(e, s).cleared;

  for (const loc of locationIds) {
    const staff = employees.filter((e) => e.locationId === loc);
    const strong = staff.filter((e) => ok(e, "register") && ok(e, "bar") && ok(e, "handoff")).sort((a, b) => strength(b) - strength(a));

    SHIFTS.forEach((shift, si) => {
      // the strongest teammates are off this shift (rotating), so the GM always has cleared people to swap in
      const nReserve = strong.length >= 5 ? 2 : strong.length >= 2 ? 1 : 0;
      const reserved = nReserve ? [...new Set(Array.from({ length: nReserve }, (_, k) => strong[(si * nReserve + k) % strong.length]))] : [];
      const left = staff.filter((e) => !reserved.includes(e));
      for (let i = left.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        [left[i], left[j]] = [left[j], left[i]];
      }
      const size = Math.min(LAYOUT[shift.id].length, staff.length - Math.max(2, reserved.length));
      const entries: ShiftEntry[] = [];
      for (const station of LAYOUT[shift.id].slice(0, size)) {
        // usually put a cleared person on the station; sometimes the schedule has a gap
        const cleared = left.filter((e) => ok(e, station));
        const pick = cleared.length && rnd() < 0.85 ? cleared[0] : left[0];
        left.splice(left.indexOf(pick), 1);
        entries.push({ employeeId: pick.id, station });
      }
      // keep at least one gap to fix in the demo, if someone on the roster isn't cleared
      const byId = (id: string) => employees.find((e) => e.id === id)!;
      if (!entries.some((en) => !ok(byId(en.employeeId), en.station))) {
        for (const station of ["handoff", "bar", "register"] as StationId[]) {
          const misfit = left.find((e) => !ok(e, station));
          const slot = entries.findIndex((en) => en.station === station);
          if (misfit && slot >= 0) {
            entries[slot] = { employeeId: misfit.id, station };
            break;
          }
        }
      }
      out[shiftKey(loc, shift.id)] = entries;
    });
  }
  return out;
}
