import { chat, clip, isLive, parseJson, withinLimit } from "@/lib/ai";
import { CATEGORIES, STANDARD_SCENARIOS, type CategoryId, type Module } from "@/lib/scenarios";

type Body = { feedbackId: string; text: string; categoryId: CategoryId; source: string; employeeName?: string; handbook?: string };

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  const { feedbackId, categoryId, source, employeeName } = body;
  const text = clip(body.text, 1200);
  const base = STANDARD_SCENARIOS[categoryId];
  const categoryName = CATEGORIES.find((c) => c.id === categoryId)?.name ?? categoryId;

  if (isLive() && withinLimit(req)) {
    try {
      const system = `You design short customer-service practice scenarios for a coffee company called Cameron Coffee Co. Base every menu and policy detail on the company's sheet below, and never invent items, prices or policies that contradict it.
${body.handbook ? clip(body.handbook, 6000) : "Menu highlights: espresso drinks, cold brew including the seasonal Cameron Crazie Cold Brew (vanilla sweet cream, cinnamon), oat/almond/whole milk, pastries. Policies: remake or partial credit, manager approval for refunds over $8, never guess on allergens, disclose shared steam wands, escalate to a manager."}

Turn the feedback or request into ONE realistic guest scenario that recreates the exact situation so the employee can practice it. Return JSON:
{"title":string,"persona":string,"situation":string,"openingLine":string,"guestNotes":string,"criteria":[{"text":string,"keywords":[string]}]}
- exactly 4 criteria, each an observable action the employee can do or not do
- keywords: 3-6 lowercase words/phrases likely in a passing reply
- openingLine is what the guest says first`;
      const out = parseJson<{ title: string; persona: string; situation: string; openingLine: string; guestNotes: string; criteria: { text: string; keywords: string[] }[] }>(
        await chat([{ role: "system", content: system }, { role: "user", content: `Source: ${source}\nCategory: ${categoryName}\nFeedback: "${text}"` }], { json: true, temperature: 0.6, maxTokens: 800 })
      );
      const mod: Module = {
        id: `gen-${feedbackId}`,
        title: out.title,
        categoryId,
        type: "tailored",
        minutes: 4,
        difficulty: "Intermediate",
        sourceReviewId: feedbackId,
        scenario: { persona: out.persona, situation: out.situation, openingLine: out.openingLine, guestNotes: out.guestNotes, criteria: out.criteria.slice(0, 4) },
      };
      return Response.json({ module: mod, mock: false });
    } catch (e) {
      console.error("scenario AI failed, falling back to mock:", e);
    }
  }

  const short = text.length > 60 ? text.slice(0, 57) + "…" : text;
  const mod: Module = {
    id: `gen-${feedbackId}`,
    title: source === "Owner" ? `Owner request: ${base.title}` : `From feedback: ${base.title}`,
    categoryId,
    type: "tailored",
    minutes: base.minutes,
    difficulty: base.difficulty,
    sourceReviewId: feedbackId,
    scenario: {
      ...base.scenario,
      situation: `Built from ${source}${employeeName ? ` about ${employeeName}` : ""}: "${short}" ${base.scenario.situation}`,
    },
  };
  return Response.json({ module: mod, mock: true });
}
