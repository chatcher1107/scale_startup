// A handful of recent practice sessions so a GM has real grades to review on day one.
import type { Employee, Session } from "./data";
import { CATEGORY_IDS, MOCK_GUEST_LINES, STANDARD_SCENARIOS, type CategoryId } from "./scenarios";

const BANK: Record<CategoryId, { good: [string, string]; weak: [string, string] }> = {
  allergy: {
    good: ["I'm not going to guess on an allergy, so let me check the ingredient sheet for you.", "We steam almond milk on the same wand, so there is cross-contact risk. Let me get my manager and we can sanitize the wand or offer a bottled option instead."],
    weak: ["I think the oat milk is probably fine.", "Yeah, it should be okay, we clean the wand sometimes."],
  },
  guests: {
    good: ["I'm so sorry about the wait. Let me check on your order right now.", "It'll be ready in about two minutes, and your next drink is on us."],
    weak: ["We're just really busy today.", "It'll be out when it's out."],
  },
  policy: {
    good: ["I understand, and I'm sorry it tasted off. Our policy is a remake or credit, so let me get my manager to approve that.", "I'm happy to remake it right now, and I appreciate you telling me."],
    weak: ["We can't refund that, sorry.", "That's just how it is."],
  },
  menu: {
    good: ["It's vanilla sweet cream and cinnamon over cold brew, and it has dairy.", "I can make it with fewer pumps of vanilla or unsweetened. I'd recommend trying half sweet."],
    weak: ["Um, I think it has vanilla?", "I'm not sure about the sugar, maybe ask someone else."],
  },
  recovery: {
    good: ["I'm sorry, that was our mistake. I'll remake it as an iced oat latte right away.", "Here you go. Does that look better? Is everything okay with it? The next one's on us."],
    weak: ["Oh, okay, I'll redo it.", "Here."],
  },
  rush: {
    good: ["Good morning, thanks for waiting! So that's a large drip and a bagel, let me confirm.", "Got it, I'll swap that instead, no problem. Thank you for your patience."],
    weak: ["Uh, what did you want again?", "Wait, I lost track. Can you repeat all that?"],
  },
};

export function buildSeedSessions(employees: Employee[], locationIds: string[], isReady: (e: Employee) => boolean, dateOf: (daysAgo: number) => string, version: number): Session[] {
  const sessions: Session[] = [];
  let n = 1;
  for (const loc of locationIds) {
    const staff = employees.filter((e) => e.locationId === loc && !isReady(e)).slice(0, 2);
    staff.forEach((e, i) => {
      const cat = [...CATEGORY_IDS].sort((a, b) => e.scores[a] - e.scores[b])[i % 2];
      const base = STANDARD_SCENARIOS[cat].scenario;
      const good = e.scores[cat] >= 55 && (n + i) % 3 !== 0;
      const lines = good ? BANK[cat].good : BANK[cat].weak;
      const guest = MOCK_GUEST_LINES[cat];
      const transcript: Session["transcript"] = [
        { role: "guest", text: base.openingLine },
        { role: "employee", text: lines[0] },
        { role: "guest", text: guest[0] },
        { role: "employee", text: lines[1] },
        { role: "guest", text: guest[1] },
      ];
      const results = base.criteria.map((c) => {
        const hitIndex = [1, 3].find((t) => c.keywords.some((k) => transcript[t].text.toLowerCase().includes(k)));
        return hitIndex !== undefined
          ? { text: c.text, passed: true, evidence: transcript[hitIndex].text, turn: hitIndex }
          : { text: c.text, passed: false, evidence: "Not demonstrated in this conversation." };
      });
      const passed = results.filter((r) => r.passed).length;
      sessions.push({
        id: `seed-s${n++}`,
        employeeId: e.id,
        moduleId: `std-${cat}`,
        date: dateOf(1 + ((n + i) % 4)),
        score: Math.round((passed / results.length) * 100),
        results,
        transcript,
        summary: passed === results.length ? "Excellent. Every observable behavior was demonstrated." : passed >= results.length / 2 ? "Good start. A couple of required behaviors were missing." : "Several required behaviors were missing. Practice the missed criteria and try again.",
        mock: false,
        handbookVersion: version,
      });
    });
  }
  return sessions;
}
